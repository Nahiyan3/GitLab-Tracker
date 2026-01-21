# API Reference

Complete API documentation for GitLab Analytics backend. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:5000/api`

---

## Table of Contents

1. [System Health](#system-health)
2. [GitLab Connection](#gitlab-connection)
3. [Projects](#projects)
4. [Tracking](#tracking)
5. [DORA Metrics](#dora-metrics)
6. [Issue Metrics](#issue-metrics)
7. [Merge Request Metrics](#merge-request-metrics)
8. [Commit Metrics](#commit-metrics)
9. [SonarQube Metrics](#sonarqube-metrics)
10. [Health Scores](#health-scores)
11. [Milestone Metrics](#milestone-metrics)
12. [AI Insights](#ai-insights)

---

## System Health

### Check API Health

**Endpoint:** `GET /api/health`

**Description:** Check if the API server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

## GitLab Connection

### Verify GitLab Connection

**Endpoint:** `GET /api/gitlab/verify`

**Description:** Verify if the GitLab API connection is working with the configured token.

**Response:**
```json
{
  "connected": true
}
```

**Error Response:**
```json
{
  "error": "Failed to verify GitLab connection"
}
```

---

## Projects

### Get All Projects from Database

**Endpoint:** `GET /api/projects/db`

**Description:** Fetch all projects from the database (cached data, no GitLab API calls).

**Response:**
```json
[
  {
    "id": 12345,
    "name": "My Project",
    "description": "Project description",
    "web_url": "https://gitlab.com/user/my-project",
    "default_branch": "main",
    "visibility": "private",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_activity_at": "2024-12-01T00:00:00.000Z",
    "is_tracked": true,
    "namespace": {
      "id": 123,
      "name": "User",
      "path": "user",
      "kind": "user"
    }
  }
]
```

### Get Project by ID

**Endpoint:** `GET /api/projects/:id`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Fetch a single project by its ID from the database.

**Response:**
```json
{
  "id": 12345,
  "name": "My Project",
  "description": "Project description",
  "web_url": "https://gitlab.com/user/my-project",
  "default_branch": "main",
  "visibility": "private",
  "is_tracked": true,
  "namespace": {
    "id": 123,
    "name": "User",
    "path": "user"
  }
}
```

### Get Dashboard Statistics

**Endpoint:** `GET /api/projects/dashboard-stats`

**Description:** Get aggregated statistics for the dashboard.

**Response:**
```json
{
  "totalProjects": 50,
  "trackedProjects": 10,
  "projectsNeedingAttention": 3,
  "latestScores": [
    {
      "project_id": 12345,
      "project_name": "My Project",
      "combined_score": 85.5,
      "issue_score": 90,
      "mr_score": 85,
      "commit_score": 80
    }
  ]
}
```

### Sync Projects from GitLab

**Endpoint:** `POST /api/projects/sync`

**Description:** Sync all accessible projects from GitLab to the database. This updates the project registry.

**Response:**
```json
{
  "success": true,
  "message": "Projects synced successfully",
  "count": 50
}
```

### Sync Single Project

**Endpoint:** `POST /api/projects/sync/:id`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Sync a specific project from GitLab to the database.

**Response:**
```json
{
  "success": true,
  "project": {
    "id": 12345,
    "name": "My Project"
  }
}
```

### Track Project

**Endpoint:** `POST /api/projects/track`

**Description:** Mark a project as tracked for regular monitoring.

**Request Body:**
```json
{
  "projectId": 12345
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project tracked successfully"
}
```

### Untrack Project

**Endpoint:** `PATCH /api/projects/untrack/:id`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Remove a project from tracking.

**Response:**
```json
{
  "success": true,
  "message": "Project untracked successfully"
}
```

### Refresh Single Project

**Endpoint:** `POST /api/projects/refresh/:id`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Create a new snapshot for a tracked project by fetching fresh data from GitLab and SonarQube.

**Response:**
```json
{
  "success": true,
  "message": "Project refreshed successfully",
  "snapshot": {
    "project_id": 12345,
    "created_at": "2024-12-01T10:00:00.000Z"
  }
}
```

### Refresh All Tracked Projects

**Endpoint:** `POST /api/projects/refresh-all`

**Description:** Create new snapshots for all tracked projects.

**Response:**
```json
{
  "success": true,
  "message": "All projects refreshed successfully",
  "count": 10
}
```

### Get Project Groups

**Endpoint:** `GET /api/projects/groups`

**Description:** Get all unique project groups/namespaces.

**Response:**
```json
[
  {
    "id": 123,
    "name": "Development Team",
    "path": "dev-team",
    "kind": "group"
  }
]
```

### Get Project Members

**Endpoint:** `GET /api/projects/:id/members`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Get all members of a project.

**Response:**
```json
[
  {
    "id": 1,
    "username": "john.doe",
    "name": "John Doe",
    "access_level": 40,
    "access_level_description": "Maintainer"
  }
]
```

---

## Tracking

### Get Tracked Projects

**Endpoint:** `GET /api/tracking`

**Description:** Get all tracked projects with their latest snapshots.

**Response:**
```json
[
  {
    "project_id": 12345,
    "project_name": "My Project",
    "is_tracked": true,
    "last_snapshot_at": "2024-12-01T10:00:00.000Z",
    "issue_health_score": 85,
    "mr_health_score": 90,
    "commit_health_score": 88,
    "combined_score": 87.67
  }
]
```

### Refresh All Tracked Projects

**Endpoint:** `POST /api/tracking/refresh-all`

**Description:** Create new snapshots for all tracked projects.

**Response:**
```json
{
  "success": true,
  "message": "All tracked projects refreshed",
  "count": 10
}
```

### Refresh Single Tracked Project

**Endpoint:** `POST /api/tracking/refresh/:id`

**Parameters:**
- `id` (path) - GitLab project ID

**Description:** Create a new snapshot for a specific tracked project.

**Response:**
```json
{
  "success": true,
  "message": "Project refreshed successfully"
}
```

---

## DORA Metrics

DORA (DevOps Research and Assessment) metrics track deployment frequency, lead time, change failure rate, and time to restore service.

### Create Deployment Record

**Endpoint:** `POST /api/projects/:id/dora/deployment`

**Parameters:**
- `id` (path) - Project ID

**Request Body:**
```json
{
  "deployment_id": "deploy-001",
  "version": "v1.2.3",
  "environment": "production",
  "deployment_timestamp": "2024-12-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deployment logged successfully",
  "data": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "project_id": 12345,
    "deployment_id": "deploy-001",
    "version": "v1.2.3",
    "environment": "production",
    "deployment_timestamp": "2024-12-01T10:00:00.000Z"
  }
}
```

### Create Lead Time Record

**Endpoint:** `POST /api/projects/:id/dora/leadtime`

**Parameters:**
- `id` (path) - Project ID

**Request Body:**
```json
{
  "change_id": "MR-123",
  "merged_timestamp": "2024-12-01T08:00:00Z",
  "deployed_timestamp": "2024-12-01T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead time change logged successfully",
  "data": {
    "uuid": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
    "project_id": 12345,
    "change_id": "MR-123",
    "merged_timestamp": "2024-12-01T08:00:00.000Z",
    "deployed_timestamp": "2024-12-01T10:00:00.000Z",
    "lead_time_hours": 2.0
  }
}
```

### Create Change Failure Record

**Endpoint:** `POST /api/projects/:id/dora/failure`

**Parameters:**
- `id` (path) - Project ID

**Request Body:**
```json
{
  "deployment_id": "deploy-001",
  "deployment_timestamp": "2024-12-01T10:00:00Z",
  "has_incident": true,
  "remediation_type": "hotfix"
}
```

**Allowed `remediation_type` values:**
- `none` - No incident
- `rollback` - Deployment was rolled back
- `hotfix` - Required a hotfix
- `emergency` - Emergency patch

**Response:**
```json
{
  "success": true,
  "message": "Change failure rate logged successfully",
  "data": {
    "uuid": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
    "deployment_id": "deploy-001",
    "has_incident": true,
    "remediation_type": "hotfix",
    "is_failure": true
  }
}
```

### Create Time to Restore Record

**Endpoint:** `POST /api/projects/:id/dora/restore`

**Parameters:**
- `id` (path) - Project ID

**Request Body:**
```json
{
  "incident_id": "INC-456",
  "start_time": "2024-12-01T10:00:00Z",
  "end_time": "2024-12-01T12:30:00Z",
  "description": "Database connection failure"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time to restore service logged successfully",
  "data": {
    "uuid": "d4e5f6g7-h8i9-0123-defg-hi4567890123",
    "incident_id": "INC-456",
    "start_time": "2024-12-01T10:00:00.000Z",
    "end_time": "2024-12-01T12:30:00.000Z",
    "restore_time_hours": 2.5,
    "description": "Database connection failure"
  }
}
```

### Get Deployments

**Endpoint:** `GET /api/projects/:id/dora/deployment`

**Parameters:**
- `id` (path) - Project ID
- `startDate` (query, optional) - Filter start date (ISO 8601)
- `endDate` (query, optional) - Filter end date (ISO 8601)
- `environment` (query, optional) - Filter by environment

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "deployment_id": "deploy-001",
      "version": "v1.2.3",
      "environment": "production",
      "deployment_timestamp": "2024-12-01T10:00:00.000Z",
      "created_at": "2024-12-01T10:05:00.000Z"
    }
  ]
}
```

### Search Deployments

**Endpoint:** `GET /api/projects/:id/dora/deployment/search`

**Parameters:**
- `id` (path) - Project ID
- `prefix` (query) - Search prefix for deployment_id

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "deployment_id": "deploy-001",
      "version": "v1.2.3",
      "deployment_timestamp": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Get Lead Time Changes

**Endpoint:** `GET /api/projects/:id/dora/leadtime`

**Parameters:**
- `id` (path) - Project ID
- `startDate` (query, optional) - Filter start date
- `endDate` (query, optional) - Filter end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
      "change_id": "MR-123",
      "merged_timestamp": "2024-12-01T08:00:00.000Z",
      "deployed_timestamp": "2024-12-01T10:00:00.000Z",
      "lead_time_hours": 2.0
    }
  ]
}
```

### Get Change Failure Rates

**Endpoint:** `GET /api/projects/:id/dora/failure`

**Parameters:**
- `id` (path) - Project ID
- `startDate` (query, optional) - Filter start date
- `endDate` (query, optional) - Filter end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
      "deployment_id": "deploy-001",
      "deployment_timestamp": "2024-12-01T10:00:00.000Z",
      "has_incident": true,
      "remediation_type": "hotfix",
      "is_failure": true
    }
  ]
}
```

### Get Time to Restore Services

**Endpoint:** `GET /api/projects/:id/dora/restore`

**Parameters:**
- `id` (path) - Project ID
- `startDate` (query, optional) - Filter start date
- `endDate` (query, optional) - Filter end date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "uuid": "d4e5f6g7-h8i9-0123-defg-hi4567890123",
      "incident_id": "INC-456",
      "start_time": "2024-12-01T10:00:00.000Z",
      "end_time": "2024-12-01T12:30:00.000Z",
      "restore_time_hours": 2.5,
      "description": "Database connection failure"
    }
  ]
}
```

### Get DORA Metrics Summary

**Endpoint:** `GET /api/projects/:id/dora/summary`

**Parameters:**
- `id` (path) - Project ID
- `startDate` (query, optional) - Filter start date
- `endDate` (query, optional) - Filter end date

**Description:** Get aggregated DORA metrics for a project.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "deployment_frequency": {
      "total_deployments": 45,
      "production_deployments": 30,
      "deployments_per_day": 1.5,
      "deployments_per_week": 10.5,
      "deployments_per_month": 45
    },
    "lead_time": {
      "total_changes": 50,
      "avg_lead_time_hours": 24.5,
      "median_lead_time_hours": 18.0,
      "min_lead_time_hours": 2.0,
      "max_lead_time_hours": 120.0
    },
    "change_failure_rate": {
      "total_deployments": 45,
      "failed_deployments": 3,
      "failure_rate_percent": 6.67
    },
    "time_to_restore": {
      "total_incidents": 3,
      "avg_restore_time_hours": 2.5,
      "median_restore_time_hours": 2.0,
      "min_restore_time_hours": 1.0,
      "max_restore_time_hours": 5.0
    }
  }
}
```

### Get DORA Trends

**Endpoint:** `GET /api/projects/:id/dora/trends`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days to include (default: 30)

**Description:** Get weekly DORA metrics trends over time.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "week_start": "2024-11-25",
      "week_end": "2024-12-01",
      "deployment_count": 7,
      "avg_lead_time_hours": 18.5,
      "failure_rate_percent": 5.0,
      "avg_restore_time_hours": 2.0
    }
  ]
}
```

### Get Weekly Snapshots

**Endpoint:** `GET /api/projects/:id/dora/weekly-snapshots`

**Parameters:**
- `id` (path) - Project ID

**Description:** Get stored weekly DORA snapshots.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "snapshot_id": "snap-001",
      "week_start": "2024-11-25",
      "week_end": "2024-12-01",
      "deployment_count": 7,
      "avg_lead_time_hours": 18.5,
      "created_at": "2024-12-02T00:00:00.000Z"
    }
  ]
}
```

### Manual Capture Last Week

**Endpoint:** `POST /api/dora/capture-last-week`

**Description:** Manually trigger snapshot capture for last week's DORA metrics (admin/testing).

**Response:**
```json
{
  "success": true,
  "message": "Last week snapshots captured",
  "count": 10
}
```

### Delete Deployment Record

**Endpoint:** `DELETE /api/projects/:id/dora/deployment/:uuid`

**Parameters:**
- `id` (path) - Project ID
- `uuid` (path) - Deployment UUID

**Response:**
```json
{
  "success": true,
  "message": "Deployment deleted successfully"
}
```

### Delete Lead Time Record

**Endpoint:** `DELETE /api/projects/:id/dora/leadtime/:uuid`

**Parameters:**
- `id` (path) - Project ID
- `uuid` (path) - Lead time record UUID

**Response:**
```json
{
  "success": true,
  "message": "Lead time record deleted successfully"
}
```

### Delete Change Failure Record

**Endpoint:** `DELETE /api/projects/:id/dora/failure/:uuid`

**Parameters:**
- `id` (path) - Project ID
- `uuid` (path) - Change failure record UUID

**Response:**
```json
{
  "success": true,
  "message": "Change failure record deleted successfully"
}
```

### Delete Time to Restore Record

**Endpoint:** `DELETE /api/projects/:id/dora/restore/:uuid`

**Parameters:**
- `id` (path) - Project ID
- `uuid` (path) - Time to restore record UUID

**Response:**
```json
{
  "success": true,
  "message": "Time to restore record deleted successfully"
}
```

---

## Issue Metrics

### Refresh Issue Metrics

**Endpoint:** `POST /api/projects/:id/issue-metrics/refresh`

**Parameters:**
- `id` (path) - Project ID

**Description:** Fetch latest issue data from GitLab and calculate health metrics.

**Response:**
```json
{
  "success": true,
  "message": "Issue metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "total_issues": 150,
    "open_issues": 45,
    "closed_issues": 105,
    "avg_age_days": 12.5,
    "overdue_issues": 8,
    "health_score": 85.5,
    "created_at": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Issue Metrics

**Endpoint:** `GET /api/projects/:id/issue-metrics`

**Parameters:**
- `id` (path) - Project ID

**Description:** Get current issue metrics for a project.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "total_issues": 150,
    "open_issues": 45,
    "closed_issues": 105,
    "avg_age_days": 12.5,
    "median_age_days": 8.0,
    "overdue_issues": 8,
    "critical_issues": 3,
    "high_priority_issues": 12,
    "health_score": 85.5,
    "created_at": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Issue Metrics Trends

**Endpoint:** `GET /api/projects/:id/issue-metrics/trends`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 7)

**Description:** Get trend comparison between current and previous period.

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "open_issues": 45,
      "health_score": 85.5
    },
    "previous": {
      "open_issues": 50,
      "health_score": 82.0
    },
    "change": {
      "open_issues": -5,
      "health_score": 3.5
    }
  }
}
```

### Get Issue Metrics History

**Endpoint:** `GET /api/projects/:id/issue-metrics/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Description:** Get historical issue metrics over time.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "open_issues": 45,
      "closed_issues": 105,
      "health_score": 85.5
    },
    {
      "date": "2024-11-30",
      "open_issues": 48,
      "closed_issues": 102,
      "health_score": 84.2
    }
  ]
}
```

---

## Merge Request Metrics

### Refresh MR Metrics

**Endpoint:** `POST /api/projects/:id/mr-metrics/refresh`

**Parameters:**
- `id` (path) - Project ID

**Description:** Fetch latest merge request data from GitLab and calculate metrics.

**Response:**
```json
{
  "success": true,
  "message": "MR metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "total_mrs": 200,
    "open_mrs": 15,
    "merged_mrs": 175,
    "avg_time_to_merge_hours": 48.5,
    "health_score": 88.0,
    "created_at": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get MR Metrics

**Endpoint:** `GET /api/projects/:id/mr-metrics`

**Parameters:**
- `id` (path) - Project ID

**Description:** Get current merge request metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "total_mrs": 200,
    "open_mrs": 15,
    "merged_mrs": 175,
    "closed_mrs": 10,
    "avg_time_to_merge_hours": 48.5,
    "median_time_to_merge_hours": 36.0,
    "approval_rate_percent": 95.0,
    "health_score": 88.0
  }
}
```

### Get MR Metrics Trends

**Endpoint:** `GET /api/projects/:id/mr-metrics/trends`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "current": {
      "open_mrs": 15,
      "avg_time_to_merge_hours": 48.5,
      "health_score": 88.0
    },
    "previous": {
      "open_mrs": 18,
      "avg_time_to_merge_hours": 52.0,
      "health_score": 85.5
    }
  }
}
```

### Get MR Metrics History

**Endpoint:** `GET /api/projects/:id/mr-metrics/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "open_mrs": 15,
      "merged_mrs": 175,
      "health_score": 88.0
    }
  ]
}
```

---

## Commit Metrics

### Refresh Commit Metrics

**Endpoint:** `POST /api/projects/:id/commit-metrics/refresh`

**Parameters:**
- `id` (path) - Project ID

**Description:** Fetch latest commit data from GitLab and calculate metrics.

**Response:**
```json
{
  "success": true,
  "message": "Commit metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "total_commits": 1500,
    "commits_last_30_days": 85,
    "avg_commits_per_day": 2.83,
    "unique_contributors": 8,
    "health_score": 82.5
  }
}
```

### Get Commit Metrics

**Endpoint:** `GET /api/projects/:id/commit-metrics`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "total_commits": 1500,
    "commits_last_7_days": 20,
    "commits_last_30_days": 85,
    "avg_commits_per_day": 2.83,
    "unique_contributors": 8,
    "health_score": 82.5
  }
}
```

### Get Commit Metrics History

**Endpoint:** `GET /api/projects/:id/commit-metrics/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "total_commits": 1500,
      "commits_last_30_days": 85,
      "health_score": 82.5
    }
  ]
}
```

---

## SonarQube Metrics

### Maintainability Metrics

#### Refresh Maintainability Metrics

**Endpoint:** `POST /api/projects/:id/sonarqube/maintainability/refresh`

**Parameters:**
- `id` (path) - Project ID

**Description:** Fetch latest code maintainability metrics from SonarQube.

**Response:**
```json
{
  "success": true,
  "message": "Maintainability metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "code_smells": 45,
    "technical_debt_minutes": 1200,
    "maintainability_rating": "A",
    "health_score": 90.0
  }
}
```

#### Get Maintainability Metrics

**Endpoint:** `GET /api/projects/:id/sonarqube/maintainability`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "code_smells": 45,
    "technical_debt_minutes": 1200,
    "technical_debt_ratio": 2.5,
    "maintainability_rating": "A",
    "sqale_index": 1200,
    "health_score": 90.0
  }
}
```

#### Get Maintainability Metrics History

**Endpoint:** `GET /api/projects/:id/sonarqube/maintainability/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "code_smells": 45,
      "technical_debt_minutes": 1200,
      "health_score": 90.0
    }
  ]
}
```

### Reliability Metrics

#### Refresh Reliability Metrics

**Endpoint:** `POST /api/projects/:id/sonarqube/reliability/refresh`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "message": "Reliability metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "bugs": 8,
    "reliability_rating": "B",
    "health_score": 85.0
  }
}
```

#### Get Reliability Metrics

**Endpoint:** `GET /api/projects/:id/sonarqube/reliability`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "bugs": 8,
    "reliability_rating": "B",
    "reliability_remediation_effort_minutes": 240,
    "health_score": 85.0
  }
}
```

#### Get Reliability Metrics History

**Endpoint:** `GET /api/projects/:id/sonarqube/reliability/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "bugs": 8,
      "reliability_rating": "B",
      "health_score": 85.0
    }
  ]
}
```

### Security Metrics

#### Refresh Security Metrics

**Endpoint:** `POST /api/projects/:id/sonarqube/security/refresh`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "message": "Security metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "vulnerabilities": 3,
    "security_rating": "A",
    "security_hotspots": 5,
    "health_score": 92.0
  }
}
```

#### Get Security Metrics

**Endpoint:** `GET /api/projects/:id/sonarqube/security`

**Parameters:**
- `id` (path) - Project ID

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "vulnerabilities": 3,
    "security_rating": "A",
    "security_hotspots": 5,
    "security_hotspots_reviewed_percent": 80.0,
    "security_remediation_effort_minutes": 120,
    "health_score": 92.0
  }
}
```

#### Get Security Metrics History

**Endpoint:** `GET /api/projects/:id/sonarqube/security/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-01",
      "vulnerabilities": 3,
      "security_rating": "A",
      "health_score": 92.0
    }
  ]
}
```

---

## Health Scores

### Get Health Score History

**Endpoint:** `GET /api/projects/:id/health-scores/history`

**Parameters:**
- `id` (path) - Project ID
- `days` (query, optional) - Number of days (default: 30)

**Description:** Get combined health score trends across all 6 metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "issue_metrics": [
      { "date": "2024-12-01", "health_score": 85.5 },
      { "date": "2024-11-30", "health_score": 84.2 }
    ],
    "mr_metrics": [
      { "date": "2024-12-01", "health_score": 88.0 }
    ],
    "commit_metrics": [
      { "date": "2024-12-01", "health_score": 82.5 }
    ],
    "reliability_metrics": [
      { "date": "2024-12-01", "health_score": 85.0 }
    ],
    "maintainability_metrics": [
      { "date": "2024-12-01", "health_score": 90.0 }
    ],
    "security_metrics": [
      { "date": "2024-12-01", "health_score": 92.0 }
    ]
  }
}
```

### Get Latest Health Scores

**Endpoint:** `GET /api/projects/:id/health-scores/latest`

**Parameters:**
- `id` (path) - Project ID

**Description:** Get the most recent health scores for all 6 metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": 12345,
    "issue_health_score": 85.5,
    "mr_health_score": 88.0,
    "commit_health_score": 82.5,
    "reliability_health_score": 85.0,
    "maintainability_health_score": 90.0,
    "security_health_score": 92.0,
    "combined_score": 87.17,
    "timestamp": "2024-12-01T10:00:00.000Z"
  }
}
```

---

## Milestone Metrics

### Refresh Milestone Metrics

**Endpoint:** `POST /api/projects/:id/milestone-metrics/refresh`

**Parameters:**
- `id` (path) - Project ID

**Description:** Fetch metrics for active milestones from GitLab.

**Response:**
```json
{
  "success": true,
  "message": "Milestone metrics refreshed successfully",
  "data": {
    "project_id": 12345,
    "active_milestones": 3,
    "total_issues": 45,
    "open_issues": 20,
    "closed_issues": 25,
    "completion_percent": 55.6
  }
}
```

### Get Milestone Metrics

**Endpoint:** `GET /api/projects/:id/milestone-metrics`

**Parameters:**
- `id` (path) - Project ID

**Description:** Get current active milestone metrics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "milestone_id": 101,
      "milestone_title": "Version 2.0",
      "project_id": 12345,
      "total_issues": 45,
      "open_issues": 20,
      "closed_issues": 25,
      "completion_percent": 55.6,
      "due_date": "2024-12-31",
      "overdue": false
    }
  ]
}
```

---

## AI Insights

### Test AI Connection

**Endpoint:** `GET /api/ai/test`

**Description:** Check if Google Gemini AI service is configured.

**Response:**
```json
{
  "connected": true,
  "message": "Gemini AI service is configured and ready"
}
```

### Generate Text Response

**Endpoint:** `POST /api/ai/generate-text`

**Description:** Generate AI response from a text prompt.

**Request Body:**
```json
{
  "prompt": "Explain the importance of DORA metrics"
}
```

**Response:**
```json
{
  "response": "DORA metrics (DevOps Research and Assessment) are key performance indicators..."
}
```

### Generate Response with File

**Endpoint:** `POST /api/ai/generate-with-pdf`

**Description:** Generate AI response from prompt with attached file (PDF or Excel).

**Request Body:**
```json
{
  "prompt": "Analyze this document and summarize key findings",
  "fileData": "base64-encoded-file-content",
  "mimeType": "application/pdf"
}
```

**Supported MIME types:**
- `application/pdf`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)
- `application/vnd.ms-excel` (Excel)

**Response:**
```json
{
  "response": "Based on the document analysis..."
}
```

### Generate Project Insights

**Endpoint:** `POST /api/ai/project-insights`

**Description:** Generate AI-powered insights for a project based on its metrics.

**Request Body:**
```json
{
  "projectId": 12345,
  "projectName": "My Project"
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "summary": "Overall project health is good with some areas for improvement.",
    "strengths": [
      "Strong code security practices",
      "Good maintainability score"
    ],
    "concerns": [
      "High number of open issues",
      "Slower merge request turnaround"
    ],
    "recommendations": [
      "Prioritize issue triage and resolution",
      "Review and streamline MR approval process"
    ]
  }
}
```

### Get Project Insights by Name

**Endpoint:** `GET /api/ai/project-insights/:projectName`

**Parameters:**
- `projectName` (path) - URL-encoded project name

**Description:** Get the latest AI insights for a project by name.

**Response:**
```json
{
  "success": true,
  "data": {
    "project_name": "My Project",
    "insights": {
      "summary": "Project health analysis...",
      "strengths": ["..."],
      "concerns": ["..."],
      "recommendations": ["..."]
    },
    "created_at": "2024-12-01T10:00:00.000Z"
  }
}
```

### Get Project Insights History by ID

**Endpoint:** `GET /api/ai/project-insights-history/:projectId`

**Parameters:**
- `projectId` (path) - GitLab project ID

**Description:** Get historical AI insights for a project.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 12345,
      "project_name": "My Project",
      "insights": {
        "summary": "...",
        "strengths": ["..."],
        "concerns": ["..."],
        "recommendations": ["..."]
      },
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Get All Project Insights

**Endpoint:** `GET /api/ai/all-project-insights`

**Description:** Get the latest AI insights for all projects.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "project_id": 12345,
      "project_name": "My Project",
      "insights": {
        "summary": "...",
        "strengths": ["..."],
        "concerns": ["..."],
        "recommendations": ["..."]
      },
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

