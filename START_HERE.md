# 🚀 ML Platform - START HERE

## 🎯 You Have Two Options

### Option 1: Frontend Only (Quick Demo) ⚡

Perfect for exploring the UI without backend setup.

```bash
cd /workspace
npm install
npm run dev
```

**Visit**: http://localhost:4200

✅ All features work with sample data in browser
✅ No backend needed
✅ Start exploring immediately

---

### Option 2: Full Stack (Complete Experience) 🏗️

Run both frontend and backend together.

#### Step 1: Start Backend (Terminal 1)

```bash
cd /workspace/backend
cp .env.example .env
make docker-up
```

**Wait 30 seconds** for all services to start.

#### Step 2: Start Frontend (Terminal 2)

```bash
cd /workspace
npm run dev
```

**Visit**:
- 🎨 **Frontend**: http://localhost:4200
- 🔧 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 📊 **MLflow**: http://localhost:5000

---

## 📖 What to Explore

### 1. Project Dashboard (`/projects`)
- View sample ML projects
- 4-tier classification system
- Model Excellence Scores
- Create new projects

### 2. GenAI Playground (`/genai`)
- Browse LLM models
- Test prompt templates
- Fine-tuning jobs

### 3. Notebooks (`/notebooks`)
- Interactive code cells
- Markdown documentation
- Jupyter-like experience

### 4. Workflows (`/workflows`)
- MLOps pipeline configuration
- Feature store setup
- Model deployment

---

## 🔧 What's Running?

### Frontend (Angular 20)
- Port: **4200**
- UI components
- Sample data in LocalStorage

### Backend Services (Docker Compose)
- **API** (FastAPI): Port **8000**
- **PostgreSQL**: Port **5432**
- **Redis**: Port **6379**
- **MinIO**: Port **9000**, **9001**
- **MLflow**: Port **5000**

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `/workspace/README.md` | Frontend overview |
| `/workspace/ML_PLATFORM_SUMMARY.md` | Frontend details |
| `/workspace/backend/README.md` | Backend overview |
| `/workspace/backend/BACKEND_SUMMARY.md` | Backend details |
| `/workspace/backend/QUICKSTART.md` | Backend quick start |
| `/workspace/FULLSTACK_SUMMARY.md` | Complete guide |

---

## 🎓 Sample Data

### Projects
- **ETA Prediction Model** (Tier 1, MES: 92)
- **Fraud Detection** (Tier 1, MES: 88)
- **Restaurant Ranking** (Tier 2, MES: 85)

### Models
- **DeepETA v3** (PyTorch, Production)
- **FraudDetector XGB** (XGBoost, Production)

### LLMs
- GPT-4 Turbo
- Claude 3 Opus
- Llama 2 70B (In-house)
- Llama 2 70B Fine-tuned

---

## 🆘 Quick Help

### Backend won't start?
```bash
cd backend
make docker-down
make docker-up
```

### Frontend errors?
```bash
npm install
npm run build
```

### Reset everything?
```bash
# Backend
cd backend
make docker-down
docker system prune -f
make docker-up

# Frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🎯 Quick Commands

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production

# Backend
cd backend
make docker-up       # Start all services
make docker-down     # Stop all services
make test            # Run tests
make migrate         # Run migrations
```

---

## ✨ What You Can Do

### Immediate (Frontend Only)
✅ Browse projects with tiering
✅ View model registry
✅ Test GenAI playground
✅ Create notebooks
✅ Configure workflows

### With Backend
✅ Persistent data storage
✅ REST API integration
✅ MLflow experiment tracking
✅ Real model storage (MinIO)
✅ Database migrations

---

## 🚀 Next Steps

1. **Explore** the UI at http://localhost:4200
2. **Read** the documentation files
3. **Test** the API at http://localhost:8000/docs
4. **Customize** for your use case
5. **Deploy** to production

---

## 📞 Need More Help?

Check these files:
- **Frontend Issues**: `README.md`
- **Backend Issues**: `backend/README.md`
- **Full Guide**: `FULLSTACK_SUMMARY.md`
- **Quick Backend Start**: `backend/QUICKSTART.md`

---

## 🎉 You're Ready!

Choose your path and start exploring:

### 🌟 Quick Demo
```bash
npm run dev
```

### 🏗️ Full Experience
```bash
cd backend && make docker-up
# New terminal
npm run dev
```

**Happy coding!** 🚀
