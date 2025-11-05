import { Injectable, computed, effect, signal } from '@angular/core';
import {
  ArchitectureState,
  GenAiCapability,
  MesDimension,
  PlaneDomain,
  PlatformComponent,
  PlatformPlane,
  PlatformPlaneId,
  PlatformPillar,
  ProjectTier,
} from '../models/platform-architecture.model';

const STORAGE_KEY = 'ml-platform-architecture-state';

const DEFAULT_PILLARS: PlatformPillar[] = [
  {
    id: 'modular-core',
    title: 'Modular Plug-and-Play Core',
    narrative:
      'Composable foundation that lets teams swap best-in-class platform components without breaking the developer workflow.',
    northStars: [
      'Every platform capability is exposed via contract-first APIs and CRDs.',
      'New infra integrations land in days, not quarters.',
      'Hybrid in-house, OSS, and third-party components co-exist safely.',
    ],
    keyEnablers: [
      'Kubernetes operator pattern for lifecycle automation',
      'Contract tests for component conformance',
      'Metadata backbone with lineage and audit trails',
    ],
    metrics: ['Mean days to onboard component', 'Percent of workloads on golden templates', 'Change failure rate'],
  },
  {
    id: 'developer-experience',
    title: 'Developer Velocity & Collaboration',
    narrative:
      'Frictionless experience for ML engineers and applied scientists across local dev, remote iteration, and collaborative reviews.',
    northStars: [
      'Single workflow from notebook to production pipeline',
      'Everything as code with Git-backed reviews',
      'Self-service scaffolding and templates for common patterns',
    ],
    keyEnablers: [
      'MA Studio unified UI',
      'Canvas ML application framework',
      'Pre-baked dev containers and CI/CD hooks',
    ],
    metrics: ['Time to first model run', 'PR cycle time', 'Template adoption rate'],
  },
  {
    id: 'production-reliability',
    title: 'Production Reliability & Automation',
    narrative:
      'Operate fleets of models with safe rollouts, automated retraining, and proactive incident response.',
    northStars: [
      'Zonal, progressive rollouts with automated rollback triggers',
      'Scheduled and event-driven retraining built into blueprints',
      'Runtime validation before traffic cutover',
    ],
    keyEnablers: [
      'Deployment controllers with guardrails',
      'Temporal/Cadence workflow automation',
      'Integrated SLA and paging policies',
    ],
    metrics: ['Change failure rate', 'Mean time to recovery', 'Percent rollbacks auto-triggered'],
  },
  {
    id: 'model-quality',
    title: 'Model Quality & Compliance',
    narrative:
      'Measurable quality gates and compliance posture across the model lifecycle with Model Excellence Score (MES).',
    northStars: [
      'MES scorecard for every production deployment',
      'Quality signals captured at training, evaluation, and serving',
      'Tier-aware governance with automated enforcement',
    ],
    keyEnablers: [
      'Feature and prediction monitoring',
      'Bias and fairness toolkits',
      'Programmatic approvals and attestations',
    ],
    metrics: ['Percent models meeting MES targets', 'Time to remediate SLA breaches', 'Audit completion rate'],
  },
];

const CONTROL_PLANE_DOMAINS: PlaneDomain[] = [
  {
    id: 'api-governance',
    title: 'Unified API Server & Governance',
    summary: 'Kubernetes-native API surface for ML entities with GitOps-friendly declarative specs.',
    responsibilities: [
      'Expose CRDs for Project, FeatureSet, Pipeline, Model, InferenceService, Deployment',
      'Maintain versioned state with audit logs and immutability guarantees',
      'Provide policy hooks for security, cost, and compliance review',
    ],
    components: [
      {
        id: 'api-server',
        name: 'Michelangelo API Server',
        description: 'Extends Kubernetes API machinery with ML-specific resources.',
        source: 'in-house',
        lifecycle: 'active',
        owners: ['ML Platform Control Plane'],
        interfaces: ['kubectl', 'GraphQL gateway', 'REST SDK'],
        metrics: ['p99 latency', 'error budget consumption'],
      },
      {
        id: 'cadence-orchestration',
        name: 'Cadence / Temporal Workflows',
        description: 'Long-running workflow orchestrator for lifecycle state machines.',
        source: 'oss',
        lifecycle: 'active',
        owners: ['Runtime Automation'],
        metrics: ['workflow success rate'],
      },
      {
        id: 'policy-engine',
        name: 'OPA / Cedar Policy Engine',
        description: 'Enforce tier-based policies, approvals, and guardrails before promotions.',
        source: 'oss',
        lifecycle: 'in-experiment',
        guardrails: ['Signed attestation required for tier-1 deploy'],
      },
    ],
    integrationPoints: ['Platform metadata store', 'RBAC / IAM', 'Audit logging pipeline'],
    automationLevel: 'fully-automated',
  },
  {
    id: 'controller-manager',
    title: 'Controller Manager',
    summary: 'Operator controllers managing builds, pipelines, jobs, endpoints, and inference servers.',
    responsibilities: [
      'Reconcile desired state for notebooks, pipelines, and deployments',
      'Trigger build images and infrastructure provisioning',
      'Coordinate with workflow orchestration systems',
    ],
    components: [
      {
        id: 'build-controller',
        name: 'Build Controller',
        description: 'Automates Docker/Bazel image builds and caches artifacts.',
        source: 'in-house',
        lifecycle: 'active',
        metrics: ['build success rate', 'median build duration'],
      },
      {
        id: 'pipeline-controller',
        name: 'Pipeline Controller',
        description: 'Instantiates Canvas pipelines across Ray, Spark, and Flink backends.',
        source: 'in-house',
        lifecycle: 'active',
        metrics: ['pipeline SLA adherence'],
      },
      {
        id: 'endpoint-controller',
        name: 'Endpoint Controller',
        description: 'Manages inference endpoints, rollout strategy, and runtime validation.',
        source: 'in-house',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Buildkite', 'uBuild cache', 'Kubernetes clusters'],
    automationLevel: 'fully-automated',
  },
  {
    id: 'developer-entrypoints',
    title: 'Developer Entry Points',
    summary: 'Interfaces used by ML practitioners: MA Studio, CLI, and CI/CD integrations.',
    responsibilities: [
      'Surface templates, job history, and debugging information',
      'Allow UI-driven edits that sync back to Git',
      'Provide CLIs for scripting and automation',
    ],
    components: [
      {
        id: 'ma-studio',
        name: 'MA Studio UI',
        description: 'Unified web experience covering feature prep, training, deployment, and monitoring.',
        source: 'in-house',
        lifecycle: 'active',
        metrics: ['weekly active users'],
      },
      {
        id: 'canvas-cli',
        name: 'Canvas CLI',
        description: 'Code-first interface for pipeline management and GitOps flows.',
        source: 'in-house',
        lifecycle: 'active',
      },
      {
        id: 'buildkite-pipeline',
        name: 'Buildkite CI Integration',
        description: 'Continuous integration for ML monorepo with automated validations.',
        source: 'third-party',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Git monorepo', 'AuthN/AuthZ', 'Notebook environment provisioning'],
    automationLevel: 'semi-automated',
  },
];

const OFFLINE_PLANE_DOMAINS: PlaneDomain[] = [
  {
    id: 'feature-pipelines',
    title: 'Feature Engineering Pipelines',
    summary: 'Batch and streaming jobs that produce reusable feature sets.',
    responsibilities: [
      'Author reusable feature DAGs with checkpoints',
      'Ensure consistency between offline and online stores',
      'Track lineage of feature transformations',
    ],
    components: [
      {
        id: 'canvas-pipeline-templates',
        name: 'Canvas Pipeline Templates',
        description: 'Declarative DAGs for ETL, training, evaluation, and custom stages.',
        source: 'in-house',
        lifecycle: 'active',
      },
      {
        id: 'feature-store',
        name: 'Dual-mode Feature Store',
        description: 'Batch and streaming feature catalog built on S3/TeraBlob and Kafka.',
        source: 'in-house',
        lifecycle: 'active',
        metrics: ['feature freshness', 'serve latency parity'],
      },
      {
        id: 'data-quality',
        name: 'Data Quality Assertions',
        description: 'Great Expectations + custom validators executed as pipeline gates.',
        source: 'oss',
        lifecycle: 'in-experiment',
      },
    ],
    integrationPoints: ['S3/TeraBlob', 'Hive/HDFS', 'Metadata store'],
    automationLevel: 'semi-automated',
  },
  {
    id: 'training-orchestration',
    title: 'Training & Evaluation Orchestration',
    summary: 'Scalable compute for classical ML, deep learning, and AutoML workloads.',
    responsibilities: [
      'Run distributed training jobs on Ray and Spark',
      'Support elastic Horovod and Ray Tune',
      'Package artifacts with lineage and reproducibility metadata',
    ],
    components: [
      {
        id: 'ray-trainers',
        name: 'Ray-based Trainers',
        description: 'Unified trainers for PyTorch, TensorFlow, XGBoost, and LLM fine-tuning.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'incremental-training',
        name: 'Incremental Training Engine',
        description: 'Supports warm-start and partial retraining with lineage checks.',
        source: 'in-house',
        lifecycle: 'in-experiment',
      },
      {
        id: 'evaluation-reports',
        name: 'Evaluation Reporting',
        description: 'Generates MES-aware evaluation reports with visualization.',
        source: 'in-house',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['GPU resource manager', 'Experiment tracking', 'Artifact repository'],
    automationLevel: 'semi-automated',
  },
  {
    id: 'artifact-lineage',
    title: 'Artifact & Lineage Management',
    summary: 'Immutable storage of datasets, models, and evaluations with lineage graph.',
    responsibilities: [
      'Store artifacts in distributed registry',
      'Index metadata for search and compliance audits',
      'Emit lineage graph for root-cause analysis',
    ],
    components: [
      {
        id: 'artifact-registry',
        name: 'Artifact Registry',
        description: 'Immutable storage for models, datasets, and container images.',
        source: 'cloud',
        lifecycle: 'active',
      },
      {
        id: 'metadata-store',
        name: 'Metadata Store',
        description: 'MLMD/MLflow-backed metadata with search APIs.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'lineage-graph',
        name: 'Lineage Graph Service',
        description: 'Graph DB capturing relationships between code, data, and models.',
        source: 'in-house',
        lifecycle: 'planned',
      },
    ],
    integrationPoints: ['Compliance engine', 'MES scorecards', 'Observability platform'],
    automationLevel: 'semi-automated',
  },
];

const ONLINE_PLANE_DOMAINS: PlaneDomain[] = [
  {
    id: 'inference-services',
    title: 'Inference Services',
    summary: 'Low-latency serving stack with GPU acceleration and safe rollout features.',
    responsibilities: [
      'Serve multi-framework models using Triton/ONNX/Custom runners',
      'Handle autoscaling, A/B, and shadow deployments',
      'Provide runtime validation and rollback hooks',
    ],
    components: [
      {
        id: 'ops-triton',
        name: 'OPS / Triton',
        description: 'Nvidia Triton-based inference runtime managed by Michelangelo.',
        source: 'oss',
        lifecycle: 'active',
        metrics: ['p95 latency', 'GPU utilization'],
      },
      {
        id: 'palette-lib',
        name: 'PaletteLib',
        description: 'Uber-provided library to simplify model integration and logging.',
        source: 'in-house',
        lifecycle: 'active',
      },
      {
        id: 'runtime-validation',
        name: 'Runtime Validation Hooks',
        description: 'Ensures champion/challenger comparisons before traffic shifts.',
        source: 'in-house',
        lifecycle: 'in-experiment',
      },
    ],
    integrationPoints: ['Endpoint controller', 'Service mesh', 'Traffic shaping services'],
    automationLevel: 'fully-automated',
  },
  {
    id: 'feature-serving',
    title: 'Online Feature Serving',
    summary: 'Sub-millisecond feature retrieval backed by Redis, Cassandra, and streaming pipelines.',
    responsibilities: [
      'Sync offline feature definitions into online cache',
      'Provide request logging and quality probes',
      'Support near real-time updates via streaming jobs',
    ],
    components: [
      {
        id: 'redis-store',
        name: 'Redis Low-Latency Store',
        description: 'Key-value store for hot features with SLA monitoring.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'cassandra-store',
        name: 'Cassandra Feature Store',
        description: 'Multi-region consistent store for durable features.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'nrp-feature-compute',
        name: 'NRT Feature Computation Flink Jobs',
        description: 'Streaming jobs computing near-real-time features.',
        source: 'oss',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Kafka', 'Pinot analytics', 'Monitoring stack'],
    automationLevel: 'semi-automated',
  },
  {
    id: 'observability',
    title: 'Observability & Guardrails',
    summary: 'Unified monitoring, alerting, and SLA enforcement for online predictions.',
    responsibilities: [
      'Collect prediction metrics, feature parity, and drift signals',
      'Compute MES real-time dimensions and feed dashboards',
      'Trigger auto-mitigation workflows and ticketing',
    ],
    components: [
      {
        id: 'pinot-analytics',
        name: 'Pinot Real-time Analytics',
        description: 'Stores high-volume prediction logs for exploration.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'mes-dashboard',
        name: 'MES Dashboard',
        description: 'Surface Model Excellence Score and SLA adherence for stakeholders.',
        source: 'in-house',
        lifecycle: 'in-experiment',
      },
      {
        id: 'incident-automation',
        name: 'Incident Automation',
        description: 'Integrates with PagerDuty / Slack for tier-based escalation.',
        source: 'third-party',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Up', 'UDG', 'UCS/Flipr', 'Enterprise observability stack'],
    automationLevel: 'semi-automated',
  },
];

const GENAI_PLANE_DOMAINS: PlaneDomain[] = [
  {
    id: 'gateway',
    title: 'GenAI Gateway',
    summary: 'Unified entry point for internal and external large language models.',
    responsibilities: [
      'Route requests to approved providers with auditing and cost guardrails',
      'Apply safety filters, PII redaction, and policy enforcement',
      'Capture usage telemetry for optimization and governance',
    ],
    components: [
      {
        id: 'provider-router',
        name: 'Provider Router',
        description: 'Abstraction over third-party APIs and in-house hosted models.',
        source: 'in-house',
        lifecycle: 'active',
      },
      {
        id: 'safety-pipeline',
        name: 'Safety & Policy Guardrails',
        description: 'Moderation, jailbreak detection, and policy enforcement services.',
        source: 'in-house',
        lifecycle: 'in-experiment',
      },
      {
        id: 'usage-metering',
        name: 'Usage Metering & Cost Controls',
        description: 'Tracks token usage per team with auto alerting and budget caps.',
        source: 'in-house',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Identity platform', 'Billing systems', 'Prompt catalog'],
    automationLevel: 'semi-automated',
  },
  {
    id: 'llmops',
    title: 'LLMOps Pipelines',
    summary: 'Fine-tuning, evaluation, and deployment workflows for large language models.',
    responsibilities: [
      'Prepare and redact training datasets',
      'Execute PEFT/DeepSpeed training with elastic GPU scheduling',
      'Evaluate prompts and model variants with human/auto raters',
    ],
    components: [
      {
        id: 'hf-integration',
        name: 'Hugging Face Integration',
        description: 'Pulls base models and adapters for fine-tuning workloads.',
        source: 'oss',
        lifecycle: 'active',
      },
      {
        id: 'deepspeed-orchestrator',
        name: 'DeepSpeed Orchestrator',
        description: 'Enables model parallelism across GPU clusters.',
        source: 'oss',
        lifecycle: 'in-experiment',
      },
      {
        id: 'eval-framework',
        name: 'LLM Evaluation Framework',
        description: 'Supports win-rate comparisons, rubric scoring, and regression suites.',
        source: 'in-house',
        lifecycle: 'active',
      },
    ],
    integrationPoints: ['Ray clusters', 'Annotation tools', 'Model catalog'],
    automationLevel: 'semi-automated',
  },
  {
    id: 'applications',
    title: 'GenAI Application Enablement',
    summary: 'Reusable building blocks for assistants, automation, and product experiences.',
    responsibilities: [
      'Provide prompt engineering toolkit with versioning',
      'Offer evaluation harness for regression testing',
      'Expose SDKs for conversation state, grounding, and tool-use',
    ],
    components: [
      {
        id: 'prompt-library',
        name: 'Prompt Library & Templates',
        description: 'Centralized, version-controlled prompts and chains.',
        source: 'in-house',
        lifecycle: 'active',
      },
      {
        id: 'assistant-sdk',
        name: 'Assistant SDK',
        description: 'Opinionated SDK for building multi-turn assistant experiences.',
        source: 'in-house',
        lifecycle: 'in-experiment',
      },
      {
        id: 'guardrail-kit',
        name: 'Guardrail Kit',
        description: 'Reusable pipelines for jailbreak, toxicity, and hallucination checks.',
        source: 'in-house',
        lifecycle: 'planned',
      },
    ],
    integrationPoints: ['Observability stack', 'Ticketing systems', 'Experimentation platform'],
    automationLevel: 'manual',
  },
];

const DEFAULT_PLANES: PlatformPlane[] = [
  {
    id: 'control',
    name: 'Control Plane',
    mission:
      'Provide declarative APIs, lifecycle automation, and policy enforcement for every ML artifact.',
    highlights: [
      'Kubernetes-native CRDs for ML entities',
      'GitOps friendly workflow with UI and CLI parity',
      'Embedded compliance via policy-as-code',
    ],
    domains: CONTROL_PLANE_DOMAINS,
    sharedServices: ['Identity & Access Management', 'Audit Log Pipeline', 'Secret Management'],
    complianceHooks: ['Tier-based approval flow', 'Security scanning', 'Cost attribution'],
  },
  {
    id: 'offline',
    name: 'Offline Plane',
    mission: 'Execute big-data processing, feature engineering, and large-scale model training.',
    highlights: [
      'Canvas DAGs with resumable checkpoints',
      'Ray-powered distributed training with Horovod elasticity',
      'Immutable artifact and metadata tracking',
    ],
    domains: OFFLINE_PLANE_DOMAINS,
    sharedServices: ['Ray Cluster Federation', 'Spark Operator', 'Data Lakehouse'],
    complianceHooks: ['Dataset privacy tagging', 'Lineage metadata emission'],
  },
  {
    id: 'online',
    name: 'Online Plane',
    mission: 'Serve models and features with low latency and deep observability.',
    highlights: [
      'Safe rollout and runtime validation for tiered models',
      'Unified feature serving across streaming and cache layers',
      'Continuous MES monitoring with automated mitigation',
    ],
    domains: ONLINE_PLANE_DOMAINS,
    sharedServices: ['Service Mesh', 'Centralized logging', 'Realtime analytics'],
    complianceHooks: ['Operational SLA enforcement', 'Secure endpoint configuration'],
  },
  {
    id: 'genai',
    name: 'Generative AI Plane',
    mission: 'Extend the platform with LLMOps capabilities, cost guardrails, and safety primitives.',
    highlights: [
      'Single gateway for third-party and in-house LLMs',
      'Fine-tuning pipelines with elastic GPU management',
      'Evaluation toolkit for prompts, models, and safety',
    ],
    domains: GENAI_PLANE_DOMAINS,
    sharedServices: ['GPU federation', 'Prompt catalog', 'Usage analytics'],
    complianceHooks: ['PII redaction', 'Safety scoring', 'Usage budget enforcement'],
  },
];

const DEFAULT_TIERS: ProjectTier[] = [
  {
    id: 'tier-1',
    label: 'Tier 1 - Mission Critical',
    description:
      'Models that power core trip, safety, or fraud experiences with direct revenue or safety impact.',
    exampleUseCases: ['ETA estimation', 'Safety incident detection', 'Fraud risk scoring'],
    obligations: [
      '24/7 on-call with PagerDuty integration',
      'MES score >= 0.85 with zero red dimensions',
      'Dual approval (platform + business) for production deploys',
    ],
    supportModel: 'Dedicated platform partner and proactive health reviews',
    reviewCadence: 'Weekly production review, monthly deep-dive',
  },
  {
    id: 'tier-2',
    label: 'Tier 2 - High Impact',
    description: 'Models influencing non-critical but high-volume business flows.',
    exampleUseCases: ['Incentive optimization', 'Marketplace matching', 'Churn propensity'],
    obligations: [
      'MES score >= 0.75 with remediation within 7 days',
      'Automated rollback configured',
      'Quarterly compliance attestation',
    ],
    supportModel: 'Shared support rotation and monthly office hours',
    reviewCadence: 'Bi-weekly review',
  },
  {
    id: 'tier-3',
    label: 'Tier 3 - Growth & Emerging',
    description: 'Experiments and growth initiatives with moderate blast radius.',
    exampleUseCases: ['Experimentation models', 'Personalization pilots'],
    obligations: [
      'Basic MES reporting with manual health checks',
      'Documented rollback plan',
      'Data retention policy compliance',
    ],
    supportModel: 'Self-service with community slack channel',
    reviewCadence: 'Monthly review',
  },
  {
    id: 'tier-4',
    label: 'Tier 4 - Exploratory',
    description: 'Proof-of-concept models and hackathon projects with limited exposure.',
    exampleUseCases: ['Prototype copilots', 'Data exploration notebooks'],
    obligations: [
      'Opt-in MES tracking',
      'No production data access by default',
      'Cleanup after 90 days unless promoted',
    ],
    supportModel: 'Best effort support, self-service documentation',
    reviewCadence: 'Ad-hoc',
  },
];

const DEFAULT_MES_DIMENSIONS: MesDimension[] = [
  {
    id: 'training-accuracy',
    name: 'Training Quality',
    stage: 'training',
    description: 'Measures performance of the model on training and validation datasets.',
    metricExamples: ['AUC', 'RMSE', 'BLEU score'],
    defaultThresholdGuidance: 'Tier-1 requires >= 0.5% improvement over last GA release.',
    escalationPolicy: 'Raise blocking review if threshold not met before promotion.',
  },
  {
    id: 'prediction-accuracy',
    name: 'Online Prediction Accuracy',
    stage: 'serving',
    description: 'Quantifies live model effectiveness using ground-truth backfills and shadow logs.',
    metricExamples: ['Hit rate', 'Error@k', 'Precision/Recall'],
    defaultThresholdGuidance: 'Within 2% of offline evaluation with 95% confidence.',
    escalationPolicy: 'Auto rollback for tier-1 if deviation persists > 30 minutes.',
  },
  {
    id: 'model-freshness',
    name: 'Model Freshness',
    stage: 'evaluation',
    description: 'Ensures retraining cadence and data staleness stay within limits.',
    metricExamples: ['Days since last retrain', 'Data drift distance'],
    defaultThresholdGuidance: 'Tier-1 retrains <= 14 days, Tier-2 <= 30 days.',
    escalationPolicy: 'Open ticket if breach persists beyond grace window.',
  },
  {
    id: 'feature-quality',
    name: 'Feature Quality & Drift',
    stage: 'development',
    description: 'Tracks data quality, schema adherence, and training-serving skew.',
    metricExamples: ['Drift PSI', 'Missing value ratio', 'Schema diff count'],
    defaultThresholdGuidance: 'PSI < 0.2 for high-impact features.',
    escalationPolicy: 'Alert feature owners and block deploy if unresolved in 48 hours.',
  },
  {
    id: 'responsible-ai',
    name: 'Responsible AI & Fairness',
    stage: 'serving',
    description: 'Evaluates bias, fairness, and alignment with policy commitments.',
    metricExamples: ['Demographic parity', 'Toxicity rate', 'Safety policy violations'],
    defaultThresholdGuidance: 'Tier-1 requires documented fairness assessment for each release.',
    escalationPolicy: 'Escalate to Responsible AI council for review.',
  },
];

const DEFAULT_GENAI_CAPABILITIES: GenAiCapability[] = [
  {
    id: 'productivity',
    name: 'Internal Productivity Assistants',
    description: 'Assist engineers and operators with summarization, code generation, and ticket drafting.',
    capabilities: [
      'Context-aware summarization of notebook runs',
      'Automated incident postmortem drafts',
      'Documentation copilots integrated with MA Studio',
    ],
    guardrails: ['PII redaction enforced', 'Audit logging of prompts/responses'],
    costControls: ['Usage caps per user group', 'Off-peak batching for heavy jobs'],
  },
  {
    id: 'operations',
    name: 'Operational Automation',
    description: 'Automate content moderation, support flows, and business operations.',
    capabilities: [
      'Workflow automation with tool invocation',
      'Quality checks with human-in-the-loop',
      'Declarative guardrails for critical actions',
    ],
    guardrails: ['Tier-based approval workflows', 'Human verification for irreversible actions'],
    costControls: ['Runbooks for on-prem vs cloud usage', 'Provider selection optimization'],
  },
  {
    id: 'experience',
    name: 'Magical User Experiences',
    description: 'Enhance rider, earner, and eater experiences with conversational and personalized interactions.',
    capabilities: [
      'Conversational search with enterprise grounding',
      'Personalized recommendations using hybrid models',
      'Multimodal support for voice and image inputs',
    ],
    guardrails: ['Safety scoring for outputs', 'Real-time feedback collection'],
    costControls: ['Latency-aware routing', 'Shadow evaluation before feature flags'],
  },
];

const DEFAULT_STATE: ArchitectureState = {
  pillars: DEFAULT_PILLARS,
  planes: DEFAULT_PLANES,
  tiers: DEFAULT_TIERS,
  mesDimensions: DEFAULT_MES_DIMENSIONS,
  genAiCapabilities: DEFAULT_GENAI_CAPABILITIES,
  lastUpdated: Date.now(),
};

@Injectable({ providedIn: 'root' })
export class PlatformArchitectureService {
  private readonly state = signal<ArchitectureState>(this.loadInitialState());

  readonly pillars = computed(() => this.state().pillars);
  readonly planes = computed(() => this.state().planes);
  readonly tiers = computed(() => this.state().tiers);
  readonly mesDimensions = computed(() => this.state().mesDimensions);
  readonly genAiCapabilities = computed(() => this.state().genAiCapabilities);
  readonly lastUpdated = computed(() => this.state().lastUpdated);

  constructor() {
    effect(() => {
      const snapshot = this.state();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.error('Failed to persist platform architecture state', error);
      }
    }, { allowSignalWrites: true });
  }

  resetState(): void {
    this.state.set({ ...DEFAULT_STATE, lastUpdated: Date.now() });
  }

  updatePillar(pillarId: PlatformPillar['id'], updates: Partial<PlatformPillar>): void {
    this.state.update((current) => {
      const index = current.pillars.findIndex((p) => p.id === pillarId);
      if (index === -1) {
        return current;
      }
      const nextPillars = [...current.pillars];
      nextPillars[index] = { ...nextPillars[index], ...updates };
      return { ...current, pillars: nextPillars, lastUpdated: Date.now() };
    });
  }

  updatePlane(planeId: PlatformPlaneId, updates: Partial<PlatformPlane>): void {
    this.state.update((current) => {
      const index = current.planes.findIndex((plane) => plane.id === planeId);
      if (index === -1) {
        return current;
      }
      const nextPlanes = [...current.planes];
      nextPlanes[index] = { ...nextPlanes[index], ...updates };
      return { ...current, planes: nextPlanes, lastUpdated: Date.now() };
    });
  }

  updatePlaneDomain(
    planeId: PlatformPlaneId,
    domainId: string,
    updates: Partial<PlaneDomain>,
  ): void {
    this.state.update((current) => {
      const planeIndex = current.planes.findIndex((plane) => plane.id === planeId);
      if (planeIndex === -1) {
        return current;
      }
      const plane = current.planes[planeIndex];
      const domainIndex = plane.domains.findIndex((domain) => domain.id === domainId);
      if (domainIndex === -1) {
        return current;
      }
      const updatedDomain: PlaneDomain = { ...plane.domains[domainIndex], ...updates };
      const updatedDomains = [...plane.domains];
      updatedDomains[domainIndex] = updatedDomain;
      const updatedPlane: PlatformPlane = { ...plane, domains: updatedDomains };
      const updatedPlanes = [...current.planes];
      updatedPlanes[planeIndex] = updatedPlane;
      return { ...current, planes: updatedPlanes, lastUpdated: Date.now() };
    });
  }

  addComponentToDomain(
    planeId: PlatformPlaneId,
    domainId: string,
    component: PlatformComponent,
  ): void {
    this.state.update((current) => {
      const planeIndex = current.planes.findIndex((plane) => plane.id === planeId);
      if (planeIndex === -1) {
        return current;
      }
      const plane = current.planes[planeIndex];
      const domainIndex = plane.domains.findIndex((domain) => domain.id === domainId);
      if (domainIndex === -1) {
        return current;
      }
      const domain = plane.domains[domainIndex];
      const updatedDomain: PlaneDomain = {
        ...domain,
        components: [...domain.components, component],
      };
      const updatedDomains = [...plane.domains];
      updatedDomains[domainIndex] = updatedDomain;
      const updatedPlane: PlatformPlane = { ...plane, domains: updatedDomains };
      const updatedPlanes = [...current.planes];
      updatedPlanes[planeIndex] = updatedPlane;
      return { ...current, planes: updatedPlanes, lastUpdated: Date.now() };
    });
  }

  updateComponent(
    planeId: PlatformPlaneId,
    domainId: string,
    componentId: string,
    updates: Partial<PlatformComponent>,
  ): void {
    this.state.update((current) => {
      const planeIndex = current.planes.findIndex((plane) => plane.id === planeId);
      if (planeIndex === -1) {
        return current;
      }
      const plane = current.planes[planeIndex];
      const domainIndex = plane.domains.findIndex((domain) => domain.id === domainId);
      if (domainIndex === -1) {
        return current;
      }
      const domain = plane.domains[domainIndex];
      const componentIndex = domain.components.findIndex((component) => component.id === componentId);
      if (componentIndex === -1) {
        return current;
      }
      const updatedComponents = [...domain.components];
      updatedComponents[componentIndex] = {
        ...updatedComponents[componentIndex],
        ...updates,
      };
      const updatedDomain: PlaneDomain = { ...domain, components: updatedComponents };
      const updatedDomains = [...plane.domains];
      updatedDomains[domainIndex] = updatedDomain;
      const updatedPlane: PlatformPlane = { ...plane, domains: updatedDomains };
      const updatedPlanes = [...current.planes];
      updatedPlanes[planeIndex] = updatedPlane;
      return { ...current, planes: updatedPlanes, lastUpdated: Date.now() };
    });
  }

  updateTier(tierId: ProjectTier['id'], updates: Partial<ProjectTier>): void {
    this.state.update((current) => {
      const index = current.tiers.findIndex((tier) => tier.id === tierId);
      if (index === -1) {
        return current;
      }
      const nextTiers = [...current.tiers];
      nextTiers[index] = { ...nextTiers[index], ...updates };
      return { ...current, tiers: nextTiers, lastUpdated: Date.now() };
    });
  }

  updateMesDimension(dimensionId: string, updates: Partial<MesDimension>): void {
    this.state.update((current) => {
      const index = current.mesDimensions.findIndex((dimension) => dimension.id === dimensionId);
      if (index === -1) {
        return current;
      }
      const nextDimensions = [...current.mesDimensions];
      nextDimensions[index] = { ...nextDimensions[index], ...updates };
      return { ...current, mesDimensions: nextDimensions, lastUpdated: Date.now() };
    });
  }

  updateGenAiCapability(capabilityId: string, updates: Partial<GenAiCapability>): void {
    this.state.update((current) => {
      const index = current.genAiCapabilities.findIndex((capability) => capability.id === capabilityId);
      if (index === -1) {
        return current;
      }
      const nextCapabilities = [...current.genAiCapabilities];
      nextCapabilities[index] = { ...nextCapabilities[index], ...updates };
      return { ...current, genAiCapabilities: nextCapabilities, lastUpdated: Date.now() };
    });
  }

  private loadInitialState(): ArchitectureState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ArchitectureState;
        return { ...parsed, lastUpdated: parsed.lastUpdated ?? Date.now() };
      }
    } catch (error) {
      console.warn('Falling back to default platform architecture state', error);
    }
    return { ...DEFAULT_STATE, lastUpdated: Date.now() };
  }
}
