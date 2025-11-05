import { Injectable, signal, inject, computed, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, skip } from 'rxjs/operators';
import { MLOpsPipeline, MLOpsWorkflow } from '../models/notebook.model';
import { NotebookStoreService } from './notebook-store.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private store = inject(NotebookStoreService);
  private destroyRef = inject(DestroyRef);

  activeWorkflow = signal<MLOpsWorkflow | null>(null);
  activeWorkflowId = computed(() => this.activeWorkflow()?.id ?? null);
  activeWorkflowName = computed(() => this.activeWorkflow()?.name ?? 'Untitled Workflow');
  pipeline = computed(() => this.activeWorkflow()?.pipeline);
  
  constructor() {
    // Autosave
    const workflowState$ = toObservable(this.activeWorkflow);

    workflowState$.pipe(
      skip(1), // Don't save on initial load
      debounceTime(1000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((workflow) => {
      if (workflow) {
        const workflowToSave = { ...workflow, lastModified: Date.now() };
        this.store.updateWorkflow(workflowToSave);
      }
    });
  }

  loadWorkflow(id: string): boolean {
    const workflow = this.store.getWorkflow(id);
    if (workflow) {
      this.activeWorkflow.set(workflow);
      return true;
    }
    this.activeWorkflow.set(null);
    return false;
  }
  
  updateWorkflowName(name: string) {
    this.activeWorkflow.update(w => {
        if (!w) return null;
        return { ...w, name };
    });
  }
  
  updatePipeline(pipeline: MLOpsPipeline) {
    this.activeWorkflow.update(w => {
        if (!w) return null;
        return { ...w, pipeline };
    });
  }
}
