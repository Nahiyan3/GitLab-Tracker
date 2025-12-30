-- Migration: Create DORA Metrics Tables
-- Description: Creates 4 tables for manual DORA metrics input
-- Created: 2025-12-29
-- Migration Number: 019

-- 1. Deployment Frequency Table
CREATE TABLE IF NOT EXISTS deployment_frequency (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id VARCHAR(255) NOT NULL,
  version VARCHAR(100),
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  deployment_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deployment_frequency_project_id ON deployment_frequency(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_timestamp ON deployment_frequency(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_environment ON deployment_frequency(environment);

-- 2. Lead Time for Changes Table
CREATE TABLE IF NOT EXISTS lead_time_changes (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_id VARCHAR(255) NOT NULL,
  merged_timestamp TIMESTAMP NOT NULL,
  deployed_timestamp TIMESTAMP NOT NULL,
  lead_time_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_time_changes_project_id ON lead_time_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_merged ON lead_time_changes(merged_timestamp);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_deployed ON lead_time_changes(deployed_timestamp);

-- 3. Change Failure Rate Table
CREATE TABLE IF NOT EXISTS change_failure_rate (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id VARCHAR(255) NOT NULL,
  deployment_timestamp TIMESTAMP NOT NULL,
  has_incident BOOLEAN NOT NULL DEFAULT false,
  remediation_type VARCHAR(50) NOT NULL DEFAULT 'none',
  is_failure BOOLEAN GENERATED ALWAYS AS (
    has_incident AND remediation_type IN ('rollback', 'hotfix', 'emergency')
  ) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_failure_rate_project_id ON change_failure_rate(project_id);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_timestamp ON change_failure_rate(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_failure ON change_failure_rate(is_failure);

-- 4. Time to Restore Service Table
CREATE TABLE IF NOT EXISTS time_to_restore_service (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  incident_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  restore_time_hours DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_time_to_restore_project_id ON time_to_restore_service(project_id);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_start ON time_to_restore_service(start_time);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_end ON time_to_restore_service(end_time);

-- Add comments for documentation
COMMENT ON TABLE deployment_frequency IS 'Tracks production deployments for DORA Deployment Frequency metric';
COMMENT ON TABLE lead_time_changes IS 'Tracks time from code merge to production deployment for DORA Lead Time metric';
COMMENT ON TABLE change_failure_rate IS 'Tracks deployment failures and incidents for DORA Change Failure Rate metric';
COMMENT ON TABLE time_to_restore_service IS 'Tracks incident resolution times for DORA Time to Restore Service metric';
