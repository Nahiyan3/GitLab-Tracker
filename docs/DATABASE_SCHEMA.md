# Database Schema Documentation

Complete PostgreSQL database schema for GitLab Analytics. All tables use UUIDs as primary keys with auto-incrementing row IDs for reference.

---

## Table of Contents

1. [Core Tables](#core-tables)
   - [projects](#projects)
   - [tracked_project_snapshots](#tracked_project_snapshots)
   - [project_insights](#project_insights)
2. [Issue Metrics](#issue-metrics)
3. [Merge Request Metrics](#merge-request-metrics)
4. [Commit Metrics](#commit-metrics)
5. [SonarQube Metrics](#sonarqube-metrics)
   - [Maintainability](#maintainability-metrics)
   - [Reliability](#reliability-metrics)
   - [Security](#security-metrics)
6. [Milestone Metrics](#milestone-metrics)
7. [DORA Metrics](#dora-metrics)
8. [Indexes](#indexes)

---

## Core Tables

### projects

Stores basic information for ALL projects (tracked or not). Updated by "Sync from GitLab" button.

```sql
CREATE TABLE IF NOT EXISTS projects (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- GitLab Identifiers
  id INTEGER UNIQUE NOT NULL,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  full_path TEXT,
  group_path TEXT,
  
  -- Project Details
  members_count INTEGER DEFAULT 0,
  members JSONB,
  last_activity_at TIMESTAMP,
  parent_id INTEGER,
  visibility VARCHAR(50),
  
  -- SonarCloud Integration
  sonar_project_key TEXT,
  
  -- Tracking Status
  tracked BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_id ON projects(id);
CREATE INDEX IF NOT EXISTS idx_projects_tracked ON projects(tracked);
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_synced_at ON projects(synced_at DESC);
```

**Columns:**
- `uuid` - Primary key (UUID)
- `row_id` - Auto-incrementing row number
- `id` - GitLab project ID (unique)
- `name` - Project name
- `full_path` - Full project path with groups
- `group_path` - Group hierarchy path
- `members_count` - Number of project members
- `members` - JSONB array with member details
- `last_activity_at` - Last activity timestamp from GitLab
- `parent_id` - Parent group/namespace ID
- `visibility` - Project visibility (private/public/internal)
- `sonar_project_key` - SonarCloud project key (auto-mapped)
- `tracked` - Is this project being monitored?
- `created_at` - When project was first added
- `updated_at` - When project info was last updated
- `synced_at` - When last synced from GitLab API

---

### tracked_project_snapshots

Historical time-series metrics for tracked projects. Only INSERT (never UPDATE) - preserves all historical data.

```sql
CREATE TABLE IF NOT EXISTS tracked_project_snapshots (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  
  -- GitLab Project Details
  description TEXT,
  web_url TEXT,
  
  -- GitLab Statistics (OPEN only)
  open_issues INTEGER DEFAULT 0,
  open_mrs INTEGER DEFAULT 0,
  open_milestones_count INTEGER DEFAULT 0,
  
  -- SonarCloud Metrics
  sonar_project_key TEXT,
  sonar_security_high INTEGER DEFAULT 0,
  sonar_security_blocker INTEGER DEFAULT 0,
  sonar_reliability_high INTEGER DEFAULT 0,
  sonar_reliability_blocker INTEGER DEFAULT 0,
  sonar_maintainability_high INTEGER DEFAULT 0,
  sonar_maintainability_blocker INTEGER DEFAULT 0,
  
  -- Snapshot Metadata
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_project FOREIGN KEY (project_uuid) REFERENCES projects(uuid) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_project_uuid ON tracked_project_snapshots(project_uuid);
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date ON tracked_project_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_project_date ON tracked_project_snapshots(project_uuid, snapshot_date DESC);
```

**Columns:**
- `uuid` - Primary key
- `row_id` - Auto-incrementing row number
- `project_uuid` - Foreign key to projects table
- `description` - Project description
- `web_url` - GitLab project URL
- `open_issues` - Count of open issues
- `open_mrs` - Count of open merge requests
- `open_milestones_count` - Count of open milestones
- `sonar_project_key` - SonarCloud project key
- `sonar_security_high/blocker` - Critical security issues
- `sonar_reliability_high/blocker` - Critical reliability issues
- `sonar_maintainability_high/blocker` - Critical maintainability issues
- `snapshot_date` - When snapshot was taken

---

### project_insights

AI-generated insights for projects. Stores corrected AI analysis with scores.

```sql
CREATE TABLE IF NOT EXISTS project_insights (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  
  -- Corrected Insights Data (JSONB with verified scores)
  insights_data JSONB NOT NULL,
  
  -- Denormalized Scores (for fast filtering)
  final_user_score DECIMAL(3,2),
  api_score DECIMAL(3,2),
  combined_score DECIMAL(3,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_insights_project FOREIGN KEY (project_uuid) REFERENCES projects(uuid) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insights_project_uuid ON project_insights(project_uuid);
CREATE INDEX IF NOT EXISTS idx_insights_scores ON project_insights(combined_score DESC, final_user_score, api_score);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON project_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_jsonb ON project_insights USING GIN (insights_data);
```

**Columns:**
- `uuid` - Primary key
- `row_id` - Auto-incrementing row number
- `project_uuid` - Foreign key to projects table
- `insights_data` - Complete JSONB insights object
- `final_user_score` - Final user score (1-5)
- `api_score` - API score (1-5)
- `combined_score` - Combined score (1-5)
- `created_at` - When insights were generated

---

## Issue Metrics

### issue_health_metrics

Stores ALL calculated issue metrics. Each refresh creates a NEW row (no updates). Frontend fetches latest by `calculated_at`.

```sql
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
  net_issue_change_7d INTEGER DEFAULT 0,
  
  -- Metric 6: Stale Issues
  stale_issues_count INTEGER DEFAULT 0,
  stale_issues_percent FLOAT DEFAULT 0,
  
  -- Metric 7: Critical/Blocker Issues
  critical_issues_open INTEGER DEFAULT 0,
  blocker_issues_open INTEGER DEFAULT 0,
  critical_avg_resolution_hours FLOAT DEFAULT 0,
  
  -- Metric 8: Issue-to-MR Link Rate
  issues_with_mr_links INTEGER DEFAULT 0,
  total_closed_issues_checked INTEGER DEFAULT 0,
  issue_mr_link_rate_percent FLOAT DEFAULT 0,
  
  -- Closure Rate
  closure_rate_percent FLOAT DEFAULT 0,
  
  -- Alert Flags
  velocity_alert_level VARCHAR(20),
  cycle_time_alert_level VARCHAR(20),
  reopen_rate_alert_level VARCHAR(20),
  bug_ratio_alert_level VARCHAR(20),
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_id ON issue_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_calculated_at ON issue_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_time ON issue_health_metrics(project_id, calculated_at DESC);
```

**Key Metrics:**
- **Velocity:** Issues closed per week (7d, 30d)
- **Cycle Time:** Average time to resolve issues
- **Reopen Rate:** Percentage of issues reopened
- **Bug Ratio:** Bugs vs features percentage
- **Stale Issues:** Open >60 days without activity
- **Critical Issues:** Count of critical/blocker priority
- **Issue-MR Link Rate:** Issues linked to merge requests
- **Closure Rate:** Closed vs opened ratio

---

### issue_metrics_history

Daily snapshots for trend analysis. One row per project per day.

```sql
CREATE TABLE IF NOT EXISTS issue_metrics_history (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Snapshot of key metrics
  total_open_issues INTEGER DEFAULT 0,
  total_closed_issues INTEGER DEFAULT 0,
  issues_closed_last_7d INTEGER DEFAULT 0,
  avg_cycle_time_days FLOAT DEFAULT 0,
  reopen_rate_percent FLOAT DEFAULT 0,
  bug_ratio_percent FLOAT DEFAULT 0,
  stale_issues_count INTEGER DEFAULT 0,
  closure_rate_percent FLOAT DEFAULT 0,
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  -- Timestamp
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Unique constraint
  CONSTRAINT issue_metrics_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_history_project_date ON issue_metrics_history(project_id, snapshot_date DESC);
```

---

## Merge Request Metrics

### mr_health_metrics

Stores ALL calculated MR metrics. Each refresh creates a NEW row (no updates).

```sql
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
  net_mr_change_7d INTEGER DEFAULT 0,
  
  -- Metric 6: Stale MRs
  stale_mrs_count INTEGER DEFAULT 0,
  stale_mrs_percent FLOAT DEFAULT 0,
  
  -- Metric 7: Reviewers Per MR
  total_reviewers_count INTEGER DEFAULT 0,
  mrs_checked_for_reviewers INTEGER DEFAULT 0,
  avg_reviewers_per_mr FLOAT DEFAULT 0,
  
  -- Closure Rate
  closure_rate_percent FLOAT DEFAULT 0,
  
  -- Alert Flags
  merge_velocity_alert_level VARCHAR(20),
  merge_time_alert_level VARCHAR(20),
  revert_rate_alert_level VARCHAR(20),
  stale_mrs_alert_level VARCHAR(20),
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_id ON mr_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_calculated_at ON mr_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_time ON mr_health_metrics(project_id, calculated_at DESC);
```

**Key Metrics:**
- **Merge Velocity:** MRs merged per week
- **Merge Time:** Average time to merge
- **Review Comments:** Average comments per MR
- **Revert Rate:** Percentage of reverted MRs
- **Stale MRs:** Open >14 days without activity
- **Reviewers:** Average reviewers per MR
- **Closure Rate:** Merged vs opened ratio

---

### mr_metrics_history

Daily snapshots for trend analysis.

```sql
CREATE TABLE IF NOT EXISTS mr_metrics_history (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Snapshot of key metrics
  total_open_mrs INTEGER DEFAULT 0,
  total_merged_mrs INTEGER DEFAULT 0,
  mrs_merged_last_7d INTEGER DEFAULT 0,
  avg_merge_time_days FLOAT DEFAULT 0,
  avg_review_comments_per_mr FLOAT DEFAULT 0,
  revert_rate_percent FLOAT DEFAULT 0,
  stale_mrs_count INTEGER DEFAULT 0,
  avg_reviewers_per_mr FLOAT DEFAULT 0,
  closure_rate_percent FLOAT DEFAULT 0,
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  -- Timestamp
  snapshot_date DATE DEFAULT CURRENT_DATE,
  
  -- Unique constraint
  CONSTRAINT mr_metrics_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mr_history_project_date ON mr_metrics_history(project_id, snapshot_date DESC);
```

---

## Commit Metrics

### commit_health_metrics

Stores ALL calculated commit metrics. Each refresh creates a NEW row.

```sql
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
  
  -- Commit Details (Raw Data)
  commit_details JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commit_metrics_project_id ON commit_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_commit_metrics_calculated_at ON commit_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commit_details_gin ON commit_health_metrics USING GIN (commit_details);
```

**Key Metrics:**
- **Commit Size:** Average lines changed per commit
- **Lines Ratio:** Added vs deleted lines
- **Commit Frequency:** Commits per week
- **Bus Factor:** Risk if key contributors leave

---

### commit_metrics_history

Daily snapshots for trend analysis.

```sql
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
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  snapshot_date DATE NOT NULL,
  
  -- Unique constraint
  CONSTRAINT commit_metrics_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commit_history_project_date ON commit_metrics_history(project_id, snapshot_date DESC);
```

---

## SonarQube Metrics

### Maintainability Metrics

#### sonarqube_maintainability_metrics

Stores code maintainability metrics from SonarQube/SonarCloud.

```sql
CREATE TABLE IF NOT EXISTS sonarqube_maintainability_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high INTEGER DEFAULT 0,
  maintainability_blocker INTEGER DEFAULT 0,
  technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
  maintainability_rating VARCHAR(1) DEFAULT 'A',
  maintainability_rating_value INTEGER DEFAULT 1,
  code_smells_total INTEGER DEFAULT 0,
  code_smells_new INTEGER DEFAULT 0,
  cyclomatic_complexity INTEGER DEFAULT 0,
  cognitive_complexity INTEGER DEFAULT 0,
  duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
  duplicated_lines_new DOUBLE PRECISION DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_project_id 
  ON sonarqube_maintainability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_calculated_at 
  ON sonarqube_maintainability_metrics(calculated_at);
```

**Key Metrics:**
- **Code Smells:** Total and new code smells
- **Technical Debt:** Ratio and total minutes
- **Maintainability Rating:** A-E rating from SonarQube
- **Complexity:** Cyclomatic and cognitive complexity
- **Duplication:** Percentage of duplicated code

#### sonarqube_maintainability_history

```sql
CREATE TABLE IF NOT EXISTS sonarqube_maintainability_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high INTEGER DEFAULT 0,
  maintainability_blocker INTEGER DEFAULT 0,
  technical_debt_ratio DOUBLE PRECISION DEFAULT 0,
  maintainability_rating VARCHAR(1) DEFAULT 'A',
  code_smells_total INTEGER DEFAULT 0,
  duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_maintainability_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_history_project_date 
  ON sonarqube_maintainability_history(project_id, snapshot_date);
```

---

### Reliability Metrics

#### sonarqube_reliability_metrics

Stores code reliability metrics (bugs) from SonarQube.

```sql
CREATE TABLE IF NOT EXISTS sonarqube_reliability_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total INTEGER DEFAULT 0,
  bugs_critical INTEGER DEFAULT 0,
  bugs_blocker INTEGER DEFAULT 0,
  bugs_new INTEGER DEFAULT 0,
  reliability_rating VARCHAR(1) DEFAULT 'A',
  reliability_rating_value INTEGER DEFAULT 1,
  reliability_remediation_effort INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_project_id 
  ON sonarqube_reliability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_calculated_at 
  ON sonarqube_reliability_metrics(calculated_at);
```

**Key Metrics:**
- **Bugs:** Total, critical, blocker, and new bugs
- **Reliability Rating:** A-E rating
- **Remediation Effort:** Minutes to fix bugs

#### sonarqube_reliability_history

```sql
CREATE TABLE IF NOT EXISTS sonarqube_reliability_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total INTEGER DEFAULT 0,
  reliability_rating VARCHAR(1) DEFAULT 'A',
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_reliability_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_history_project_date 
  ON sonarqube_reliability_history(project_id, snapshot_date);
```

---

### Security Metrics

#### sonarqube_security_metrics

Stores security metrics (vulnerabilities, hotspots) from SonarQube.

```sql
CREATE TABLE IF NOT EXISTS sonarqube_security_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total INTEGER DEFAULT 0,
  vulnerabilities_new INTEGER DEFAULT 0,
  security_rating VARCHAR(1) DEFAULT 'A',
  security_rating_value INTEGER DEFAULT 1,
  security_hotspots_total INTEGER DEFAULT 0,
  security_hotspots_reviewed NUMERIC(5, 2) DEFAULT 0.00,
  security_review_rating VARCHAR(1) DEFAULT 'A',
  security_review_rating_value INTEGER DEFAULT 1,
  security_remediation_effort INTEGER DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_security_project_id 
  ON sonarqube_security_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_security_calculated_at 
  ON sonarqube_security_metrics(calculated_at);
```

**Key Metrics:**
- **Vulnerabilities:** Total and new security vulnerabilities
- **Security Rating:** A-E rating
- **Security Hotspots:** Total and review percentage
- **Remediation Effort:** Minutes to fix security issues

#### sonarqube_security_history

```sql
CREATE TABLE IF NOT EXISTS sonarqube_security_history (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total INTEGER DEFAULT 0,
  security_rating VARCHAR(1) DEFAULT 'A',
  security_hotspots_total INTEGER DEFAULT 0,
  
  -- Health Score
  health_score DECIMAL(3,2) DEFAULT NULL,
  
  snapshot_date DATE NOT NULL,
  CONSTRAINT sonar_security_history_unique UNIQUE (project_id, snapshot_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sonar_security_history_project_date 
  ON sonarqube_security_history(project_id, snapshot_date);
```

---

## Milestone Metrics

### milestone_metrics

Tracks issue count metrics for active (non-expired) milestones.

```sql
CREATE TABLE IF NOT EXISTS milestone_metrics (
  -- Primary Keys
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  
  -- Foreign Key
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Milestone Issue Count Metrics
  max_issues INTEGER DEFAULT 0,
  min_issues INTEGER DEFAULT 0,
  avg_issues FLOAT DEFAULT 0,
  total_milestones INTEGER DEFAULT 0,
  
  -- Additional Context
  milestone_with_max_issues TEXT,
  milestone_with_min_issues TEXT,
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milestone_metrics_project_id ON milestone_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_metrics_calculated_at ON milestone_metrics(calculated_at DESC);
```

**Key Metrics:**
- **Max Issues:** Maximum issues in a single milestone
- **Min Issues:** Minimum issues in a single milestone
- **Avg Issues:** Average issues across all active milestones
- **Total Milestones:** Count of active, non-expired milestones

---

## DORA Metrics

DORA (DevOps Research and Assessment) metrics track elite DevOps performance indicators.

### deployment_frequency

Tracks production deployments for Deployment Frequency metric.

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_project_id ON deployment_frequency(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_timestamp ON deployment_frequency(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_environment ON deployment_frequency(environment);
```

**Columns:**
- `deployment_id` - Unique deployment identifier
- `version` - Version number (e.g., v1.2.3)
- `environment` - Deployment environment (production/staging/development)
- `deployment_timestamp` - When deployment occurred

---

### lead_time_changes

Tracks time from code merge to production for Lead Time metric.

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_project_id ON lead_time_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_merged ON lead_time_changes(merged_timestamp);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_deployed ON lead_time_changes(deployed_timestamp);
```

**Columns:**
- `change_id` - Change identifier (e.g., MR number)
- `merged_timestamp` - When code was merged
- `deployed_timestamp` - When code was deployed
- `lead_time_hours` - Calculated time difference

---

### change_failure_rate

Tracks deployment failures and incidents for Change Failure Rate metric.

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_project_id ON change_failure_rate(project_id);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_timestamp ON change_failure_rate(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_failure ON change_failure_rate(is_failure);
```

**Columns:**
- `deployment_id` - Deployment identifier
- `has_incident` - Whether deployment caused an incident
- `remediation_type` - Type of fix (none/rollback/hotfix/emergency)
- `is_failure` - Computed: true if incident with remediation

**Remediation Types:**
- `none` - No incident
- `rollback` - Deployment was rolled back
- `hotfix` - Required a hotfix
- `emergency` - Emergency patch

---

### time_to_restore_service

Tracks incident resolution times for Time to Restore Service metric.

```sql
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_to_restore_project_id ON time_to_restore_service(project_id);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_start ON time_to_restore_service(start_time);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_end ON time_to_restore_service(end_time);
```

**Columns:**
- `incident_id` - Incident identifier
- `start_time` - When incident started
- `end_time` - When service was restored
- `restore_time_hours` - Calculated time difference
- `description` - Incident description

---

### weekly_dora_snapshots

Weekly snapshots of DORA metrics for trend analysis. Auto-populated by scheduler.

```sql
CREATE TABLE IF NOT EXISTS weekly_dora_snapshots (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    row_id SERIAL UNIQUE NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Week period
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_id ON weekly_dora_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_week_start ON weekly_dora_snapshots(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_week ON weekly_dora_snapshots(project_id, week_start_date DESC);
```

**Purpose:** Automated weekly aggregation of DORA metrics for trend visualization.

**Week Definition:**
- `week_start_date` - Sunday
- `week_end_date` - Saturday

---

## Indexes

All tables include optimized indexes for common query patterns:

### Primary Lookups
- Project ID indexes on all metric tables
- UUID indexes for direct record access
- Timestamp indexes for time-range queries

### Composite Indexes
- `(project_id, calculated_at DESC)` - Latest metrics per project
- `(project_id, snapshot_date DESC)` - Historical data queries
- `(project_id, week_start_date DESC)` - Weekly trend queries

### Special Indexes
- **GIN indexes** on JSONB columns for efficient JSON querying
- **Unique constraints** on history tables to prevent duplicate snapshots

---

## Data Types

### Common Patterns

**Primary Keys:**
- `uuid UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `row_id SERIAL NOT NULL` (for reference)

**Foreign Keys:**
- `project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE`
- `project_uuid UUID REFERENCES projects(uuid) ON DELETE CASCADE`

**Timestamps:**
- `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- `TIMESTAMP WITH TIME ZONE` (for weekly snapshots)
- `DATE` (for daily history snapshots)

**Ratings:**
- `VARCHAR(1)` - SonarQube ratings (A-E)
- `INTEGER` - Rating values (1-5)

**Percentages:**
- `FLOAT` - For calculated percentages
- `DECIMAL(5,2)` - For precise percentages
- `DECIMAL(3,2)` - For health scores (0-5 scale)

**Metrics:**
- `INTEGER` - For counts
- `FLOAT` - For averages
- `DOUBLE PRECISION` - For high-precision calculations
- `DECIMAL(10,2)` - For time measurements

---

## Database Constraints

### Foreign Key Constraints
All metric tables use `ON DELETE CASCADE` to automatically clean up metrics when a project is deleted.

### Unique Constraints
History tables prevent duplicate snapshots:
```sql
CONSTRAINT [table]_history_unique UNIQUE (project_id, snapshot_date)
```

### Check Constraints
Time-based validations:
```sql
CONSTRAINT check_end_after_start CHECK (end_time > start_time)
```

### Generated Columns
Computed values:
```sql
is_failure BOOLEAN GENERATED ALWAYS AS (
  has_incident AND remediation_type IN ('rollback', 'hotfix', 'emergency')
) STORED
```

---

## Database Connection

**Connection:** PostgreSQL with connection pooling via `pg` library

**Environment Variables:**
- `DATABASE_URL` - Full PostgreSQL connection string (Neon DB)

**Features:**
- Connection pooling for performance
- Parameterized queries for security
- Transaction support for data consistency

---

## Schema Management

The entire schema is consolidated in a single file: `/server/src/db/schema.sql`. Tables are created automatically on server startup via the `initializeTables()` function in `/server/src/db/queries.ts`. All `CREATE TABLE` statements use `IF NOT EXISTS` clauses to ensure idempotency.

---

## Backup and Maintenance

### Recommended Practices

**Regular Backups:**
- Database snapshots via Neon DB automatic backups
- Export critical data periodically

**Index Maintenance:**
- Indexes are created with `IF NOT EXISTS` to prevent duplicates
- Composite indexes optimize common query patterns

**Data Retention:**
- History tables grow unbounded (consider archival after 1+ year)
- Main metric tables keep complete refresh history
- DORA tables keep all manual entries

**Cleanup:**
- CASCADE deletes handle metric cleanup automatically
- No manual cleanup required when projects are untracked

---

## Performance Considerations

### Query Optimization
- Use `calculated_at DESC` indexes for latest metrics
- History tables have date-based partitioning potential
- JSONB GIN indexes for insights searches

### Write Patterns
- Insert-only for metric tables (no updates)
- History tables enforce unique constraints
- Batch inserts recommended for bulk operations

### Read Patterns
- Latest metrics: Filter by `project_id` + `ORDER BY calculated_at DESC LIMIT 1`
- Trends: Use history tables with date ranges
- Aggregations: Weekly snapshots pre-computed for DORA metrics

---

## Schema Version

**Current Version:** 1.0.0
**Last Updated:** January 2026
**Database:** PostgreSQL 14+ (Neon DB)
**Total Tables:** 24 (3 core, 21 metrics/history)
