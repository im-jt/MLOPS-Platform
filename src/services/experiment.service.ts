import { Injectable, signal } from '@angular/core';
import { Experiment, ExperimentRun } from '../models/experiment.model';

@Injectable({
  providedIn: 'root',
})
export class ExperimentService {
  private experiments = signal<Experiment[]>([]);
  private experimentRuns = signal<ExperimentRun[]>([]);

  constructor() {
    this.loadExperiments();
  }

  private loadExperiments() {
    const stored = localStorage.getItem('ml_experiments');
    if (stored) {
      this.experiments.set(JSON.parse(stored));
    } else {
      // Initialize with sample experiments
      const sampleExperiments: Experiment[] = [
        {
          id: 'exp-1',
          projectId: 'proj-1',
          name: 'ETA Model Hyperparameter Tuning',
          description: 'Testing different learning rates and batch sizes',
          status: 'completed',
          parameters: [
            { name: 'learning_rate', value: 0.001, type: 'float' },
            { name: 'batch_size', value: 512, type: 'int' },
            { name: 'epochs', value: 50, type: 'int' },
          ],
          metrics: [
            { name: 'mae', value: 2.3, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
            { name: 'mse', value: 8.1, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
            { name: 'r2', value: 0.89, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 },
          ],
          artifacts: [],
          tags: ['hyperparameter-tuning', 'production'],
          startTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
          endTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
          duration: 24 * 60 * 60 * 1000,
          createdBy: 'john.doe@company.com',
        },
        {
          id: 'exp-2',
          projectId: 'proj-1',
          name: 'Feature Selection Experiment',
          description: 'Testing impact of different feature combinations',
          status: 'running',
          parameters: [
            { name: 'feature_set', value: 'full', type: 'string' },
            { name: 'learning_rate', value: 0.001, type: 'float' },
          ],
          metrics: [
            { name: 'mae', value: 2.5, timestamp: Date.now() - 1 * 60 * 60 * 1000 },
          ],
          artifacts: [],
          tags: ['feature-selection'],
          startTime: Date.now() - 6 * 60 * 60 * 1000,
          createdBy: 'john.doe@company.com',
        },
      ];
      this.experiments.set(sampleExperiments);
      this.saveExperiments();
    }
  }

  private saveExperiments() {
    localStorage.setItem('ml_experiments', JSON.stringify(this.experiments()));
  }

  getExperiments() {
    return this.experiments();
  }

  getExperimentsByProject(projectId: string): Experiment[] {
    return this.experiments().filter(e => e.projectId === projectId);
  }

  getExperimentById(id: string): Experiment | undefined {
    return this.experiments().find(e => e.id === id);
  }

  createExperiment(experiment: Omit<Experiment, 'id'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      id: `exp-${Date.now()}`,
    };
    this.experiments.update(experiments => [...experiments, newExperiment]);
    this.saveExperiments();
    return newExperiment;
  }

  updateExperiment(id: string, updates: Partial<Experiment>) {
    this.experiments.update(experiments =>
      experiments.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
    this.saveExperiments();
  }

  deleteExperiment(id: string) {
    this.experiments.update(experiments => experiments.filter(e => e.id !== id));
    this.saveExperiments();
  }

  addMetric(experimentId: string, name: string, value: number) {
    this.experiments.update(experiments =>
      experiments.map(e =>
        e.id === experimentId
          ? {
              ...e,
              metrics: [...e.metrics, { name, value, timestamp: Date.now() }],
            }
          : e
      )
    );
    this.saveExperiments();
  }

  getExperimentRuns(experimentId: string): ExperimentRun[] {
    return this.experimentRuns().filter(r => r.experimentId === experimentId);
  }

  compareExperiments(experimentIds: string[]): Experiment[] {
    return this.experiments().filter(e => experimentIds.includes(e.id));
  }
}
