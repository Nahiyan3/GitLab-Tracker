# Issue and Merge Request Metrics Implementation Guide

This document provides the database schema and calculation logic for tracking GitLab Issue and Merge Request metrics over time.

---

## Overview

Both metric systems use a **snapshot-based approach**:
- Daily sync job collects data from GitLab API
- Pre-calculated metrics stored in snapshot tables
- Fast queries with no API calls during user requests
- Complete historical trends for 30+ days

**Storage per project:** ~6-7 KB for 30 days of history

---

## Issue Tracking Metrics

### Database Schema

```sql
CREATE TABLE issue_metrics_snapshots (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  
  -- Core Counts (from GitLab API headers)
  total_open_issues INTEGER NOT NULL,           -- Current open issues count
  total_closed_issues INTEGER NOT NULL,         -- Total closed issues ever
  
  -- Period-specific counts (last 7 days from snapshot_date)
  issues_opened_last_7d INTEGER NOT NULL,       -- Opened in last 7 days
  issues_closed_last_7d INTEGER NOT NULL,       -- Closed in last 7 days
  
  -- Period-specific counts (last 30 days from snapshot_date)
  issues_opened_last_30d INTEGER NOT NULL,      -- Opened in last 30 days
  issues_closed_last_30d INTEGER NOT NULL,      -- Closed in last 30 days
  
  -- Resolution time data (from closed issues in last 30 days)
  total_resolution_hours FLOAT NOT NULL,        -- Sum of all resolution times
  closed_issues_with_resolution_time INTEGER NOT NULL,  -- Count of issues used in calculation
  
  -- Reopen data (from closed issues checked)
  issues_checked_for_reopens INTEGER NOT NULL,  -- Sample size (e.g., 100)
  issues_found_reopened INTEGER NOT NULL,       -- How many were reopened
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, snapshot_date)
);

CREATE INDEX idx_issue_snapshots_project_date ON issue_metrics_snapshots(project_id, snapshot_date DESC);
```

---

### Metric 1: Open vs Closed Issues

**What it measures:** Current state of issue backlog

**Calculation:**
```javascript
openCount = snapshot.total_open_issues
closedCount = snapshot.total_closed_issues
totalIssues = openCount + closedCount

openPercentage = (openCount / totalIssues) * 100
closedPercentage = (closedCount / totalIssues) * 100
openToClosedRatio = openCount / closedCount
```

**Example:**
```
total_open_issues: 45
total_closed_issues: 230

Result:
- Open: 45 (16.4%)
- Closed: 230 (83.6%)
- Ratio: 0.20 (1 open for every 5 closed)
```

**Week-over-week trend:**
```javascript
changeInOpen = today.total_open_issues - sevenDaysAgo.total_open_issues
changePercent = (changeInOpen / sevenDaysAgo.total_open_issues) * 100

// -5 issues (-10%) = ✅ IMPROVING
// +5 issues (+10%) = ❌ DECLINING
```

---

### Metric 2: Issue Closure Rate

**What it measures:** Team's efficiency in resolving issues

**Calculation:**
```javascript
// Weekly closure rate
closureRate = snapshot.issues_closed_last_7d

// Net change (backlog growth/reduction)
netChange = snapshot.issues_closed_last_7d - snapshot.issues_opened_last_7d

// Closure efficiency
closureEfficiency = (snapshot.issues_closed_last_7d / snapshot.issues_opened_last_7d) * 100
```

**Example:**
```
issues_opened_last_7d: 42
issues_closed_last_7d: 38

Result:
- Closure rate: 38 issues/week
- Net change: -4 (backlog growing by 4/week) ❌
- Efficiency: 90.5% (closing 90.5% of what's opened)
```

**Quality indicators:**
- Efficiency < 70%: POOR (backlog growing fast)
- Efficiency 70-90%: ACCEPTABLE
- Efficiency 90-110%: GOOD (keeping pace)
- Efficiency > 110%: EXCELLENT (reducing backlog)

---

### Metric 3: Average Issue Resolution Time

**What it measures:** Speed of issue resolution

**Calculation:**
```javascript
avgResolutionHours = snapshot.total_resolution_hours / snapshot.closed_issues_with_resolution_time
avgResolutionDays = avgResolutionHours / 24

// Human-readable format
if (avgResolutionHours < 24) {
  display = `${avgResolutionHours.toFixed(1)} hours`
} else if (avgResolutionDays < 7) {
  display = `${avgResolutionDays.toFixed(1)} days`
} else {
  display = `${(avgResolutionDays / 7).toFixed(1)} weeks`
}
```

**Example:**
```
total_resolution_hours: 1212.5
closed_issues_with_resolution_time: 24

Result:
- Average: 1212.5 / 24 = 50.5 hours
- Display: 2.1 days
```

**Quality indicators:**
- < 2 days: EXCELLENT
- 2-5 days: GOOD
- 5-10 days: ACCEPTABLE
- > 10 days: POOR

---

### Metric 4: Issue Reopen Rate

**What it measures:** Quality of issue resolution (indicates if fixes are adequate)

**Calculation:**
```javascript
reopenRatePercent = (snapshot.issues_found_reopened / snapshot.issues_checked_for_reopens) * 100

// Quality indicator
if (reopenRatePercent < 5) {
  quality = "EXCELLENT"
} else if (reopenRatePercent < 10) {
  quality = "GOOD"
} else if (reopenRatePercent < 15) {
  quality = "ACCEPTABLE"
} else {
  quality = "POOR"
}
```

**Example:**
```
issues_checked_for_reopens: 100  (sampled last 100 closed issues)
issues_found_reopened: 15

Result:
- Reopen rate: 15.0%
- Quality: ACCEPTABLE (may need stronger testing/review)
```

**Week-over-week trend:**
```javascript
todayRate = (today.issues_found_reopened / today.issues_checked_for_reopens) * 100
previousRate = (previous.issues_found_reopened / previous.issues_checked_for_reopens) * 100

improvement = todayRate - previousRate
// -3.0 percentage points = ✅ IMPROVING (fewer reopens)
```

---

### Issue Metrics SQL Query

**Get current metrics:**
```sql
SELECT 
  -- Metric 1: Open vs Closed
  total_open_issues,
  total_closed_issues,
  ROUND((total_open_issues::FLOAT / NULLIF(total_open_issues + total_closed_issues, 0)) * 100, 1) as open_percentage,
  
  -- Metric 2: Closure Rate
  issues_closed_last_7d as closure_rate_weekly,
  issues_closed_last_30d as closure_rate_monthly,
  issues_closed_last_7d - issues_opened_last_7d as net_change_weekly,
  ROUND((issues_closed_last_7d::FLOAT / NULLIF(issues_opened_last_7d, 0)) * 100, 1) as closure_efficiency,
  
  -- Metric 3: Avg Resolution Time
  ROUND(total_resolution_hours / NULLIF(closed_issues_with_resolution_time, 0), 1) as avg_resolution_hours,
  ROUND((total_resolution_hours / NULLIF(closed_issues_with_resolution_time, 0)) / 24, 1) as avg_resolution_days,
  
  -- Metric 4: Reopen Rate
  ROUND((issues_found_reopened::FLOAT / NULLIF(issues_checked_for_reopens, 0)) * 100, 1) as reopen_rate_percent,
  
  snapshot_date
FROM issue_metrics_snapshots
WHERE project_id = $1
ORDER BY snapshot_date DESC
LIMIT 1;
```

**Get 30-day history (for charts):**
```sql
SELECT 
  snapshot_date,
  total_open_issues,
  issues_closed_last_7d,
  ROUND(total_resolution_hours / NULLIF(closed_issues_with_resolution_time, 0), 1) as avg_resolution_hours,
  ROUND((issues_found_reopened::FLOAT / NULLIF(issues_checked_for_reopens, 0)) * 100, 1) as reopen_rate_percent
FROM issue_metrics_snapshots
WHERE project_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY snapshot_date ASC;
```

---

## Merge Request Metrics

### Database Schema

```sql
CREATE TABLE mr_metrics_snapshots (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  
  -- Core MR Counts
  total_open_mrs INTEGER NOT NULL,              -- Currently open MRs
  total_merged_mrs INTEGER NOT NULL,            -- Total merged ever
  total_closed_mrs INTEGER NOT NULL,            -- Total closed without merge
  
  -- Period-specific counts (last 7 days)
  mrs_opened_last_7d INTEGER NOT NULL,          -- Opened in last 7 days
  mrs_merged_last_7d INTEGER NOT NULL,          -- Merged in last 7 days
  mrs_closed_last_7d INTEGER NOT NULL,          -- Closed in last 7 days
  
  -- Period-specific counts (last 30 days)
  mrs_opened_last_30d INTEGER NOT NULL,         -- Opened in last 30 days
  mrs_merged_last_30d INTEGER NOT NULL,         -- Merged in last 30 days
  mrs_closed_last_30d INTEGER NOT NULL,         -- Closed in last 30 days
  
  -- Metric 1: MR Cycle Time (from merged MRs in last 30 days)
  total_cycle_time_hours FLOAT NOT NULL,        -- Sum of (merged_at - created_at)
  mrs_with_cycle_time INTEGER NOT NULL,         -- Count used in calculation
  
  -- Metric 2: Time to First Response (from MRs in last 30 days)
  total_first_response_hours FLOAT NOT NULL,    -- Sum of (first_comment_at - created_at)
  mrs_with_first_response INTEGER NOT NULL,     -- Count with at least 1 comment
  mrs_without_response INTEGER NOT NULL,        -- Count with zero comments
  
  -- Metric 3: Review Participation (from merged MRs in last 30 days)
  total_reviewers_count INTEGER NOT NULL,       -- Sum of unique reviewers per MR
  mrs_with_reviewers INTEGER NOT NULL,          -- MRs that had reviewers
  unique_reviewers_list JSONB NOT NULL,         -- {"user_123": 45, "user_456": 30} = MR counts per reviewer
  
  -- Metric 4: Review Feedback (from merged MRs in last 30 days)
  total_comments_count INTEGER NOT NULL,        -- Sum of all comments
  total_discussions_count INTEGER NOT NULL,     -- Sum of discussion threads
  mrs_with_feedback INTEGER NOT NULL,           -- MRs that had comments
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, snapshot_date)
);

CREATE INDEX idx_mr_snapshots_project_date ON mr_metrics_snapshots(project_id, snapshot_date DESC);
```

---

### Metric 1: MR Cycle Time

**What it measures:** Time from MR creation to merge/closure

**Calculation:**
```javascript
avgCycleTimeHours = snapshot.total_cycle_time_hours / snapshot.mrs_with_cycle_time
avgCycleTimeDays = avgCycleTimeHours / 24

// Quality indicator
if (avgCycleTimeHours < 48) {
  status = "EXCELLENT"  // <2 days
} else if (avgCycleTimeHours < 120) {
  status = "GOOD"       // 2-5 days
} else if (avgCycleTimeHours < 240) {
  status = "ACCEPTABLE" // 5-10 days
} else {
  status = "POOR"       // >10 days
}
```

**Example:**
```
total_cycle_time_hours: 1440.0  (sum of all cycle times)
mrs_with_cycle_time: 24         (merged MRs in period)

Result: 1440 / 24 = 60 hours = 2.5 days ✅ GOOD
```

**Why it matters:** Long cycle times delay development and can block other features. Ideally should be <2 days.

---

### Metric 2: Time to First Response

**What it measures:** Time until a reviewer first comments on an MR

**Calculation:**
```javascript
// Average for MRs that got responses
avgFirstResponseHours = snapshot.total_first_response_hours / snapshot.mrs_with_first_response

// Response rate
totalMRsChecked = snapshot.mrs_with_first_response + snapshot.mrs_without_response
responseRate = (snapshot.mrs_with_first_response / totalMRsChecked) * 100

// Quality indicators
if (avgFirstResponseHours < 4) {
  responseSpeed = "EXCELLENT"  // <4 hours
} else if (avgFirstResponseHours < 24) {
  responseSpeed = "GOOD"       // 4-24 hours
} else if (avgFirstResponseHours < 48) {
  responseSpeed = "ACCEPTABLE" // 1-2 days
} else {
  responseSpeed = "POOR"       // >2 days
}

if (responseRate < 70) {
  responseCoverage = "POOR"    // Too many ignored MRs
} else if (responseRate < 90) {
  responseCoverage = "ACCEPTABLE"
} else {
  responseCoverage = "EXCELLENT"
}
```

**Example:**
```
total_first_response_hours: 240.0
mrs_with_first_response: 20
mrs_without_response: 3

Result:
- Avg response time: 240 / 20 = 12 hours ✅ GOOD
- Response rate: (20 / 23) * 100 = 87% → ACCEPTABLE
```

**Why it matters:** Quick acknowledgment prevents developers from being blocked. 2-4 hour response is ideal.

---

### Metric 3: Review Participation & Load Distribution

**What it measures:** Number of reviewers per MR and how evenly review tasks are distributed

**Calculation:**
```javascript
// Average reviewers per MR
avgReviewersPerMR = snapshot.total_reviewers_count / snapshot.mrs_with_reviewers

// Load distribution analysis
reviewerLoads = JSON.parse(snapshot.unique_reviewers_list)
reviewerCounts = Object.values(reviewerLoads)  // [45, 30, 10]

totalReviews = reviewerCounts.reduce((a, b) => a + b, 0)
topReviewerLoad = Math.max(...reviewerCounts)
topReviewerPercent = (topReviewerLoad / totalReviews) * 100

// Distribution quality
if (topReviewerPercent > 60) {
  distribution = "POOR"        // One person doing >60%
} else if (topReviewerPercent > 40) {
  distribution = "UNBALANCED"  // One person doing 40-60%
} else if (topReviewerPercent > 25) {
  distribution = "ACCEPTABLE"  // One person doing 25-40%
} else {
  distribution = "WELL_BALANCED"
}

// Participation quality
if (avgReviewersPerMR < 1.5) {
  participation = "POOR"       // <1.5 reviewers per MR
} else if (avgReviewersPerMR < 2) {
  participation = "ACCEPTABLE" // 1.5-2 reviewers
} else {
  participation = "GOOD"       // 2+ reviewers
}
```

**Example:**
```
total_reviewers_count: 48
mrs_with_reviewers: 24
unique_reviewers_list: {"user_123": 15, "user_456": 12, "user_789": 8}

Result:
- Avg reviewers per MR: 48 / 24 = 2.0 ✅ GOOD
- Top reviewer: user_123 with 15 MRs (42.9% of total) → UNBALANCED
```

**Why it matters:** Ensures proper oversight, avoids rubber-stamping, prevents overloading a few developers.

---

### Metric 4: Review Feedback / Defects Found

**What it measures:** Number of comments or defects raised during code review

**Calculation:**
```javascript
// Average comments per MR
avgCommentsPerMR = snapshot.total_comments_count / snapshot.mrs_with_feedback

// Average discussion threads per MR
avgDiscussionsPerMR = snapshot.total_discussions_count / snapshot.mrs_with_feedback

// Feedback quality
if (avgCommentsPerMR < 1) {
  feedbackLevel = "POOR"       // Rubber-stamping
} else if (avgCommentsPerMR < 3) {
  feedbackLevel = "LIGHT"      // Minimal feedback
} else if (avgCommentsPerMR < 10) {
  feedbackLevel = "THOROUGH"   // Good review depth
} else {
  feedbackLevel = "EXTENSIVE"  // Very detailed (or poor code quality)
}

// Discussion engagement
if (avgDiscussionsPerMR < 1) {
  engagement = "LOW"
} else if (avgDiscussionsPerMR < 3) {
  engagement = "MODERATE"
} else {
  engagement = "HIGH"
}
```

**Example:**
```
total_comments_count: 120
total_discussions_count: 48
mrs_with_feedback: 24

Result:
- Avg comments per MR: 120 / 24 = 5.0 ✅ THOROUGH
- Avg discussions per MR: 48 / 24 = 2.0 → MODERATE
```

**Why it matters:** High feedback indicates thorough reviews or poor code quality. Caught defects prevent bugs from reaching main.

---

### Metric 5: MR Closure Rate

**What it measures:** Ratio of merged/closed MRs vs total opened

**Calculation:**
```javascript
// Completed MRs (merged + closed without merge)
completedMRs = snapshot.mrs_merged_last_7d + snapshot.mrs_closed_last_7d

// Closure rate
closureRate = (completedMRs / snapshot.mrs_opened_last_7d) * 100

// Net change in backlog
netChange = snapshot.mrs_opened_last_7d - completedMRs

// Merge success rate (merged / total completed)
mergeSuccessRate = (snapshot.mrs_merged_last_7d / completedMRs) * 100

// Quality indicators
if (closureRate < 70) {
  efficiency = "POOR"          // Backlog growing fast
} else if (closureRate < 90) {
  efficiency = "ACCEPTABLE"    // Keeping up mostly
} else if (closureRate < 110) {
  efficiency = "GOOD"          // Keeping pace
} else {
  efficiency = "EXCELLENT"     // Reducing backlog
}

// Open MR health
if (snapshot.total_open_mrs > 50) {
  backlogHealth = "POOR"       // Too many open MRs
} else if (snapshot.total_open_mrs > 25) {
  backlogHealth = "ACCEPTABLE"
} else {
  backlogHealth = "GOOD"
}
```

**Example:**
```
mrs_opened_last_7d: 30
mrs_merged_last_7d: 28
mrs_closed_last_7d: 2
total_open_mrs: 15

Result:
- Completed: 28 + 2 = 30
- Closure rate: (30 / 30) * 100 = 100% ✅ GOOD
- Net change: 0 (stable backlog)
- Merge success: (28 / 30) * 100 = 93.3%
- Backlog: 15 open MRs → GOOD
```

**Why it matters:** Detects stale MRs that can accumulate conflicts or technical debt.

---

### MR Metrics SQL Query

**Get current metrics:**
```sql
SELECT 
  -- Counts
  total_open_mrs,
  total_merged_mrs,
  total_closed_mrs,
  
  -- Metric 1: Cycle Time
  ROUND(total_cycle_time_hours / NULLIF(mrs_with_cycle_time, 0), 1) as avg_cycle_hours,
  ROUND((total_cycle_time_hours / NULLIF(mrs_with_cycle_time, 0)) / 24, 1) as avg_cycle_days,
  
  -- Metric 2: First Response
  ROUND(total_first_response_hours / NULLIF(mrs_with_first_response, 0), 1) as avg_first_response_hours,
  ROUND((mrs_with_first_response::FLOAT / NULLIF(mrs_with_first_response + mrs_without_response, 0)) * 100, 1) as response_rate_percent,
  
  -- Metric 3: Participation
  ROUND(total_reviewers_count::FLOAT / NULLIF(mrs_with_reviewers, 0), 1) as avg_reviewers_per_mr,
  unique_reviewers_list as reviewer_load_distribution,
  
  -- Metric 4: Feedback
  ROUND(total_comments_count::FLOAT / NULLIF(mrs_with_feedback, 0), 1) as avg_comments_per_mr,
  ROUND(total_discussions_count::FLOAT / NULLIF(mrs_with_feedback, 0), 1) as avg_discussions_per_mr,
  
  -- Metric 5: Closure Rate
  mrs_merged_last_7d,
  mrs_opened_last_7d,
  ROUND(((mrs_merged_last_7d + mrs_closed_last_7d)::FLOAT / NULLIF(mrs_opened_last_7d, 0)) * 100, 1) as closure_rate_percent,
  mrs_opened_last_7d - (mrs_merged_last_7d + mrs_closed_last_7d) as net_mr_change,
  
  snapshot_date
FROM mr_metrics_snapshots
WHERE project_id = $1
ORDER BY snapshot_date DESC
LIMIT 1;
```

**Get 30-day history (for charts):**
```sql
SELECT 
  snapshot_date,
  total_open_mrs,
  ROUND(total_cycle_time_hours / NULLIF(mrs_with_cycle_time, 0), 1) as avg_cycle_hours,
  ROUND(total_first_response_hours / NULLIF(mrs_with_first_response, 0), 1) as avg_first_response_hours,
  ROUND(total_comments_count::FLOAT / NULLIF(mrs_with_feedback, 0), 1) as avg_comments_per_mr,
  mrs_merged_last_7d,
  mrs_opened_last_7d
FROM mr_metrics_snapshots
WHERE project_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY snapshot_date ASC;
```

---

## Week-over-Week Trend Calculation

**Generic formula for any metric:**

```javascript
// Get current and previous snapshots
todaySnapshot = getLatestSnapshot(projectId)
previousSnapshot = getSnapshot(projectId, todaySnapshot.date - 7 days)

// Calculate current value
currentValue = calculateMetric(todaySnapshot)

// Calculate previous value
previousValue = calculateMetric(previousSnapshot)

// Absolute change
absoluteChange = currentValue - previousValue

// Percentage change
percentChange = ((currentValue - previousValue) / previousValue) * 100

// Determine trend direction
if (percentChange < -5) {
  trend = "DECREASING" // ⬇️
} else if (percentChange > 5) {
  trend = "INCREASING" // ⬆️
} else {
  trend = "STABLE"     // ➡️
}

// Interpret improvement (depends on metric)
// For open issues, cycle time, reopen rate: decrease = good
// For closure rate, comments: increase = good
```

**SQL implementation:**
```sql
WITH current_snapshot AS (
  SELECT * FROM issue_metrics_snapshots
  WHERE project_id = $1
  ORDER BY snapshot_date DESC
  LIMIT 1
),
previous_snapshot AS (
  SELECT * FROM issue_metrics_snapshots
  WHERE project_id = $1
    AND snapshot_date = (SELECT snapshot_date FROM current_snapshot) - INTERVAL '7 days'
  LIMIT 1
)
SELECT 
  c.total_open_issues as current_value,
  p.total_open_issues as previous_value,
  c.total_open_issues - p.total_open_issues as absolute_change,
  ROUND(((c.total_open_issues - p.total_open_issues)::FLOAT / NULLIF(p.total_open_issues, 0)) * 100, 1) as percent_change
FROM current_snapshot c
LEFT JOIN previous_snapshot p ON true;
```

---

## Storage Requirements

**Per project for 30 days:**
- Issue metrics: ~2 KB (10 columns × 30 rows)
- MR metrics: ~4.5 KB (15 columns × 30 rows)
- **Total: ~6.5 KB per project**

**For 100 projects:**
- 30 days: ~650 KB
- 90 days: ~2 MB
- 1 year: ~8 MB

**Performance:**
- Daily sync: 1-2 minutes for all projects
- Query response: <50ms (pure SQL, no API calls)
- No rate limit concerns (API called only during nightly sync)

---

## Implementation Notes

1. **Daily sync job:** Runs at 2 AM, fetches data from GitLab API, calculates metrics, stores snapshot
2. **Data retention:** Keep 90 days of daily snapshots, then weekly/monthly aggregates
3. **API optimization:** Use pagination, filter by date ranges, batch requests
4. **Error handling:** If sync fails, use previous day's data as fallback
5. **Manual refresh:** Optional "Refresh Now" button for real-time updates
6. **Alerts:** Configure thresholds for poor metrics (e.g., cycle time >5 days, reopen rate >20%)

---

## Benefits of Snapshot Approach

✅ **Fast queries** - No GitLab API calls during user requests  
✅ **Historical trends** - Full 30-90 day history for charts  
✅ **No rate limits** - API called once per day  
✅ **Minimal storage** - ~6-7 KB per project for 30 days  
✅ **Simple queries** - Pure SQL, no complex joins  
✅ **Scalable** - Works for 1 or 1000 projects  
✅ **Reliable** - Not affected by GitLab API downtime during user requests
