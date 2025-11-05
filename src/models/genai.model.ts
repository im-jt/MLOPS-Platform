/**
 * Generative AI and LLM Operations (LLMOps)
 * Support for LLM fine-tuning, prompt engineering, and evaluation
 */

export type LLMProvider = '3p_openai' | '3p_anthropic' | '3p_google' | 'in_house';

export type LLMSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  baseModel: string; // e.g., 'gpt-4', 'claude-3', 'llama-2-70b'
  version: string;
  size: LLMSize;
  parameterCount?: number; // In billions
  contextWindow: number;
  costPerInputToken?: number;
  costPerOutputToken?: number;
  latencyP50?: number;
  capabilities: {
    chat: boolean;
    completion: boolean;
    embedding: boolean;
    functionCalling: boolean;
    vision: boolean;
  };
  fineTuned: boolean;
  fineTuneBaseModel?: string;
  fineTuneDatasetId?: string;
  status: 'available' | 'training' | 'deprecated';
  createdAt: number;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: string[];
  examples: PromptExample[];
  category: 'chat' | 'summarization' | 'extraction' | 'classification' | 'generation' | 'other';
  tags: string[];
  version: string;
  createdAt: number;
  createdBy: string;
  usageCount: number;
}

export interface PromptExample {
  input: Record<string, string>;
  expectedOutput?: string;
  actualOutput?: string;
  notes?: string;
}

export interface PromptEvaluation {
  id: string;
  promptTemplateId: string;
  llmModelId: string;
  testCases: PromptExample[];
  results: {
    accuracy?: number;
    relevance?: number;
    coherence?: number;
    avgLatency: number;
    totalCost: number;
    successRate: number;
  };
  evaluatedAt: number;
  evaluatedBy: string;
}

export interface FineTuningJob {
  id: string;
  projectId: string;
  baseModelId: string;
  name: string;
  status: 'preparing' | 'training' | 'validating' | 'completed' | 'failed' | 'cancelled';
  datasetId: string;
  trainingConfig: {
    epochs: number;
    batchSize: number;
    learningRate: number;
    warmupSteps?: number;
    weightDecay?: number;
    loraConfig?: {
      enabled: boolean;
      rank: number;
      alpha: number;
      dropout: number;
    };
  };
  gpuType: 'A100' | 'H100' | 'V100';
  gpuCount: number;
  progress: number; // 0-100
  metrics?: {
    trainingLoss: number[];
    validationLoss: number[];
    perplexity?: number[];
  };
  estimatedCost?: number;
  actualCost?: number;
  resultingModelId?: string;
  startTime: number;
  endTime?: number;
  createdBy: string;
  errorMessage?: string;
}

export interface LLMEvaluationFramework {
  id: string;
  name: string;
  evaluationMethod: 'human' | 'llm_judge' | 'rule_based' | 'hybrid';
  criteria: {
    name: string;
    description: string;
    weight: number;
  }[];
  benchmarkDataset?: string;
}

export interface GenAIUsageLog {
  id: string;
  timestamp: number;
  modelId: string;
  userId: string;
  projectId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  latency: number;
  success: boolean;
  errorType?: string;
}
