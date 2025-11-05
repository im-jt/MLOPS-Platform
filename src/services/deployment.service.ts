import { Injectable, signal } from '@angular/core';
import { Deployment, DeploymentEnvironment, DeploymentHistory } from '../models/deployment.model';

@Injectable({
  providedIn: 'root',
})
export class DeploymentService {
  private deployments = signal<Deployment[]>([]);
  private deploymentHistory = signal<DeploymentHistory[]>([]);

  constructor() {
    this.loadDeployments();
  }

  private loadDeployments() {
    const stored = localStorage.getItem('ml_deployments');
    if (stored) {
      this.deployments.set(JSON.parse(stored));
    } else {
      // Initialize with sample deployments
      const sampleDeployments: Deployment[] = [
        {
          id: 'deploy-1',
          modelId: 'model-1',
          modelVersion: '3.2.1',
          projectId: 'proj-1',
          name: 'DeepETA Production Deployment',
          environment: 'production',
          strategy: 'rolling',
          status: 'active',
          zones: [
            {
              zoneId: 'us-west-1',
              zoneName: 'US West 1',
              status: 'active',
              version: '3.2.1',
              replicas: 8,
              trafficPercentage: 33,
              healthStatus: 'healthy',
              lastHealthCheck: Date.now() - 5 * 60 * 1000,
            },
            {
              zoneId: 'us-east-1',
              zoneName: 'US East 1',
              status: 'active',
              version: '3.2.1',
              replicas: 10,
              trafficPercentage: 34,
              healthStatus: 'healthy',
              lastHealthCheck: Date.now() - 3 * 60 * 1000,
            },
            {
              zoneId: 'eu-west-1',
              zoneName: 'EU West 1',
              status: 'active',
              version: '3.2.1',
              replicas: 6,
              trafficPercentage: 33,
              healthStatus: 'healthy',
              lastHealthCheck: Date.now() - 7 * 60 * 1000,
            },
          ],
          serverConfig: {
            servingEngine: 'triton',
            gpuEnabled: true,
            gpuType: 'A100',
            batchSize: 64,
            maxBatchDelay: 50,
            instances: 24,
            autoscaling: {
              enabled: true,
              minInstances: 20,
              maxInstances: 50,
              targetGPU: 70,
            },
          },
          endpoint: 'https://api.company.com/ml/deepeta/v3',
          qps: 15000,
          latencyP50: 12,
          latencyP99: 45,
          errorRate: 0.002,
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          deployedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
          createdBy: 'john.doe@company.com',
          rollbackConfig: {
            autoRollback: true,
            errorThreshold: 0.05,
            latencyThreshold: 100,
          },
        },
        {
          id: 'deploy-2',
          modelId: 'model-2',
          modelVersion: '2.1.0',
          projectId: 'proj-2',
          name: 'Fraud Detector Production',
          environment: 'production',
          strategy: 'canary',
          status: 'active',
          zones: [
            {
              zoneId: 'us-west-1',
              zoneName: 'US West 1',
              status: 'active',
              version: '2.1.0',
              replicas: 5,
              trafficPercentage: 50,
              healthStatus: 'healthy',
              lastHealthCheck: Date.now() - 2 * 60 * 1000,
            },
            {
              zoneId: 'us-east-1',
              zoneName: 'US East 1',
              status: 'active',
              version: '2.1.0',
              replicas: 5,
              trafficPercentage: 50,
              healthStatus: 'healthy',
              lastHealthCheck: Date.now() - 4 * 60 * 1000,
            },
          ],
          serverConfig: {
            servingEngine: 'triton',
            gpuEnabled: false,
            instances: 10,
            autoscaling: {
              enabled: true,
              minInstances: 8,
              maxInstances: 20,
              targetCPU: 75,
            },
          },
          endpoint: 'https://api.company.com/ml/fraud/v2',
          qps: 8000,
          latencyP50: 8,
          latencyP99: 25,
          errorRate: 0.001,
          createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
          deployedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
          createdBy: 'jane.smith@company.com',
          rollbackConfig: {
            autoRollback: true,
            errorThreshold: 0.03,
            latencyThreshold: 50,
          },
        },
      ];
      this.deployments.set(sampleDeployments);
      this.saveDeployments();
    }
  }

  private saveDeployments() {
    localStorage.setItem('ml_deployments', JSON.stringify(this.deployments()));
  }

  getDeployments() {
    return this.deployments();
  }

  getDeploymentsByProject(projectId: string): Deployment[] {
    return this.deployments().filter(d => d.projectId === projectId);
  }

  getDeploymentsByModel(modelId: string): Deployment[] {
    return this.deployments().filter(d => d.modelId === modelId);
  }

  getDeploymentById(id: string): Deployment | undefined {
    return this.deployments().find(d => d.id === id);
  }

  createDeployment(deployment: Omit<Deployment, 'id' | 'createdAt'>): Deployment {
    const newDeployment: Deployment = {
      ...deployment,
      id: `deploy-${Date.now()}`,
      createdAt: Date.now(),
    };
    this.deployments.update(deployments => [...deployments, newDeployment]);
    this.saveDeployments();
    this.addHistory({
      deploymentId: newDeployment.id,
      action: 'created',
      timestamp: Date.now(),
      user: newDeployment.createdBy,
      details: `Created deployment for model ${newDeployment.modelVersion}`,
      toVersion: newDeployment.modelVersion,
    });
    return newDeployment;
  }

  updateDeployment(id: string, updates: Partial<Deployment>) {
    this.deployments.update(deployments =>
      deployments.map(d => (d.id === id ? { ...d, ...updates } : d))
    );
    this.saveDeployments();
  }

  deleteDeployment(id: string) {
    const deployment = this.getDeploymentById(id);
    this.deployments.update(deployments => deployments.filter(d => d.id !== id));
    this.saveDeployments();
    if (deployment) {
      this.addHistory({
        deploymentId: id,
        action: 'deleted',
        timestamp: Date.now(),
        user: deployment.createdBy,
        details: `Deleted deployment`,
      });
    }
  }

  rollbackDeployment(id: string, targetVersion: string, user: string) {
    const deployment = this.getDeploymentById(id);
    if (deployment) {
      const previousVersion = deployment.modelVersion;
      this.updateDeployment(id, {
        modelVersion: targetVersion,
        status: 'deploying',
        zones: deployment.zones.map(z => ({ ...z, status: 'deploying' as const, version: targetVersion })),
      });
      this.addHistory({
        deploymentId: id,
        action: 'rolledback',
        timestamp: Date.now(),
        user,
        details: `Rolled back from ${previousVersion} to ${targetVersion}`,
        fromVersion: previousVersion,
        toVersion: targetVersion,
      });

      // Simulate deployment completion
      setTimeout(() => {
        this.updateDeployment(id, {
          status: 'active',
          zones: deployment.zones.map(z => ({ ...z, status: 'active' as const })),
        });
      }, 3000);
    }
  }

  scaleDeployment(id: string, zoneId: string, newReplicas: number, user: string) {
    const deployment = this.getDeploymentById(id);
    if (deployment) {
      const updatedZones = deployment.zones.map(z =>
        z.zoneId === zoneId ? { ...z, replicas: newReplicas } : z
      );
      this.updateDeployment(id, { zones: updatedZones });
      this.addHistory({
        deploymentId: id,
        action: 'scaled',
        timestamp: Date.now(),
        user,
        details: `Scaled ${zoneId} to ${newReplicas} replicas`,
      });
    }
  }

  private addHistory(entry: DeploymentHistory) {
    this.deploymentHistory.update(history => [...history, entry]);
    localStorage.setItem('ml_deployment_history', JSON.stringify(this.deploymentHistory()));
  }

  getDeploymentHistory(deploymentId: string): DeploymentHistory[] {
    return this.deploymentHistory().filter(h => h.deploymentId === deploymentId);
  }
}
