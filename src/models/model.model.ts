/**
 * Model Registry - tracks all ML models, versions, and lineage
 */

export type ModelFramework = 
  | 'tensorflow'
  | 'pytorch'
  | 'xgboost'
  | 'sklearn'
  | 'lightgbm'
  | 'catboost'
  | 'custom';

export type ModelType = 
  | 'classification'
  | 'regression'
  | 'ranking'
  | 'forecasting'
  | 'clustering'
  | 'anomaly_detection'
  | 'recommendation'
  | 'llm'
  | 'embedding';

export interface ModelMetrics {
  // Training metrics
  trainingAccuracy?: number;
  trainingLoss?: number;
  
  // Validation metrics
  validationAccuracy?: number;
  validationLoss?: number;
  
  // Test metrics
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  auc?: number;
  mse?: number;
  mae?: number;
  r2?: number;
  
  // Custom metrics
  customMetrics?: Record<string, number>;
}

export interface ModelLineage {
  datasetId?: string;
  datasetVersion?: string;
  pipelineId: string;
  pipelineRunId: string;
  parentModelId?: string; // For incremental training
  trainingStartTime: number;
  trainingEndTime: number;
  trainingDuration: number;
}

export interface ModelArtifact {
  id: string;
  type: 'model_file' | 'checkpoint' | 'metadata' | 'training_logs' | 'evaluation_report';
  path: string;
  size: number;
  createdAt: number;
}

export interface ModelRevision {
  version: string;
  modelId: string;
  projectId: string;
  status: 'training' | 'ready' | 'deployed' | 'archived' | 'failed';
  framework: ModelFramework;
  frameworkVersion: string;
  metrics: ModelMetrics;
  lineage: ModelLineage;
  artifacts: ModelArtifact[];
  hyperparameters: Record<string, any>;
  featureImportance?: Record<string, number>;
  createdAt: number;
  createdBy: string;
  tags: string[];
  notes?: string;
}

export interface Model {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: ModelType;
  framework: ModelFramework;
  latestVersion: string;
  versions: ModelRevision[];
  isProduction: boolean;
  deploymentCount: number;
  createdAt: number;
  lastModified: number;
  owner: string;
}

export interface ModelComparison {
  models: ModelRevision[];
  metricNames: string[];
  winner?: string; // Model version with best metrics
}
