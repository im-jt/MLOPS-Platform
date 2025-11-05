import { ChangeDetectionStrategy, Component, inject, signal, ElementRef, effect, HostListener, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotebookService } from '../../services/notebook.service';
import { NotebookCellComponent } from '../notebook-cell/notebook-cell.component';
import { Cell, CellType } from '../../models/notebook-cell.model';
import { GeminiService, AiProvider, AppSettings } from '../../services/gemini.service';
import { JupyterService } from '../../services/jupyter.service';
import { PromptBarComponent } from '../prompt-bar/prompt-bar.component';
import { computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotebookStoreService } from '../../services/notebook-store.service';
import { MLOpsPanelComponent } from '../mlops-panel/mlops-panel.component';

@Component({
  selector: 'app-notebook',
  templateUrl: './notebook.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NotebookCellComponent, PromptBarComponent, MLOpsPanelComponent],
  host: {
    '(keydown)': 'onKeyDown($event)'
  }
})
export class NotebookComponent implements OnInit {
  notebookStore = inject(NotebookStoreService);
  notebookService = inject(NotebookService);
  geminiService = inject(GeminiService);
  private jupyterService = inject(JupyterService);
  private elementRef = inject(ElementRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  cells = this.notebookService.cells;
  selectedCellId = this.notebookService.selectedCellId;
  activeMode = this.notebookService.activeMode;
  footerHeight = signal(192);

  // Menu state
  activeMenu = signal<'file' | 'edit' | 'view' | 'run' | null>(null);
  isSaving = signal(false);

  // Settings Modal State
  isSettingsOpen = signal(false);
  settingsTab = signal<AiProvider | 'general'>('gemini');
  settingsFormState = signal<AppSettings | null>(null);
  settingsActiveProvider = signal<AiProvider>('gemini');

  // Resource monitoring state
  cpuUsage = signal(8.9);
  ramUsage = signal(209.1);
  maxRam = 1000.0;
  maxCpuCores = 1.0;

  private cancelledExecutions = new Set<number>();

  notebookName = this.notebookService.activeNotebookName;
  isEditingName = signal(false);
  nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');

  constructor() {
    effect(() => {
      const id = this.selectedCellId();
      if (id !== null) {
        setTimeout(() => {
          const el = this.elementRef.nativeElement.querySelector(`[data-cell-id='${id}']`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 0);
      }
    });

    // Simulate resource usage
    setInterval(() => {
      const newCpu = this.cpuUsage() + (Math.random() - 0.48) * 8;
      this.cpuUsage.set(Math.max(5, Math.min(95, newCpu)));

      const newRam = this.ramUsage() + (Math.random() - 0.5) * 25;
      this.ramUsage.set(Math.max(100, Math.min(900, newRam)));
    }, 2000);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const notebookId = params.get('id');
      if (notebookId) {
        const success = this.notebookService.loadNotebook(notebookId);
        if (!success) {
          // Notebook not found, redirect to home
          this.router.navigate(['/']);
        }
      } else {
        // No ID in URL, redirect to home
        this.router.navigate(['/']);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-container') && !target.closest('.settings-modal-content')) {
      this.closeMenus();
    }
  }
  
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isSettingsOpen()) {
      this.closeSettings();
    } else {
      const selected = this.cells().find(c => c.id === this.selectedCellId());
      if (selected?.type === 'note' && selected.isEditing) {
        event.preventDefault();
        this.selectCell(null);
      } else {
        this.closeMenus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const selectedId = this.selectedCellId();
    if (selectedId === null && event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

    const target = event.target as HTMLElement;
    const isRunCommand = ((event.metaKey || event.ctrlKey) && event.key === 'Enter') ||
                         (event.altKey && event.key === 'Enter') ||
                         (event.shiftKey && event.key === 'Enter');

    if (target.closest('input, textarea, .monaco-editor, .CodeMirror')) {
        if (!isRunCommand) {
            return;
        }
    }
    
    const selected = this.cells().find(c => c.id === selectedId);

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.notebookService.selectPreviousCell();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.notebookService.selectNextCell();
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      if (selectedId === null) return;
      event.preventDefault();
      this.executeCell(selectedId, false);
    } else if (event.shiftKey && event.key === 'Enter') {
      if (selectedId === null) return;
      event.preventDefault();
      this.executeCellAndSelectNext(selectedId);
    } else if (event.altKey && event.key === 'Enter') {
      if (selectedId === null) return;
      event.preventDefault();
      this.executeCell(selectedId, true);
    } else if (event.key.toLowerCase() === 'x') {
      if (selectedId === null) return;
      this.cutCell();
    } else if (event.key.toLowerCase() === 'c') {
       if (selectedId === null) return;
       this.copyCell();
    } else if (event.key.toLowerCase() === 'v') {
      if (selectedId === null) return;
      this.pasteCell('below');
    } else if (event.key.toLowerCase() === 'd' && event.metaKey === false && event.ctrlKey === false) {
      if (selectedId === null) return;
      this.deleteCell(selectedId);
    } else if (event.key.toLowerCase() === 'w' && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      if (selectedId === null) return;
      event.preventDefault();
      this.split(selectedId);
    } else if (event.key === 'i' && !event.metaKey && !event.ctrlKey) {
      if (selectedId === null) return;
      this.notebookService.toggleInputCollapsed(selectedId);
    } else if (event.key === 'o' && !event.metaKey && !event.ctrlKey) {
      if (selectedId === null) return;
      this.notebookService.toggleOutputCollapsed(selectedId);
    } else if (event.key === ',' && !event.metaKey && !event.ctrlKey) {
      if (selectedId === null) return;
      this.notebookService.copyCellContent(selectedId);
    } else if (event.key === '.' && !event.metaKey && !event.ctrlKey) {
      if (selectedId === null) return;
      this.notebookService.copyCellOutput(selectedId);
    } else if (selected?.type === 'note' && event.key === 'ArrowLeft') {
      this.notebookService.toggleSectionCollapsed(selectedId!);
    } else if (selected?.type === 'note' && event.key === 'ArrowRight') {
      this.notebookService.toggleSectionCollapsed(selectedId!);
    } else if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
      if (selectedId === null) return;
      event.preventDefault();
      this.notebookService.mergeWithNextCell(selectedId);
    }
  }

  selectCell(id: number | null) {
    if (id === null) {
      this.notebookService.cells.update(cells =>
        cells.map(cell => cell.type === 'note' ? { ...cell, isEditing: false } : cell)
      );
      this.notebookService.selectedCellId.set(null);
    } else {
      this.notebookService.selectCell(id);
    }
  }

  async executeCell(id: number, createNew: boolean): Promise<void> {
    const cell = this.cells().find(c => c.id === id);
    if (!cell) return;

    this.cancelledExecutions.delete(id);
    this.notebookService.updateCell(id, { isExecuting: true, output: cell.type === 'prompt' ? '' : cell.output });

    const onComplete = () => {
      const currentIndex = this.cells().findIndex(c => c.id === id);
      if (createNew) {
        this.notebookService.addCellAtIndex(currentIndex + 1, 'code');
      }
    };
    
    if (cell.type === 'code') {
      try {
        await this.jupyterService.executeCode(cell.content, id);
      } catch(e) {
        console.error('Jupyter execution failed', e);
      }
      onComplete();
    } else if (cell.type === 'prompt') {
        try {
            const generatedMarkdown = await this.geminiService.generateMarkdownForPromptCell(cell.content);
            if (this.cancelledExecutions.has(id)) {
                this.cancelledExecutions.delete(id);
                return; // Execution was cancelled, do nothing.
            }
            this.notebookService.updateCell(id, {
                output: generatedMarkdown,
                isExecuting: false,
            });
        } catch(e) {
            console.error('Failed to generate code from prompt', e);
            const errorMsg = e instanceof Error ? e.message : String(e);
            this.notebookService.updateCell(id, { output: `# Error: ${errorMsg}`, isExecuting: false });
        }
    } else if (cell.type === 'note') {
       this.notebookService.updateCell(id, { isEditing: false, isExecuting: false });
       onComplete();
    }
  }

  async executeCellAndSelectNext(id: number): Promise<void> {
    // Run the cell and wait for it to finish before selecting the next one.
    await this.executeCell(id, false);

    // After execution, find the index of the cell that was run.
    const currentIndex = this.cells().findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    // Do not proceed if the execution was cancelled by the user.
    if (this.cancelledExecutions.has(id)) {
      this.cancelledExecutions.delete(id); // Clean up for next run
      return;
    }
    
    if (currentIndex < this.cells().length - 1) {
      // If it's not the last cell, select the next one.
      this.notebookService.selectNextCell();
    } else {
      // If it is the last cell, create a new one below it and select it.
      const settings = this.geminiService.appSettings();
      const defaultCellType = settings.general?.defaultCellType || 'code';
      this.notebookService.addCellAtIndex(currentIndex + 1, defaultCellType);
    }
  }

  async stopExecution(id: number): Promise<void> {
    const cell = this.cells().find(c => c.id === id);
    if (!cell || !cell.isExecuting) return;

    if (cell.type === 'code') {
      await this.jupyterService.interruptKernel();
      // The service will handle state updates for pending requests.
    } else if (cell.type === 'prompt') {
      this.cancelledExecutions.add(id);
      this.notebookService.updateCell(id, { isExecuting: false, output: (cell.output || '') + '\n\n--- Generation Cancelled by User ---' });
    }
  }

  split(id: number) {
    this.notebookService.splitCell(id);
  }

  updateCellContent(event: {id: number, content: string}) {
    this.notebookService.updateCellContent(event.id, event.content);
  }

  addCellAtIndex(index: number, type: CellType) {
    this.notebookService.addCellAtIndex(index, type);
  }

  addCodeCellFromPrompt(event: { id: number; content: string }) {
    const { id, content } = event;
    const cellIndex = this.cells().findIndex(c => c.id === id);
    if (cellIndex > -1) {
        this.notebookService.addCellAtIndex(cellIndex + 1, 'code', content);
    }
  }

  deleteCell(id: number) {
    this.notebookService.deleteCell(id);
  }

  toggleDetails(id: number) { this.notebookService.toggleDetails(id); }
  toggleInput(id: number) { this.notebookService.toggleInputCollapsed(id); }
  toggleOutput(id: number) { this.notebookService.toggleOutputCollapsed(id); }
  toggleCollapsed(id: number) { this.notebookService.toggleSectionCollapsed(id); }
  copyContent(id: number) { this.notebookService.copyCellContent(id); }
  copyOutput(id: number) { this.notebookService.copyCellOutput(id); }
  mergeNext(id: number) { this.notebookService.mergeWithNextCell(id); }
  moveUp(id: number) { this.notebookService.moveCellUp(id); }
  moveDown(id: number) { this.notebookService.moveCellDown(id); }

  onResizeStart(event: MouseEvent) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = this.footerHeight();
    
    const mouseMoveHandler = (e: MouseEvent) => {
      const newHeight = startHeight - (e.clientY - startY);
      const constrainedHeight = Math.max(120, Math.min(newHeight, window.innerHeight * 0.8));
      this.footerHeight.set(constrainedHeight);
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  }

  // Notebook Name Editing
  editName() {
    this.isEditingName.set(true);
    setTimeout(() => {
        this.nameInput()?.nativeElement.focus();
        this.nameInput()?.nativeElement.select();
    }, 0);
  }

  saveName(event: Event) {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    if (newName && newName !== this.notebookName()) {
        this.notebookService.updateNotebookName(newName);
    }
    this.isEditingName.set(false);
  }

  cancelEditName() {
    this.isEditingName.set(false);
  }

  // Settings Modal Methods
  openSettings() {
    // Deep copy settings to form state to avoid live updates
    const currentSettings = this.geminiService.appSettings();
    this.settingsFormState.set(JSON.parse(JSON.stringify(currentSettings)));
    this.settingsTab.set('general');
    this.settingsActiveProvider.set(this.geminiService.activeProvider());
    this.isSettingsOpen.set(true);
  }

  closeSettings() {
    this.isSettingsOpen.set(false);
    this.settingsFormState.set(null);
  }

  saveSettings() {
    this.geminiService.setProvider(this.settingsActiveProvider());
    const newSettings = this.settingsFormState();
    if (newSettings) {
      this.geminiService.saveSettings(newSettings);
    }
    this.closeSettings();
  }
  
  updateSetting(category: keyof AppSettings, key: string, value: string | CellType) {
    this.settingsFormState.update(s => {
      if (!s) return s;
      const newProviderSettings = { ...s[category], [key]: value };
      return { ...s, [category]: newProviderSettings };
    });
  }

  // Menu Methods
  toggleMenu(menu: 'file' | 'edit' | 'view' | 'run') {
    this.activeMenu.set(this.activeMenu() === menu ? null : menu);
  }

  closeMenus() {
    this.activeMenu.set(null);
  }

  // File Menu Actions
  saveNotebook() {
    this.isSaving.set(true);
    // This is a mock save as autosave is now implemented.
    // The visual feedback is still useful for user assurance.
    // notebookStore.updateNotebook is now called by notebookService, so we just give feedback.
    setTimeout(() => this.isSaving.set(false), 1500);
    this.closeMenus();
  }

  printNotebook() {
    window.print();
    this.closeMenus();
  }
  
  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  downloadAsPython() {
    const content = this.notebookService.getCellsAsPython();
    this.downloadFile(content, 'notebook.py', 'text/x-python;charset=utf-8;');
    this.closeMenus();
  }
  
  downloadAsMarkdown() {
    const content = this.notebookService.getCellsAsMarkdown();
    this.downloadFile(content, 'notebook.md', 'text/markdown;charset=utf-8;');
    this.closeMenus();
  }

  // Edit Menu Actions
  cutCell() { this.selectedCellId() && this.notebookService.cutCell(this.selectedCellId()!); this.closeMenus(); }
  copyCell() { this.selectedCellId() && this.notebookService.copyCell(this.selectedCellId()!); this.closeMenus(); }
  pasteCell(where: 'above' | 'below') {
    const selectedId = this.selectedCellId();
    if (selectedId === null) return;
    const currentIndex = this.cells().findIndex(c => c.id === selectedId);
    const pasteIndex = where === 'above' ? currentIndex : currentIndex + 1;
    this.notebookService.pasteCell(pasteIndex);
    this.closeMenus();
  }
  deleteSelectedCell() { this.selectedCellId() && this.deleteCell(this.selectedCellId()!); this.closeMenus(); }
  splitSelectedCell() { this.selectedCellId() && this.split(this.selectedCellId()!); this.closeMenus(); }
  mergeSelectedCellBelow() { this.selectedCellId() && this.mergeNext(this.selectedCellId()!); this.closeMenus(); }
  moveSelectedCellUp() { this.selectedCellId() && this.moveUp(this.selectedCellId()!); this.closeMenus(); }
  moveSelectedCellDown() { this.selectedCellId() && this.moveDown(this.selectedCellId()!); this.closeMenus(); }

  // View Menu Actions
  toggleLineNumbers() { this.notebookService.toggleLineNumbers(); this.closeMenus(); }
  collapseAllInputs() { this.notebookService.toggleAllInputs(true); this.closeMenus(); }
  expandAllInputs() { this.notebookService.toggleAllInputs(false); this.closeMenus(); }
  collapseAllOutputs() { this.notebookService.toggleAllOutputs(true); this.closeMenus(); }
  expandAllOutputs() { this.notebookService.toggleAllOutputs(false); this.closeMenus(); }

  // Run Menu Actions
  async runSelected() { this.selectedCellId() && await this.executeCell(this.selectedCellId()!, false); this.closeMenus(); }
  async runSelectedAndInsert() { this.selectedCellId() && await this.executeCell(this.selectedCellId()!, true); this.closeMenus(); }
  
  async runAllCells() {
    this.closeMenus();
    const cellsToRun = this.cells().filter(c => c.type === 'code' || c.type === 'prompt');
    for (const cell of cellsToRun) {
      this.notebookService.selectCell(cell.id);
      await this.executeCell(cell.id, false);
    }
  }

  async runAllAbove() {
    this.closeMenus();
    const selectedId = this.selectedCellId();
    if (selectedId === null) return;
    const currentIndex = this.cells().findIndex(c => c.id === selectedId);
    const cellsToRun = this.cells().slice(0, currentIndex).filter(c => c.type === 'code' || c.type === 'prompt');
    for (const cell of cellsToRun) {
      this.notebookService.selectCell(cell.id);
      await this.executeCell(cell.id, false);
    }
  }
  
  async runAllBelow() {
    this.closeMenus();
    const selectedId = this.selectedCellId();
    if (selectedId === null) return;
    const currentIndex = this.cells().findIndex(c => c.id === selectedId);
    const cellsToRun = this.cells().slice(currentIndex).filter(c => c.type === 'code' || c.type === 'prompt');
    for (const cell of cellsToRun) {
      this.notebookService.selectCell(cell.id);
      await this.executeCell(cell.id, false);
    }
  }
  
  clearAllOutputs() { this.notebookService.clearAllOutputs(); this.closeMenus(); }
}