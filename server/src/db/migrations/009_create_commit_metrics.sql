-- ============================================================================
-- TABLE: COMMIT_HEALTH_METRICS
-- ============================================================================
-- Purpose: Stores ALL calculated commit metrics for projects (complete history)
-- Updated by: "Refresh Data" button on project overview page
-- Each refresh creates a NEW row - no updates, only inserts
-- Frontend fetches latest by calculated_at timestamp

CREATE TABLE IF NOT EXISTS commit_health_metrics (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Basic Counts
  total_commits_last_7d INTEGER DEFAULT 0,
  
  -- COMMIT METRICS
  
  -- Metric 1: Average Commit Size
  total_lines_changed INTEGER DEFAULT 0,
  commits_analyzed INTEGER DEFAULT 0,
  avg_commit_size FLOAT DEFAULT 0,
  
  -- Metric 2: Lines Added vs Deleted
  total_lines_added INTEGER DEFAULT 0,
  total_lines_deleted INTEGER DEFAULT 0,
  lines_added_deleted_ratio FLOAT DEFAULT 0,
  
  -- Metric 3: Commits Per Week
  commits_per_week INTEGER DEFAULT 0,
  
  -- Metric 4: Bus Factor
  total_contributors INTEGER DEFAULT 0,
  contributors_above_50_percent INTEGER DEFAULT 0,
  bus_factor INTEGER DEFAULT 0,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on project_id and calculated_at for fast lookups
CREATE INDEX IF NOT EXISTS idx_commit_metrics_project_id ON commit_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_commit_metrics_calculated_at ON commit_health_metrics(calculated_at DESC);

-- ============================================================================
-- TABLE: COMMIT_METRICS_HISTORY
-- ============================================================================
-- Purpose: Daily snapshots for trend analysis
-- One row per project per day

CREATE TABLE IF NOT EXISTS commit_metrics_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Snapshot data
  total_commits_last_7d INTEGER DEFAULT 0,
  avg_commit_size FLOAT DEFAULT 0,
  total_lines_added INTEGER DEFAULT 0,
  total_lines_deleted INTEGER DEFAULT 0,
  bus_factor INTEGER DEFAULT 0,
  
  snapshot_date DATE NOT NULL,
  
  -- Unique constraint: one snapshot per project per day
  CONSTRAINT commit_metrics_history_unique UNIQUE (project_id, snapshot_date)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_commit_history_project_date ON commit_metrics_history(project_id, snapshot_date DESC);
