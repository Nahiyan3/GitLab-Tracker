-- ============================================================================
-- TABLE: ISSUE_HEALTH_METRICS
-- ============================================================================
-- Purpose: Stores ALL calculated issue metrics for projects (complete history)
-- Updated by: "Refresh Data" button on project overview page
-- Each refresh creates a NEW row - no updates, only inserts
-- Frontend fetches latest by calculated_at timestamp

CREATE TABLE IF NOT EXISTS issue_health_metrics (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic Counts
  total_open_issues INTEGER DEFAULT 0,
  total_closed_issues INTEGER DEFAULT 0,
  
  -- TIER 1 CRITICAL METRICS
  
  -- Metric 1: Velocity (Issues Closed Per Week)
  issues_closed_last_7d INTEGER DEFAULT 0,
  issues_closed_last_30d INTEGER DEFAULT 0,
  
  -- Metric 2: Issue Cycle Time
  total_resolution_hours FLOAT DEFAULT 0,
  issues_with_resolution_time INTEGER DEFAULT 0,
  avg_cycle_time_hours FLOAT DEFAULT 0,
  avg_cycle_time_days FLOAT DEFAULT 0,
  
  -- Metric 3: Issue Reopen Rate
  issues_reopened_count INTEGER DEFAULT 0,
  issues_checked_for_reopens INTEGER DEFAULT 0,
  reopen_rate_percent FLOAT DEFAULT 0,
  
  -- Metric 4: Bug vs Feature Ratio
  bug_issues_count INTEGER DEFAULT 0,
  feature_issues_count INTEGER DEFAULT 0,
  bug_ratio_percent FLOAT DEFAULT 0,
  
  -- TIER 2 IMPORTANT METRICS
  
  -- Metric 5: Issues Opened Per Week
  issues_opened_last_7d INTEGER DEFAULT 0,
  issues_opened_last_30d INTEGER DEFAULT 0,
  net_issue_change_7d INTEGER DEFAULT 0,  -- opened - closed
  
  -- Metric 6: Stale Issues
  stale_issues_count INTEGER DEFAULT 0,  -- Open >60 days no activity
  stale_issues_percent FLOAT DEFAULT 0,
  
  -- Metric 7: Critical/Blocker Issues
  critical_issues_open INTEGER DEFAULT 0,
  blocker_issues_open INTEGER DEFAULT 0,
  critical_avg_resolution_hours FLOAT DEFAULT 0,
  
  -- Metric 8: Issue-to-MR Link Rate
  issues_with_mr_links INTEGER DEFAULT 0,
  total_closed_issues_checked INTEGER DEFAULT 0,
  issue_mr_link_rate_percent FLOAT DEFAULT 0,
  
  -- Alert Flags (Calculated)
  velocity_alert_level VARCHAR(20),  -- 'NORMAL', 'WARNING', 'RED_ALERT'
  cycle_time_alert_level VARCHAR(20),
  reopen_rate_alert_level VARCHAR(20),
  bug_ratio_alert_level VARCHAR(20),
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_id ON issue_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_calculated_at ON issue_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_time ON issue_health_metrics(project_id, calculated_at DESC);

-- ============================================================================
-- TABLE: ISSUE_METRICS_HISTORY
-- ============================================================================
-- Purpose: Stores historical snapshots for trend analysis
-- One row per calculation (for week-over-week comparison)

CREATE TABLE IF NOT EXISTS issue_metrics_history (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Snapshot of key metrics (for trends)
  total_open_issues INTEGER DEFAULT 0,
  total_closed_issues INTEGER DEFAULT 0,
  issues_closed_last_7d INTEGER DEFAULT 0,
  avg_cycle_time_days FLOAT DEFAULT 0,
  reopen_rate_percent FLOAT DEFAULT 0,
  bug_ratio_percent FLOAT DEFAULT 0,
  stale_issues_count INTEGER DEFAULT 0,
  critical_issues_open INTEGER DEFAULT 0,
  
  -- Timestamp
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Index for fast queries
  CONSTRAINT idx_history_project_date UNIQUE(project_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_history_project ON issue_metrics_history(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_date ON issue_metrics_history(snapshot_date DESC);

-- Comments
COMMENT ON TABLE issue_health_metrics IS 'Current issue health metrics for each project';
COMMENT ON TABLE issue_metrics_history IS 'Historical snapshots for trend analysis and week-over-week comparison';
