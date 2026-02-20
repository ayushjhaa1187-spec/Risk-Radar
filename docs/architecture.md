# Architecture - Tier-N Supply Chain Risk Radar

## 🎯 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     TIER-N RISK RADAR SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

INGESTION LAYER
┌──────────────────────────────────────────────────────────────────┐
│  Multi-Language News Scraping  │  Court Records  │  Labor Union   │
│  • Peru: Spanish regional news  │  • Bankruptcy   │  • Strike vote │
│  • Mexico: Spanish local media  │  • Lawsuits     │  • Protests    │
│  • Vietnam: Vietnamese press    │  • Tax seizures │  • Announcements
└──────────────────────────────────────────────────────────────────┘
                              ↓
PROCESSING LAYER
┌──────────────────────────────────────────────────────────────────┐
│ Translation     │   NLP Classification     │   Entity Extraction  │
│ (Google API)    │ (spaCy/BERT)             │ (Fuzzy matching)     │
│ Spanish → EN    │ Classify: strike,        │ Facility IDs,        │
│ Vietnamese → EN │           bankruptcy,    │ Commodity codes,     │
│ etc.            │           environmental │ Organization names   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
ENRICHMENT LAYER
┌──────────────────────────────────────────────────────────────────┐
│  Risk Scoring        │  Exposure Analysis      │  Propagation    │
│  • Severity (1-5)    │  • Trade flow matching │  • Tier-1 impact │
│  • Confidence (0-1)  │  • OEM dependency %    │  • Affected OEMs │
│  • Impact window     │  • Supply chain depth  │  • Timeframe     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
API LAYER
┌──────────────────────────────────────────────────────────────────┐
│  /api/risks              /api/events          /api/oem-exposure   │
│  /api/dashboard-summary  /api/regions         /api/risks/{id}     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
FRONTEND LAYER
┌──────────────────────────────────────────────────────────────────┐
│  React Dashboard                                                  │
│  • World heat map (risk by region)                               │
│  • Event timeline feed                                           │
│  • OEM exposure breakdown                                        │
│  • Alert notifications                                           │
│  • 4–8 week forecast                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Backend Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Python)                      │
└─────────────────────────────────────────────────────────────────┘

1. SCRAPERS (src/scrapers/)
   ├── peru_news_scraper.py          → Spanish news sites
   ├── mexico_news_scraper.py        → Spanish/Portuguese sites
   ├── vietnam_news_scraper.py       → Vietnamese sites
   ├── union_bulletin_scraper.py     → Labor org websites
   └── court_record_scraper.py       → Local court dockets

2. PIPELINES (src/pipelines/)
   ├── translation_pipeline.py       → Multi-language to English
   ├── nlp_classifier.py             → Event classification
   └── entity_resolver.py            → Facility/org identification

3. MODELS (src/models/)
   ├── event.py                      → Event schema
   ├── risk.py                       → Risk aggregation
   ├── facility.py                   → Mining/manufacturing sites
   ├── organization.py               → Companies/OEMs
   └── exposure.py                   → OEM supply chain exposure

4. SERVICES (src/services/)
   ├── risk_scoring_service.py       → Risk severity calculation
   ├── exposure_service.py           → Trade flow + OEM impact
   ├── entity_matching_service.py    → Fuzzy entity resolution
   └── propagation_service.py        → Tier-N impact simulation

5. API (src/api/)
   ├── routes/risks.py               → /api/risks endpoints
   ├── routes/events.py              → /api/events endpoints
   ├── routes/oem.py                 → /api/oem-exposure endpoints
   ├── routes/dashboard.py           → /api/dashboard-summary
   └── middleware/auth.py            → Auth (future)

6. DATABASE
   ├── PostgreSQL (main)
   │   ├── events table
   │   ├── risks table
   │   ├── facilities table
   │   ├── organizations table
   │   └── exposures table
   │
   └── Event Store (optional)
       └── Raw classified signals (append-only)

7. UTILS (src/utils/)
   ├── logger.py
   ├── retry.py                      → Exponential backoff
   ├── cache.py                      → Redis (optional)
   └── config.py                     → Environment variables
```

---

## 📊 Data Flow Example

**Scenario:** Strike announced at Peruvian copper mine

```
1. SCRAPE
   Spanish labor union website announces:
   "Trabajadores de Minera Santa Rosa votan huelga el 25 de febrero"

   ↓

2. TRANSLATE & CLASSIFY
   Translated: "Workers at Minera Santa Rosa vote strike on Feb 25"
   Classification: strike (confidence 0.89)
   Entities: Minera Santa Rosa, strike, Feb 25

   ↓

3. ENTITY RESOLUTION
   "Minera Santa Rosa" → facility_id: "santa_rosa_mine_pe"
   Commodity: copper
   Annual capacity: 80,000 tonnes

   ↓

4. RISK SCORING
   Severity: 4 (major mine, critical timing)
   Confidence: 0.87
   Impact window: 3-6 weeks
   Exposure score: 0.68

   ↓

5. EXPOSURE ANALYSIS
   Trade data: Santa Rosa → 60% to Mexican smelter
   Mexican smelter → 40% to Ford Tier-1 supplier

   Therefore:
   • Ford's copper exposure to risk: 18%
   • Affected Tier-1 suppliers: 3
   • Disruption probability (6w): 42%

   ↓

6. API RESPONSE
   GET /api/risks/PECU-2026-0045
   Returns: Full risk with OEM exposure analysis

   ↓

7. DASHBOARD DISPLAY
   Heat map: Peru turns red (HIGH risk)
   Alert: "Ford at 18% copper risk from Peru strike vote"
   Timeline: Strike vote → Supply disruption (3-6w)
```

---

## 🗄️ Data Models

### Event Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  event_type VARCHAR (50),           -- strike, bankruptcy, regulatory, etc
  title VARCHAR (500),
  description TEXT,
  raw_text_original TEXT,             -- Original foreign language text
  raw_text_translated TEXT,           -- English translation
  detected_date TIMESTAMP,            -- When we detected it
  occurrence_date TIMESTAMP,          -- When it happens/happened
  source VARCHAR (200),               -- News source, court, union, etc
  source_url VARCHAR (2000),
  region VARCHAR (50),                -- peru, mexico, vietnam, etc
  geo_lat FLOAT,
  geo_lng FLOAT,

  -- Classifications from NLP
  classification_confidence FLOAT,    -- 0-1
  severity_score INT,                 -- 1-5

  -- Extracted entities
  entities_json JSONB,                -- [{entity: "X", type: "facility", id: "Y"}]

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_region ON events(region);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_date ON events(detected_date);
```

### Risk Table (Aggregated from Events)
```sql
CREATE TABLE risks (
  id UUID PRIMARY KEY,
  risk_key VARCHAR (100) UNIQUE,      -- e.g., "PECU-2026-0045"
  title VARCHAR (500),
  description TEXT,
  category VARCHAR (50),              -- labor_unrest, bankruptcy, environmental
  region VARCHAR (50),

  -- Risk metrics
  severity INT,                       -- 1-5
  confidence FLOAT,                   -- 0-1
  exposure_score FLOAT,               -- 0-1 (impact magnitude)

  -- Timing
  detected_date TIMESTAMP,
  start_date TIMESTAMP,
  expected_duration_days INT,

  -- Affected infrastructure
  affected_facilities_json JSONB,     -- [facility_ids]
  estimated_impact_json JSONB,        -- {oem_count, tier1_suppliers, monthly_val}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risks_region ON risks(region);
CREATE INDEX idx_risks_severity ON risks(severity);
CREATE INDEX idx_risks_date ON risks(detected_date);
```

### Exposure Table (OEM Impact)
```sql
CREATE TABLE oem_exposures (
  id UUID PRIMARY KEY,
  oem_id VARCHAR (100),               -- FORD-NA, GM-NA, etc
  risk_id UUID REFERENCES risks(id),

  -- Exposure metrics
  commodity VARCHAR (100),            -- copper, lithium, etc
  dependency_pct FLOAT,               -- 0-100
  affected_tier1_suppliers INT,
  disruption_probability_6w FLOAT,    -- 0-1
  estimated_impact_days INT,

  -- Analysis
  risk_assessment_json JSONB,         -- {supply_gaps, alternates, timeline}

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_exposures_oem ON oem_exposures(oem_id);
CREATE INDEX idx_exposures_risk ON oem_exposures(risk_id);
```

---

## 🔄 Processing Pipeline

### Step 1: Scraping
- **Frequency:** Every 4-6 hours
- **Tools:** Playwright (JavaScript-heavy), requests + BeautifulSoup (static sites)
- **Output:** Raw HTML/text articles

### Step 2: Translation
- **API:** Google Translate or LibreTranslate
- **Batch:** Translate in bulk to save API calls
- **Cache:** Store translations in DB to avoid re-translation

### Step 3: NLP Classification
- **Model:** spaCy with custom entity recognition
- **Classes:** strike, bankruptcy, environmental_shutdown, regulatory_action, infrastructure_outage, labor_protest
- **Confidence Threshold:** Only keep events with >60% confidence

### Step 4: Entity Extraction & Resolution
- **Fuzzy Matching:** Compare facility names against known database
- **Address Matching:** Cross-reference geographic coordinates
- **Ownership Chain:** Resolve parent companies
- **Confidence Decay:** Lower confidence for fuzzy matches

### Step 5: Risk Scoring
```
Risk Score =
  (Severity: 1-5) ×
  (Confidence: 0-1) ×
  (Regional Production Share) ×
  (Commodity Criticality Weight)
```

### Step 6: Exposure Propagation
```
For each at-risk facility:
  1. Find smelters/refiners that depend on it (trade data)
  2. Find Tier-1 suppliers that depend on smelters
  3. Find OEMs that depend on Tier-1 suppliers
  4. Calculate exposure % for each OEM
  5. Store in oem_exposures table
```

---

## 📡 API Layer Design

### Key Principles
1. **Stateless:** Each request is independent
2. **Cached:** Expensive queries cached for 1 hour
3. **Paginated:** All list endpoints support pagination
4. **Typed:** JSON schema validation on input/output
5. **Documented:** OpenAPI/Swagger spec included

### Request/Response Pattern
```json
// Request
GET /api/risks?region=peru&severity=3&limit=20&offset=0

// Response
{
  "data": [...],
  "pagination": {
    "total": 127,
    "limit": 20,
    "offset": 0,
    "has_more": true
  },
  "meta": {
    "generated_at": "2026-02-20T18:30:00Z",
    "cache_valid_until": "2026-02-20T19:30:00Z"
  }
}
```

---

## 🗂️ Frontend Communication

### Polling Strategy (MVP)
- Dashboard polls `/api/dashboard-summary` every 30 seconds
- Risk detail page polls `/api/risks/{id}` every 60 seconds
- Event feed polls `/api/events?region=X` every 2 minutes

### Future: WebSocket Updates
- Real-time alert system
- Bi-directional communication
- Reduced latency for critical events

---

## 🔐 Security Considerations

1. **Input Validation:** All parameters validated before query
2. **Rate Limiting:** 1,000 req/hour for development, tiered for production
3. **CORS:** Restricted to frontend domain
4. **Auth:** API key or JWT (not MVP)
5. **Logging:** All requests logged for audit trail

---

## 📈 Scalability Plan

### Year 1 (MVP)
- 3 regions (Peru, Mexico, Vietnam)
- 1,000–5,000 active risks
- 50K event records
- PostgreSQL single instance (8GB)
- Simple in-memory cache

### Year 2 (Scale)
- 15 countries
- 100K active risks
- 1M event records
- PostgreSQL with read replicas
- Redis cache layer
- Elasticsearch for event search

### Year 3 (Enterprise)
- 40+ countries
- Neo4j graph for Tier-N mapping
- Kafka event stream
- ML models for disruption prediction
- Custom data warehousing

---

## 🧪 Testing Strategy

| Test Type | Coverage | Tools |
| --- | --- | --- |
| Unit Tests | Scoring, exposure logic | pytest, Jest |
| Integration Tests | Pipeline end-to-end | pytest |
| API Tests | All endpoints | Postman/pytest |
| E2E Tests | Full user journey | Selenium/Playwright |

---

## 📚 References

- [API Specification](api.md)
- [Deployment Guide](deployment.md)
- [Backend Setup](../backend/README.md)
- [Frontend Setup](../frontend/README.md)
