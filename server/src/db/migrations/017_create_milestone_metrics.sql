-- ============================================================================
-- TABLE: MILESTONE_METRICS
-- ============================================================================
-- Purpose: Stores milestone issue count metrics for projects
-- Updated by: "Refresh Data" button on project overview page
-- Tracks max, min, and average issue counts for active (non-expired) milestones

CREATE TABLE IF NOT EXISTS milestone_metrics (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone Issue Count Metrics
  max_issues INTEGER DEFAULT 0,                        -- Maximum issues in a single milestone
  min_issues INTEGER DEFAULT 0,                        -- Minimum issues in a single milestone
  avg_issues FLOAT DEFAULT 0,                          -- Average issues across milestones
  total_milestones INTEGER DEFAULT 0,                  -- Total active, non-expired milestones
  
  -- Additional Context
  milestone_with_max_issues TEXT,                      -- Name of milestone with max issues
  milestone_with_min_issues TEXT,                      -- Name of milestone with min issues
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- When metrics were calculated
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_milestone_metrics_project_id ON milestone_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_metrics_calculated_at ON milestone_metrics(calculated_at DESC);
