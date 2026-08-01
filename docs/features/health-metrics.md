# Health Metrics System

## Table of Contents
1. [Overview](#overview)
2. [Issue Health Metrics](#issue-health-metrics)
3. [MR Health Metrics](#mr-health-metrics)
4. [Commit Health Metrics](#commit-health-metrics)
5. [SonarQube Maintainability Metrics](#sonarqube-maintainability-metrics)
6. [SonarQube Reliability Metrics](#sonarqube-reliability-metrics)
7. [SonarQube Security Metrics](#sonarqube-security-metrics)
8. [Combined Health Score Dashboard](#combined-health-score-dashboard)
9. [Milestone Metrics](#milestone-metrics)

---

## Overview

The **Health Metrics System** provides deep insights into project quality by analyzing 6 different aspects of your GitLab projects:
- **Issue Metrics** - How well issues are managed
- **MR Metrics** - Merge request efficiency and quality
- **Commit Metrics** - Code contribution patterns
- **SonarQube Maintainability** - Code quality and technical debt
- **SonarQube Reliability** - Bugs and code stability
- **SonarQube Security** - Security vulnerabilities

Additionally, **Milestone Metrics** track workload distribution across active milestones (not yet integrated into health scores).

Each metric has a **health score (0-5)** and tracks historical trends for week-over-week comparison.

### Key Features
- Real-time calculation from GitLab and SonarQube APIs
- Historical tracking with daily snapshots
- Health scores (0-5 scale) for each metric
- Alert levels (NORMAL, WARNING, RED_ALERT)
- Week-over-week trend analysis
- Combined health score dashboard

---

## Issue Health Metrics

### What It Tracks

Issue Health Metrics analyze how well your team manages issues throughout their lifecycle. It focuses on:
- **Velocity** - How quickly issues are being resolved
- **Cycle Time** - Time from issue creation to closure
- **Quality** - Reopen rate and bug vs feature ratio
- **Stale Issues** - Issues that have been neglected
- **Critical Issues** - High-priority items that need attention

### Metrics Breakdown

**Tier 1 (Critical Metrics):**
1. **Velocity** - Issues closed per week (7d & 30d)
2. **Cycle Time** - Average time from open to close (hours/days)
3. **Reopen Rate** - % of issues reopened after closing
4. **Bug Ratio** - % of issues labeled as bugs vs features

**Tier 2 (Important Metrics):**
5. **Issues Opened Per Week** - New issues created (7d & 30d)
6. **Stale Issues** - Open issues with no activity >60 days
7. **Critical/Blocker Issues** - Open issues with priority labels
8. **MR Link Rate** - % of closed issues linked to merge requests

### Database Schema

#### Table: `issue_health_metrics`

**Purpose:** Stores every calculation of issue metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | UUID | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | Foreign key to `projects.id` - which project these metrics belong to |
| `total_open_issues` | INTEGER | Total count of open issues at time of calculation |
| `total_closed_issues` | INTEGER | Total count of closed issues at time of calculation |
| **Velocity Metrics** | | |
| `issues_closed_last_7d` | INTEGER | Number of issues closed in the last 7 days |
| `issues_closed_last_30d` | INTEGER | Number of issues closed in the last 30 days |
| **Cycle Time Metrics** | | |
| `total_resolution_hours` | FLOAT | Sum of all resolution times (closed_at - created_at) |
| `issues_with_resolution_time` | INTEGER | Number of issues included in cycle time calculation |
| `avg_cycle_time_hours` | FLOAT | Average time to close an issue (in hours) |
| `avg_cycle_time_days` | FLOAT | Average time to close an issue (in days) |
| **Reopen Rate Metrics** | | |
| `issues_reopened_count` | INTEGER | Number of issues that were reopened (from sample) |
| `issues_checked_for_reopens` | INTEGER | Number of issues checked for reopens (sample size: 50) |
| `reopen_rate_percent` | FLOAT | Percentage of issues that were reopened |
| **Bug Ratio Metrics** | | |
| `bug_issues_count` | INTEGER | Number of issues with 'bug' label |
| `feature_issues_count` | INTEGER | Number of issues with 'feature' label |
| `bug_ratio_percent` | FLOAT | Bugs / (Bugs + Features) × 100 |
| **Issues Opened Metrics** | | |
| `issues_opened_last_7d` | INTEGER | Number of issues created in last 7 days |
| `issues_opened_last_30d` | INTEGER | Number of issues created in last 30 days |
| `net_issue_change_7d` | INTEGER | Opened - Closed in last 7 days (positive = backlog growing) |
| **Stale Issues Metrics** | | |
| `stale_issues_count` | INTEGER | Open issues with no activity for >60 days |
| `stale_issues_percent` | FLOAT | Stale issues / Total open issues × 100 |
| **Critical Issues Metrics** | | |
| `critical_issues_open` | INTEGER | Open issues with 'priority::critical' label |
| `blocker_issues_open` | INTEGER | Open issues with 'priority::blocker' label |
| `critical_avg_resolution_hours` | FLOAT | Average time to resolve critical issues |
| **MR Link Metrics** | | |
| `issues_with_mr_links` | INTEGER | Issues linked to merge requests (from sample) |
| `total_closed_issues_checked` | INTEGER | Issues checked for MR links (sample size: 30) |
| `issue_mr_link_rate_percent` | FLOAT | Percentage of issues linked to MRs |
| **Additional Metrics** | | |
| `closure_rate_percent` | FLOAT | (Closed / Opened) × 100 - measures if backlog is growing |
| **Alert Levels** | | |
| `velocity_alert_level` | VARCHAR(20) | 'NORMAL', 'WARNING', or 'RED_ALERT' based on velocity |
| `cycle_time_alert_level` | VARCHAR(20) | Alert level based on average cycle time |
| `reopen_rate_alert_level` | VARCHAR(20) | Alert level based on reopen percentage |
| `bug_ratio_alert_level` | VARCHAR(20) | Alert level based on bug ratio |
| **Metadata** | | |
| `calculated_at` | TIMESTAMP | When this calculation was performed |

**Indexes:**
- `idx_issue_metrics_project_id` - Fast lookups by project
- `idx_issue_metrics_calculated_at` - Fast lookups by time
- `idx_issue_metrics_project_time` - Combined index for project + time queries

---

#### Table: `issue_metrics_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `total_open_issues` | INTEGER | DEFAULT 0 | Snapshot of total open issues |
| `total_closed_issues` | INTEGER | DEFAULT 0 | Snapshot of total closed issues |
| `issues_closed_last_7d` | INTEGER | DEFAULT 0 | Snapshot of 7-day velocity |
| `avg_cycle_time_days` | DOUBLE PRECISION | DEFAULT 0 | Snapshot of cycle time |
| `reopen_rate_percent` | DOUBLE PRECISION | DEFAULT 0 | Snapshot of reopen rate |
| `bug_ratio_percent` | DOUBLE PRECISION | DEFAULT 0 | Snapshot of bug ratio |
| `stale_issues_count` | INTEGER | DEFAULT 0 | Snapshot of stale issues |
| `critical_issues_open` | INTEGER | DEFAULT 0 | Snapshot of critical issues |
| `snapshot_date` | DATE | DEFAULT CURRENT_DATE | Date of this snapshot |
| `closure_rate_percent` | DOUBLE PRECISION | DEFAULT 0 | (Closed / Opened) × 100  |
| `issues_opened_last_30d` | INTEGER | DEFAULT 0 | Snapshot of issues opened in 30 days  |
| `issues_closed_last_30d` | INTEGER | DEFAULT 0 | Snapshot of issues closed in 30 days  |
| `health_score` | NUMERIC(3,2) | DEFAULT NULL | Calculated health score (0-5) |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When snapshot was created |

> **Note:** There is no UNIQUE constraint on `(project_id, snapshot_date)`. Multiple snapshots per project per day are allowed. The table uses non-unique indexes for querying.

**Indexes:**
- `idx_metrics_history_project` - BTREE on (project_id)
- `idx_metrics_history_date` - BTREE on (snapshot_date DESC)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Issue Metrics Sync Service**
- **File:** `server/src/services/issueMetrics/issueMetricsSyncService.ts`
- **Role:** Orchestrator - coordinates the entire refresh process
- **Key Methods:**
  - `syncIssueMetrics(projectId)` - Main entry point, returns saved metrics
  - `fetchGitLabData(projectId)` - Fetches all required data from GitLab API
  - `calculateReopenRate(projectId, sample)` - Samples 50 closed issues to check state events
  - `calculateMRLinkRate(projectId, sample)` - Samples 30 closed issues to check MR references

**2. Issue Metrics Calculation Service**
- **File:** `server/src/services/issueMetrics/issueMetricsCalculationService.ts`
- **Role:** Pure calculation logic - no API calls, no database operations
- **Key Methods:**
  - `calculateMetrics(...)` - Main calculation function taking all raw data as parameters
  - `calculateCycleTime(closedIssues)` - Computes average time from created to closed
  - `calculateReopenRate(reopened, checked)` - Calculates percentage
  - `calculateBugRatio(bugs, features)` - Calculates bug percentage
  - `calculateStaleness(openIssues)` - Counts issues with updated_at >60 days ago
  - `calculateClosureRate(closed, opened)` - Calculates closure percentage
  - Various alert level calculators (NORMAL/WARNING/RED_ALERT)

**3. Issue Metrics Database Service**
- **File:** `server/src/services/issueMetrics/issueMetricsDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into `issue_health_metrics`, calls `calculateIssueHealthScore()`
  - `saveHistoricalSnapshot(projectId)` - INSERT into `issue_metrics_history`
  - `getMetrics(projectId)` - GET latest metrics for a project
  - `getWeekOverWeekTrends(projectId)` - GET current vs previous week comparison
  - `getMetricsHistory(projectId, days)` - GET historical data for charts
  - `getAllMetrics(projectId)` - GET all historical calculations
  - `deleteMetrics(projectId)` - DELETE all metrics for a project

**4. Health Score Calculator (Utility)**
- **File:** `server/src/utils/healthScoreCalculator.ts`
- **Function:** `calculateIssueHealthScore(metrics)` - Calculates 0-5 health score
- **Used by:** Issue Metrics Database Service during `saveMetrics()`

---

### GitLab API Integration

**Service File:** `server/src/services/gitlab/gitLabIssueService.ts`

**API Endpoints Used:**
- `GET /projects/:id/issues` - Main endpoint for fetching issues

**Key Methods:**

| Method | Purpose | Parameters | Data Limit |
|--------|---------|------------|------------|
| `getIssueCount(projectId, state)` | Get fast count using headers | state: 'opened'\|'closed'\|'all' | N/A (header only) |
| `getClosedIssues(projectId, closedAfter, maxResults)` | Fetch closed issues after date | closedAfter: ISO date, maxResults: 10000 | Up to 10,000 |
| `getOpenedIssues(projectId, createdAfter, maxResults)` | Fetch opened issues after date | createdAfter: ISO date, maxResults: 10000 | Up to 10,000 |
| `getOpenIssues(projectId, maxResults)` | Fetch all open issues | maxResults: 10000 | Up to 10,000 |
| `getIssuesByLabel(projectId, labels, createdAfter, state)` | Filter issues by labels | labels: ['bug', 'feature', etc.] | Up to 100 per page |
| `getIssueStateEvents(projectId, issueIid)` | Get state change history | issueIid: issue number | N/A |
| `getIssueMRReferences(projectId, issueIid)` | Get MRs that closed issue | issueIid: issue number | N/A |

**Pagination Strategy:**
- Uses `per_page=100` (GitLab's max per page)
- Fetches multiple pages until `maxResults` reached or no more data
- Safety limit: 10 pages max to prevent infinite loops
- Filters by date when possible to reduce data transfer

**API Call Optimization:**
- Uses `X-Total` header for counts (no data transfer)
- Parallel fetching of independent data sets
- Date filters reduce payload size
- Sampling for expensive operations (state events, MR references)

---

### Controller & Routes

**Controller File:** `server/src/controllers/issueMetricsController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh issue metrics (recalculate from GitLab)
POST /api/projects/:id/issue-metrics/refresh
├── Calls: issueMetricsSyncService.syncIssueMetrics(projectId)
├── Returns: Latest metrics object with all fields
└── Response Time: 5-15 seconds for large projects

// Get latest issue metrics
GET /api/projects/:id/issue-metrics
├── Calls: issueMetricsDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get week-over-week trends
GET /api/projects/:id/issue-metrics/trends
├── Calls: issueMetricsDbService.getMetricsTrends(projectId)
├── Returns: { current, previous, changes }
└── Response Time: <200ms

// Get historical data for charts
GET /api/projects/:id/issue-metrics/history?days=30
├── Calls: issueMetricsDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

**Controller Methods:**

```typescript
// POST /projects/:id/issue-metrics/refresh
refreshIssueMetrics(req, res)
├── Validates project ID
├── Calls syncIssueMetrics(projectId)
├── Returns saved metrics
└── Error handling with 500 response

// GET /projects/:id/issue-metrics
getIssueMetrics(req, res)
├── Validates project ID
├── Fetches latest metrics from DB
├── Returns metrics or 404 if none found
└── Error handling with 500 response

// GET /projects/:id/issue-metrics/trends
getIssueMetricsTrends(req, res)
├── Validates project ID
├── Fetches current + previous week metrics
├── Calculates percentage changes
└── Returns comparison object

// GET /projects/:id/issue-metrics/history
getIssueMetricsHistory(req, res)
├── Validates project ID
├── Gets 'days' query parameter (default: 30)
├── Fetches historical snapshots
└── Returns array of data points
```

---

### Data Collection Flow

```
Step 1: Fetch Counts (Fast - uses headers)
├── getIssueCount(projectId, 'opened') → total_open_issues
└── getIssueCount(projectId, 'closed') → total_closed_issues

Step 2: Fetch Issues by Time Period (Parallel)
├── getClosedIssues(projectId, 7 days ago, 10000) → closedIssuesLast7d
├── getClosedIssues(projectId, 30 days ago, 10000) → closedIssuesLast30d
├── getClosedIssues(projectId, no filter, 10000) → allRecentClosedIssues
├── getOpenedIssues(projectId, 7 days ago, 10000) → openedIssuesLast7d
├── getOpenedIssues(projectId, 30 days ago, 10000) → openedIssuesLast30d
└── getOpenIssues(projectId, 10000) → openIssues (for stale detection)

Step 3: Fetch Issues by Label (Parallel)
├── getIssuesByLabel(projectId, ['bug']) → bugIssues
├── getIssuesByLabel(projectId, ['feature']) → featureIssues
├── getIssuesByLabel(projectId, ['priority::critical']) → criticalIssues
└── getIssuesByLabel(projectId, ['priority::blocker']) → blockerIssues

Step 4: Calculate Reopen Rate (Sampling - Sequential)
├── Take first 50 from allRecentClosedIssues
├── For each issue: getIssueStateEvents(projectId, issueIid)
├── Count issues with 'reopened' events
└── Calculate percentage: (reopened / checked) × 100

Step 5: Calculate MR Link Rate (Sampling - Sequential)
├── Take first 30 from allRecentClosedIssues
├── For each issue: getIssueMRReferences(projectId, issueIid)
├── Count issues with MR links
└── Calculate percentage: (with_links / checked) × 100

Step 6: Calculate All Metrics
├── Pass all raw data to calculationService.calculateMetrics()
└── Returns complete metrics object

Step 7: Calculate Health Score
├── Health Score = Weighted formula (0-5 scale)
├── Factors: Cycle Time (30%), Reopen Rate (25%), Velocity (25%), Critical Issues (20%)
└── Saved with metrics

Step 8: Save to Database
├── INSERT into issue_health_metrics (all fields)
└── INSERT into issue_metrics_history (key fields + health_score)
```

---

### Health Score Calculation

**Calculated by:** `calculateIssueHealthScore()` in `server/src/utils/healthScoreCalculator.ts`

**Formula:**
```
Health Score = 
  Cycle Time Score × 0.30 +
  Reopen Rate Score × 0.25 +
  Velocity Score × 0.25 +
  Critical Issues Score × 0.20
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Cycle Time (days)** | <1 | <3 | <7 | <14 | <30 | ≥30 |
| **Reopen Rate (%)** | <5 | <10 | <20 | <30 | <50 | ≥50 |
| **Velocity (7d closed)** | >20 | ≥10 | ≥5 | ≥2 | ≥1 | 0 |
| **Critical Issues (open)** | 0 | ≤2 | ≤5 | ≤10 | ≤20 | >20 |

**Alert Level Calculation:**

```typescript
// Velocity Alert
if (issues_closed_last_30d === 0) return 'RED_ALERT'
if (issues_closed_last_30d < 10) return 'WARNING'
return 'NORMAL'

// Cycle Time Alert
if (avg_cycle_time_days > 14) return 'RED_ALERT'
if (avg_cycle_time_days > 7) return 'WARNING'
return 'NORMAL'

// Reopen Rate Alert
if (reopen_rate_percent > 15) return 'RED_ALERT'
if (reopen_rate_percent > 10) return 'WARNING'
return 'NORMAL'

// Bug Ratio Alert
if (bug_ratio_percent > 50) return 'RED_ALERT'
if (bug_ratio_percent > 30) return 'WARNING'
return 'NORMAL'
```

---

### Frontend Component

**File:** `client/src/components/IssueMetricsCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Total open and closed issues
- Velocity metrics (issues closed in 7d and 30d)
- Average cycle time (in days)
- Reopen rate percentage
- Bug ratio percentage
- Stale issues count
- Critical issues count
- Alert indicators for each metric
- Last updated timestamp

**Data Fetching:**
```typescript
// On component mount
useEffect(() => {
  fetch(`/api/projects/${projectId}/issue-metrics`)
    .then(res => res.json())
    .then(data => setMetrics(data))
}, [projectId])
```

**Refresh Button:**
```typescript
const handleRefresh = async () => {
  setLoading(true)
  await fetch(`/api/projects/${projectId}/issue-metrics/refresh`, {
    method: 'POST'
  })
  // Refetch latest metrics
  const response = await fetch(`/api/projects/${projectId}/issue-metrics`)
  const data = await response.json()
  setMetrics(data)
  setLoading(false)
}
```

**Health Score Badge Colors:**
- Red: score < 2
- Yellow: score < 3.5
- Green: score ≥ 3.5

---

### Data Limits & Sampling

**Collection Limits:**
- Open issues: Up to 10,000
- Closed issues per time period: Up to 10,000
- Issues by label: Up to 100 per request (GitLab pagination)

**Sampling Strategy:**
- **Reopen Rate:** Sample 50 closed issues
  - Reason: Requires one API call per issue to get state events
  - 50 provides statistical significance
  - Selected from most recent closed issues
  
- **MR Link Rate:** Sample 30 closed issues
  - Reason: Requires one API call per issue to get MR references
  - 30 is sufficient for percentage calculation
  - Selected from most recent closed issues

**Why Sampling?**
- GitLab rate limit: 10 requests per second
- Some APIs require individual calls per issue
- Sampling 50 issues vs 10,000 issues: 50 API calls vs 10,000 API calls
- Statistical accuracy: 50-sample provides 14% margin of error at 95% confidence

---

### Usage in Application

**Where It Appears:**
- Project Detail Page (`client/src/pages/ProjectDetail.tsx`)
- Displayed as a card alongside other health metrics
- Part of the complete health metrics dashboard

**User Workflow:**
1. User navigates to project detail page
2. Issue Metrics Card loads latest metrics from database
3. User can click "Refresh Data" to recalculate from GitLab
4. System fetches data, calculates metrics, saves to DB
5. Card updates with new data
6. Historical trend data appears in charts

**Automatic Updates:**
- No automatic refresh (manual only via button)
- Can be scheduled via cron jobs (not implemented)
- Could be triggered by GitLab webhooks (not implemented)

---

## How Metrics Are Calculated

---

## MR Health Metrics

### What It Tracks

MR (Merge Request) Health Metrics analyze the efficiency and quality of your code review process. It focuses on:
- **Merge Velocity** - How quickly MRs are being merged
- **Merge Time** - Time from MR creation to merge
- **Review Quality** - Comments and reviewer participation
- **Code Stability** - Revert rate indicates quality issues
- **Stale MRs** - MRs that have been abandoned

### Metrics Breakdown

**Tier 1 (Critical Metrics):**
1. **Merge Velocity** - MRs merged per week (7d & 30d)
2. **Merge Time** - Average time from open to merge (hours/days)
3. **Review Comments** - Average comments per MR
4. **Revert Rate** - % of MRs that were reverted

**Tier 2 (Important Metrics):**
5. **MRs Opened Per Week** - New MRs created (7d & 30d)
6. **Stale MRs** - Open MRs with no activity >14 days
7. **Reviewers per MR** - Average number of reviewers assigned

### Database Schema

#### Table: `mr_health_metrics`

**Purpose:** Stores every calculation of MR metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | UUID | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | Foreign key to `projects.id` - which project these metrics belong to |
| `total_open_mrs` | INTEGER | Total count of open MRs at time of calculation |
| `total_merged_mrs` | INTEGER | Total count of merged MRs at time of calculation |
| **Merge Velocity Metrics** | | |
| `mrs_merged_last_7d` | INTEGER | Number of MRs merged in the last 7 days |
| `mrs_merged_last_30d` | INTEGER | Number of MRs merged in the last 30 days |
| **Merge Time Metrics** | | |
| `total_merge_time_hours` | FLOAT | Sum of all merge times (merged_at - created_at) |
| `mrs_with_merge_time` | INTEGER | Number of MRs included in merge time calculation |
| `avg_merge_time_hours` | FLOAT | Average time to merge an MR (in hours) |
| `avg_merge_time_days` | FLOAT | Average time to merge an MR (in days) |
| **Review Comments Metrics** | | |
| `total_review_comments` | INTEGER | Total comments across sampled MRs |
| `mrs_checked_for_comments` | INTEGER | Number of MRs checked for comments (sample size: 50) |
| `avg_review_comments_per_mr` | FLOAT | Average comments per MR |
| **Revert Rate Metrics** | | |
| `reverted_mrs_count` | INTEGER | Number of MRs that were reverted (from sample) |
| `mrs_checked_for_reverts` | INTEGER | Number of MRs checked for reverts (sample size: 50) |
| `revert_rate_percent` | FLOAT | Percentage of MRs that were reverted |
| **MRs Opened Metrics** | | |
| `mrs_opened_last_7d` | INTEGER | Number of MRs created in last 7 days |
| `mrs_opened_last_30d` | INTEGER | Number of MRs created in last 30 days |
| `net_mr_change_7d` | INTEGER | Opened - Merged in last 7 days (positive = backlog growing) |
| **Stale MRs Metrics** | | |
| `stale_mrs_count` | INTEGER | Open MRs with no activity for >14 days |
| `stale_mrs_percent` | FLOAT | Stale MRs / Total open MRs × 100 |
| **Reviewers Metrics** | | |
| `total_reviewers_count` | INTEGER | Total reviewers across sampled MRs |
| `mrs_checked_for_reviewers` | INTEGER | Number of MRs checked for reviewers (sample size: 50) |
| `avg_reviewers_per_mr` | FLOAT | Average reviewers assigned per MR |
| **Additional Metrics** | | |
| `closure_rate_percent` | FLOAT | (Merged / Opened) × 100 - measures if MR backlog is growing |
| **Alert Levels** | | |
| `merge_velocity_alert_level` | VARCHAR(20) | 'NORMAL', 'WARNING', or 'RED_ALERT' based on velocity |
| `merge_time_alert_level` | VARCHAR(20) | Alert level based on average merge time |
| `revert_rate_alert_level` | VARCHAR(20) | Alert level based on revert percentage |
| `stale_mrs_alert_level` | VARCHAR(20) | Alert level based on stale MR count |
| **Metadata** | | |
| `calculated_at` | TIMESTAMP | When this calculation was performed |

**Indexes:**
- `idx_mr_metrics_project_id` - Fast lookups by project
- `idx_mr_metrics_calculated_at` - Fast lookups by time
- `idx_mr_metrics_project_time` - Combined index for project + time queries

---

#### Table: `mr_metrics_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Unique Constraint:** One row per project per day (`project_id, snapshot_date` unique)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `total_open_mrs` | INTEGER | DEFAULT 0 | Snapshot of total open MRs |
| `total_merged_mrs` | INTEGER | DEFAULT 0 | Snapshot of total merged MRs |
| `mrs_merged_last_7d` | INTEGER | DEFAULT 0 | Snapshot of 7-day velocity |
| `mrs_opened_last_30d` | INTEGER | DEFAULT 0 | Snapshot of MRs opened in 30 days  |
| `mrs_merged_last_30d` | INTEGER | DEFAULT 0 | Snapshot of MRs merged in 30 days  |
| `avg_merge_time_days` | FLOAT | DEFAULT 0 | Snapshot of merge time |
| `avg_review_comments_per_mr` | FLOAT | DEFAULT 0 | Snapshot of review comments |
| `revert_rate_percent` | FLOAT | DEFAULT 0 | Snapshot of revert rate |
| `stale_mrs_count` | INTEGER | DEFAULT 0 | Snapshot of stale MRs |
| `avg_reviewers_per_mr` | FLOAT | DEFAULT 0 | Snapshot of avg reviewers |
| `closure_rate_percent` | FLOAT | DEFAULT 0 | (Merged / Opened) × 100  |
| `health_score` | DECIMAL(3,2) | DEFAULT NULL | Calculated health score (0-5)  |
| `snapshot_date` | DATE | DEFAULT CURRENT_DATE | Date of this snapshot |

**Constraints:**
- `idx_mr_history_project_date` - UNIQUE (project_id, snapshot_date)

**Indexes:**
- `idx_mr_metrics_history_project` - BTREE on (project_id)
- `idx_mr_metrics_history_date` - BTREE on (snapshot_date DESC)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. MR Metrics Sync Service**
- **File:** `server/src/services/mrMetrics/mrMetricsSyncService.ts`
- **Role:** Orchestrator - coordinates the entire refresh process
- **Key Methods:**
  - `syncMRMetrics(projectId)` - Main entry point, returns saved metrics
  - `fetchGitLabData(projectId)` - Fetches all required data from GitLab API
  - `calculateReviewComments(projectId, sample)` - Samples 50 MRs to fetch notes/comments
  - `calculateRevertRateFromData(sample)` - Samples 50 MRs to check for revert patterns
  - `calculateAvgReviewersFromData(sample)` - Samples 50 MRs to count reviewers

**2. MR Metrics Calculation Service**
- **File:** `server/src/services/mrMetrics/mrMetricsCalculationService.ts`
- **Role:** Pure calculation logic - no API calls, no database operations
- **Key Methods:**
  - `calculateMetrics(...)` - Main calculation function taking all raw data as parameters
  - `calculateMergeTime(mergedMRs)` - Computes average time from created to merged
  - `calculateAvgComments(total, checked)` - Calculates average
  - `calculateRevertRate(reverted, checked)` - Calculates percentage
  - `calculateStaleMRs(openMRs)` - Counts MRs with updated_at >14 days ago
  - `calculateClosureRate(merged, opened)` - Calculates closure percentage
  - Various alert level calculators (NORMAL/WARNING/RED_ALERT)

**3. MR Metrics Database Service**
- **File:** `server/src/services/mrMetrics/mrMetricsDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into `mr_health_metrics`, calls `calculateMRHealthScore()`
  - `saveHistoricalSnapshot(projectId)` - INSERT into `mr_metrics_history`
  - `getMetrics(projectId)` - GET latest metrics for a project
  - `getWeekOverWeekTrends(projectId)` - GET current vs previous week comparison
  - `getMetricsHistory(projectId, days)` - GET historical data for charts
  - `getAllMetrics(projectId)` - GET all historical calculations
  - `deleteMetrics(projectId)` - DELETE all metrics for a project

**4. Health Score Calculator (Utility)**
- **File:** `server/src/utils/healthScoreCalculator.ts`
- **Function:** `calculateMRHealthScore(metrics)` - Calculates 0-5 health score
- **Used by:** MR Metrics Database Service during `saveMetrics()`

---

### GitLab API Integration

**Service File:** `server/src/services/gitlab/gitLabMRService.ts`

**API Endpoints Used:**
- `GET /projects/:id/merge_requests` - Main endpoint for fetching MRs

**Key Methods:**

| Method | Purpose | Parameters | Data Limit |
|--------|---------|------------|------------|
| `getMRCount(projectId, state)` | Get fast count using headers | state: 'opened'\|'merged'\|'closed'\|'all' | N/A (header only) |
| `getOpenMRs(projectId, perPage)` | Fetch all open MRs | perPage: 500 | Up to 500 |
| `getMergedMRs(projectId, mergedAfter, perPage)` | Fetch merged MRs after date | mergedAfter: ISO date, perPage: 500 | Up to 500 |
| `getOpenedMRs(projectId, createdAfter, perPage)` | Fetch opened MRs after date | createdAfter: ISO date, perPage: 500 | Up to 500 |
| `getMRNotes(projectId, mrIid)` | Get discussion notes/comments | mrIid: MR internal ID | Up to 100 per page |
| `getMRReviewers(projectId, mrIid)` | Get reviewers for MR | mrIid: MR internal ID | N/A (part of MR object) |
| `checkMRReverted(projectId, mrIid)` | Check if MR was reverted | mrIid: MR internal ID | N/A |

**Query Parameters Used:**
- `state` - Filter by MR state (opened, merged, closed)
- `order_by` - Sort field (updated_at, created_at)
- `sort` - Sort direction (desc, asc)
- `per_page` - Results per page (max 100, we use up to 500 with custom logic)
- `updated_after` - Filter by last update time
- `created_after` - Filter by creation time

**API Call Optimization:**
- Uses `X-Total` header for counts (no data transfer)
- Parallel fetching of independent data sets
- Date filters reduce payload size
- Sampling for expensive operations (notes, reverts, reviewers)
- Limited to 500 MRs per query (increased from 200)

---

### Controller & Routes

**Controller File:** `server/src/controllers/mrMetricsController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh MR metrics (recalculate from GitLab)
POST /api/projects/:id/mr-metrics/refresh
├── Calls: mrMetricsSyncService.syncMRMetrics(projectId)
├── Returns: Latest metrics object with all fields
└── Response Time: 3-10 seconds depending on project size

// Get latest MR metrics
GET /api/projects/:id/mr-metrics
├── Calls: mrMetricsDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get week-over-week trends
GET /api/projects/:id/mr-metrics/trends
├── Calls: mrMetricsDbService.getWeekOverWeekTrends(projectId)
├── Returns: { current, previous, changes }
└── Response Time: <200ms

// Get historical data for charts
GET /api/projects/:id/mr-metrics/history?days=30
├── Calls: mrMetricsDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

**Controller Methods:**

```typescript
// POST /projects/:id/mr-metrics/refresh
refreshMRMetrics(req, res)
├── Validates project ID
├── Calls syncMRMetrics(projectId)
├── Returns saved metrics
└── Error handling with 500 response

// GET /projects/:id/mr-metrics
getMRMetrics(req, res)
├── Validates project ID
├── Fetches latest metrics from DB
├── Returns metrics or 404 if none found
└── Error handling with 500 response

// GET /projects/:id/mr-metrics/trends
getMRMetricsTrends(req, res)
├── Validates project ID
├── Fetches current + previous week metrics
├── Calculates percentage changes
└── Returns comparison object

// GET /projects/:id/mr-metrics/history
getMRMetricsHistory(req, res)
├── Validates project ID
├── Gets 'days' query parameter (default: 30)
├── Fetches historical snapshots
└── Returns array of data points
```

---

### Data Collection Flow

```
Step 1: Fetch Counts (Fast - uses headers)
├── getMRCount(projectId, 'opened') → total_open_mrs
└── getMRCount(projectId, 'merged') → total_merged_mrs

Step 2: Fetch MRs by Time Period (Parallel)
├── getOpenMRs(projectId, 500) → openMRs (for stale detection)
├── getMergedMRs(projectId, 7 days ago, 500) → mergedMRsLast7d
├── getMergedMRs(projectId, 30 days ago, 500) → mergedMRsLast30d
├── getOpenedMRs(projectId, 7 days ago, 500) → openedMRsLast7d
└── getOpenedMRs(projectId, 30 days ago, 500) → openedMRsLast30d

Step 3: Calculate Review Comments (Sampling - Sequential)
├── Take first 50 from mergedMRsLast30d
├── For each MR: getMRNotes(projectId, mrIid)
├── Count total comments across all sampled MRs
└── Calculate average: (total_comments / checked)

Step 4: Calculate Revert Rate (From Data - No API Calls)
├── Take first 50 from mergedMRsLast30d
├── For each MR: Check title/description/labels for "revert" keywords
├── Count MRs with revert patterns
└── Calculate percentage: (reverted / checked) × 100

Step 5: Calculate Reviewers per MR (From Data - No API Calls)
├── Take first 50 from mergedMRsLast30d
├── For each MR: Count reviewers array length
├── Sum total reviewers
└── Calculate average: (total_reviewers / checked)

Step 6: Calculate All Metrics
├── Pass all raw data to calculationService.calculateMetrics()
└── Returns complete metrics object

Step 7: Calculate Health Score
├── Health Score = Weighted formula (0-5 scale)
├── Factors: Merge Time (35%), Revert Rate (25%), Velocity (25%), Review Comments (15%)
└── Saved with metrics

Step 8: Save to Database
├── INSERT into mr_health_metrics (all fields)
└── INSERT into mr_metrics_history (key fields + health_score)
```

---

### Health Score Calculation

**Formula:**
```
Health Score = 
  Merge Time Score × 0.35 +
  Revert Rate Score × 0.25 +
  Velocity Score × 0.25 +
  Review Comments Score × 0.15
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Merge Time (days)** | <1 | <2 | <5 | <10 | <20 | ≥20 |
| **Revert Rate (%)** | <3 | <5 | <10 | <15 | <25 | ≥25 |
| **Velocity (7d merged)** | >15 | ≥10 | ≥5 | ≥2 | ≥1 | 0 |
| **Review Comments** | ≥10 | ≥5 | ≥2 | ≥1 | >0 | 0 |

**Alert Level Calculation:**

```typescript
// Merge Velocity Alert
if (mrs_merged_last_30d === 0) return 'RED_ALERT'
if (mrs_merged_last_30d < 10) return 'WARNING'
return 'NORMAL'

// Merge Time Alert
if (avg_merge_time_days > 10) return 'RED_ALERT'
if (avg_merge_time_days > 5) return 'WARNING'
return 'NORMAL'

// Revert Rate Alert
if (revert_rate_percent > 15) return 'RED_ALERT'
if (revert_rate_percent > 10) return 'WARNING'
return 'NORMAL'

// Stale MRs Alert
if (stale_mrs_count > 10) return 'RED_ALERT'
if (stale_mrs_count > 5) return 'WARNING'
return 'NORMAL'
```

---

### Frontend Component

**File:** `client/src/components/MRMetricsCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Total open and merged MRs
- Merge velocity (MRs merged in 7d and 30d)
- Average merge time (in days)
- Average review comments per MR
- Revert rate percentage
- Stale MRs count
- Average reviewers per MR
- Alert indicators for each metric
- Last updated timestamp

**Data Fetching:**
```typescript
// On component mount
useEffect(() => {
  fetch(`/api/projects/${projectId}/mr-metrics`)
    .then(res => res.json())
    .then(data => setMetrics(data))
}, [projectId])
```

**Refresh Button:**
```typescript
const handleRefresh = async () => {
  setLoading(true)
  await fetch(`/api/projects/${projectId}/mr-metrics/refresh`, {
    method: 'POST'
  })
  // Refetch latest metrics
  const response = await fetch(`/api/projects/${projectId}/mr-metrics`)
  const data = await response.json()
  setMetrics(data)
  setLoading(false)
}
```

**Health Score Badge Colors:**
- Red: score < 2
- Yellow: score < 3.5
- Green: score ≥ 3.5

---

### Data Limits & Sampling

**Collection Limits:**
- Open MRs: Up to 500 (increased from 100)
- Merged MRs per time period: Up to 500 (increased from 200)
- Opened MRs per time period: Up to 500 (increased from 100)

**Sampling Strategy (all use merged MRs from last 30 days):**
- **Review Comments:** Sample 50 MRs (increased from 30)
  - Reason: Requires one API call per MR to get notes/discussions
  - 50 provides good statistical significance
  - API intensive: Each MR can have 0-100+ comments
  
- **Revert Rate:** Sample 50 MRs
  - Reason: Pattern matching on title/description/labels (no extra API calls)
  - Fast operation - data already fetched
  - Checks for "revert", "Revert", "reverted" keywords
  
- **Reviewers per MR:** Sample 50 MRs (increased from 30)
  - Reason: Data already in MR object (no extra API calls)
  - Fast operation - just count reviewers array
  - Some MRs have 0 reviewers (unassigned)

**Why Sample from Last 30 Days?**
- More relevant for current team practices
- Reduces API calls and processing time
- Still provides statistically significant sample
- Balances accuracy vs performance

**Why Increased Limits?**
- Original limits (100-200) were too restrictive for large projects
- New limits (500) capture more data for better accuracy
- GitLab API can handle 500 results per query efficiently
- Still fast enough for user experience (<10 seconds)

---

## Commit Health Metrics

### What It Tracks

Commit Health Metrics analyze code contribution patterns and team collaboration. It focuses on:
- **Commit Frequency** - How actively the team is committing code
- **Commit Size** - Whether commits are appropriately sized
- **Code Growth** - Whether code is growing or shrinking
- **Bus Factor** - Distribution of knowledge across the team

### Metrics Breakdown

**Core Metrics:**
1. **Commit Frequency** - Total commits in last 7 days
2. **Average Commit Size** - Average lines changed per commit
3. **Lines Added vs Deleted** - Code growth ratio
4. **Bus Factor** - Number of contributors with >50% of commits (lower = risky)

### Database Schema

#### Table: `commit_health_metrics`

**Purpose:** Stores every calculation of commit metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | UUID | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | Foreign key to `projects.id` - which project these metrics belong to |
| **Commit Frequency** | | |
| `total_commits_last_7d` | INTEGER | Total commits in the last 7 days |
| **Commit Size Metrics** | | |
| `total_lines_changed` | INTEGER | Sum of (additions + deletions) across all commits |
| `commits_analyzed` | INTEGER | Number of commits included in size calculation |
| `avg_commit_size` | FLOAT | Average lines changed per commit |
| **Lines Added vs Deleted** | | |
| `total_lines_added` | INTEGER | Sum of all line additions across commits |
| `total_lines_deleted` | INTEGER | Sum of all line deletions across commits |
| `lines_added_deleted_ratio` | FLOAT | lines_added / lines_deleted (>1 = growing, <1 = shrinking) |
| **Commits Per Week** | | |
| `commits_per_week` | INTEGER | Total commits in last 7 days (same as total_commits_last_7d) |
| **Bus Factor Metrics** | | |
| `total_contributors` | INTEGER | Number of unique contributors in last 7 days |
| `contributors_above_50_percent` | INTEGER | Contributors who made >50% of total commits |
| `bus_factor` | INTEGER | Same as contributors_above_50_percent (0 = ideal, higher = risky) |
| **Metadata** | | |
| `commit_details` | JSONB | Array of commit objects (up to 100 stored) with sha, title, message, author, created_at |
| `calculated_at` | TIMESTAMP | When this calculation was performed |

**Indexes:**
- `idx_commit_metrics_project_id` - Fast lookups by project
- `idx_commit_metrics_calculated_at` - Fast lookups by time

---

#### Table: `commit_metrics_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Unique Constraint:** One row per project per day (`project_id, snapshot_date` unique)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `total_commits_last_7d` | INTEGER | DEFAULT 0 | Snapshot of commit frequency |
| `avg_commit_size` | FLOAT | DEFAULT 0 | Snapshot of average commit size |
| `total_lines_added` | INTEGER | DEFAULT 0 | Snapshot of lines added |
| `total_lines_deleted` | INTEGER | DEFAULT 0 | Snapshot of lines deleted |
| `bus_factor` | INTEGER | DEFAULT 0 | Snapshot of bus factor |
| `health_score` | DECIMAL(3,2) | DEFAULT NULL | Calculated health score (0-5) |
| `snapshot_date` | DATE | NOT NULL | Date of this snapshot |

**Constraints:**
- `commit_metrics_history_unique` - UNIQUE (project_id, snapshot_date)

**Indexes:**
- `idx_commit_history_project_date` - BTREE on (project_id, snapshot_date DESC) |

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Commit Metrics Sync Service**
- **File:** `server/src/services/commitMetrics/commitMetricsSyncService.ts`
- **Role:** Orchestrator - coordinates the entire refresh process
- **Key Methods:**
  - `syncCommitMetrics(projectId)` - Main entry point, returns saved metrics
  - `fetchGitLabData(projectId)` - Fetches commits from last 7 days with stats

**2. Commit Metrics Calculation Service**
- **File:** `server/src/services/commitMetrics/commitMetricsCalculationService.ts`
- **Role:** Pure calculation logic - no API calls, no database operations
- **Key Methods:**
  - `calculateMetrics(projectId, commits, totalCount)` - Main calculation function
  - `calculateAvgCommitSize(commits)` - Computes average (additions + deletions)
  - `calculateLinesAddedDeleted(commits)` - Sums additions/deletions and calculates ratio
  - `calculateBusFactor(commits)` - Groups by contributor, identifies risky contributors

**3. Commit Metrics Database Service**
- **File:** `server/src/services/commitMetrics/commitMetricsDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into `commit_health_metrics`, calculates health score
  - `saveHistoricalSnapshot(projectId)` - INSERT into `commit_metrics_history`
  - `getMetrics(projectId)` - GET latest metrics for a project
  - `getMetricsHistory(projectId, days)` - GET historical data for charts
  - `deleteMetrics(projectId)` - DELETE all metrics for a project

---

### GitLab API Integration

**Service File:** `server/src/services/gitlab/gitLabCommitService.ts`

**API Endpoints Used:**
- `GET /projects/:id/repository/commits` - Main endpoint for fetching commits

**Key Methods:**

| Method | Purpose | Parameters | Data Limit |
|--------|---------|------------|------------|
| `getCommitCount(projectId, since)` | Get fast count using headers | since: ISO date | N/A (header only) |
| `getCommits(projectId, since, perPage)` | Fetch commits with stats | since: ISO date, perPage: 100 | Up to 100 |

**Query Parameters Used:**
- `since` - Filter commits after this date (ISO 8601)
- `with_stats` - Include additions/deletions stats (true)
- `per_page` - Results per page (100 max)

**Commit Data Structure:**
```javascript
{
  id: "sha_hash",
  title: "Commit title",
  message: "Full commit message",
  author_name: "John Doe",
  author_email: "john@example.com",
  created_at: "2026-01-15T10:00:00Z",
  committed_date: "2026-01-15T10:00:00Z",
  stats: {
    additions: 50,
    deletions: 20,
    total: 70
  }
}
```

**API Call Optimization:**
- Uses `X-Total` header for counts (no data transfer)
- Fetches only last 7 days of commits
- Limited to 100 commits (sufficient for most projects)
- Includes stats in single request (no additional calls)

---

### Controller & Routes

**Controller File:** `server/src/controllers/commitMetricsController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh commit metrics (recalculate from GitLab)
POST /api/projects/:id/commit-metrics/refresh
├── Calls: commitMetricsSyncService.syncCommitMetrics(projectId)
├── Returns: Latest metrics object with all fields
└── Response Time: 1-3 seconds

// Get latest commit metrics
GET /api/projects/:id/commit-metrics
├── Calls: commitMetricsDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get historical data for charts
GET /api/projects/:id/commit-metrics/history?days=30
├── Calls: commitMetricsDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

**Controller Methods:**

```typescript
// POST /projects/:id/commit-metrics/refresh
refreshCommitMetrics(req, res)
├── Validates project ID
├── Calls syncCommitMetrics(projectId)
├── Returns saved metrics
└── Error handling with 500 response

// GET /projects/:id/commit-metrics
getCommitMetrics(req, res)
├── Validates project ID
├── Fetches latest metrics from DB
├── Returns metrics or 404 if none found
└── Error handling with 500 response

// GET /projects/:id/commit-metrics/history
getCommitMetricsHistory(req, res)
├── Validates project ID
├── Gets 'days' query parameter (default: 30)
├── Fetches historical snapshots
└── Returns array of data points
```

---

### Data Collection Flow

```
Step 1: Fetch Commit Count (Fast - uses headers)
└── getCommitCount(projectId, 7 days ago) → total_commits_last_7d

Step 2: Fetch Commits with Stats
└── getCommits(projectId, 7 days ago, 100) → commitsLast7d
    ├── Includes commit metadata (sha, title, message, author, date)
    └── Includes stats (additions, deletions, total)

Step 3: Calculate All Metrics
├── calculateAvgCommitSize(commits)
│   ├── Sum: (additions + deletions) for each commit
│   └── Divide by commit count
├── calculateLinesAddedDeleted(commits)
│   ├── Sum all additions
│   ├── Sum all deletions
│   └── Calculate ratio: additions / deletions
└── calculateBusFactor(commits)
    ├── Group commits by author email
    ├── Count unique contributors
    ├── Find contributors with >50% of commits
    └── Bus factor = number of risky contributors

Step 4: Extract Commit Details
├── Take first 100 commits
└── Store: sha, title, message, author, created_at

Step 5: Calculate Health Score
├── Health Score = Weighted formula (0-5 scale)
├── Factors: Frequency (40%), Commit Size (30%), Bus Factor (30%)
└── Saved with metrics

Step 6: Save to Database
├── INSERT into commit_health_metrics (all fields + commit_details JSONB)
└── INSERT into commit_metrics_history (key fields + health_score)
```

---

### Health Score Calculation

**Calculated by:** `calculateCommitHealthScore()` in `server/src/utils/healthScoreCalculator.ts`

**Formula:**
```
Health Score = 
  Commit Frequency Score × 0.40 +
  Commit Size Score × 0.30 +
  Bus Factor Score × 0.30
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3.5 | Score 3 | Score 2.5 | Score 2 | Score 1.5 | Score 1 | Score 0.5 |
|--------|---------|---------|-----------|---------|-----------|---------|-----------|---------|-----------|
| **Frequency (7d)** | >50 | ≥25 | - | ≥10 | - | ≥5 | - | ≥1 | 0 |
| **Commit Size (lines)** | <200 | <500 | - | <1000 | - | <2000 | - | <5000 | ≥5000 |
| **Bus Factor** | ≥5 | ≥4 | ≥3 | - | =2 | - | =1 | - | 0 |

**Notes:**
- Lower bus factor is RISKY (means fewer people control most code)
- Ideal: Many contributors, no single person dominates
- Commit size: Smaller is better (easier to review, less risky)
- Bus Factor uses fractional scores (3.5, 2.5, 1.5, 0.5) for more granular assessment
- Commit Size gives 0.5 even for very large commits (≥5000 lines)

---

### Frontend Component

**File:** `client/src/components/CommitMetricsCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Total commits in last 7 days
- Average commit size (lines)
- Lines added vs deleted ratio
- Bus factor (with warning if low)
- List of recent commit details
- Last updated timestamp

**Data Fetching:**
```typescript
// On component mount
useEffect(() => {
  fetch(`/api/projects/${projectId}/commit-metrics`)
    .then(res => res.json())
    .then(data => setMetrics(data))
}, [projectId])
```

**Health Score Badge Colors:**
- Red: score < 2
- Yellow: score < 3.5
- Green: score ≥ 3.5

---

### Data Limits & Sampling

**Collection Limits:**
- Commits from last 7 days: Up to 100 with full stats
- Commit details stored: Up to 100 (JSONB field limit)

**No Sampling:**
- Analyzes ALL commits from last 7 days (up to 100)
- All metrics calculated from complete dataset
- Fast operation (single API call with stats)

**Why Only 7 Days?**
- Commit metrics measure recent activity
- 7 days provides good snapshot of current practices
- Keeps data size manageable
- Fast refresh times

---

### Usage in Application

**Where It Appears:**
- Project Detail Page (`client/src/pages/ProjectDetail.tsx`)
- Displayed as a card alongside other health metrics
- Part of the complete health metrics dashboard

**User Workflow:**
1. User navigates to project detail page
2. Commit Metrics Card loads latest metrics from database
3. User can click "Refresh Data" to recalculate from GitLab
4. System fetches commits, calculates metrics, saves to DB
5. Card updates with new data
6. Historical trend data appears in charts

---

## SonarQube Maintainability Metrics

### What It Tracks

Maintainability Metrics analyze code quality and technical debt using SonarQube. It focuses on:
- **Maintainability Rating** - Overall maintainability grade (A-E)
- **Technical Debt** - Time required to fix all code smells
- **Code Smells** - Maintainability issues that make code harder to work with
- **Duplicated Code** - Copy-pasted code blocks

### Metrics Breakdown

**Core Metrics:**
1. **Maintainability Rating** - SonarQube's A-E rating
2. **Technical Debt Ratio** - % of time needed to fix all code smells
3. **Code Smells** - Total count (HIGH and BLOCKER severity)
4. **Duplicated Code** - % of code that is duplicated

### Database Schema

#### Table: `sonarqube_maintainability_metrics`

**Purpose:** Stores every calculation of maintainability metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` - which project these metrics belong to |
| **Severity Counts** | | | |
| `maintainability_high` | INTEGER | DEFAULT 0 | Code smells with HIGH severity |
| `maintainability_blocker` | INTEGER | DEFAULT 0 | Code smells with BLOCKER severity |
| **Technical Debt** | | | |
| `technical_debt_ratio` | DOUBLE PRECISION | DEFAULT 0 | Technical debt / Development time × 100 |
| **Rating** | | | |
| `maintainability_rating` | VARCHAR(1) | DEFAULT 'A' | SonarQube rating: 'A' (best) to 'E' (worst) |
| `maintainability_rating_value` | INTEGER | DEFAULT 1 | Numeric rating value (1-5) |
| **Code Smells** | | | |
| `code_smells_total` | INTEGER | DEFAULT 0 | Total count of all code smells |
| `code_smells_new` | INTEGER | DEFAULT 0 | Count of new code smells introduced |
| **Complexity Metrics** | | | |
| `cyclomatic_complexity` | INTEGER | DEFAULT 0 | Cyclomatic complexity measurement |
| `cognitive_complexity` | INTEGER | DEFAULT 0 | Cognitive complexity measurement |
| **Duplication** | | | |
| `duplicated_code_percentage` | DOUBLE PRECISION | DEFAULT 0 | % of code that is duplicated |
| `duplicated_lines_new` | DOUBLE PRECISION | DEFAULT 0 | New duplicated lines introduced |
| **Metadata** | | | |
| `calculated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When this calculation was performed |

**Constraints:**
- `sonarqube_maintainability_metrics_pkey` - PRIMARY KEY (uuid)
- `sonarqube_maintainability_metrics_project_id_fkey` - FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE

**Indexes:**
- `sonarqube_maintainability_metrics_pkey` (UNIQUE) - BTREE on (uuid)
- `idx_sonar_maintainability_project_id` - BTREE on (project_id) - Fast lookups by project
- `idx_sonar_maintainability_calculated_at` - BTREE on (calculated_at) - Fast lookups by time

---

#### Table: `sonarqube_maintainability_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Unique Constraint:** One row per project per day (`project_id, snapshot_date` unique)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `maintainability_high` | INTEGER | DEFAULT 0 | Snapshot of high severity code smells |
| `maintainability_blocker` | INTEGER | DEFAULT 0 | Snapshot of blocker severity code smells |
| `technical_debt_ratio` | DOUBLE PRECISION | DEFAULT 0 | Snapshot of debt ratio |
| `maintainability_rating` | VARCHAR(1) | DEFAULT 'A' | Snapshot of rating |
| `code_smells_total` | INTEGER | DEFAULT 0 | Snapshot of code smells |
| `duplicated_code_percentage` | DOUBLE PRECISION | DEFAULT 0 | Snapshot of duplication |
| `health_score` | DECIMAL(3,2) | DEFAULT NULL | Calculated health score (0-5) |
| `snapshot_date` | DATE | NOT NULL | Date of this snapshot |

**Constraints:**
- `sonar_maintainability_history_unique` - UNIQUE (project_id, snapshot_date)

**Indexes:**
- `idx_sonar_maintainability_history_project_date` - BTREE on (project_id, snapshot_date)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Maintainability API Service**
- **File:** `server/src/services/sonarMaintainability/sonarMaintainabilityApiService.ts`
- **Role:** Fetches data from SonarQube API
- **Key Methods:**
  - `getMaintainabilityMetrics(projectKey)` - Fetch all maintainability metrics
  - `getIssueCount(projectKey, type, severity)` - Get count of specific issue types

**2. Maintainability Calculation Service**
- **File:** `server/src/services/sonarMaintainability/sonarMaintainabilityCalculationService.ts`
- **Role:** Pure calculation logic - processes SonarQube data
- **Key Methods:**
  - `calculateMetrics(sonarData)` - Main calculation function
  - `convertRatingToNumeric(rating)` - Convert A-E to 5-1

**3. Maintainability Sync Service**
- **File:** `server/src/services/sonarMaintainability/sonarMaintainabilitySyncService.ts`
- **Role:** Orchestrates fetch, calculate, save
- **Key Methods:**
  - `syncMaintainabilityMetrics(projectId, sonarKey)` - Main entry point
  
**4. Maintainability Database Service**
- **File:** `server/src/services/sonarMaintainability/sonarMaintainabilityDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into table, calls `calculateMaintainabilityHealthScore()`
  - `saveHistoricalSnapshot(projectId)` - INSERT into history
  - `getMetrics(projectId)` - GET latest metrics
  - `getMetricsHistory(projectId, days)` - GET historical data

**5. Health Score Calculator (Utility)**
- **File:** `server/src/utils/healthScoreCalculator.ts`
- **Function:** `calculateMaintainabilityHealthScore(metrics)` - Calculates 0-5 health score
- **Used by:** Maintainability Database Service during `saveMetrics()`

---

### SonarQube API Integration

**API Endpoints Used:**
- `GET /api/measures/component` - Main endpoint for metrics
- `GET /api/issues/search` - For detailed issue counts by severity

**Metric Keys Requested:**
- `sqale_rating` - Maintainability rating (A-E)
- `sqale_debt_ratio` - Technical debt ratio
- `sqale_index` - Technical debt in minutes
- `code_smells` - Total code smells
- `duplicated_lines_density` - % of duplicated lines

**Authentication:**
- Uses SonarQube token from environment variables
- Sent via Authorization header: `Basic base64(token:)`

**Data Structure:**
```javascript
{
  component: {
    key: "project-key",
    name: "Project Name",
    measures: [
      { metric: "sqale_rating", value: "A" },
      { metric: "sqale_debt_ratio", value: "5.2" },
      { metric: "code_smells", value: "42" },
      { metric: "duplicated_lines_density", value: "3.1" }
    ]
  }
}
```

---

### Controller & Routes

**Controller File:** `server/src/controllers/sonarQubeMaintainabilityController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh maintainability metrics (recalculate from SonarQube)
POST /api/projects/:id/sonarqube-maintainability/refresh
├── Calls: sonarMaintainabilitySyncService.syncMaintainabilityMetrics(projectId, sonarKey)
├── Returns: Latest metrics object with all fields
└── Response Time: 1-2 seconds

// Get latest maintainability metrics
GET /api/projects/:id/sonarqube-maintainability
├── Calls: sonarMaintainabilityDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get historical data for charts
GET /api/projects/:id/sonarqube-maintainability/history?days=30
├── Calls: sonarMaintainabilityDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

---

### Data Collection Flow

```
Step 1: Get SonarQube Project Key
└── Look up sonar_project_key from projects table

Step 2: Fetch Metrics from SonarQube
└── getMaintainabilityMetrics(projectKey)
    ├── Calls /api/measures/component
    ├── Returns all metric values
    └── Single API call

Step 3: Fetch Issue Counts by Severity
├── getIssueCount(projectKey, 'CODE_SMELL', 'HIGH') → code_smells_high
└── getIssueCount(projectKey, 'CODE_SMELL', 'BLOCKER') → code_smells_blocker

Step 4: Calculate All Metrics
├── Parse maintainability rating (A-E)
├── Extract technical debt (minutes and ratio)
├── Count total code smells
└── Extract duplication percentage

Step 5: Calculate Health Score
├── Health Score = Weighted formula (0-5 scale)
├── Factors: Rating (40%), Debt Ratio (30%), Code Smells (20%), Duplication (10%)
└── Saved with metrics

Step 6: Save to Database
├── INSERT into sonarqube_maintainability_metrics (all fields)
└── INSERT into sonarqube_maintainability_history (key fields + health_score)
```

---

### Health Score Calculation

**Calculated by:** `calculateMaintainabilityHealthScore()` in `server/src/utils/healthScoreCalculator.ts`

**Formula:**
```
Health Score = 
  Rating Score × 0.30 +
  Debt Ratio Score × 0.30 +
  Code Smells Score × 0.20 +
  Duplication Score × 0.20
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Rating** | A | B | C | D | E | E |
| **Debt Ratio (%)** | <5 | <10 | <20 | <30 | <50 | ≥50 |
| **Code Smells** | 0 | ≤10 | ≤30 | ≤50 | ≤100 | >100 |
| **Duplication (%)** | <3 | <5 | <10 | <20 | <30 | ≥30 |

**Rating Conversion:**
- A → 5.0
- B → 4.0
- C → 3.0
- D → 2.0
- E → 1.0

---

### Frontend Component

**File:** `client/src/components/SonarMaintainabilityCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Maintainability rating badge (A-E)
- Technical debt ratio percentage
- Total code smells count
- High and blocker severity counts
- Duplicated code percentage
- Last updated timestamp

**Health Score Badge Colors:**
- Red: score < 2 or rating D/E
- Yellow: score < 3.5 or rating C
- Green: score ≥ 3.5 or rating A/B

---

### Usage in Application

**Where It Appears:**
- Project Detail Page (`client/src/pages/ProjectDetail.tsx`)
- Displayed as a card alongside other health metrics
- Part of the complete health metrics dashboard

**Requirements:**
- Project must have `sonar_project_key` set in database
- SonarQube instance must be configured with token
- Project must exist in SonarQube with analysis data

---

## SonarQube Reliability Metrics

### What It Tracks

Reliability Metrics analyze bugs and code stability using SonarQube. It focuses on:
- **Reliability Rating** - Overall reliability grade (A-E)
- **Total Bugs** - Count of all bugs
- **High Severity Bugs** - Critical bugs that should be fixed ASAP
- **Blocker Bugs** - Most critical bugs that block releases

### Metrics Breakdown

**Core Metrics:**
1. **Reliability Rating** - SonarQube's A-E rating
2. **Total Bugs** - All bugs across all severity levels
3. **High Severity Bugs** - Bugs with HIGH severity
4. **Blocker Bugs** - Bugs with BLOCKER severity

### Database Schema

#### Table: `sonarqube_reliability_metrics`

**Purpose:** Stores every calculation of reliability metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` - which project these metrics belong to |
| **Bug Counts** | | | |
| `bugs_total` | INTEGER | DEFAULT 0 | Total count of all bugs |
| `bugs_critical` | INTEGER | DEFAULT 0 | Bugs with CRITICAL severity |
| `bugs_blocker` | INTEGER | DEFAULT 0 | Bugs with BLOCKER severity (most critical) |
| `bugs_new` | INTEGER | DEFAULT 0 | Count of new bugs introduced |
| **Rating** | | | |
| `reliability_rating` | VARCHAR(1) | DEFAULT 'A' | SonarQube rating: 'A' (best) to 'E' (worst) |
| `reliability_rating_value` | INTEGER | DEFAULT 1 | Numeric rating value (1-5) |
| **Remediation** | | | |
| `reliability_remediation_effort` | INTEGER | DEFAULT 0 | Estimated effort to fix all bugs (in minutes) |
| **Metadata** | | | |
| `calculated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When this calculation was performed |

**Constraints:**
- `sonarqube_reliability_metrics_pkey` - PRIMARY KEY (uuid)
- `sonarqube_reliability_metrics_project_id_fkey` - FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE

**Indexes:**
- `sonarqube_reliability_metrics_pkey` (UNIQUE) - BTREE on (uuid)
- `idx_sonar_reliability_project_id` - BTREE on (project_id) - Fast lookups by project
- `idx_sonar_reliability_calculated_at` - BTREE on (calculated_at) - Fast lookups by time

---

#### Table: `sonarqube_reliability_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Unique Constraint:** One row per project per day (`project_id, snapshot_date` unique)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `bugs_total` | INTEGER | DEFAULT 0 | Snapshot of total bugs |
| `reliability_rating` | VARCHAR(1) | DEFAULT 'A' | Snapshot of rating |
| `health_score` | DECIMAL(3,2) | DEFAULT NULL | Calculated health score (0-5) |
| `snapshot_date` | DATE | NOT NULL | Date of this snapshot |

**Constraints:**
- `sonar_reliability_history_unique` - UNIQUE (project_id, snapshot_date)

**Indexes:**
- `idx_sonar_reliability_history_project_date` - BTREE on (project_id, snapshot_date)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Reliability API Service**
- **File:** `server/src/services/sonarReliability/sonarReliabilityApiService.ts`
- **Role:** Fetches data from SonarQube API
- **Key Methods:**
  - `getReliabilityMetrics(projectKey)` - Fetch all reliability metrics
  - `getBugCount(projectKey, severity)` - Get count of bugs by severity

**2. Reliability Sync Service**
- **File:** `server/src/services/sonarReliability/sonarReliabilitySyncService.ts`
- **Role:** Orchestrates fetch, calculate, save
- **Key Methods:**
  - `syncReliabilityMetrics(projectId, sonarKey)` - Main entry point
  
**3. Reliability Database Service**
- **File:** `server/src/services/sonarReliability/sonarReliabilityDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into table, calls `calculateReliabilityHealthScore()`
  - `saveHistoricalSnapshot(projectId)` - INSERT into history
  - `getMetrics(projectId)` - GET latest metrics
  - `getMetricsHistory(projectId, days)` - GET historical data

**4. Health Score Calculator (Utility)**
- **File:** `server/src/utils/healthScoreCalculator.ts`
- **Function:** `calculateReliabilityHealthScore(metrics)` - Calculates 0-5 health score
- **Used by:** Reliability Database Service during `saveMetrics()`

---

### SonarQube API Integration

**API Endpoints Used:**
- `GET /api/measures/component` - Main endpoint for metrics
- `GET /api/issues/search` - For detailed bug counts by severity

**Metric Keys Requested:**
- `reliability_rating` - Reliability rating (A-E)
- `bugs` - Total bug count

**Issue Search Parameters:**
- `componentKeys` - Project key
- `types` - BUG
- `severities` - HIGH or BLOCKER
- `resolved` - false (only open bugs)

---

### Controller & Routes

**Controller File:** `server/src/controllers/sonarQubeReliabilityController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh reliability metrics (recalculate from SonarQube)
POST /api/projects/:id/sonarqube-reliability/refresh
├── Calls: sonarReliabilitySyncService.syncReliabilityMetrics(projectId, sonarKey)
├── Returns: Latest metrics object with all fields
└── Response Time: 1-2 seconds

// Get latest reliability metrics
GET /api/projects/:id/sonarqube-reliability
├── Calls: sonarReliabilityDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get historical data for charts
GET /api/projects/:id/sonarqube-reliability/history?days=30
├── Calls: sonarReliabilityDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

---

### Health Score Calculation

**Calculated by:** `calculateReliabilityHealthScore()` in `server/src/utils/healthScoreCalculator.ts`

**Formula:**
```
Health Score = 
  Rating Score × 0.50 +
  Total Bugs Score × 0.50
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Rating** | A | B | C | D | E | - |
| **Total Bugs** | 0 | ≤5 | ≤15 | ≤30 | ≤50 | >50 |

---

### Frontend Component

**File:** `client/src/components/SonarReliabilityCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Reliability rating badge (A-E)
- Total bugs count
- High severity bugs count
- Blocker bugs count (highlighted if > 0)
- Last updated timestamp

---

## SonarQube Security Metrics

### What It Tracks

Security Metrics analyze vulnerabilities and security hotspots using SonarQube. It focuses on:
- **Security Rating** - Overall security grade (A-E)
- **Vulnerabilities** - Count of security vulnerabilities
- **Critical Vulnerabilities** - High severity vulnerabilities
- **Security Hotspots** - Code sections requiring security review

### Metrics Breakdown

**Core Metrics:**
1. **Security Rating** - SonarQube's A-E rating
2. **Total Vulnerabilities** - All vulnerabilities across all severity levels
3. **High Severity Vulnerabilities** - Vulnerabilities with HIGH severity
4. **Blocker Vulnerabilities** - Vulnerabilities with BLOCKER severity
5. **Security Hotspots** - Code sections that need security review
6. **Hotspots Reviewed** - % of hotspots that have been reviewed

### Database Schema

#### Table: `sonarqube_security_metrics`

**Purpose:** Stores every calculation of security metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` - which project these metrics belong to |
| **Vulnerability Counts** | | | |
| `vulnerabilities_total` | INTEGER | DEFAULT 0 | Total count of all vulnerabilities |
| `vulnerabilities_new` | INTEGER | DEFAULT 0 | Count of new vulnerabilities introduced |
| **Security Rating** | | | |
| `security_rating` | VARCHAR(1) | DEFAULT 'A' | SonarQube security rating: 'A' (best) to 'E' (worst) |
| `security_rating_value` | INTEGER | DEFAULT 1 | Numeric security rating value (1-5) |
| **Security Hotspots** | | | |
| `security_hotspots_total` | INTEGER | DEFAULT 0 | Total number of security hotspots |
| `security_hotspots_reviewed` | NUMERIC(5, 2) | DEFAULT 0.00 | % of hotspots that have been reviewed (0.00-100.00) |
| **Security Review** | | | |
| `security_review_rating` | VARCHAR(1) | DEFAULT 'A' | Security review rating: 'A' (best) to 'E' (worst) |
| `security_review_rating_value` | INTEGER | DEFAULT 1 | Numeric security review rating value (1-5) |
| **Remediation** | | | |
| `security_remediation_effort` | INTEGER | DEFAULT 0 | Estimated effort to fix all vulnerabilities (in minutes) |
| **Metadata** | | | |
| `calculated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When this calculation was performed |

**Constraints:**
- `sonarqube_security_metrics_pkey` - PRIMARY KEY (uuid)
- `sonarqube_security_metrics_project_id_fkey` - FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE

**Indexes:**
- `sonarqube_security_metrics_pkey` (UNIQUE) - BTREE on (uuid)
- `idx_sonar_security_project_id` - BTREE on (project_id) - Fast lookups by project
- `idx_sonar_security_calculated_at` - BTREE on (calculated_at) - Fast lookups by time

---

#### Table: `sonarqube_security_history`

**Purpose:** Stores key metrics and health score for trend analysis.

**Unique Constraint:** One row per project per day (`project_id, snapshot_date` unique)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `uuid` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Primary key |
| `row_id` | SERIAL | NOT NULL | Auto-incrementing row number |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Foreign key to `projects.id` |
| `vulnerabilities_total` | INTEGER | DEFAULT 0 | Snapshot of total vulnerabilities |
| `security_rating` | VARCHAR(1) | DEFAULT 'A' | Snapshot of rating |
| `security_hotspots_total` | INTEGER | DEFAULT 0 | Snapshot of hotspots |
| `health_score` | DECIMAL(3,2) | DEFAULT NULL | Calculated health score (0-5) |
| `snapshot_date` | DATE | NOT NULL | Date of this snapshot |

**Constraints:**
- `sonar_security_history_unique` - UNIQUE (project_id, snapshot_date)

**Indexes:**
- `idx_sonar_security_history_project_date` - BTREE on (project_id, snapshot_date)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Security API Service**
- **File:** `server/src/services/sonarSecurity/sonarSecurityApiService.ts`
- **Role:** Fetches data from SonarQube API
- **Key Methods:**
  - `getSecurityMetrics(projectKey)` - Fetch all security metrics
  - `getVulnerabilityCount(projectKey, severity)` - Get count of vulnerabilities by severity

**2. Security Sync Service**
- **File:** `server/src/services/sonarSecurity/sonarSecuritySyncService.ts`
- **Role:** Orchestrates fetch, calculate, save
- **Key Methods:**
  - `syncSecurityMetrics(projectId, sonarKey)` - Main entry point
  
**3. Security Database Service**
- **File:** `server/src/services/sonarSecurity/sonarSecurityDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into table, calls `calculateSecurityHealthScore()`
  - `saveHistoricalSnapshot(projectId)` - INSERT into history
  - `getMetrics(projectId)` - GET latest metrics
  - `getMetricsHistory(projectId, days)` - GET historical data

**4. Health Score Calculator (Utility)**
- **File:** `server/src/utils/healthScoreCalculator.ts`
- **Function:** `calculateSecurityHealthScore(metrics)` - Calculates 0-5 health score
- **Used by:** Security Database Service during `saveMetrics()`

---

### SonarQube API Integration

**API Endpoints Used:**
- `GET /api/measures/component` - Main endpoint for metrics
- `GET /api/issues/search` - For detailed vulnerability counts by severity

**Metric Keys Requested:**
- `security_rating` - Security rating (A-E)
- `vulnerabilities` - Total vulnerability count
- `security_hotspots` - Total hotspots count
- `security_hotspots_reviewed` - % of hotspots reviewed
- `security_review_rating` - Security review rating (A-E)

**Issue Search Parameters:**
- `componentKeys` - Project key
- `types` - VULNERABILITY
- `severities` - HIGH or BLOCKER
- `resolved` - false (only open vulnerabilities)

---

### Controller & Routes

**Controller File:** `server/src/controllers/sonarQubeSecurityController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh security metrics (recalculate from SonarQube)
POST /api/projects/:id/sonarqube-security/refresh
├── Calls: sonarSecuritySyncService.syncSecurityMetrics(projectId, sonarKey)
├── Returns: Latest metrics object with all fields
└── Response Time: 1-2 seconds

// Get latest security metrics
GET /api/projects/:id/sonarqube-security
├── Calls: sonarSecurityDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms

// Get historical data for charts
GET /api/projects/:id/sonarqube-security/history?days=30
├── Calls: sonarSecurityDbService.getMetricsHistory(projectId, days)
├── Returns: Array of daily snapshots
└── Response Time: <200ms
```

---

### Health Score Calculation

**Calculated by:** `calculateSecurityHealthScore()` in `server/src/utils/healthScoreCalculator.ts`

**Formula:**
```
Health Score = 
  Security Rating Score × 0.50 +
  Total Vulnerabilities Score × 0.30 +
  Security Hotspots Score × 0.20
```

**Component Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Rating** | A | B | C | D | E | - |
| **Total Vulnerabilities** | 0 | ≤3 | ≤10 | ≤20 | ≤40 | >40 |
| **Security Hotspots** | 0 | ≤5 | ≤15 | ≤30 | ≤50 | >50 |

---

### Frontend Component

**File:** `client/src/components/SonarSecurityCard.tsx`

**What It Displays:**
- Health score badge with color coding
- Security rating badge (A-E)
- Total vulnerabilities count
- High severity vulnerabilities count (highlighted if > 0)
- Blocker vulnerabilities count (critical alert if > 0)
- Security hotspots count
- Hotspots reviewed percentage
- Last updated timestamp

---

## Combined Health Score Dashboard

### Overview

The Combined Health Score Dashboard aggregates all 6 health metrics into a single view, providing:
- Historical trends for all metrics
- Quick comparison across categories
- Visual indicators of project health
- Time-series charts

### Controller & Routes

**Controller File:** `server/src/controllers/healthScoreController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Get health score history for all 6 metrics
GET /api/projects/:id/health-scores/history?days=30
├── Fetches from all 6 history tables
├── Returns time-series data for each metric
└── Response Time: <500ms

// Get latest health scores summary
GET /api/projects/:id/health-scores/summary
├── Fetches latest from all 6 history tables
├── Returns current health score for each metric
└── Response Time: <200ms
```

**Response Structure:**

```typescript
{
  issue: [
    { date: "2026-01-15", health_score: 4.2 },
    { date: "2026-01-14", health_score: 4.1 }
  ],
  mr: [...],
  commit: [...],
  maintainability: [...],
  reliability: [...],
  security: [...]
}
```

### Frontend Component

**File:** `client/src/components/HealthScoreTrendsCard.tsx`

**What It Displays:**
- Line chart with all 6 metrics
- Color-coded lines (one per metric)
- Time range selector (7d, 30d, 90d)
- Legend with current scores
- Overall health indicator

**Chart Colors:**
- Issue: Blue
- MR: Green
- Commit: Purple
- Maintainability: Orange
- Reliability: Red
- Security: Yellow

---

### Usage in Application

**Where It Appears:**
- Project Detail Page (`client/src/pages/ProjectDetail.tsx`)
- Dashboard Page (`client/src/pages/Dashboard.tsx`)
- Tracked Projects Page (`client/src/pages/TrackedProjects.tsx`)

**Complete Refresh Flow:**

```
1. User clicks "Refresh All Data" button

2. Frontend makes 6 parallel API calls:
   ├── POST /projects/:id/issue-metrics/refresh
   ├── POST /projects/:id/mr-metrics/refresh
   ├── POST /projects/:id/commit-metrics/refresh
   ├── POST /projects/:id/sonarqube-maintainability/refresh
   ├── POST /projects/:id/sonarqube-reliability/refresh
   └── POST /projects/:id/sonarqube-security/refresh

3. Each backend service:
   ├── Fetches data from API (GitLab or SonarQube)
   ├── Calculates all metrics
   ├── Computes health score (0-5)
   ├── Inserts into main metrics table
   ├── Inserts snapshot into history table
   └── Returns latest metrics to frontend

4. Frontend updates all 6 cards with new data

5. HealthScoreTrendsCard updates with new data points
```

**Total Time:** 5-15 seconds depending on project size and API response times

---

## Key Design Decisions

### Why INSERT-only for main tables?
- Preserves complete history of every calculation
- Allows time-travel debugging
- Frontend always fetches "latest by timestamp"
- No data loss from overwrites

### Why separate history tables?
- Optimized for trend charts (smaller, faster queries)
- One row per day per project (unique constraint)
- Stores only key metrics + health score

### Why sampling for some metrics?
- API rate limits (GitLab has 10 req/sec limit)
- Some APIs require one call per item (e.g., MR notes, issue state events)
- Sampling provides good approximation with less load
- 30-50 items is statistically significant

### Why 0-5 scale for health scores?
- Easy to understand (like star ratings)
- Maps well to letter grades (A=5, B=4, C=3, D=2, F=1-0)
- Allows for weighted combinations
- Visual indicators work well (colors, badges)

### Why different data limits for different metrics?
- Issues: Up to 10,000 (projects can have thousands of issues)
- MRs: Up to 500 (MRs are less common than issues)
- Commits: Up to 100 (only last 7 days, fast refresh)
- SonarQube: No limits (single API call returns all metrics)

---

## Troubleshooting

### Common Issues

**Issue:** Metrics not updating after refresh  
**Solution:** Check browser console for API errors. Verify GitLab/SonarQube credentials.

**Issue:** Health score is 0  
**Solution:** Check if project has sufficient data (commits, issues, MRs). New projects may have limited metrics.

**Issue:** SonarQube metrics missing  
**Solution:** Verify `sonar_project_key` is correctly set in projects table. Check SonarQube project exists and has analysis data.

**Issue:** Slow refresh times  
**Solution:** This is normal for large projects. Issue metrics with 10,000+ issues can take 10-30 seconds.

**Issue:** Sampling metrics seem inaccurate  
**Solution:** Increase sample sizes in sync services (currently 30-50). Trade-off: longer refresh times.

**Issue:** GitLab API rate limit errors  
**Solution:** Reduce concurrent requests or implement rate limiting. Current limit: 10 req/sec.

**Issue:** SonarQube authentication failed  
**Solution:** Verify SONARQUBE_TOKEN environment variable is set and valid.

---

## Future Enhancements

- **Automated refresh scheduling** (background jobs with cron)
- **Real-time alerts** for RED_ALERT conditions via email/Slack
- **Custom thresholds** per project (allow teams to set their own targets)
- **Metric comparisons** across projects (benchmarking)
- **Export to PDF/CSV** for reporting
- **Webhook integration** for auto-refresh on GitLab events (push, MR merge, etc.)
- **Predictive analytics** using historical trends
- **Team performance metrics** (per developer/team)
- **Integration with Jira** for enhanced issue tracking
- **Custom metrics** (allow teams to define their own)

---

### Issue Metrics Calculation Flow
   ├── Get issue counts (opened/closed) using headers (fast)
   ├── Fetch closed issues from last 7d & 30d (up to 10,000)
   ├── Fetch opened issues from last 7d & 30d (up to 10,000)
   ├── Fetch issues by labels (bug, feature, critical, blocker)
   └── Fetch open issues for stale detection (up to 10,000)

2. Calculate Metrics
   ├── Velocity: Count closed issues in 7d & 30d
   ├── Cycle Time: (closed_at - created_at) for all closed issues
   ├── Reopen Rate: Sample 50 closed issues, check state events
   ├── Bug Ratio: bug_count / (bug_count + feature_count) * 100
   ├── Stale Issues: Count open issues with updated_at >60 days
   ├── Critical Issues: Count open issues with priority labels
   └── MR Link Rate: Sample 30 closed issues, check for MR references

3. Calculate Health Score (0-5)
   └── Weighted formula based on 4 key metrics

4. Save to Database
   ├── Insert into issue_health_metrics table
   └── Insert snapshot into issue_metrics_history table
```

**Data Sources:**
- GitLab REST API (`/projects/:id/issues`)
- Pagination support (up to 10,000 issues per query)
- Date filters using `created_after` and `closed_at`

**Sampling Strategy:**
- Most metrics use ALL available data (no sampling)
- Reopen rate: Sample 50 closed issues (API intensive)
- MR link rate: Sample 30 closed issues (API intensive)

---

### MR Metrics Calculation Flow

```
1. Fetch Data from GitLab API
   ├── Get MR counts (opened/merged) using headers (fast)
   ├── Fetch open MRs (up to 500)
   ├── Fetch merged MRs from last 7d (up to 500)
   ├── Fetch merged MRs from last 30d (up to 500)
   └── Fetch opened MRs from last 7d & 30d (up to 500 each)

2. Calculate Metrics (using last 30d merged MRs for sampling)
   ├── Merge Velocity: Count merged MRs in 7d & 30d
   ├── Merge Time: (merged_at - created_at) for all merged MRs
   ├── Review Comments: Sample 50 MRs, fetch notes/discussions
   ├── Revert Rate: Sample 50 MRs, check for revert patterns
   ├── Stale MRs: Count open MRs with updated_at >14 days
   └── Reviewers per MR: Sample 50 MRs, count reviewers field

3. Calculate Health Score (0-5)
   └── Weighted formula based on 4 key metrics

4. Save to Database
   ├── Insert into mr_health_metrics table
   └── Insert snapshot into mr_metrics_history table
```

**Data Sources:**
- GitLab REST API (`/projects/:id/merge_requests`)
- Up to 500 MRs per query
- Date filters using `created_after` and `updated_after`

**Sampling Strategy:**
- Fetch limits: 500 for merged, 500 for open
- Review comments: Sample 50 MRs from last 30 days
- Revert rate: Sample 50 MRs from last 30 days
- Reviewers: Sample 50 MRs from last 30 days

---

### Commit Metrics Calculation Flow

```
1. Fetch Data from GitLab API
   ├── Get commit count from last 7d using headers (fast)
   └── Fetch commits from last 7d with stats (up to 100)

2. Calculate Metrics
   ├── Commit Frequency: Total commits in last 7 days
   ├── Avg Commit Size: (additions + deletions) / commit_count
   ├── Lines Ratio: lines_added / lines_deleted
   └── Bus Factor: Count contributors with >50% of commits

3. Calculate Health Score (0-5)
   └── Weighted formula based on 3 key metrics

4. Save to Database
   ├── Insert into commit_health_metrics table
   ├── Store commit details (limit 100 for storage)
   └── Insert snapshot into commit_metrics_history table
```

**Data Sources:**
- GitLab REST API (`/projects/:id/repository/commits`)
- Up to 100 commits with full stats
- Date filter: last 7 days only

**Data Collection:**
- Analyzes ALL commits from last 7 days (up to 100)
- Extracts: SHA, title, message, author, timestamp
- Includes commit stats: additions, deletions

---

### SonarQube Metrics Calculation Flow

All three SonarQube metrics follow the same pattern:

```
1. Fetch Data from SonarQube API
   ├── Call /api/measures/component endpoint
   ├── Request specific metric keys for each category
   └── Parse response data

2. Extract Metrics
   ├── Maintainability: rating, debt_ratio, code_smells, duplication
   ├── Reliability: rating, total_bugs, high_bugs, blocker_bugs
   └── Security: rating, vulnerabilities, hotspots, hotspots_reviewed

3. Calculate Health Score (0-5)
   └── Weighted formula based on category-specific metrics

4. Save to Database
   ├── Insert into respective metrics table
   └── Insert snapshot into respective history table
```

**Data Sources:**
- SonarQube REST API (`/api/measures/component`)
- Project-specific metrics using `sonar_project_key`
- Real-time data (no historical API access)

**Metric Keys:**
- **Maintainability:** `sqale_rating`, `sqale_debt_ratio`, `code_smells`, `duplicated_lines_density`
- **Reliability:** `reliability_rating`, `bugs`, severity-filtered issue counts
- **Security:** `security_rating`, `vulnerabilities`, `security_hotspots`, `security_hotspots_reviewed`

---

## Database Architecture

### Table Structure Overview

Each health metric has **two tables**:
1. **Main Metrics Table** - Current and historical calculations (all refreshes)
2. **History Table** - Daily snapshots for trend analysis

### 1. Issue Health Metrics Tables

#### `issue_health_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only, never UPDATE)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Basic Counts
total_open_issues, total_closed_issues

-- Tier 1 Metrics
issues_closed_last_7d, issues_closed_last_30d
avg_cycle_time_hours, avg_cycle_time_days
reopen_rate_percent (sample: 50 issues)
bug_ratio_percent

-- Tier 2 Metrics
issues_opened_last_7d, issues_opened_last_30d
stale_issues_count (>60 days no activity)
critical_issues_open, blocker_issues_open
issue_mr_link_rate_percent (sample: 30 issues)

-- Alert Levels
velocity_alert_level, cycle_time_alert_level
reopen_rate_alert_level, bug_ratio_alert_level

-- Metadata
calculated_at (timestamp)
```

#### `issue_metrics_history`
**Purpose:** Daily snapshots for trend charts  
**Unique Constraint:** One row per project per day

**Key Columns:**
```sql
uuid, row_id, project_id
total_open_issues, issues_closed_last_7d
avg_cycle_time_days, reopen_rate_percent
bug_ratio_percent, stale_issues_count
health_score (0-5)
snapshot_date (unique per project)
```

---

### 2. MR Health Metrics Tables

#### `mr_health_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Basic Counts
total_open_mrs, total_merged_mrs

-- Tier 1 Metrics
mrs_merged_last_7d, mrs_merged_last_30d
avg_merge_time_hours, avg_merge_time_days
avg_review_comments_per_mr (sample: 50 MRs)
revert_rate_percent (sample: 50 MRs)

-- Tier 2 Metrics
mrs_opened_last_7d, mrs_opened_last_30d
stale_mrs_count (>14 days no activity)
avg_reviewers_per_mr (sample: 50 MRs)

-- Alert Levels
merge_velocity_alert_level, merge_time_alert_level
revert_rate_alert_level, stale_mrs_alert_level

-- Metadata
calculated_at (timestamp)
```

#### `mr_metrics_history`
**Purpose:**  snapshots for trend charts  

**Key Columns:**
```sql
uuid, row_id, project_id
total_open_mrs, mrs_merged_last_7d
avg_merge_time_days, revert_rate_percent
stale_mrs_count, avg_reviewers_per_mr
health_score (0-5)
snapshot_date (unique per project)
```

---

### 3. Commit Health Metrics Tables

#### `commit_health_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Metrics
total_commits_last_7d
avg_commit_size (lines changed per commit)
total_lines_added, total_lines_deleted
lines_added_deleted_ratio
commits_per_week
total_contributors, bus_factor

-- Metadata
calculated_at (timestamp)
commit_details (JSONB - up to 100 commits)
```

#### `commit_metrics_history`
**Purpose:**  snapshots for trend charts  

**Key Columns:**
```sql
uuid, row_id, project_id
total_commits_last_7d, avg_commit_size
total_lines_added, total_lines_deleted
bus_factor, health_score (0-5)
snapshot_date (unique per project)
```

---

### 4. SonarQube Maintainability Tables

#### `sonarqube_maintainability_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Metrics
maintainability_rating (A-E)
technical_debt_minutes, technical_debt_ratio
code_smells_total, code_smells_high, code_smells_blocker
duplicated_lines, duplicated_code_percentage

-- Metadata
calculated_at (timestamp)
```

#### `sonarqube_maintainability_history`
**Purpose:**  snapshots for trend charts  


---

### 5. SonarQube Reliability Tables

#### `sonarqube_reliability_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Metrics
reliability_rating (A-E)
bugs_total, bugs_high, bugs_blocker

-- Metadata
calculated_at (timestamp)
```

#### `sonarqube_reliability_history`
**Purpose:**  snapshots for trend charts  
**Unique Constraint:** One row per project per day

---

### 6. SonarQube Security Tables

#### `sonarqube_security_metrics`
**Purpose:** Stores every calculation (complete history)  
**Updated:** On "Refresh Data" button click (INSERT only)

**Key Columns:**
```sql
-- Identifiers
uuid, row_id, project_id

-- Metrics
security_rating (A-E)
vulnerabilities_total, vulnerabilities_high, vulnerabilities_blocker
security_hotspots, security_hotspots_reviewed
security_review_rating (A-E)

-- Metadata
calculated_at (timestamp)
```

#### `sonarqube_security_history`
**Purpose:** snapshots for trend charts  


---

## Code Structure

### Service Layer Architecture

Each health metric follows a **3-service pattern**:

```
1. Sync Service (Orchestrator)
   └── Coordinates the entire refresh process

2. Calculation Service (Business Logic)
   └── Computes all metrics from raw data

3. Database Service (Data Access)
   └── Handles database operations
```

### Example: Issue Metrics Services

#### 1. Issue Metrics Sync Service
**File:** `server/src/services/issueMetrics/issueMetricsSyncService.ts`

**Responsibilities:**
- Main entry point for refreshing issue metrics
- Fetches data from GitLab API
- Calls calculation service
- Saves results via database service

**Key Methods:**
- `syncIssueMetrics(projectId)` - Main orchestrator
- `fetchGitLabData(projectId)` - Fetch all required data
- `calculateReopenRate(projectId, sample)` - Sample 50 issues
- `calculateMRLinkRate(projectId, sample)` - Sample 30 issues

#### 2. Issue Metrics Calculation Service
**File:** `server/src/services/issueMetrics/issueMetricsCalculationService.ts`

**Responsibilities:**
- Pure calculation logic (no API calls)
- Takes raw data as input
- Returns calculated metrics object

**Key Methods:**
- `calculateMetrics(...)` - Main calculation function
- `calculateCycleTime(closedIssues)` - Avg time to close
- `calculateReopenRate(...)` - Reopen percentage
- `calculateBugRatio(...)` - Bug vs feature ratio
- `calculateStaleness(openIssues)` - Stale issue count

#### 3. Issue Metrics Database Service
**File:** `server/src/services/issueMetrics/issueMetricsDbService.ts`

**Responsibilities:**
- All database operations
- INSERT metrics into tables
- Fetch metrics for display
- Historical snapshots

**Key Methods:**
- `saveMetrics(projectId, metrics)` - Insert + calculate health score
- `saveHistoricalSnapshot(projectId)` - Daily snapshot
- `getMetrics(projectId)` - Get latest metrics
- `getWeekOverWeekTrends(projectId)` - Week-over-week comparison
- `getMetricsHistory(projectId, days)` - Historical data

---

### GitLab API Services

**File:** `server/src/services/gitlab/`

Each service handles a specific GitLab resource:

#### `gitLabIssueService.ts`
- `getIssueCount()` - Fast count using headers
- `getClosedIssues(projectId, closedAfter, maxResults)` - Paginated
- `getOpenedIssues(projectId, createdAfter, maxResults)` - Paginated
- `getOpenIssues(projectId, maxResults)` - For stale detection
- `getIssuesByLabel(projectId, labels)` - Bug/feature/critical

#### `gitLabMRService.ts`
- `getMRCount(projectId, state)` - Fast count using headers
- `getOpenMRs(projectId, perPage)` - Up to 500
- `getMergedMRs(projectId, mergedAfter, perPage)` - Up to 500
- `getOpenedMRs(projectId, createdAfter, perPage)` - Up to 500
- `getMRNotes(projectId, mrIid)` - For comments calculation
- `getMRReviewers(projectId, mrIid)` - For reviewer calculation

#### `gitLabCommitService.ts`
- `getCommitCount(projectId, since)` - Fast count using headers
- `getCommits(projectId, since, perPage)` - Up to 100 with stats

---

### SonarQube API Services

**File:** `server/src/services/sonar*/`

Each service handles a specific SonarQube category:

#### `sonarMaintainabilityApiService.ts`
- `getMaintainabilityMetrics(projectKey)` - Fetch all maintainability metrics
- Uses `/api/measures/component` endpoint
- Metric keys: `sqale_rating`, `sqale_debt_ratio`, `code_smells`, `duplicated_lines_density`

#### `sonarReliabilityApiService.ts`
- `getReliabilityMetrics(projectKey)` - Fetch all reliability metrics
- Uses `/api/measures/component` endpoint
- Metric keys: `reliability_rating`, `bugs`

#### `sonarSecurityApiService.ts`
- `getSecurityMetrics(projectKey)` - Fetch all security metrics
- Uses `/api/measures/component` endpoint
- Metric keys: `security_rating`, `vulnerabilities`, `security_hotspots`, etc.

---

### Controllers

**File:** `server/src/controllers/`

Each metric has a dedicated controller for HTTP endpoints:

#### `issueMetricsController.ts`
- `refreshIssueMetrics()` - POST /projects/:id/issue-metrics/refresh
- `getIssueMetrics()` - GET /projects/:id/issue-metrics
- `getIssueMetricsTrends()` - GET /projects/:id/issue-metrics/trends
- `getIssueMetricsHistory()` - GET /projects/:id/issue-metrics/history?days=30

#### `mrMetricsController.ts`
- Similar structure to issue metrics controller

#### `commitMetricsController.ts`
- Similar structure to issue metrics controller

#### `sonarQubeMaintainabilityController.ts`
- Similar structure to issue metrics controller

#### `sonarQubeReliabilityController.ts`
- Similar structure to issue metrics controller

#### `sonarQubeSecurityController.ts`
- Similar structure to issue metrics controller

#### `healthScoreController.ts`
**Special controller for combined health scores**
- `getHealthScoreHistory()` - GET /projects/:id/health-scores/history
- `getHealthScoreSummary()` - GET /projects/:id/health-scores/summary
- Fetches data from all 6 history tables
- Returns combined health scores for dashboard

---

## API Endpoints

### Issue Metrics Endpoints

```http
# Refresh issue metrics (recalculate from GitLab API)
POST /api/projects/:id/issue-metrics/refresh
Response: Latest metrics object

# Get latest issue metrics
GET /api/projects/:id/issue-metrics
Response: Latest metrics object with all fields

# Get week-over-week trends
GET /api/projects/:id/issue-metrics/trends
Response: {
  current: { metrics... },
  previous: { metrics... },
  changes: { field: percentageChange }
}

# Get historical data
GET /api/projects/:id/issue-metrics/history?days=30
Response: Array of daily snapshots
```

---

### MR Metrics Endpoints

```http
# Refresh MR metrics (recalculate from GitLab API)
POST /api/projects/:id/mr-metrics/refresh
Response: Latest metrics object

# Get latest MR metrics
GET /api/projects/:id/mr-metrics
Response: Latest metrics object

# Get week-over-week trends
GET /api/projects/:id/mr-metrics/trends
Response: {
  current: { metrics... },
  previous: { metrics... },
  changes: { field: percentageChange }
}

# Get historical data
GET /api/projects/:id/mr-metrics/history?days=30
Response: Array of daily snapshots
```

---

### Commit Metrics Endpoints

```http
# Refresh commit metrics (recalculate from GitLab API)
POST /api/projects/:id/commit-metrics/refresh
Response: Latest metrics object

# Get latest commit metrics
GET /api/projects/:id/commit-metrics
Response: Latest metrics object

# Get historical data
GET /api/projects/:id/commit-metrics/history?days=30
Response: Array of daily snapshots
```

---

### SonarQube Metrics Endpoints

```http
# Maintainability
POST /api/projects/:id/sonarqube-maintainability/refresh
GET /api/projects/:id/sonarqube-maintainability
GET /api/projects/:id/sonarqube-maintainability/history?days=30

# Reliability
POST /api/projects/:id/sonarqube-reliability/refresh
GET /api/projects/:id/sonarqube-reliability
GET /api/projects/:id/sonarqube-reliability/history?days=30

# Security
POST /api/projects/:id/sonarqube-security/refresh
GET /api/projects/:id/sonarqube-security
GET /api/projects/:id/sonarqube-security/history?days=30
```

---

### Combined Health Score Endpoints

```http
# Get health score history for all 6 metrics
GET /api/projects/:id/health-scores/history?days=30
Response: {
  issue: [{ date, health_score }],
  mr: [{ date, health_score }],
  commit: [{ date, health_score }],
  maintainability: [{ date, health_score }],
  reliability: [{ date, health_score }],
  security: [{ date, health_score }]
}

# Get latest health scores summary
GET /api/projects/:id/health-scores/summary
Response: {
  issue: { health_score, calculated_at },
  mr: { health_score, calculated_at },
  commit: { health_score, calculated_at },
  maintainability: { health_score, calculated_at },
  reliability: { health_score, calculated_at },
  security: { health_score, calculated_at }
}
```

---

## Data Limits & Sampling

### Issue Metrics
**Data Collection:**
- Open issues: Up to 10,000
- Closed issues (7d): Up to 10,000
- Closed issues (30d): Up to 10,000
- Opened issues (7d): Up to 10,000
- Opened issues (30d): Up to 10,000

**Sampling:**
- Reopen rate: Sample 50 closed issues (requires state events API)
- MR link rate: Sample 30 closed issues (requires MR reference lookup)
- All other metrics: No sampling (uses all available data)

---

### MR Metrics
**Data Collection:**
- Open MRs: Up to 500
- Merged MRs (7d): Up to 500
- Merged MRs (30d): Up to 500
- Opened MRs (7d): Up to 500
- Opened MRs (30d): Up to 500

**Sampling (all use merged MRs from last 30 days):**
- Review comments: Sample 50 MRs (requires notes API per MR)
- Revert rate: Sample 50 MRs (checks title/description/labels)
- Reviewers per MR: Sample 50 MRs (requires reviewers field)
- All other metrics: No sampling (uses all fetched data)

---

### Commit Metrics
**Data Collection:**
- Commits (7d): Up to 100 with full stats
- Commit details stored: Up to 100 (limit for database storage)

**Sampling:**
- No sampling - analyzes all commits from last 7 days (up to 100)

---

### SonarQube Metrics
**Data Collection:**
- All metrics fetched in single API call
- No historical data (SonarQube only provides current state)
- No pagination or limits

**Sampling:**
- No sampling - gets all current metrics

---

## Health Score Calculation

### Formula Structure

All health scores use a **weighted formula** on a 0-5 scale:

```
Health Score = (Factor1 × Weight1) + (Factor2 × Weight2) + ...
```

Each factor is scored 0-5 based on thresholds, then multiplied by its weight.

---

### Issue Health Score (0-5)

**Formula:**
```
Health Score = 
  Cycle Time Score × 0.30 +
  Reopen Rate Score × 0.25 +
  Velocity Score × 0.25 +
  Critical Issues Score × 0.20
```

**Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Cycle Time** | <1 day | <3 days | <7 days | <14 days | <30 days | ≥30 days |
| **Reopen Rate** | <5% | <10% | <20% | <30% | <50% | ≥50% |
| **Velocity (7d)** | >20 | ≥10 | ≥5 | ≥2 | ≥1 | 0 |
| **Critical Issues** | 0 | ≤2 | ≤5 | ≤10 | ≤20 | >20 |

---

### MR Health Score (0-5)

**Formula:**
```
Health Score = 
  Merge Time Score × 0.35 +
  Revert Rate Score × 0.25 +
  Velocity Score × 0.25 +
  Review Comments Score × 0.15
```

**Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Merge Time** | <1 day | <2 days | <5 days | <10 days | <20 days | ≥20 days |
| **Revert Rate** | <3% | <5% | <10% | <15% | <25% | ≥25% |
| **Velocity (7d)** | >15 | ≥10 | ≥5 | ≥2 | ≥1 | 0 |
| **Review Comments** | ≥10 | ≥5 | ≥2 | ≥1 | >0 | 0 |

---

### Commit Health Score (0-5)

**Formula:**
```
Health Score = 
  Commit Frequency Score × 0.40 +
  Commit Size Score × 0.30 +
  Bus Factor Score × 0.30
```

**Thresholds:**

| Factor | Score 5 | Score 4 | Score 3 | Score 2 | Score 1 | Score 0 |
|--------|---------|---------|---------|---------|---------|---------|
| **Frequency (7d)** | >50 | ≥25 | ≥10 | ≥5 | ≥1 | 0 |
| **Commit Size** | <200 lines | <500 lines | <1000 lines | <2000 lines | <5000 lines | ≥5000 lines |
| **Bus Factor** | ≥5 | ≥3 | ≥2 | 1 | 1 | 0 |

---

### SonarQube Health Scores (0-5)

All SonarQube metrics convert letter grades to numeric scores:

**Rating Conversion:**
- A → 5.0
- B → 4.0
- C → 3.0
- D → 2.0
- E → 1.0

Then apply category-specific thresholds for other factors.

**Maintainability Formula:**
```
Health Score = 
  Rating Score × 0.40 +
  Debt Ratio Score × 0.30 +
  Code Smells Score × 0.20 +
  Duplication Score × 0.10
```

**Reliability Formula:**
```
Health Score = 
  Rating Score × 0.50 +
  Total Bugs Score × 0.30 +
  Critical Bugs Score × 0.10 +
  Blocker Bugs Score × 0.10
```

**Security Formula:**
```
Health Score = 
  Rating Score × 0.40 +
  Total Vulnerabilities Score × 0.30 +
  Critical Vulnerabilities Score × 0.15 +
  Blocker Vulnerabilities Score × 0.15
```

---

## Frontend Components

### Health Metric Cards

**Files:** `client/src/components/`

Each metric has a dedicated card component:

#### `IssueMetricsCard.tsx`
- Displays latest issue metrics
- Shows health score badge
- Lists all key metrics with icons
- Alert indicators (NORMAL/WARNING/RED_ALERT)

#### `MRMetricsCard.tsx`
- Displays latest MR metrics
- Shows health score badge
- Lists all key metrics with icons
- Alert indicators

#### `CommitMetricsCard.tsx`
- Displays latest commit metrics
- Shows health score badge
- Lists commit frequency, size, bus factor

#### `SonarMaintainabilityCard.tsx`
- Displays maintainability rating
- Shows technical debt and code smells
- Letter grade badge (A-E)

#### `SonarReliabilityCard.tsx`
- Displays reliability rating
- Shows bug counts by severity
- Letter grade badge (A-E)

#### `SonarSecurityCard.tsx`
- Displays security rating
- Shows vulnerabilities and hotspots
- Letter grade badge (A-E)

---

### Health Score Dashboard

**File:** `client/src/components/HealthScoreTrendsCard.tsx`

**Features:**
- Displays all 6 health scores in one view
- Line chart showing trends over time
- Color-coded scores (red < 2, yellow < 3.5, green ≥ 3.5)
- Fetches from `/projects/:id/health-scores/history`

---

### Usage in Pages

**File:** `client/src/pages/ProjectDetail.tsx`

The project detail page displays all 6 metric cards:

```tsx
<DoraMetricsOverviewCard /> // Combined DORA metrics
<HealthScoreTrendsCard />   // All 6 health scores chart
<IssueMetricsCard />
<MRMetricsCard />
<CommitMetricsCard />
<SonarMaintainabilityCard />
<SonarReliabilityCard />
<SonarSecurityCard />
```

Each card:
1. Fetches latest metrics on mount
2. Shows loading state
3. Displays data with visual indicators
4. Includes "Refresh" button to recalculate

---

## Workflow Summary

### Complete Refresh Flow

```
1. User clicks "Refresh Data" button on ProjectDetail page

2. Frontend makes 6 parallel API calls:
   ├── POST /projects/:id/issue-metrics/refresh
   ├── POST /projects/:id/mr-metrics/refresh
   ├── POST /projects/:id/commit-metrics/refresh
   ├── POST /projects/:id/sonarqube-maintainability/refresh
   ├── POST /projects/:id/sonarqube-reliability/refresh
   └── POST /projects/:id/sonarqube-security/refresh

3. Each backend service:
   ├── Fetches data from API (GitLab or SonarQube)
   ├── Calculates all metrics
   ├── Computes health score (0-5)
   ├── Inserts into main metrics table
   ├── Inserts snapshot into history table
   └── Returns latest metrics to frontend

4. Frontend updates all 6 cards with new data

5. HealthScoreTrendsCard updates with new data point
```

**Total Time:** ~5-15 seconds depending on project size and API response times

---

## Key Design Decisions

### Why INSERT-only for main tables?
- Preserves complete history of every calculation
- Allows time-travel debugging
- Frontend always fetches "latest by timestamp"
- No data loss from overwrites

### Why separate history tables?
- Optimized for trend charts (smaller, faster queries)
- One row per day per project (unique constraint)
- Reduces data duplication for common queries

### Why sampling for some metrics?
- API rate limits (GitLab has 10 req/sec limit)
- Some APIs require one call per item (e.g., MR notes)
- Sampling provides good approximation with less load
- 30-50 items is statistically significant

### Why 0-5 scale for health scores?
- Easy to understand (like star ratings)
- Maps well to letter grades (A=5, B=4, C=3, D=2, F=1-0)
- Allows for weighted combinations
- Visual indicators work well (colors, badges)

---

## Milestone Metrics

> **Note:** Milestone Metrics are currently **not integrated** into the health score calculation. This feature tracks milestone workload distribution but does not yet contribute to the overall project health score.

### What It Tracks

Milestone Metrics analyze how issues are distributed across active (non-expired) milestones in a project. It focuses on:
- **Workload Distribution** - How evenly or unevenly issues are distributed
- **Milestone Coverage** - Number of active milestones with issues
- **Issue Concentration** - Whether work is concentrated in few milestones or spread across many

### Metrics Breakdown

**Core Metrics:**
1. **Max Issues** - Maximum number of issues in a single milestone
2. **Min Issues** - Minimum number of issues in a single milestone
3. **Avg Issues** - Average number of issues across all milestones
4. **Total Milestones** - Count of active, non-expired milestones

**Additional Context:**
- **Milestone with Max Issues** - Name of the milestone with the most issues
- **Milestone with Min Issues** - Name of the milestone with the fewest issues

### Database Schema

#### Table: `milestone_metrics`

**Purpose:** Stores every calculation of milestone metrics (complete history). Each refresh creates a NEW row - never updates existing rows.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | UUID | Primary key - unique identifier for this calculation |
| `row_id` | SERIAL | Auto-incrementing row number for ordering |
| `project_id` | INTEGER | Foreign key to `projects.id` - which project these metrics belong to |
| **Issue Count Metrics** | | |
| `max_issues` | INTEGER | Maximum number of issues in any single active milestone |
| `min_issues` | INTEGER | Minimum number of issues in any single active milestone |
| `avg_issues` | FLOAT | Average number of issues across all active milestones |
| `total_milestones` | INTEGER | Total count of active, non-expired milestones |
| **Context Fields** | | |
| `milestone_with_max_issues` | TEXT | Name of the milestone containing the most issues |
| `milestone_with_min_issues` | TEXT | Name of the milestone containing the fewest issues |
| **Metadata** | | |
| `calculated_at` | TIMESTAMP | When this calculation was performed |

**Indexes:**
- `idx_milestone_metrics_project_id` - Fast lookups by project
- `idx_milestone_metrics_calculated_at` - Fast lookups by time

**Important Notes:**
- Only counts **active** milestones (state = 'active')
- Only counts **non-expired** milestones (due_date is null or in the future)
- Each milestone's issue count includes ALL issues (open + closed) within that milestone
- Multiple historical snapshots allowed per project (no unique constraint)

---

### Code Structure

#### Service Layer (3-Service Pattern)

**1. Milestone Metrics Sync Service**
- **File:** `server/src/services/milestoneMetrics/milestoneMetricsSyncService.ts`
- **Role:** Orchestrator - coordinates the entire refresh process
- **Key Methods:**
  - `syncMilestoneMetrics(projectId)` - Main entry point, returns saved metrics
  - `fetchIssueCounts(projectId, milestones)` - Fetches issue counts for each milestone using pagination

**2. Milestone Metrics Calculation Service**
- **File:** `server/src/services/milestoneMetrics/milestoneMetricsCalculationService.ts`
- **Role:** Pure calculation logic - no API calls, no database operations
- **Key Methods:**
  - `calculateMetrics(milestonesWithCounts)` - Main calculation function
  - Determines max, min, and average issue counts
  - Identifies which milestones have max/min issues

**3. Milestone Metrics Database Service**
- **File:** `server/src/services/milestoneMetrics/milestoneMetricsDbService.ts`
- **Role:** All database operations
- **Key Methods:**
  - `saveMetrics(projectId, metrics)` - INSERT into `milestone_metrics`
  - `getMetrics(projectId)` - GET latest metrics for a project

**Note:** Currently, there is **no history table** or health score calculation for milestone metrics.

---

### GitLab API Integration

**Service File:** `server/src/services/gitlab/gitlabMilestoneService.ts`

**API Endpoints Used:**
- `GET /projects/:id/milestones` - Fetches all milestones
- `GET /projects/:id/milestones/:milestone_id/issues` - Fetches issues for a specific milestone

**Key Methods:**

| Method | Purpose | Filters Applied |
|--------|---------|-----------------|
| `getProjectMilestones(projectId)` | Get all active, non-expired milestones | state='active', due_date≥today or null |
| Inline issue fetching | Get all issues for each milestone | Pagination with per_page=100 |

**Data Flow:**
1. Fetch all active milestones for the project
2. Filter out expired milestones (due_date < today)
3. For each milestone:
   - Fetch all issues using pagination (up to 100 per page)
   - Continue until all pages are retrieved
   - Count total issues per milestone
4. Return array of milestones with issue counts

**API Call Optimization:**
- Parallel fetching not used (sequential per milestone)
- Pagination handles large issue counts per milestone
- Only active, non-expired milestones are processed

---

### Controller & Routes

**Controller File:** `server/src/controllers/milestoneMetricsController.ts`

**Routes (defined in `server/src/routes/index.ts`):**

```typescript
// Refresh milestone metrics (recalculate from GitLab)
POST /api/projects/:id/milestone-metrics/refresh
├── Calls: milestoneMetricsSyncService.syncMilestoneMetrics(projectId)
├── Returns: Latest metrics object with all fields
└── Response Time: 2-8 seconds depending on number of milestones and issues

// Get latest milestone metrics
GET /api/projects/:id/milestone-metrics
├── Calls: milestoneMetricsDbService.getMetrics(projectId)
├── Returns: Latest metrics from database
└── Response Time: <100ms
```

**Controller Methods:**

```typescript
// POST /projects/:id/milestone-metrics/refresh
refreshMilestoneMetrics(req, res)
├── Validates project ID
├── Calls syncMilestoneMetrics(projectId)
├── Returns saved metrics
└── Error handling with 500 response

// GET /projects/:id/milestone-metrics
getMilestoneMetrics(req, res)
├── Validates project ID
├── Fetches latest metrics from DB
├── Returns metrics or 404 if none found
└── Error handling with 500 response
```

---

### Data Collection Flow

```
Step 1: Fetch Active Milestones
└── gitlabMilestoneService.getProjectMilestones(projectId)
    ├── Calls /projects/:id/milestones?state=active
    ├── Filters out expired milestones (due_date < today)
    └── Returns array of active, non-expired milestones

Step 2: Fetch Issue Counts for Each Milestone (Sequential)
├── For each milestone:
│   ├── Call /projects/:id/milestones/:milestone_id/issues
│   ├── Use pagination (per_page=100)
│   ├── Fetch all pages until complete
│   └── Count total issues for this milestone
└── Returns array: [{ id, title, issue_count, due_date }, ...]

Step 3: Calculate Metrics
├── Find milestone with max issues
├── Find milestone with min issues
├── Calculate average: sum(issue_counts) / total_milestones
└── Store milestone names with max/min

Step 4: Save to Database
└── INSERT into milestone_metrics (all fields)
```

**Special Cases:**
- If no active milestones exist, returns empty metrics (all values = 0)
- If only one milestone exists, max = min = avg
- Milestones with 0 issues are included in calculations

---

### Frontend Component

**File:** `client/src/components/MilestoneMetricsCard.tsx`

**What It Displays:**
- Total active milestones count
- Maximum issues in any milestone (with milestone name)
- Minimum issues in any milestone (with milestone name)
- Average issues per milestone
- Last updated timestamp

**Data Fetching:**
```typescript
// On component mount
useEffect(() => {
  fetch(`/api/projects/${projectId}/milestone-metrics`)
    .then(res => res.json())
    .then(data => setMetrics(data))
}, [projectId])
```

**Refresh Button:**
```typescript
const handleRefresh = async () => {
  setLoading(true)
  await fetch(`/api/projects/${projectId}/milestone-metrics/refresh`, {
    method: 'POST'
  })
  // Refetch latest metrics
  const response = await fetch(`/api/projects/${projectId}/milestone-metrics`)
  const data = await response.json()
  setMetrics(data)
  setLoading(false)
}
```

---

### Data Limits

**Collection Limits:**
- Active milestones: Unlimited (fetches all active, non-expired milestones)
- Issues per milestone: Unlimited (uses pagination to fetch all)

**No Sampling:**
- Analyzes ALL active milestones
- Counts ALL issues in each milestone
- No approximations or statistical sampling

**Performance Considerations:**
- Projects with many milestones (>50) may take longer to refresh
- Projects with milestones containing 1000+ issues may take longer
- Each milestone requires separate API calls to fetch issues

---

### Usage in Application

**Where It Appears:**
- Project Detail Page (`client/src/pages/ProjectDetail.tsx`)
- Displayed as a card alongside other metrics
- **Not yet integrated** into Combined Health Score Dashboard

**User Workflow:**
1. User navigates to project detail page
2. Milestone Metrics Card loads latest metrics from database
3. User can click "Refresh Data" to recalculate from GitLab
4. System fetches active milestones and their issue counts
5. Calculates max, min, avg, and stores milestone names
6. Card updates with new data

**Current Limitations:**
- No historical tracking (no history table yet)
- No health score calculation
- No trend analysis or week-over-week comparison
- No integration with combined health score

---

### Future Integration Plans

To fully integrate Milestone Metrics into the health system:

1. **Create `milestone_metrics_history` table**
   - Add columns: project_id, max_issues, min_issues, avg_issues, total_milestones, health_score, snapshot_date
   - Add unique constraint on (project_id, snapshot_date)

2. **Add Health Score Calculation**
   - Define scoring criteria (e.g., based on distribution, workload balance)
   - Add `calculateMilestoneHealthScore()` to `healthScoreCalculator.ts`
   - Integrate into database save operation

3. **Add to Combined Health Score**
   - Include milestone health score in overall project health
   - Add to `HealthScoreTrendsCard` visualization
   - Update combined score calculation weights

4. **Add Trend Analysis**
   - Implement `getWeekOverWeekTrends()` in database service
   - Add historical data fetching
   - Create trend charts in frontend

5. **Define Alert Levels**
   - Set thresholds for workload imbalance (e.g., max > 5x avg = WARNING)
   - Define acceptable ranges for avg issues per milestone
   - Add alert level indicators to card

---

## Troubleshooting

### Common Issues

**Issue:** Metrics not updating after refresh  
**Solution:** Check browser console for API errors. Verify GitLab/SonarQube credentials.

**Issue:** Health score is 0  
**Solution:** Check if project has sufficient data (commits, issues, MRs). New projects may have limited metrics.

**Issue:** SonarQube metrics missing  
**Solution:** Verify `sonar_project_key` is correctly set in projects table. Check SonarQube project exists.

**Issue:** Slow refresh times  
**Solution:** This is normal for large projects. Issue metrics with 10,000+ issues can take 10-30 seconds.

**Issue:** Sampling metrics seem inaccurate  
**Solution:** Increase sample sizes in sync services (currently 30-50). Trade-off: longer refresh times.

---

## Future Enhancements

- **Automated refresh scheduling** (background jobs)
- **Real-time alerts** for RED_ALERT conditions
- **Custom thresholds** per project
- **Metric comparisons** across projects
- **Export to PDF/CSV**
- **Webhook integration** for auto-refresh on GitLab events
