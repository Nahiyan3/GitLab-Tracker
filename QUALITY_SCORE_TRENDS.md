# Quality Score Trends Implementation

## What Was Done

Implemented a 9-line chart showing quality score trends over time from the database.

## Backend Changes

### 1. New Query Function (`server/src/db/queries.ts`)
```typescript
getProjectInsightsHistoryById(projectId: number)
```
- Fetches all insights history for a project by project ID
- Returns data ordered by created_at (oldest first for chronological display)

### 2. New Controller Endpoint (`server/src/controllers/aiController.ts`)
```typescript
getProjectInsightsHistoryById()
```
- Handles GET request for insights history
- Returns formatted history with all insights data

### 3. New Route (`server/src/routes/index.ts`)
```
GET /api/ai/project-insights-history/:projectId
```

## Frontend Changes

### Updated `ProjectDetail.tsx`

**New State:**
- `insightsHistory` - Raw insights data from database
- `chartData` - Transformed data for chart display
- `loading` - Loading state

**New useEffect:**
- Fetches insights history when component mounts
- Transforms data into chart format:
  ```javascript
  {
    date: "Nov 10",
    "Code Review Quality": 3.67,
    "Technical Debt": 2.50,
    "Test Quality & Coverage": 4.20,
    "Documentation Quality": 3.80,
    "Deployment & Release Health": 4.10,
    "Dependencies & External Factors": 3.60,
    "Team Morale": 3.40,
    "API Score": 3.98,
    "Combined Score": 3.61
  }
  ```

**Updated Metrics Tab:**
- Shows 9 lines on LineChart:
  1. Code Review Quality (blue)
  2. Technical Debt (green)
  3. Test Quality & Coverage (yellow)
  4. Documentation Quality (red)
  5. Deployment & Release Health (purple)
  6. Dependencies & External Factors (orange)
  7. Team Morale (light blue)
  8. API Score (bold green, thicker line)
  9. Combined Score (bold blue, thicker line)

- **Loading state:** Shows spinner
- **Empty state:** Shows message when no data
- **Y-axis:** 0-5 scale (score range)
- **X-axis:** Date (e.g., "Nov 10", "Nov 12")

## How It Works

1. **User navigates** to project detail page → `/project/:id`
2. **Component mounts** → Fetches insights history via API
3. **Data transformation** → Extracts scores from JSONB
4. **Chart renders** → 9 lines showing score trends over time

## Chart Features

- **9 distinct lines** with different colors
- **Thicker lines** for API Score and Combined Score (emphasis)
- **Dots at data points** for clarity
- **Legend** showing all line names
- **Tooltip** on hover showing exact values
- **Responsive** design

## Data Source

- **Database:** `project_insights` table
- **Fields used:**
  - `insights_data.section_scores[]` (7 sections)
  - `api_score`
  - `combined_score`
  - `created_at` (for X-axis dates)

## Testing

1. Generate insights for a project multiple times (different days)
2. Navigate to project detail → Metrics tab
3. See all 9 lines showing trends over time

## Empty State

If no insights exist:
- Shows icon + message
- Prompts user to generate insights first

---

**Ready to test!** Navigate to any project and click the Metrics tab. 🎯
