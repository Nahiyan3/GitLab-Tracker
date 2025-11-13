# Project Insights Database Implementation

## Summary

Implemented complete solution to save corrected AI insights to database with UUID-based architecture.

## Database Schema

### New Table: `project_insights`

```sql
CREATE TABLE project_insights (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id SERIAL NOT NULL,
  project_uuid UUID NOT NULL REFERENCES projects(uuid) ON DELETE CASCADE,
  insights_data JSONB NOT NULL,
  final_user_score DECIMAL(3,2),
  api_score DECIMAL(3,2),
  combined_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- UUID as primary key
- row_id for sequential numbering
- Foreign key to projects table (UUID)
- JSONB for complete insights data
- Denormalized scores for fast queries
- Indexes on project_uuid, scores, and JSONB content

## New Files Created

### 1. `server/src/services/ai/insightsParser.ts`
Parses raw AI response and corrects scores by extracting from `detailed_calculations`:
- `parseAndCorrectInsights()` - Main parser function
- `extractSectionScore()` - Extract individual section scores
- Handles all 7 sections + final_user_score + api_score + combined_score
- Uses regex patterns to find verified calculations

## Updated Files

### 1. `server/src/db/schema.sql`
- Added `project_insights` table definition
- Created indexes for performance

### 2. `server/src/db/queries.ts`
Added 4 new query functions:
- `saveProjectInsights()` - Save corrected insights
- `getLatestProjectInsights()` - Get most recent insights for a project
- `getProjectInsightsHistory()` - Get all historical insights
- `getAllProjectsWithInsights()` - Get all projects with their latest scores

### 3. `server/src/controllers/aiController.ts`
Updated `generateProjectInsights()` to:
1. Generate raw AI insights
2. Parse and correct scores
3. Save to database
4. Return both raw and corrected versions

Added `getProjectInsights()` to:
- Fetch saved insights from database
- Return insights_data + scores + metadata

### 4. `server/src/routes/index.ts`
Added new GET route:
```
GET /api/ai/project-insights/:projectName
```

## API Endpoints

### Generate and Save Insights
```
POST /api/ai/project-insights
Body: { "projectName": "MyProject" }

Response: {
  "projectName": "MyProject",
  "insights": "<raw AI response>",
  "correctedInsights": { /* corrected JSON */ },
  "saved": true
}
```

### Get Saved Insights
```
GET /api/ai/project-insights/:projectName

Response: {
  "projectName": "MyProject",
  "insights": { /* complete corrected insights */ },
  "scores": {
    "final_user_score": 3.45,
    "api_score": 3.98,
    "combined_score": 3.61
  },
  "created_at": "2025-11-13T..."
}
```

## Data Flow

1. **User clicks "Generate Insights"** → POST /api/ai/project-insights
2. **AI generates raw response** → Contains wrong scores in JSON
3. **Parser extracts correct scores** → From detailed_calculations text
4. **Corrected data saved to DB** → project_insights table
5. **Frontend can fetch anytime** → GET /api/ai/project-insights/:projectName

## JSONB Structure (Corrected)

```json
{
  "section_scores": [
    {
      "name": "Code Review Quality",
      "score": 3.67,  // ✅ Corrected from detailed_calculations
      "analysis": "...",
      "recommendations": [...],
      "issues": [...]
    }
  ],
  "final_user_score": 3.45,  // ✅ Corrected
  "api_scores": {
    "sonarcloud": { "average": 4.03 },
    "gitlab": { "average": 3.93 },
    "api_score": 3.98  // ✅ Corrected
  },
  "combined_score": 3.61,  // ✅ Corrected
  "detailed_calculations": "...",
  "areas_needing_improvement": [...],
  "summary": "..."
}
```

## Query Examples

### Get latest insights
```sql
SELECT * FROM project_insights 
WHERE project_uuid = '<uuid>' 
ORDER BY created_at DESC LIMIT 1;
```

### Get projects with low scores
```sql
SELECT p.name, pi.combined_score 
FROM projects p
JOIN project_insights pi ON pi.project_uuid = p.uuid
WHERE pi.combined_score < 3.0
ORDER BY pi.combined_score ASC;
```

### Extract specific section from JSONB
```sql
SELECT 
  jsonb_array_elements(insights_data->'section_scores')->>'name' as section,
  jsonb_array_elements(insights_data->'section_scores')->>'score' as score
FROM project_insights
WHERE project_uuid = '<uuid>';
```

## Benefits

✅ **Correct scores stored** - Verified from detailed_calculations  
✅ **Fast queries** - Denormalized score columns indexed  
✅ **Flexible schema** - JSONB adapts to AI response changes  
✅ **Historical tracking** - One insight per day per project  
✅ **UUID-based** - Proper foreign key relationships  
✅ **Single source of truth** - Database has verified data  

## Next Steps

1. Run database migration to create the table
2. Restart server to load new code
3. Generate insights for a project
4. Verify data saved correctly in database
5. Update frontend to fetch from database instead of generating each time
