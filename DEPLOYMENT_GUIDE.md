# Two-Table Architecture Migration - Deployment Guide

## Overview
Successfully migrated from single-table (`tracked_projects`) to two-table architecture:
- **`projects`** - Lightweight registry for ALL GitLab projects (tracked or not)
- **`tracked_project_snapshots`** - Append-only historical snapshots for tracked projects only

## What Changed

### Database Schema
- **Before**: Single `tracked_projects` table with updates in place
- **After**: Two tables with clear separation of concerns
  - Registry updates via "Sync from GitLab" 
  - Historical snapshots via "Refresh" buttons

### Key Metrics Changed
- **Removed**: `star_count`, `forks_count`, `total_issues`, `total_mrs`
- **Added**: `members_count`, `open_issues`, `open_mrs` (OPEN items only)
- **Snapshot data**: Now includes `snapshot_date` timestamp

### API Changes
- All Projects page: Uses `/api/projects/db` (returns registry)
- Tracked Projects page: Uses `/api/tracking` (returns latest snapshots)
- New endpoints: 
  - `POST /api/tracking/refresh/:id` - Refresh single project
  - `POST /api/tracking/refresh-all` - Refresh all tracked projects

## Deployment Steps (No Data Migration Needed)

Since you have no existing data, deployment is straightforward:

### 1. Backend Changes
All backend files have been updated:
- ✅ `server/src/db/schema.sql` - New two-table schema (no views)
- ✅ `server/src/db/queries.ts` - New query functions
- ✅ `server/src/services/project/projectSyncService.ts` - Updates registry
- ✅ `server/src/services/project/projectRefreshService.ts` - Creates snapshots
- ✅ `server/src/services/project/projectFetchService.ts` - Fetches correct data
- ✅ `server/src/services/project/projectTransformService.ts` - New field mappings
- ✅ `server/src/controllers/projectController.ts` - New refresh endpoints
- ✅ `server/src/routes/index.ts` - New routes added
- ✅ `server/src/routes/trackingRoutes.ts` - Updated to use refresh

### 2. Frontend Changes
All frontend pages have been updated:
- ✅ `client/src/pages/TrackedProjects.tsx` - Uses new field names (openIssues, openMrs, etc.)
- ✅ `client/src/pages/AllProjects.tsx` - Uses registry fields (membersCount, tracked)

### 3. Start Fresh

```bash
# Backend
cd server
npm install  # If needed
npm run dev  # Server will auto-create new schema on startup

# Frontend  
cd ../client
npm install  # If needed
npm run dev
```

The server's `initializeTables()` function will automatically run `schema.sql` and create the two new tables.

## How It Works Now

### User Actions

1. **All Projects Page - "Sync from GitLab"**
   - Fetches all projects from GitLab API
   - Updates `projects` registry table
   - Auto-maps SonarCloud keys
   - Does NOT create snapshots

2. **All Projects Page - "Track" button**
   - Sets `tracked = true` in `projects` table
   - Project now appears on Tracked Projects page (but with no snapshot data yet)

3. **Tracked Projects Page - "Refresh All"**
   - For each tracked project:
     - Fetches current data from GitLab + SonarCloud
     - **Inserts NEW row** into `tracked_project_snapshots` (append-only)
   - Frontend shows latest snapshot for each project

4. **Tracked Projects Page - Single "Refresh" button**
   - Same as above but for one project only

### Data Model

**projects table (registry)**
```
uuid (PK), row_id, id (GitLab ID), name, full_path, group_path,
members_count, last_activity_at, parent_id, visibility, tracked,
created_at, updated_at, synced_at
```

**tracked_project_snapshots table (historical)**
```
uuid (PK), row_id, project_uuid (FK), description, web_url,
open_issues, open_mrs, open_milestones_count,
sonar_project_key, sonar_security_high, sonar_security_blocker,
sonar_reliability_high, sonar_reliability_blocker,
sonar_maintainability_high, sonar_maintainability_blocker,
snapshot_date
```

## Benefits

1. **Historical Tracking**: All snapshots are preserved (append-only)
2. **Efficient Registry**: Lightweight project list doesn't bloat with metrics
3. **Scalable**: Can add pagination, cleanup old snapshots, etc.
4. **Clear Separation**: Sync vs Refresh actions are distinct
5. **Open Metrics**: Track OPEN issues/MRs instead of totals (more actionable)

## Testing Checklist

- [ ] Server starts without errors
- [ ] Schema tables created successfully
- [ ] All Projects page loads (empty initially)
- [ ] "Sync from GitLab" populates projects registry
- [ ] Can track/untrack projects
- [ ] Tracked Projects page shows tracked projects (empty snapshots initially)
- [ ] "Refresh All" creates snapshots with GitLab + SonarCloud data
- [ ] Single project refresh works
- [ ] SonarCloud metrics display correctly
- [ ] Open issues/MRs counts are accurate

## Troubleshooting

**Issue**: Old `tracked_projects` table still exists
**Fix**: Drop it manually or run `server/src/db/setup.sql`

**Issue**: No SonarCloud data
**Fix**: Check environment variables (SONARQUBE_URL, SONARQUBE_TOKEN, SONARQUBE_ORGANIZATION)

**Issue**: Projects not showing in Tracked Projects page
**Fix**: Make sure to click "Refresh All" after tracking projects to create initial snapshots

## Next Steps (Optional Enhancements)

1. Add pagination for large project lists
2. Add indexes for performance optimization
3. Implement snapshot cleanup (e.g., keep last 30 days)
4. Add batch refresh with progress indicators
5. Historical charts/trends using snapshot data
