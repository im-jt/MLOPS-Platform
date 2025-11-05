import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { ModelService } from '../../services/model.service';
import { DeploymentService } from '../../services/deployment.service';
import { ExperimentService } from '../../services/experiment.service';
import { MonitoringService } from '../../services/monitoring.service';
import { MLProject } from '../../models/project.model';
import { Model } from '../../models/model.model';
import { Deployment } from '../../models/deployment.model';
import { Experiment } from '../../models/experiment.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private modelService = inject(ModelService);
  private deploymentService = inject(DeploymentService);
  private experimentService = inject(ExperimentService);
  private monitoringService = inject(MonitoringService);

  project = signal<MLProject | null>(null);
  models = signal<Model[]>([]);
  deployments = signal<Deployment[]>([]);
  experiments = signal<Experiment[]>([]);
  projectStats = signal({
    totalRuns: 0,
    successRate: 0,
    avgTrainingTime: 0,
    activeModels: 0,
    failedRuns: 0,
  });

  activeTab = signal<'overview' | 'models' | 'deployments' | 'experiments' | 'monitoring'>('overview');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const projectId = params.get('id');
      if (projectId) {
        this.loadProject(projectId);
      }
    });
  }

  loadProject(projectId: string) {
    const project = this.projectService.getProjectById(projectId);
    if (!project) {
      this.router.navigate(['/projects']);
      return;
    }

    this.project.set(project);
    this.models.set(this.modelService.getModelsByProject(projectId));
    this.deployments.set(this.deploymentService.getDeploymentsByProject(projectId));
    this.experiments.set(this.experimentService.getExperimentsByProject(projectId));
    this.projectStats.set(this.projectService.getProjectStats(projectId));
  }

  setActiveTab(tab: 'overview' | 'models' | 'deployments' | 'experiments' | 'monitoring') {
    this.activeTab.set(tab);
  }

  getTierColor(tier: string): string {
    switch (tier) {
      case 'tier-1':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'tier-2':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'tier-3':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'tier-4':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getMESColor(score?: number): string {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'deployed':
        return 'text-blue-600';
      case 'development':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}
