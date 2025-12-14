-- Migration 014: Create SonarQube Security Metrics Tables
-- This migration creates tables to store SonarQube security metrics

-- Create sonarqube_security_metrics table
CREATE TABLE IF NOT EXISTS sonarqube_security_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total INTEGER DEFAULT 0,
  vulnerabilities_new INTEGER DEFAULT 0,
  security_rating VARCHAR(1) DEFAULT 'A',
  security_rating_value INTEGER DEFAULT 1,
  security_hotspots_total INTEGER DEFAULT 0,
  security_hotspots_reviewed NUMERIC(5, 2) DEFAULT 0.00,
  security_review_rating VARCHAR(1) DEFAULT 'A',
  security_review_rating_value INTEGER DEFAULT 1,
  security_remediation_effort INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for security metrics
CREATE INDEX IF NOT EXISTS idx_sonar_security_project_id 
  ON sonarqube_security_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_security_calculated_at 
  ON sonarqube_security_metrics(calculated_at);

-- Create sonarqube_security_history table (daily snapshots)
CREATE TABLE IF NOT EXISTS sonarqube_security_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total INTEGER DEFAULT 0,
  security_rating VARCHAR(1) DEFAULT 'A',
  security_hotspots_total INTEGER DEFAULT 0,
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_security_history_unique UNIQUE (project_id, snapshot_date)
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_sonar_security_history_project_date 
  ON sonarqube_security_history(project_id, snapshot_date);
