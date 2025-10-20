-- Tracked Projects Table
-- Stores ALL GitLab projects with their tracking status and complete metadata

CREATE TABLE IF NOT EXISTS tracked_projects (
  id INTEGER PRIMARY KEY,                    -- GitLab project ID
  name VARCHAR(255) NOT NULL,                -- Project name
  description TEXT,                          -- Project description
  web_url TEXT,                              -- GitLab project URL
  last_activity_at TIMESTAMP,                -- Last activity timestamp
  visibility VARCHAR(50),                    -- Project visibility (private, internal, public)
  star_count INTEGER DEFAULT 0,              -- Number of stars
  forks_count INTEGER DEFAULT 0,             -- Number of forks
  parent_id INTEGER,                         -- Immediate parent group/namespace ID (NULL if no parent)
  group_path TEXT,                           -- Full group hierarchy path (parent1/parent2/...)
  full_path TEXT,                            -- Full project path with groups (projectname/parent1/parent2)
  tracked BOOLEAN DEFAULT FALSE,             -- Track status (true = tracked, false = not tracked)
  total_issues INTEGER DEFAULT 0,            -- Total count of issues
  total_mrs INTEGER DEFAULT 0,               -- Total count of merge requests
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When first synced from GitLab
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When tracking status was last changed
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When last synced from GitLab API
  sonar_project_key TEXT,                          -- SonarCloud project key (for API queries)
  sonar_security_high INTEGER DEFAULT 0,           -- SonarQube: Security issues (CRITICAL)
  sonar_security_blocker INTEGER DEFAULT 0,        -- SonarQube: Security issues (BLOCKER)
  sonar_reliability_high INTEGER DEFAULT 0,        -- SonarQube: Reliability issues (CRITICAL)
  sonar_reliability_blocker INTEGER DEFAULT 0,     -- SonarQube: Reliability issues (BLOCKER)
  sonar_maintainability_high INTEGER DEFAULT 0,    -- SonarQube: Maintainability issues (CRITICAL)
  sonar_maintainability_blocker INTEGER DEFAULT 0  -- SonarQube: Maintainability issues (BLOCKER)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tracked_projects_parent_id ON tracked_projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_tracked_projects_tracked ON tracked_projects(tracked);

-- Add unique constraint to prevent duplicate projects
ALTER TABLE tracked_projects ADD CONSTRAINT unique_project_id UNIQUE (id);
