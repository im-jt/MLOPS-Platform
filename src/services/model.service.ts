import { Injectable, signal } from '@angular/core';
import { Model, ModelRevision, ModelComparison, ModelFramework, ModelType } from '../models/model.model';

@Injectable({
  providedIn: 'root',
})
export class ModelService {
  private models = signal<Model[]>([]);

  constructor() {
    this.loadModels();
  }

  private loadModels() {
    const stored = localStorage.getItem('ml_models');
    if (stored) {
      this.models.set(JSON.parse(stored));
    } else {
      // Initialize with sample models
      const sampleModels: Model[] = [
        {
          id: 'model-1',
          projectId: 'proj-1',
          name: 'DeepETA v3',
          description: 'Deep learning model for ETA prediction with 100M+ parameters',
          type: 'regression',
          framework: 'pytorch',
          latestVersion: '3.2.1',
          versions: [
            {
              version: '3.2.1',
              modelId: 'model-1',
              projectId: 'proj-1',
              status: 'deployed',
              framework: 'pytorch',
              frameworkVersion: '2.0.1',
              metrics: {
                accuracy: 0.94,
                mae: 2.3,
                mse: 8.1,
                r2: 0.89,
              },
              lineage: {
                pipelineId: 'pipeline-1',
                pipelineRunId: 'run-123',
                trainingStartTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
                trainingEndTime: Date.now() - 4.5 * 24 * 60 * 60 * 1000,
                trainingDuration: 12 * 60 * 60 * 1000,
              },
              artifacts: [],
              hyperparameters: {
                learning_rate: 0.001,
                batch_size: 512,
                epochs: 50,
                hidden_layers: 8,
                dropout: 0.2,
              },
              createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
              createdBy: 'john.doe@company.com',
              tags: ['production', 'v3'],
            },
          ],
          isProduction: true,
          deploymentCount: 3,
          createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
          lastModified: Date.now() - 5 * 24 * 60 * 60 * 1000,
          owner: 'john.doe@company.com',
        },
        {
          id: 'model-2',
          projectId: 'proj-2',
          name: 'FraudDetector XGB',
          description: 'XGBoost model for real-time fraud detection',
          type: 'classification',
          framework: 'xgboost',
          latestVersion: '2.1.0',
          versions: [
            {
              version: '2.1.0',
              modelId: 'model-2',
              projectId: 'proj-2',
              status: 'deployed',
              framework: 'xgboost',
              frameworkVersion: '1.7.0',
              metrics: {
                accuracy: 0.96,
                precision: 0.94,
                recall: 0.91,
                f1Score: 0.925,
                auc: 0.98,
              },
              lineage: {
                pipelineId: 'pipeline-2',
                pipelineRunId: 'run-456',
                trainingStartTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
                trainingEndTime: Date.now() - 6.9 * 24 * 60 * 60 * 1000,
                trainingDuration: 2 * 60 * 60 * 1000,
              },
              artifacts: [],
              hyperparameters: {
                max_depth: 8,
                learning_rate: 0.1,
                n_estimators: 500,
                subsample: 0.8,
              },
              createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
              createdBy: 'jane.smith@company.com',
              tags: ['production', 'xgboost'],
            },
          ],
          isProduction: true,
          deploymentCount: 5,
          createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
          lastModified: Date.now() - 7 * 24 * 60 * 60 * 1000,
          owner: 'jane.smith@company.com',
        },
      ];
      this.models.set(sampleModels);
      this.saveModels();
    }
  }

  private saveModels() {
    localStorage.setItem('ml_models', JSON.stringify(this.models()));
  }

  getModels() {
    return this.models();
  }

  getModelsByProject(projectId: string): Model[] {
    return this.models().filter(m => m.projectId === projectId);
  }

  getModelById(id: string): Model | undefined {
    return this.models().find(m => m.id === id);
  }

  getModelRevision(modelId: string, version: string): ModelRevision | undefined {
    const model = this.getModelById(modelId);
    return model?.versions.find(v => v.version === version);
  }

  createModel(model: Omit<Model, 'id' | 'deploymentCount' | 'createdAt' | 'lastModified'>): Model {
    const newModel: Model = {
      ...model,
      id: `model-${Date.now()}`,
      deploymentCount: 0,
      createdAt: Date.now(),
      lastModified: Date.now(),
    };
    this.models.update(models => [...models, newModel]);
    this.saveModels();
    return newModel;
  }

  addModelRevision(modelId: string, revision: ModelRevision) {
    this.models.update(models =>
      models.map(m =>
        m.id === modelId
          ? {
              ...m,
              versions: [...m.versions, revision],
              latestVersion: revision.version,
              lastModified: Date.now(),
            }
          : m
      )
    );
    this.saveModels();
  }

  updateModel(id: string, updates: Partial<Model>) {
    this.models.update(models =>
      models.map(m => (m.id === id ? { ...m, ...updates, lastModified: Date.now() } : m))
    );
    this.saveModels();
  }

  deleteModel(id: string) {
    this.models.update(models => models.filter(m => m.id !== id));
    this.saveModels();
  }

  compareModels(modelRevisions: ModelRevision[]): ModelComparison {
    if (modelRevisions.length === 0) {
      return { models: [], metricNames: [] };
    }

    // Extract all unique metric names
    const metricNames = new Set<string>();
    modelRevisions.forEach(rev => {
      Object.keys(rev.metrics).forEach(key => metricNames.add(key));
    });

    // Determine winner based on primary metric (accuracy or f1Score)
    let winner: string | undefined;
    if (metricNames.has('accuracy')) {
      winner = modelRevisions.reduce((best, current) =>
        (current.metrics.accuracy ?? 0) > (best.metrics.accuracy ?? 0) ? current : best
      ).version;
    } else if (metricNames.has('f1Score')) {
      winner = modelRevisions.reduce((best, current) =>
        (current.metrics.f1Score ?? 0) > (best.metrics.f1Score ?? 0) ? current : best
      ).version;
    }

    return {
      models: modelRevisions,
      metricNames: Array.from(metricNames),
      winner,
    };
  }
}
