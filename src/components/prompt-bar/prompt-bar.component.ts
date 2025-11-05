import { ChangeDetectionStrategy, Component, signal, viewChild, ElementRef, effect, OnDestroy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotebookService, NotebookMode } from '../../services/notebook.service';
import { GeminiService } from '../../services/gemini.service';
import { Cell } from '../../models/notebook-cell.model';

declare var monaco: any;
declare var require: any;
declare var EasyMDE: any;

@Component({
  selector: 'app-prompt-bar',
  imports: [CommonModule],
  templateUrl: './prompt-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptBarComponent implements OnDestroy {
  notebookService = inject(NotebookService);
  private geminiService = inject(GeminiService);
  
  activeTab = signal<'code' | 'note' | 'prompt'>('code');
  isProcessing = signal(false);
  showLineNumbers = signal(false);
  
  resizeStart = output<MouseEvent>();
  
  private editorContainer = viewChild<ElementRef<HTMLElement>>('editorContainer');
  private codeEditor: any;
  private markdownEditor: any;

  constructor() {
    effect(() => {
      this.showLineNumbers(); // Depend on signal
      const container = this.editorContainer()?.nativeElement;
      if (!container) return;
      
      const tab = this.activeTab();

      if (tab === 'note') {
        if (this.codeEditor) this.destroyCodeEditor();
        if (!this.markdownEditor) {
          this.initializeMarkdownEditor(container);
        }
      } else { // code, prompt tabs
        if (this.markdownEditor) this.destroyMarkdownEditor();
        if (!this.codeEditor) {
          this.loadMonaco().then(() => {
            if (this.editorContainer()?.nativeElement === container) {
              this.initializeCodeEditor(container);
              this.updateCodeEditorOptions();
            }
          });
        } else {
          this.updateCodeEditorOptions();
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroyCodeEditor();
    this.destroyMarkdownEditor();
  }

  private destroyCodeEditor() {
    if (this.codeEditor) {
      this.codeEditor.dispose();
      this.codeEditor = null;
      this.clearContainer();
    }
  }
  
  private destroyMarkdownEditor() {
    if (this.markdownEditor) {
      this.markdownEditor.toTextArea();
      this.markdownEditor = null;
      this.clearContainer();
    }
  }
  
  private clearContainer() {
    const container = this.editorContainer()?.nativeElement;
    if (container) {
        container.innerHTML = '';
    }
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

  private initializeCodeEditor(container: HTMLElement) {
    if (this.codeEditor) return;
    this.codeEditor = monaco.editor.create(container, {
      value: '',
      language: 'python',
      theme: 'transparent-vs',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      renderLineHighlight: 'none'
    });
  }

  private initializeMarkdownEditor(container: HTMLElement) {
    if (this.markdownEditor) return;
    try {
      if (typeof EasyMDE === 'undefined') { return; }
      
      container.innerHTML = '';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);

      setTimeout(() => {
        if (!container.isConnected) return;
        this.markdownEditor = new EasyMDE({
          element: textarea,
          initialValue: '',
          toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link"],
          minHeight: '80px',
          spellChecker: false,
          status: false,
          forceSync: true,
        });
      }, 10);
    } catch (error) {
      console.error('Failed to initialize EasyMDE in prompt bar:', error);
    }
  }
  
  private updateCodeEditorOptions() {
    if (!this.codeEditor) return;
    const tab = this.activeTab();
    if (tab === 'prompt') {
      monaco.editor.setModelLanguage(this.codeEditor.getModel(), 'plaintext');
      this.codeEditor.updateOptions({ lineNumbers: 'off' });
    } else { // for 'code' tab
      monaco.editor.setModelLanguage(this.codeEditor.getModel(), 'python');
      this.codeEditor.updateOptions({ lineNumbers: this.showLineNumbers() ? 'on' : 'off' });
    }
  }

  setActiveTab(tab: 'code' | 'note' | 'prompt') {
    this.activeTab.set(tab);
  }

  onModeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.notebookService.setMode(target.value as NotebookMode);
  }

  toggleLineNumbers() {
    this.showLineNumbers.update(v => !v);
  }

  async submit() {
    if (this.isProcessing()) return;
    
    const tab = this.activeTab();
    let content = '';

    if (tab === 'note' && this.markdownEditor) {
      content = this.markdownEditor.value();
    } else if (this.codeEditor) {
      content = this.codeEditor.getValue();
    }

    if (!content.trim()) return;

    this.isProcessing.set(true);

    try {
        if (tab === 'code') {
          this.notebookService.addCell({ type: 'code', content });
        } else if (tab === 'note') {
          this.notebookService.addCell({ type: 'note', content, isEditing: false });
        } else if (tab === 'prompt') {
            const newCell: Omit<Cell, 'id'> = { type: 'prompt', content };
            this.notebookService.addCell(newCell);
        }
        
        // Clear editor after submitting
        if (this.markdownEditor) this.markdownEditor.value('');
        if (this.codeEditor) this.codeEditor.setValue('');
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      this.isProcessing.set(false);
    }
  }
}