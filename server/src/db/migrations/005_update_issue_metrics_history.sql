-- Migration: Remove UNIQUE constraint to allow multiple snapshots per project
-- This allows saving history every time refresh button is clicked

-- Drop the unique constraint (PostgreSQL syntax)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_metrics') THEN
        ALTER TABLE issue_health_metrics DROP CONSTRAINT unique_project_metrics;
    END IF;
END $$;

-- Add composite index for efficient latest record queries
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_time ON issue_health_metrics(project_id, calculated_at DESC);

-- Update table comment
COMMENT ON TABLE issue_health_metrics IS 'Complete history of issue health metrics - one row per refresh (no updates, only inserts). Frontend fetches latest by calculated_at timestamp.';
