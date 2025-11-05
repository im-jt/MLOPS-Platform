/**
 * Deployment and Serving Infrastructure
 * Supports online inference, batch inference, and streaming
 */

export type DeploymentEnvironment = 'development' | 'staging' | 'production';

export type DeploymentStrategy = 
  | 'rolling' // Gradual rollout across zones
  | 'blue_green' // Deploy to staging, then swap
  | 'canary' // Small percentage testing
  | 'shadow'; // Parallel deployment without affecting production

export interface DeploymentZone {
  zoneId: string;
  zoneName: string;
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'rolledback';
  version: string;
  replicas: number;
  trafficPercentage: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck?: number;
}

export interface InferenceServerConfig {
  servingEngine: 'triton' | 'torchserve' | 'tensorflow-serving' | 'custom';
  gpuEnabled: boolean;
  gpuType?: 'T4' | 'V100' | 'A100';
  batchSize?: number;
  maxBatchDelay?: number; // ms
  instances: number;
  autoscaling?: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    targetCPU?: number;
    targetGPU?: number;
  };
}

export interface Deployment {
  id: string;
  modelId: string;
  modelVersion: string;
  projectId: string;
  name: string;
  environment: DeploymentEnvironment;
  strategy: DeploymentStrategy;
  status: 'pending' | 'deploying' | 'active' | 'failed' | 'rolledback' | 'archived';
  zones: DeploymentZone[];
  serverConfig: InferenceServerConfig;
  endpoint?: string;
  qps?: number; // Queries per second
  latencyP50?: number;
  latencyP99?: number;
  errorRate?: number;
  createdAt: number;
  deployedAt?: number;
  createdBy: string;
  rollbackConfig?: {
    autoRollback: boolean;
    errorThreshold: number;
    latencyThreshold: number;
  };
}

export interface DeploymentHistory {
  deploymentId: string;
  action: 'created' | 'updated' | 'rolledback' | 'scaled' | 'deleted';
  timestamp: number;
  user: string;
  details: string;
  fromVersion?: string;
  toVersion?: string;
}
