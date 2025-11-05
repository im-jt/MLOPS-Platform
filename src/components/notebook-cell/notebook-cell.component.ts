import { ChangeDetectionStrategy, Component, computed, input, output, effect, ElementRef, viewChild, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cell } from '../../models/notebook-cell.model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GeminiService } from '../../services/gemini.service';

declare var marked: { parse(md: string): string; };
declare var monaco: any;
declare var require: any;
declare var EasyMDE: any;

@Component({
  selector: 'app-notebook-cell',
  templateUrl: './notebook-cell.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class NotebookCellComponent implements OnDestroy {
  cell = input.required<Cell>();
  isSelected = input<boolean>(false);
  showLineNumbers = input<boolean>(false);

  delete = output<number>();
  toggleDetails = output<number>();
  updateContent = output<{id: number, content: string}>();
  toggleInput = output<number>();
  toggleOutput = output<number>();
  toggleCollapsed = output<number>();
  copyContent = output<number>();
  copyOutput = output<number>();
  mergeNext = output<number>();
  moveUp = output<number>();
  moveDown = output<number>();
  split = output<number>();
  run = output<number>();
  stop = output<number>();
  addCodeCell = output<{id: number, content: string}>();

  isMoreMenuOpen = signal(false);
  
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);
  private editorContainer = viewChild<ElementRef<HTMLElement>>('editorContainer');
  private outputEditorContainer = viewChild<ElementRef<HTMLElement>>('outputEditorContainer');
  
  private codeEditor: any;
  private markdownEditor: any;
  private outputCodeEditor: any;
  private completionProvider: any;

  renderedContent = computed<SafeHtml>(() => {
    const cell = this.cell();
    if (cell.type === 'note' && cell.content) {
      const rawHtml = marked.parse(cell.content);
      return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
    }
    return '';
  });

  promptResponseCode = computed<string>(() => {
    const cell = this.cell();
    if (cell.type !== 'prompt' || !cell.output) return '';
    const match = /```python\n([\s\S]*?)```/.exec(cell.output);
    return match?.[1]?.trim() ?? '';
  });

  promptResponseText = computed<string>(() => {
    const cell = this.cell();
    if (cell.type !== 'prompt' || !cell.output) return '';
    // Remove the python code block from the output to get the surrounding text.
    return cell.output.replace(/```python\n([\s\S]*?)```/, '').trim();
  });
  
  promptResponseTextHtml = computed<SafeHtml>(() => {
    const text = this.promptResponseText();
    if (!text) return '';
    const rawHtml = marked.parse(text);
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  });

  constructor() {
    // Effect to manage editor creation and destruction based on cell state.
    // This avoids re-creating the editor on every content change.
    effect(() => {
      const container = this.editorContainer()?.nativeElement;
      if (!container) return;
      
      const cell = this.cell();
      const needsCodeEditor = (cell.type === 'code' && !cell.isInputCollapsed) || cell.type === 'prompt';
      const needsMarkdownEditor = cell.type === 'note' && cell.isEditing;

      if (needsCodeEditor) {
        if (this.markdownEditor) this.destroyMarkdownEditor();
        if (!this.codeEditor) {
          this.loadMonaco().then(() => this.initializeMonacoEditor(container));
        } else {
            // Language might need to change if cell type morphed (e.g. prompt -> code)
            const language = cell.type === 'prompt' ? 'plaintext' : 'python';
            monaco.editor.setModelLanguage(this.codeEditor.getModel(), language);
        }
      } else if (needsMarkdownEditor) {
        if (this.codeEditor) this.destroyMonacoEditor();
        if (!this.markdownEditor) {
          this.initializeMarkdownEditor(container);
        }
      } else {
        // If no editor is needed, ensure both are destroyed.
        this.destroyMonacoEditor();
        this.destroyMarkdownEditor();
      }
    });

    // Effect to synchronize external content changes with the editor.
    // This runs when content is changed programmatically (e.g., beautify).
    effect(() => {
        const content = this.cell().content;
        if (this.codeEditor && this.codeEditor.getValue() !== content) {
            this.codeEditor.setValue(content);
        }
        if (this.markdownEditor && this.markdownEditor.value() !== content) {
            this.markdownEditor.value(content);
        }
    }, { allowSignalWrites: true });

    // Effect to close the "more" menu when the cell is deselected.
    effect(() => {
        if (!this.isSelected()) {
            this.isMoreMenuOpen.set(false);
        }
    });

    // Effect for prompt output code editor
    effect(() => {
        const container = this.outputEditorContainer()?.nativeElement;
        const cell = this.cell();
        const code = this.promptResponseCode();
        const needsOutputEditor = cell.type === 'prompt' && !cell.isOutputCollapsed && !!code;

        if (container && needsOutputEditor) {
            if (!this.outputCodeEditor) {
                this.loadMonaco().then(() => {
                    if(this.outputEditorContainer()?.nativeElement) {
                        this.initializeOutputMonacoEditor(this.outputEditorContainer()!.nativeElement);
                    }
                });
            } else {
                if (this.outputCodeEditor.getValue() !== code) {
                    this.outputCodeEditor.setValue(code);
                }
            }
        } else {
            this.destroyOutputMonacoEditor();
        }
    });

    // Effect to toggle line numbers on editors
    effect(() => {
      const lineNumbers = this.showLineNumbers() ? 'on' : 'off';
      if (this.codeEditor) {
        this.codeEditor.updateOptions({ lineNumbers });
      }
      if (this.outputCodeEditor) {
        this.outputCodeEditor.updateOptions({ lineNumbers });
      }
    });

    // Effect to handle selection styling for EasyMDE
    effect(() => {
        if (!this.markdownEditor) return;
        const wrapper = this.markdownEditor.codemirror.getWrapperElement();
        if (this.isSelected()) {
            wrapper.style.backgroundColor = 'transparent';
        } else {
            wrapper.style.backgroundColor = ''; // reset to default from stylesheet
        }
    });

    // Effect to focus the editor when a cell is selected.
    effect(() => {
        if (this.isSelected()) {
            // Use a timeout to ensure the editor has been created by its own effect, 
            // especially for note cells switching to edit mode.
            setTimeout(() => {
                if (this.codeEditor) {
                    this.codeEditor.focus();
                } else if (this.markdownEditor) {
                    this.markdownEditor.codemirror.focus();
                }
            }, 0);
        }
    });
  }

  ngOnDestroy() {
    this.destroyMonacoEditor();
    this.destroyMarkdownEditor();
    this.destroyOutputMonacoEditor();
  }

  private async provideCodeCompletions(model: any, position: any, token: any): Promise<{ suggestions: any[] }> {
    const code = model.getValue();

    if (code.trim().length < 10) {
      return { suggestions: [] };
    }

    const suggestions = await this.geminiService.getCodeSuggestions(code, token);

    if (!suggestions || suggestions.length === 0 || token.isCancellationRequested) {
      return { suggestions: [] };
    }

    const word = model.getWordUntilPosition(position);
    const range = new monaco.Range(
      position.lineNumber,
      word.startColumn,
      position.lineNumber,
      position.column
    );

    const monacoSuggestions = suggestions.map((s: string) => ({
      label: s.trim(),
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: s.trim(),
      range: range,
    }));

    return { suggestions: monacoSuggestions };
  }
  
  private defineTransparentMonacoTheme() {
    if (typeof monaco !== 'undefined') {
        monaco.editor.defineTheme('transparent-vs', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: { 
                'editor.background': '#00000000',
                'focusBorder': '#00000000' 
            }
        });
    }
  }

  private loadMonaco(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof monaco !== 'undefined') {
        this.defineTransparentMonacoTheme();
        resolve();
      } else {
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.49.0/min/vs' }});
        require(['vs/editor/editor.main'], () => {
          this.defineTransparentMonacoTheme();
          resolve();
        });
      }
    });
  }

  private initializeMonacoEditor(container: HTMLElement) {
    if (this.codeEditor) return; // Already initialized
    try {
      const cell = this.cell();
      const language = cell.type === 'prompt' ? 'plaintext' : 'python';

      const editorOptions: any = {
        value: cell.content,
        language: language,
        theme: 'transparent-vs',
        automaticLayout: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        wordWrap: 'on',
        wrappingIndent: 'indent',
        lineNumbers: this.showLineNumbers() ? 'on' : 'off',
        renderLineHighlight: 'none',
      };

      if (cell.type === 'prompt') {
        editorOptions.lineNumbers = 'off';
      }

      this.codeEditor = monaco.editor.create(container, editorOptions);

      this.codeEditor.getModel().onDidChangeContent(() => {
        const currentContent = this.codeEditor.getValue();
        if (this.cell().content !== currentContent) {
          this.updateContent.emit({ id: this.cell().id, content: currentContent });
        }
      });

      this.codeEditor.addAction({
        id: 'run-cell',
        label: 'Run Cell',
        keybindings: [
          monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        ],
        run: () => {
          this.run.emit(this.cell().id);
        }
      });

      // Autosuggestion with Gemini
      if (language === 'python' && cell.type === 'code' && monaco.languages) {
        if (this.completionProvider) {
          this.completionProvider.dispose();
        }
        this.completionProvider = monaco.languages.registerCompletionItemProvider('python', {
          provideCompletionItems: (model: any, position: any, context: any, token: any) => {
            return this.provideCodeCompletions(model, position, token);
          },
        });
      }

      const updateEditorHeight = () => {
        const contentHeight = this.codeEditor.getContentHeight();
        const newHeight = Math.min(1000, contentHeight);
        if (container.style.height !== `${newHeight}px`) {
            container.style.height = `${newHeight}px`;
            this.codeEditor.layout();
        }
      };

      this.codeEditor.onDidContentSizeChange(updateEditorHeight);
      updateEditorHeight();

    } catch (error) {
      console.error('Failed to initialize Monaco editor:', error);
    }
  }

  private initializeOutputMonacoEditor(container: HTMLElement) {
    if (this.outputCodeEditor) return;
    try {
        const code = this.promptResponseCode();
        if (!code) return;

        this.outputCodeEditor = monaco.editor.create(container, {
            value: code,
            language: 'python',
            theme: 'transparent-vs',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            readOnly: true,
            lineNumbers: this.showLineNumbers() ? 'on' : 'off',
            contextmenu: false,
            renderLineHighlight: 'none',
        });

        const updateEditorHeight = () => {
            const contentHeight = this.outputCodeEditor.getContentHeight();
            const newHeight = Math.max(20, Math.min(1000, contentHeight));
            if (container.style.height !== `${newHeight}px`) {
                container.style.height = `${newHeight}px`;
                this.outputCodeEditor.layout();
            }
        };
        this.outputCodeEditor.onDidContentSizeChange(updateEditorHeight);
        updateEditorHeight();

    } catch (error) {
        console.error('Failed to initialize Output Monaco editor:', error);
    }
  }

  private initializeMarkdownEditor(container: HTMLElement) {
    if (this.markdownEditor) return; // Already initialized
    try {
      if (typeof EasyMDE === 'undefined') {
        console.error('EasyMDE is not loaded');
        return;
      }
      container.innerHTML = '';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      
      setTimeout(() => {
        if (!container.isConnected) return; // Check if container is still in DOM
        try {
          this.markdownEditor = new EasyMDE({
            element: textarea,
            initialValue: this.cell().content || '',
            toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "|", "preview", "side-by-side"],
            minHeight: '100px',
            spellChecker: false,
            status: false,
          });

          this.markdownEditor.codemirror.addKeyMap({
            "Cmd-Enter": () => { this.run.emit(this.cell().id); },
            "Ctrl-Enter": () => { this.run.emit(this.cell().id); }
          });

          this.markdownEditor.codemirror.on('change', () => {
            if (this.markdownEditor) {
              const currentContent = this.markdownEditor.value();
              if (this.cell().content !== currentContent) {
                this.updateContent.emit({ id: this.cell().id, content: currentContent });
              }
            }
          });
        } catch (innerError) {
          console.error('Failed to initialize EasyMDE editor:', innerError);
        }
      }, 10);
    } catch (error) {
      console.error('Failed to initialize markdown editor:', error);
    }
  }

  private destroyMonacoEditor() {
    if (this.completionProvider) {
      this.completionProvider.dispose();
      this.completionProvider = null;
    }
    if (this.codeEditor) {
      this.codeEditor.dispose();
      this.codeEditor = null;
      const container = this.editorContainer()?.nativeElement;
      if (container) container.innerHTML = '';
    }
  }

  private destroyMarkdownEditor() {
    if (this.markdownEditor) {
      this.markdownEditor.toTextArea();
      this.markdownEditor = null;
      const container = this.editorContainer()?.nativeElement;
      if (container) container.innerHTML = '';
    }
  }

  private destroyOutputMonacoEditor() {
    if (this.outputCodeEditor) {
        this.outputCodeEditor.dispose();
        this.outputCodeEditor = null;
        const container = this.outputEditorContainer()?.nativeElement;
        if (container) container.innerHTML = '';
    }
  }

  onDelete() {
    this.delete.emit(this.cell().id);
  }

  onToggleDetails() {
    this.toggleDetails.emit(this.cell().id);
  }

  onToggleInput() {
    this.toggleInput.emit(this.cell().id);
  }

  onToggleOutput() {
    this.toggleOutput.emit(this.cell().id);
  }

  onToggleCollapsed() {
    this.toggleCollapsed.emit(this.cell().id);
  }
  
  onCopyContent() {
    this.copyContent.emit(this.cell().id);
  }

  onCopyOutput() {
    this.copyOutput.emit(this.cell().id);
  }

  onMergeNext() {
    this.mergeNext.emit(this.cell().id);
  }

  onMoveUp() {
    this.moveUp.emit(this.cell().id);
  }

  onMoveDown() {
    this.moveDown.emit(this.cell().id);
  }

  onSplit() {
    this.split.emit(this.cell().id);
    this.isMoreMenuOpen.set(false);
  }

  onRun() {
    this.run.emit(this.cell().id);
  }

  onStop() {
    this.stop.emit(this.cell().id);
  }

  onAddCodeCell() {
    const cell = this.cell();
    const codeToAdd = this.promptResponseCode();
    if (codeToAdd) {
      this.addCodeCell.emit({ id: cell.id, content: codeToAdd });
    }
  }
}