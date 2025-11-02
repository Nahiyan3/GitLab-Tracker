-- ============================================================================
-- TABLE 1: PROJECTS (All Projects - Lightweight)
-- ============================================================================
-- Purpose: Stores basic project information for ALL projects (tracked or not)
-- Updated by: "Sync from GitLab" button on All Projects page

CREATE TABLE IF NOT EXISTS projects (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),     -- Primary key (UUID)
  row_id SERIAL NOT NULL,                              -- Auto-incrementing row number
  
  -- GitLab Identifiers
  id INTEGER UNIQUE NOT NULL,                          -- GitLab project ID
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,                          -- Project name
  full_path TEXT,                                      -- Full project path with groups
  group_path TEXT,                                     -- Group hierarchy path
  
  -- Project Details
  members_count INTEGER DEFAULT 0,                     -- Number of project members
  members JSONB,                                       -- Member list with details (id, name, username, accessLevel)
  last_activity_at TIMESTAMP,                          -- Last activity timestamp
  parent_id INTEGER,                                   -- Parent group/namespace ID
  visibility VARCHAR(50),                              -- Project visibility (private/public/internal)
  
  -- SonarCloud Integration
  sonar_project_key TEXT,                              -- SonarCloud project key (mapped via auto-mapper)
  
  -- Tracking Status
  tracked BOOLEAN DEFAULT FALSE,                       -- Is this project being tracked?
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- When project was first added
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,      -- When project info was last updated
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP        -- When last synced from GitLab API
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(id);
CREATE INDEX IF NOT EXISTS idx_projects_tracked ON projects(tracked);
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_synced_at ON projects(synced_at DESC);


-- ============================================================================
-- TABLE 2: TRACKED_PROJECT_SNAPSHOTS (Historical Data for Tracked Projects)
-- ============================================================================
-- Purpose: Stores time-series metrics for TRACKED projects only
-- Updated by: "Refresh All" and individual "Refresh" buttons
-- Historical: Only INSERT (never UPDATE or DELETE) - keeps all historical data

CREATE TABLE IF NOT EXISTS tracked_project_snapshots (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),     -- Primary key (UUID)
  row_id SERIAL NOT NULL,                              -- Auto-incrementing row number
  
  -- Foreign Key (links to projects table)
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  
  -- GitLab Project Details
  description TEXT,                                    -- Project description
  web_url TEXT,                                        -- GitLab project URL
  
  -- GitLab Statistics (OPEN only)
  open_issues INTEGER DEFAULT 0,                       -- Count of OPEN issues
  open_mrs INTEGER DEFAULT 0,                          -- Count of OPEN merge requests
  open_milestones_count INTEGER DEFAULT 0,             -- Count of open milestones
  
  -- SonarCloud Metrics
  sonar_project_key TEXT,                              -- SonarCloud project key
  sonar_security_high INTEGER DEFAULT 0,               -- Security issues (CRITICAL)
  sonar_security_blocker INTEGER DEFAULT 0,            -- Security issues (BLOCKER)
  sonar_reliability_high INTEGER DEFAULT 0,            -- Reliability issues (CRITICAL)
  sonar_reliability_blocker INTEGER DEFAULT 0,         -- Reliability issues (BLOCKER)
  sonar_maintainability_high INTEGER DEFAULT 0,        -- Maintainability issues (CRITICAL)
  sonar_maintainability_blocker INTEGER DEFAULT 0,     -- Maintainability issues (BLOCKER)
  
  -- Snapshot Metadata
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When this snapshot was taken
  
  -- Constraints
  CONSTRAINT fk_project FOREIGN KEY (project_uuid) REFERENCES projects(uuid) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_project_uuid ON tracked_project_snapshots(project_uuid);
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date ON tracked_project_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_project_date ON tracked_project_snapshots(project_uuid, snapshot_date DESC);


-- ============================================================================
-- VIEW: Latest snapshot for each tracked project (for frontend display)
-- ============================================================================





