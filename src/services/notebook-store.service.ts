import { Injectable } from '@angular/core';
import { Notebook, NotebookIndex, MLOpsPipeline, MLOpsWorkflow, MLOpsWorkflowIndex } from '../models/notebook.model';

const NOTEBOOK_INDEX_KEY = 'notebook-ide-index';
const NOTEBOOK_KEY_PREFIX = 'notebook-ide-notebook-';
const MLOPS_WORKFLOW_INDEX_KEY = 'mlops-workflow-index';
const MLOPS_WORKFLOW_KEY_PREFIX = 'mlops-workflow-';


@Injectable({
  providedIn: 'root'
})
export class NotebookStoreService {

  constructor() {
    this.initializeOrMigrate();
  }

  private initializeOrMigrate() {
    const notebookIndex = localStorage.getItem(NOTEBOOK_INDEX_KEY);
    if (!notebookIndex) {
      localStorage.setItem(NOTEBOOK_INDEX_KEY, JSON.stringify([]));
    }
    const workflowIndex = localStorage.getItem(MLOPS_WORKFLOW_INDEX_KEY);
    if (!workflowIndex) {
      localStorage.setItem(MLOPS_WORKFLOW_INDEX_KEY, JSON.stringify([]));
    }
  }
  
  private getNotebookKey(id: string): string {
    return `${NOTEBOOK_KEY_PREFIX}${id}`;
  }

  private getWorkflowKey(id: string): string {
    return `${MLOPS_WORKFLOW_KEY_PREFIX}${id}`;
  }

  private getDefaultPipeline(): MLOpsPipeline {
    return {
      featureStore: { featureGroupName: '', mode: 'batch' },
      transformation: { scriptPath: '' },
      modeling: { modelName: '', enableCheckpointing: false, enableVersioning: true },
      evaluation: { evaluationFeatureGroup: '' },
      publish: { environment: 'staging' },
    };
  }

  // Notebook Methods
  listNotebooks(): NotebookIndex {
    try {
      const data = localStorage.getItem(NOTEBOOK_INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to list notebooks from localStorage', e);
      return [];
    }
  }
  
  private saveNotebookIndex(index: NotebookIndex): void {
    try {
      localStorage.setItem(NOTEBOOK_INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.error('Failed to save notebook index to localStorage', e);
    }
  }

  getNotebook(id: string): Notebook | null {
    try {
      const data = localStorage.getItem(this.getNotebookKey(id));
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Failed to load notebook ${id} from localStorage`, e);
    }
    return null;
  }
  
  createNotebook(): Notebook {
    const id = Date.now().toString();
    const newNotebook: Notebook = {
      id,
      name: 'Untitled Notebook',
      cells: [
        { 
          id: Date.now(), 
          type: 'code', 
          content: '',
        }
      ],
      lastModified: Date.now(),
    };
    
    try {
      localStorage.setItem(this.getNotebookKey(id), JSON.stringify(newNotebook));
    } catch (e) {
      console.error('Failed to save new notebook to localStorage', e);
      throw e; 
    }

    const index = this.listNotebooks();
    index.push({ id, name: newNotebook.name, lastModified: newNotebook.lastModified });
    this.saveNotebookIndex(index);

    return newNotebook;
  }

  updateNotebook(notebook: Notebook): void {
    try {
      notebook.lastModified = Date.now();
      localStorage.setItem(this.getNotebookKey(notebook.id), JSON.stringify(notebook));
    } catch (e) {
      console.error(`Failed to save notebook ${notebook.id} to localStorage`, e);
      return;
    }

    const index = this.listNotebooks();
    const indexEntry = index.find(item => item.id === notebook.id);
    if (indexEntry) {
      indexEntry.name = notebook.name;
      indexEntry.lastModified = notebook.lastModified;
      this.saveNotebookIndex(index);
    }
  }

  deleteNotebook(id: string): void {
    try {
      localStorage.removeItem(this.getNotebookKey(id));
      const index = this.listNotebooks();
      const newIndex = index.filter(item => item.id !== id);
      this.saveNotebookIndex(newIndex);
    } catch (e) {
      console.error(`Failed to delete notebook ${id} from localStorage`, e);
    }
  }

  // MLOps Workflow Methods
  listWorkflows(): MLOpsWorkflowIndex {
    try {
      const data = localStorage.getItem(MLOPS_WORKFLOW_INDEX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to list workflows from localStorage', e);
      return [];
    }
  }

  private saveWorkflowIndex(index: MLOpsWorkflowIndex): void {
    try {
      localStorage.setItem(MLOPS_WORKFLOW_INDEX_KEY, JSON.stringify(index));
    } catch (e) {
      console.error('Failed to save workflow index to localStorage', e);
    }
  }

  getWorkflow(id: string): MLOpsWorkflow | null {
    try {
      const data = localStorage.getItem(this.getWorkflowKey(id));
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Failed to load workflow ${id} from localStorage`, e);
      return null;
    }
  }

  createWorkflow(): MLOpsWorkflow {
    const id = `wf-${Date.now()}`;
    const newWorkflow: MLOpsWorkflow = {
      id,
      name: 'Untitled MLOps Workflow',
      pipeline: this.getDefaultPipeline(),
      lastModified: Date.now(),
    };
    
    try {
      localStorage.setItem(this.getWorkflowKey(id), JSON.stringify(newWorkflow));
    } catch (e) {
      console.error('Failed to save new workflow to localStorage', e);
      throw e;
    }
    
    const index = this.listWorkflows();
    index.push({ id, name: newWorkflow.name, lastModified: newWorkflow.lastModified });
    this.saveWorkflowIndex(index);
    
    return newWorkflow;
  }

  updateWorkflow(workflow: MLOpsWorkflow): void {
    try {
      workflow.lastModified = Date.now();
      localStorage.setItem(this.getWorkflowKey(workflow.id), JSON.stringify(workflow));
    } catch (e) {
      console.error(`Failed to save workflow ${workflow.id} to localStorage`, e);
      return;
    }

    const index = this.listWorkflows();
    const indexEntry = index.find(item => item.id === workflow.id);
    if (indexEntry) {
      indexEntry.name = workflow.name;
      indexEntry.lastModified = workflow.lastModified;
      this.saveWorkflowIndex(index);
    }
  }

  deleteWorkflow(id: string): void {
    try {
      localStorage.removeItem(this.getWorkflowKey(id));
      const index = this.listWorkflows();
      const newIndex = index.filter(item => item.id !== id);
      this.saveWorkflowIndex(newIndex);
    } catch (e) {
      console.error(`Failed to delete workflow ${id} from localStorage`, e);
    }
  }
}