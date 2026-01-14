# GitLab Project Analytics & Monitoring System
## Complete Project Documentation

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Technology Stack](#technology-stack)
5. [Core Features & Implementations](#core-features--implementations)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Architecture](#frontend-architecture)
9. [Setup & Installation Guide](#setup--installation-guide)
10. [Usage Guide](#usage-guide)
11. [Key Workflows](#key-workflows)
12. [Third-Party Integrations](#third-party-integrations)
13. [Security & Best Practices](#security--best-practices)
14. [Performance Optimization](#performance-optimization)
15. [Future Enhancements](#future-enhancements)
16. [Troubleshooting Guide](#troubleshooting-guide)
17. [Contributing Guidelines](#contributing-guidelines)

---

## Executive Summary

### Project Purpose
[TO FILL: Briefly describe the main goal of this project - e.g., "A comprehensive dashboard for monitoring GitLab projects with DORA metrics, code quality tracking, and AI-powered insights to improve software development practices."]

### Key Achievements
- ✅ Real-time GitLab project monitoring
- ✅ DORA metrics tracking with trend analysis
- ✅ SonarCloud integration for code quality
- ✅ AI-powered project insights using Google Gemini
- ✅ Health score tracking across 6 metric categories
- ✅ Historical data visualization and trend analysis

### Target Audience
- Development Teams
- Project Managers
- DevOps Engineers
- Quality Assurance Teams
- University/Academic Research

---

## Project Overview

### Problem Statement
[TO FILL: Describe the problem this project solves - e.g., "Development teams often struggle to track project health across multiple metrics. This system provides a centralized dashboard for monitoring GitLab projects, tracking DORA metrics, code quality, and generating AI-powered insights."]

### Solution Approach
This project implements a full-stack web application that:
1. **Integrates with GitLab API** to fetch project data, issues, merge requests, commits, and milestones
2. **Connects with SonarCloud** for code quality metrics (maintainability, reliability, security)
3. **Tracks DORA Metrics** (Deployment Frequency, Lead Time, Change Failure Rate, Time to Restore)
4. **Calculates Health Scores** across 6 categories with historical tracking
5. **Generates AI Insights** using Google Gemini to provide actionable recommendations

### System Capabilities
- **Project Management**: Track all GitLab projects with filtering and grouping
- **Metrics Tracking**: Monitor 6 health categories (Issues, MRs, Commits, Sonar Maintainability, Reliability, Security)
- **DORA Metrics**: Manual input and automated weekly snapshots
- **AI Insights**: Generate comprehensive project analysis reports
- **Trend Analysis**: Week-over-week, month-over-month, year-over-year comparisons
- **Dashboard Visualization**: Interactive charts and graphs for data visualization

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  - Vite + TypeScript                                         │
│  - shadcn/ui components                                      │
│  - Recharts for visualization                                │
│  - React Router for navigation                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/REST API
┌─────────────────▼───────────────────────────────────────────┐
│                     SERVER (Express.js)                      │
│  - RESTful API endpoints                                     │
│  - Controllers & Services architecture                       │
│  - Scheduled jobs (cron)                                     │
└─────┬─────────┬─────────┬─────────┬────────────────────────┘
      │         │         │         │
      │         │         │         │
┌─────▼─────┐ ┌▼────────┐ ┌▼──────┐ ┌▼──────────────────────┐
│ PostgreSQL │ │ GitLab  │ │ Sonar │ │ Google Gemini AI      │
│  Database  │ │   API   │ │ Cloud │ │ (Gemini 2.5 Flash)    │
└────────────┘ └─────────┘ └───────┘ └───────────────────────┘
```

### Architecture Layers

#### 1. **Presentation Layer (Frontend)**
- **Technology**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui (Radix UI primitives)
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Charts**: Recharts

#### 2. **API Layer (Backend)**
- **Technology**: Node.js + Express + TypeScript
- **Architecture Pattern**: MVC (Model-View-Controller)
- **API Type**: RESTful
- **Middleware**: CORS, Error handling, Body parsing

#### 3. **Business Logic Layer (Services)**
- **Project Services**: Sync, refresh, fetch, transform, enrichment
- **Metrics Services**: Issue, MR, Commit, Milestone calculations
- **DORA Services**: Metrics calculation, trend analysis, weekly snapshots
- **SonarQube Services**: Maintainability, Reliability, Security metrics
- **AI Services**: Gemini integration, insights generation, parsing

#### 4. **Data Layer (Database)**
- **Database**: PostgreSQL
- **Schema Management**: SQL migrations
- **Connection Pooling**: pg pool
- **Query Optimization**: Indexes on foreign keys and frequently queried columns

#### 5. **External Integration Layer**
- **GitLab API**: Project data, issues, MRs, commits, milestones, members
- **SonarCloud API**: Code quality metrics
- **Google Gemini API**: AI-powered insights generation

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.x | UI library for building interactive interfaces |
| **TypeScript** | 5.x | Type-safe JavaScript development |
| **Vite** | Latest | Fast build tool and dev server |
| **React Router** | 6.x | Client-side routing |
| **TanStack Query** | 5.x | Data fetching and caching |
| **shadcn/ui** | Latest | Accessible UI component library |
| **Radix UI** | Latest | Headless UI primitives |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Recharts** | 2.x | Composable charting library |
| **Lucide React** | Latest | Icon library |

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime |
| **Express** | 4.x | Web application framework |
| **TypeScript** | 5.x | Type-safe server development |
| **PostgreSQL** | Latest | Relational database |
| **pg** | 8.x | PostgreSQL client for Node.js |
| **Axios** | 1.x | HTTP client for API calls |
| **node-cron** | 3.x | Task scheduling |
| **Google Generative AI** | Latest | Gemini AI integration |
| **XLSX** | Latest | Excel file parsing |
| **dotenv** | Latest | Environment variable management |

### Development Tools

| Tool | Purpose |
|------|---------|
| **tsx** | TypeScript execution and watch mode |
| **ESLint** | Code linting and quality checks |
| **Git** | Version control |
| **VS Code** | Recommended IDE |

---

## Core Features & Implementations

### Feature 1: Project Management System

#### Description
A comprehensive system to manage all GitLab projects with tracking capabilities.

#### Implementation Details

**Components:**
- `AllProjects.tsx` - View all GitLab projects
- `TrackedProjects.tsx` - View tracked projects with latest snapshots
- `ProjectDetail.tsx` - Detailed project view with all metrics

**Backend Services:**
- **Project Sync Service** (`projectSyncService.ts`)
  - Fetches all projects from GitLab API
  - Updates local database with project information
  - Handles SonarCloud project key mapping
  
- **Project Refresh Service** (`projectRefreshService.ts`)
  - Creates new snapshots for tracked projects
  - Fetches GitLab metrics (issues, MRs, milestones)
  - Fetches SonarCloud metrics (if project key exists)

**Database Tables:**
- `projects` - Stores basic project information
- `tracked_project_snapshots` - Stores time-series snapshots for tracked projects

**Key Endpoints:**
```
GET  /api/projects/db              - Get all projects from database
GET  /api/projects/:id             - Get single project by ID
POST /api/projects/sync            - Sync all projects from GitLab
POST /api/projects/track           - Mark project as tracked
PATCH /api/projects/untrack/:id    - Unmark project as tracked
POST /api/projects/refresh/:id     - Refresh single project metrics
POST /api/projects/refresh-all     - Refresh all tracked projects
```

**Key Workflows:**
1. **Initial Sync**: Admin clicks "Sync from GitLab" → Fetches all projects → Updates database
2. **Track Project**: User clicks "Track" → Sets `tracked = true` → Creates first snapshot
3. **Refresh Data**: User clicks "Refresh" → Fetches latest metrics → Creates new snapshot

---

### Feature 2: DORA Metrics Tracking

#### Description
Comprehensive DORA (DevOps Research and Assessment) metrics tracking with manual input, automated snapshots, and trend analysis.

#### The Four DORA Metrics

1. **Deployment Frequency**
   - How often code is deployed to production
   - Elite: ≥30 deployments/period

2. **Lead Time for Changes**
   - Time from code commit to production deployment
   - Elite: ≤24 hours

3. **Change Failure Rate**
   - Percentage of deployments causing failures
   - Elite: ≤5%

4. **Time to Restore Service**
   - Time to recover from production incidents
   - Elite: ≤1 hour

#### Implementation Details

**Components:**
- `DoraMetricsInput.tsx` - Manual DORA metrics input form
- `DORADashboard.tsx` - DORA trends visualization dashboard
- `DoraMetricsOverviewCard.tsx` - DORA metrics summary card

**Backend Services:**
- **DORA Metrics DB Service** (`doraMetricsDbService.ts`)
  - CRUD operations for all 4 DORA metrics
  - Search and filtering capabilities
  
- **DORA Calculation Service** (`doraMetricsCalculationService.ts`)
  - Calculates summary statistics
  - Computes averages and trends
  
- **DORA Trends Service** (`doraTrendsService.ts`)
  - Calculates weekly/monthly/yearly trends
  - Compares current vs previous periods
  
- **Weekly Snapshot Service** (`weeklyDoraSnapshotService.ts`)
  - Automated weekly snapshots every Sunday at 00:01
  - Captures last week's DORA metrics

**Database Tables:**
- `deployment_frequency` - Tracks deployments
- `lead_time_changes` - Tracks merge-to-deploy time
- `change_failure_rate` - Tracks deployment failures
- `time_to_restore_service` - Tracks incident resolution time
- `weekly_dora_snapshots` - Stores weekly aggregated snapshots

**Key Endpoints:**
```
# Manual Input
POST /api/projects/:id/dora/deployment  - Log deployment
POST /api/projects/:id/dora/leadtime    - Log lead time
POST /api/projects/:id/dora/failure     - Log failure
POST /api/projects/:id/dora/restore     - Log restore time

# Retrieval
GET /api/projects/:id/dora/summary         - Get summary stats
GET /api/projects/:id/dora/trends          - Get trend analysis
GET /api/projects/:id/dora/weekly-snapshots - Get weekly snapshots

# Deletion
DELETE /api/projects/:id/dora/deployment/:uuid
DELETE /api/projects/:id/dora/leadtime/:uuid
DELETE /api/projects/:id/dora/failure/:uuid
DELETE /api/projects/:id/dora/restore/:uuid
```

**Scheduler:**
- **Weekly DORA Snapshot**: Runs every Sunday at 00:01 (Asia/Dhaka timezone)
- **Purpose**: Automatically captures weekly DORA metrics for all tracked projects

---

### Feature 3: Health Metrics System

#### Description
Comprehensive health tracking across 6 metric categories with 0-5 scoring system.

#### The 6 Health Metric Categories

##### 1. **Issue Metrics**
**Tracked Metrics:**
- Total open/closed issues
- Velocity (issues closed per week)
- Average cycle time (hours/days)
- Issue reopen rate (%)
- Bug vs Feature ratio
- Issues opened per week
- Stale issues count
- Critical issues count

**Health Score Calculation:**
- Cycle Time (30%)
- Reopen Rate (25%)
- Velocity (25%)
- Critical Issues (20%)

**Implementation:**
- Service: `issueMetrics/issueMetricsSyncService.ts`
- Controller: `issueMetricsController.ts`
- Component: `IssueMetricsCard.tsx`

##### 2. **Merge Request Metrics**
**Tracked Metrics:**
- Total open/merged MRs
- MRs merged per week
- Average merge time (days)
- Revert rate (%)
- Average review comments per MR
- MRs with CI failures

**Health Score Calculation:**
- Merge Time (35%)
- Revert Rate (25%)
- MR Velocity (25%)
- Review Engagement (15%)

**Implementation:**
- Service: `mrMetrics/mrMetricsSyncService.ts`
- Controller: `mrMetricsController.ts`
- Component: `MRMetricsCard.tsx`

##### 3. **Commit Metrics**
**Tracked Metrics:**
- Total commits
- Commits per week
- Average commits per author
- Contributors count
- Individual commit details

**Health Score Calculation:**
- Commit frequency
- Author distribution
- Activity consistency

**Implementation:**
- Service: `commitMetrics/commitMetricsSyncService.ts`
- Controller: `commitMetricsController.ts`
- Component: `CommitMetricsCard.tsx`

##### 4. **SonarQube Maintainability**
**Tracked Metrics:**
- Code smells (blocker/critical)
- Technical debt ratio
- Duplicated lines/blocks
- Maintainability rating

**Health Score Calculation:**
- Code smells severity
- Technical debt ratio
- Duplication percentage

**Implementation:**
- Service: `sonarMaintainability/sonarMaintainabilitySyncService.ts`
- Controller: `sonarQubeMaintainabilityController.ts`
- Component: `SonarMaintainabilityCard.tsx`

##### 5. **SonarQube Reliability**
**Tracked Metrics:**
- Bugs (blocker/critical)
- Reliability rating
- Bug density

**Health Score Calculation:**
- Bug count and severity
- Reliability rating

**Implementation:**
- Service: `sonarReliability/sonarReliabilitySyncService.ts`
- Controller: `sonarQubeReliabilityController.ts`
- Component: `SonarReliabilityCard.tsx`

##### 6. **SonarQube Security**
**Tracked Metrics:**
- Vulnerabilities (blocker/critical)
- Security hotspots
- Security rating

**Health Score Calculation:**
- Vulnerability count and severity
- Security rating

**Implementation:**
- Service: `sonarSecurity/sonarSecuritySyncService.ts`
- Controller: `sonarQubeSecurityController.ts`
- Component: `SonarSecurityCard.tsx`

#### Milestone Metrics (Bonus)
**Tracked Metrics:**
- Active milestone details
- Issue counts (open/closed)
- Progress percentage
- Due date tracking

**Implementation:**
- Service: `milestoneMetrics/milestoneMetricsSyncService.ts`
- Controller: `milestoneMetricsController.ts`
- Component: `MilestoneMetricsCard.tsx`

---

### Feature 4: AI-Powered Project Insights

#### Description
Uses Google Gemini AI to generate comprehensive project analysis and recommendations based on user survey data and API metrics.

#### Implementation Details

**Components:**
- `ProjectInsights.tsx` - View all project insights
- `ProjectInsight.tsx` - Individual project insight detail view
- `GeminiTest.tsx` - Test Gemini integration

**Backend Services:**
- **Gemini Service** (`ai/geminiService.ts`)
  - Initializes Google Generative AI client
  - Sends prompts to Gemini 2.5 Flash Lite model
  - Handles file uploads (XLSX/PDF)
  - Implements retry logic for network failures
  
- **Project Insights Service** (`ai/projectInsightsService.ts`)
  - Fetches data from Google Sheets
  - Combines user survey data with API metrics
  - Generates comprehensive prompts
  - Parses AI responses
  
- **Insights Parser** (`ai/insightsParser.ts`)
  - Extracts structured data from AI responses
  - Validates scores (1-5 scale)
  - Calculates combined scores

**Data Flow:**
1. User fills Google Form → Data stored in Google Sheets
2. Admin triggers AI insights generation
3. System fetches sheet data + latest project metrics
4. Builds comprehensive prompt with all data
5. Sends to Gemini API
6. Parses response into structured format
7. Stores in `project_insights` table
8. Displays on frontend with visualizations

**Database Tables:**
- `project_insights` - Stores AI-generated insights with scores

**Key Endpoints:**
```
GET  /api/ai/test                           - Test Gemini connection
POST /api/ai/generate-text                  - Generate text response
POST /api/ai/generate-with-pdf              - Generate with file upload
POST /api/ai/project-insights               - Generate project insights
GET  /api/ai/project-insights/:projectName  - Get insights by project name
GET  /api/ai/project-insights-history/:id   - Get insights history by ID
GET  /api/ai/all-project-insights           - Get all project insights
```

**Prompt Engineering:**
- Template stored in: `server/src/prompts/project-insights-prompt.txt`
- Includes scoring rubric (1-5 scale)
- Combines user responses + API metrics
- Generates section-wise analysis

**AI Model:**
- **Model**: Gemini 2.5 Flash Lite
- **Provider**: Google Generative AI
- **Features**: Text generation, file understanding, JSON output

---

### Feature 5: Dashboard & Visualization

#### Description
Interactive dashboards with real-time data visualization.

#### Implementation Details

**Main Dashboards:**

1. **Overview Dashboard** (`Dashboard.tsx`)
   - Total projects count
   - Tracked projects count
   - Average quality score
   - Projects needing attention
   - Quality score distribution chart
   - Project tracking pie chart
   - Projects needing attention list

2. **Project Detail Dashboard** (`ProjectDetail.tsx`)
   - Project overview with metadata
   - 6 health metric cards
   - DORA metrics overview
   - Milestone tracking
   - Historical trends charts
   - AI insights history

3. **DORA Dashboard** (`DORADashboard.tsx`)
   - Time granularity selection (Weekly/Monthly/Yearly)
   - 4 DORA metric cards with trends
   - Performance ratings (Elite/High/Medium/Low)
   - Trend indicators (up/down/stable)
   - Historical charts for each metric
   - Success vs Failure pie chart

4. **Insights Dashboard** (`ProjectInsights.tsx`)
   - All project insights grid
   - Radar charts for metric visualization
   - Score color coding
   - Sort and filter capabilities

**Chart Types Used:**
- Line Charts - Time series trends
- Area Charts - Deployment frequency
- Bar Charts - Quality distribution
- Pie Charts - Success rates, tracking status
- Radar Charts - Multi-dimensional metrics

**Visualization Library:**
- **Recharts** - Composable charting library for React

---

## Database Schema

### Core Tables

#### 1. `projects`
**Purpose**: Stores all GitLab projects (tracked and untracked)

```sql
CREATE TABLE projects (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  id INTEGER UNIQUE NOT NULL,              -- GitLab project ID
  name VARCHAR(255) NOT NULL,
  full_path TEXT,
  group_path TEXT,
  members_count INTEGER DEFAULT 0,
  members JSONB,                           -- Member details as JSON
  last_activity_at TIMESTAMP,
  parent_id INTEGER,
  visibility VARCHAR(50),
  sonar_project_key TEXT,                  -- SonarCloud integration
  tracked BOOLEAN DEFAULT FALSE,           -- Tracking status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_projects_id` - GitLab project ID
- `idx_projects_tracked` - Tracking status
- `idx_projects_parent_id` - Parent group
- `idx_projects_name` - Project name
- `idx_projects_synced_at` - Last sync time

#### 2. `tracked_project_snapshots`
**Purpose**: Historical time-series data for tracked projects

```sql
CREATE TABLE tracked_project_snapshots (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  description TEXT,
  web_url TEXT,
  open_issues INTEGER DEFAULT 0,
  open_mrs INTEGER DEFAULT 0,
  open_milestones_count INTEGER DEFAULT 0,
  sonar_project_key TEXT,
  sonar_security_high INTEGER DEFAULT 0,
  sonar_security_blocker INTEGER DEFAULT 0,
  sonar_reliability_high INTEGER DEFAULT 0,
  sonar_reliability_blocker INTEGER DEFAULT 0,
  sonar_maintainability_high INTEGER DEFAULT 0,
  sonar_maintainability_blocker INTEGER DEFAULT 0,
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `project_insights`
**Purpose**: AI-generated project insights

```sql
CREATE TABLE project_insights (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,           -- Complete insights JSON
  final_user_score DECIMAL(3,2),          -- User score (1-5)
  api_score DECIMAL(3,2),                 -- API score (1-5)
  combined_score DECIMAL(3,2),            -- Combined score (1-5)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### DORA Metrics Tables

#### 4. `deployment_frequency`
```sql
CREATE TABLE deployment_frequency (
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
```

#### 5. `lead_time_changes`
```sql
CREATE TABLE lead_time_changes (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_id VARCHAR(255) NOT NULL,
  merged_timestamp TIMESTAMP NOT NULL,
  deployed_timestamp TIMESTAMP NOT NULL,
  lead_time_hours DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. `change_failure_rate`
```sql
CREATE TABLE change_failure_rate (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. `time_to_restore_service`
```sql
CREATE TABLE time_to_restore_service (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  incident_id VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  restore_time_hours DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. `weekly_dora_snapshots`
```sql
CREATE TABLE weekly_dora_snapshots (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  deployment_count INTEGER DEFAULT 0,
  avg_lead_time_hours DECIMAL(10, 2),
  failure_rate_percent DECIMAL(5, 2),
  avg_restore_time_hours DECIMAL(10, 2),
  total_deployments INTEGER DEFAULT 0,
  failed_deployments INTEGER DEFAULT 0,
  total_changes INTEGER DEFAULT 0,
  total_incidents INTEGER DEFAULT 0,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Health Metrics Tables

#### 9. `issue_health_metrics`
**Purpose**: Complete issue metrics history

```sql
CREATE TABLE issue_health_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_issues INTEGER DEFAULT 0,
  total_closed_issues INTEGER DEFAULT 0,
  issues_closed_last_7d INTEGER DEFAULT 0,
  issues_closed_last_30d INTEGER DEFAULT 0,
  avg_cycle_time_hours FLOAT DEFAULT 0,
  avg_cycle_time_days FLOAT DEFAULT 0,
  issues_reopened_count INTEGER DEFAULT 0,
  reopen_rate_percent FLOAT DEFAULT 0,
  bug_issues_count INTEGER DEFAULT 0,
  feature_issues_count INTEGER DEFAULT 0,
  bug_ratio_percent FLOAT DEFAULT 0,
  critical_issues_open INTEGER DEFAULT 0,
  health_score FLOAT DEFAULT 0,          -- 0-5 score
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. `mr_health_metrics`
**Purpose**: Complete MR metrics history

```sql
CREATE TABLE mr_health_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_open_mrs INTEGER DEFAULT 0,
  total_merged_mrs INTEGER DEFAULT 0,
  mrs_merged_last_7d INTEGER DEFAULT 0,
  mrs_merged_last_30d INTEGER DEFAULT 0,
  avg_merge_time_hours FLOAT DEFAULT 0,
  avg_merge_time_days FLOAT DEFAULT 0,
  mrs_reverted_count INTEGER DEFAULT 0,
  revert_rate_percent FLOAT DEFAULT 0,
  avg_review_comments_per_mr FLOAT DEFAULT 0,
  health_score FLOAT DEFAULT 0,          -- 0-5 score
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 11. `commit_metrics`
**Purpose**: Commit activity tracking

```sql
CREATE TABLE commit_metrics (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_commits INTEGER DEFAULT 0,
  commits_last_7d INTEGER DEFAULT 0,
  commits_last_30d INTEGER DEFAULT 0,
  total_contributors INTEGER DEFAULT 0,
  avg_commits_per_author FLOAT DEFAULT 0,
  commit_details JSONB,                  -- Individual commit data
  health_score FLOAT DEFAULT 0,          -- 0-5 score
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 12-14. SonarQube Metrics Tables
Similar structure for:
- `sonarqube_maintainability_metrics`
- `sonarqube_reliability_metrics`
- `sonarqube_security_metrics`

Each with:
- Project reference
- Metric-specific fields
- Health score (0-5)
- Timestamp

### Migrations System
- Located in: `server/src/db/migrations/`
- Sequential numbered migrations (001-020+)
- Executed on server startup via `initializeTables()`
- Idempotent (safe to run multiple times)

---

## API Documentation

### API Base URL
```
Development: http://localhost:5000/api
Production: [TO FILL]
```

### Authentication
[TO FILL: Currently no authentication. Describe if you plan to add it]

### Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Optional detailed error info"
}
```

### Endpoint Categories

#### 1. Project Endpoints

##### Get All Projects
```http
GET /api/projects/db
```
**Description**: Retrieve all projects from database (fast, cached)
**Response**:
```json
[
  {
    "uuid": "...",
    "id": 123,
    "name": "Project Name",
    "full_path": "group/project",
    "tracked": true,
    "last_activity_at": "2024-01-15T10:30:00Z"
  }
]
```

##### Get Single Project
```http
GET /api/projects/:id
```
**Parameters**:
- `id` (path): GitLab project ID

##### Sync Projects from GitLab
```http
POST /api/projects/sync
```
**Description**: Sync all projects from GitLab API (slow)
**Response**: Array of synced projects

##### Track/Untrack Project
```http
POST /api/projects/track
Body: { "id": 123 }

PATCH /api/projects/untrack/:id
```

##### Refresh Project Metrics
```http
POST /api/projects/refresh/:id
POST /api/projects/refresh-all
```

#### 2. DORA Metrics Endpoints

##### Create DORA Records
```http
POST /api/projects/:id/dora/deployment
Body: {
  "deployment_id": "deploy-123",
  "version": "1.2.3",
  "environment": "production",
  "deployment_timestamp": "2024-01-15T10:00:00Z"
}

POST /api/projects/:id/dora/leadtime
Body: {
  "change_id": "MR-456",
  "merged_timestamp": "2024-01-15T08:00:00Z",
  "deployed_timestamp": "2024-01-15T10:00:00Z"
}

POST /api/projects/:id/dora/failure
Body: {
  "deployment_id": "deploy-123",
  "deployment_timestamp": "2024-01-15T10:00:00Z",
  "has_incident": true,
  "remediation_type": "hotfix"
}

POST /api/projects/:id/dora/restore
Body: {
  "incident_id": "INC-789",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:30:00Z",
  "description": "Database connection issue"
}
```

##### Get DORA Metrics
```http
GET /api/projects/:id/dora/deployment
GET /api/projects/:id/dora/leadtime
GET /api/projects/:id/dora/failure
GET /api/projects/:id/dora/restore
GET /api/projects/:id/dora/summary
```

##### Get DORA Trends
```http
GET /api/projects/:id/dora/trends?granularity=monthly&periods=12&offset=0
```
**Query Parameters**:
- `granularity`: 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
- `periods`: Number of periods (max 12, default: 12)
- `offset`: Skip N periods (for pagination)

**Response**:
```json
{
  "success": true,
  "data": {
    "granularity": "monthly",
    "data": [...],
    "summary": {
      "deployment_frequency": {
        "current": 21,
        "avg": 18.5,
        "trend": "up",
        "change_percent": 15.5
      },
      ...
    }
  }
}
```

#### 3. Health Metrics Endpoints

##### Issue Metrics
```http
POST /api/projects/:id/issue-metrics/refresh
GET /api/projects/:id/issue-metrics
GET /api/projects/:id/issue-metrics/trends
GET /api/projects/:id/issue-metrics/history?days=30
```

##### MR Metrics
```http
POST /api/projects/:id/mr-metrics/refresh
GET /api/projects/:id/mr-metrics
GET /api/projects/:id/mr-metrics/trends
GET /api/projects/:id/mr-metrics/history?days=30
```

##### Commit Metrics
```http
POST /api/projects/:id/commit-metrics/refresh
GET /api/projects/:id/commit-metrics
GET /api/projects/:id/commit-metrics/history?days=30
```

##### SonarQube Metrics
```http
POST /api/projects/:id/sonarqube/maintainability/refresh
GET /api/projects/:id/sonarqube/maintainability
GET /api/projects/:id/sonarqube/maintainability/history?days=30

POST /api/projects/:id/sonarqube/reliability/refresh
GET /api/projects/:id/sonarqube/reliability
GET /api/projects/:id/sonarqube/reliability/history?days=30

POST /api/projects/:id/sonarqube/security/refresh
GET /api/projects/:id/sonarqube/security
GET /api/projects/:id/sonarqube/security/history?days=30
```

##### Health Score History
```http
GET /api/projects/:id/health-scores/history?days=30
GET /api/projects/:id/health-scores/latest
```

#### 4. AI Insights Endpoints

```http
POST /api/ai/project-insights
Body: { "projectName": "my-project" }

GET /api/ai/project-insights/:projectName
GET /api/ai/project-insights-history/:projectId
GET /api/ai/all-project-insights
```

#### 5. Utility Endpoints

```http
GET /api/health                    - Health check
GET /api/gitlab/verify             - Verify GitLab connection
GET /api/projects/:id/members      - Get project members
GET /api/projects/groups           - Get all GitLab groups
GET /api/projects/dashboard-stats  - Get dashboard statistics
```

---

## Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── AppLayout.tsx              # Main layout wrapper
│   ├── AppSidebar.tsx             # Navigation sidebar
│   ├── MetricCard.tsx             # Generic metric display
│   ├── ProjectCard.tsx            # Project list card
│   ├── IssueMetricsCard.tsx       # Issue metrics display
│   ├── MRMetricsCard.tsx          # MR metrics display
│   ├── CommitMetricsCard.tsx      # Commit metrics display
│   ├── SonarMaintainabilityCard.tsx
│   ├── SonarReliabilityCard.tsx
│   ├── SonarSecurityCard.tsx
│   ├── MilestoneMetricsCard.tsx
│   ├── DoraMetricsOverviewCard.tsx
│   ├── HealthScoreTrendsCard.tsx
│   └── QualityBadge.tsx           # Score badge component
├── pages/
│   ├── Dashboard.tsx              # Main dashboard
│   ├── AllProjects.tsx            # All projects view
│   ├── TrackedProjects.tsx        # Tracked projects view
│   ├── ProjectDetail.tsx          # Project detail view
│   ├── ProjectInsights.tsx        # All insights view
│   ├── ProjectInsight.tsx         # Single insight view
│   ├── DoraMetricsInput.tsx       # DORA input form
│   ├── DORADashboard.tsx          # DORA trends dashboard
│   └── GeminiTest.tsx             # AI testing page
├── lib/
│   ├── api.ts                     # API client
│   └── utils.ts                   # Utility functions
└── hooks/
    └── use-toast.ts               # Toast notifications
```

### State Management Strategy

**React Query** is used for server state management:
- Automatic caching
- Background refetching
- Loading and error states
- Optimistic updates

**Local Component State** for UI state:
- Form inputs
- Modal visibility
- Tab selection
- Loading indicators

### Routing Structure

```tsx
/                          → Dashboard
/projects                  → AllProjects
/tracked                   → TrackedProjects
/project/:id               → ProjectDetail
/project/:id/insights      → ProjectInsight
/project/:id/dora-input    → DoraMetricsInput
/project/:id/dora-dashboard → DORADashboard
/insights                  → ProjectInsights
/tracking                  → TrackingManagement
/alerts                    → Alerts
/gemini-test               → GeminiTest
```

### Styling Approach

**Tailwind CSS** utility-first approach:
- Custom theme configuration
- Dark mode support
- Responsive design
- CSS variables for theming

**shadcn/ui** component library:
- Accessible by default (Radix UI)
- Customizable with Tailwind
- Copy-paste components (no package dependency)

---

## Setup & Installation Guide

### Prerequisites

1. **Node.js** (v20 or higher)
2. **PostgreSQL** (v14 or higher)
3. **GitLab Account** with API access
4. **SonarCloud Account** (optional, for code quality metrics)
5. **Google Cloud Account** (for Gemini AI)
6. **Bun** (optional, used for client dependency management)

### Environment Setup

#### 1. Clone the Repository
```bash
git clone [repository-url]
cd gitlab-final
```

#### 2. Database Setup

**Create PostgreSQL Database:**
```sql
CREATE DATABASE gitlab_analytics;
CREATE USER gitlab_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE gitlab_analytics TO gitlab_user;
```

#### 3. Backend Configuration

**Navigate to server directory:**
```bash
cd server
```

**Install dependencies:**
```bash
npm install
# or
yarn install
```

**Create `.env` file:**
```bash
cp .env.example .env
```

**Configure environment variables:**
```env
# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:8080

# Database Configuration
DATABASE_URL=postgresql://gitlab_user:your_password@localhost:5432/gitlab_analytics

# GitLab Configuration
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your_gitlab_personal_access_token

# SonarCloud Configuration (Optional)
SONARQUBE_URL=https://sonarcloud.io
SONARQUBE_TOKEN=your_sonarcloud_token
SONARQUBE_ORGANIZATION=your_org_name

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

#### 4. Frontend Configuration

**Navigate to client directory:**
```bash
cd ../client
```

**Install dependencies:**
```bash
bun install
# or
npm install
```

**Create `.env` file:**
```bash
VITE_API_URL=http://localhost:5000/api
```

### Getting API Keys

#### GitLab Personal Access Token
1. Go to GitLab → Settings → Access Tokens
2. Create new token with scopes:
   - `api` - Full API access
   - `read_user` - Read user information
   - `read_repository` - Read repository data
3. Copy the token to `.env`

#### SonarCloud Token
1. Go to SonarCloud → My Account → Security
2. Generate new token
3. Note your organization name
4. Add to `.env`

#### Google Gemini API Key
1. Go to Google AI Studio (https://aistudio.google.com)
2. Create API key
3. Add to `.env`

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```
Server runs on: http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```
Client runs on: http://localhost:5173

#### Production Build

**Backend:**
```bash
cd server
npm run build
npm start
```

**Frontend:**
```bash
cd client
npm run build
npm run preview
```

### Database Initialization

Database tables are automatically created on first server startup via migrations in `server/src/db/migrations/`.

**Manual initialization (if needed):**
```bash
cd server
npm run dev
# Tables will be created automatically
```

### Verification Steps

1. ✅ Check server health: `http://localhost:5000/api/health`
2. ✅ Verify GitLab connection: `http://localhost:5000/api/gitlab/verify`
3. ✅ Open frontend: `http://localhost:5173`
4. ✅ Sync projects: Click "Sync from GitLab" button
5. ✅ Track a project: Click "Track" on any project
6. ✅ Refresh metrics: Click "Refresh" button

---

## Usage Guide

### Initial Setup Workflow

1. **Start Application**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. **Sync Projects from GitLab**
   - Navigate to "All Projects" page
   - Click "Sync from GitLab" button
   - Wait for projects to load
   - All your GitLab projects are now in the database

3. **Track Projects**
   - Find projects you want to monitor
   - Click "Track" button on each project
   - Tracked projects appear in "Tracked Projects" page

4. **Refresh Metrics**
   - Go to "Tracked Projects" page
   - Click "Refresh All" or individual "Refresh" buttons
   - Metrics are fetched from GitLab and SonarCloud
   - First snapshot is created

### Daily Operations

#### Monitoring Project Health
1. Go to "Dashboard" to see overview
2. Check "Projects Needing Attention" section
3. Click on any project for detailed view

#### Viewing Project Details
1. Navigate to project detail page
2. View tabs:
   - **Overview**: Basic info and health scores
   - **Metrics**: All 6 health metrics
   - **DORA**: DORA metrics overview
   - **Insights**: AI-generated insights
3. Click "Refresh Data" to update metrics

#### Inputting DORA Metrics
1. Go to project detail page
2. Click "DORA Input" button
3. Navigate to appropriate tab:
   - **Deployment**: Log production deployments
   - **Lead Time**: Log merge-to-deploy time
   - **Failure**: Log deployment failures
   - **Restore**: Log incident resolution time
4. Fill form and submit
5. View in "DORA Dashboard"

#### Viewing DORA Trends
1. Go to project detail page
2. Click "DORA Dashboard" button
3. Select time granularity:
   - Weekly (last 12 weeks)
   - Monthly (last 12 months)
   - Yearly (all years)
4. View performance ratings and trends
5. Navigate between periods with arrows

#### Generating AI Insights
1. Ensure Google Sheet has project data
2. Click "Generate Insights" button
3. Wait for AI processing
4. View insights on "Insights" page
5. Click project for detailed analysis

### Administrative Tasks

#### Managing Tracked Projects
- **Track**: Make any project tracked
- **Untrack**: Remove from tracking
- **Refresh**: Update metrics for tracked projects
- **Bulk Refresh**: Update all tracked projects at once

#### Scheduled Jobs
- **Weekly DORA Snapshots**: Runs every Sunday at 00:01
  - Automatically captures last week's DORA metrics
  - No manual intervention required

---

## Key Workflows

### Workflow 1: New Project Onboarding

```
1. Sync Projects
   ↓
2. Track Project
   ↓
3. Ensure SonarCloud Project Key is Mapped
   ↓
4. Refresh Project Metrics (First Snapshot)
   ↓
5. Monitor Health Scores
   ↓
6. Input DORA Metrics (if manual tracking)
   ↓
7. Generate AI Insights (if survey data available)
```

### Workflow 2: Daily Monitoring

```
1. Check Dashboard Overview
   ↓
2. Review "Projects Needing Attention"
   ↓
3. Click on Critical Projects
   ↓
4. Analyze Health Metrics
   ↓
5. Check Trends (Week-over-Week)
   ↓
6. Take Action Based on Insights
```

### Workflow 3: Weekly DORA Review

```
1. Navigate to DORA Dashboard
   ↓
2. Select "Weekly" Granularity
   ↓
3. Review Last 12 Weeks
   ↓
4. Check Performance Ratings
   ↓
5. Identify Declining Trends
   ↓
6. Plan Improvements
```

### Workflow 4: Monthly Reporting

```
1. Go to Dashboard
   ↓
2. Export Key Metrics
   ↓
3. View DORA Trends (Monthly)
   ↓
4. Check AI Insights for All Projects
   ↓
5. Prepare Management Report
```

---

## Third-Party Integrations

### GitLab API Integration

**Purpose**: Fetch project data, issues, MRs, commits, milestones, members

**Authentication**: Personal Access Token

**API Client**: `server/src/services/gitlab/gitlabClient.ts`

**Key Services:**
- `gitlabProjectService.ts` - Project operations
- `gitLabIssueService.ts` - Issue fetching
- `gitLabMRService.ts` - Merge request operations
- `gitLabCommitService.ts` - Commit history
- `gitlabMilestoneService.ts` - Milestone data
- `gitLabMemberService.ts` - Project members

**Rate Limits**: [TO FILL: Document GitLab API rate limits]

**Error Handling**: Retry logic with exponential backoff

### SonarCloud/SonarQube Integration

**Purpose**: Code quality metrics (maintainability, reliability, security)

**Authentication**: Token-based

**API Client**: `server/src/services/sonarqube/sonarQubeService.ts`

**Project Key Mapping**:
- Automatic mapping via `autoMapSonarProjectKeys.ts`
- Attempts to match GitLab project path with SonarCloud project key
- Manual override possible via `sonar_project_key` field

**Metrics Fetched:**
- Code smells, bugs, vulnerabilities
- Technical debt ratio
- Duplications
- Security hotspots
- Ratings (A-E)

### Google Gemini AI Integration

**Purpose**: AI-powered project insights generation

**Model**: Gemini 2.5 Flash Lite

**API Client**: `server/src/services/ai/geminiService.ts`

**Features:**
- Text generation
- File understanding (XLSX, PDF)
- JSON output parsing
- Retry logic for network failures

**Rate Limits**: [TO FILL: Document Gemini API rate limits]

**Cost**: [TO FILL: Document API costs if applicable]

### Google Sheets Integration

**Purpose**: Fetch user survey data for AI insights

**API**: Google Sheets API (via public sheet access)

**Service**: `server/src/services/ai/googleSheetsService.ts`

**Data Format**: CSV export from Google Sheets

---

## Security & Best Practices

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use `.env.example` as template
- ✅ Rotate API tokens regularly
- ✅ Use different tokens for dev/prod

### API Security
[TO FILL: Add authentication/authorization if implemented]
- ⚠️ Currently no authentication
- 🔒 Recommend adding JWT or OAuth for production

### Database Security
- ✅ Use environment variables for credentials
- ✅ Connection pooling with pg
- ✅ SQL injection prevention via parameterized queries
- ✅ Foreign key constraints for data integrity

### CORS Configuration
```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.CLIENT_URL
  ],
  credentials: true
}));
```

### Error Handling
- ✅ Global error handler middleware
- ✅ Try-catch blocks in all async functions
- ✅ Proper error logging
- ✅ User-friendly error messages

---

## Performance Optimization

### Backend Optimizations

1. **Database Indexing**
   - Indexes on all foreign keys
   - Indexes on frequently queried columns
   - Composite indexes where needed

2. **Query Optimization**
   - Avoid N+1 queries
   - Use JOINs efficiently
   - Limit result sets

3. **Caching Strategy**
   - Database caching via connection pooling
   - Consider Redis for API response caching (future)

4. **Scheduled Jobs**
   - Weekly DORA snapshots to reduce on-demand calculations
   - Background processing for heavy operations

### Frontend Optimizations

1. **React Query**
   - Automatic request deduplication
   - Background refetching
   - Stale-while-revalidate pattern

2. **Code Splitting**
   - Route-based code splitting via React Router
   - Lazy loading components

3. **Bundle Optimization**
   - Vite for fast builds
   - Tree shaking
   - Minification in production

4. **Image Optimization**
   - [TO FILL: If applicable]

---

## Future Enhancements

### Planned Features

1. **Authentication & Authorization**
   - User login system
   - Role-based access control (Admin, Viewer, etc.)
   - Project-specific permissions

2. **Real-time Updates**
   - WebSocket integration
   - Live metric updates
   - Notifications for critical events

3. **Advanced Analytics**
   - Predictive analytics
   - Anomaly detection
   - Custom report builder

4. **Export Capabilities**
   - PDF report generation
   - Excel exports
   - CSV data dumps

5. **Alerting System**
   - Email notifications
   - Slack/Teams integration
   - Custom alert rules

6. **CI/CD Integration**
   - Automated metric collection from CI pipelines
   - Build status tracking
   - Test coverage trends

7. **Team Management**
   - Team performance metrics
   - Individual contributor insights
   - Velocity tracking

8. **Mobile App**
   - React Native mobile client
   - Push notifications
   - Offline support

---

## Troubleshooting Guide

### Common Issues

#### 1. "Database connection failed"
**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists
- Check user permissions

#### 2. "GitLab API connection failed"
**Solution:**
- Verify `GITLAB_TOKEN` is valid
- Check token scopes include `api`
- Ensure `GITLAB_URL` is correct
- Test token in GitLab API

#### 3. "SonarCloud metrics not loading"
**Solution:**
- Check `SONARQUBE_TOKEN` is valid
- Verify `SONARQUBE_ORGANIZATION` is correct
- Ensure project key is mapped correctly
- Run auto-mapper: Check logs on server startup

#### 4. "Gemini AI not responding"
**Solution:**
- Verify `GEMINI_API_KEY` is valid
- Check API quotas not exceeded
- Review network connectivity
- Check retry logic in logs

#### 5. "Frontend not connecting to backend"
**Solution:**
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in client `.env`
- Verify CORS configuration
- Check browser console for errors

#### 6. "Migrations failing"
**Solution:**
- Check database user has CREATE permissions
- Review migration logs in console
- Manually run migrations if needed
- Check for conflicting table names

### Debug Mode

**Enable verbose logging:**
```bash
# Backend
NODE_ENV=development npm run dev

# Frontend
npm run dev
```

**Check logs:**
- Backend: Terminal output
- Frontend: Browser console (F12)
- Database: PostgreSQL logs

---

## Contributing Guidelines

### Development Workflow

1. **Branch Naming**
   - `feature/feature-name` - New features
   - `bugfix/bug-description` - Bug fixes
   - `hotfix/critical-issue` - Production hotfixes

2. **Commit Messages**
   ```
   <type>: <description>
   
   Types: feat, fix, docs, style, refactor, test, chore
   
   Example:
   feat: add DORA trends endpoint
   fix: resolve issue metrics calculation bug
   docs: update API documentation
   ```

3. **Pull Request Process**
   - Create feature branch
   - Make changes with clear commits
   - Test thoroughly
   - Update documentation
   - Submit PR with description
   - Address review comments

### Code Style

**TypeScript:**
- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` type when possible
- Use async/await over callbacks

**React:**
- Functional components with hooks
- Props interfaces for all components
- Use React Query for server state
- Keep components focused and reusable

**Naming Conventions:**
- `camelCase` for variables and functions
- `PascalCase` for components and types
- `UPPER_SNAKE_CASE` for constants

### Testing
[TO FILL: Add testing guidelines when implemented]
- Unit tests for services
- Integration tests for API endpoints
- Component tests for React components

---

## Appendix

### Glossary

**DORA Metrics**: DevOps Research and Assessment metrics for measuring software delivery performance

**Health Score**: 0-5 score calculated for each metric category

**Snapshot**: Point-in-time capture of project metrics

**Tracked Project**: Project actively monitored with regular metric updates

**Trend Analysis**: Comparison of metrics over time (weekly, monthly, yearly)

### References

- [GitLab API Documentation](https://docs.gitlab.com/ee/api/)
- [SonarCloud Documentation](https://sonarcloud.io/documentation)
- [Google Gemini API](https://ai.google.dev/docs)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)
- [shadcn/ui](https://ui.shadcn.com/)
- [React Query](https://tanstack.com/query/latest)

### Acknowledgments
[TO FILL: Credit any contributors, libraries, or resources used]

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | [TO FILL] | [Your Name] | Initial documentation |

---

**End of Documentation**

For questions or support, contact: [TO FILL: Your email/contact info]
