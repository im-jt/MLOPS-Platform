import { Injectable, signal } from '@angular/core';
import { ModelMonitoring, ModelExcellenceScore, FeatureMonitoring, ModelHealthAlert } from '../models/monitoring.model';

@Injectable({
  providedIn: 'root',
})
export class MonitoringService {
  private monitoringData = signal<Map<string, ModelMonitoring>>(new Map());

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    const sampleMES: ModelExcellenceScore = {
      overallScore: 92,
      components: {
        trainingAccuracy: {
          score: 95,
          weight: 0.25,
          value: 0.94,
          target: 0.90,
        },
        predictionAccuracy: {
          score: 93,
          weight: 0.25,
          value: 0.91,
          target: 0.88,
        },
        modelFreshness: {
          score: 90,
          weight: 0.15,
          daysSinceRetrain: 5,
          targetDays: 7,
        },
        featureQuality: {
          score: 88,
          weight: 0.15,
          driftScore: 0.12,
          nullPercentage: 0.5,
        },
        latency: {
          score: 95,
          weight: 0.1,
          p99: 45,
          target: 50,
        },
        availability: {
          score: 99,
          weight: 0.1,
          uptime: 99.9,
          target: 99.5,
        },
      },
      lastUpdated: Date.now() - 1 * 60 * 60 * 1000,
      trend: 'stable',
    };

    const sampleFeatureMonitoring: FeatureMonitoring[] = [
      {
        featureName: 'distance_km',
        dataType: 'numerical',
        trainingDistribution: {
          mean: 8.5,
          std: 5.2,
          min: 0.1,
          max: 50.0,
          nullPercentage: 0.1,
        },
        productionDistribution: {
          mean: 8.8,
          std: 5.4,
          min: 0.1,
          max: 52.0,
          nullPercentage: 0.2,
        },
        drift: {
          detected: false,
          score: 0.08,
          method: 'ks_test',
        },
        lastChecked: Date.now() - 30 * 60 * 1000,
      },
      {
        featureName: 'hour_of_day',
        dataType: 'numerical',
        trainingDistribution: {
          mean: 12.5,
          std: 6.8,
          min: 0,
          max: 23,
          nullPercentage: 0.0,
        },
        productionDistribution: {
          mean: 14.2,
          std: 6.5,
          min: 0,
          max: 23,
          nullPercentage: 0.0,
        },
        drift: {
          detected: true,
          score: 0.25,
          method: 'ks_test',
        },
        lastChecked: Date.now() - 30 * 60 * 1000,
      },
    ];

    const sampleAlerts: ModelHealthAlert[] = [
      {
        id: 'alert-1',
        modelId: 'model-1',
        deploymentId: 'deploy-1',
        severity: 'warning',
        type: 'feature_drift',
        message: 'Feature drift detected in hour_of_day feature. Drift score: 0.25',
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        acknowledged: false,
      },
    ];

    const monitoring: ModelMonitoring = {
      modelId: 'model-1',
      deploymentId: 'deploy-1',
      mes: sampleMES,
      featureMonitoring: sampleFeatureMonitoring,
      performanceMetrics: [],
      alerts: sampleAlerts,
      lastRetrainTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
      nextScheduledRetrain: Date.now() + 2 * 24 * 60 * 60 * 1000,
    };

    const dataMap = new Map<string, ModelMonitoring>();
    dataMap.set('model-1', monitoring);
    this.monitoringData.set(dataMap);
  }

  getModelMonitoring(modelId: string): ModelMonitoring | undefined {
    return this.monitoringData().get(modelId);
  }

  getModelExcellenceScore(modelId: string): ModelExcellenceScore | undefined {
    return this.monitoringData().get(modelId)?.mes;
  }

  getFeatureMonitoring(modelId: string): FeatureMonitoring[] {
    return this.monitoringData().get(modelId)?.featureMonitoring || [];
  }

  getAlerts(modelId: string): ModelHealthAlert[] {
    return this.monitoringData().get(modelId)?.alerts || [];
  }

  acknowledgeAlert(alertId: string) {
    this.monitoringData.update(data => {
      const newData = new Map(data);
      newData.forEach(monitoring => {
        monitoring.alerts = monitoring.alerts.map(alert =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        );
      });
      return newData;
    });
  }

  resolveAlert(alertId: string) {
    this.monitoringData.update(data => {
      const newData = new Map(data);
      newData.forEach(monitoring => {
        monitoring.alerts = monitoring.alerts.map(alert =>
          alert.id === alertId ? { ...alert, acknowledged: true, resolvedAt: Date.now() } : alert
        );
      });
      return newData;
    });
  }

  calculateMES(modelId: string): ModelExcellenceScore {
    // In a real implementation, this would calculate based on actual metrics
    const monitoring = this.monitoringData().get(modelId);
    if (monitoring) {
      return monitoring.mes;
    }

    // Default MES
    return {
      overallScore: 0,
      components: {
        trainingAccuracy: { score: 0, weight: 0.25, value: 0, target: 0 },
        predictionAccuracy: { score: 0, weight: 0.25, value: 0, target: 0 },
        modelFreshness: { score: 0, weight: 0.15, daysSinceRetrain: 0, targetDays: 7 },
        featureQuality: { score: 0, weight: 0.15, driftScore: 0, nullPercentage: 0 },
        latency: { score: 0, weight: 0.1, p99: 0, target: 0 },
        availability: { score: 0, weight: 0.1, uptime: 0, target: 99.5 },
      },
      lastUpdated: Date.now(),
      trend: 'stable',
    };
  }
}
