export type ComponentSource = 'in-house' | 'oss' | 'cloud' | 'third-party';

export type ComponentLifecycle = 'planned' | 'in-experiment' | 'active' | 'deprecated';

export interface ComponentApproval {
  id: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlatformComponent {
  id: string;
  name: string;
  description: string;
  source: ComponentSource;
  lifecycle: ComponentLifecycle;
  owners?: string[];
  interfaces?: string[];
  metrics?: string[];
  guardrails?: string[];
  notes?: string;
  approvals?: ComponentApproval[];
  planeId?: PlatformPlaneId;
  domainId?: string;
}

export interface PlaneDomain {
  id: string;
  title: string;
  summary: string;
  responsibilities: string[];
  components: PlatformComponent[];
  integrationPoints?: string[];
  automationLevel?: 'manual' | 'semi-automated' | 'fully-automated';
}

export type PlatformPlaneId = 'control' | 'offline' | 'online' | 'genai';

export interface PlatformPlane {
  id: PlatformPlaneId;
  name: string;
  mission: string;
  highlights: string[];
  domains: PlaneDomain[];
  sharedServices?: string[];
  complianceHooks?: string[];
}

export interface PlatformPillar {
  id: 'modular-core' | 'developer-experience' | 'production-reliability' | 'model-quality';
  title: string;
  narrative: string;
  northStars: string[];
  keyEnablers: string[];
  metrics: string[];
}

export interface ProjectTier {
  id: 'tier-1' | 'tier-2' | 'tier-3' | 'tier-4';
  label: string;
  description: string;
  exampleUseCases: string[];
  obligations: string[];
  supportModel: string;
  reviewCadence: string;
}

export interface MesDimension {
  id: string;
  name: string;
  stage: 'development' | 'training' | 'evaluation' | 'serving';
  description: string;
  metricExamples: string[];
  defaultThresholdGuidance: string;
  escalationPolicy: string;
}

export interface GenAiCapability {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  guardrails: string[];
  costControls: string[];
}

export interface ArchitectureState {
  pillars: PlatformPillar[];
  planes: PlatformPlane[];
  tiers: ProjectTier[];
  mesDimensions: MesDimension[];
  genAiCapabilities: GenAiCapability[];
  lastUpdated: number;
}

export interface PlaneTelemetry {
  planeId: PlatformPlaneId;
  lifecycleBreakdown: Record<ComponentLifecycle, number>;
  sourceBreakdown: Record<ComponentSource, number>;
  lastUpdated: number;
}
