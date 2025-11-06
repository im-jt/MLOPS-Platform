/**
 * Model Monitoring and Model Excellence Score (MES)
 * Tracks model quality, performance, and compliance
 */

export interface FeatureMonitoring {
  featureName: string;
  dataType: string;
  trainingDistribution: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    nullPercentage: number;
  };
  productionDistribution: {
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    nullPercentage: number;
  };
  drift: {
    detected: boolean;
    score: number; // 0-1, higher means more drift
    method: 'ks_test' | 'chi_square' | 'wasserstein';
  };
  lastChecked: number;
}

export interface ModelPerformanceMetric {
  timestamp: number;
  metricName: string;
  value: number;
  threshold?: number;
  isHealthy: boolean;
}

export interface ModelHealthAlert {
  id: string;
  modelId: string;
  deploymentId: string;
  severity: 'critical' | 'warning' | 'info';
  type: 'performance_degradation' | 'feature_drift' | 'data_quality' | 'latency' | 'error_rate';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  resolvedAt?: number;
}

/**
 * Model Excellence Score - Overall quality metric
 * Based on training accuracy, prediction accuracy, model freshness, feature quality
 */
export interface ModelExcellenceScore {
  overallScore: number; // 0-100
  components: {
    trainingAccuracy: {
      score: number;
      weight: number;
      value: number;
      target: number;
    };
    predictionAccuracy: {
      score: number;
      weight: number;
      value: number;
      target: number;
    };
    modelFreshness: {
      score: number;
      weight: number;
      daysSinceRetrain: number;
      targetDays: number;
    };
    featureQuality: {
      score: number;
      weight: number;
      driftScore: number;
      nullPercentage: number;
    };
    latency: {
      score: number;
      weight: number;
      p99: number;
      target: number;
    };
    availability: {
      score: number;
      weight: number;
      uptime: number;
      target: number;
    };
  };
  lastUpdated: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ModelMonitoring {
  modelId: string;
  deploymentId: string;
  mes: ModelExcellenceScore;
  featureMonitoring: FeatureMonitoring[];
  performanceMetrics: ModelPerformanceMetric[];
  alerts: ModelHealthAlert[];
  lastRetrainTime?: number;
  nextScheduledRetrain?: number;
}
