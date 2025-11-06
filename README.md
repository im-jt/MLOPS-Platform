# ML Platform with MLOps

A comprehensive, enterprise-grade Machine Learning Platform inspired by Uber's Michelangelo, built with Angular 20. This platform provides end-to-end MLOps capabilities including project management, model development, training pipelines, deployment, monitoring, and generative AI features.

## 🎯 Architecture Overview

The platform follows a **three-plane architecture**:

### 1. **Control Plane**
- User-facing APIs and lifecycle management
- Kubernetes Operator design pattern
- Manages Projects, Pipelines, Models, Deployments, and Experiments

### 2. **Offline Data Plane**
- Heavy-lifting for big data processing
- Feature computation, model training, evaluation
- Supports Spark and Ray frameworks
- Batch inference workflows

### 3. **Online Data Plane**
- Real-time model inference and feature serving
- Low-latency prediction endpoints
- GPU-optimized serving with Triton

## 🚀 Key Features

### Project Management
- **Project Tiering System** (Tier 1-4)
  - Tier 1: Critical business models (ETA, fraud detection, safety)
  - Tier 2: Important business models
  - Tier 3: Standard models
  - Tier 4: Experimental/exploratory models
- **Model Excellence Score (MES)**: Comprehensive quality tracking
- **Project Dashboard**: Centralized view of all ML projects

### Model Development
- **Interactive Notebooks**: Jupyter-like environment for experimentation
- **Experiment Tracking**: Compare runs and track metrics
- **Hyperparameter Tuning**: Automated search across parameter spaces
- **Model Registry**: Centralized repository with versioning

### Training Pipelines
- **DAG-based Workflows**: Define complex multi-step pipelines
- **Framework Support**: TensorFlow, PyTorch, XGBoost, scikit-learn
- **Distributed Training**: Ray and Spark integration
- **Checkpoint & Resume**: Fault-tolerant training
- **Resource Management**: GPU allocation and autoscaling

### Model Deployment
- **Deployment Strategies**:
  - Rolling updates
  - Blue-green deployment
  - Canary releases
  - Shadow deployment
- **Auto-scaling**: Dynamic resource allocation
- **Safe Rollback**: Automatic rollback on errors
- **Multi-zone Deployment**: Regional distribution

### Monitoring & Quality
- **Model Excellence Score (MES)**:
  - Training accuracy
  - Prediction accuracy
  - Model freshness
  - Feature quality
  - Latency metrics
  - Availability SLA
- **Feature Monitoring**: Data drift detection
- **Performance Tracking**: Real-time metrics
- **Alert Management**: Automated health checks

### Generative AI (GenAI)
- **LLM Catalog**:
  - In-house models (Llama 2, etc.)
  - 3rd-party APIs (OpenAI, Anthropic, Google)
  - Model comparison and selection
- **Prompt Engineering**:
  - Template management
  - Variable substitution
  - Version control
  - Usage tracking
- **Fine-Tuning**:
  - LoRA (Low-Rank Adaptation) support
  - Distributed GPU training
  - Cost estimation and tracking
  - Model evaluation

### Feature Store
- **Batch Features**: Scheduled computation
- **Streaming Features**: Real-time updates
- **Online Serving**: Low-latency access
- **Feature Monitoring**: Drift and quality tracking

## 📊 Data Models

### Core Entities
- **MLProject**: Project metadata, tiering, and MES
- **Model**: Model registry with versions and lineage
- **Pipeline**: Training and evaluation workflows
- **Deployment**: Serving infrastructure and configuration
- **Experiment**: Experiment tracking and comparison
- **LLMModel**: Generative AI model catalog
- **PromptTemplate**: Prompt engineering templates
- **FeatureGroup**: Feature store definitions

## 🛠️ Technology Stack

- **Frontend**: Angular 20 with standalone components
- **UI**: Tailwind CSS for modern, responsive design
- **State Management**: Angular signals for reactive programming
- **Storage**: LocalStorage for demo (replace with backend API)
- **AI Integration**: Google Gemini API for LLM features

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🌐 Navigation

### Main Routes
- `/` - Home page with platform overview
- `/projects` - ML Projects dashboard
- `/project/:id` - Project detail view
- `/notebooks` - Notebook list
- `/notebook/:id` - Interactive notebook editor
- `/workflows` - MLOps workflow list
- `/workflow/:id` - Workflow configuration
- `/genai` - GenAI playground

## 🎨 Project Tiering

Projects are classified into four tiers to differentiate high-impact and long-tail use cases:

| Tier | Description | Examples | Support Level |
|------|-------------|----------|---------------|
| **Tier 1** | Critical business models | ETA, fraud detection, safety | 24/7 support, highest priority |
| **Tier 2** | Important business models | Ranking, recommendations | High priority |
| **Tier 3** | Standard models | Various ML applications | Standard support |
| **Tier 4** | Experimental | Research, POCs | Self-service |

## 📈 Model Excellence Score (MES)

MES provides a holistic view of model quality with the following components:

1. **Training Accuracy** (25% weight)
2. **Prediction Accuracy** (25% weight)
3. **Model Freshness** (15% weight)
4. **Feature Quality** (15% weight)
5. **Latency** (10% weight)
6. **Availability** (10% weight)

**Score Ranges:**
- 90-100: Excellent
- 75-89: Good
- 60-74: Fair
- <60: Needs Improvement

## 🔄 ML Development Workflow

### 1. Project Setup
1. Create a new ML project
2. Define project tier and metadata
3. Set up team and ownership

### 2. Development
1. Create notebook for experimentation
2. Explore data and prototype models
3. Track experiments and metrics

### 3. Pipeline Creation
1. Define training pipeline steps
2. Configure resources (CPU, GPU)
3. Set up feature transformations

### 4. Training
1. Run pipeline with full dataset
2. Track training metrics
3. Compare experiments

### 5. Deployment
1. Select best model version
2. Configure deployment strategy
3. Deploy to staging/production
4. Monitor performance

### 6. Monitoring
1. Track Model Excellence Score
2. Monitor feature drift
3. Set up alerts
4. Schedule retraining

## 🤖 GenAI Features

### LLM Catalog
Browse and compare LLMs with:
- Context window size
- Parameter count
- Latency metrics
- Cost per token
- Capability matrix

### Prompt Engineering
- Create reusable prompt templates
- Test prompts with variables
- Track usage and performance
- Version control

### Fine-Tuning
- Select base model
- Configure training parameters
- Enable LoRA for efficiency
- Track training progress
- Monitor costs

## 🔐 Best Practices

### Model Development
1. Start with notebooks for exploration
2. Track all experiments systematically
3. Use feature stores for consistency
4. Version all models and datasets

### Deployment
1. Always deploy to staging first
2. Use canary releases for critical models
3. Enable auto-rollback
4. Monitor latency and error rates

### Monitoring
1. Set up alerts for MES drops
2. Monitor feature drift daily
3. Track prediction quality
4. Schedule regular retraining

### GenAI
1. Test prompts thoroughly before production
2. Monitor token usage and costs
3. Use in-house models for proprietary data
4. Enable LoRA for cost-effective fine-tuning

## 🧪 Jupyter Backend Setup

For Python code execution in notebooks:

```bash
# Install Jupyter
pip install jupyterlab ipykernel

# Start Jupyter server
jupyter lab --ServerApp.allow_origin='*' --no-browser
```

## 🎯 Roadmap

### Current Features ✅
- Project management with tiering
- Interactive notebooks
- MLOps workflows
- Model registry (in progress)
- Deployment manager (in progress)
- GenAI playground
- Monitoring dashboard (in progress)

### Coming Soon 🚧
- Feature store UI
- Pipeline DAG visualizer
- Model comparison tool
- A/B testing framework
- Advanced monitoring dashboards
- Real-time inference testing
- Cost analytics

## 📚 References

This platform is inspired by:
- **Uber Michelangelo**: End-to-end ML platform
- **MLflow**: Experiment tracking
- **Kubeflow**: ML workflows on Kubernetes
- **TFX**: TensorFlow Extended
- **Ray**: Distributed computing
- **Triton**: Model serving

## 🤝 Contributing

This is a demonstration project showcasing enterprise MLOps architecture and best practices.

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ using Angular 20, TypeScript, and Tailwind CSS**
