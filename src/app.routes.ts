import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotebookComponent } from './components/notebook/notebook.component';
import { WorkflowEditorComponent } from './components/workflow-editor/workflow-editor.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { GenAIPlaygroundComponent } from './components/genai-playground/genai-playground.component';
import { LoginComponent } from './components/login/login.component';
import { UnauthorizedComponent } from './components/unauthorized/unauthorized.component';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },
  { 
    path: '', 
    component: HomeComponent, 
    pathMatch: 'full',
    canActivate: [authGuard]
  },
  { 
    path: 'projects', 
    component: ProjectDashboardComponent,
    canActivate: [authGuard, permissionGuard('project:read')]
  },
  { 
    path: 'project/:id', 
    component: ProjectDetailComponent,
    canActivate: [authGuard, permissionGuard('project:read')]
  },
  { 
    path: 'notebooks', 
    component: HomeComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'notebook/:id', 
    component: NotebookComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'workflows', 
    component: HomeComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'workflow/:id', 
    component: WorkflowEditorComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'genai', 
    component: GenAIPlaygroundComponent,
    canActivate: [authGuard, permissionGuard('genai:use')]
  },
  { path: '**', redirectTo: '' }
];