# DORA Metrics System

## Table of Contents
1. [Overview](#overview)
2. [What are DORA Metrics?](#what-are-dora-metrics)
3. [Current Implementation](#current-implementation)
4. [Manual Data Input](#manual-data-input)
5. [Database Structure](#database-structure)
6. [Calculation Engine](#calculation-engine)
7. [DORA Dashboard](#dora-dashboard)
8. [API Endpoints](#api-endpoints)
9. [Future Automation Plans](#future-automation-plans)

---

## Overview

The **DORA Metrics System** tracks the four key DevOps Research and Assessment (DORA) metrics that measure software delivery performance. Currently, the system requires **manual data entry** through web forms, but it provides comprehensive tracking, calculation, and visualization capabilities.

### Quick Facts
- **Manual Input Method**: Web forms for each metric type
- **4 Core Metrics**: Deployment Frequency, Lead Time, Change Failure Rate, Time to Restore
- **3 Time Granularities**: Weekly, Monthly, Yearly trends
- **Performance Ratings**: Elite, High, Medium, Low (based on DORA benchmarks)
- **Trend Analysis**: Automated comparison between current and previous periods

---

## What are DORA Metrics?

DORA metrics are industry-standard measurements of software delivery performance, based on research by the DevOps Research and Assessment team (now part of Google Cloud).

### The 4 Core Metrics

#### 1. **Deployment Frequency** 📊
**What it measures:** How often you deploy code to production

**Why it matters:** Higher deployment frequency indicates faster value delivery and shorter feedback loops

**DORA Performance Levels:**
- **Elite**: On-demand (multiple deploys per day)
- **High**: Between once per day and once per week
- **Medium**: Between once per week and once per month
- **Low**: Between once per month and once every six months

**In our system:**
- Tracks all deployments with timestamp, environment, and version
- Calculates deployments per day, week, and month
- Supports multiple environments (production, staging, etc.)

---

#### 2. **Lead Time for Changes** ⏱️
**What it measures:** Time from code commit/merge to production deployment

**Why it matters:** Shorter lead times indicate efficient delivery pipelines and faster time-to-market

**DORA Performance Levels:**
- **Elite**: Less than one hour
- **High**: Between one day and one week
- **Medium**: Between one month and six months
- **Low**: More than six months

**In our system:**
- Records when a change was merged and when it was deployed
- Automatically calculates lead time in hours
- Provides average, median, min, and max lead times

---

#### 3. **Change Failure Rate** ⚠️
**What it measures:** Percentage of deployments that cause failures in production

**Why it matters:** Lower failure rates indicate higher quality releases and better testing

**DORA Performance Levels:**
- **Elite**: 0-5%
- **High**: 6-10%
- **Medium**: 11-15%
- **Low**: 16-100%

**In our system:**
- Tracks whether each deployment had an incident
- Records remediation type (rollback, hotfix, emergency, none)
- Automatically marks as "failure" if has_incident AND remediation is rollback/hotfix/emergency
- Calculates failure percentage

---

#### 4. **Time to Restore Service** 🔧
**What it measures:** Time from incident detection to service restoration

**Why it matters:** Faster recovery times indicate better incident response and system resilience

**DORA Performance Levels:**
- **Elite**: Less than one hour
- **High**: Less than one day
- **Medium**: Between one day and one week
- **Low**: More than six months

**In our system:**
- Records incident start and end times
- Automatically calculates restore time in hours
- Supports incident descriptions for context

---

## Current Implementation

### How It Works

```
┌─────────────────────┐
│  Manual Data Entry  │
│   (Web Forms)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Endpoints      │
│  (Validation)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database Storage   │
│  (4 Tables)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Calculation Engine │
│  (Aggregation)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  DORA Dashboard     │
│  (Visualization)    │
└─────────────────────┘
```

### Current Limitations

**Manual Input Required:**
- Each metric must be entered manually through forms
- No automatic detection of deployments, merges, or incidents
- Requires team discipline to log all events consistently

**Why Manual Entry?**
- GitLab's API doesn't expose deployment information directly
- Deployment pipelines vary greatly between projects
- Incident tracking often happens in external tools (Jira, PagerDuty, etc.)
- Change tracking requires correlation between merges and deployments

---

## Manual Data Input

### Accessing the Input Forms

1. Navigate to any Tracked Projects page
2. Click the **"Input DORA Metrics"** button
3. Select which metric type you want to log
4. Fill out the form and submit

### Form Details

#### 1. Deployment Frequency Form

**Required Fields:**
- **Deployment ID** (string) - Unique identifier for this deployment (e.g., "deploy-2024-001", "release-v1.2.3")
- **Timestamp** (datetime) - When the deployment occurred

**Optional Fields:**
- **Version** (string) - Version number or tag (e.g., "v1.2.3", "2024.01.15")
- **Environment** (dropdown) - Defaults to "production", but supports other environments

**Example:**
```
Deployment ID: deploy-2024-01-15-001
Version: v2.3.5
Environment: production
Timestamp: 2024-01-15 14:30:00
```

**Best Practices:**
- Use consistent deployment ID format across your team
- Include version numbers for traceability
- Log immediately after deployment
- Only log production deployments for DORA metrics

---

#### 2. Lead Time for Changes Form

**Required Fields:**
- **Change ID** (string) - Identifier for the change (e.g., MR number, commit SHA)
- **Merged Timestamp** (datetime) - When the code was merged to main branch
- **Deployed Timestamp** (datetime) - When the code was deployed to production

**Validation:**
- Deployed timestamp must be after merged timestamp
- System automatically calculates lead time in hours

**Example:**
```
Change ID: MR-1234 (or commit-abc123)
Merged Timestamp: 2024-01-15 10:00:00
Deployed Timestamp: 2024-01-15 14:30:00
→ Lead Time: 4.5 hours
```

**Best Practices:**
- Use GitLab MR numbers as Change IDs for easy traceability
- Record the exact merge time from GitLab
- Link to corresponding deployment from Deployment Frequency form
- Log as soon as deployment is verified

---

#### 3. Change Failure Rate Form

**Required Fields:**
- **Deployment ID** (string) - Must match a deployment from Deployment Frequency form
- **Deployment Timestamp** (datetime) - When the deployment occurred
- **Has Incident** (boolean) - Did this deployment cause an incident?
- **Remediation Type** (dropdown) - How was it fixed?

**Remediation Types:**
- **none** - No incident or no remediation needed
- **rollback** - Reverted to previous version
- **hotfix** - Applied emergency fix
- **emergency** - Emergency patch deployment

**Failure Calculation:**
A deployment is marked as "failure" if:
- has_incident = true AND
- remediation_type is one of: rollback, hotfix, emergency

**Example (Success):**
```
Deployment ID: deploy-2024-01-15-001
Timestamp: 2024-01-15 14:30:00
Has Incident: false
Remediation Type: none
→ Not counted as failure
```

**Example (Failure):**
```
Deployment ID: deploy-2024-01-15-002
Timestamp: 2024-01-15 16:00:00
Has Incident: true
Remediation Type: rollback
→ Counted as failure
```

**Autocomplete Feature:**
The form includes deployment ID autocomplete:
- Start typing a deployment ID
- System searches recent deployments (last 90 days)
- Select from suggestions to auto-fill timestamp
- Reduces data entry errors

**Best Practices:**
- Log ALL deployments, even successful ones (has_incident = false)
- Be honest about incidents - metrics only improve with accurate data
- Document the remediation type for post-mortems
- Link to corresponding incident in Time to Restore form

---

#### 4. Time to Restore Service Form

**Required Fields:**
- **Incident ID** (string) - Unique identifier for the incident
- **Start Time** (datetime) - When the incident was detected/started
- **End Time** (datetime) - When service was fully restored
- **Description** (text, optional) - Brief description of the incident

**Validation:**
- End time must be after start time
- System automatically calculates restore time in hours

**Example:**
```
Incident ID: INC-2024-0042
Start Time: 2024-01-15 16:05:00
End Time: 2024-01-15 17:30:00
Description: Database connection pool exhausted causing 500 errors
→ Restore Time: 1.42 hours
```

**Best Practices:**
- Use consistent incident ID format (e.g., INC-YYYY-####)
- Record detection time, not when issue actually started
- End time = when service is fully restored, not when fix was deployed
- Include brief description for future reference
- Link to post-mortem documentation

---

### Data Validation

All forms include validation:
- **Required field checking** - Cannot submit with empty required fields
- **Timestamp ordering** - End times must be after start times
- **Format validation** - Dates must be valid
- **Success feedback** - Toast notifications on successful submission
- **Error handling** - Clear error messages on validation failures

---

## Database Structure

### Overview

DORA metrics use **4 separate tables** (one per metric type) plus **1 aggregation table** for trend snapshots.

### Schema Design Principles

1. **Raw Data Storage** - Each table stores the raw input data
2. **Automatic Calculations** - Lead time and restore time calculated on insert
3. **Generated Columns** - Change failure uses PostgreSQL generated column for `is_failure`
4. **UUID Primary Keys** - Each record has a UUID for unique identification
5. **Cascade Deletion** - All records deleted if project is deleted
6. **Indexed Queries** - Optimized for time-based queries

---

### Table 1: `deployment_frequency`

**Purpose:** Tracks every deployment to production (or other environments)

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `uuid` | UUID | UNIQUE, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Project this deployment belongs to |
| `deployment_id` | VARCHAR(255) | NOT NULL | User-provided deployment identifier |
| `version` | VARCHAR(100) | NULL | Version number or tag |
| `environment` | VARCHAR(50) | NOT NULL, DEFAULT 'production' | Deployment environment |
| `deployment_timestamp` | TIMESTAMP | NOT NULL | When deployment occurred |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was last updated |

**Indexes:**
- `idx_deployment_frequency_project_id` - Fast lookups by project
- `idx_deployment_frequency_timestamp` - Fast time-range queries
- `idx_deployment_frequency_environment` - Filter by environment

**Usage in Calculations:**
- Deployment Frequency: Count deployments per time period
- Trend Analysis: Group by week/month/year

---

### Table 2: `lead_time_changes`

**Purpose:** Tracks time from code merge to production deployment

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `uuid` | UUID | UNIQUE, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Project this change belongs to |
| `change_id` | VARCHAR(255) | NOT NULL | Identifier for the change (MR, commit, etc.) |
| `merged_timestamp` | TIMESTAMP | NOT NULL | When code was merged |
| `deployed_timestamp` | TIMESTAMP | NOT NULL | When code was deployed |
| `lead_time_hours` | DECIMAL(10,2) | NULL | Calculated: (deployed - merged) in hours |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was last updated |

**Indexes:**
- `idx_lead_time_changes_project_id` - Fast lookups by project
- `idx_lead_time_changes_merged` - Fast queries by merge time
- `idx_lead_time_changes_deployed` - Fast queries by deploy time

**Automatic Calculation:**
The `lead_time_hours` is calculated in the API layer:
```typescript
lead_time_hours = (deployed_timestamp - merged_timestamp) / (1000 * 60 * 60)
```

**Usage in Calculations:**
- Lead Time: Average, median, min, max of lead_time_hours
- Trend Analysis: Group by week/month/year of merged_timestamp

---

### Table 3: `change_failure_rate`

**Purpose:** Tracks deployment failures and incidents

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `uuid` | UUID | UNIQUE, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Project this deployment belongs to |
| `deployment_id` | VARCHAR(255) | NOT NULL | Identifier matching deployment_frequency table |
| `deployment_timestamp` | TIMESTAMP | NOT NULL | When deployment occurred |
| `has_incident` | BOOLEAN | NOT NULL, DEFAULT false | Did this deployment cause an incident? |
| `remediation_type` | VARCHAR(50) | NOT NULL, DEFAULT 'none' | How incident was fixed |
| **`is_failure`** | **BOOLEAN** | **GENERATED ALWAYS AS** | **Computed column** |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was last updated |

**Generated Column Logic:**
```sql
is_failure BOOLEAN GENERATED ALWAYS AS (
  has_incident AND remediation_type IN ('rollback', 'hotfix', 'emergency')
) STORED
```

This means:
- `is_failure` is automatically calculated by PostgreSQL
- Cannot be manually set
- Updated automatically if has_incident or remediation_type changes

**Remediation Types:**
- `none` - No incident
- `rollback` - Reverted deployment (counts as failure)
- `hotfix` - Emergency fix deployed (counts as failure)
- `emergency` - Emergency patch (counts as failure)
- Other custom types (do not count as failure)

**Indexes:**
- `idx_change_failure_rate_project_id` - Fast lookups by project
- `idx_change_failure_rate_timestamp` - Fast time-range queries
- `idx_change_failure_rate_failure` - Fast filtering of failures only

**Usage in Calculations:**
- Failure Rate: (COUNT WHERE is_failure = true) / COUNT(*) × 100
- Trend Analysis: Group by week/month/year

---

### Table 4: `time_to_restore_service`

**Purpose:** Tracks incident detection and resolution times

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| `uuid` | UUID | UNIQUE, DEFAULT gen_random_uuid() | Unique identifier |
| `project_id` | INTEGER | NOT NULL, FOREIGN KEY → projects(id) ON DELETE CASCADE | Project this incident belongs to |
| `incident_id` | VARCHAR(255) | NOT NULL | User-provided incident identifier |
| `start_time` | TIMESTAMP | NOT NULL | When incident was detected |
| `end_time` | TIMESTAMP | NOT NULL | When service was restored |
| `restore_time_hours` | DECIMAL(10,2) | NULL | Calculated: (end - start) in hours |
| `description` | TEXT | NULL | Brief description of the incident |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When record was last updated |

**Constraints:**
- `check_end_after_start` - CHECK (end_time > start_time)

**Indexes:**
- `idx_time_to_restore_project_id` - Fast lookups by project
- `idx_time_to_restore_start` - Fast queries by start time
- `idx_time_to_restore_end` - Fast queries by end time

**Automatic Calculation:**
The `restore_time_hours` is calculated in the API layer:
```typescript
restore_time_hours = (end_time - start_time) / (1000 * 60 * 60)
```

**Usage in Calculations:**
- Restore Time: Average, median, min, max of restore_time_hours
- Trend Analysis: Group by week/month/year of start_time

---

### Table 5: `weekly_dora_snapshots` (Optional - Not Currently Used)

**Purpose:** Pre-aggregated weekly snapshots for faster trend queries

**Status:** Created but not actively used in current implementation. Trend data is calculated on-demand from the 4 base tables.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | UUID PRIMARY KEY | Unique identifier |
| `row_id` | SERIAL UNIQUE | Auto-incrementing row |
| `project_id` | INTEGER | Foreign key to projects |
| `week_start_date` | DATE | Start of week (Sunday) |
| `week_end_date` | DATE | End of week (Saturday) |
| `total_deployments` | INTEGER | Snapshot of deployment count |
| `production_deployments` | INTEGER | Production deployments only |
| `failed_deployments` | INTEGER | Failed deployment count |
| `failure_rate_percent` | DECIMAL(5,2) | Failure percentage |
| `total_changes` | INTEGER | Change count |
| `avg_lead_time_hours` | DECIMAL(10,2) | Average lead time |
| `total_incidents` | INTEGER | Incident count |
| `avg_restore_time_hours` | DECIMAL(10,2) | Average restore time |
| `created_at` | TIMESTAMP | When snapshot was created |

**Unique Constraint:** (project_id, week_start_date) - One snapshot per project per week

**Future Use:**
- Could be populated by scheduled jobs
- Would improve performance for large datasets
- Would enable faster historical queries

---

## Calculation Engine

### Overview

DORA metrics are calculated **on-demand** when the dashboard loads. There are two main calculation services:

1. **doraMetricsCalculationService** - Calculates summary metrics
2. **doraTrendsService** - Calculates trend data over time

---

### Summary Metrics Calculation

**Service:** `server/src/services/doraMetrics/doraMetricsCalculationService.ts`

**Function:** `calculateDoraMetricsSummary(projectId, days)`

**Parameters:**
- `projectId` - Which project to calculate for
- `days` - Time window (0 = all time, 30 = last 30 days)

**Returns:**
```typescript
{
  project_id: number,
  deployment_frequency: {
    total_deployments: number,
    production_deployments: number,
    deployments_per_day: number,
    deployments_per_week: number,
    deployments_per_month: number
  },
  lead_time: {
    total_changes: number,
    avg_lead_time_hours: number,
    median_lead_time_hours: number,
    min_lead_time_hours: number,
    max_lead_time_hours: number
  },
  change_failure_rate: {
    total_deployments: number,
    failed_deployments: number,
    failure_rate_percent: number
  },
  time_to_restore: {
    total_incidents: number,
    avg_restore_time_hours: number,
    median_restore_time_hours: number,
    min_restore_time_hours: number,
    max_restore_time_hours: number
  }
}
```

**Calculation Logic:**

#### Deployment Frequency
```sql
-- Count total and production deployments
SELECT 
  COUNT(*) as total_deployments,
  COUNT(*) FILTER (WHERE environment = 'production') as production_deployments
FROM deployment_frequency
WHERE project_id = $1
  AND deployment_timestamp >= NOW() - INTERVAL '30 days'
```

For all-time metrics (days = 0):
- Finds earliest and latest deployment
- Calculates total days in dataset
- Computes per-day, per-week, per-month rates

For time-filtered metrics:
- Counts deployments in last 1, 7, and 30 days

#### Lead Time for Changes
```sql
SELECT 
  COUNT(*) as total_changes,
  AVG(lead_time_hours) as avg_lead_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_time_hours) as median_lead_time,
  MIN(lead_time_hours) as min_lead_time,
  MAX(lead_time_hours) as max_lead_time
FROM lead_time_changes
WHERE project_id = $1
  AND merged_timestamp >= NOW() - INTERVAL '30 days'
```

Provides:
- Average (mean) lead time
- Median lead time (more resistant to outliers)
- Min and max for range

#### Change Failure Rate
```sql
SELECT 
  COUNT(*) as total_deployments,
  COUNT(*) FILTER (WHERE is_failure = true) as failed_deployments,
  CASE 
    WHEN COUNT(*) > 0 
    THEN (COUNT(*) FILTER (WHERE is_failure = true)::DECIMAL / COUNT(*)) * 100
    ELSE 0
  END as failure_rate
FROM change_failure_rate
WHERE project_id = $1
  AND deployment_timestamp >= NOW() - INTERVAL '30 days'
```

Calculates:
- Percentage of failed deployments
- Handles division by zero

#### Time to Restore Service
```sql
SELECT 
  COUNT(*) as total_incidents,
  AVG(restore_time_hours) as avg_restore_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY restore_time_hours) as median_restore_time,
  MIN(restore_time_hours) as min_restore_time,
  MAX(restore_time_hours) as max_restore_time
FROM time_to_restore_service
WHERE project_id = $1
  AND start_time >= NOW() - INTERVAL '30 days'
```

Provides:
- Average restore time
- Median restore time
- Min and max for range

---

### Trend Analysis Calculation

**Service:** `server/src/services/doraMetrics/doraTrendsService.ts`

**Function:** `getDoraTrends(projectId, granularity, periods, offset)`

**Parameters:**
- `projectId` - Which project
- `granularity` - 'weekly', 'monthly', or 'yearly'
- `periods` - How many periods to retrieve (max 12)
- `offset` - Number of period sets to skip (0 = current, 1 = previous 12 periods)

**Returns:**
```typescript
{
  granularity: 'weekly' | 'monthly' | 'yearly',
  data: [
    {
      period: string,  // "2024-01", "2024-W01", or "2024"
      deployment_frequency: number,
      avg_lead_time_hours: number,
      failure_rate_percent: number,
      avg_restore_time_hours: number,
      total_deployments: number,
      total_changes: number,
      failed_deployments: number,
      total_incidents: number
    }
  ],
  summary: {
    deployment_frequency: { current, avg, trend, change_percent },
    lead_time: { current, avg, trend, change_percent },
    failure_rate: { current, avg, trend, change_percent },
    restore_time: { current, avg, trend, change_percent }
  }
}
```

**Date Grouping Logic:**

**Weekly:**
- Groups by ISO week number (2024-W01, 2024-W02, etc.)
- Sunday to Saturday weeks
- Last 12 weeks by default

**Monthly:**
- Groups by year-month (2024-01, 2024-02, etc.)
- Calendar months
- Last 12 months by default

**Yearly:**
- Groups by year (2024, 2023, etc.)
- Calendar years
- Last 12 years (or all available)

**Trend Calculation:**

For each metric:
1. Get current period value (most recent)
2. Get previous period value (second most recent)
3. Calculate percentage change: `((current - previous) / previous) × 100`
4. Determine trend direction:
   - If change < 1%: 'stable'
   - If change > 0: 'up' (value increased)
   - If change < 0: 'down' (value decreased)

**Note:** The frontend handles whether "up" is good or bad:
- Deployment Frequency: up = good (green)
- Lead Time: up = bad (red), down = good (green)
- Failure Rate: up = bad (red), down = good (green)
- Restore Time: up = bad (red), down = good (green)

**Example Queries:**

Last 12 months:
```typescript
getDoraTrends(123, 'monthly', 12, 0)
```

Previous 12 months (13-24 months ago):
```typescript
getDoraTrends(123, 'monthly', 12, 1)
```

Last 12 weeks:
```typescript
getDoraTrends(123, 'weekly', 12, 0)
```

---

### Performance Ratings

Each metric value is rated against DORA benchmarks:

**Deployment Frequency:**
- Elite: ≥30 per month
- High: ≥7 per month
- Medium: ≥1 per month
- Low: <1 per month

**Lead Time (hours):**
- Elite: ≤24 hours
- High: ≤168 hours (1 week)
- Medium: ≤720 hours (1 month)
- Low: >720 hours

**Failure Rate (%):**
- Elite: ≤5%
- High: ≤10%
- Medium: ≤15%
- Low: >15%

**Restore Time (hours):**
- Elite: ≤1 hour
- High: ≤24 hours
- Medium: ≤168 hours (1 week)
- Low: >168 hours

---

## Frontend Components

### 1. DORA Metrics Overview Card

**File:** `client/src/components/DoraMetricsOverviewCard.tsx`

**Location:** Project Detail page alongside other health metric cards

**What It Shows:**
- **All-time summary** of all 4 DORA metrics in a 2x2 grid
- Performance badges (Elite/High/Medium/Low) with color coding
- Key stats: total deployments, average lead time, failure rate %, average restore time
- Fetches data via: `GET /projects/:id/dora/summary?days=0`

**Badge Colors:**
- Elite = Green, High = Blue, Medium = Yellow, Low = Red

---

### 2. DORA Dashboard

**File:** `client/src/pages/DORADashboard.tsx`

**Access:** Project Detail → "DORA Dashboard" button

**Purpose:** Comprehensive visualization of all 4 metrics with trend analysis over time

---

### Dashboard Features

#### 1. Time Granularity Selector

**Dropdown Options:**
- Weekly (last 12 weeks)
- Monthly (last 12 months)
- Yearly (last 12 years)

**Navigation:**
- "Previous" button - Load previous 12 periods
- "Next" button - Return to more recent periods
- Offset tracking allows browsing historical data

**Example:**
- Initial view: Last 12 months (offset=0)
- Click "Previous": Months 13-24 ago (offset=1)
- Click "Previous" again: Months 25-36 ago (offset=2)
- Click "Next": Back to months 13-24 (offset=1)

---

#### 2. Summary Cards (Top Row)

Four cards showing current performance:

**Deployment Frequency Card:**
- Icon: 🚀 Rocket
- Current value: Deployments per month
- Performance rating: Elite/High/Medium/Low (color-coded)
- Trend indicator: ↑↓ with percentage change
- Color coding: Green if up, red if down

**Lead Time for Changes Card:**
- Icon: ⏱️ Clock
- Current value: Average hours
- Performance rating: Elite/High/Medium/Low
- Trend indicator: ↑↓ with percentage change
- Color coding: Red if up, green if down (lower is better)

**Change Failure Rate Card:**
- Icon: ⚠️ Alert Triangle
- Current value: Failure percentage
- Performance rating: Elite/High/Medium/Low
- Trend indicator: ↑↓ with percentage change
- Color coding: Red if up, green if down (lower is better)

**Time to Restore Service Card:**
- Icon: 🔧 Wrench
- Current value: Average hours
- Performance rating: Elite/High/Medium/Low
- Trend indicator: ↑↓ with percentage change
- Color coding: Red if up, green if down (lower is better)

---

#### 3. Trend Charts

**Deployment Frequency Chart:**
- Type: Area Chart (filled)
- X-axis: Time periods
- Y-axis: Number of deployments
- Color: Blue gradient
- Shows: Total deployment count per period
- Tooltip: Exact deployment count

**Lead Time Chart:**
- Type: Line Chart
- X-axis: Time periods
- Y-axis: Hours
- Color: Purple
- Shows: Average lead time per period
- Tooltip: Hours and change count

**Change Failure Rate Chart:**
- Type: Line Chart
- X-axis: Time periods
- Y-axis: Percentage (0-100%)
- Color: Orange/Red
- Shows: Failure percentage per period
- Tooltip: Percentage and deployment count

**Time to Restore Chart:**
- Type: Line Chart
- X-axis: Time periods
- Y-axis: Hours
- Color: Red
- Shows: Average restore time per period
- Tooltip: Hours and incident count

---

#### 4. Success vs Failure Pie Chart

**Purpose:** Visual breakdown of deployment success rate

**Data:**
- Success slice: Deployments without failures (green)
- Failure slice: Deployments with failures (red)

**Calculation:**
```
Total deployments = total from change_failure_rate table
Failed deployments = COUNT WHERE is_failure = true
Success = Total - Failed
```

**Center Label:** Shows failure rate percentage

---

### Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│  Time Selector: [Weekly ▼] [< Previous] [Next >]    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │Deploy  │  │ Lead   │  │Failure │  │Restore │   │
│  │Freq    │  │ Time   │  │ Rate   │  │ Time   │   │
│  │  25/mo │  │  48hrs │  │  8.5%  │  │  2.3hr │   │
│  │Elite ↑ │  │High  ↓ │  │High ↑  │  │Elite ↓│   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                       │
├──────────────────────────────────────────────────────┤
│  📊 Deployment Frequency Over Time                   │
│  [========== Area Chart ==========]                  │
├──────────────────────────────────────────────────────┤
│  ⏱️ Lead Time for Changes                            │
│  [========== Line Chart ===========]                 │
├──────────────────────────────────────────────────────┤
│  ⚠️ Change Failure Rate                              │
│  [========== Line Chart ===========]                 │
├──────────────────────────────────────────────────────┤
│  🔧 Time to Restore Service                          │
│  [========== Line Chart ===========]                 │
├──────────────────────────────────────────────────────┤
│  🥧 Deployment Success Distribution                  │
│  [======= Pie Chart =======]                         │
└──────────────────────────────────────────────────────┘
```


## API Endpoints

### Base URL: `/api/projects/:id/dora/`

All endpoints require a project ID in the URL path.

---

### Input Endpoints (POST)

#### 1. Create Deployment
```http
POST /projects/:id/dora/deployment

Request Body:
{
  "deployment_id": "deploy-2024-001",
  "version": "v1.2.3",
  "environment": "production",
  "deployment_timestamp": "2024-01-15T14:30:00Z"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 123,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "project_id": 1,
    "deployment_id": "deploy-2024-001",
    "version": "v1.2.3",
    "environment": "production",
    "deployment_timestamp": "2024-01-15T14:30:00Z",
    "created_at": "2024-01-15T14:31:00Z"
  },
  "message": "Deployment logged successfully"
}
```

---

#### 2. Create Lead Time
```http
POST /projects/:id/dora/leadtime

Request Body:
{
  "change_id": "MR-1234",
  "merged_timestamp": "2024-01-15T10:00:00Z",
  "deployed_timestamp": "2024-01-15T14:30:00Z"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 456,
    "uuid": "550e8400-e29b-41d4-a716-446655440001",
    "project_id": 1,
    "change_id": "MR-1234",
    "merged_timestamp": "2024-01-15T10:00:00Z",
    "deployed_timestamp": "2024-01-15T14:30:00Z",
    "lead_time_hours": 4.5,
    "created_at": "2024-01-15T14:31:00Z"
  },
  "message": "Lead time data logged successfully"
}
```

---

#### 3. Create Failure Record
```http
POST /projects/:id/dora/failure

Request Body:
{
  "deployment_id": "deploy-2024-001",
  "deployment_timestamp": "2024-01-15T14:30:00Z",
  "has_incident": true,
  "remediation_type": "rollback"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 789,
    "uuid": "550e8400-e29b-41d4-a716-446655440002",
    "project_id": 1,
    "deployment_id": "deploy-2024-001",
    "deployment_timestamp": "2024-01-15T14:30:00Z",
    "has_incident": true,
    "remediation_type": "rollback",
    "is_failure": true,
    "created_at": "2024-01-15T14:31:00Z"
  },
  "message": "Failure data logged successfully"
}
```

---

#### 4. Create Restore Time
```http
POST /projects/:id/dora/restore

Request Body:
{
  "incident_id": "INC-2024-042",
  "start_time": "2024-01-15T16:00:00Z",
  "end_time": "2024-01-15T17:30:00Z",
  "description": "Database connection pool exhausted"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": 101,
    "uuid": "550e8400-e29b-41d4-a716-446655440003",
    "project_id": 1,
    "incident_id": "INC-2024-042",
    "start_time": "2024-01-15T16:00:00Z",
    "end_time": "2024-01-15T17:30:00Z",
    "restore_time_hours": 1.5,
    "description": "Database connection pool exhausted",
    "created_at": "2024-01-15T17:31:00Z"
  },
  "message": "Restore time logged successfully"
}
```

---

### Query Endpoints (GET)

#### 5. Get All Deployments
```http
GET /projects/:id/dora/deployment

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "id": 123,
      "deployment_id": "deploy-2024-001",
      "version": "v1.2.3",
      "environment": "production",
      "deployment_timestamp": "2024-01-15T14:30:00Z"
    }
  ]
}
```

---

#### 6. Get Summary Metrics
```http
GET /projects/:id/dora/summary?days=30

Query Parameters:
- days (optional): Time window in days (0 = all time, default = 30)

Response: 200 OK
{
  "success": true,
  "data": {
    "project_id": 1,
    "deployment_frequency": {
      "total_deployments": 45,
      "production_deployments": 40,
      "deployments_per_day": 1.5,
      "deployments_per_week": 10.5,
      "deployments_per_month": 45
    },
    "lead_time": {
      "total_changes": 38,
      "avg_lead_time_hours": 48.5,
      "median_lead_time_hours": 36.0,
      "min_lead_time_hours": 2.5,
      "max_lead_time_hours": 240.0
    },
    "change_failure_rate": {
      "total_deployments": 45,
      "failed_deployments": 4,
      "failure_rate_percent": 8.89
    },
    "time_to_restore": {
      "total_incidents": 4,
      "avg_restore_time_hours": 2.3,
      "median_restore_time_hours": 1.5,
      "min_restore_time_hours": 0.5,
      "max_restore_time_hours": 6.0
    }
  }
}
```

---

#### 7. Get Trend Data
```http
GET /projects/:id/dora/trends?granularity=monthly&periods=12&offset=0

Query Parameters:
- granularity: 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
- periods: Number of periods (1-12, default: 12)
- offset: Period offset (0 = current, 1 = previous set, default: 0)

Response: 200 OK
{
  "success": true,
  "data": {
    "granularity": "monthly",
    "data": [
      {
        "period": "2024-01",
        "deployment_frequency": 45,
        "avg_lead_time_hours": 48.5,
        "failure_rate_percent": 8.89,
        "avg_restore_time_hours": 2.3,
        "total_deployments": 45,
        "total_changes": 38,
        "failed_deployments": 4,
        "total_incidents": 4
      },
      // ... more periods
    ],
    "summary": {
      "deployment_frequency": {
        "current": 45,
        "avg": 38.5,
        "trend": "up",
        "change_percent": 16.9
      },
      "lead_time": {
        "current": 48.5,
        "avg": 52.3,
        "trend": "down",
        "change_percent": -7.27
      },
      "failure_rate": {
        "current": 8.89,
        "avg": 9.5,
        "trend": "down",
        "change_percent": -6.42
      },
      "restore_time": {
        "current": 2.3,
        "avg": 2.8,
        "trend": "down",
        "change_percent": -17.86
      }
    }
  }
}
```

---

#### 8. Search Deployments (Autocomplete)
```http
GET /projects/:id/dora/deployment/search?q=deploy-2024

Query Parameters:
- q: Search term (minimum 1 character)

Response: 200 OK
{
  "success": true,
  "data": [
    {
      "deployment_id": "deploy-2024-001",
      "deployment_timestamp": "2024-01-15T14:30:00Z",
      "environment": "production"
    },
    {
      "deployment_id": "deploy-2024-002",
      "deployment_timestamp": "2024-01-16T10:00:00Z",
      "environment": "production"
    }
  ]
}

Note: Only returns deployments from last 90 days
```

---

### Delete Endpoints (DELETE)

#### 9. Delete Deployment
```http
DELETE /projects/:id/dora/deployment/:deployment_uuid

Response: 200 OK
{
  "success": true,
  "message": "Deployment deleted successfully"
}
```

Similar endpoints exist for:
- `DELETE /projects/:id/dora/leadtime/:uuid`
- `DELETE /projects/:id/dora/failure/:uuid`
- `DELETE /projects/:id/dora/restore/:uuid`

---

## Future Automation Plans

### Why Automation?

**Current Pain Points:**
- Manual data entry is time-consuming
- Requires team discipline to log consistently
- Prone to human error and forgotten entries
- Data may be delayed or incomplete
- Difficult to maintain for large teams

**Benefits of Automation:**
- Real-time metrics without manual input
- 100% data coverage
- No human error or bias
- Historical data automatically captured
- Scales effortlessly across projects

---

