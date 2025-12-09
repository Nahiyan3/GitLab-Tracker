-- Migration 013: Create SonarQube Reliability Metrics Tables
-- This migration creates tables to store SonarQube reliability metrics

-- Create sonarqube_reliability_metrics table
CREATE TABLE IF NOT EXISTS sonarqube_reliability_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total INTEGER DEFAULT 0,
  bugs_critical INTEGER DEFAULT 0,
  bugs_blocker INTEGER DEFAULT 0,
  bugs_new INTEGER DEFAULT 0,
  reliability_rating VARCHAR(1) DEFAULT 'A',
  reliability_rating_value INTEGER DEFAULT 1,
  reliability_remediation_effort INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reliability metrics
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_project_id 
  ON sonarqube_reliability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_calculated_at 
  ON sonarqube_reliability_metrics(calculated_at);

-- Create sonarqube_reliability_history table (daily snapshots)
CREATE TABLE IF NOT EXISTS sonarqube_reliability_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total INTEGER DEFAULT 0,
  reliability_rating VARCHAR(1) DEFAULT 'A',
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_reliability_history_unique UNIQUE (project_id, snapshot_date)
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_history_project_date 
  ON sonarqube_reliability_history(project_id, snapshot_date);
