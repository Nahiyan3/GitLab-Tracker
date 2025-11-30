-- ============================================================================
-- TABLE: MR_HEALTH_METRICS
-- ============================================================================
-- Purpose: Stores ALL calculated MR metrics for projects (complete history)
-- Updated by: "Refresh Data" button on project overview page
-- Each refresh creates a NEW row - no updates, only inserts
-- Frontend fetches latest by calculated_at timestamp

CREATE TABLE IF NOT EXISTS mr_health_metrics (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic Counts
  total_open_mrs INTEGER DEFAULT 0,
  total_merged_mrs INTEGER DEFAULT 0,
  
  -- TIER 1 CRITICAL METRICS
  
  -- Metric 1: MRs Merged Per Week
  mrs_merged_last_7d INTEGER DEFAULT 0,
  mrs_merged_last_30d INTEGER DEFAULT 0,
  
  -- Metric 2: MR Merge Time
  total_merge_time_hours FLOAT DEFAULT 0,
  mrs_with_merge_time INTEGER DEFAULT 0,
  avg_merge_time_hours FLOAT DEFAULT 0,
  avg_merge_time_days FLOAT DEFAULT 0,
  
  -- Metric 3: Review Comments Per MR
  total_review_comments INTEGER DEFAULT 0,
  mrs_checked_for_comments INTEGER DEFAULT 0,
  avg_review_comments_per_mr FLOAT DEFAULT 0,
  
  -- Metric 4: MR Revert Rate
  reverted_mrs_count INTEGER DEFAULT 0,
  mrs_checked_for_reverts INTEGER DEFAULT 0,
  revert_rate_percent FLOAT DEFAULT 0,
  
  -- TIER 2 IMPORTANT METRICS
  
  -- Metric 5: MRs Opened Per Week
  mrs_opened_last_7d INTEGER DEFAULT 0,
  mrs_opened_last_30d INTEGER DEFAULT 0,
  net_mr_change_7d INTEGER DEFAULT 0,  -- opened - merged
  
  -- Metric 6: Stale MRs
  stale_mrs_count INTEGER DEFAULT 0,  -- Open >14 days no activity
  stale_mrs_percent FLOAT DEFAULT 0,
  
  -- Metric 7: Reviewers Per MR
  total_reviewers_count INTEGER DEFAULT 0,
  mrs_checked_for_reviewers INTEGER DEFAULT 0,
  avg_reviewers_per_mr FLOAT DEFAULT 0,
  
  -- Alert Flags (Calculated)
  merge_velocity_alert_level VARCHAR(20),  -- 'NORMAL', 'WARNING', 'RED_ALERT'
  merge_time_alert_level VARCHAR(20),
  revert_rate_alert_level VARCHAR(20),
  stale_mrs_alert_level VARCHAR(20),
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_id ON mr_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_calculated_at ON mr_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_time ON mr_health_metrics(project_id, calculated_at DESC);

-- ============================================================================
-- TABLE: MR_METRICS_HISTORY
-- ============================================================================
-- Purpose: Stores historical snapshots for trend analysis
-- One row per calculation (for week-over-week comparison)

CREATE TABLE IF NOT EXISTS mr_metrics_history (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Snapshot of key metrics (for trends)
  total_open_mrs INTEGER DEFAULT 0,
  total_merged_mrs INTEGER DEFAULT 0,
  mrs_merged_last_7d INTEGER DEFAULT 0,
  avg_merge_time_days FLOAT DEFAULT 0,
  avg_review_comments_per_mr FLOAT DEFAULT 0,
  revert_rate_percent FLOAT DEFAULT 0,
  stale_mrs_count INTEGER DEFAULT 0,
  avg_reviewers_per_mr FLOAT DEFAULT 0,
  
  -- Timestamp
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Index for fast queries
  CONSTRAINT idx_mr_history_project_date UNIQUE(project_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_mr_metrics_history_project ON mr_metrics_history(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_history_date ON mr_metrics_history(snapshot_date DESC);

-- Comments
COMMENT ON TABLE mr_health_metrics IS 'Complete history of MR health metrics - one row per refresh (no updates, only inserts). Frontend fetches latest by calculated_at timestamp.';
COMMENT ON TABLE mr_metrics_history IS 'Historical snapshots for trend analysis and week-over-week comparison';
