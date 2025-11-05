import { Cell } from './notebook-cell.model';

export interface MLOpsStage {
  linkedCellId?: number;
  [key: string]: any;
}

export interface FeatureStoreConfig extends MLOpsStage {
  featureGroupName: string;
  mode: 'batch' | 'streaming' | 'fixed';
  version?: string;
}

export interface TransformationConfig extends MLOpsStage {
  scriptPath: string;
}

export interface ModelingConfig extends MLOpsStage {
  modelName: string;
  enableCheckpointing: boolean;
  enableVersioning: boolean;
}

export interface EvaluationConfig extends MLOpsStage {
  evaluationFeatureGroup: string;
}

export interface PublishConfig extends MLOpsStage {
  environment: 'staging' | 'production';
  deployedVersion?: string;
  lastDeployed?: number;
}

export interface MLOpsPipeline {
  featureStore: FeatureStoreConfig;
  transformation: TransformationConfig;
  modeling: ModelingConfig;
  evaluation: EvaluationConfig;
  publish: PublishConfig;
}

export interface MLOpsWorkflow {
  id: string;
  name: string;
  pipeline: MLOpsPipeline;
  lastModified: number;
}

export interface MLOpsWorkflowIndexItem {
    id: string;
    name: string;
    lastModified: number;
}
  
export type MLOpsWorkflowIndex = MLOpsWorkflowIndexItem[];

export interface NotebookIndexItem {
  id: string;
  name: string;
  lastModified: number;
}

export type NotebookIndex = NotebookIndexItem[];

export interface Notebook {
  id:string;
  name: string;
  cells: Cell[];
  lastModified: number;
}