# Service Architecture - Fetch vs Sync

## Problem Solved
- **Before**: Every page refresh called GitLab API → Slow, rate limits, unnecessary calls
- **After**: Page loads read from database → Fast, no API calls, only sync on explicit user action

## Architecture Overview

### 1. `projectFetchService` - DATABASE READ (Fast)
**Purpose**: Read cached data from database  
**API Calls**: NONE - Only database queries  
**Used For**: 
- Page loads
- Page refreshes
- Navigation between pages
- Auto-refresh timers

**Methods**:
```typescript
getAllProjectsFromDB()      // Get all projects with tracked status from DB
getTrackedProjectsFromDB()  // Get only tracked projects from DB
```

**Routes Using This**:
- `GET /api/projects/db` → All Projects page (on load)
- `GET /api/tracking` → Tracked Projects page (on load)

---

### 2. `projectSyncService` - GITLAB SYNC (Slow)
**Purpose**: Fetch fresh data from GitLab API and update database  
**API Calls**: Multiple GitLab API calls (projects, issues, MRs, groups)  
**Used For**:
- "Sync From GitLab" button click
- Individual project refresh button clicks
- Manual data refresh by user

**Methods**:
```typescript
syncAllProjects()           // Sync all projects from GitLab → DB
syncProject(id)             // Sync single project from GitLab → DB
getProjectsFromDatabase()   // Get projects from DB (internal use)
```

**Routes Using This**:
- `POST /api/projects/sync` → "Sync From GitLab" button
- `POST /api/projects/sync/:id` → Individual project refresh button
- `POST /api/tracking/sync` → Tracked Projects "Sync All" button
- `POST /api/tracking/sync/:id` → Tracked Projects individual refresh button

---

## Flow Diagrams

### Page Load Flow (FAST ⚡)
```
User visits page
    ↓
GET /api/projects/db or GET /api/tracking
    ↓
projectFetchService.getAllProjectsFromDB()
    ↓
Read from DATABASE only
    ↓
Return cached data instantly
```

### Sync Flow (SLOW 🔄)
```
User clicks "Sync From GitLab" or refresh icon
    ↓
POST /api/projects/sync or POST /api/projects/sync/:id
    ↓
projectSyncService.syncAllProjects() or syncProject(id)
    ↓
1. Fetch from GitLab API (projects, issues, MRs)
2. Enrich with group paths
3. Save to DATABASE
4. Return updated data
    ↓
Frontend refreshes with new data
```

---

## Benefits

### ✅ Performance
- **Page loads**: Instant (database query ~50ms)
- **Sync operations**: Slow but user-initiated (~2-5 seconds)

### ✅ User Experience
- No waiting on page load/refresh
- Progress indicators only when user clicks sync
- Data always available even if GitLab is slow

### ✅ API Rate Limits
- No GitLab API calls on navigation
- Only API calls when user explicitly syncs
- Prevents hitting GitLab rate limits

### ✅ Separation of Concerns
- **Fetch Service**: Simple, fast, read-only
- **Sync Service**: Complex, slow, write operations
- Clear responsibility boundaries

---

## Endpoints Summary

| Endpoint | Method | Service | Speed | When Used |
|----------|--------|---------|-------|-----------|
| `/api/projects/db` | GET | projectFetchService | ⚡ Fast | All Projects page load |
| `/api/tracking` | GET | projectFetchService | ⚡ Fast | Tracked Projects page load |
| `/api/projects/sync` | POST | projectSyncService | 🔄 Slow | "Sync From GitLab" button |
| `/api/projects/sync/:id` | POST | projectSyncService | 🔄 Slow | Individual refresh icon |
| `/api/tracking/sync` | POST | projectSyncService | 🔄 Slow | Tracked "Sync All" button |
| `/api/tracking/sync/:id` | POST | projectSyncService | 🔄 Slow | Tracked refresh icon |

---

## Code Examples

### Frontend: Page Load (Fast)
```typescript
// AllProjects.tsx - on component mount
const fetchProjects = async () => {
  const projects = await api.get('/projects/db'); // FAST - from DB
  setProjects(projects);
};
```

### Frontend: Sync Button (Slow)
```typescript
// AllProjects.tsx - on "Sync From GitLab" click
const syncProjects = async () => {
  setLoading(true);
  const projects = await api.post('/projects/sync'); // SLOW - GitLab API
  setProjects(projects);
  setLoading(false);
};
```

### Backend: Controller Routes
```typescript
// Fast route - DB only
router.get('/projects/db', projectController.getProjectsFromDB);
  → projectFetchService.getAllProjectsFromDB() // No GitLab API

// Slow route - GitLab sync
router.post('/projects/sync', projectController.syncProjectsFromGitLab);
  → projectSyncService.syncAllProjects() // Calls GitLab API
```
