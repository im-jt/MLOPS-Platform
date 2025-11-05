import { Routes } from '@angular/router';
import { NotebookComponent } from './components/notebook/notebook.component';
import { HomeComponent } from './components/home/home.component';
import { WorkflowEditorComponent } from './components/workflow-editor/workflow-editor.component';

export const APP_ROUTES: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'notebook/:id', component: NotebookComponent },
  { path: 'workflow/:id', component: WorkflowEditorComponent },
  { path: '**', redirectTo: '' }
];