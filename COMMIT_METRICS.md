# Commit & Contribution Metrics Implementation Guide

This document provides the database schema and calculation logic for tracking GitLab commit and contribution metrics over time.

---

## Overview

The commit metrics system uses a **snapshot-based approach**:
- Daily sync job collects commit data from GitLab API
- Aggregated commit statistics stored in snapshot tables
- Individual contributor stats tracked for bus factor analysis
- Complete historical trends for 30+ days

**Storage per project:** ~3-4 KB for 30 days of history

---

## Commit Metrics

### Database Schema

```sql
CREATE TABLE commit_metrics_snapshots (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  snapshot_date DATE NOT NULL,
  
  -- Metric 1: Commit Frequency & Volume (last 7 days)
  total_commits_7d INTEGER NOT NULL,            -- Total commits in last 7 days
  total_commits_30d INTEGER NOT NULL,           -- Total commits in last 30 days
  unique_committers_7d INTEGER NOT NULL,        -- Distinct contributors in 7 days
  unique_committers_30d INTEGER NOT NULL,       -- Distinct contributors in 30 days
  
  -- Commit size metrics (last 30 days)
  total_additions INTEGER NOT NULL,             -- Lines added
  total_deletions INTEGER NOT NULL,             -- Lines deleted
  total_files_changed INTEGER NOT NULL,         -- Files modified
  commits_analyzed INTEGER NOT NULL,            -- Count used for averages
  
  -- Commit patterns (last 30 days)
  tiny_commits_count INTEGER NOT NULL,          -- <10 lines changed
  small_commits_count INTEGER NOT NULL,         -- 10-100 lines
  medium_commits_count INTEGER NOT NULL,        -- 100-500 lines
  large_commits_count INTEGER NOT NULL,         -- 500-1000 lines
  huge_commits_count INTEGER NOT NULL,          -- >1000 lines
  
  -- Metric 2: Code Churn (last 30 days)
  files_modified_multiple_times JSONB NOT NULL, -- {"file.js": 12, "app.ts": 8} = times modified
  high_churn_files_count INTEGER NOT NULL,      -- Files modified >5 times
  total_churn_modifications INTEGER NOT NULL,   -- Sum of all repeated modifications
  
  -- Metric 3: Contributor Distribution (last 30 days)
  contributor_commit_counts JSONB NOT NULL,     -- {"user_123": 145, "user_456": 89} = commits per user
  top_contributor_commit_count INTEGER NOT NULL, -- Highest individual count
  top_contributor_percentage FLOAT NOT NULL,    -- % of total commits by top contributor
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, snapshot_date)
);

CREATE INDEX idx_commit_snapshots_project_date ON commit_metrics_snapshots(project_id, snapshot_date DESC);
```

---

## Data Collection from GitLab API

### API Call 1: Get Recent Commits (Last 30 Days)

```
GET /projects/:id/repository/commits?since=2025-10-24T00:00:00Z&per_page=100
```

**Response includes:**
```json
[
  {
    "id": "a1b2c3d4",
    "short_id": "a1b2c3d4",
    "title": "Add user authentication feature",
    "author_name": "John Doe",
    "author_email": "john@example.com",
    "authored_date": "2025-11-20T10:30:00Z",
    "committed_date": "2025-11-20T10:30:00Z",
    "committer_name": "John Doe",
    "committer_email": "john@example.com",
    "stats": {
      "additions": 145,
      "deletions": 23,
      "total": 168
    }
  }
]
```

**Extract per commit:**
```javascript
// Commit count
total_commits_30d++

// Track unique committers (use email or author_name)
uniqueCommitters.add(commit.author_email)

// Aggregate stats
total_additions += commit.stats.additions
total_deletions += commit.stats.deletions

// Categorize commit size
totalChanges = commit.stats.additions + commit.stats.deletions
if (totalChanges < 10) {
  tiny_commits_count++
} else if (totalChanges < 100) {
  small_commits_count++
} else if (totalChanges < 500) {
  medium_commits_count++
} else if (totalChanges < 1000) {
  large_commits_count++
} else {
  huge_commits_count++
}

// Track contributor distribution
contributorCounts[commit.author_email] = (contributorCounts[commit.author_email] || 0) + 1
```

---

### API Call 2: Get Commit Diff Details (For Churn Analysis)

For each commit (or sample of recent 100):
```
GET /projects/:id/repository/commits/:commit_sha/diff
```

**Response:**
```json
[
  {
    "diff": "...",
    "new_path": "src/auth/login.js",
    "old_path": "src/auth/login.js",
    "a_mode": "100644",
    "b_mode": "100644",
    "new_file": false,
    "renamed_file": false,
    "deleted_file": false
  },
  {
    "diff": "...",
    "new_path": "src/utils/validator.ts",
    "old_path": "src/utils/validator.ts",
    "new_file": false,
    "renamed_file": false,
    "deleted_file": false
  }
]
```

**Track file modifications:**
```javascript
diffs.forEach(diff => {
  if (!diff.new_file && !diff.deleted_file) {
    filePath = diff.new_path
    fileModificationCounts[filePath] = (fileModificationCounts[filePath] || 0) + 1
    total_files_changed++
  }
})

// After processing all commits, identify high churn files
Object.keys(fileModificationCounts).forEach(file => {
  if (fileModificationCounts[file] > 5) {
    high_churn_files_count++
    total_churn_modifications += fileModificationCounts[file]
  }
})
```

---

## Metric Calculations

### Metric 1: Commit Frequency & Volume

**What it measures:** Development pace and commit patterns

**Data from snapshot:**
- `total_commits_7d`, `total_commits_30d`
- `unique_committers_7d`, `unique_committers_30d`
- `total_additions`, `total_deletions`
- Commit size distribution counts

**Calculations:**

```javascript
// Daily commit rate
dailyCommitRate = snapshot.total_commits_7d / 7
monthlyCommitRate = snapshot.total_commits_30d / 30

// Average commit size
avgLinesPerCommit = (snapshot.total_additions + snapshot.total_deletions) / snapshot.commits_analyzed
avgFilesPerCommit = snapshot.total_files_changed / snapshot.commits_analyzed

// Commit size distribution percentages
totalCommits = snapshot.tiny_commits_count + snapshot.small_commits_count + 
               snapshot.medium_commits_count + snapshot.large_commits_count + 
               snapshot.huge_commits_count

tinyPercent = (snapshot.tiny_commits_count / totalCommits) * 100
smallPercent = (snapshot.small_commits_count / totalCommits) * 100
mediumPercent = (snapshot.medium_commits_count / totalCommits) * 100
largePercent = (snapshot.large_commits_count / totalCommits) * 100
hugePercent = (snapshot.huge_commits_count / totalCommits) * 100

// Activity level
if (dailyCommitRate < 0.5) {
  activityLevel = "VERY_LOW"     // <0.5 commits/day = stagnation
} else if (dailyCommitRate < 2) {
  activityLevel = "LOW"          // 0.5-2 commits/day
} else if (dailyCommitRate < 5) {
  activityLevel = "NORMAL"       // 2-5 commits/day = healthy
} else if (dailyCommitRate < 10) {
  activityLevel = "HIGH"         // 5-10 commits/day
} else {
  activityLevel = "VERY_HIGH"    // >10 commits/day = possible automation
}

// Commit size health
if (tinyPercent > 60) {
  sizeHealth = "TOO_GRANULAR"    // Too many tiny commits
} else if (hugePercent > 20) {
  sizeHealth = "TOO_LARGE"       // Too many huge commits
} else if (mediumPercent > 40) {
  sizeHealth = "IDEAL"           // Good balance
} else {
  sizeHealth = "ACCEPTABLE"
}

// Contributor engagement
commitsPerContributor = snapshot.total_commits_30d / snapshot.unique_committers_30d
if (commitsPerContributor < 5) {
  engagement = "LOW"             // Contributors not very active
} else if (commitsPerContributor < 20) {
  engagement = "MODERATE"
} else {
  engagement = "HIGH"
}
```

**Example:**
```
total_commits_7d: 35
total_commits_30d: 145
unique_committers_7d: 5
unique_committers_30d: 8
total_additions: 12450
total_deletions: 3200
commits_analyzed: 145
total_files_changed: 580

tiny_commits_count: 25
small_commits_count: 80
medium_commits_count: 30
large_commits_count: 8
huge_commits_count: 2

Results:
- Daily rate: 35 / 7 = 5.0 commits/day → HIGH activity
- Avg lines/commit: (12450 + 3200) / 145 = 108 lines
- Avg files/commit: 580 / 145 = 4.0 files
- Small commits: (80 / 145) * 100 = 55.2% → ACCEPTABLE
- Commits per contributor: 145 / 8 = 18.1 → MODERATE engagement
```

**Quality indicators:**
- **1-2 commits/day:** Normal, healthy pace
- **5-10 commits/day:** High activity, good for active sprints
- **>20 commits/day:** Possible automated commits or excessive granularity
- **<0.5 commits/day:** Stagnation or slow progress

---

### Metric 2: Code Churn

**What it measures:** Files repeatedly modified or refactored

**Data from snapshot:**
- `files_modified_multiple_times` (JSONB)
- `high_churn_files_count`
- `total_churn_modifications`

**Calculations:**

```javascript
// Parse churn data
fileChurnMap = JSON.parse(snapshot.files_modified_multiple_times)
// Example: {"src/app.ts": 15, "lib/auth.js": 12, "config.json": 8}

// Analyze churn patterns
churnFiles = Object.entries(fileChurnMap)
  .filter(([file, count]) => count > 5)
  .sort((a, b) => b[1] - a[1])  // Sort by modification count desc

// Top churned files
top5ChurnedFiles = churnFiles.slice(0, 5)

// Average modifications per high-churn file
if (snapshot.high_churn_files_count > 0) {
  avgModificationsPerChurnFile = snapshot.total_churn_modifications / snapshot.high_churn_files_count
}

// Churn severity
churnRate = (snapshot.high_churn_files_count / snapshot.total_files_changed) * 100

if (churnRate < 5) {
  churnSeverity = "LOW"          // <5% of files have high churn
} else if (churnRate < 15) {
  churnSeverity = "MODERATE"     // 5-15% churn rate
} else if (churnRate < 30) {
  churnSeverity = "HIGH"         // 15-30% churn = unstable modules
} else {
  churnSeverity = "CRITICAL"     // >30% = serious refactoring needed
}

// Stability index
stabilityIndex = 100 - churnRate  // Higher = more stable codebase
```

**Example:**
```
files_modified_multiple_times: {
  "src/auth/login.js": 15,
  "src/utils/validator.ts": 12,
  "src/api/handler.js": 9,
  "config/settings.json": 8,
  "lib/database.js": 7
}
high_churn_files_count: 5
total_churn_modifications: 51
total_files_changed: 580

Results:
- Churn rate: (5 / 580) * 100 = 0.86% → LOW (healthy)
- Avg mods per churn file: 51 / 5 = 10.2 modifications
- Stability index: 100 - 0.86 = 99.14% → EXCELLENT
- Top churned: src/auth/login.js (15 times) → Needs attention

If churn rate was 20%:
- HIGH churn severity → Indicates unstable architecture
- Files like "core/engine.js" modified 50+ times in 30 days
- Suggests: Poor initial design, frequent bugs, or active refactoring
```

**Why it matters:**
- Persistent churn flags unstable modules or poor implementation
- 50% code churn in core module = likely confusing/unstable code
- High churn files are bug-prone and need architectural review

**Quality indicators:**
- **<5% churn rate:** Stable codebase
- **5-15% churn:** Moderate, acceptable for active features
- **15-30% churn:** High instability, refactoring needed
- **>30% churn:** Critical, architecture problems

---

### Metric 3: Contributor Distribution (Bus Factor)

**What it measures:** Distribution of commits among team members

**Data from snapshot:**
- `contributor_commit_counts` (JSONB)
- `top_contributor_commit_count`
- `top_contributor_percentage`

**Calculations:**

```javascript
// Parse contributor data
contributorMap = JSON.parse(snapshot.contributor_commit_counts)
// Example: {"user_123": 145, "user_456": 89, "user_789": 34, "user_101": 22}

// Sort by commit count
contributors = Object.entries(contributorMap)
  .sort((a, b) => b[1] - a[1])

totalCommits = contributors.reduce((sum, [user, count]) => sum + count, 0)

// Calculate individual percentages
contributorStats = contributors.map(([userId, commitCount]) => ({
  userId,
  commitCount,
  percentage: (commitCount / totalCommits) * 100
}))

// Top N contributors
top1Percentage = contributorStats[0].percentage
top3Percentage = contributorStats.slice(0, 3)
  .reduce((sum, c) => sum + c.percentage, 0)
top5Percentage = contributorStats.slice(0, 5)
  .reduce((sum, c) => sum + c.percentage, 0)

// Bus Factor (minimum contributors needed for 50% of commits)
busFactor = 0
cumulativePercentage = 0
for (let i = 0; i < contributorStats.length; i++) {
  cumulativePercentage += contributorStats[i].percentage
  busFactor++
  if (cumulativePercentage >= 50) break
}

// Distribution quality
if (top1Percentage > 70) {
  distribution = "CRITICAL"      // 1 person = 70%+ commits
  risk = "VERY_HIGH"             // Extreme knowledge silo
} else if (top1Percentage > 50) {
  distribution = "POOR"          // 1 person = 50-70% commits
  risk = "HIGH"                  // Single point of failure
} else if (top1Percentage > 35) {
  distribution = "UNBALANCED"    // 1 person = 35-50% commits
  risk = "MODERATE"
} else if (top1Percentage > 25) {
  distribution = "ACCEPTABLE"    // 1 person = 25-35% commits
  risk = "LOW"
} else {
  distribution = "WELL_BALANCED" // Well distributed
  risk = "VERY_LOW"
}

// Bus Factor interpretation
if (busFactor === 1) {
  busFactorRating = "CRITICAL"   // Project dies if 1 person leaves
} else if (busFactor === 2) {
  busFactorRating = "POOR"       // Very vulnerable
} else if (busFactor <= 3) {
  busFactorRating = "ACCEPTABLE" // Somewhat resilient
} else {
  busFactorRating = "GOOD"       // Knowledge well distributed
}

// Gini coefficient (inequality measure, 0=perfect equality, 1=total inequality)
// Higher Gini = more unequal distribution
commitCounts = contributors.map(([_, count]) => count).sort((a, b) => a - b)
n = commitCounts.length
sumOfAbsoluteDifferences = 0
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    sumOfAbsoluteDifferences += Math.abs(commitCounts[i] - commitCounts[j])
  }
}
giniCoefficient = sumOfAbsoluteDifferences / (2 * n * n * (totalCommits / n))

if (giniCoefficient < 0.3) {
  equality = "VERY_EQUAL"        // Well distributed
} else if (giniCoefficient < 0.5) {
  equality = "MODERATE"
} else if (giniCoefficient < 0.7) {
  equality = "UNEQUAL"
} else {
  equality = "HIGHLY_UNEQUAL"    // Knowledge concentration
}
```

**Example 1: Poor Distribution**
```
contributor_commit_counts: {
  "user_123": 232,  // 80% of commits
  "user_456": 35,   // 12%
  "user_789": 15,   // 5%
  "user_101": 8     // 3%
}
total_commits_30d: 290
top_contributor_percentage: 80.0

Results:
- Top contributor: 80% of commits → CRITICAL
- Top 3 contributors: 97% of commits
- Bus factor: 1 (one person for 80%) → CRITICAL
- Risk: VERY_HIGH (project depends on 1 person)
- Gini coefficient: ~0.75 → HIGHLY_UNEQUAL
- Recommendation: Redistribute work, pair programming, knowledge sharing
```

**Example 2: Good Distribution**
```
contributor_commit_counts: {
  "user_123": 48,   // 24%
  "user_456": 42,   // 21%
  "user_789": 38,   // 19%
  "user_101": 35,   // 17.5%
  "user_202": 30,   // 15%
  "user_303": 7     // 3.5%
}
total_commits_30d: 200
top_contributor_percentage: 24.0

Results:
- Top contributor: 24% of commits → WELL_BALANCED
- Top 3 contributors: 64% of commits
- Bus factor: 3 (need 3 people for 64%) → ACCEPTABLE
- Risk: LOW
- Gini coefficient: ~0.28 → VERY_EQUAL
- Status: Healthy distribution
```

**Why it matters:**
- Prevents knowledge silos
- If one person leaves, project continuity at risk
- 80% commits by 1 dev = need to share knowledge or redistribute
- Bus factor of 1 = project vulnerable to single departure

**Quality indicators:**
- **Top contributor >70%:** Critical risk, extreme dependency
- **Top contributor 50-70%:** Poor, single point of failure
- **Top contributor 35-50%:** Unbalanced, needs improvement
- **Top contributor 25-35%:** Acceptable
- **Top contributor <25%:** Well balanced, healthy team

---

## SQL Queries

### Query 1: Get Current Commit Metrics

```sql
SELECT 
  -- Metric 1: Frequency & Volume
  total_commits_7d,
  total_commits_30d,
  ROUND(total_commits_7d::FLOAT / 7, 1) as daily_commit_rate,
  unique_committers_7d,
  unique_committers_30d,
  
  -- Commit size
  ROUND((total_additions + total_deletions)::FLOAT / NULLIF(commits_analyzed, 0), 1) as avg_lines_per_commit,
  ROUND(total_files_changed::FLOAT / NULLIF(commits_analyzed, 0), 1) as avg_files_per_commit,
  
  -- Size distribution
  ROUND((tiny_commits_count::FLOAT / NULLIF(commits_analyzed, 0)) * 100, 1) as tiny_commits_percent,
  ROUND((small_commits_count::FLOAT / NULLIF(commits_analyzed, 0)) * 100, 1) as small_commits_percent,
  ROUND((medium_commits_count::FLOAT / NULLIF(commits_analyzed, 0)) * 100, 1) as medium_commits_percent,
  ROUND((large_commits_count::FLOAT / NULLIF(commits_analyzed, 0)) * 100, 1) as large_commits_percent,
  ROUND((huge_commits_count::FLOAT / NULLIF(commits_analyzed, 0)) * 100, 1) as huge_commits_percent,
  
  -- Metric 2: Code Churn
  high_churn_files_count,
  ROUND((high_churn_files_count::FLOAT / NULLIF(total_files_changed, 0)) * 100, 1) as churn_rate_percent,
  ROUND(total_churn_modifications::FLOAT / NULLIF(high_churn_files_count, 0), 1) as avg_mods_per_churn_file,
  files_modified_multiple_times as churn_details,
  
  -- Metric 3: Contributor Distribution
  top_contributor_commit_count,
  top_contributor_percentage,
  ROUND(total_commits_30d::FLOAT / NULLIF(unique_committers_30d, 0), 1) as commits_per_contributor,
  contributor_commit_counts as contributor_details,
  
  snapshot_date
FROM commit_metrics_snapshots
WHERE project_id = $1
ORDER BY snapshot_date DESC
LIMIT 1;
```

---

### Query 2: Get 30-Day Trend History

```sql
SELECT 
  snapshot_date,
  total_commits_7d,
  ROUND(total_commits_7d::FLOAT / 7, 1) as daily_rate,
  unique_committers_7d,
  ROUND((high_churn_files_count::FLOAT / NULLIF(total_files_changed, 0)) * 100, 1) as churn_rate,
  top_contributor_percentage
FROM commit_metrics_snapshots
WHERE project_id = $1
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY snapshot_date ASC;
```

---

### Query 3: Get Top Churned Files (From Latest Snapshot)

```sql
WITH latest_snapshot AS (
  SELECT files_modified_multiple_times
  FROM commit_metrics_snapshots
  WHERE project_id = $1
  ORDER BY snapshot_date DESC
  LIMIT 1
),
churn_data AS (
  SELECT 
    jsonb_each.key as file_path,
    jsonb_each.value::text::integer as modification_count
  FROM latest_snapshot,
  jsonb_each(latest_snapshot.files_modified_multiple_times)
)
SELECT 
  file_path,
  modification_count,
  CASE 
    WHEN modification_count > 15 THEN 'CRITICAL'
    WHEN modification_count > 10 THEN 'HIGH'
    WHEN modification_count > 5 THEN 'MODERATE'
    ELSE 'LOW'
  END as churn_severity
FROM churn_data
WHERE modification_count > 5
ORDER BY modification_count DESC
LIMIT 20;
```

---

### Query 4: Get Contributor Distribution Details

```sql
WITH latest_snapshot AS (
  SELECT contributor_commit_counts, total_commits_30d
  FROM commit_metrics_snapshots
  WHERE project_id = $1
  ORDER BY snapshot_date DESC
  LIMIT 1
),
contributor_data AS (
  SELECT 
    jsonb_each.key as user_id,
    jsonb_each.value::text::integer as commit_count,
    latest_snapshot.total_commits_30d
  FROM latest_snapshot,
  jsonb_each(latest_snapshot.contributor_commit_counts)
)
SELECT 
  user_id,
  commit_count,
  ROUND((commit_count::FLOAT / total_commits_30d) * 100, 1) as percentage,
  RANK() OVER (ORDER BY commit_count DESC) as rank
FROM contributor_data
ORDER BY commit_count DESC;
```

---

### Query 5: Calculate Bus Factor

```sql
WITH latest_snapshot AS (
  SELECT contributor_commit_counts, total_commits_30d
  FROM commit_metrics_snapshots
  WHERE project_id = $1
  ORDER BY snapshot_date DESC
  LIMIT 1
),
contributor_data AS (
  SELECT 
    jsonb_each.key as user_id,
    jsonb_each.value::text::integer as commit_count,
    latest_snapshot.total_commits_30d
  FROM latest_snapshot,
  jsonb_each(latest_snapshot.contributor_commit_counts)
),
ranked_contributors AS (
  SELECT 
    user_id,
    commit_count,
    ROUND((commit_count::FLOAT / total_commits_30d) * 100, 1) as percentage,
    SUM(commit_count) OVER (ORDER BY commit_count DESC) as cumulative_commits,
    total_commits_30d
  FROM contributor_data
)
SELECT 
  COUNT(*) as bus_factor,
  STRING_AGG(user_id, ', ' ORDER BY commit_count DESC) as critical_contributors
FROM ranked_contributors
WHERE (cumulative_commits::FLOAT / total_commits_30d) * 100 <= 50;
```

---

## Week-over-Week Trend Calculation

```sql
WITH current_snapshot AS (
  SELECT * FROM commit_metrics_snapshots
  WHERE project_id = $1
  ORDER BY snapshot_date DESC
  LIMIT 1
),
previous_snapshot AS (
  SELECT * FROM commit_metrics_snapshots
  WHERE project_id = $1
    AND snapshot_date = (SELECT snapshot_date FROM current_snapshot) - INTERVAL '7 days'
  LIMIT 1
)
SELECT 
  -- Commit frequency change
  c.total_commits_7d as current_commits,
  p.total_commits_7d as previous_commits,
  c.total_commits_7d - p.total_commits_7d as commit_change,
  ROUND(((c.total_commits_7d - p.total_commits_7d)::FLOAT / NULLIF(p.total_commits_7d, 0)) * 100, 1) as commit_change_percent,
  
  -- Churn rate change
  ROUND((c.high_churn_files_count::FLOAT / NULLIF(c.total_files_changed, 0)) * 100, 1) as current_churn_rate,
  ROUND((p.high_churn_files_count::FLOAT / NULLIF(p.total_files_changed, 0)) * 100, 1) as previous_churn_rate,
  
  -- Bus factor change
  c.top_contributor_percentage as current_top_contributor_pct,
  p.top_contributor_percentage as previous_top_contributor_pct,
  ROUND(c.top_contributor_percentage - p.top_contributor_percentage, 1) as concentration_change
  
FROM current_snapshot c
LEFT JOIN previous_snapshot p ON true;
```

---

## Storage Requirements

**Per project for 30 days:**
- Commit metrics: ~3-4 KB (includes JSONB for file churn and contributor data)
- 100 projects, 30 days: ~300-400 KB
- 100 projects, 90 days: ~900 KB - 1.2 MB

**JSONB Storage:**
- `files_modified_multiple_times`: ~500 bytes (top 50 churned files)
- `contributor_commit_counts`: ~200 bytes (up to 20 contributors)

---

## Implementation Notes

### Data Collection Strategy

1. **Fetch commits:** Get all commits from last 30 days via GitLab API
2. **Analyze diffs:** Sample recent 100 commits for detailed file-level churn
3. **Aggregate stats:** Calculate totals, averages, distributions
4. **Store snapshot:** Insert daily row with all metrics

### Performance Optimization

- **Pagination:** Use `per_page=100` and iterate through pages
- **Sampling:** For large repos (>500 commits/day), analyze sample of commits
- **Caching:** Cache commit data for 24 hours
- **Incremental:** Only fetch commits since last sync (`since` parameter)

### Alert Thresholds

- **Stagnation:** <0.5 commits/day for 7+ days
- **High churn:** >20% churn rate sustained for 14+ days
- **Bus factor:** Top contributor >70% for 14+ days
- **Huge commits:** >30% of commits are huge (>1000 lines)

---

## Benefits Summary

✅ **Tracks development velocity** - Identifies stagnation or excessive activity  
✅ **Identifies unstable code** - High churn files need refactoring  
✅ **Prevents knowledge silos** - Bus factor alerts for team risk  
✅ **Commit quality insights** - Size distribution shows commit hygiene  
✅ **Historical trends** - 30-90 day view of contribution patterns  
✅ **Fast queries** - Pre-aggregated data, no API calls during display  
✅ **Minimal storage** - ~3-4 KB per project for 30 days
