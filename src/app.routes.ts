import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotebookComponent } from './components/notebook/notebook.component';
import { WorkflowEditorComponent } from './components/workflow-editor/workflow-editor.component';
import { ProjectDashboardComponent } from './components/project-dashboard/project-dashboard.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { GenAIPlaygroundComponent } from './components/genai-playground/genai-playground.component';
import { LoginComponent } from './components/login/login.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuthGuard } from './guards/auth.guard';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: '', 
    component: HomeComponent, 
    pathMatch: 'full',
    canActivate: [AuthGuard]
  },
  { 
    path: 'projects', 
    component: ProjectDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'project/:id', 
    component: ProjectDetailComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'notebooks', 
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'notebook/:id', 
    component: NotebookComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'workflows', 
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'workflow/:id', 
    component: WorkflowEditorComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'genai', 
    component: GenAIPlaygroundComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'users', 
    component: UserManagementComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  { path: '**', redirectTo: '' }
];