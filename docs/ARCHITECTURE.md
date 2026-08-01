# System Architecture

## Overview

GitLab Analytics is a full-stack application that provides project insights, DORA metrics, and health scoring for GitLab projects. The system follows a three-tier architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript                               │   │
│  │  • Vite (Build Tool)                                 │   │
│  │  • TailwindCSS (Styling)                             │   │
│  │  • React Router (Navigation)                         │   │
│  │  • Pages: Dashboard, Projects, DORA Metrics, etc.   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
                            │ (fetch)
┌───────────────────────────┴─────────────────────────────────┐
│                        Server Layer                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                             │   │
│  │  • RESTful API Routes                                │   │
│  │  • Controllers (Business Logic)                      │   │
│  │  • Services (External APIs & Data Processing)       │   │
│  │  • Schedulers (Cron Jobs for Data Collection)       │   │
│  │  • Middleware (CORS, Error Handling)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  External API Integrations:                                  │
│  • GitLab API (Projects, MRs, Issues, Commits)              │
│  • SonarQube API (Code Quality Metrics)                     │
│  • Google Gemini API (AI Insights)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │ SQL Queries
                            │ (pg library)
┌───────────────────────────┴─────────────────────────────────┐
│                       Database Layer                         │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (neon db)                                   │
│  │  • Projects (Tracked GitLab projects)                │   │
│  │  • Metrics (DORA, Health, Commits, MRs, Issues)     │   │
│  │  • SonarQube Data (Quality, Security, Reliability)  │   │
│  │  • Alerts & Insights                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. Client Layer (Frontend)

**Location:** `/client`

**Technology Stack:**
- React 18 with TypeScript
- Vite for fast development and building
- TailwindCSS for styling
- Fetch API (native browser) for API communication

**Key Components:**
- **Pages:** Dashboard, Project List, Project Details, DORA Metrics, Insights
- **Components:** Metric cards, charts, tables, project cards
- **API Client:** `/src/lib/api.ts` - centralized API calls to backend

**Communication:**
- Makes HTTP requests to backend REST API
- Receives JSON responses
- Default port: `8080` (development)

### 2. Server Layer (Backend)

**Location:** `/server`

**Technology Stack:**
- Node.js with Express.js
- TypeScript for type safety
- PostgreSQL client (`pg`)
- Node-cron for scheduled tasks

**Architecture Patterns:**
- **MVC Pattern:** Controllers handle requests, Services contain business logic
- **RESTful API:** Standard HTTP methods (GET, POST, PUT, DELETE)
- **Scheduled Jobs:** Automated data collection from GitLab and SonarQube

**Key Modules:**

**Routes** (`/src/routes`)
- Define API endpoints
- Map URLs to controller functions
- Handle request validation

**Controllers** (`/src/controllers`)
- Process incoming requests
- Validate input data
- Call appropriate services
- Return formatted responses

Example controllers:
- `projectController.ts` - Project management
- `doraMetricsController.ts` - DORA metrics
- `healthScoreController.ts` - Health scoring
- `aiController.ts` - AI insights

**Services** (`/src/services`)
- External API integrations (GitLab, SonarQube)
- Data transformation and calculation
- Business logic implementation

**Schedulers** (`/src/schedulers`)
- Cron jobs for periodic data collection
- Automated metric calculations
- Background processing

**Database** (`/src/db`)
- Connection management
- SQL queries and prepared statements
- Database schema (consolidated in `schema.sql`, loaded via `initializeTables()`)

**Communication:**
- Listens for HTTP requests on port `5000` (default)
- Connects to PostgreSQL using connection pooling
- Makes external API calls to GitLab and SonarQube
- Sends responses as JSON

### 3. Database Layer

**Technology:** PostgreSQL

**Key Tables:**
- `projects` - All GitLab projects
- `tracked_project_snapshots` - Historical snapshots for tracked projects
- `project_insights` - AI-generated insights
- `members` - Project members
- `issue_health_metrics` / `issue_metrics_history` - Issue tracking data
- `mr_health_metrics` / `mr_metrics_history` - Merge request metrics
- `commit_health_metrics` / `commit_metrics_history` - Commit statistics
- `milestone_health_metrics` / `milestone_metrics` - Milestone progress
- `sonarqube_maintainability_metrics` / `sonarqube_reliability_metrics` / `sonarqube_security_metrics` - Code quality from SonarQube (+ history tables)
- `deployment_frequency` / `lead_time_changes` / `change_failure_rate` / `time_to_restore_service` - DORA metrics
- `weekly_dora_snapshots` - Pre-computed weekly DORA data

**Communication:**
- Backend connects via PostgreSQL connection pool
- Uses parameterized queries for security
- Supports transactions for data consistency

## Data Flow

### User Request Flow

1. **User Action:** User interacts with UI (e.g., views project dashboard)
2. **API Request:** Frontend sends HTTP GET request to `/api/projects/:id`
3. **Route Handling:** Express router matches route and calls controller
4. **Controller:** `projectController.getProjectDetails()` executes
5. **Service Layer:** Calls database queries and external APIs if needed
6. **Database:** Executes SQL queries and returns data
7. **Response:** Data flows back through layers as JSON
8. **UI Update:** Frontend receives data and updates React components


## External Integrations

### GitLab API
- **Purpose:** Fetch project data, commits, MRs, issues
- **Authentication:** Personal access token
- **Rate Limits:** Respected with error handling

### SonarQube API
- **Purpose:** Code quality, security, reliability metrics
- **Authentication:** Token-based
- **Data:** Quality gates, code smells, bugs, vulnerabilities

### Google Gemini API
- **Purpose:** Generate AI-powered insights
- **Usage:** Analyze metrics and provide recommendations
- **Context:** Uses project metrics as input


## Development Setup

1. **Backend:** `cd server && npm install && npm run dev`
2. **Frontend:** `cd client && npm install && npm run dev`
3. **Environment:** Configure `.env` files with API tokens

