-- Migration 020: Create weekly DORA metrics snapshots table
-- This table stores aggregated DORA metrics for each week to track trends over time

CREATE TABLE IF NOT EXISTS weekly_dora_snapshots (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_id SERIAL UNIQUE NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Week period
    week_start_date DATE NOT NULL, -- Sunday
    week_end_date DATE NOT NULL,   -- Saturday
    
    -- Deployment Frequency
    total_deployments INTEGER NOT NULL DEFAULT 0,
    production_deployments INTEGER NOT NULL DEFAULT 0,
    
    -- Change Failure Rate
    failed_deployments INTEGER NOT NULL DEFAULT 0,
    failure_rate_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
    
    -- Lead Time for Changes
    total_changes INTEGER NOT NULL DEFAULT 0,
    avg_lead_time_hours DECIMAL(10, 2),
    
    -- Time to Restore Service
    total_incidents INTEGER NOT NULL DEFAULT 0,
    avg_restore_time_hours DECIMAL(10, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one snapshot per project per week
    CONSTRAINT unique_project_week UNIQUE (project_id, week_start_date)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_id ON weekly_dora_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_week_start ON weekly_dora_snapshots(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_week ON weekly_dora_snapshots(project_id, week_start_date DESC);

-- Comments
COMMENT ON TABLE weekly_dora_snapshots IS 'Weekly snapshots of DORA metrics for trend analysis';
COMMENT ON COLUMN weekly_dora_snapshots.week_start_date IS 'Start of the week (Sunday)';
COMMENT ON COLUMN weekly_dora_snapshots.week_end_date IS 'End of the week (Saturday)';
COMMENT ON COLUMN weekly_dora_snapshots.total_deployments IS 'Total deployments in the week';
COMMENT ON COLUMN weekly_dora_snapshots.failure_rate_percent IS 'Percentage of failed deployments';
COMMENT ON COLUMN weekly_dora_snapshots.avg_lead_time_hours IS 'Average lead time for changes in hours';
COMMENT ON COLUMN weekly_dora_snapshots.avg_restore_time_hours IS 'Average time to restore service in hours';
