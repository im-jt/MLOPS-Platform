/**
 * Project tier determines priority and resource allocation
 * Tier 1: Critical business models (ETA, fraud detection, safety)
 * Tier 2: Important business models
 * Tier 3: Standard models
 * Tier 4: Experimental/exploratory models
 */
export type ProjectTier = 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4';

export interface ProjectMetadata {
  description?: string;
  owner: string;
  team: string;
  tags: string[];
  businessUnit: string;
  createdAt: number;
  lastModified: number;
}

export interface MLProject {
  id: string;
  name: string;
  tier: ProjectTier;
  metadata: ProjectMetadata;
  status: 'active' | 'archived' | 'development';
  modelCount: number;
  pipelineCount: number;
  lastDeployment?: number;
  modelExcellenceScore?: number; // MES score 0-100
}

export interface ProjectStats {
  totalRuns: number;
  successRate: number;
  avgTrainingTime: number;
  activeModels: number;
  failedRuns: number;
}
