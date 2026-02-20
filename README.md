# Tier-N Supply Chain Risk Radar 🚨

**Pre-shock detection engine for global manufacturing networks.** Detects supply chain risks at Tier-N (indirect supplier levels) using multilingual local news, court records, and labor union data—before they cascade to Fortune 500 OEMs.

---

## 🎯 What This Does

For a Procurement Officer at Ford or Apple:

```
Input:  "Monitor copper risk in Peru, Mexico, Vietnam"
Output: "Strike vote scheduled at key Peruvian mine next week.
         Your Tier-2 copper exposure: 18%. Disruption window: 3-6 weeks.
         Alternative suppliers: 2 available. Consider hedging."
```

**NOT** another supplier dashboard. **This is early-warning alpha.**

---

## 📋 Project Structure

```
Risk-Radar/
├── backend/                          # Python/Node.js data engine
│   ├── src/
│   │   ├── scrapers/                 # Multi-language news/court/union scrapers
│   │   ├── pipelines/                # Translation, NLP classification
│   │   ├── models/                   # Data models (Event, OEM, Supplier, etc)
│   │   ├── services/                 # Risk scoring, exposure engine, entity resolution
│   │   ├── api/                      # REST endpoints (Flask/FastAPI/Express)
│   │   └── utils/                    # Helpers (logging, retry logic, etc)
│   ├── tests/
│   ├── data/                         # Raw/processed data storage
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   ├── Dockerfile                    # Vercel deployment
│   └── README.md                     # Backend docs
│
├── frontend/                         # React dashboard + UI
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   ├── pages/                    # Dashboard pages
│   │   ├── hooks/                    # Custom hooks
│   │   ├── services/                 # API client
│   │   ├── utils/                    # Helpers
│   │   ├── styles/                   # Global CSS/themes
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   ├── .github/workflows/            # GitHub Pages deployment
│   └── README.md                     # Frontend docs
│
├── docs/
│   ├── architecture.md               # System design
│   ├── api.md                        # API contract
│   └── deployment.md                 # Deploy guide
│
├── .gitignore
├── LICENSE
└── README.md                         # You are here
```

---

## 🏗️ System Architecture

### High-Level Flow

```
[Regional News (Spanish/Vietnamese)]
         ↓
[Translation + Language Detection]
         ↓
[NLP: Event Classification (strike, bankruptcy, etc)]
         ↓
[Risk Scoring (Severity × Regional Share × Dependency)]
         ↓
[Trade Flow Exposure Model: OEM impact calculation]
         ↓
[REST API: /api/risks, /api/events, /api/oem-exposure]
         ↓
[React Dashboard: Heat map, Event feed, Exposure table]
```

### MVP Feature Set (Year 1)

| Feature | Status | Purpose |
| --- | --- | --- |
| Peru copper monitoring | Backend in progress | Risk event detection |
| Spanish/Vietnamese scraping | Backend in progress | Signal collection |
| Translation pipeline | Backend in progress | Cross-language ops |
| Risk scoring engine | Backend in progress | Severity calculation |
| OEM exposure estimator | Backend in progress | Impact to customers |
| REST API | Backend in progress | Data delivery |
| Dashboard (Peru focus) | Frontend in progress | User interface |
| GitHub Pages deployment | Frontend in progress | Public access |
| Vercel deployment (backend) | Pipeline in progress | Serverless backend |

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js (Express) OR Python (FastAPI)
- **Scraping:** Playwright / Selenium (for JS-heavy sites)
- **Translation:** Google Translate API / LibreTranslate
- **NLP:** spaCy or BERT for event classification
- **Database:** PostgreSQL (relational) + event store
- **Graph (later):** Neo4j (for Tier-N mapping, Year 2)
- **Deployment:** Vercel (serverless) OR Heroku (traditional)

### Frontend
- **Framework:** React 18
- **State:** TanStack Query (data) + Zustand (UI state)
- **Maps:** Mapbox GL or Leaflet
- **UI Components:** shadcn/ui or Material-UI
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages (static build)

### Architecture Pattern
- **Backend:** Modular pipeline architecture (scrapers → NLP → scoring → API)
- **Frontend:** Component-driven (Dashboard → Heat Map → Event Feed → Exposure Table)
- **Communication:** REST API with JSON payloads

---

## 🚀 Deployment

| Service | Target | Trigger |
| --- | --- | --- |
| **Frontend** | GitHub Pages | Push to `main` branch |
| **Backend** | Vercel | Push to `main` branch |
| **Database** | MongoDB Atlas (free tier) OR Supabase | Manual + CI/CD |

---

## 📖 Documentation

- **[Architecture Details](docs/architecture.md)** - System design, data models, algorithms
- **[API Contract](docs/api.md)** - Endpoints, request/response format, examples
- **[Deployment Guide](docs/deployment.md)** - How to deploy frontend & backend
- **[Backend README](backend/README.md)** - Setup, run, test
- **[Frontend README](frontend/README.md)** - Setup, run, build

---

## 👥 Workflow & Branch Strategy

### Branches
- `main` - Production (protected)
- `develop` - Staging / integration point
- `backend/**` - Backend features (e.g., `backend/scraper-peru`)
- `frontend/**` - Frontend features (e.g., `frontend/heat-map`)

### Parallel Development
- **Backend work:** Merge to `develop` when complete, expose API contracts early
- **Frontend work:** Use mock data from `docs/mock-data.json` until real API ready
- **Integration:** Both merge to `main` after testing

### CI/CD
- Linting, testing, and deployment run automatically on `main` push
- Pre-commit hooks catch common issues

---

## 🧪 Getting Started (Local Development)

### Prerequisites
- Node.js 18+ (frontend) or Python 3.9+ (backend)
- Git
- Docker (optional, for local Postgres)

### Quick Start

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python src/main.py
# Server runs on http://localhost:8000
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend API URL
npm run dev
# App runs on http://localhost:5173
```

---

## 📊 Current Development Status

**Backend (This Week):**
- [ ] Step 1: Repo structure & tech stack docs ← **You are here**
- [ ] Step 2: Backend project setup (Express/FastAPI scaffold)
- [ ] Step 3: API contract definition (endpoints, data models)
- [ ] Step 4: Multi-language scraper module
- [ ] Step 5: Translation & NLP pipeline
- [ ] Step 6: Risk scoring engine
- [ ] Step 7: REST API endpoints

**Frontend (Parallel):**
- [x] Basic React app setup (Vite + Tailwind)
- [x] Component structure (Dashboard, HeatMap, EventFeed, ExposureTable, Alerts)
- [x] Mock data integration (fallback to docs/mock-data)
- [x] GitHub Pages setup (gh-pages workflow)
- [ ] Integration with real backend API (waiting on backend deploy)

**DevOps:**
- [ ] GitHub Actions for CI/CD
- [ ] Vercel deployment (backend)
- [ ] GitHub Pages deployment (frontend)

---

## 📞 Contact & Questions

For architecture decisions, API design, or coordination: Check the [docs/](docs/) folder and existing issues.

---

**Built with focus on:** Multilingual data, entity resolution, risk propagation, enterprise UX.

**Goal:** Make Tier-N supply chain risk visible to Fortune 500 procurement teams **before** disruption cascades.
