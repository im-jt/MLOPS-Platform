import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GenAIService } from '../../services/genai.service';
import { GeminiService } from '../../services/gemini.service';
import { LLMModel, PromptTemplate, FineTuningJob } from '../../models/genai.model';

@Component({
  selector: 'app-genai-playground',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './genai-playground.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenAIPlaygroundComponent implements OnInit {
  private genaiService = inject(GenAIService);
  private geminiService = inject(GeminiService);

  activeTab = signal<'catalog' | 'prompts' | 'finetuning'>('catalog');
  
  // LLM Catalog
  llmModels = signal<LLMModel[]>([]);
  filteredModels = signal<LLMModel[]>([]);
  providerFilter = signal<'all' | 'in_house' | '3p_openai' | '3p_anthropic' | '3p_google'>('all');
  
  // Prompt Engineering
  promptTemplates = signal<PromptTemplate[]>([]);
  selectedPrompt = signal<PromptTemplate | null>(null);
  promptInput = signal('');
  promptVariables = signal<Record<string, string>>({});
  promptOutput = signal('');
  isGenerating = signal(false);
  
  // Fine-tuning
  fineTuningJobs = signal<FineTuningJob[]>([]);
  showCreateJobModal = signal(false);
  newFineTuneJob = signal({
    projectId: 'proj-5',
    baseModelId: '',
    name: '',
    datasetId: '',
    epochs: 3,
    batchSize: 8,
    learningRate: 0.0001,
    loraEnabled: true,
    loraRank: 16,
  });

  ngOnInit() {
    this.loadLLMModels();
    this.loadPromptTemplates();
    this.loadFineTuningJobs();
  }

  loadLLMModels() {
    const models = this.genaiService.getLLMModels();
    this.llmModels.set(models);
    this.filterModels();
  }

  loadPromptTemplates() {
    this.promptTemplates.set(this.genaiService.getPromptTemplates());
  }

  loadFineTuningJobs() {
    this.fineTuningJobs.set(this.genaiService.getFineTuningJobs());
  }

  setActiveTab(tab: 'catalog' | 'prompts' | 'finetuning') {
    this.activeTab.set(tab);
  }

  setProviderFilter(provider: 'all' | 'in_house' | '3p_openai' | '3p_anthropic' | '3p_google') {
    this.providerFilter.set(provider);
    this.filterModels();
  }

  filterModels() {
    const provider = this.providerFilter();
    const all = this.llmModels();
    if (provider === 'all') {
      this.filteredModels.set(all);
    } else {
      this.filteredModels.set(all.filter(m => m.provider === provider));
    }
  }

  getProviderBadgeColor(provider: string): string {
    switch (provider) {
      case 'in_house':
        return 'bg-blue-100 text-blue-800';
      case '3p_openai':
        return 'bg-green-100 text-green-800';
      case '3p_anthropic':
        return 'bg-purple-100 text-purple-800';
      case '3p_google':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getProviderLabel(provider: string): string {
    switch (provider) {
      case 'in_house':
        return 'In-House';
      case '3p_openai':
        return 'OpenAI';
      case '3p_anthropic':
        return 'Anthropic';
      case '3p_google':
        return 'Google';
      default:
        return provider;
    }
  }

  selectPromptTemplate(template: PromptTemplate) {
    this.selectedPrompt.set(template);
    this.promptInput.set(template.template);
    // Initialize variables
    const vars: Record<string, string> = {};
    template.variables.forEach(v => (vars[v] = ''));
    this.promptVariables.set(vars);
  }

  updatePromptVariable(varName: string, value: string) {
    this.promptVariables.update(vars => ({ ...vars, [varName]: value }));
    this.updatePromptWithVariables();
  }

  updatePromptWithVariables() {
    const template = this.selectedPrompt();
    if (!template) return;

    let prompt = template.template;
    const vars = this.promptVariables();
    Object.keys(vars).forEach(key => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), vars[key]);
    });
    this.promptInput.set(prompt);
  }

  async generateWithPrompt() {
    const prompt = this.promptInput();
    if (!prompt) return;

    this.isGenerating.set(true);
    this.promptOutput.set('Generating...');

    try {
      await this.geminiService.sendMessage(prompt);
      // Get the last message response
      const messages = this.geminiService.chatHistory();
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'model') {
        this.promptOutput.set(lastMessage.text);
      }
      
      // Increment usage count
      const template = this.selectedPrompt();
      if (template) {
        this.genaiService.incrementPromptUsage(template.id);
      }
    } catch (error) {
      this.promptOutput.set(`Error: ${error}`);
    } finally {
      this.isGenerating.set(false);
    }
  }

  createNewPrompt() {
    const newPrompt = this.genaiService.createPromptTemplate({
      name: 'New Prompt Template',
      template: 'Enter your prompt here...',
      variables: [],
      examples: [],
      category: 'other',
      tags: [],
      version: '1.0',
      createdBy: 'user@company.com',
    });
    this.selectPromptTemplate(newPrompt);
    this.loadPromptTemplates();
  }

  openCreateJobModal() {
    this.showCreateJobModal.set(true);
  }

  closeCreateJobModal() {
    this.showCreateJobModal.set(false);
  }

  createFineTuningJob() {
    const formData = this.newFineTuneJob();
    const job = this.genaiService.createFineTuningJob({
      projectId: formData.projectId,
      baseModelId: formData.baseModelId,
      name: formData.name,
      status: 'preparing',
      datasetId: formData.datasetId,
      trainingConfig: {
        epochs: formData.epochs,
        batchSize: formData.batchSize,
        learningRate: formData.learningRate,
        loraConfig: formData.loraEnabled
          ? {
              enabled: true,
              rank: formData.loraRank,
              alpha: formData.loraRank * 2,
              dropout: 0.1,
            }
          : undefined,
      },
      gpuType: 'A100',
      gpuCount: 4,
      createdBy: 'user@company.com',
    });

    // Simulate job progress
    setTimeout(() => {
      this.genaiService.updateFineTuningJob(job.id, {
        status: 'training',
        progress: 25,
      });
      this.loadFineTuningJobs();
    }, 2000);

    this.closeCreateJobModal();
    this.loadFineTuningJobs();
  }

  getJobStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  formatCost(cost?: number): string {
    return cost ? `$${cost.toFixed(2)}` : 'N/A';
  }

  // Helper methods for template bindings
  updateJobName(value: string) {
    this.newFineTuneJob.update(j => ({ ...j, name: value }));
  }

  updateJobBaseModel(value: string) {
    this.newFineTuneJob.update(j => ({ ...j, baseModelId: value }));
  }

  updateJobDataset(value: string) {
    this.newFineTuneJob.update(j => ({ ...j, datasetId: value }));
  }

  updateJobEpochs(value: number) {
    this.newFineTuneJob.update(j => ({ ...j, epochs: value }));
  }

  updateJobBatchSize(value: number) {
    this.newFineTuneJob.update(j => ({ ...j, batchSize: value }));
  }

  updateJobLearningRate(value: number) {
    this.newFineTuneJob.update(j => ({ ...j, learningRate: value }));
  }

  updateJobLoraEnabled(value: boolean) {
    this.newFineTuneJob.update(j => ({ ...j, loraEnabled: value }));
  }

  updateJobLoraRank(value: number) {
    this.newFineTuneJob.update(j => ({ ...j, loraRank: value }));
  }
}
