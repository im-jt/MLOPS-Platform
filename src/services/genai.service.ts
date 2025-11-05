import { Injectable, signal } from '@angular/core';
import { LLMModel, PromptTemplate, FineTuningJob, PromptEvaluation } from '../models/genai.model';

@Injectable({
  providedIn: 'root',
})
export class GenAIService {
  private llmModels = signal<LLMModel[]>([]);
  private promptTemplates = signal<PromptTemplate[]>([]);
  private fineTuningJobs = signal<FineTuningJob[]>([]);

  constructor() {
    this.initializeLLMCatalog();
    this.loadPromptTemplates();
    this.loadFineTuningJobs();
  }

  private initializeLLMCatalog() {
    const models: LLMModel[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: '3p_openai',
        baseModel: 'gpt-4-turbo-preview',
        version: '0125',
        size: 'xlarge',
        contextWindow: 128000,
        costPerInputToken: 0.00001,
        costPerOutputToken: 0.00003,
        latencyP50: 1200,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          functionCalling: true,
          vision: true,
        },
        fineTuned: false,
        status: 'available',
        createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: '3p_anthropic',
        baseModel: 'claude-3-opus-20240229',
        version: '20240229',
        size: 'xlarge',
        contextWindow: 200000,
        costPerInputToken: 0.000015,
        costPerOutputToken: 0.000075,
        latencyP50: 1500,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          functionCalling: false,
          vision: true,
        },
        fineTuned: false,
        status: 'available',
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'llama-2-70b',
        name: 'Llama 2 70B',
        provider: 'in_house',
        baseModel: 'meta-llama/Llama-2-70b-hf',
        version: '1.0',
        size: 'large',
        parameterCount: 70,
        contextWindow: 4096,
        latencyP50: 800,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          functionCalling: false,
          vision: false,
        },
        fineTuned: false,
        status: 'available',
        createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'llama-2-70b-finetuned',
        name: 'Llama 2 70B (Fine-tuned for Trips)',
        provider: 'in_house',
        baseModel: 'meta-llama/Llama-2-70b-hf',
        version: '1.2',
        size: 'large',
        parameterCount: 70,
        contextWindow: 4096,
        latencyP50: 800,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          functionCalling: false,
          vision: false,
        },
        fineTuned: true,
        fineTuneBaseModel: 'llama-2-70b',
        fineTuneDatasetId: 'trips-dataset-v1',
        status: 'available',
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      },
    ];
    this.llmModels.set(models);
  }

  private loadPromptTemplates() {
    const stored = localStorage.getItem('prompt_templates');
    if (stored) {
      this.promptTemplates.set(JSON.parse(stored));
    } else {
      const samples: PromptTemplate[] = [
        {
          id: 'prompt-1',
          name: 'Trip Summary Generator',
          description: 'Generates a summary of trip details for customer support',
          template: 'Generate a concise summary of the trip:\n\nTrip ID: {{trip_id}}\nPickup: {{pickup_location}}\nDropoff: {{dropoff_location}}\nDuration: {{duration}} minutes\nFare: ${{fare}}\n\nSummary:',
          variables: ['trip_id', 'pickup_location', 'dropoff_location', 'duration', 'fare'],
          examples: [],
          category: 'summarization',
          tags: ['trips', 'customer-support'],
          version: '1.0',
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          createdBy: 'alice.chen@company.com',
          usageCount: 125,
        },
        {
          id: 'prompt-2',
          name: 'Sentiment Classifier',
          description: 'Classifies customer feedback sentiment',
          template: 'Classify the sentiment of the following customer feedback as positive, negative, or neutral:\n\nFeedback: {{feedback}}\n\nSentiment:',
          variables: ['feedback'],
          examples: [],
          category: 'classification',
          tags: ['sentiment', 'feedback'],
          version: '1.0',
          createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
          createdBy: 'mike.lee@company.com',
          usageCount: 389,
        },
      ];
      this.promptTemplates.set(samples);
      this.savePromptTemplates();
    }
  }

  private savePromptTemplates() {
    localStorage.setItem('prompt_templates', JSON.stringify(this.promptTemplates()));
  }

  private loadFineTuningJobs() {
    const stored = localStorage.getItem('finetuning_jobs');
    if (stored) {
      this.fineTuningJobs.set(JSON.parse(stored));
    } else {
      const samples: FineTuningJob[] = [
        {
          id: 'ft-1',
          projectId: 'proj-5',
          baseModelId: 'llama-2-70b',
          name: 'Fine-tune Llama 2 for Trip Descriptions',
          status: 'completed',
          datasetId: 'trips-dataset-v1',
          trainingConfig: {
            epochs: 3,
            batchSize: 8,
            learningRate: 0.0001,
            warmupSteps: 100,
            weightDecay: 0.01,
            loraConfig: {
              enabled: true,
              rank: 16,
              alpha: 32,
              dropout: 0.1,
            },
          },
          gpuType: 'A100',
          gpuCount: 4,
          progress: 100,
          metrics: {
            trainingLoss: [2.1, 1.8, 1.6, 1.5, 1.4],
            validationLoss: [2.0, 1.9, 1.7, 1.6, 1.5],
            perplexity: [8.2, 6.8, 5.9, 5.4, 5.1],
          },
          estimatedCost: 450,
          actualCost: 420,
          resultingModelId: 'llama-2-70b-finetuned',
          startTime: Date.now() - 32 * 24 * 60 * 60 * 1000,
          endTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
          createdBy: 'mike.lee@company.com',
        },
      ];
      this.fineTuningJobs.set(samples);
      this.saveFineTuningJobs();
    }
  }

  private saveFineTuningJobs() {
    localStorage.setItem('finetuning_jobs', JSON.stringify(this.fineTuningJobs()));
  }

  // LLM Model methods
  getLLMModels() {
    return this.llmModels();
  }

  getLLMModelById(id: string): LLMModel | undefined {
    return this.llmModels().find(m => m.id === id);
  }

  getAvailableLLMs(): LLMModel[] {
    return this.llmModels().filter(m => m.status === 'available');
  }

  getInHouseLLMs(): LLMModel[] {
    return this.llmModels().filter(m => m.provider === 'in_house');
  }

  // Prompt Template methods
  getPromptTemplates() {
    return this.promptTemplates();
  }

  getPromptTemplateById(id: string): PromptTemplate | undefined {
    return this.promptTemplates().find(p => p.id === id);
  }

  createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'usageCount'>): PromptTemplate {
    const newTemplate: PromptTemplate = {
      ...template,
      id: `prompt-${Date.now()}`,
      createdAt: Date.now(),
      usageCount: 0,
    };
    this.promptTemplates.update(templates => [...templates, newTemplate]);
    this.savePromptTemplates();
    return newTemplate;
  }

  updatePromptTemplate(id: string, updates: Partial<PromptTemplate>) {
    this.promptTemplates.update(templates =>
      templates.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
    this.savePromptTemplates();
  }

  deletePromptTemplate(id: string) {
    this.promptTemplates.update(templates => templates.filter(t => t.id !== id));
    this.savePromptTemplates();
  }

  incrementPromptUsage(id: string) {
    this.promptTemplates.update(templates =>
      templates.map(t => (t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t))
    );
    this.savePromptTemplates();
  }

  // Fine-tuning methods
  getFineTuningJobs() {
    return this.fineTuningJobs();
  }

  getFineTuningJobsByProject(projectId: string): FineTuningJob[] {
    return this.fineTuningJobs().filter(j => j.projectId === projectId);
  }

  getFineTuningJobById(id: string): FineTuningJob | undefined {
    return this.fineTuningJobs().find(j => j.id === id);
  }

  createFineTuningJob(job: Omit<FineTuningJob, 'id' | 'progress' | 'startTime'>): FineTuningJob {
    const newJob: FineTuningJob = {
      ...job,
      id: `ft-${Date.now()}`,
      progress: 0,
      startTime: Date.now(),
    };
    this.fineTuningJobs.update(jobs => [...jobs, newJob]);
    this.saveFineTuningJobs();
    return newJob;
  }

  updateFineTuningJob(id: string, updates: Partial<FineTuningJob>) {
    this.fineTuningJobs.update(jobs =>
      jobs.map(j => (j.id === id ? { ...j, ...updates } : j))
    );
    this.saveFineTuningJobs();
  }
}
