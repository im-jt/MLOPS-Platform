/**
 * ML Pipeline definitions for training, evaluation, and batch inference
 * Following Kubernetes Operator pattern
 */

export type PipelineStepType = 
  | 'feature_extraction'
  | 'data_validation'
  | 'transformation'
  | 'training'
  | 'evaluation'
  | 'model_validation'
  | 'batch_inference'
  | 'feature_monitoring';

export type PipelineStepStatus = 
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'checkpointed';

export interface PipelineStep {
  id: string;
  name: string;
  type: PipelineStepType;
  config: Record<string, any>;
  dependencies: string[]; // IDs of steps that must complete first
  framework?: 'spark' | 'ray' | 'python';
  resources?: ResourceRequirements;
  checkpointEnabled?: boolean;
}

export interface ResourceRequirements {
  cpu?: string;
  memory?: string;
  gpu?: string;
  gpuType?: 'T4' | 'V100' | 'A100' | 'H100';
}

export interface Pipeline {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'training' | 'evaluation' | 'batch_inference' | 'feature_engineering';
  steps: PipelineStep[];
  schedule?: string; // Cron expression for scheduled runs
  createdAt: number;
  lastModified: number;
  createdBy: string;
}

export interface PipelineRunStep {
  stepId: string;
  status: PipelineStepStatus;
  startTime?: number;
  endTime?: number;
  duration?: number;
  logs?: string;
  artifacts?: string[];
  error?: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  steps: PipelineRunStep[];
  startTime: number;
  endTime?: number;
  duration?: number;
  triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'retrain';
  artifacts: string[];
  modelId?: string; // If this run produced a model
  metrics?: Record<string, number>;
}

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'classic_ml' | 'deep_learning' | 'nlp' | 'computer_vision' | 'time_series';
  steps: PipelineStep[];
  framework: 'tensorflow' | 'pytorch' | 'xgboost' | 'sklearn';
}
