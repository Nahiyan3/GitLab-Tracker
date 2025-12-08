-- Migration 011: Create SonarQube Maintainability Metrics Tables
-- This migration creates tables to store SonarQube maintainability metrics

-- Create sonarqube_maintainability_metrics table
CREATE TABLE IF NOT EXISTS sonarqube_maintainability_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high INTEGER DEFAULT 0,
  maintainability_blocker INTEGER DEFAULT 0,
  technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
  maintainability_rating VARCHAR(1) DEFAULT 'A',
  maintainability_rating_value INTEGER DEFAULT 1,
  code_smells_total INTEGER DEFAULT 0,
  code_smells_new INTEGER DEFAULT 0,
  cyclomatic_complexity INTEGER DEFAULT 0,
  cognitive_complexity INTEGER DEFAULT 0,
  duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
  duplicated_lines_new DOUBLE PRECISION DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for maintainability metrics
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_project_id 
  ON sonarqube_maintainability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_calculated_at 
  ON sonarqube_maintainability_metrics(calculated_at);

-- Create sonarqube_maintainability_history table (daily snapshots)
CREATE TABLE IF NOT EXISTS sonarqube_maintainability_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high INTEGER DEFAULT 0,
  maintainability_blocker INTEGER DEFAULT 0,
  technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
  maintainability_rating VARCHAR(1) DEFAULT 'A',
  code_smells_total INTEGER DEFAULT 0,
  duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_maintainability_history_unique UNIQUE (project_id, snapshot_date)
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_history_project_date 
  ON sonarqube_maintainability_history(project_id, snapshot_date);

RAISE NOTICE 'Migration 011: SonarQube Maintainability Metrics tables created successfully';
