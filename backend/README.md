# Risk Radar Backend

Data processing engine for the Tier-N Supply Chain Risk Radar. Handles multi-language scraping, NLP classification, risk scoring, and exposure analysis.

---

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── index.js                      # Express app entry point
│   ├── api/
│   │   └── routes/
│   │       ├── health.js             # Health check
│   │       ├── risks.js              # Risk operations
│   │       ├── events.js             # Event operations
│   │       ├── oem.js                # OEM exposure
│   │       ├── dashboard.js          # Dashboard data
│   │       └── regions.js            # Region listing
│   ├── services/                     # Business logic (TODO)
│   │   ├── risk-scoring.js           # Risk scoring algorithm
│   │   ├── exposure.js               # OEM exposure calculation
│   │   └── entity-resolver.js        # Entity matching
│   ├── scrapers/                     # Data collection (TODO)
│   │   ├── peru-scraper.js
│   │   ├── mexico-scraper.js
│   │   └── vietnam-scraper.js
│   ├── pipelines/                    # Data processing (TODO)
│   │   ├── translation.js            # Multi-language translation
│   │   └── nlp-classifier.js         # Event classification
│   └── utils/
│       ├── logger.js                 # Winston logger
│       ├── error-handler.js          # Error middleware
│       └── db.js                     # Database connection pool
├── tests/                            # Test files (TODO)
│   ├── unit/
│   └── integration/
├── database/
│   └── schema.sql                    # Database schema (TODO)
├── scripts/
│   ├── seed-data.js                  # Test data seeding (TODO)
│   └── migrate.js                    # Run migrations (TODO)
├── .env.example                      # Environment template
├── package.json
├── vercel.json                       # Vercel config (TODO)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
nano .env

# Create database (see Deployment Guide)
createdb risk_radar

# Start development server
npm run dev
```

Server runs on `http://localhost:8000`

### Verify Setup

```bash
# Check health endpoint
curl http://localhost:8000/api/health

# Expected response:
# { "status": "healthy", "database": "connected", "uptime": 1.234 }
```

---

## 🔧 Development Commands

```bash
# Start dev server with auto-reload
npm run dev

# Run linting
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Seed test data
npm run seed

# Production build
npm run build

# Start production server
npm start
```

---

## 📚 API Endpoints

### Health
- `GET /api/health` - Server health check

### Risks
- `GET /api/risks` - List risks (filterable)
- `GET /api/risks/:id` - Get risk details with supply chain impact

### Events
- `GET /api/events` - List classified events

### OEM Exposure
- `GET /api/oem-exposure?oem_id=FORD-NA` - Get OEM exposure analysis

### Dashboard
- `GET /api/dashboard-summary` - All dashboard data

### Regions
- `GET /api/regions` - List monitored regions

Full API specification: [docs/api.md](../docs/api.md)

---

## 🗄️ Database

### Connection

Uses `pg` pool for connection management. Configuration in `src/utils/db.js`.

### Schema

See `database/schema.sql` for full schema. Main tables:

```
- events        (classified news/events)
- risks         (aggregated risks)
- facilities    (mines, plants, factories)
- organizations (companies, suppliers, OEMs)
- exposures     (OEM-to-risk relationships)
```

### Migrations

```bash
npm run migrate
```

---

## 🧠 Core Modules (TODO)

### Scrapers (`src/scrapers/`)
Collects news, court records, and labor union data from Peru, Mexico, Vietnam.

```javascript
// Usage (future)
import { peruScraper } from './scrapers/peru-scraper.js';
const articles = await peruScraper.scrapeNews({ days: 7 });
```

### Pipelines (`src/pipelines/`)
Translates and classifies extracted events.

```javascript
// Usage (future)
import { translate, classify } from './pipelines/index.js';
const english = await translate(spanishText, 'es', 'en');
const eventType = await classify(english);
```

### Services (`src/services/`)
Business logic for risk scoring and exposure analysis.

```javascript
// Usage (future)
import { calculateRiskScore } from './services/risk-scoring.js';
const score = calculateRiskScore(event, facility, region);
```

---

## 🔐 Environment Variables

See `.env.example` for all variables. Key ones:

```env
# Server
NODE_ENV=development
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=risk_radar
DB_USER=postgres
DB_PASSWORD=secure_password

# APIs
GOOGLE_TRANSLATE_API_KEY=your-key
```

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- tests/unit/risk-scoring.test.js

# Watch mode
npm run test -- --watch
```

Test structure:
- `tests/unit/` - Unit tests (logic)
- `tests/integration/` - Integration tests (API + DB)

---

## 🚢 Deployment

See [docs/deployment.md](../docs/deployment.md) for full deployment guide.

Quick deploy to Vercel:

```bash
vercel
# Follow prompts
# Backend runs at https://risk-radar-api.vercel.app
```

---

## 📊 Architecture

See [docs/architecture.md](../docs/architecture.md) for system design, data models, and processing pipeline.

---

## 🐛 Debugging

### Log Levels

```javascript
logger.error('Error message');    // Always shown
logger.warn('Warning message');   // Info + above
logger.info('Info message');      // Info + above
logger.debug('Debug message');    // Dev only
```

### Database Queries

Slow queries (>1s) logged automatically.

### Request Logging

All HTTP requests logged with method, path, query params.

---

## 💡 Contributing

1. Create feature branch: `git checkout -b backend/feature-name`
2. Make changes
3. Run tests: `npm run test`
4. Run linter: `npm run lint`
5. Commit and push
6. Create Pull Request to `develop` branch

---

## 📖 Further Reading

- [API Contract](../docs/api.md)
- [Architecture](../docs/architecture.md)
- [Deployment](../docs/deployment.md)
- [Frontend README](../frontend/README.md)

---

## 🆘 Troubleshooting

### "connect ECONNREFUSED 127.0.0.1:5432"

PostgreSQL not running. Start it:

```bash
# macOS
brew services start postgresql

# Ubuntu/Linux
sudo service postgresql start

# Windows
# Use PostgreSQL installer
```

### "getaddrinfo ENOTFOUND localhost"

Database host misconfigured. Check `.env`:

```env
DB_HOST=localhost  # (not 127.0.0.1 on some systems)
```

### "GOOGLE_TRANSLATE_API_KEY not found"

Translation API key not set. Add to `.env`:

```env
GOOGLE_TRANSLATE_API_KEY=your-actual-api-key
```

---

## 📝 License

MIT - See LICENSE file
