import { Injectable, signal } from '@angular/core';
import { MLProject, ProjectTier, ProjectStats } from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private projects = signal<MLProject[]>([]);
  private activeProject = signal<MLProject | null>(null);

  constructor() {
    this.loadProjects();
  }

  private loadProjects() {
    const stored = localStorage.getItem('ml_projects');
    if (stored) {
      this.projects.set(JSON.parse(stored));
    } else {
      // Initialize with sample projects
      const sampleProjects: MLProject[] = [
        {
          id: 'proj-1',
          name: 'ETA Prediction Model',
          tier: 'tier-1',
          metadata: {
            owner: 'john.doe@company.com',
            team: 'Maps Platform',
            tags: ['eta', 'production', 'critical'],
            businessUnit: 'Mobility',
            description: 'Deep learning model for trip ETA prediction',
            createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
            lastModified: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          status: 'active',
          modelCount: 8,
          pipelineCount: 12,
          lastDeployment: Date.now() - 1 * 24 * 60 * 60 * 1000,
          modelExcellenceScore: 92,
        },
        {
          id: 'proj-2',
          name: 'Fraud Detection',
          tier: 'tier-1',
          metadata: {
            owner: 'jane.smith@company.com',
            team: 'Trust & Safety',
            tags: ['fraud', 'security', 'real-time'],
            businessUnit: 'Platform',
            description: 'Real-time fraud detection using XGBoost',
            createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
            lastModified: Date.now() - 5 * 24 * 60 * 60 * 1000,
          },
          status: 'active',
          modelCount: 5,
          pipelineCount: 8,
          lastDeployment: Date.now() - 3 * 24 * 60 * 60 * 1000,
          modelExcellenceScore: 88,
        },
        {
          id: 'proj-3',
          name: 'Restaurant Ranking',
          tier: 'tier-2',
          metadata: {
            owner: 'bob.wilson@company.com',
            team: 'Eats ML',
            tags: ['ranking', 'recommendation'],
            businessUnit: 'Eats',
            description: 'Restaurant ranking and recommendation system',
            createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
            lastModified: Date.now() - 7 * 24 * 60 * 60 * 1000,
          },
          status: 'active',
          modelCount: 6,
          pipelineCount: 10,
          lastDeployment: Date.now() - 5 * 24 * 60 * 60 * 1000,
          modelExcellenceScore: 85,
        },
        {
          id: 'proj-4',
          name: 'Customer Churn Prediction',
          tier: 'tier-3',
          metadata: {
            owner: 'alice.chen@company.com',
            team: 'Growth',
            tags: ['churn', 'experimentation'],
            businessUnit: 'Growth',
            description: 'Predicting customer churn for retention campaigns',
            createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
            lastModified: Date.now() - 10 * 24 * 60 * 60 * 1000,
          },
          status: 'active',
          modelCount: 3,
          pipelineCount: 5,
          lastDeployment: Date.now() - 12 * 24 * 60 * 60 * 1000,
          modelExcellenceScore: 78,
        },
        {
          id: 'proj-5',
          name: 'Sentiment Analysis Experiment',
          tier: 'tier-4',
          metadata: {
            owner: 'mike.lee@company.com',
            team: 'Research',
            tags: ['nlp', 'experimental'],
            businessUnit: 'Research',
            description: 'Experimental sentiment analysis for customer feedback',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            lastModified: Date.now() - 3 * 24 * 60 * 60 * 1000,
          },
          status: 'development',
          modelCount: 2,
          pipelineCount: 3,
          modelExcellenceScore: 65,
        },
      ];
      this.projects.set(sampleProjects);
      this.saveProjects();
    }
  }

  private saveProjects() {
    localStorage.setItem('ml_projects', JSON.stringify(this.projects()));
  }

  getProjects() {
    return this.projects();
  }

  getProjectById(id: string): MLProject | undefined {
    return this.projects().find(p => p.id === id);
  }

  getProjectsByTier(tier: ProjectTier): MLProject[] {
    return this.projects().filter(p => p.tier === tier);
  }

  createProject(project: Omit<MLProject, 'id' | 'modelCount' | 'pipelineCount'>): MLProject {
    const newProject: MLProject = {
      ...project,
      id: `proj-${Date.now()}`,
      modelCount: 0,
      pipelineCount: 0,
    };
    this.projects.update(projects => [...projects, newProject]);
    this.saveProjects();
    return newProject;
  }

  updateProject(id: string, updates: Partial<MLProject>) {
    this.projects.update(projects =>
      projects.map(p => (p.id === id ? { ...p, ...updates, metadata: { ...p.metadata, lastModified: Date.now() } } : p))
    );
    this.saveProjects();
  }

  deleteProject(id: string) {
    this.projects.update(projects => projects.filter(p => p.id !== id));
    this.saveProjects();
  }

  getProjectStats(id: string): ProjectStats {
    // In a real implementation, this would query actual run data
    return {
      totalRuns: Math.floor(Math.random() * 500) + 100,
      successRate: Math.random() * 20 + 75, // 75-95%
      avgTrainingTime: Math.random() * 60 + 15, // 15-75 minutes
      activeModels: Math.floor(Math.random() * 5) + 1,
      failedRuns: Math.floor(Math.random() * 20) + 5,
    };
  }

  setActiveProject(project: MLProject | null) {
    this.activeProject.set(project);
  }

  getActiveProject() {
    return this.activeProject();
  }
}
