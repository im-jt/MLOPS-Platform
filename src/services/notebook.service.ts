import { Injectable, signal, inject, computed, DestroyRef } from '@angular/core';
import { Cell, CellType } from '../models/notebook-cell.model';
import { NotebookStoreService } from './notebook-store.service';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, skip } from 'rxjs/operators';
import { Notebook } from '../models/notebook.model';


export type NotebookMode = 'standard' | 'concise' | 'learning';

@Injectable({
  providedIn: 'root',
})
export class NotebookService {
  private notebookStore = inject(NotebookStoreService);
  private destroyRef = inject(DestroyRef);

  private activeNotebookId = signal<string | null>(null);
  activeNotebookName = signal<string>('Untitled Notebook');
  cells = signal<Cell[]>([]);
  selectedCellId = signal<number | null>(null);
  activeMode = signal<NotebookMode>('standard');
  showLineNumbers = signal<boolean>(false);
  private clipboard = signal<Cell | null>(null);

  constructor() {
    const notebookCells$ = toObservable(this.cells);

    notebookCells$.pipe(
      skip(1), // Don't save on initial load
      debounceTime(1000), // Wait for 1s of inactivity
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((cells) => {
      const id = this.activeNotebookId();
      if (id) {
        const notebookToSave: Notebook = {
          id: id,
          name: this.activeNotebookName(),
          cells: cells,
          lastModified: Date.now(),
        };
        this.notebookStore.updateNotebook(notebookToSave);
      }
    });
  }

  loadNotebook(id: string): boolean {
    const notebook = this.notebookStore.getNotebook(id);
    if (notebook) {
      this.activeNotebookId.set(id);
      this.activeNotebookName.set(notebook.name);
      this.cells.set(notebook.cells);
      this.selectedCellId.set(notebook.cells.length > 0 ? notebook.cells[0].id : null);
      return true;
    }
    return false;
  }
  
  updateNotebookName(name: string) {
    this.activeNotebookName.set(name);
    const id = this.activeNotebookId();
    if (id) {
      const notebookToSave: Notebook = {
        id: id,
        name: name,
        cells: this.cells(),
        lastModified: Date.now(),
      };
      this.notebookStore.updateNotebook(notebookToSave);
    }
  }

  private updateNoteEditingState(selectedId: number | null) {
    this.cells.update(cells =>
      cells.map(cell => {
        if (cell.type !== 'note') {
          return cell;
        }
        return { ...cell, isEditing: cell.id === selectedId };
      })
    );
  }

  selectCell(id: number) {
    if (this.selectedCellId() === id) return;
    this.updateNoteEditingState(id);
    this.selectedCellId.set(id);
  }

  selectNextCell() {
    const currentId = this.selectedCellId();
    if (currentId === null) {
        if (this.cells().length > 0) {
            this.selectCell(this.cells()[0].id);
        }
        return;
    };
    const currentIndex = this.cells().findIndex(c => c.id === currentId);
    if (currentIndex < this.cells().length - 1) {
      const nextId = this.cells()[currentIndex + 1].id;
      this.updateNoteEditingState(nextId);
      this.selectedCellId.set(nextId);
    }
  }

  selectPreviousCell() {
    const currentId = this.selectedCellId();
    if (currentId === null) return;
    const currentIndex = this.cells().findIndex(c => c.id === currentId);
    if (currentIndex > 0) {
      const prevId = this.cells()[currentIndex - 1].id;
      this.updateNoteEditingState(prevId);
      this.selectedCellId.set(prevId);
    }
  }

  updateCellContent(id: number, content: string) {
    this.cells.update(cells =>
      cells.map(cell => (cell.id === id ? { ...cell, content } : cell))
    );
  }

  addCell(cell: Omit<Cell, 'id'>) {
    const newCell: Cell = { ...cell, id: Date.now(), isExecuting: false };
    this.cells.update(cells => [...cells, newCell]);
    this.selectedCellId.set(newCell.id);
  }
  
  addCellAtIndex(index: number, cellType: CellType, initialContent: string | null = null) {
    let content = initialContent ?? '';
    if (initialContent === null) {
        if (cellType === 'note') {
            content = '# New Markdown\n\nStart writing here...';
        } else if (cellType === 'prompt') {
            content = 'Plot the first 10 results in a bar chart';
        }
    }

    const newCell: Cell = {
      id: Date.now(),
      type: cellType,
      content: content,
      isEditing: cellType === 'note',
      isExecuting: false,
    };
    this.cells.update(cells => {
      const newCells = [...cells];
      newCells.splice(index, 0, newCell);
      return newCells;
    });
    this.selectCell(newCell.id);
  }

  deleteCell(id: number) {
    const currentIndex = this.cells().findIndex(c => c.id === id);
    this.cells.update(cells => cells.filter(cell => cell.id !== id));
    
    // Select next or previous cell
    const cells = this.cells();
    if (cells.length > 0) {
      const newIndex = Math.min(currentIndex, cells.length - 1);
      this.selectCell(cells[newIndex].id);
    } else {
      this.selectedCellId.set(null);
    }
  }

  toggleDetails(id: number) {
    this.cells.update(cells => cells.map(cell => 
      cell.id === id ? { ...cell, isDetailsOpen: !cell.isDetailsOpen } : cell
    ));
  }

  toggleInputCollapsed(id: number) {
    this.cells.update(cells => cells.map(cell => 
      cell.id === id ? { ...cell, isInputCollapsed: !cell.isInputCollapsed } : cell
    ));
  }
  
  toggleOutputCollapsed(id: number) {
    this.cells.update(cells => cells.map(cell => 
      cell.id === id ? { ...cell, isOutputCollapsed: !cell.isOutputCollapsed } : cell
    ));
  }
  
  toggleSectionCollapsed(id: number) {
    this.cells.update(cells => cells.map(cell => 
      cell.id === id && cell.type === 'note' ? { ...cell, isCollapsed: !cell.isCollapsed } : cell
    ));
  }

  mergeWithNextCell(id: number) {
    this.cells.update(cells => {
      const index = cells.findIndex(c => c.id === id);
      if (index === -1 || index === cells.length - 1) {
        return cells;
      }
      const currentCell = cells[index];
      const nextCell = cells[index + 1];

      if (currentCell.type !== nextCell.type) return cells;

      const mergedCell = {
        ...currentCell,
        content: `${currentCell.content}\n${nextCell.content}`,
        output: nextCell.output ? `${currentCell.output || ''}\n${nextCell.output}` : currentCell.output,
      };

      const newCells = [...cells];
      newCells.splice(index, 2, mergedCell);
      return newCells;
    });
  }

  splitCell(id: number) {
    this.cells.update(cells => {
      const index = cells.findIndex(c => c.id === id);
      if (index === -1) return cells;

      const cell = cells[index];
      // A more robust solution would get cursor position from the editor component
      const contentLength = cell.content.length;
      const splitPoint = Math.floor(contentLength / 2);
      
      const firstHalf = cell.content.substring(0, splitPoint);
      const secondHalf = cell.content.substring(splitPoint);

      const newCell: Cell = {
        ...cell,
        id: Date.now(),
        content: secondHalf,
      };

      const updatedCells = [...cells];
      updatedCells[index] = { ...cell, content: firstHalf };
      updatedCells.splice(index + 1, 0, newCell);
      
      this.selectCell(newCell.id);

      return updatedCells;
    });
  }

  moveCellUp(id: number) {
    this.cells.update(cells => {
      const index = cells.findIndex(c => c.id === id);
      if (index > 0) {
        const newCells = [...cells];
        const temp = newCells[index];
        newCells[index] = newCells[index - 1];
        newCells[index - 1] = temp;
        return newCells;
      }
      return cells;
    });
  }

  moveCellDown(id: number) {
    this.cells.update(cells => {
      const index = cells.findIndex(c => c.id === id);
      if (index > -1 && index < cells.length - 1) {
        const newCells = [...cells];
        const temp = newCells[index];
        newCells[index] = newCells[index + 1];
        newCells[index + 1] = temp;
        return newCells;
      }
      return cells;
    });
  }

  updateCell(id: number, updates: Partial<Omit<Cell, 'id'>>) {
    this.cells.update(cells =>
      cells.map(cell => (cell.id === id ? { ...cell, ...updates } : cell))
    );
  }

  appendCellOutput(id: number, chunk: string) {
    this.cells.update(cells =>
      cells.map(cell => (cell.id === id ? { ...cell, output: (cell.output || '') + chunk } : cell))
    );
  }

  setMode(mode: NotebookMode) {
    this.activeMode.set(mode);
  }

  toggleLineNumbers() {
    this.showLineNumbers.update(show => !show);
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy text: ', err));
  }

  copyCellContent(id: number) {
    const cell = this.cells().find(c => c.id === id);
    if (cell) this.copyToClipboard(cell.content);
  }

  copyCellOutput(id: number) {
    const cell = this.cells().find(c => c.id === id);
    if (cell && cell.output) this.copyToClipboard(cell.output);
  }

  cutCell(id: number) {
    const cellToCut = this.cells().find(c => c.id === id);
    if (cellToCut) {
        this.clipboard.set({ ...cellToCut });
        this.deleteCell(id);
    }
  }

  copyCell(id: number) {
    const cellToCopy = this.cells().find(c => c.id === id);
    if (cellToCopy) {
        this.clipboard.set({ ...cellToCopy });
    }
  }

  pasteCell(index: number) {
    const cellToPaste = this.clipboard();
    if (!cellToPaste) return;

    const newCell: Cell = {
      ...cellToPaste,
      id: Date.now(),
      executionCount: undefined,
      output: undefined
    };

    this.cells.update(cells => {
      const newCells = [...cells];
      newCells.splice(index, 0, newCell);
      return newCells;
    });
    this.selectCell(newCell.id);
  }

  toggleAllInputs(isCollapsed: boolean) {
    this.cells.update(cells => cells.map(cell => ({ ...cell, isInputCollapsed: isCollapsed })));
  }

  toggleAllOutputs(isCollapsed: boolean) {
    this.cells.update(cells => cells.map(cell => ({ ...cell, isOutputCollapsed: isCollapsed })));
  }

  clearAllOutputs() {
    this.cells.update(cells => cells.map(cell => {
      if (cell.output) {
        return { ...cell, output: undefined, executionCount: undefined };
      }
      return cell;
    }));
  }

  getCellsAsPython(): string {
    return this.cells()
      .map(cell => {
        if (cell.type === 'code') {
          return `# In[${cell.executionCount || ' '}]\n${cell.content}`;
        } else if (cell.type === 'note') {
          return cell.content.split('\n').map(line => `# ${line}`).join('\n');
        }
        return '';
      })
      .filter(content => content.trim() !== '')
      .join('\n\n# %%\n\n');
  }

  getCellsAsMarkdown(): string {
    return this.cells()
      .map(cell => {
        if (cell.type === 'note') {
          return cell.content;
        } else if (cell.type === 'code') {
          let md = `\`\`\`python\n${cell.content}\n\`\`\``;
          if (cell.output) {
            md += `\n\n**Output:**\n\`\`\`\n${cell.output}\n\`\`\``;
          }
          return md;
        } else if (cell.type === 'prompt') {
          let md = `> ${cell.content.split('\n').join('\n> ')}`;
          if (cell.output) {
            md += `\n\n${cell.output}`;
          }
          return md;
        }
        return '';
      })
      .join('\n\n---\n\n');
  }
}