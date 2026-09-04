-- SIF-Sentinel SQL Schema (SQLite / PostgreSQL Compatible)

CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(64) NOT NULL,
  source VARCHAR(64) NOT NULL,
  asset VARCHAR(128) NOT NULL,
  location VARCHAR(128),
  contractor VARCHAR(128),
  reported_by VARCHAR(128),
  timestamp TIMESTAMP NOT NULL,
  recorded_severity VARCHAR(64),
  narrative TEXT NOT NULL,
  energy_source VARCHAR(128) NOT NULL,
  energy_source_id VARCHAR(16) NOT NULL,
  energy_level VARCHAR(32) NOT NULL,
  exposure_type VARCHAR(128) NOT NULL,
  barrier_status VARCHAR(128) NOT NULL,
  life_saving_rule VARCHAR(128) NOT NULL,
  sps INTEGER NOT NULL,
  sps_tier VARCHAR(32) NOT NULL,
  sps_breakdown JSON,
  counterfactual JSON,
  evidence_spans JSON,
  status VARCHAR(64) NOT NULL,
  sla_hours_remaining REAL DEFAULT 0,
  assigned_to VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id VARCHAR(32) NOT NULL,
  action VARCHAR(128) NOT NULL,
  user VARCHAR(128) NOT NULL,
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS capa_actions (
  id VARCHAR(32) PRIMARY KEY,
  source_report VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  owner VARCHAR(128) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(64) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  asset VARCHAR(128) NOT NULL,
  sap_work_order VARCHAR(64),
  verification_required BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_report) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS mlops_models (
  version VARCHAR(64) PRIMARY KEY,
  status VARCHAR(64) NOT NULL,
  accuracy VARCHAR(16),
  recall VARCHAR(16),
  precision VARCHAR(16),
  f1 VARCHAR(16),
  records_scored VARCHAR(32),
  last_retrained DATE,
  drift_status VARCHAR(64)
);
