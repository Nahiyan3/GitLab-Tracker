# Project Tracking Feature - Implementation Summary

## What Was Implemented

### Database Setup
- **Table**: `tracked_projects`
- **Columns**:
  - `id` (INTEGER PRIMARY KEY) - GitLab project ID
  - `name` (VARCHAR(255)) - Project name
  - `parent_id` (INTEGER, nullable) - Immediate parent group/namespace ID
  - `created_at` (TIMESTAMP) - When project was first tracked
  - `updated_at` (TIMESTAMP) - Last update time

### Backend API Endpoints

1. **GET /api/projects**
   - Returns all GitLab projects with `isTracked` flag
   - Queries database to check which projects are tracked
   
2. **POST /api/projects/track**
   - Body: `{ id: number, name: string, parent_id?: number }`
   - Stores project in database
   - Uses `ON CONFLICT` to update if already exists
   
3. **DELETE /api/projects/track/:id**
   - Removes project from tracked list
   - Returns success/failure

### Database Functions (queries.ts)

- `initializeTables()` - Creates table on startup
- `trackProject(id, name, parent_id)` - Add/update tracked project
- `untrackProject(id)` - Remove tracked project
- `getTrackedProjectIds()` - Get array of tracked project IDs
- `getTrackedProjects()` - Get all tracked projects with details
- `isProjectTracked(id)` - Check if specific project is tracked

### Frontend Updates

- Added `parent_id` to Project interface
- Updated `toggleTracking()` to call backend API
- Shows real-time tracking status from database
- Optimistic UI updates with error handling
- Toast notifications for success/failure

## How It Works

### Track Flow:
1. User clicks "Track" button on a project
2. Frontend sends POST request to `/api/projects/track` with:
   ```json
   {
     "id": 12345,
     "name": "my-project",
     "parent_id": 678
   }
   ```
3. Backend stores in database (upsert operation)
4. Returns success response
5. Frontend updates UI to show "Tracked" badge

### Untrack Flow:
1. User clicks "Untrack" button
2. Frontend sends DELETE request to `/api/projects/track/12345`
3. Backend removes from database
4. Returns success response
5. Frontend updates UI to show "Untracked" badge

### Loading Projects:
1. Frontend fetches `/api/projects`
2. Backend:
   - Gets projects from GitLab API
   - Queries database for tracked project IDs
   - Adds `isTracked: true/false` to each project
3. Frontend displays with correct tracking status

## Database Schema

```sql
CREATE TABLE tracked_projects (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracked_projects_parent_id ON tracked_projects(parent_id);
```

## API Examples

### Track a Project
```bash
POST /api/projects/track
Content-Type: application/json

{
  "id": 12345,
  "name": "my-awesome-project",
  "parent_id": 678
}

Response:
{
  "success": true,
  "data": {
    "id": 12345,
    "name": "my-awesome-project",
    "parent_id": 678,
    "created_at": "2025-10-13T...",
    "updated_at": "2025-10-13T..."
  },
  "message": "Project \"my-awesome-project\" is now tracked"
}
```

### Untrack a Project
```bash
DELETE /api/projects/track/12345

Response:
{
  "success": true,
  "data": { "id": 12345 },
  "message": "Project untracked successfully"
}
```

## Files Modified

### Backend:
- `src/db/queries.ts` - Database operations
- `src/db/schema.sql` - Table schema
- `src/controllers/projectController.ts` - Track/untrack handlers
- `src/routes/index.ts` - New routes
- `src/index.ts` - Initialize tables on startup

### Frontend:
- `src/pages/AllProjects.tsx` - Updated toggle function with API calls

## Next Steps

To use this feature:
1. Start your server: `cd server && npm run dev`
2. Start your frontend: `cd client && npm run dev`
3. Navigate to "All Projects" page
4. Click "Track" on any project
5. Project will be stored in your Neon database!

## Notes

- Parent ID is stored as the immediate namespace ID from GitLab
- Table automatically created on server startup
- Uses UPSERT (ON CONFLICT) to handle duplicate tracking
- Tracking status is loaded fresh on every page load
