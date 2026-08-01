-- ============================================================================
-- CONSOLIDATED SCHEMA — Single source of truth for all database tables
-- All statements are idempotent (IF NOT EXISTS) so this file can be
-- executed on every server start without side-effects.
-- ============================================================================


-- ============================================================================
-- TABLE 1: PROJECTS (All Projects – Lightweight Registry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id            SERIAL NOT NULL,
  id                INTEGER UNIQUE NOT NULL,                    -- GitLab project ID
  name              VARCHAR(255) NOT NULL,
  full_path         TEXT,
  group_path        TEXT,
  members_count     INTEGER DEFAULT 0,
  last_activity_at  TIMESTAMP,
  parent_id         INTEGER,
  visibility        VARCHAR(50),
  tracked           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sonar_project_key TEXT,
  members           JSONB
);

CREATE INDEX IF NOT EXISTS idx_projects_id        ON projects(id);
CREATE INDEX IF NOT EXISTS idx_projects_tracked   ON projects(tracked);
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_name      ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_synced_at ON projects(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_sonar_key ON projects(sonar_project_key);
CREATE INDEX IF NOT EXISTS idx_projects_id_lookup ON projects(id);


-- ============================================================================
-- TABLE 2: TRACKED_PROJECT_SNAPSHOTS (Historical Data for Tracked Projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracked_project_snapshots (
  uuid                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                        SERIAL NOT NULL,
  project_uuid                  UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  description                   TEXT,
  web_url                       TEXT,
  open_issues                   INTEGER DEFAULT 0,
  open_mrs                      INTEGER DEFAULT 0,
  open_milestones_count         INTEGER DEFAULT 0,
  sonar_project_key             TEXT,
  sonar_security_high           INTEGER DEFAULT 0,
  sonar_security_blocker        INTEGER DEFAULT 0,
  sonar_reliability_high        INTEGER DEFAULT 0,
  sonar_reliability_blocker     INTEGER DEFAULT 0,
  sonar_maintainability_high    INTEGER DEFAULT 0,
  sonar_maintainability_blocker INTEGER DEFAULT 0,
  snapshot_date                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_project_uuid ON tracked_project_snapshots(project_uuid);
CREATE INDEX IF NOT EXISTS idx_snapshots_snapshot_date ON tracked_project_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_project_date  ON tracked_project_snapshots(project_uuid, snapshot_date DESC);


-- ============================================================================
-- TABLE 3: PROJECT_INSIGHTS (AI-Generated Insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_insights (
  uuid              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id            SERIAL NOT NULL,
  project_uuid      UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  insights_data     JSONB NOT NULL,
  final_user_score  NUMERIC(3,2),
  api_score         NUMERIC(3,2),
  combined_score    NUMERIC(3,2),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insights_project_uuid ON project_insights(project_uuid);
CREATE INDEX IF NOT EXISTS idx_insights_scores       ON project_insights(combined_score DESC, final_user_score, api_score);
CREATE INDEX IF NOT EXISTS idx_insights_created_at   ON project_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_jsonb        ON project_insights USING GIN (insights_data);


-- ============================================================================
-- TABLE 4: MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS members (
  uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id        SERIAL NOT NULL,
  project_uuid  UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  member_name   TEXT NOT NULL,
  CONSTRAINT uq_members_project_name UNIQUE (project_uuid, member_name)
);

CREATE INDEX IF NOT EXISTS idx_members_project_uuid ON members(project_uuid);
CREATE INDEX IF NOT EXISTS idx_members_name         ON members(member_name);


-- ============================================================================
-- TABLE 5: ISSUE_HEALTH_METRICS (Current issue metrics snapshot)
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_health_metrics (
  uuid                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                        SERIAL NOT NULL,
  project_id                    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_issues             INTEGER DEFAULT 0,
  total_closed_issues           INTEGER DEFAULT 0,
  issues_closed_last_7d         INTEGER DEFAULT 0,
  issues_closed_last_30d        INTEGER DEFAULT 0,
  total_resolution_hours        DOUBLE PRECISION DEFAULT 0,
  issues_with_resolution_time   INTEGER DEFAULT 0,
  avg_cycle_time_hours          DOUBLE PRECISION DEFAULT 0,
  avg_cycle_time_days           DOUBLE PRECISION DEFAULT 0,
  issues_reopened_count         INTEGER DEFAULT 0,
  issues_checked_for_reopens    INTEGER DEFAULT 0,
  reopen_rate_percent           DOUBLE PRECISION DEFAULT 0,
  bug_issues_count              INTEGER DEFAULT 0,
  feature_issues_count          INTEGER DEFAULT 0,
  bug_ratio_percent             DOUBLE PRECISION DEFAULT 0,
  issues_opened_last_7d         INTEGER DEFAULT 0,
  issues_opened_last_30d        INTEGER DEFAULT 0,
  net_issue_change_7d           INTEGER DEFAULT 0,
  stale_issues_count            INTEGER DEFAULT 0,
  stale_issues_percent          DOUBLE PRECISION DEFAULT 0,
  critical_issues_open          INTEGER DEFAULT 0,
  blocker_issues_open           INTEGER DEFAULT 0,
  critical_avg_resolution_hours DOUBLE PRECISION DEFAULT 0,
  issues_with_mr_links          INTEGER DEFAULT 0,
  total_closed_issues_checked   INTEGER DEFAULT 0,
  issue_mr_link_rate_percent    DOUBLE PRECISION DEFAULT 0,
  velocity_alert_level          VARCHAR(20),
  cycle_time_alert_level        VARCHAR(20),
  reopen_rate_alert_level       VARCHAR(20),
  bug_ratio_alert_level         VARCHAR(20),
  calculated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closure_rate_percent          DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_id    ON issue_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_calculated_at ON issue_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_metrics_project_time  ON issue_health_metrics(project_id, calculated_at DESC);


-- ============================================================================
-- TABLE 6: ISSUE_METRICS_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_metrics_history (
  uuid                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                 SERIAL NOT NULL,
  project_id             INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_issues      INTEGER DEFAULT 0,
  total_closed_issues    INTEGER DEFAULT 0,
  issues_closed_last_7d  INTEGER DEFAULT 0,
  avg_cycle_time_days    DOUBLE PRECISION DEFAULT 0,
  reopen_rate_percent    DOUBLE PRECISION DEFAULT 0,
  bug_ratio_percent      DOUBLE PRECISION DEFAULT 0,
  stale_issues_count     INTEGER DEFAULT 0,
  critical_issues_open   INTEGER DEFAULT 0,
  snapshot_date          DATE DEFAULT CURRENT_DATE,
  closure_rate_percent   DOUBLE PRECISION DEFAULT 0,
  issues_opened_last_30d INTEGER DEFAULT 0,
  issues_closed_last_30d INTEGER DEFAULT 0,
  health_score           NUMERIC(3,2) DEFAULT NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_history_project ON issue_metrics_history(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_history_date    ON issue_metrics_history(snapshot_date DESC);


-- ============================================================================
-- TABLE 7: MR_HEALTH_METRICS (Current MR metrics snapshot)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr_health_metrics (
  uuid                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                      SERIAL NOT NULL,
  project_id                  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_mrs              INTEGER DEFAULT 0,
  total_merged_mrs            INTEGER DEFAULT 0,
  mrs_merged_last_7d          INTEGER DEFAULT 0,
  mrs_merged_last_30d         INTEGER DEFAULT 0,
  total_merge_time_hours      DOUBLE PRECISION DEFAULT 0,
  mrs_with_merge_time         INTEGER DEFAULT 0,
  avg_merge_time_hours        DOUBLE PRECISION DEFAULT 0,
  avg_merge_time_days         DOUBLE PRECISION DEFAULT 0,
  total_review_comments       INTEGER DEFAULT 0,
  mrs_checked_for_comments    INTEGER DEFAULT 0,
  avg_review_comments_per_mr  DOUBLE PRECISION DEFAULT 0,
  reverted_mrs_count          INTEGER DEFAULT 0,
  mrs_checked_for_reverts     INTEGER DEFAULT 0,
  revert_rate_percent         DOUBLE PRECISION DEFAULT 0,
  mrs_opened_last_7d          INTEGER DEFAULT 0,
  mrs_opened_last_30d         INTEGER DEFAULT 0,
  net_mr_change_7d            INTEGER DEFAULT 0,
  stale_mrs_count             INTEGER DEFAULT 0,
  stale_mrs_percent           DOUBLE PRECISION DEFAULT 0,
  total_reviewers_count       INTEGER DEFAULT 0,
  mrs_checked_for_reviewers   INTEGER DEFAULT 0,
  avg_reviewers_per_mr        DOUBLE PRECISION DEFAULT 0,
  merge_velocity_alert_level  VARCHAR(20),
  merge_time_alert_level      VARCHAR(20),
  revert_rate_alert_level     VARCHAR(20),
  stale_mrs_alert_level       VARCHAR(20),
  calculated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closure_rate_percent        DOUBLE PRECISION DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_id    ON mr_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_calculated_at ON mr_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_project_time  ON mr_health_metrics(project_id, calculated_at DESC);


-- ============================================================================
-- TABLE 8: MR_METRICS_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS mr_metrics_history (
  uuid                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                     SERIAL NOT NULL,
  project_id                 INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_mrs             INTEGER DEFAULT 0,
  total_merged_mrs           INTEGER DEFAULT 0,
  mrs_merged_last_7d         INTEGER DEFAULT 0,
  avg_merge_time_days        DOUBLE PRECISION DEFAULT 0,
  avg_review_comments_per_mr DOUBLE PRECISION DEFAULT 0,
  revert_rate_percent        DOUBLE PRECISION DEFAULT 0,
  stale_mrs_count            INTEGER DEFAULT 0,
  avg_reviewers_per_mr       DOUBLE PRECISION DEFAULT 0,
  snapshot_date              DATE DEFAULT CURRENT_DATE,
  closure_rate_percent       DOUBLE PRECISION DEFAULT 0,
  mrs_opened_last_30d        INTEGER DEFAULT 0,
  mrs_merged_last_30d        INTEGER DEFAULT 0,
  health_score               NUMERIC(3,2) DEFAULT NULL,
  created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mr_metrics_history_project ON mr_metrics_history(project_id);
CREATE INDEX IF NOT EXISTS idx_mr_metrics_history_date    ON mr_metrics_history(snapshot_date DESC);


-- ============================================================================
-- TABLE 9: COMMIT_HEALTH_METRICS (Current commit metrics snapshot)
-- ============================================================================

CREATE TABLE IF NOT EXISTS commit_health_metrics (
  uuid                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                        SERIAL NOT NULL,
  project_id                    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_commits_last_7d         INTEGER DEFAULT 0,
  total_lines_changed           INTEGER DEFAULT 0,
  commits_analyzed              INTEGER DEFAULT 0,
  avg_commit_size               DOUBLE PRECISION DEFAULT 0,
  total_lines_added             INTEGER DEFAULT 0,
  total_lines_deleted           INTEGER DEFAULT 0,
  lines_added_deleted_ratio     DOUBLE PRECISION DEFAULT 0,
  commits_per_week              INTEGER DEFAULT 0,
  total_contributors            INTEGER DEFAULT 0,
  contributors_above_50_percent INTEGER DEFAULT 0,
  bus_factor                    INTEGER DEFAULT 0,
  calculated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  commit_details                JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_commit_metrics_project_id    ON commit_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_commit_metrics_calculated_at ON commit_health_metrics(calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_commit_details_gin           ON commit_health_metrics USING GIN (commit_details);


-- ============================================================================
-- TABLE 10: COMMIT_METRICS_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS commit_metrics_history (
  uuid                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                SERIAL NOT NULL,
  project_id            INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_commits_last_7d INTEGER DEFAULT 0,
  avg_commit_size       DOUBLE PRECISION DEFAULT 0,
  total_lines_added     INTEGER DEFAULT 0,
  total_lines_deleted   INTEGER DEFAULT 0,
  bus_factor            INTEGER DEFAULT 0,
  snapshot_date         DATE NOT NULL,
  health_score          NUMERIC(3,2) DEFAULT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commit_history_project_date ON commit_metrics_history(project_id, snapshot_date DESC);


-- ============================================================================
-- TABLE 11: MILESTONE_HEALTH_METRICS (Current milestone metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS milestone_health_metrics (
  uuid                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                  SERIAL NOT NULL,
  project_id              INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_milestones        INTEGER DEFAULT 0,
  open_milestones         INTEGER DEFAULT 0,
  closed_milestones       INTEGER DEFAULT 0,
  overdue_milestones      INTEGER DEFAULT 0,
  avg_completion_rate     NUMERIC(5,2) DEFAULT 0,
  on_time_completion_rate NUMERIC(5,2) DEFAULT 0,
  avg_duration_days       NUMERIC(10,2) DEFAULT 0,
  avg_overdue_days        NUMERIC(10,2) DEFAULT 0,
  health_score            NUMERIC(5,2) DEFAULT 0,
  calculated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestone_health_project_id    ON milestone_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_health_calculated_at ON milestone_health_metrics(calculated_at DESC);


-- ============================================================================
-- TABLE 12: MILESTONE_METRICS (Milestone issue stats)
-- ============================================================================

CREATE TABLE IF NOT EXISTS milestone_metrics (
  uuid                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                     SERIAL NOT NULL,
  project_id                 INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  max_issues                 INTEGER DEFAULT 0,
  min_issues                 INTEGER DEFAULT 0,
  avg_issues                 DOUBLE PRECISION DEFAULT 0,
  total_milestones           INTEGER DEFAULT 0,
  milestone_with_max_issues  TEXT,
  milestone_with_min_issues  TEXT,
  calculated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_milestone_metrics_project_id    ON milestone_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_milestone_metrics_calculated_at ON milestone_metrics(calculated_at DESC);


-- ============================================================================
-- TABLE 13: SONARQUBE_MAINTAINABILITY_METRICS (Current)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_maintainability_metrics (
  uuid                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                       SERIAL NOT NULL,
  project_id                   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high         INTEGER DEFAULT 0,
  maintainability_blocker      INTEGER DEFAULT 0,
  technical_debt_ratio         DOUBLE PRECISION DEFAULT 0,
  maintainability_rating       VARCHAR(1) DEFAULT 'A',
  maintainability_rating_value INTEGER DEFAULT 1,
  code_smells_total            INTEGER DEFAULT 0,
  code_smells_new              INTEGER DEFAULT 0,
  cyclomatic_complexity        INTEGER DEFAULT 0,
  cognitive_complexity         INTEGER DEFAULT 0,
  duplicated_code_percentage   DOUBLE PRECISION DEFAULT 0,
  duplicated_lines_new         DOUBLE PRECISION DEFAULT 0,
  calculated_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_project_id    ON sonarqube_maintainability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_calculated_at ON sonarqube_maintainability_metrics(calculated_at DESC);


-- ============================================================================
-- TABLE 14: SONARQUBE_MAINTAINABILITY_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_maintainability_history (
  uuid                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                     SERIAL NOT NULL,
  project_id                 INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  maintainability_high       INTEGER DEFAULT 0,
  maintainability_blocker    INTEGER DEFAULT 0,
  technical_debt_ratio       DOUBLE PRECISION DEFAULT 0,
  maintainability_rating     VARCHAR(1) DEFAULT 'A',
  code_smells_total          INTEGER DEFAULT 0,
  duplicated_code_percentage DOUBLE PRECISION DEFAULT 0,
  snapshot_date              DATE NOT NULL,
  health_score               NUMERIC(3,2) DEFAULT NULL,
  created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_maintainability_history_project_date ON sonarqube_maintainability_history(project_id, snapshot_date DESC);


-- ============================================================================
-- TABLE 15: SONARQUBE_RELIABILITY_METRICS (Current)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_reliability_metrics (
  uuid                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                         SERIAL NOT NULL,
  project_id                     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total                     INTEGER DEFAULT 0,
  bugs_critical                  INTEGER DEFAULT 0,
  bugs_blocker                   INTEGER DEFAULT 0,
  bugs_new                       INTEGER DEFAULT 0,
  reliability_rating             VARCHAR(1) DEFAULT 'A',
  reliability_rating_value       INTEGER DEFAULT 1,
  reliability_remediation_effort INTEGER DEFAULT 0,
  calculated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_reliability_project_id    ON sonarqube_reliability_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_reliability_calculated_at ON sonarqube_reliability_metrics(calculated_at);


-- ============================================================================
-- TABLE 16: SONARQUBE_RELIABILITY_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_reliability_history (
  uuid               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id             SERIAL NOT NULL,
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bugs_total         INTEGER DEFAULT 0,
  reliability_rating VARCHAR(1) DEFAULT 'A',
  snapshot_date      DATE NOT NULL,
  health_score       NUMERIC(3,2) DEFAULT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_reliability_history_project_date ON sonarqube_reliability_history(project_id, snapshot_date);


-- ============================================================================
-- TABLE 17: SONARQUBE_SECURITY_METRICS (Current)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_security_metrics (
  uuid                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                        SERIAL NOT NULL,
  project_id                    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total         INTEGER DEFAULT 0,
  vulnerabilities_new           INTEGER DEFAULT 0,
  security_rating               VARCHAR(1) DEFAULT 'A',
  security_rating_value         INTEGER DEFAULT 1,
  security_hotspots_total       INTEGER DEFAULT 0,
  security_hotspots_reviewed    NUMERIC(5,2) DEFAULT 0.00,
  security_review_rating        VARCHAR(1) DEFAULT 'A',
  security_review_rating_value  INTEGER DEFAULT 1,
  security_remediation_effort   INTEGER DEFAULT 0,
  calculated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_security_project_id    ON sonarqube_security_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sonar_security_calculated_at ON sonarqube_security_metrics(calculated_at);


-- ============================================================================
-- TABLE 18: SONARQUBE_SECURITY_HISTORY (Historical daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sonarqube_security_history (
  uuid                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                  SERIAL NOT NULL,
  project_id              INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vulnerabilities_total   INTEGER DEFAULT 0,
  security_rating         VARCHAR(1) DEFAULT 'A',
  security_hotspots_total INTEGER DEFAULT 0,
  snapshot_date           DATE NOT NULL,
  health_score            NUMERIC(3,2) DEFAULT NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sonar_security_history_project_date ON sonarqube_security_history(project_id, snapshot_date);


-- ============================================================================
-- TABLE 19: TRACKED_PROJECTS (Legacy table – kept for compatibility)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracked_projects (
  id                            INTEGER PRIMARY KEY NOT NULL,
  name                          VARCHAR(255) NOT NULL,
  parent_id                     INTEGER,
  created_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tracked                       BOOLEAN DEFAULT TRUE,
  synced_at                     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description                   TEXT,
  web_url                       TEXT,
  last_activity_at              TIMESTAMP,
  visibility                    VARCHAR(50),
  star_count                    INTEGER DEFAULT 0,
  forks_count                   INTEGER DEFAULT 0,
  group_path                    TEXT,
  full_path                     TEXT,
  total_issues                  INTEGER DEFAULT 0,
  total_mrs                     INTEGER DEFAULT 0,
  open_milestones_count         INTEGER DEFAULT 0,
  sonar_security_high           INTEGER DEFAULT 0,
  sonar_security_blocker        INTEGER DEFAULT 0,
  sonar_reliability_high        INTEGER DEFAULT 0,
  sonar_reliability_blocker     INTEGER DEFAULT 0,
  sonar_maintainability_high    INTEGER DEFAULT 0,
  sonar_maintainability_blocker INTEGER DEFAULT 0,
  sonar_project_key             TEXT
);

CREATE INDEX IF NOT EXISTS idx_tracked_projects_tracked   ON tracked_projects(tracked);
CREATE INDEX IF NOT EXISTS idx_tracked_projects_parent_id ON tracked_projects(parent_id);


-- ============================================================================
-- DORA METRICS TABLES (Tables 20-24)
-- ============================================================================


-- ============================================================================
-- TABLE 20: DEPLOYMENT_FREQUENCY
-- ============================================================================

CREATE TABLE IF NOT EXISTS deployment_frequency (
  id                   SERIAL PRIMARY KEY,
  uuid                 UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id           INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id        VARCHAR(255) NOT NULL,
  version              VARCHAR(100),
  environment          VARCHAR(50) NOT NULL DEFAULT 'production',
  deployment_timestamp TIMESTAMP NOT NULL,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deployment_frequency_project_id  ON deployment_frequency(project_id);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_timestamp   ON deployment_frequency(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_deployment_frequency_environment ON deployment_frequency(environment);


-- ============================================================================
-- TABLE 21: LEAD_TIME_CHANGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_time_changes (
  id                 SERIAL PRIMARY KEY,
  uuid               UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_id          VARCHAR(255) NOT NULL,
  merged_timestamp   TIMESTAMP NOT NULL,
  deployed_timestamp TIMESTAMP NOT NULL,
  lead_time_hours    NUMERIC(10,2),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_time_changes_project_id ON lead_time_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_merged     ON lead_time_changes(merged_timestamp);
CREATE INDEX IF NOT EXISTS idx_lead_time_changes_deployed   ON lead_time_changes(deployed_timestamp);


-- ============================================================================
-- TABLE 22: CHANGE_FAILURE_RATE
-- ============================================================================

CREATE TABLE IF NOT EXISTS change_failure_rate (
  id                   SERIAL PRIMARY KEY,
  uuid                 UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id           INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deployment_id        VARCHAR(255) NOT NULL,
  deployment_timestamp TIMESTAMP NOT NULL,
  has_incident         BOOLEAN NOT NULL DEFAULT FALSE,
  remediation_type     VARCHAR(50) NOT NULL DEFAULT 'none',
  is_failure           BOOLEAN,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_change_failure_rate_project_id ON change_failure_rate(project_id);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_timestamp  ON change_failure_rate(deployment_timestamp);
CREATE INDEX IF NOT EXISTS idx_change_failure_rate_failure    ON change_failure_rate(is_failure);


-- ============================================================================
-- TABLE 23: TIME_TO_RESTORE_SERVICE
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_to_restore_service (
  id                 SERIAL PRIMARY KEY,
  uuid               UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id         INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  incident_id        VARCHAR(255) NOT NULL,
  start_time         TIMESTAMP NOT NULL,
  end_time           TIMESTAMP NOT NULL,
  restore_time_hours NUMERIC(10,2),
  description        TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_to_restore_project_id ON time_to_restore_service(project_id);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_start      ON time_to_restore_service(start_time);
CREATE INDEX IF NOT EXISTS idx_time_to_restore_end        ON time_to_restore_service(end_time);


-- ============================================================================
-- TABLE 24: WEEKLY_DORA_SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS weekly_dora_snapshots (
  uuid                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id                 SERIAL UNIQUE NOT NULL,
  project_id             INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start_date        DATE NOT NULL,
  week_end_date          DATE NOT NULL,
  total_deployments      INTEGER NOT NULL DEFAULT 0,
  production_deployments INTEGER NOT NULL DEFAULT 0,
  failed_deployments     INTEGER NOT NULL DEFAULT 0,
  failure_rate_percent   NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_changes          INTEGER NOT NULL DEFAULT 0,
  avg_lead_time_hours    NUMERIC(10,2),
  total_incidents        INTEGER NOT NULL DEFAULT 0,
  avg_restore_time_hours NUMERIC(10,2),
  created_at             TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_project_week UNIQUE (project_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_id   ON weekly_dora_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_week_start   ON weekly_dora_snapshots(week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_dora_project_week ON weekly_dora_snapshots(project_id, week_start_date DESC);





