-- ============================================================================
-- TIER-N SUPPLY CHAIN RISK RADAR - DATABASE SCHEMA
-- ============================================================================
-- PostgreSQL Schema for Risk Event Ingestion, Classification, and Analysis

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CORE ENTITIES
-- ============================================================================

-- Regions table
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  country VARCHAR(100) NOT NULL,
  description TEXT,
  primary_commodities TEXT[] DEFAULT '{}',
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  monitored_since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_regions_code ON regions(code);

-- Organizations (OEMs, suppliers, facilities)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  aliases TEXT[],
  country VARCHAR(100),
  industry VARCHAR(100),
  revenue_band VARCHAR(50),
  org_type VARCHAR(50), -- 'oem', 'tier1', 'tier2', 'facility_operator', 'other'
  confidence_score FLOAT DEFAULT 0.5,
  registration_number VARCHAR(200),
  tax_id VARCHAR(100),
  parent_org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orgs_org_id ON organizations(org_id);
CREATE INDEX idx_orgs_name ON organizations(name);
CREATE INDEX idx_orgs_country ON organizations(country);
CREATE INDEX idx_orgs_type ON organizations(org_type);

-- Facilities (physical locations: mines, plants, factories)
CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id VARCHAR(100) UNIQUE NOT NULL,
  parent_org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(500) NOT NULL,
  aliases TEXT[],
  facility_type VARCHAR(100), -- 'mine', 'smelter', 'refinery', 'manufacturing', 'assembly'
  country VARCHAR(100) NOT NULL,
  region_id UUID REFERENCES regions(id),
  latitude FLOAT,
  longitude FLOAT,
  production_category VARCHAR(100), -- 'copper_ore', 'copper_cathode', 'lithium', 'semiconductor', etc
  annual_capacity_tonnes FLOAT,
  employees_count INT,
  operational_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'closed'
  last_verified_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_facilities_facility_id ON facilities(facility_id);
CREATE INDEX idx_facilities_country ON facilities(country);
CREATE INDEX idx_facilities_region ON facilities(region_id);
CREATE INDEX idx_facilities_type ON facilities(facility_type);
CREATE INDEX idx_facilities_status ON facilities(operational_status);

-- Products/Commodities
CREATE TABLE commodities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commodity_code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(100), -- 'raw_material', 'component', 'finished_good'
  hs_code VARCHAR(20),
  substitution_difficulty VARCHAR(50), -- 'high', 'medium', 'low'
  industry_classification VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commodities_code ON commodities(commodity_code);

-- ============================================================================
-- 2. EVENTS & SIGNALS
-- ============================================================================

-- Raw events detected from scrapers
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_key VARCHAR(200) UNIQUE,
  event_type VARCHAR(100) NOT NULL, -- 'strike', 'bankruptcy', 'environmental_shutdown', 'regulatory_action', 'infrastructure_outage', 'labor_protest'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  raw_text_original TEXT, -- Original language text
  raw_text_translated TEXT, -- Translated to English
  detected_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  occurrence_date TIMESTAMP, -- When the event actually happens
  expected_duration_days INT,
  source VARCHAR(200), -- 'news', 'union_bulletin', 'court_record', 'government'
  source_url VARCHAR(2000),
  source_language VARCHAR(50), -- 'es', 'vi', 'zh', etc
  country VARCHAR(100),
  region_id UUID REFERENCES regions(id),
  geo_latitude FLOAT,
  geo_longitude FLOAT,
  -- Classification scores
  classification_confidence FLOAT DEFAULT 0.0, -- 0-1
  severity_score INT DEFAULT 1, -- 1-5
  -- Extracted entities (JSON format for flexibility)
  entities_json JSONB, -- [{entity: "X", type: "facility", facility_id: "Y", confidence: 0.8}]
  sentiment_score FLOAT, -- -1 to 1
  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_region ON events(region_id);
CREATE INDEX idx_events_detected ON events(detected_date);
CREATE INDEX idx_events_processed ON events(processed);
CREATE INDEX idx_events_country ON events(country);

-- ============================================================================
-- 3. AGGREGATED RISKS
-- ============================================================================

-- Aggregated risks (multiple events → one risk)
CREATE TABLE risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., PECU-2026-0045
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'labor_unrest', 'bankruptcy', 'environmental', 'regulatory', 'infrastructure'
  region_id UUID NOT NULL REFERENCES regions(id),
  -- Risk scoring
  severity INT NOT NULL, -- 1-5
  confidence FLOAT NOT NULL, -- 0-1
  exposure_score FLOAT, -- 0-1 (impact magnitude)
  -- Timing
  detected_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP NOT NULL,
  expected_duration_days INT,
  time_to_impact_days INT, -- Estimate of days until supply chain impact
  -- Source events
  source_event_ids UUID[],
  affected_facility_ids UUID[],
  -- Risk status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'escalating', 'resolved', 'mitigated'
  -- Impact data
  estimated_impact_json JSONB, -- {oem_count, tier1_suppliers, monthly_volume_usd, commodities}
  mitigation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risks_key ON risks(risk_key);
CREATE INDEX idx_risks_region ON risks(region_id);
CREATE INDEX idx_risks_severity ON risks(severity);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_detected ON risks(detected_date);
CREATE INDEX idx_risks_category ON risks(category);

-- ============================================================================
-- 4. SUPPLY CHAIN RELATIONSHIPS
-- ============================================================================

-- Supply relationships (who supplies whom)
CREATE TABLE supply_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES organizations(id),
  buyer_id UUID NOT NULL REFERENCES organizations(id),
  commodity_id UUID REFERENCES commodities(id),
  -- Volumes and frequency
  estimated_annual_volume_tonnes FLOAT,
  estimated_monthly_value_usd FLOAT,
  supply_percentage FLOAT, -- % of buyer's commodity sourcing
  frequency VARCHAR(50), -- 'continuous', 'periodic', 'seasonal'
  -- Validity
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  contract_type VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  confidence_score FLOAT DEFAULT 0.5, -- Based on evidence quality
  source_evidence VARCHAR(500), -- 'customs_data', 'press_release', 'supplier_list', 'inference'
  last_verified_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supply_supplier ON supply_relationships(supplier_id);
CREATE INDEX idx_supply_buyer ON supply_relationships(buyer_id);
CREATE INDEX idx_supply_commodity ON supply_relationships(commodity_id);
CREATE INDEX idx_supply_active ON supply_relationships(is_active);

-- Facility production relationships
CREATE TABLE facility_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id UUID NOT NULL REFERENCES facilities(id),
  commodity_id UUID NOT NULL REFERENCES commodities(id),
  production_capacity_annual_tonnes FLOAT,
  actual_production_annual_tonnes FLOAT,
  percent_capacity FLOAT, -- 0-100
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_production_facility ON facility_production(facility_id);
CREATE INDEX idx_production_commodity ON facility_production(commodity_id);

-- ============================================================================
-- 5. OEM EXPOSURE & IMPACT ANALYSIS
-- ============================================================================

-- OEM exposure to commodities/regions
CREATE TABLE oem_commodity_exposure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oem_id UUID NOT NULL REFERENCES organizations(id),
  commodity_id UUID NOT NULL REFERENCES commodities(id),
  dependency_percentage FLOAT, -- 0-100
  concentration_geographic TEXT[], -- ['peru', 'mexico']
  concentration_risk_level VARCHAR(50), -- 'HIGH', 'MEDIUM', 'LOW'
  tier2_supplier_count INT,
  alternative_sources INT,
  estimated_lead_time_weeks INT,
  inventory_buffer_weeks INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exposure_oem ON oem_commodity_exposure(oem_id);
CREATE INDEX idx_exposure_commodity ON oem_commodity_exposure(commodity_id);

-- OEM exposure to specific risks
CREATE TABLE oem_risk_exposure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oem_id UUID NOT NULL REFERENCES organizations(id),
  risk_id UUID NOT NULL REFERENCES risks(id),
  affected_tier1_suppliers INT,
  disruption_probability_6w FLOAT, -- 0-1
  estimated_disruption_days INT,
  supply_gap_tonnes FLOAT,
  financial_impact_usd FLOAT,
  risk_assessment_json JSONB, -- {supply_gaps, alternatives, timeline, recommendations}
  mitigation_status VARCHAR(50), -- 'not_started', 'in_progress', 'mitigated'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_oem_exposure_oem ON oem_risk_exposure(oem_id);
CREATE INDEX idx_oem_exposure_risk ON oem_risk_exposure(risk_id);
CREATE INDEX idx_oem_exposure_probability ON oem_risk_exposure(disruption_probability_6w);

-- ============================================================================
-- 6. AUDIT & TRACKING
-- ============================================================================

-- Entity resolution matches (for tracking fuzzy matches)
CREATE TABLE entity_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name VARCHAR(500),
  source_language VARCHAR(50),
  matched_entity_id UUID, -- Can reference org, facility, or commodity
  matched_entity_type VARCHAR(50), -- 'organization', 'facility', 'commodity'
  match_score FLOAT, -- 0-1
  match_method VARCHAR(100), -- 'fuzzy_string', 'address_match', 'ownership_chain', 'manual'
  confirmed BOOLEAN DEFAULT FALSE,
  human_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_entity_source ON entity_matches(source_name);
CREATE INDEX idx_entity_matched ON entity_matches(matched_entity_id);

-- Processing logs (for debugging and auditing)
CREATE TABLE processing_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  step VARCHAR(100), -- 'scrape', 'translate', 'classify', 'entity_extract', 'risk_aggregate'
  status VARCHAR(50), -- 'success', 'warning', 'error'
  message TEXT,
  details_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_event ON processing_logs(event_id);
CREATE INDEX idx_logs_step ON processing_logs(step);
CREATE INDEX idx_logs_status ON processing_logs(status);

-- ============================================================================
-- 7. CONFIGURATION & METADATA
-- ============================================================================

-- Risk thresholds and weights
CREATE TABLE risk_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  data_type VARCHAR(50), -- 'float', 'int', 'string', 'json'
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial config
INSERT INTO risk_config (config_key, config_value, data_type, description) VALUES
  ('severity_weight_strike', '0.85', 'float', 'Weight for strike events in risk scoring'),
  ('severity_weight_bankruptcy', '0.90', 'float', 'Weight for bankruptcy events'),
  ('severity_weight_environmental', '0.75', 'float', 'Weight for environmental shutdowns'),
  ('severity_weight_regulatory', '0.70', 'float', 'Weight for regulatory actions'),
  ('severity_weight_infrastructure', '0.60', 'float', 'Weight for infrastructure outages'),
  ('min_confidence_threshold', '0.60', 'float', 'Minimum confidence to create risk'),
  ('impact_decay_rate', '0.05', 'float', 'Weekly decay rate for risk impact'),
  ('substitution_difficulty_high', '3.0', 'float', 'Multiplier for hard-to-substitute commodities'),
  ('tier_2_exposure_multiplier', '0.6', 'float', 'Exposure multiplier for Tier-2 suppliers')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. MATERIALIZED VIEWS (for fast queries)
-- ============================================================================

-- Regional risk summary (refreshed periodically)
CREATE MATERIALIZED VIEW regional_risk_summary AS
SELECT
  r.id as region_id,
  r.code,
  r.name,
  COUNT(DISTINCT ri.id) as active_risk_count,
  AVG(ri.severity) as avg_severity,
  MAX(ri.severity) as max_severity,
  COUNT(DISTINCT e.id) as recent_event_count,
  MAX(e.detected_date) as latest_event_date,
  COUNT(DISTINCT ore.oem_id) as affected_oem_count
FROM regions r
LEFT JOIN risks ri ON ri.region_id = r.id AND ri.status = 'active'
LEFT JOIN events e ON e.region_id = r.id AND e.detected_date > NOW() - INTERVAL '30 days'
LEFT JOIN oem_risk_exposure ore ON ore.risk_id = ri.id
GROUP BY r.id, r.code, r.name
WITH DATA;

CREATE INDEX idx_regional_summary_region ON regional_risk_summary(region_id);

-- OEM risk profile (refreshed periodically)
CREATE MATERIALIZED VIEW oem_risk_profile AS
SELECT
  o.id as oem_id,
  o.org_id,
  o.name,
  COUNT(DISTINCT ore.risk_id) as active_risk_count,
  SUM(ore.disruption_probability_6w) as cumulative_disruption_probability,
  AVG(ri.severity) as avg_risk_severity,
  COUNT(DISTINCT ore.affected_tier1_suppliers) as affected_tier1_suppliers_total,
  SUM(ore.financial_impact_usd) as total_financial_exposure
FROM organizations o
LEFT JOIN oem_risk_exposure ore ON ore.oem_id = o.id
LEFT JOIN risks ri ON ri.id = ore.risk_id AND ri.status = 'active'
WHERE o.org_type = 'oem'
GROUP BY o.id, o.org_id, o.name
WITH DATA;

CREATE INDEX idx_oem_profile_oem ON oem_risk_profile(oem_id);

-- ============================================================================
-- 9. CONSTRAINTS & TRIGGERS
-- ============================================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_timestamp BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_facilities_timestamp BEFORE UPDATE ON facilities
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_events_timestamp BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_risks_timestamp BEFORE UPDATE ON risks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 10. INITIAL DATA SEEDING
-- ============================================================================

-- Seed regions
INSERT INTO regions (code, name, country, primary_commodities, monitored_since) VALUES
  ('peru', 'Peru', 'Peru', '["copper", "lithium"]', CURRENT_TIMESTAMP),
  ('mexico', 'Mexico', 'Mexico', '["copper", "semiconductors", "auto_parts"]', CURRENT_TIMESTAMP),
  ('vietnam', 'Vietnam', 'Vietnam', '["semiconductors", "electronics"]', CURRENT_TIMESTAMP)
ON CONFLICT (code) DO NOTHING;

-- Seed commodities
INSERT INTO commodities (commodity_code, name, category, substitution_difficulty, industry_classification) VALUES
  ('copper_cathode', 'Copper Cathode', 'raw_material', 'high', 'metals'),
  ('copper_ore', 'Copper Ore', 'raw_material', 'high', 'metals'),
  ('lithium_hydroxide', 'Lithium Hydroxide', 'raw_material', 'high', 'chemicals'),
  ('semiconductor', 'Semiconductor', 'component', 'high', 'electronics'),
  ('auto_part', 'Auto Component', 'component', 'medium', 'automotive')
ON CONFLICT (commodity_code) DO NOTHING;

-- ============================================================================
-- 11. GRANTS (for application user)
-- ============================================================================

GRANT CONNECT ON DATABASE risk_radar TO risk_user;
GRANT USAGE ON SCHEMA public TO risk_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO risk_user;
GRANT SELECT, USAGE ON ALL SEQUENCES IN SCHEMA public TO risk_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO risk_user;
