# Deployment Guide - Tier-N Risk Radar

This guide covers deploying **Frontend** to GitHub Pages and **Backend** to Vercel, with database setup instructions.

---

## 📋 Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- PostgreSQL database (local dev or managed service)
- Node.js 16+ installed locally

---

## 🚀 Quick Start Deployment

### 1️⃣ Database Setup

#### Option A: Local PostgreSQL (Development)

```bash
# Install PostgreSQL (macOS)
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb risk_radar

# Create user
psql risk_radar -c "CREATE USER risk_user WITH PASSWORD 'your_secure_password';"
psql risk_radar -c "GRANT ALL PRIVILEGES ON DATABASE risk_radar TO risk_user;"

# Run migrations (TODO: Create migration scripts)
# psql risk_radar -f database/schema.sql
```

#### Option B: Supabase (Recommended for Production)

1. Go to https://supabase.com
2. Create new project
3. Copy connection string: `postgresql://user:password@host:port/database`
4. Note: Supabase gives 500MB free tier

#### Option C: AWS RDS

1. Create PostgreSQL instance
2. Note endpoint: `your-db.xxxxx.us-east-1.rds.amazonaws.com`
3. Security group must allow port 5432 from Vercel IPs

---

### 2️⃣ Frontend Deployment (GitHub Pages)

#### Step 1: Prepare Repository

```bash
cd frontend

# Update package.json homepage field
# In package.json, update:
# "homepage": "https://yourusername.github.io/Risk-Radar"

npm install

# Test build locally
npm run build
```

#### Step 2: Create GitHub Workflow

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm install

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_URL }}

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

#### Step 3: Deploy

```bash
git add .
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

Your frontend will be available at: `https://yourusername.github.io/Risk-Radar`

---

### 3️⃣ Backend Deployment (Vercel)

#### Step 1: Prepare Backend for Vercel

Create `vercel.json` in root:

```json
{
  "buildCommand": "npm install",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

Create `api/index.js` (Vercel serverless entry point):

```javascript
import express from 'express';
import app from '../src/index.js';

export default app;
```

#### Step 2: Connect Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Initialize
cd backend
vercel
```

Follow prompts:
- Project name: `risk-radar-api`
- Framework: Other
- Root directory: `./`

#### Step 3: Set Environment Variables in Vercel

```bash
# Via CLI
vercel env add DB_HOST your-db-host.rds.amazonaws.com
vercel env add DB_PORT 5432
vercel env add DB_NAME risk_radar
vercel env add DB_USER risk_user
vercel env add DB_PASSWORD your_secure_password
vercel env add GOOGLE_TRANSLATE_API_KEY your-api-key
vercel env add FRONTEND_URL https://yourusername.github.io/Risk-Radar
```

Or via Vercel Dashboard:
1. Settings → Environment Variables
2. Add each variable
3. Redeploy

#### Step 4: Create GitHub Workflow for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Vercel

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./backend
```

#### Step 5: Get Vercel Secrets

```bash
# From Vercel Dashboard → Settings → Tokens
vercel login # Get VERCEL_TOKEN and save to GitHub Secrets

# Or via CLI
vercel secret ls
```

Add to GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID` (from Settings)
- `VERCEL_PROJECT_ID` (from .vercel/project.json)

#### Step 6: Deploy

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

Backend will be available at: `https://risk-radar-api.vercel.app`

---

## 🔗 Connect Frontend to Backend

Update `frontend/.env.local`:

```env
VITE_API_BASE_URL=https://risk-radar-api.vercel.app
```

Or set in Vercel environment variables for production.

---

## 📊 Database Migrations

### Create Migration Service

Create `backend/database/migrations.js`:

```javascript
import { query } from '../src/utils/db.js';

export const createTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type VARCHAR(50) NOT NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      region VARCHAR(50) NOT NULL,
      severity_score INT DEFAULT 1,
      classification_confidence FLOAT DEFAULT 0.5,
      source VARCHAR(200),
      detected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(detected_date);
  `);
};
```

### Run Migrations on Deploy

Update `vercel.json`:

```json
{
  "buildCommand": "npm run migrate && npm install",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

Add to `package.json`:

```json
"scripts": {
  "migrate": "node database/migrations.js"
}
```

---

## 🧪 Testing Deployments

### Test Frontend

```bash
npm run build
npm run preview
# Visit http://localhost:5173
```

### Test Backend

```bash
npm run dev
# Visit http://localhost:8000/api/health
# Should return: { "status": "healthy", "database": "connected" }
```

### Test Connection

```bash
curl https://risk-radar-api.vercel.app/api/health
```

---

## 🔒 Security Checklist

- [ ] Database credentials in Vercel Environment Variables (not in code)
- [ ] GitHub Secrets set for Vercel deployment tokens
- [ ] CORS configured (allowed origins)
- [ ] API rate limiting enabled
- [ ] HTTPS enforced (automatic on Vercel/GitHub Pages)
- [ ] No API keys in git history
- [ ] Database backups enabled (Supabase/RDS)

---

## 📈 Monitoring & Debugging

### Vercel Logs

```bash
vercel logs risk-radar-api
# Or via Dashboard → Deployments → Logs
```

### GitHub Actions Logs

1. Push code
2. Go to GitHub → Actions
3. Click workflow run
4. View build/deploy logs

### Frontend Debugging

```bash
# Check for console errors
# Vercel build logs: https://vercel.com/your-username/risk-radar/deployments
```

---

## 🔄 CI/CD Summary

| Component | Platform | Trigger | Branch |
| --- | --- | --- | --- |
| Frontend | GitHub Pages | Push to `main` | `main` |
| Backend | Vercel | Push to `main` | `main` |
| Database | Manual | N/A | Direct connection |

---

## 🚨 Troubleshooting

### Backend won't start on Vercel

```bash
# Check logs
vercel logs risk-radar-api --follow

# Common issue: Missing env vars
# Solution: Set in Vercel Dashboard → Settings → Environment Variables
```

### Frontend can't reach backend

```bash
# Check CORS
curl -H "Origin: https://yourusername.github.io" \
  https://risk-radar-api.vercel.app/api/health

# Check .env file in frontend
cat frontend/.env.local
```

### Database connection timeout

```bash
# Check security group (AWS RDS)
# Allow inbound: port 5432 from Vercel IPs
# Vercel IPs: See https://vercel.com/docs/infrastructure/static-ips
```

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 🎯 Next Steps

1. Set up database (PostgreSQL/Supabase/RDS)
2. Deploy frontend to GitHub Pages
3. Deploy backend to Vercel
4. Connect frontend to backend API
5. Set up CI/CD workflows
6. Monitor deployments
