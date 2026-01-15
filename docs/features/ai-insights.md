# AI Insights Feature Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Sources](#data-sources)
4. [Services](#services)
5. [Controllers](#controllers)
6. [Database Schema](#database-schema)
7. [Frontend Components](#frontend-components)
8. [User Flow](#user-flow)
9. [Detailed Workflows](#detailed-workflows)
10. [API Endpoints](#api-endpoints)
11. [Error Handling](#error-handling)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The **AI Insights** feature provides intelligent, data-driven project health analysis using Google's Gemini AI. It combines:
- **User-submitted form data** from Google Sheets (qualitative project metrics)
- **API-driven metrics** from GitLab and SonarCloud (quantitative technical data)
- **AI-powered analysis** to generate actionable recommendations

The system uses a two-step user flow:
1. **Fetch saved insights** from database (if available)
2. **Generate new insights** via Gemini AI (if not available or requested)

### Key Features:
- Generates comprehensive project health scores (1-5 scale)
- Combines user evaluations with API metrics
- Provides section-wise analysis (Code Review, Tech Debt, Testing, etc.)
- Saves insights to database for quick retrieval
- Displays historical trends and radar charts
- Offers actionable recommendations for improvement

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React)                           │
│  ┌────────────────┐           ┌────────────────────────────┐   │
│  │ TrackedProjects│           │   ProjectInsight.tsx       │   │
│  │   (AI Icon)    │──────────▶│   (Single Project View)    │   │
│  └────────────────┘           └────────────────────────────┘   │
│                                         │                        │
│                                         ▼                        │
│                            ┌──────────────────────┐             │
│                            │ API Call to Backend  │             │
│                            │ GET or POST          │             │
│                            └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                     │
│  ┌────────────────┐         ┌──────────────────────────────┐   │
│  │ aiController   │────────▶│  projectInsightsService      │   │
│  │  (HTTP Layer)  │         │  (Business Logic)            │   │
│  └────────────────┘         └──────────────────────────────┘   │
│                                         │                        │
│                                         ▼                        │
│              ┌──────────────────────────────────────────┐       │
│              │         Data Aggregation Layer           │       │
│              │  ┌───────────────┐  ┌──────────────┐    │       │
│              │  │ Google Sheets │  │ DB Snapshot  │    │       │
│              │  │   Service     │  │  (queries)   │    │       │
│              │  └───────────────┘  └──────────────┘    │       │
│              └──────────────────────────────────────────┘       │
│                                         │                        │
│                                         ▼                        │
│              ┌──────────────────────────────────────────┐       │
│              │      geminiService (AI Layer)            │       │
│              │   - Sends prompt to Gemini API           │       │
│              │   - Returns AI-generated insights        │       │
│              └──────────────────────────────────────────┘       │
│                                         │                        │
│                                         ▼                        │
│              ┌──────────────────────────────────────────┐       │
│              │     Parse & Save to Database             │       │
│              │   (saveProjectInsights query)            │       │
│              └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │  PostgreSQL DB  │
                              │ project_insights│
                              └─────────────────┘
```

---

## Data Sources

### 1. Google Sheets (User Form Data)
**Source:** Google Forms collecting project quality evaluations  
**Fields Include:**
- Code Review Quality (thoroughness, response time, team participation)
- Technical Debt (level, time spent fixing, impact on velocity)
- Test Quality (reliability, coverage, execution time)
- Documentation (completeness, clarity, onboarding time)
- Deployment Health (frequency, success rate, MTTR)
- Dependencies (update frequency, security vulnerabilities)
- Team Morale (satisfaction, velocity, collaboration)

**Access Method:**
- `googleSheetsService.downloadAsExcel(GOOGLE_SHEET_URL)` - Downloads sheet as Excel
- Parsed using `XLSX` library to extract project-specific rows
- Each row represents a project evaluation with ~30+ metrics

### 2. Database Snapshots (API Metrics)
**Source:** `tracked_project_snapshots` table  
**Contains:**
- GitLab metrics: Open issues, merge requests, commits
- SonarQube metrics: Code smells, bugs, vulnerabilities, technical debt
- Reliability, security, and maintainability scores

**Access Method:**
- `getLatestSnapshotByProjectName(projectName)` - Fetches most recent snapshot
- Provides quantitative metrics collected via API integrations

### 3. Prompt Template
**File:** `server/src/prompts/project-insights-prompt.txt`  
**Contains:**
- Scoring formulas for each metric category
- Section-wise score calculation instructions
- Final score weighting logic (70% user score + 30% API score)
- Output format specification (JSON with detailed calculations)

---

## Services

### 1. **projectInsightsService** (`server/src/services/ai/projectInsightsService.ts`)
**Purpose:** Orchestrates AI insights generation by aggregating data and calling Gemini API.

**Key Methods:**

#### `generateInsights(projectName: string): Promise<string>`
Main method that generates AI insights for a project.

**Steps:**
1. Load base prompt template from file
2. Download Google Sheet as Excel
3. Parse Excel workbook into JSON
4. Extract project row matching `projectName`
5. Fetch latest database snapshot for the project
6. Build comprehensive prompt combining all data sources
7. Send prompt to Gemini API via `geminiService`
8. Return AI-generated insights (JSON string)

**Example:**
```typescript
const insights = await projectInsightsService.generateInsights('my-project');
// Returns: JSON string with scores, analysis, and recommendations
```

#### `loadPrompt(): Promise<string>`
Reads the prompt template file from disk.

**Location:** `server/src/prompts/project-insights-prompt.txt`  
**Returns:** Full prompt text with formulas and instructions

#### `extractProjectRow(sheets: any, projectName: string): any`
Finds the project row in the parsed Google Sheets data.

**Logic:**
- Iterates through all sheets in the workbook
- Searches for a row where project name matches (case-insensitive)
- Returns the first matching row or `null` if not found

#### `buildInsightsPrompt(basePrompt, projectName, projectRow, projectSnapshot): string`
Combines all data sources into a single comprehensive prompt.

**Structure:**
```
[Base Prompt with Formulas]

### User-Submitted Data (Google Form):
```json
{
  "Project Name": "my-project",
  "Code Review Thoroughness (1–5)": 4,
  "Review Response Time (hours)": 2,
  // ... 30+ metrics
}
```

### API Metrics (GitLab + SonarCloud):
```json
{
  "gitlab": {
    "open_issues": 12,
    "open_merge_requests": 3,
    "commits_last_30_days": 45
  },
  "sonarqube": {
    "code_smells": 23,
    "bugs": 2,
    "vulnerabilities": 0,
    "technical_debt_minutes": 180
  }
}
```

Please calculate all scores and provide detailed analysis.
```

---

### 2. **geminiService** (`server/src/services/ai/geminiService.ts`)
**Purpose:** Handles direct communication with Google Gemini API.

**Key Methods:**

#### `generateTextResponse(prompt: string, maxRetries: number = 3): Promise<string>`
Sends text prompt to Gemini and returns AI-generated response.

**Model Used:** `gemini-2.5-flash-lite`  
**Features:**
- Exponential backoff retry logic (2s, 4s, 8s)
- Handles network errors (`ECONNRESET`, `fetch failed`)
- Logs each attempt for debugging

**Example:**
```typescript
const response = await geminiService.generateTextResponse(enhancedPrompt);
// Returns: Plain text (formatted as JSON because prompt instructs it)
// Example: '{"section_scores": [...], "final_user_score": 3.85}'
// This text is later parsed with JSON.parse() in the controller
```

**API Key:** Set via `process.env.GEMINI_API_KEY`

#### `generateResponseWithFile(prompt, fileBase64, mimeType): Promise<string>`
Sends prompt with attached file (Excel, PDF) to Gemini.

**Use Case:** Alternative method for sending Google Sheets directly to Gemini.  
**Currently:** Not used in main workflow (Excel parsed locally instead).

---

### 3. **googleSheetsService** (`server/src/services/ai/googleSheetsService.ts`)
**Purpose:** Downloads and converts Google Sheets to Excel format.

**Key Method:**

#### `downloadAsExcel(sheetUrl: string): Promise<string>`
Downloads a Google Sheet as Excel file (base64 encoded).

**Process:**
1. Converts Google Sheets URL to export URL (`/export?format=xlsx`)
2. Fetches the file via HTTP GET
3. Converts response to base64 string
4. Returns base64 data for parsing

**Example:**
```typescript
const excelBase64 = await googleSheetsService.downloadAsExcel(GOOGLE_SHEET_URL);
const buffer = Buffer.from(excelBase64, 'base64');
const workbook = XLSX.read(buffer, { type: 'buffer' });
```

---

## Controllers

### **aiController** (`server/src/controllers/aiController.ts`)

HTTP request handlers for AI-related endpoints.

#### 1. `generateProjectInsights(req, res)`
**Route:** `POST /api/ai/project-insights`  
**Purpose:** Generate new AI insights for a project.

**Request Body:**
```json
{
  "projectName": "my-project"
}
```

**Process:**
1. Extract `projectName` from request body
2. Call `projectInsightsService.generateInsights(projectName)`
3. Parse AI response as JSON (handle malformed JSON)
4. Correct any inconsistencies using `parseAndCorrectInsights()`
5. Save to database via `saveProjectInsights(projectName, parsedData)`
6. Return insights to client

**Response:**
```json
{
  "insights": {
    "section_scores": [...],
    "final_user_score": 3.85,
    "api_scores": {
      "api_score": 4.2
    },
    "combined_score": 3.96,
    "recommendations": [...],
    "detailed_calculations": "..."
  }
}
```

**Error Handling:**
- Returns 400 if `projectName` missing
- Returns 500 if generation or parsing fails
- Logs all errors for debugging

---

#### 2. `getProjectInsights(req, res)`
**Route:** `GET /api/ai/project-insights/:projectName`  
**Purpose:** Fetch saved insights from database.

**Request Parameters:**
- `:projectName` - URL parameter with project name

**Process:**
1. Extract `projectName` from URL params
2. Call `getLatestProjectInsights(projectName)` to query DB
3. Return insights if found
4. Return 404 if no insights exist

**Response (if found):**
```json
{
  "uuid": "abc-123",
  "row_id": 5,
  "insights_data": { /* full insights object */ },
  "final_user_score": 3.85,
  "api_score": 4.2,
  "combined_score": 3.96,
  "created_at": "2024-01-15T10:30:00Z",
  "project_name": "my-project"
}
```

**Response (if not found):**
```json
{
  "message": "No insights found for project: my-project"
}
```
Status Code: 404

**User Flow Impact:** When frontend receives 404, it shows "Generate Insights" button.

---

#### 3. `getProjectInsightsHistoryById(req, res)`
**Route:** `GET /api/ai/project-insights-history/:projectId`  
**Purpose:** Fetch historical insights for trend analysis and quality score charts.

**Request Parameters:**
- `:projectId` - Project UUID

**Process:**
1. Extract `projectId` from URL params
2. Call `getProjectInsightsHistory(projectId)` to query all insights
3. Return array of insights ordered by `created_at DESC`

**Response:**
```json
{
  "history": [
    {
      "uuid": "abc-123",
      "insights_data": {
        "section_scores": [
          { "name": "Code Review", "score": 4.2 },
          { "name": "Technical Debt", "score": 3.5 }
        ]
      },
      "final_user_score": 3.85,
      "api_score": 4.2,
      "combined_score": 3.96,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "uuid": "abc-124",
      "insights_data": {
        "section_scores": [
          { "name": "Code Review", "score": 4.0 },
          { "name": "Technical Debt", "score": 3.3 }
        ]
      },
      "final_user_score": 3.72,
      "api_score": 4.1,
      "combined_score": 3.88,
      "created_at": "2024-01-08T10:30:00Z"
    }
    // ... more historical entries
  ]
}
```

**Use Case:** 
- Display "Quality Score Trends" line chart on ProjectDetail.tsx (Metrics tab)
- Show improvement/decline over time for all section scores
- Track API Score and Combined Score trends
- Enable data-driven decisions about where to focus improvement efforts

---

#### 4. `getAllProjectInsights(req, res)`
**Route:** `GET /api/ai/all-project-insights`  
**Purpose:** Fetch insights for all projects (overview page).

**Process:**
1. Call `getAllLatestProjectInsights()` to query DB
2. Transform each row into structured format
3. Return array of all projects with their latest insights

**Response:**
```json
{
  "projects": [
    {
      "id": 123,
      "uuid": "abc-123",
      "name": "my-project",
      "group": "backend",
      "metrics": {
        "codeReview": 4.2,
        "technicalDebt": 3.5,
        "testQuality": 4.0,
        "documentation": 3.8,
        "deployment": 4.5,
        "dependencies": 3.9,
        "teamMorale": 4.1,
        "apiScore": 4.2,
        "combinedScore": 3.96
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
    // ... more projects
  ]
}
```

**Use Case:** Display all project insights on `ProjectInsights.tsx` page with radar charts.

---

## Database Schema

### Table: `project_insights`

Stores AI-generated project health insights with scores and analysis.

```sql
CREATE TABLE project_insights (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique identifier for each insight entry
  row_id SERIAL,                                    -- Auto-incrementing ID for ordering
  project_uuid UUID REFERENCES projects(uuid),      -- Foreign key linking to projects table
  project_name TEXT,                                -- Denormalized project name for quick lookup
  insights_data JSONB NOT NULL,                     -- Full AI response (scores, analysis, recommendations)
  final_user_score DECIMAL(5,2),                    -- User evaluation score (1-5) from Google Form data
  api_score DECIMAL(5,2),                           -- API metrics score (1-5) from GitLab + SonarQube
  combined_score DECIMAL(5,2),                      -- Weighted score: 0.7*user + 0.3*api (1-5)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP    -- Timestamp when insights were generated
);

-- Index for fast project lookups
CREATE INDEX idx_project_insights_project_uuid ON project_insights(project_uuid);
CREATE INDEX idx_project_insights_created_at ON project_insights(created_at DESC);
```

#### Column Explanations:

| Column | Type | Purpose | Example Value |
|--------|------|---------|---------------|
| `uuid` | UUID | Primary key, unique identifier for each insight | `550e8400-e29b-41d4-a716-446655440000` |
| `row_id` | SERIAL | Auto-incrementing ID for ordering/pagination | `1, 2, 3...` |
| `project_uuid` | UUID | Foreign key to `projects` table | References `projects.uuid` |
| `project_name` | TEXT | Denormalized project name (avoids JOIN) | `"gitlab-dashboard"` |
| `insights_data` | JSONB | Full AI response with section scores, analysis, recommendations | `{"section_scores": [...], "recommendations": [...]}` |
| `final_user_score` | DECIMAL(5,2) | Weighted average of user-submitted form data (1-5 scale) | `3.85` |
| `api_score` | DECIMAL(5,2) | Score calculated from GitLab + SonarQube metrics (1-5 scale) | `4.20` |
| `combined_score` | DECIMAL(5,2) | Final score: `0.7 * final_user_score + 0.3 * api_score` | `3.96` |
| `created_at` | TIMESTAMP | When the insights were generated | `2024-01-15 10:30:00` |

#### Example Row:
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "row_id": 42,
  "project_uuid": "abc-def-123",
  "project_name": "my-awesome-project",
  "insights_data": {
    "section_scores": [
      { "name": "Code Review Quality", "score": 4.2, "analysis": "..." },
      { "name": "Technical Debt", "score": 3.5, "analysis": "..." }
    ],
    "final_user_score": 3.85,
    "api_scores": {
      "api_score": 4.2
    },
    "combined_score": 3.96,
    "recommendations": [
      "Reduce code review response time",
      "Address high-priority technical debt"
    ],
    "detailed_calculations": "Code Review Quality\nScore = 4.2\n..."
  },
  "final_user_score": 3.85,
  "api_score": 4.2,
  "combined_score": 3.96,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## Frontend Components

### 1. **ProjectInsight.tsx** (`client/src/pages/ProjectInsight.tsx`)
**Purpose:** Single project AI insights view (detailed breakdown).

**Key Features:**
- Displays section-wise scores
- Shows API score, user score, and combined score
- Lists actionable recommendations
- Shows detailed calculation breakdown

**Key Functions:**

#### `loadSavedInsights(projectName: string)`
Fetches existing insights from database.

**API Call:**
```typescript
const response = await api.get(`/ai/project-insights/${projectName}`);
```

**Flow:**
- If insights found (200): Parse and display
- If not found (404): Set `hasInsights = false` → Show "Generate Insights" button
- If error: Show error toast

#### `generateInsightsForProject(projectName: string)`
Triggers new AI insights generation.

**API Call:**
```typescript
const response = await api.post('/ai/project-insights', { projectName });
```

**Flow:**
1. Show loading spinner
2. Call POST endpoint
3. Parse response (handle malformed JSON)
4. Extract section scores from `detailed_calculations` field
5. Display insights
6. Show success toast

**UI States:**
- **Loading:** Shows spinner while generating
- **No Insights:** Shows "No saved insights found. Click Generate Insights" button
- **Insights Available:** Displays scores, charts, analysis, recommendations

---

### 2. **ProjectInsights.tsx** (`client/src/pages/ProjectInsights.tsx`)
**Purpose:** Overview page showing all projects with insights.

**Key Features:**
- Lists all projects with their latest insights
- Displays radar chart for each project
- Shows combined score badge
- Links to detailed view (`ProjectInsight.tsx`)

**API Call:**
```typescript
const response = await fetch('/api/ai/all-project-insights');
const data = await response.json();
setProjects(data.projects || []);
```

**Display Format:**
- Grid of project cards
- Each card shows:
  - Project name and group
  - Combined score (colored badge)
  - Radar chart with 8 metrics
  - "View Details" link to full insights page

---

### 3. **TrackedProjects.tsx** (AI Icon Integration)
**Purpose:** Shows tracked projects list with AI icon to view insights.

**AI Icon Implementation:**
```tsx
import { Sparkles } from "lucide-react";

<Link to={`/project-insight/${project.name}`}>
  <Button variant="outline" size="sm" title="AI Insights">
    <Sparkles className="h-4 w-4" />
  </Button>
</Link>
```

**User Flow:**
1. User clicks AI icon (Sparkles) next to a tracked project
2. Navigates to `/project-insight/:projectName`
3. `ProjectInsight.tsx` component loads
4. Automatically calls `loadSavedInsights()` on mount
5. Shows existing insights OR "Generate Insights" button

---

### 4. **ProjectDetail.tsx** (Quality Score Trends Chart)
**Purpose:** Displays historical AI insights scores as a line chart showing improvement over time.

**Key Features:**
- Shows trends for all section scores (Code Review, Technical Debt, Test Quality, Documentation, Deployment, Dependencies, Team Morale)
- Displays API Score trend (green line, thicker)
- Displays Combined Score trend (blue line, thicker)
- X-axis: Date of insight generation (e.g., "Jan 15", "Jan 22")
- Y-axis: Score (0-5 scale)
- Multiple colored lines for different metrics

**Data Fetching:**
```typescript
useEffect(() => {
  const fetchInsightsHistory = async () => {
    const response = await api.get(`/ai/project-insights-history/${projectId}`);
    
    if (response.history && response.history.length > 0) {
      setInsightsHistory(response.history);
      
      // Transform data for chart
      const transformedData = response.history.map((insight: any) => {
        const date = new Date(insight.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        
        const sections = insight.insights_data?.section_scores || [];
        const chartPoint: any = { date };
        
        // Add each section score to chart point
        sections.forEach((section: any) => {
          chartPoint[section.name] = section.score;
        });
        
        // Add aggregate scores
        chartPoint['API Score'] = insight.api_score;
        chartPoint['Combined Score'] = insight.combined_score;
        
        return chartPoint;
      });
      
      setChartData(transformedData);
    }
  };
  
  fetchInsightsHistory();
}, [projectId]);
```

**Chart Implementation:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Quality Score Trends</CardTitle>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Legend />
        
        {/* 7 Section Score Lines */}
        <Line type="monotone" dataKey="Code Review" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="Technical Debt" stroke="#82ca9d" strokeWidth={2} />
        <Line type="monotone" dataKey="Test Quality" stroke="#ffc658" strokeWidth={2} />
        <Line type="monotone" dataKey="Documentation" stroke="#ff7c7c" strokeWidth={2} />
        <Line type="monotone" dataKey="Deployment" stroke="#a28bd4" strokeWidth={2} />
        <Line type="monotone" dataKey="Dependencies" stroke="#ff9f43" strokeWidth={2} />
        <Line type="monotone" dataKey="Team Morale" stroke="#54a0ff" strokeWidth={2} />
        
        {/* Aggregate Scores (thicker lines) */}
        <Line type="monotone" dataKey="API Score" stroke="#10b981" strokeWidth={3} />
        <Line type="monotone" dataKey="Combined Score" stroke="#3b82f6" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Use Case:**
- Track project improvement over time (weekly/monthly insights)
- Identify which metrics are improving vs. declining
- Visualize impact of technical debt initiatives
- Compare section scores to see which areas need focus
- Monitor Combined Score trend to assess overall project health

**Example Chart Data:**
```typescript
[
  {
    date: "Jan 8",
    "Code Review": 4.2,
    "Technical Debt": 3.5,
    "Test Quality": 4.0,
    "Documentation": 3.8,
    "Deployment": 4.5,
    "Dependencies": 3.9,
    "Team Morale": 4.1,
    "API Score": 4.2,
    "Combined Score": 3.96
  },
  {
    date: "Jan 15",
    "Code Review": 4.3,
    "Technical Debt": 3.7, // Improved!
    "Test Quality": 4.1,
    "Documentation": 4.0, // Improved!
    "Deployment": 4.6,
    "Dependencies": 4.0,
    "Team Morale": 4.2,
    "API Score": 4.3,
    "Combined Score": 4.05 // Overall improvement
  }
]
```

**Access:**
- Navigate to tracked project detail page
- Click "Metrics" tab
- First card shows "Quality Score Trends" with line chart
- Requires at least 1 AI insight generated for the project

---

## User Flow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: User clicks AI icon on tracked project                 │
│         (TrackedProjects.tsx → Sparkles icon)                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Navigate to /project-insight/:projectName               │
│         (ProjectInsight.tsx component mounts)                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Auto-call loadSavedInsights(projectName)                │
│         API: GET /api/ai/project-insights/:projectName          │
└─────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
        ┌───────────▼─────┐    ┌────▼──────────────┐
        │  Insights Found │    │ Insights Not Found│
        │   (200 OK)      │    │    (404 Error)    │
        └───────────┬─────┘    └────┬──────────────┘
                    │                │
                    ▼                ▼
        ┌─────────────────┐    ┌──────────────────────────────┐
        │ Display Insights│    │ Show Message:                │
        │ - Radar Chart   │    │ "No saved insights found.    │
        │ - Scores        │    │  Click Generate Insights"    │
        │ - Analysis      │    │                              │
        │ - Recommendations│   │ [Generate Insights] Button   │
        └─────────────────┘    └──────────┬───────────────────┘
                                           │
                               User clicks Generate button
                                           │
                                           ▼
                    ┌──────────────────────────────────────┐
                    │ Step 4: generateInsightsForProject() │
                    │ API: POST /api/ai/project-insights   │
                    │ Body: { "projectName": "..." }       │
                    └──────────┬───────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────────┐
        │ Backend Process (in order):                      │
        │                                                  │
        │ 1. Load prompt template from file                │
        │ 2. Download Google Sheet as Excel                │
        │ 3. Parse Excel to JSON                           │
        │ 4. Find project row in Google Sheet data         │
        │ 5. Fetch latest DB snapshot (GitLab + SonarQube) │
        │ 6. Build comprehensive prompt:                   │
        │    - Base prompt with formulas                   │
        │    - User form data                              │
        │    - API metrics                                 │
        │ 7. Call Gemini API with prompt                   │
        │ 8. Parse AI response (JSON)                      │
        │ 9. Correct any inconsistencies                   │
        │ 10. Save to project_insights table               │
        │ 11. Return insights to frontend                  │
        └──────────┬───────────────────────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Step 5: Display     │
        │ Generated Insights  │
        │ - Parse JSON        │
        │ - Extract scores    │
        │ - Show success toast│
        │ - Render UI         │
        └─────────────────────┘
```

### Critical User Flow Points:

**1. Two-Step Approach (Key to Understanding):**
- **First:** Always try to fetch from database (fast)
- **Second:** Only generate new insights if not found (slow, ~10-30 seconds)

**2. Why This Approach?**
- Generating insights is expensive (API call to Gemini)
- Generating insights takes time (processing Google Sheets + DB data)
- Most users want to view existing insights, not generate new ones

**3. When Are New Insights Generated?**
- When no insights exist for the project (first time)
- When user explicitly clicks "Generate Insights" button
- When insights are outdated and user wants fresh analysis

---

## Detailed Workflows

### Workflow 1: Fetch Saved Insights from Database

**Trigger:** User clicks AI icon on tracked project, OR navigates to `/project-insight/:projectName`

**Frontend Steps:**
1. **Component Mount** (`ProjectInsight.tsx`)
   ```typescript
   useEffect(() => {
     loadSavedInsights(projectName);
   }, [projectName]);
   ```

2. **API Call** (GET request)
   ```typescript
   const response = await api.get(`/ai/project-insights/${projectName}`);
   // Full URL: GET /api/ai/project-insights/my-project
   ```

**Backend Steps:**
3. **Route Handler** (`server/src/routes/index.ts`)
   ```typescript
   router.get('/ai/project-insights/:projectName', aiController.getProjectInsights);
   ```

4. **Controller** (`aiController.getProjectInsights`)
   ```typescript
   const { projectName } = req.params;
   const insights = await getLatestProjectInsights(projectName);
   
   if (!insights) {
     return res.status(404).json({
       message: `No insights found for project: ${projectName}`
     });
   }
   
   res.json(insights);
   ```

5. **Database Query** (`queries.ts - getLatestProjectInsights`)
   ```typescript
   const query = `
     SELECT 
       pi.uuid,
       pi.row_id,
       pi.insights_data,
       pi.final_user_score,
       pi.api_score,
       pi.combined_score,
       pi.created_at,
       p.name as project_name
     FROM project_insights pi
     JOIN projects p ON pi.project_uuid = p.uuid
     WHERE LOWER(p.name) = LOWER($1)
     ORDER BY pi.created_at DESC
     LIMIT 1
   `;
   
   const result = await pool.query(query, [projectName]);
   return result.rows[0] || null;
   ```

**Database State:**
- **Before:** Query executes against `project_insights` table
- **Result:** Returns most recent insight row for the project

**Response (200 OK):**
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "row_id": 42,
  "insights_data": {
    "section_scores": [
      {
        "name": "Code Review Quality",
        "score": 4.2,
        "analysis": "Strong code review practices with good team participation..."
      }
    ],
    "final_user_score": 3.85,
    "api_scores": {
      "api_score": 4.2,
      "gitlab": { "open_issues": 12, "commits": 45 },
      "sonarqube": { "code_smells": 23, "bugs": 2 }
    },
    "combined_score": 3.96,
    "recommendations": [
      "Reduce code review response time to under 2 hours",
      "Address 5 high-priority technical debt items"
    ]
  },
  "final_user_score": 3.85,
  "api_score": 4.2,
  "combined_score": 3.96,
  "created_at": "2024-01-15T10:30:00Z",
  "project_name": "my-project"
}
```

**Response (404 Not Found):**
```json
{
  "message": "No insights found for project: my-project"
}
```

**Frontend Handling:**
6. **Parse Response**
   ```typescript
   if (response.ok) {
     const data = await response.json();
     setParsedInsights(data.insights_data);
     setHasInsights(true);
   } else if (response.status === 404) {
     setHasInsights(false);
     setError("No saved insights found. Click Generate Insights to create.");
   }
   ```

7. **UI Update**
   - **If found:** Display radar chart, scores, analysis, recommendations
   - **If not found:** Show "Generate Insights" button

---

### Workflow 2: Generate New AI Insights

**Trigger:** User clicks "Generate Insights" button on `ProjectInsight.tsx`

**Frontend Steps:**
1. **Button Click Handler**
   ```typescript
   const generateInsightsForProject = async (projectName: string) => {
     setGenerating(true); // Show spinner
     
     const response = await api.post('/ai/project-insights', {
       projectName: projectName
     });
   };
   ```

2. **API Call** (POST request)
   ```http
   POST /api/ai/project-insights
   Content-Type: application/json
   
   {
     "projectName": "my-project"
   }
   ```

**Backend Steps:**
3. **Route Handler** (`server/src/routes/index.ts`)
   ```typescript
   router.post('/ai/project-insights', aiController.generateProjectInsights);
   ```

4. **Controller** (`aiController.generateProjectInsights`)
   ```typescript
   const { projectName } = req.body;
   
   // Validate input
   if (!projectName) {
     return res.status(400).json({ error: 'Project name is required' });
   }
   
   // Generate insights
   const rawInsights = await projectInsightsService.generateInsights(projectName);
   
   // Parse AI response
   let parsedInsights = JSON.parse(rawInsights);
   parsedInsights = parseAndCorrectInsights(parsedInsights);
   
   // Save to database
   await saveProjectInsights(projectName, parsedInsights);
   
   res.json({ insights: parsedInsights });
   ```

5. **Service - Load Prompt** (`projectInsightsService.loadPrompt`)
   ```typescript
   const promptPath = path.join(__dirname, '../../prompts/project-insights-prompt.txt');
   const promptText = await fs.readFile(promptPath, 'utf-8');
   // Returns: Full prompt template with formulas
   ```

6. **Service - Download Google Sheet** (`googleSheetsService.downloadAsExcel`)
   ```typescript
   const excelBase64 = await googleSheetsService.downloadAsExcel(GOOGLE_SHEET_URL);
   // Converts: https://docs.google.com/spreadsheets/d/SHEET_ID
   // To: https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=xlsx
   // Returns: Base64-encoded Excel file
   ```

7. **Service - Parse Excel**
   ```typescript
   const buffer = Buffer.from(excelBase64, 'base64');
   const workbook = XLSX.read(buffer, { type: 'buffer' });
   const sheets: { [key: string]: any[] } = {};
   
   workbook.SheetNames.forEach((sheetName) => {
     const worksheet = workbook.Sheets[sheetName];
     sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
   });
   
   // Result: { "Form Responses 1": [ {row1}, {row2}, ... ] }
   ```

8. **Service - Extract Project Row**
   ```typescript
   const projectRow = this.extractProjectRow(sheets, projectName);
   
   // Searches through all sheets for matching project name
   // Returns: { "Project Name": "my-project", "Code Review (1-5)": 4, ... }
   ```

9. **Service - Fetch DB Snapshot**
   ```typescript
   const projectSnapshot = await getLatestSnapshotByProjectName(projectName);
   
   // Returns: {
   //   open_issues: 12,
   //   open_merge_requests: 3,
   //   sonar_code_smells: 23,
   //   sonar_bugs: 2,
   //   ...
   // }
   ```

10. **Service - Build Comprehensive Prompt**
    ```typescript
    const enhancedPrompt = this.buildInsightsPrompt(
      basePrompt,
      projectName,
      projectRow,
      projectSnapshot
    );
    
    // Result: Multi-section prompt combining:
    // - Base formulas and instructions
    // - User form data (30+ metrics from Google Sheets)
    // - API metrics (GitLab + SonarQube from DB)
    ```

    **Example Prompt Structure:**
    ```
    [Base Prompt - 200 lines of formulas and instructions]
    
    ### User-Submitted Data (Google Form):
    ```json
    {
      "Project Name": "my-project",
      "Code Review Thoroughness (1–5)": 4,
      "Review Response Time (hours)": 2,
      "% of Team Reviewing Code": 80,
      "Tech Debt Level (1–10)": 6,
      "% Time Fixing Old Code": 25,
      ...
    }
    ```
    
    ### API Metrics (GitLab + SonarCloud):
    ```json
    {
      "gitlab": {
        "open_issues": 12,
        "open_merge_requests": 3,
        "commits_last_30_days": 45
      },
      "sonarqube": {
        "code_smells": 23,
        "bugs": 2,
        "vulnerabilities": 0,
        "technical_debt_minutes": 180
      }
    }
    ```
    
    Please calculate all scores, provide detailed analysis, and identify specific areas needing improvement.
    ```

11. **Gemini API Call** (`geminiService.generateTextResponse`)
    ```typescript
    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite' 
    });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const aiText = response.text(); // Returns TEXT (not parsed JSON)
    
    // aiText is a STRING that looks like JSON because our prompt asked for JSON format
    // Example: '{"section_scores": [...], "final_user_score": 3.85, ...}'
    ```

    **Gemini API Response (as TEXT string):**
    ```json
    {
      "section_scores": [
        {
          "name": "Code Review Quality",
          "score": 4.2,
          "analysis": "Strong code review practices. Team shows 80% participation..."
        },
        {
          "name": "Technical Debt",
          "score": 3.5,
          "analysis": "Moderate technical debt. 25% of time spent on maintenance..."
        }
      ],
      "final_user_score": 3.85,
      "api_scores": {
        "api_score": 4.2,
        "gitlab": { "score": 4.5, "analysis": "..." },
        "sonarqube": { "score": 3.9, "analysis": "..." }
      },
      "combined_score": 3.96,
      "recommendations": [
        "Reduce code review response time to under 2 hours",
        "Allocate 20% sprint capacity to address technical debt"
      ],
      "detailed_calculations": "Code Review Quality\nScore = 4.2\n..."
    }
    ```

12. **Parse and Correct Insights** (`parseAndCorrectInsights`)
    ```typescript
    // rawInsights is a TEXT STRING from Gemini, not a parsed object yet
    // We need to parse it into a JavaScript object
    let parsed = JSON.parse(rawInsights); // Convert text string → JS object
    
    // Ensure scores are numbers (sometimes Gemini returns them as strings)
    if (typeof parsed.final_user_score === 'string') {
      parsed.final_user_score = parseFloat(parsed.final_user_score);
    }
    
    // Ensure section_scores is array (sometimes Gemini returns it as an object)
    if (parsed.section_scores && !Array.isArray(parsed.section_scores)) {
      parsed.section_scores = Object.entries(parsed.section_scores).map(...);
    }
    
    return parsed; // Now it's a proper JavaScript object
    ```

13. **Save to Database** (`saveProjectInsights`)
    ```typescript
    // Get project UUID
    const projectResult = await pool.query(
      'SELECT uuid FROM projects WHERE LOWER(name) = LOWER($1)',
      [projectName]
    );
    const projectUuid = projectResult.rows[0].uuid;
    
    // Insert insights
    await pool.query(
      `INSERT INTO project_insights 
       (project_uuid, insights_data, final_user_score, api_score, combined_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        projectUuid,
        JSON.stringify(parsedInsights),
        parsedInsights.final_user_score,
        parsedInsights.api_scores?.api_score,
        parsedInsights.combined_score
      ]
    );
    ```

**Database State:**
- **Before:** `project_insights` table has 0 rows for this project
- **After:** New row inserted with generated insights

**Example Inserted Row:**
```sql
uuid: '550e8400-e29b-41d4-a716-446655440000'
row_id: 42
project_uuid: 'abc-def-123'
project_name: NULL -- Populated by trigger or constraint
insights_data: '{"section_scores": [...], "recommendations": [...]}'
final_user_score: 3.85
api_score: 4.20
combined_score: 3.96
created_at: '2024-01-15 10:30:00'
```

14. **Return Response to Frontend**
    ```typescript
    res.json({ insights: parsedInsights });
    ```

**Frontend Handling:**
15. **Parse and Display**
    ```typescript
    const data = await response.json();
    const parsed = data.insights;
    
    // Extract section scores from detailed_calculations
    // (Sometimes Gemini returns scores in text, not JSON fields)
    const extractSectionScore = (sectionName: string): number => {
      const regex = new RegExp(`${sectionName}[\\s\\S]*?Section Score\\s*[=:]([^\\n]+)`, 'i');
      const match = parsed.detailed_calculations.match(regex);
      // Parse number from calculation line
    };
    
    // Update section scores with extracted values
    parsed.section_scores = parsed.section_scores.map((section) => ({
      ...section,
      score: extractSectionScore(section.name) || section.score
    }));
    
    setParsedInsights(parsed);
    toast({ title: "Success", description: "Insights generated successfully" });
    ```

16. **UI Update**
    - Display radar chart with section scores
    - Show final user score, API score, combined score
    - List recommendations
    - Show detailed calculations accordion

**Timeline:**
- Total time: ~10-30 seconds
- Breakdown:
  - Download Google Sheet: ~2 seconds
  - Parse Excel: ~1 second
  - Fetch DB snapshot: ~0.5 seconds
  - Gemini API call: ~5-20 seconds (varies)
  - Parse and save: ~1 second

---

### Workflow 3: Display All Project Insights (Overview)

**Trigger:** User navigates to `/project-insights` page

**Frontend Steps:**
1. **Component Mount** (`ProjectInsights.tsx`)
   ```typescript
   useEffect(() => {
     fetchAllProjectInsights();
   }, []);
   ```

2. **API Call**
   ```typescript
   const response = await fetch('/api/ai/all-project-insights');
   const data = await response.json();
   setProjects(data.projects || []);
   ```

**Backend Steps:**
3. **Route Handler**
   ```typescript
   router.get('/ai/all-project-insights', aiController.getAllProjectInsights);
   ```

4. **Controller** (`getAllProjectInsights`)
   ```typescript
   const insights = await getAllLatestProjectInsights();
   
   const projects = insights.map((row) => ({
     id: row.project_id,
     uuid: row.project_uuid,
     name: row.project_name,
     group: row.project_group,
     metrics: {
       codeReview: extractScore(row, 'Code Review'),
       technicalDebt: extractScore(row, 'Technical Debt'),
       testQuality: extractScore(row, 'Test Quality'),
       documentation: extractScore(row, 'Documentation'),
       deployment: extractScore(row, 'Deployment'),
       dependencies: extractScore(row, 'Dependencies'),
       teamMorale: extractScore(row, 'Team Morale'),
       apiScore: row.api_score,
       combinedScore: row.combined_score
     },
     created_at: row.created_at
   }));
   
   res.json({ projects });
   ```

5. **Database Query** (`getAllLatestProjectInsights`)
   ```sql
   SELECT DISTINCT ON (p.uuid)
     p.id as project_id,
     p.uuid as project_uuid,
     p.name as project_name,
     p.namespace_full_path as project_group,
     pi.insights_data,
     pi.final_user_score,
     pi.api_score,
     pi.combined_score,
     pi.created_at
   FROM projects p
   LEFT JOIN project_insights pi ON p.uuid = pi.project_uuid
   WHERE p.tracked = true
   ORDER BY p.uuid, pi.created_at DESC
   ```

**Response:**
```json
{
  "projects": [
    {
      "id": 123,
      "uuid": "abc-123",
      "name": "my-project",
      "group": "backend",
      "metrics": {
        "codeReview": 4.2,
        "technicalDebt": 3.5,
        "testQuality": 4.0,
        "documentation": 3.8,
        "deployment": 4.5,
        "dependencies": 3.9,
        "teamMorale": 4.1,
        "apiScore": 4.2,
        "combinedScore": 3.96
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Frontend Display:**
6. **Render Project Cards**
   ```tsx
   {projects.map((project) => (
     <Card key={project.uuid}>
       <CardHeader>
         <CardTitle>{project.name}</CardTitle>
         <Badge>{project.metrics.combinedScore.toFixed(2)}</Badge>
       </CardHeader>
       <CardContent>
         <ResponsiveContainer width="100%" height={200}>
           <RadarChart data={radarData}>
             <Radar dataKey="value" fill="#8884d8" />
           </RadarChart>
         </ResponsiveContainer>
         <Link to={`/project-insight/${project.name}`}>
           View Details →
         </Link>
       </CardContent>
     </Card>
   ))}
   ```

---

## API Endpoints

### Summary Table

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/ai/project-insights` | Generate new AI insights | No |
| GET | `/api/ai/project-insights/:projectName` | Fetch saved insights | No |
| GET | `/api/ai/project-insights-history/:projectId` | Get historical insights | No |
| GET | `/api/ai/all-project-insights` | Get all projects' insights | No |

---

### Endpoint Details

#### 1. POST `/api/ai/project-insights`
Generate new AI insights for a project.

**Request:**
```json
{
  "projectName": "my-project"
}
```

**Response (Success):**
```json
{
  "insights": {
    "section_scores": [...],
    "final_user_score": 3.85,
    "api_scores": { "api_score": 4.2 },
    "combined_score": 3.96,
    "recommendations": [...],
    "detailed_calculations": "..."
  }
}
```

**Response (Error):**
```json
{
  "error": "Project name is required"
}
```
Status: 400

**Time:** 10-30 seconds (AI processing)

---

#### 2. GET `/api/ai/project-insights/:projectName`
Fetch saved insights from database.

**Request:**
```
GET /api/ai/project-insights/my-project
```

**Response (Found):**
```json
{
  "uuid": "550e8400-...",
  "insights_data": { /* full insights */ },
  "final_user_score": 3.85,
  "api_score": 4.2,
  "combined_score": 3.96,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Response (Not Found):**
```json
{
  "message": "No insights found for project: my-project"
}
```
Status: 404

**Time:** <100ms (database query)

---

#### 3. GET `/api/ai/project-insights-history/:projectId`
Get historical insights for trend analysis.

**Request:**
```
GET /api/ai/project-insights-history/abc-123-uuid
```

**Response:**
```json
{
  "history": [
    {
      "uuid": "550e8400-...",
      "insights_data": { /* insights */ },
      "final_user_score": 3.85,
      "combined_score": 3.96,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "uuid": "550e8401-...",
      "final_user_score": 3.72,
      "combined_score": 3.88,
      "created_at": "2024-01-08T10:30:00Z"
    }
  ]
}
```

**Time:** <200ms (database query with multiple rows)

---

#### 4. GET `/api/ai/all-project-insights`
Get all projects' latest insights (overview page).

**Request:**
```
GET /api/ai/all-project-insights
```

**Response:**
```json
{
  "projects": [
    {
      "id": 123,
      "name": "my-project",
      "metrics": {
        "codeReview": 4.2,
        "combinedScore": 3.96
      }
    }
  ]
}
```

**Time:** <500ms (joins multiple tables)

---

## Error Handling

### Common Errors

#### 1. **Project Not Found in Google Sheet**
```
Error: Project "my-project" not found in Google Sheet
```

**Cause:** Project name in database doesn't match any row in Google Form responses.  
**Solution:**
- Ensure project name matches exactly (case-insensitive check implemented)
- User must submit Google Form evaluation for the project first
- Check sheet URL is correct in `GOOGLE_SHEET_URL` constant

---

#### 2. **Gemini API Key Not Configured**
```
Error: Gemini API key not configured
```

**Cause:** `GEMINI_API_KEY` environment variable not set.  
**Solution:**
```bash
# Add to .env file
GEMINI_API_KEY=your_api_key_here
```

---

#### 3. **Network Errors (Gemini API)**
```
Error: fetch failed
Error: ECONNRESET
```

**Cause:** Network issues reaching Gemini API.  
**Solution:**
- Service auto-retries 3 times with exponential backoff
- Wait and try again
- Check internet connection and firewall settings

---

#### 4. **Malformed JSON from Gemini**
```
Error: Unexpected token in JSON at position 123
```

**Cause:** Gemini sometimes returns JSON wrapped in markdown code blocks.  
**Solution:**
- `parseAndCorrectInsights()` function strips code fences
- Extracts JSON from text response
- Logs raw response for debugging

**Code:**
```typescript
let jsonText = rawInsights;

// Remove markdown code fences
jsonText = jsonText.replace(/```json\n?/g, '');
jsonText = jsonText.replace(/```\n?/g, '');

// Parse cleaned JSON
const parsed = JSON.parse(jsonText);
```

---

#### 5. **Missing Section Scores**
```
Warning: Could not extract Code Review Quality score
```

**Cause:** Gemini's JSON response missing expected fields.  
**Solution:**
- Frontend falls back to extracting scores from `detailed_calculations` text
- Uses regex to find score values in calculation breakdown
- Defaults to 0 if extraction fails

---

## Troubleshooting

### Issue: "No insights found" for a project that should have insights

**Check:**
1. Verify insights exist in database:
   ```sql
   SELECT * FROM project_insights 
   WHERE project_uuid = (SELECT uuid FROM projects WHERE name = 'my-project');
   ```

2. Check project name match (case-insensitive):
   ```sql
   SELECT name FROM projects WHERE LOWER(name) = LOWER('my-project');
   ```

**Solution:**
- Ensure project name is exact (no extra spaces)
- Regenerate insights if database entry is corrupt

---

### Issue: Insights generation takes too long (>60 seconds)

**Causes:**
- Large Google Sheet (>1000 rows)
- Slow Gemini API response
- Network issues

**Solutions:**
1. Check Gemini API status
2. Reduce Google Sheet size (archive old data)
3. Increase timeout in axios/fetch config
4. Enable request logging to identify bottleneck:
   ```typescript
   console.log('🔄 Step: Downloading Google Sheet...');
   console.log('🔄 Step: Calling Gemini API...');
   ```

---

### Issue: Section scores don't match expected values

**Cause:** Gemini sometimes calculates scores differently than formula.

**Debug Steps:**
1. Check `detailed_calculations` field in response
2. Verify formula application in prompt
3. Compare user form data vs. calculated score

**Example Debug:**
```typescript
console.log('Detailed Calculations:', parsed.detailed_calculations);
console.log('Section Scores:', parsed.section_scores);
```

**Solution:**
- Frontend extracts scores from `detailed_calculations` (source of truth)
- Overrides JSON field scores if mismatch found

---

### Issue: Google Sheet not accessible

**Error:**
```
Error: Failed to download Google Sheet: 403 Forbidden
```

**Solutions:**
1. Make Google Sheet public (Anyone with link can view)
2. Or use service account authentication
3. Verify sheet URL is correct
4. Check if sheet is deleted or moved

---

## Best Practices

### 1. **When to Generate New Insights**
- **Weekly:** For active projects under development
- **After major changes:** Post-release, after tech debt sprint
- **Monthly:** For stable/maintenance projects

### 2. **Google Form Evaluation**
- Fill out form **after** each sprint/milestone
- Ensure all team members participate in evaluations
- Keep evaluations up-to-date for accurate insights

### 3. **Interpreting Scores**
- **4.5-5.0:** Excellent - Maintain current practices
- **3.5-4.4:** Good - Minor improvements needed
- **2.5-3.4:** Fair - Significant attention required
- **1.0-2.4:** Poor - Urgent action needed

### 4. **Acting on Recommendations**
- Prioritize recommendations by impact
- Add high-priority items to backlog
- Track progress on addressing issues
- Re-generate insights after improvements to measure impact

---

## Related Documentation

- [Project Management](./project-management.md) - For syncing projects and refreshing snapshots
- [DORA Metrics](./dora-metrics.md) - For deployment and lead time metrics
- [Database Schema](../database.md) - Complete database documentation
- [API Endpoints](../api-endpoints.md) - All API routes reference

---

## Future Enhancements

1. **Scheduled Insights Generation**
   - Auto-generate insights weekly via cron job
   - Send email notifications with recommendations

2. **Trend Analysis**
   - Compare insights over time
   - Show improvement graphs
   - Flag declining metrics

3. **Team Comparison**
   - Compare projects within same team
   - Identify best practices from high-scoring projects
   - Share insights across teams

4. **Custom Scoring Weights**
   - Allow users to customize section weights
   - Adjust for project type (backend vs. frontend)
   - Team-specific scoring preferences

5. **Integration with JIRA/Linear**
   - Auto-create tickets for recommendations
   - Track implementation of suggested improvements
   - Link insights to sprint planning

---


