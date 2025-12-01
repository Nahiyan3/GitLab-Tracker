-- ============================================================================
-- Migration 010: Add commit_details column to commit_health_metrics
-- ============================================================================
-- Purpose: Store raw commit data (titles, messages, authors) for future analysis

-- Add commit_details column (will ignore if already exists)
ALTER TABLE commit_health_metrics 
ADD COLUMN IF NOT EXISTS commit_details JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB querying
CREATE INDEX IF NOT EXISTS idx_commit_details_gin 
ON commit_health_metrics USING GIN (commit_details);
