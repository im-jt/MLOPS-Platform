import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MLOpsPipeline, FeatureStoreConfig, TransformationConfig, ModelingConfig, EvaluationConfig, PublishConfig } from '../../models/notebook.model';
import { WorkflowService } from '../../services/workflow.service';

@Component({
  selector: 'app-mlops-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './mlops-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MLOpsPanelComponent {
  workflowService = inject(WorkflowService);
  pipeline = this.workflowService.pipeline;

  // We use local signals for form bindings to avoid direct mutation of the service signal on every keypress.
  // This is better for performance and avoids excessive autosaving.
  featureStoreConfig = signal<FeatureStoreConfig>({ featureGroupName: '', mode: 'batch' });
  transformationConfig = signal<TransformationConfig>({ scriptPath: '' });
  modelingConfig = signal<ModelingConfig>({ modelName: '', enableCheckpointing: false, enableVersioning: true });
  evaluationConfig = signal<EvaluationConfig>({ evaluationFeatureGroup: '' });
  publishConfig = signal<PublishConfig>({ environment: 'staging' });

  deploymentMessage = signal('');
  
  constructor() {
    // When the pipeline from the service changes (e.g., workflow loaded), update local signals.
    effect(() => {
      const p = this.pipeline();
      if (p) {
        this.featureStoreConfig.set({...p.featureStore});
        this.transformationConfig.set({...p.transformation});
        this.modelingConfig.set({...p.modeling});
        this.evaluationConfig.set({...p.evaluation});
        this.publishConfig.set({...p.publish});
      }
    });
  }

  updatePipeline() {
    const updatedPipeline: MLOpsPipeline = {
      featureStore: this.featureStoreConfig(),
      transformation: this.transformationConfig(),
      modeling: this.modelingConfig(),
      evaluation: this.evaluationConfig(),
      publish: this.publishConfig()
    };
    this.workflowService.updatePipeline(updatedPipeline);
  }
  
  // Methods to handle template events, avoiding logic in the template itself
  onFeatureStoreGroupNameChange(name: string) {
    this.featureStoreConfig.update(c => ({...c, featureGroupName: name}));
  }

  onFeatureStoreModeChange(mode: 'batch' | 'streaming' | 'fixed') {
    this.featureStoreConfig.update(c => ({...c, mode: mode}));
    this.updatePipeline();
  }

  onFeatureStoreVersionChange(version: string) {
    this.featureStoreConfig.update(c => ({...c, version: version}));
  }

  onTransformationScriptPathChange(path: string) {
    this.transformationConfig.update(c => ({...c, scriptPath: path}));
  }

  onModelingModelNameChange(name: string) {
    this.modelingConfig.update(c => ({...c, modelName: name}));
  }

  onModelingCheckpointingChange(enabled: boolean) {
    this.modelingConfig.update(c => ({...c, enableCheckpointing: enabled}));
    this.updatePipeline();
  }
  
  onModelingVersioningChange(enabled: boolean) {
    this.modelingConfig.update(c => ({...c, enableVersioning: enabled}));
    this.updatePipeline();
  }

  onEvaluationFeatureGroupChange(name: string) {
    this.evaluationConfig.update(c => ({...c, evaluationFeatureGroup: name}));
  }

  deployModel() {
    const modelName = this.modelingConfig().modelName || 'Untitled Model';
    const newVersion = `${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 100)}`;
    const env = this.publishConfig().environment;
    
    this.publishConfig.update(c => ({...c, deployedVersion: newVersion, lastDeployed: Date.now() }));
    this.updatePipeline();

    this.deploymentMessage.set(`Model "${modelName}" (version ${newVersion}) successfully deployed to ${env}!`);
    setTimeout(() => this.deploymentMessage.set(''), 5000);
  }
}