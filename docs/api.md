# API Contract - Tier-N Risk Radar

**Base URL:** `http://localhost:8000/api` (development) | `https://api.riskradar.com/api` (production)

This document defines the complete API surface for the Risk Radar backend. Frontend uses these endpoints to fetch risk data, events, and OEM exposures.

---

## 📋 Core Endpoints

### 1. **GET /api/risks** - List all active risks in a region

**Purpose:** Fetch all detected risks for dashboard display

```bash
GET /api/risks?region=peru&industry=automotive&limit=50&offset=0
```

**Query Parameters:**
| Param | Type | Required | Example | Note |
| --- | --- | --- | --- | --- |
| `region` | string | Yes | `peru` `mexico` `vietnam` | Region code |
| `industry` | string | No | `automotive` `electronics` | Filter by industry |
| `severity` | int | No | `3` | Min severity (1-5) |
| `limit` | int | No | `50` | Results per page |
| `offset` | int | No | `0` | Pagination offset |

**Response (200 OK):**
```json
{
  "data": [
    {
      "risk_id": "PECU-2026-0045",
      "title": "Strike vote at Las Bambas copper mine",
      "region": "peru",
      "category": "labor_unrest",
      "severity": 4,
      "confidence": 0.87,
      "detected_date": "2026-02-20T08:15:00Z",
      "start_date": "2026-02-25T00:00:00Z",
      "expected_duration_days": 21,
      "description": "Workers at Las Bambas copper mine schedule strike vote over wage disputes. High impact mining facility.",
      "source": "union_bulletin",
      "source_url": "https://...",
      "affected_facilities": ["las_bambas_mine_pe"],
      "exposure_score": 0.65,
      "estimated_impact": {
        "oem_count": 8,
        "tier1_suppliers": 12,
        "primary_commodity": "copper",
        "monthly_volume_usd": 45000000
      }
    }
  ],
  "pagination": {
    "total": 127,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "Invalid region code: xyz",
  "code": "INVALID_REGION"
}

// 500 Server Error
{
  "error": "Database connection failed",
  "code": "DB_ERROR"
}
```

---

### 2. **GET /api/risks/{risk_id}** - Get detailed risk information

**Purpose:** Fetch full risk details with propagation analysis

```bash
GET /api/risks/PECU-2026-0045
```

**Response (200 OK):**
```json
{
  "risk_id": "PECU-2026-0045",
  "title": "Strike vote at Las Bambas copper mine",
  "region": "peru",
  "category": "labor_unrest",
  "severity": 4,
  "confidence": 0.87,
  "detected_date": "2026-02-20T08:15:00Z",
  "start_date": "2026-02-25T00:00:00Z",
  "expected_duration_days": 21,
  "description": "Workers at Las Bambas copper mine schedule strike vote over wage disputes.",
  "source": "union_bulletin",
  "source_url": "https://...",
  "affected_facilities": [
    {
      "facility_id": "las_bambas_mine_pe",
      "name": "Las Bambas Copper Mine",
      "country": "peru",
      "production_category": "copper_ore",
      "annual_capacity_tonnes": 300000,
      "percent_capacity": 65
    }
  ],
  "supply_chain_impact": {
    "tier_2_suppliers": [
      {
        "supplier_id": "SMELT-001-pe",
        "name": "Codelco Smelter - Peru",
        "country": "peru",
        "dependent_on_risk": 0.8,
        "estimated_disruption_weeks": 3
      }
    ],
    "oems_exposed": [
      {
        "oem_id": "FORD-NA",
        "name": "Ford Motor Company",
        "region": "north_america",
        "copper_dependency_pct": 18,
        "tier1_suppliers_affected": 3,
        "estimated_disruption_window": "3-6 weeks",
        "alternative_suppliers_available": 2,
        "risk_score": 0.45
      }
    ]
  },
  "risk_trajectory": {
    "current_phase": "escalation",
    "next_milestone": "Strike vote - 2026-02-25",
    "likelihood_strike_occurs": 0.72,
    "time_to_impact_days": 28
  },
  "mitigation_suggestions": [
    "Increase copper buffer inventory (2-4 week supply)",
    "Contact alternative suppliers in Mexico (unaffected region)",
    "Initiate long-term hedging for copper exposure"
  ]
}
```

---

### 3. **GET /api/events** - Get classified events (raw signals)

**Purpose:** Timeline of detected events before risk aggregation

```bash
GET /api/events?region=peru&event_type=strike&start_date=2026-02-01&end_date=2026-02-28
```

**Query Parameters:**
| Param | Type | Options |
| --- | --- | --- |
| `region` | string | `peru` `mexico` `vietnam` |
| `event_type` | string | `strike` `bankruptcy` `environmental_shutdown` `regulatory_action` `infrastructure_outage` `labor_protest` |
| `start_date` | ISO8601 | `2026-02-01` |
| `end_date` | ISO8601 | `2026-02-28` |

**Response (200 OK):**
```json
{
  "data": [
    {
      "event_id": "EV-PECU-20260220-001",
      "title": "Las Bambas workers schedule strike vote",
      "event_type": "strike",
      "severity": 3,
      "confidence": 0.87,
      "detected_date": "2026-02-20T08:15:00Z",
      "occurrence_date": "2026-02-25T00:00:00Z",
      "description": "Workers at Las Bambas copper mine...",
      "source": "peru_labor_union_bulletin",
      "source_url": "https://...",
      "raw_text_translated": "[Spanish original translated to English]",
      "entities_detected": [
        {
          "entity": "Las Bambas",
          "type": "facility",
          "facility_id": "las_bambas_mine_pe"
        },
        {
          "entity": "Copper",
          "type": "commodity",
          "commodity_code": "copper_cathode"
        }
      ],
      "region": "peru",
      "geo_coordinates": {
        "latitude": -13.9667,
        "longitude": -70.6833
      }
    }
  ],
  "pagination": {
    "total": 34,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 4. **GET /api/oem-exposure** - OEM supply chain exposure analysis

**Purpose:** Custom exposure report for a specific OEM or Tier-1 supplier

```bash
GET /api/oem-exposure?oem_id=FORD-NA&commodity=copper&time_horizon=6
```

**Query Parameters:**
| Param | Type | Required | Options |
| --- | --- | --- | --- |
| `oem_id` | string | Yes | `FORD-NA` `GM-NA` `TOYOTA-NA` etc |
| `commodity` | string | No | `copper` `lithium` `semiconductor` |
| `time_horizon` | int | No | `6` (6-week outlook) |

**Response (200 OK):**
```json
{
  "oem": {
    "oem_id": "FORD-NA",
    "name": "Ford Motor Company",
    "headquarters": "USA"
  },
  "exposure_summary": {
    "total_supply_chain_value_usd": 280000000,
    "at_risk_value_usd": 42000000,
    "at_risk_percentage": 15,
    "risk_score": 0.58,
    "confidence": 0.81
  },
  "commodity_exposures": [
    {
      "commodity": "copper",
      "dependency_pct": 18,
      "top_source_region": "peru",
      "regional_concentration_risk": "HIGH",
      "tier2_suppliers": 8,
      "active_risks_count": 3,
      "disruption_probability_6w": 0.42,
      "estimated_impact_days": 28,
      "alternative_suppliers": [
        {
          "region": "mexico",
          "capacity_available_tonnes": 15000,
          "lead_time_weeks": 2
        }
      ]
    }
  ],
  "top_risks": [
    {
      "risk_id": "PECU-2026-0045",
      "title": "Strike vote at Las Bambas copper mine",
      "severity": 4,
      "impact_to_oem": "HIGH",
      "time_to_impact_days": 28
    }
  ],
  "forecast_6weeks": {
    "reliability_score": 0.82,
    "expected_disruptions": 1,
    "expected_duration_days": 21,
    "recommended_buffer_weeks": 3
  }
}
```

---

### 5. **GET /api/dashboard-summary** - Dashboard home data

**Purpose:** All data needed for dashboard landing page

```bash
GET /api/dashboard-summary?regions=peru,mexico,vietnam
```

**Response (200 OK):**
```json
{
  "global_risk_score": 0.62,
  "active_risks_count": 127,
  "regions": [
    {
      "region": "peru",
      "risk_score": 0.78,
      "active_risks": 45,
      "recent_events": 12,
      "primary_commodities": ["copper"],
      "affected_oems": 18,
      "map_color": "red"
    },
    {
      "region": "mexico",
      "risk_score": 0.48,
      "active_risks": 32,
      "recent_events": 8,
      "primary_commodities": ["copper", "semiconductors"],
      "affected_oems": 12,
      "map_color": "orange"
    },
    {
      "region": "vietnam",
      "risk_score": 0.35,
      "active_risks": 50,
      "recent_events": 5,
      "primary_commodities": ["semiconductors", "electronics"],
      "affected_oems": 22,
      "map_color": "yellow"
    }
  ],
  "critical_alerts": [
    {
      "risk_id": "PECU-2026-0045",
      "title": "Strike vote at Las Bambas copper mine",
      "severity": 4,
      "oems_affected": 8,
      "time_to_impact_days": 28
    }
  ],
  "recent_events_timeline": [
    {
      "event_id": "EV-PECU-20260220-001",
      "title": "Las Bambas workers schedule strike vote",
      "timestamp": "2026-02-20T08:15:00Z",
      "region": "peru",
      "type": "strike"
    }
  ]
}
```

---

### 6. **GET /api/regions** - List available regions

```bash
GET /api/regions
```

**Response:**
```json
{
  "data": [
    {
      "region_code": "peru",
      "region_name": "Peru",
      "country": "Peru",
      "primary_commodities": ["copper", "lithium"],
      "risk_level": "HIGH",
      "monitored_since": "2026-01-15"
    },
    {
      "region_code": "mexico",
      "region_name": "Mexico",
      "country": "Mexico",
      "primary_commodities": ["copper", "semiconductors", "auto_parts"],
      "risk_level": "MEDIUM",
      "monitored_since": "2026-01-15"
    },
    {
      "region_code": "vietnam",
      "region_name": "Vietnam",
      "country": "Vietnam",
      "primary_commodities": ["semiconductors", "electronics"],
      "risk_level": "MEDIUM",
      "monitored_since": "2026-01-15"
    }
  ]
}
```

---

## 🔍 Data Models (Reference)

### Risk Object
```typescript
{
  risk_id: string;
  title: string;
  region: string;
  category: "labor_unrest" | "bankruptcy" | "environmental" | "regulatory" | "infrastructure";
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: 0.0-1.0;
  detected_date: ISO8601;
  start_date: ISO8601;
  expected_duration_days: number;
  exposure_score: 0.0-1.0;
  estimated_impact: {
    oem_count: number;
    tier1_suppliers: number;
    primary_commodity: string;
    monthly_volume_usd: number;
  };
}
```

### Event Object
```typescript
{
  event_id: string;
  title: string;
  event_type: string;
  severity: number;
  confidence: number;
  detected_date: ISO8601;
  occurrence_date: ISO8601;
  source: string;
  source_url: string;
  raw_text_translated: string;
  entities_detected: Array<{entity: string, type: string}>;
  region: string;
  geo_coordinates: {latitude: number, longitude: number};
}
```

### OEM Exposure Object
```typescript
{
  oem_id: string;
  name: string;
  exposure_summary: {
    at_risk_value_usd: number;
    at_risk_percentage: number;
    risk_score: number;
  };
  commodity_exposures: Array<{commodity, dependency_pct, risks}>;
  top_risks: Array<Risk>;
}
```

---

## 🔐 Authentication (Future)

Not implemented in MVP, but reserve header:
```bash
Authorization: Bearer {api_token}
```

---

## 📝 Error Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `INVALID_REGION` | 400 | Region code not recognized |
| `INVALID_OEM_ID` | 400 | OEM ID not found |
| `MISSING_PARAM` | 400 | Required parameter missing |
| `DB_ERROR` | 500 | Database connection or query failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 🧪 Mock Data for Frontend Development

**Location:** Use `docs/mock-data.json` for offline UI development before backend is ready.

```bash
# Frontend can import mock data
import mockData from '../../../docs/mock-data.json'
```

This enables **parallel** frontend development without backend blocking.

---

## 📊 Rate Limits (Planned)

| Tier | Requests/hour | Burst |
| --- | --- | --- |
| Development | Unlimited | Unlimited |
| Starter | 1,000 | 100/min |
| Enterprise | Custom | Custom |

---

## 🚀 Implementation Progress

- [ ] GET /api/risks
- [ ] GET /api/risks/{risk_id}
- [ ] GET /api/events
- [ ] GET /api/oem-exposure
- [ ] GET /api/dashboard-summary
- [ ] GET /api/regions

**Status:** Designs ready. Implementation starts after backend project setup.
