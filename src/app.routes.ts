import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotebookComponent } from './components/notebook/notebook.component';
import { WorkflowEditorComponent } from './components/workflow-editor/workflow-editor.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { GenAIPlaygroundComponent } from './components/genai-playground/genai-playground.component';

export const APP_ROUTES: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'projects', component: ProjectDashboardComponent },
  { path: 'project/:id', component: ProjectDetailComponent },
  { path: 'notebooks', component: HomeComponent },
  { path: 'notebook/:id', component: NotebookComponent },
  { path: 'workflows', component: HomeComponent },
  { path: 'workflow/:id', component: WorkflowEditorComponent },
  { path: 'genai', component: GenAIPlaygroundComponent },
  { path: '**', redirectTo: '' }
];