# Quick Start Guide - Risk Radar

Get the system running locally in 15 minutes.

---

## 📊 What You'll Get

- **Backend API** running on `http://localhost:8000`
- **Frontend Dashboard** running on `http://localhost:3000`
- **PostgreSQL Database** with sample data
- **Real API integration** (or mock data for UI-first development)

---

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ (`node --version`)
- PostgreSQL 12+ (or skip: use mock data)
- Git

### Step 1: Clone & Install

```bash
cd Risk-Radar

# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
cp .env.example .env.local
```

### Step 2: Database (Optional)

**Skip if** you want to use mock data and test UI immediately.

```bash
# Create PostgreSQL database
createdb risk_radar

# Load schema
psql risk_radar < backend/database/schema.sql

# Update backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=risk_radar
DB_USER=postgres
DB_PASSWORD=postgres
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Step 4: Verify

```bash
# Check backend health
curl http://localhost:8000/api/health

# Should return:
# {"status":"healthy","database":"connected","timestamp":"..."}
```

---

## 🎨 Frontend Development (No Database Required!)

Use **mock data** to build UI without backend:

```bash
cd frontend
npm run dev
```

Frontend automatically uses mock data from `docs/mock-data.json` if backend unavailable.

### Available Pages
- **Dashboard** (`/`) - Heat map, events, metrics
- **Risk Details** (`/risks/:id`) - Full risk analysis
- **OEM Exposure** (`/oem-exposure`) - Company impact

---

## 🔧 Backend Development

### Database Queries
```bash
# Log in to PostgreSQL
psql risk_radar

# View events
SELECT * FROM events LIMIT 10;

# View risks
SELECT risk_key, title, severity FROM risks ORDER BY detected_date DESC LIMIT 10;

# View OEM exposures
SELECT oem_id, risk_id, disruption_probability_6w FROM oem_risk_exposure;
```

### API Testing
```bash
# Get all risks
curl "http://localhost:8000/api/risks?region=peru&severity=3"

# Get events
curl "http://localhost:8000/api/events?region=peru&event_type=strike"

# Get OEM exposure
curl "http://localhost:8000/api/oem-exposure?oem_id=FORD-NA"

# Dashboard summary
curl http://localhost:8000/api/dashboard-summary
```

---

## 📁 Key Files to Know

### Backend
- `backend/src/index.js` - Express app entry point
- `backend/src/api/routes/*.js` - API endpoints
- `backend/src/services/*.js` - Business logic (risk scoring, exposure)
- `backend/src/scrapers/*.js` - News scrapers
- `backend/src/pipelines/*.js` - Translation & NLP
- `backend/database/schema.sql` - Database schema

### Frontend
- `frontend/src/App.jsx` - Main app component
- `frontend/src/components/*.jsx` - Reusable UI components
- `frontend/src/pages/*.jsx` - Page components
- `frontend/src/hooks/useDashboardData.js` - Data fetching hook
- `frontend/src/services/api.js` - API client

### Configuration
- `backend/.env.example` - Backend env vars
- `frontend/.env.example` - Frontend env vars
- `docs/api.md` - Complete API specification
- `docs/architecture.md` - System design
- `docs/mock-data.json` - Mock data for frontend development

---

## 🚀 Deployment

### Frontend → GitHub Pages
```bash
cd frontend
npm run build
npm run deploy
```

Deploys to: https://yourusername.github.io/Risk-Radar

### Backend → Vercel
```bash
# First time setup
cd backend
vercel

# Deploy
vercel --prod
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Build Check
```bash
cd frontend
npm run build
```

---

## 📊 Common Tasks

### Add a new API endpoint
1. Create route in `backend/src/api/routes/newroute.js`
2. Import in `backend/src/index.js`
3. Add `app.use('/api/newroute', newrouteRouter)`
4. Update `docs/api.md`
5. Test: `curl http://localhost:8000/api/newroute`

### Add a new component
1. Create component in `frontend/src/components/NewComponent.jsx`
2. Import in `frontend/src/App.jsx` or parent component
3. Style with Tailwind CSS classes
4. Test in dev server

### Ingest real scraper data
1. Run Peru scraper: `node -e "import('./backend/src/scrapers/peru-scraper.js').then(m => new m.PeruScraper().scrape())"`
2. Process articles through NLP
3. Store in database

---

## 🐛 Debugging

### Check Backend Logs
- Console output shows all requests and errors
- `backend/logs/` directory (if configured)
- Set `LOG_LEVEL=debug` in `.env` for verbose logging

### Check Frontend Network
- Open DevTools → Network tab
- Monitor API calls to `/api/*` endpoints
- Check request/response payloads

### Database Issues
```bash
# Check connection
psql -h localhost -U postgres -d risk_radar -c "SELECT 1"

# View slow queries (enable in config)
SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## 📚 Documentation

- **[API Specification](docs/api.md)** - All endpoints, request/response examples
- **[Architecture](docs/architecture.md)** - System design, data models, algorithms
- **[Deployment Guide](docs/deployment.md)** - Production setup
- **[Backend README](backend/README.md)** - Backend-specific setup
- **[Frontend README](frontend/README.md)** - Frontend-specific setup (coming soon)

---

## ❓ FAQs

**Q: Can I develop frontend without database?**
A: Yes! Frontend uses mock data from `docs/mock-data.json`. Just uncomment mock data option in `frontend/src/hooks/useDashboardData.js`.

**Q: What if PostgreSQL isn't installed?**
A: Use [Supabase](https://supabase.com) (free tier) or [Render](https://render.com) for managed PostgreSQL. Update `DB_HOST` in `.env`.

**Q: How do I run the scrapers?**
A: Scrapers run via the ingestion orchestrator. See `backend/src/pipelines/ingestion-orchestrator.js`. Schedule with `.scheduleIngestion()`.

**Q: Can I use environment variables instead of .env file?**
A: Yes! Just set env vars directly: `export DB_HOST=localhost && npm run dev`.

**Q: How do I add a new region (Mexico, Vietnam)?**
A: 1. Create `backend/src/scrapers/mexico-scraper.js` (copy Peru scraper, modify sites) 2. Add to `DataIngestionPipeline` 3. Update `docs/mock-data.json` with region data.

---

## 🆘 Getting Help

- **Backend issues**: Check `backend/README.md`
- **Frontend issues**: Check `frontend/README.md` (when available)
- **API problems**: Review `docs/api.md`
- **Architecture questions**: See `docs/architecture.md`
- **Code questions**: Check comments in relevant service files

---

## ✅ Checklist - First Day

- [ ] Install Node.js and PostgreSQL
- [ ] Clone repo and `npm install`
- [ ] Set up `.env` files
- [ ] Create PostgreSQL database
- [ ] Start backend (`npm run dev`)
- [ ] Start frontend (`npm run dev`)
- [ ] Visit `http://localhost:3000`
- [ ] Call API: `curl http://localhost:8000/api/risks`
- [ ] Read `docs/api.md` to understand endpoints
- [ ] Explore codebase: `backend/src/`, `frontend/src/`

**Done!** You're ready to develop. 🚀
