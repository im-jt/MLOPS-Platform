/**
 * Feature Store Management
 * Supports batch, streaming, and real-time feature serving
 */

export type FeatureType = 
  | 'numerical'
  | 'categorical'
  | 'boolean'
  | 'timestamp'
  | 'embedding'
  | 'text'
  | 'image_url';

export type FeatureComputeMode = 'batch' | 'streaming' | 'real_time';

export interface FeatureDefinition {
  name: string;
  type: FeatureType;
  description?: string;
  transformation?: string; // DSL or code reference
  computeMode: FeatureComputeMode;
  dependencies: string[]; // Other features this depends on
  defaultValue?: any;
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
    nullable: boolean;
  };
}

export interface FeatureGroup {
  id: string;
  name: string;
  description?: string;
  features: FeatureDefinition[];
  entity: string; // e.g., 'user', 'trip', 'restaurant'
  owner: string;
  tags: string[];
  version: string;
  storageFormat: 'parquet' | 'delta' | 'hudi';
  computeEngine: 'spark' | 'ray' | 'flink';
  schedule?: string; // Cron for batch updates
  lastUpdated: number;
  createdAt: number;
  status: 'active' | 'deprecated' | 'development';
}

export interface FeatureStatistics {
  featureName: string;
  count: number;
  nullCount: number;
  uniqueCount?: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  percentiles?: Record<string, number>;
  histogram?: {
    bins: number[];
    counts: number[];
  };
  lastComputed: number;
}

export interface FeatureLineage {
  featureGroupId: string;
  version: string;
  sourceDatasets: string[];
  transformationPipeline: string;
  computeJob: string;
  createdAt: number;
}

export interface OnlineFeatureStore {
  featureGroupId: string;
  endpoint: string;
  cache: 'redis' | 'cassandra' | 'dynamodb';
  ttl: number; // Time to live in seconds
  qps: number;
  latencyP99: number;
  hitRate: number; // Cache hit rate percentage
}
