/**
 * Experiment Tracking for model development and hyperparameter tuning
 */

export interface ExperimentParameter {
  name: string;
  value: any;
  type: 'int' | 'float' | 'string' | 'bool' | 'list';
}

export interface ExperimentMetric {
  name: string;
  value: number;
  step?: number;
  timestamp: number;
}

export interface ExperimentArtifact {
  name: string;
  path: string;
  type: 'model' | 'plot' | 'data' | 'log' | 'other';
  size: number;
}

export interface Experiment {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  pipelineRunId?: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  parameters: ExperimentParameter[];
  metrics: ExperimentMetric[];
  artifacts: ExperimentArtifact[];
  tags: string[];
  startTime: number;
  endTime?: number;
  duration?: number;
  createdBy: string;
  notes?: string;
}

export interface ExperimentRun {
  id: string;
  experimentId: string;
  runNumber: number;
  status: 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  startTime: number;
  endTime?: number;
}

export interface HyperparameterSearchConfig {
  method: 'grid' | 'random' | 'bayesian' | 'hyperband';
  parameterSpace: Record<string, any>;
  metric: string;
  mode: 'min' | 'max';
  maxTrials: number;
  maxConcurrent: number;
}
