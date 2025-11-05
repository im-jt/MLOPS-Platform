import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';

type ComponentSource = 'in-house' | 'oss' | 'cloud' | 'third-party';
type ComponentLifecycle = 'planned' | 'in-experiment' | 'active' | 'deprecated';

interface PlatformComponent {
  id: string;
  planeId: string;
  domainId: string;
  name: string;
  description: string;
  source: ComponentSource;
  lifecycle: ComponentLifecycle;
  approvals: Array<{ id: string; requestedBy: string; status: 'pending' | 'approved' | 'rejected'; notes?: string; createdAt: number; updatedAt: number }>;
  metrics?: string[];
  owners?: string[];
  guardrails?: string[];
  interfaces?: string[];
  notes?: string;
}

interface PlaneTelemetry {
  planeId: string;
  lifecycleBreakdown: Record<ComponentLifecycle, number>;
  sourceBreakdown: Record<ComponentSource, number>;
  lastUpdated: number;
}

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

app.use(cors());
app.use(express.json());

const components = new Map<string, PlatformComponent>();

function seedData() {
  const seedComponents: PlatformComponent[] = [
    {
      id: randomUUID(),
      planeId: 'control',
      domainId: 'api-governance',
      name: 'Michelangelo API Server',
      description: 'Extends Kubernetes API machinery with ML-specific resources.',
      source: 'in-house',
      lifecycle: 'active',
      approvals: [],
      metrics: ['p99 latency', 'error budget consumption'],
      owners: ['ML Platform Control Plane'],
    },
    {
      id: randomUUID(),
      planeId: 'control',
      domainId: 'controller-manager',
      name: 'Build Controller',
      description: 'Automates Docker/Bazel image builds and caches artifacts.',
      source: 'in-house',
      lifecycle: 'active',
      approvals: [],
      metrics: ['build success rate', 'median build duration'],
    },
    {
      id: randomUUID(),
      planeId: 'offline',
      domainId: 'training-orchestration',
      name: 'Ray-based Trainers',
      description: 'Unified trainers for PyTorch, TensorFlow, XGBoost, and LLM fine-tuning.',
      source: 'oss',
      lifecycle: 'active',
      approvals: [],
    },
    {
      id: randomUUID(),
      planeId: 'online',
      domainId: 'inference-services',
      name: 'Runtime Validation Hooks',
      description: 'Ensures champion/challenger comparisons before traffic shifts.',
      source: 'in-house',
      lifecycle: 'in-experiment',
      approvals: [],
      guardrails: ['Block promotion without validation results'],
    },
    {
      id: randomUUID(),
      planeId: 'genai',
      domainId: 'gateway',
      name: 'Provider Router',
      description: 'Abstraction over third-party APIs and in-house hosted models.',
      source: 'in-house',
      lifecycle: 'planned',
      approvals: [],
    },
  ];

  for (const component of seedComponents) {
    components.set(component.id, component);
  }
}

seedData();

function computeTelemetry(): PlaneTelemetry[] {
  const telemetryMap = new Map<string, PlaneTelemetry>();

  for (const component of components.values()) {
    let planeTelemetry = telemetryMap.get(component.planeId);
    if (!planeTelemetry) {
      planeTelemetry = {
        planeId: component.planeId,
        lifecycleBreakdown: {
          planned: 0,
          'in-experiment': 0,
          active: 0,
          deprecated: 0,
        },
        sourceBreakdown: {
          'in-house': 0,
          oss: 0,
          cloud: 0,
          'third-party': 0,
        },
        lastUpdated: Date.now(),
      };
      telemetryMap.set(component.planeId, planeTelemetry);
    }
    planeTelemetry.lifecycleBreakdown[component.lifecycle] += 1;
    planeTelemetry.sourceBreakdown[component.source] += 1;
    planeTelemetry.lastUpdated = Date.now();
  }

  return Array.from(telemetryMap.values());
}

function broadcastTelemetry() {
  const payload = JSON.stringify({ type: 'telemetry', data: computeTelemetry() });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

app.get('/api/architecture/components', (_req, res) => {
  res.json(Array.from(components.values()));
});

app.post('/api/architecture/components', (req, res) => {
  const { planeId, domainId, name, description, source, lifecycle } = req.body;
  if (!planeId || !domainId || !name || !description || !source || !lifecycle) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const newComponent: PlatformComponent = {
    id: randomUUID(),
    planeId,
    domainId,
    name,
    description,
    source,
    lifecycle,
    approvals: [],
    metrics: req.body.metrics ?? [],
    owners: req.body.owners ?? [],
    guardrails: req.body.guardrails ?? [],
    interfaces: req.body.interfaces ?? [],
    notes: req.body.notes,
  };

  components.set(newComponent.id, newComponent);
  broadcastTelemetry();
  res.status(201).json(newComponent);
});

app.patch('/api/architecture/components/:id', (req, res) => {
  const { id } = req.params;
  const component = components.get(id);
  if (!component) {
    return res.status(404).json({ message: 'Component not found' });
  }

  const updated: PlatformComponent = {
    ...component,
    ...req.body,
    approvals: component.approvals,
  };
  components.set(id, updated);
  broadcastTelemetry();
  res.json(updated);
});

app.post('/api/architecture/components/:id/approvals', (req, res) => {
  const { id } = req.params;
  const component = components.get(id);
  if (!component) {
    return res.status(404).json({ message: 'Component not found' });
  }
  const approval = {
    id: randomUUID(),
    requestedBy: req.body.requestedBy ?? 'unknown',
    status: 'pending' as const,
    notes: req.body.notes,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  component.approvals.push(approval);
  components.set(component.id, component);
  broadcastTelemetry();
  res.status(201).json(approval);
});

app.patch('/api/architecture/components/:id/approvals/:approvalId', (req, res) => {
  const { id, approvalId } = req.params;
  const component = components.get(id);
  if (!component) {
    return res.status(404).json({ message: 'Component not found' });
  }
  const approval = component.approvals.find((item) => item.id === approvalId);
  if (!approval) {
    return res.status(404).json({ message: 'Approval not found' });
  }

  const status = req.body.status as 'pending' | 'approved' | 'rejected';
  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }
  approval.status = status;
  approval.notes = req.body.notes ?? approval.notes;
  approval.updatedAt = Date.now();

  components.set(component.id, component);
  broadcastTelemetry();
  res.json(approval);
});

app.get('/api/architecture/telemetry', (_req, res) => {
  res.json(computeTelemetry());
});

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'telemetry', data: computeTelemetry() }));
});

const port = process.env.PORT ?? 4000;
httpServer.listen(port, () => {
  console.log(`Architecture API listening on port ${port}`);
});
