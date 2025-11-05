import { Routes } from '@angular/router';
import { NotebookComponent } from './components/notebook/notebook.component';
import { HomeComponent } from './components/home/home.component';
import { WorkflowEditorComponent } from './components/workflow-editor/workflow-editor.component';
import { ArchitectureDashboardComponent } from './components/architecture-dashboard/architecture-dashboard.component';

export const APP_ROUTES: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'notebook/:id', component: NotebookComponent },
  { path: 'workflow/:id', component: WorkflowEditorComponent },
  { path: 'architecture', component: ArchitectureDashboardComponent },
  { path: '**', redirectTo: '' }
];