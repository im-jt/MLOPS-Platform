import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NotebookStoreService } from '../../services/notebook-store.service';
import { NotebookIndexItem, MLOpsWorkflowIndexItem } from '../../models/notebook.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private notebookStore = inject(NotebookStoreService);

  notebooks = signal<NotebookIndexItem[]>([]);
  workflows = signal<MLOpsWorkflowIndexItem[]>([]);
  activeTab = signal<'notebooks' | 'workflows'>('notebooks');

  ngOnInit() {
    this.loadNotebooks();
    this.loadWorkflows();
  }

  loadNotebooks() {
    const notebookList = this.notebookStore.listNotebooks();
    notebookList.sort((a, b) => b.lastModified - a.lastModified);
    this.notebooks.set(notebookList);
  }

  loadWorkflows() {
    const workflowList = this.notebookStore.listWorkflows();
    workflowList.sort((a, b) => b.lastModified - a.lastModified);
    this.workflows.set(workflowList);
  }

  createNewNotebook() {
    const newNotebook = this.notebookStore.createNotebook();
    this.router.navigate(['/notebook', newNotebook.id]);
  }

  deleteNotebook(id: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this notebook? This action cannot be undone.')) {
      this.notebookStore.deleteNotebook(id);
      this.loadNotebooks();
    }
  }

  navigateToNotebook(id: string) {
    this.router.navigate(['/notebook', id]);
  }

  createNewWorkflow() {
    const newWorkflow = this.notebookStore.createWorkflow();
    this.router.navigate(['/workflow', newWorkflow.id]);
  }

  deleteWorkflow(id: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this MLOps workflow? This action cannot be undone.')) {
      this.notebookStore.deleteWorkflow(id);
      this.loadWorkflows();
    }
  }

  navigateToWorkflow(id: string) {
    this.router.navigate(['/workflow', id]);
  }
}