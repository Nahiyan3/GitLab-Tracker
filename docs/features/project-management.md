# Project Management System

## Overview
The Project Management System handles syncing projects from GitLab, tracking selected projects, and refreshing metrics data. It provides a complete workflow for managing project visibility and data collection.

## Key Features
- Sync all projects from GitLab API to local database
- Track/untrack projects for monitoring
- Refresh individual or all tracked projects
- View project details with all metrics
- Paginated GitLab API calls (handles unlimited projects)
- Sequential member fetching to avoid rate limits

## Architecture

### Services

#### `projectSyncService.ts`
- **Purpose**: Sync projects from GitLab to database
- **Key Methods**:
  - `syncAllProjects()` - Fetches all GitLab projects with pagination
  - `syncProject(projectId)` - Syncs one specific project
- **Features**:
  - Pagination support (x-next-page header)
  - Sequential member fetching with 200ms delays
  - SonarQube project key mapping

#### `projectFetchService.ts`
- **Purpose**: Retrieve projects from database
- **Key Methods**:
  - `getAllProjectsFromDB()` - Get all projects (cached)
  - `getProjectByIdFromDB(projectId)` - Get single project
  - `getTrackedProjectsFromDB()` - Get tracked projects with latest snapshots

#### `projectRefreshService.ts`
- **Purpose**: Create new metric snapshots for tracked projects
- **Key Methods**:
  - `refreshProject(projectId)` - Refresh single project
  - `refreshAllTrackedProjects()` - Refresh all tracked
- **Fetches**:
  - GitLab metrics (issues, MRs, commits, milestones)
  - SonarQube metrics (maintainability, reliability, security)

#### `projectEnrichmentService.ts`
- **Purpose**: Add SonarQube data to GitLab projects
- **Key Methods**:
  - `enrichProjectsWithSonar(projects)` - Add SonarQube keys

#### `projectTransformService.ts`
- **Purpose**: Transform GitLab API responses to database format
- **Key Methods**:
  - `transformGitLabProject(gitlabProject)` - Convert API format

### Controllers

#### `projectController.ts`
Handles HTTP requests for project operations.

**Endpoints:**
```http
GET  /api/projects/db              - Get all projects from database
GET  /api/projects/:id             - Get single project by ID
GET  /api/projects/dashboard-stats - Get dashboard statistics
POST /api/projects/sync            - Sync all projects from GitLab
POST /api/projects/sync/:id        - Sync single project
POST /api/projects/refresh/:id     - Refresh single project metrics
POST /api/projects/refresh-all     - Refresh all tracked projects
POST /api/projects/track           - Mark project as tracked
PATCH /api/projects/untrack/:id    - Unmark project as tracked
GET  /api/projects/groups          - Get all GitLab groups
GET  /api/projects/:id/members     - Get project members
```

### Database Tables

#### `projects`
Stores basic project information from GitLab.

**Schema:**
```sql
CREATE TABLE projects (
    -- Primary Keys & Identifiers
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique identifier for database relationships
    row_id SERIAL NOT NULL,                           -- Sequential row number for ordering
    id INTEGER UNIQUE NOT NULL,                       -- GitLab project ID (from GitLab API)
    
    -- Basic Project Info
    name VARCHAR(255) NOT NULL,                       -- Project name (e.g., "my-project")
    full_path TEXT,                                   -- Full project path including group (e.g., "group/my-project")
    group_path TEXT,                                  -- Group path only (e.g., "group")
    
    -- Team & Organization
    members_count INTEGER DEFAULT 0,                  -- Number of team members with access
    members JSONB,                                    -- Array of member objects with details (id, name, username, access_level)
    parent_id INTEGER,                                -- GitLab namespace/group ID
    
    -- Project Metadata
    visibility VARCHAR(50),                           -- Project visibility: "private", "internal", or "public"
    last_activity_at TIMESTAMP,                       -- Last commit, MR, or issue activity in GitLab
    
    -- Integration
    sonar_project_key TEXT,                           -- SonarQube project key for metrics integration (can be NULL)
    
    -- Tracking Status
    tracked BOOLEAN DEFAULT false,                    -- Whether project is being actively monitored (user sets this)
    
    -- System Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- When record was first created in database
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,   -- Last time any field was updated
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP     -- Last time project data was synced from GitLab
);

-- Constraints
CONSTRAINT projects_pkey PRIMARY KEY (uuid)
CONSTRAINT projects_id_key UNIQUE (id)
```

#### `tracked_project_snapshots`
Stores time-series snapshots for tracked projects.

**Schema:**
```sql
CREATE TABLE tracked_project_snapshots (
    -- Primary Keys & Identifiers
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- Unique identifier for this snapshot
    row_id SERIAL NOT NULL,                           -- Sequential row number for ordering
    project_uuid UUID NOT NULL,                       -- Foreign key linking to projects.uuid
    
    -- Snapshot Timestamp
    snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When this snapshot was captured
    
    -- Basic Project Info (snapshot copy)
    description TEXT,                                 -- Project description at snapshot time
    web_url TEXT,                                     -- GitLab web URL at snapshot time
    
    -- GitLab Metrics (counts at snapshot time)
    open_issues INTEGER DEFAULT 0,                    -- Number of open issues
    open_mrs INTEGER DEFAULT 0,                       -- Number of open merge requests
    open_milestones_count INTEGER DEFAULT 0,          -- Number of active milestones
    
    -- SonarQube Integration
    sonar_project_key TEXT,                           -- SonarQube project key (copied for reference)
    
    -- SonarQube Security Metrics
    sonar_security_high INTEGER DEFAULT 0,            -- High severity security vulnerabilities
    sonar_security_blocker INTEGER DEFAULT 0,         -- Blocker severity security vulnerabilities
    
    -- SonarQube Reliability Metrics
    sonar_reliability_high INTEGER DEFAULT 0,         -- High severity bugs
    sonar_reliability_blocker INTEGER DEFAULT 0,      -- Blocker severity bugs
    
    -- SonarQube Maintainability Metrics
    sonar_maintainability_high INTEGER DEFAULT 0,     -- High severity code smells
    sonar_maintainability_blocker INTEGER DEFAULT 0   -- Blocker severity code smells
);

-- Constraints
CONSTRAINT tracked_project_snapshots_pkey PRIMARY KEY (uuid)
-- Note: project_uuid references projects(uuid) for relational integrity
```

**Note**: This is an append-only table. Each "Refresh" creates a NEW snapshot row, enabling historical trend analysis over time.

## Workflows (Detailed)

### 1. Initial Sync - "Sync from GitLab"

**What happens**: Fetches ALL projects from GitLab API and stores them in local database.

#### Step-by-Step Flow:

**1. Frontend (AllProjects.tsx)**
```typescript
// User clicks "Sync from GitLab" button
const syncProjects = async () => {
  setSyncing(true);  // Show loading spinner
  
  // API call to backend
  const projects = await api.post('/projects/sync', {});
  
  // Update UI with synced projects
  setProjects(projects);
  setSyncing(false);
}
```

**Data sent**: Empty body `{}`  
**Expected response**: Array of project objects

---

**2. Backend API Route (routes/index.ts)**
```typescript
// Route handler receives POST request
router.post('/projects/sync', projectController.syncProjectsFromGitLab);
```

---

**3. Controller (projectController.ts)**
```typescript
syncProjectsFromGitLab = async (req: Request, res: Response) => {
  try {
    // Call service to do the actual sync
    const projects = await projectSyncService.syncAllProjects();
    
    // Send synced projects back to frontend
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
```

---

**4. Service (projectSyncService.ts) - Main Sync Logic**

**Step 4.1**: Fetch all projects from GitLab with pagination
```typescript
// Calls GitLab API: GET https://gitlab.com/api/v4/projects?membership=true&per_page=100
const gitlabProjects = await gitlabProjectService.getUserProjects();
```

**Data retrieved from GitLab API**:
```json
[
  {
    "id": 12345,
    "name": "my-project",
    "path_with_namespace": "group/my-project",
    "description": "Project description",
    "web_url": "https://gitlab.com/group/my-project",
    "visibility": "private",
    "last_activity_at": "2026-01-14T10:30:00Z",
    "namespace": {
      "id": 100,
      "full_path": "group",
      "name": "Group Name"
    }
  },
  // ... more projects
]
```

**Step 4.2**: Fetch members for each project (sequential with delays)
```typescript
const registryData = [];

// Loop through each project
for (let i = 0; i < gitlabProjects.length; i++) {
  const project = gitlabProjects[i];
  
  // Fetch members: GET /api/v4/projects/:id/members
  let members = [];
  try {
    members = await gitLabMemberService.getProjectMembers(project.id);
  } catch (error) {
    members = []; // If fails, use empty array
  }
  
  // Build registry data object
  registryData.push({
    id: project.id,                          // 12345
    name: project.name,                      // "my-project"
    full_path: project.path_with_namespace,  // "group/my-project"
    group_path: project.namespace?.full_path, // "group"
    members_count: members.length,           // 5
    members: members,                        // Array of member objects
    last_activity_at: project.last_activity_at,
    parent_id: project.namespace?.id,        // 100
    visibility: project.visibility,          // "private"
  });
  
  // Wait 200ms before next request (avoid rate limiting)
  if (i < gitlabProjects.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
```

**Member data structure**:
```json
[
  {
    "id": 501,
    "name": "John Doe",
    "username": "johndoe",
    "access_level": 40
  },
  {
    "id": 502,
    "name": "Jane Smith",
    "username": "janesmith",
    "access_level": 30
  }
]
```

**Step 4.3**: Save all projects to database
```typescript
await syncProjectsToRegistry(registryData);
```

---

**5. Database Query (queries.ts) - syncProjectsToRegistry()**

Loops through each project and executes:
```sql
INSERT INTO projects (
  id, name, full_path, group_path, members_count, members,
  last_activity_at, parent_id, visibility,
  updated_at, synced_at
)
VALUES (12345, 'my-project', 'group/my-project', 'group', 5, 
        '[{"id":501,"name":"John Doe",...}]', 
        '2026-01-14T10:30:00Z', 100, 'private', 
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  full_path = EXCLUDED.full_path,
  group_path = EXCLUDED.group_path,
  members_count = EXCLUDED.members_count,
  members = EXCLUDED.members,
  last_activity_at = EXCLUDED.last_activity_at,
  parent_id = EXCLUDED.parent_id,
  visibility = EXCLUDED.visibility,
  updated_at = CURRENT_TIMESTAMP,
  synced_at = CURRENT_TIMESTAMP
RETURNING *;
```

**What this does**:
- If project doesn't exist: **INSERT** new row
- If project exists: **UPDATE** existing row with new data
- **Does NOT change** `tracked` status (preserves user's tracking choices)
- Updates `synced_at` timestamp to track when last synced

**Data stored in `projects` table**:
```
| uuid | row_id | id    | name        | full_path        | tracked | members_count | synced_at           |
|------|--------|-------|-------------|------------------|---------|---------------|---------------------|
| abc  | 1      | 12345 | my-project  | group/my-project | false   | 5             | 2026-01-14 10:35:00 |
| def  | 2      | 12346 | other-proj  | group/other      | true    | 3             | 2026-01-14 10:35:01 |
```

---

**6. Auto-map SonarQube Keys**
```typescript
await autoMapSonarProjectKeys();
```

**Purpose**: Automatically links GitLab projects with their corresponding SonarQube projects by matching names/keys.

**How it works**:

**Step 6.1**: Fetch all SonarQube projects via API
```typescript
// GET https://sonarqube.sscl.tech/api/components/search?qualifiers=TRK&ps=500
// Uses Basic Auth: base64(SONARQUBE_TOKEN:)
const sonarProjects = await fetchSonarQubeProjects();
```

**SonarQube API response**:
```json
{
  "components": [
    {"key": "org:my-project", "name": "My Project"},
    {"key": "org:backend-api", "name": "Backend API"},
    {"key": "frontend-app", "name": "Frontend App"}
  ],
  "paging": {"total": 45}
}
```

**Step 6.2**: Fetch all local projects from database
```sql
SELECT id, name FROM projects;
-- Returns: [{id: 12345, name: "my-project"}, {id: 12346, name: "backend-api"}, ...]
```

**Step 6.3**: Normalize and match names
```typescript
// Normalization: removes dashes, underscores, lowercases
function normalize(str) {
  return str.replace(/[-_]/g, '').trim().toLowerCase();
}

// Example: "my-project" → "myproject"
// Example: "backend_api" → "backendapi"
```

**Matching Logic** (tries 3 strategies):

1. **Exact name match**:
   ```typescript
   normalize(sonarProject.name) === normalize(gitlabProject.name)
   // "My Project" → "myproject" matches "my-project" → "myproject"
   ```

2. **Exact key match**:
   ```typescript
   normalize(sonarProject.key) === normalize(gitlabProject.name)
   // "org:my-project" → "orgmyproject" might match "my-project" → "myproject"
   ```

3. **Partial key match** (fallback):
   ```typescript
   normalize(sonarProject.key).includes(normalize(gitlabProject.name))
   // "org:backend-api" includes "backendapi"
   ```

**Step 6.4**: Update database with matched keys
```sql
UPDATE projects 
SET sonar_project_key = 'org:my-project' 
WHERE id = 12345;

UPDATE projects 
SET sonar_project_key = 'org:backend-api' 
WHERE id = 12346;
```

**Matching results logged**:
```
🔍 Matching results:
✅ "my-project" → "org:my-project"
✅ "backend-api" → "org:backend-api"
❌ "legacy-tool" → No match
```

**Database state after**:
```
| id    | name        | sonar_project_ke
|-------|-------------|--------------------|
| 12345 | my-project  | org:my-project     | ← Mapped
| 12346 | backend-api | org:backend-api    | ← Mapped
| 12347 | legacy-tool | NULL               | ← No match found
```

Projects without a SonarQube match will have `sonar_project_key = NULL` and won't fetch SonarQube metrics during refresh.

---

**7. Retrieve and Transform Data**
```typescript
// Get updated projects from database
const dbProjects = await getAllProjectsFromRegistry();

// Transform to API format
return projectTransformService.toApiResponseList(dbProjects);
```

**Final response to frontend**:
```json
[
  {
    "id": 12345,
    "name": "my-project",
    "fullPath": "group/my-project",
    "groupPath": "group",
    "membersCount": 5,
    "members": [...],
    "tracked": false,
    "lastActivityAt": "2026-01-14T10:30:00Z",
    "visibility": "private"
  }
]
```

---

### 2. Single Project Sync - "Sync" Button (All Projects Page)

**What happens**: Syncs a single project's basic info from GitLab (updates registry only).

#### Step-by-Step Flow:

**1. Frontend (AllProjects.tsx)**
```typescript
// User clicks "Sync" button on a specific project card
const syncSingleProject = async (id: number) => {
  setSyncingProjectId(id);  // Show loading spinner on that project
  
  // API call to sync single project
  const project = await api.post(`/projects/sync/${id}`, {});
  
  // Update only the synced project in the list
  setProjects(projects.map(p => 
    p.id === id ? project : p
  ));
  setSyncingProjectId(null);
}
```

**Data sent**: Empty body `{}`  
**URL parameter**: `id = 12345`

---

**2. Backend Route**
```typescript
router.post('/projects/sync/:id', projectController.syncSingleProject);
```

---

**3. Controller**
```typescript
syncSingleProject = async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);  // 12345
  
  // Call sync service for single project
  const project = await projectSyncService.syncProject(projectId);
  
  res.json(project);
};
```

---

**4. Service (projectSyncService.ts) - syncProject()**

**Step 4.1**: Fetch project details from GitLab
```typescript
// GET /api/v4/projects/12345
const gitlabProject = await gitlabProjectService.getProjectById(projectId);
```

**Data retrieved from GitLab**:
```json
{
  "id": 12345,
  "name": "my-project",
  "path_with_namespace": "group/my-project",
  "description": "Updated description",
  "web_url": "https://gitlab.com/group/my-project",
  "visibility": "private",
  "last_activity_at": "2026-01-14T11:00:00Z",
  "namespace": {
    "id": 100,
    "full_path": "group",
    "name": "Group Name"
  }
}
```

**Step 4.2**: Fetch project members
```typescript
// GET /api/v4/projects/12345/members
const members = await gitLabMemberService.getProjectMembers(gitlabProject.id);
```

**Members data**:
```json
[
  {"id": 501, "name": "John Doe", "username": "johndoe", "access_level": 40},
  {"id": 503, "name": "Alice Chen", "username": "alice", "access_level": 30}
]
```

**Step 4.3**: Build registry data
```typescript
const registryData = {
  id: gitlabProject.id,                    // 12345
  name: gitlabProject.name,                // "my-project"
  full_path: gitlabProject.path_with_namespace,
  group_path: gitlabProject.namespace?.full_path,
  members_count: members.length,           // 2
  members: members,
  last_activity_at: gitlabProject.last_activity_at,
  parent_id: gitlabProject.namespace?.id,
  visibility: gitlabProject.visibility,
};
```

**Step 4.4**: Save to database
```typescript
await syncProjectToRegistry(registryData);
```

---

**5. Database Query (queries.ts) - syncProjectToRegistry()**
```sql
INSERT INTO projects (
  id, name, full_path, group_path, members_count, members,
  last_activity_at, parent_id, visibility,
  updated_at, synced_at
)
VALUES (12345, 'my-project', 'group/my-project', 'group', 2,
        '[{"id":501,"name":"John Doe",...},{"id":503,"name":"Alice Chen",...}]',
        '2026-01-14T11:00:00Z', 100, 'private',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id)
DO UPDATE SET
  name = EXCLUDED.name,
  full_path = EXCLUDED.full_path,
  group_path = EXCLUDED.group_path,
  members_count = EXCLUDED.members_count,
  members = EXCLUDED.members,
  last_activity_at = EXCLUDED.last_activity_at,
  parent_id = EXCLUDED.parent_id,
  visibility = EXCLUDED.visibility,
  updated_at = CURRENT_TIMESTAMP,
  synced_at = CURRENT_TIMESTAMP
RETURNING *;
```

**What this does**:
- Updates project info in `projects` table
- Preserves `tracked` status (doesn't change it)
- Updates `synced_at` timestamp
- **Does NOT create snapshots** (only updates registry)

**Database state after**:
```
| id    | name       | members_count | tracked | synced_at           |
|-------|------------|---------------|---------|---------------------|
| 12345 | my-project | 2 (was 5)     | true    | 2026-01-14 11:05:00 | ← Updated info
```

---

**6. Transform and return**
```typescript
// Get updated project from database
const dbProject = await syncProjectToRegistry(registryData);

// Transform to API format
return projectTransformService.toApiResponse(dbProject);
```

**Response to frontend**:
```json
{
  "id": 12345,
  "name": "my-project",
  "fullPath": "group/my-project",
  "groupPath": "group",
  "membersCount": 2,
  "members": [...],
  "tracked": true,
  "lastActivityAt": "2026-01-14T11:00:00Z",
  "syncedAt": "2026-01-14T11:05:00Z",
  "visibility": "private"
}
```

Frontend updates that specific project in the list without reloading all projects.

---

**Key Difference from "Sync All"**:
- **Sync All**: Loops through ALL projects, fetches all at once with pagination
- **Single Sync**: Fetches only ONE specific project by ID
- Both update the `projects` table registry only
- Neither creates snapshots in `tracked_project_snapshots`

---

### 3. Track Project - "Track" Button

**What happens**: Marks a project as tracked and creates the first snapshot.

#### Step-by-Step Flow:

**1. Frontend (AllProjects.tsx)**
```typescript
// User clicks "Track" button (star icon)
const toggleTracking = async (id: number) => {
  // API call to track project
  await api.post('/projects/track', { id });
  
  // Update UI - mark project as tracked
  setProjects(projects.map(p => 
    p.id === id ? { ...p, tracked: true } : p
  ));
}
```

**Data sent**: `{ "id": 12345 }`

---

**2. Backend Route**
```typescript
router.post('/projects/track', projectController.trackProjectHandler);
```

---

**3. Controller**
```typescript
trackProjectHandler = async (req: Request, res: Response) => {
  const { id } = req.body;  // id = 12345
  
  // Call database query to set tracked = true
  const trackedProject = await trackProject(id);
  
  res.json(trackedProject);
};
```

---

**4. Database Query (queries.ts) - trackProject()**
```sql
UPDATE projects
SET tracked = TRUE, updated_at = CURRENT_TIMESTAMP
WHERE id = 12345
RETURNING *;
```

**Database state after**:
```
| id    | name       | tracked | updated_at          |
|-------|------------|---------|---------------------|
| 12345 | my-project | true    | 2026-01-14 10:40:00 | ← Changed to true
```

**Response to controller**:
```json
{
  "id": 12345,
  "name": "my-project",
  "tracked": true,
  "updated_at": "2026-01-14T10:40:00Z"
}
```

---

**NOTE**: Tracking only updates the `projects` table. No snapshot is created yet. User must click "Refresh" to create the first snapshot with metrics.

---

### 3. Refresh Project Metrics - "Refresh" Button

**What happens**: Fetches current metrics from GitLab & SonarQube, stores snapshot in database.

#### Step-by-Step Flow:

**1. Frontend (TrackedProjects.tsx)**
```typescript
// User clicks "Refresh" button on a tracked project
const refreshProject = async (projectId: number) => {
  setRefreshing(true);
  
  // API call to refresh
  await api.post(`/projects/refresh/${projectId}`, {});
  
  // Reload projects to show updated data
  await fetchProjects();
  setRefreshing(false);
}
```

**Data sent**: Empty body `{}`  
**URL parameter**: `projectId = 12345`

---

**2. Backend Route**
```typescript
router.post('/projects/refresh/:id', projectController.refreshSingleProject);
```

---

**3. Controller**
```typescript
refreshSingleProject = async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);  // 12345
  
  // Call refresh service
  await projectRefreshService.refreshProject(projectId);
  
  res.json({ success: true, id: projectId });
};
```

---

**4. Service (projectRefreshService.ts) - refreshProject()**

**Step 4.1**: Fetch project details from GitLab
```typescript
// GET /api/v4/projects/12345
const gitlabProject = await gitlabProjectService.getProjectById(projectId);
```

**Data retrieved**:
```json
{
  "id": 12345,
  "name": "my-project",
  "description": "A sample project",
  "web_url": "https://gitlab.com/group/my-project"
}
```

---

**Step 4.2**: Create snapshot data (fetches all metrics in parallel)
```typescript
const snapshotData = await this.createSnapshotData(gitlabProject);
```

**4.2.1** - Fetch open issues count
```typescript
// GET /api/v4/projects/12345/issues?state=opened&per_page=1
// Reads x-total header instead of fetching all issues
const openIssues = await gitLabIssueService.getIssueCount(projectId, 'opened');
// Returns: 23
```

**4.2.2** - Fetch open MRs count
```typescript
// GET /api/v4/projects/12345/merge_requests?state=opened&per_page=1
const openMrs = await gitLabMRService.getMRCount(projectId, 'opened');
// Returns: 7
```

**4.2.3** - Fetch open milestones count
```typescript
// GET /api/v4/projects/12345/milestones
const milestones = await gitLabMilestoneService.getProjectMilestones(projectId);
const openMilestones = milestones.filter(m => m.state === 'active');
// Returns: 2
```

**4.2.4** - Get SonarQube project key from database
```typescript
// SELECT sonar_project_key FROM projects WHERE id = 12345
const sonarProjectKey = await getSonarProjectKey(projectId);
// Returns: "my-project" or null
```

**4.2.5** - Fetch SonarQube metrics (if key exists)
```typescript
if (sonarProjectKey) {
  const sonarQubeService = new SonarQubeService();
  // GET https://sonarqube.sscl.tech/api/issues/search?componentKeys=my-project&types=BUG&severities=HIGH,BLOCKER
  // GET https://sonarqube.sscl.tech/api/issues/search?componentKeys=my-project&types=VULNERABILITY&severities=HIGH,BLOCKER
  // GET https://sonarqube.sscl.tech/api/issues/search?componentKeys=my-project&types=CODE_SMELL&severities=HIGH,BLOCKER
  sonarMetrics = await sonarQubeService.fetchIssueCounts(sonarProjectKey);
}
```

**SonarQube data retrieved**:
```json
{
  "security_high": 2,
  "security_blocker": 0,
  "reliability_high": 5,
  "reliability_blocker": 1,
  "maintainability_high": 12,
  "maintainability_blocker": 3
}
```

**4.2.6** - Build complete snapshot data object
```typescript
return {
  project_id: 12345,
  description: "A sample project",
  web_url: "https://gitlab.com/group/my-project",
  open_issues: 23,
  open_mrs: 7,
  open_milestones_count: 2,
  sonar_project_key: "my-project",
  sonar_security_high: 2,
  sonar_security_blocker: 0,
  sonar_reliability_high: 5,
  sonar_reliability_blocker: 1,
  sonar_maintainability_high: 12,
  sonar_maintainability_blocker: 3,
};
```

---

**Step 4.3**: Insert snapshot into database
```typescript
await insertProjectSnapshot(snapshotData);
```

---

**5. Database Query (queries.ts) - insertProjectSnapshot()**

**Step 5.1**: Get project UUID from projects table
```sql
SELECT uuid FROM projects WHERE id = 12345;
-- Returns: "abc-def-ghi-uuid"
```

**Step 5.2**: Insert snapshot into tracked_project_snapshots
```sql
INSERT INTO tracked_project_snapshots (
  project_uuid,
  description,
  web_url,
  open_issues,
  open_mrs,
  open_milestones_count,
  sonar_project_key,
  sonar_security_high,
  sonar_security_blocker,
  sonar_reliability_high,
  sonar_reliability_blocker,
  sonar_maintainability_high,
  sonar_maintainability_blocker,
  snapshot_date
)
VALUES (
  'abc-def-ghi-uuid',
  'A sample project',
  'https://gitlab.com/group/my-project',
  23,    -- open issues
  7,     -- open MRs
  2,     -- open milestones
  'my-project',
  2,     -- security high
  0,     -- security blocker
  5,     -- reliability high
  1,     -- reliability blocker
  12,    -- maintainability high
  3,     -- maintainability blocker
  CURRENT_TIMESTAMP
)
RETURNING *;
```

**Data stored in `tracked_project_snapshots` table**:
```
| id  | project_uuid     | open_issues | open_mrs | sonar_security_high | snapshot_date       |
|-----|------------------|-------------|----------|---------------------|---------------------|
| 101 | abc-def-ghi-uuid | 23          | 7        | 2                   | 2026-01-14 10:45:00 |
```

**Multiple snapshots allowed**: Each refresh creates a NEW row (append-only), enabling historical trend analysis.

---

**6. Response to Frontend**
```json
{
  "success": true,
  "id": 12345
}
```

Frontend reloads project list to display updated metrics.

---

### 4. Refresh All Tracked Projects - "Refresh All" Button

**What happens**: Loops through ALL tracked projects and refreshes each one.

#### Step-by-Step Flow:

**1. Frontend (TrackedProjects.tsx)**
```typescript
// User clicks "Refresh All" button
const refreshAll = async () => {
  setRefreshingAll(true);
  
  // API call to refresh all
  await api.post('/projects/refresh-all', {});
  
  // Reload projects
  await fetchProjects();
  setRefreshingAll(false);
}
```

---

**2. Backend Route**
```typescript
router.post('/projects/refresh-all', projectController.refreshAllTrackedProjects);
```

---

**3. Controller**
```typescript
refreshAllTrackedProjects = async (req: Request, res: Response) => {
  // Call service to refresh all tracked projects
  await projectRefreshService.refreshAllTrackedProjects();
  
  res.json({ success: true });
};
```

---

**4. Service (projectRefreshService.ts)**

**Step 4.1**: Get all tracked project IDs from database
```typescript
// SELECT id FROM projects WHERE tracked = TRUE
const trackedProjectIds = await getTrackedProjectIds();
// Returns: [12345, 12346, 12347, ...]
```

**Database query result**:
```
| id    | tracked |
|-------|---------|
| 12345 | true    | ← included
| 12346 | true    | ← included
| 12347 | false   | (not included)
| 12348 | true    | ← included
```

**Step 4.2**: Loop through each project and refresh
```typescript
for (const projectId of trackedProjectIds) {
  try {
    // Call the same refresh logic as single project refresh
    await this.refreshProject(projectId);
    
    // This does:
    // 1. Fetch project from GitLab
    // 2. Fetch metrics (issues, MRs, SonarQube)
    // 3. Insert snapshot
    
    console.log(`✅ Refreshed project ${projectId}`);
  } catch (error) {
    console.error(`❌ Failed to refresh ${projectId}`);
    // Continue with next project even if one fails
  }
}
```

**Database state after (tracked_project_snapshots)**:
```
| id  | project_uuid | open_issues | snapshot_date       |
|-----|--------------|-------------|---------------------|
| 101 | uuid-1       | 23          | 2026-01-14 10:45:00 | (old snapshot)
| 102 | uuid-2       | 15          | 2026-01-14 10:45:00 | (old snapshot)
| 103 | uuid-1       | 25          | 2026-01-14 11:00:00 | ← NEW snapshot for project 1
| 104 | uuid-2       | 14          | 2026-01-14 11:00:01 | ← NEW snapshot for project 2
| 105 | uuid-3       | 8           | 2026-01-14 11:00:02 | ← NEW snapshot for project 3
```

---

**5. Response to Frontend**
```json
{
  "success": true
}
```

Frontend reloads and shows all projects with their latest snapshots.

## Frontend Components

### `AllProjects.tsx`
- **Purpose**: Display all GitLab projects
- **Features**:
  - Search/filter projects
  - Sync button (calls sync endpoint)
  - Track/untrack toggle
  - View project details

### `TrackedProjects.tsx`
- **Purpose**: Display tracked projects with latest metrics
- **Features**:
  - Shows latest snapshot data
  - Refresh individual project
  - Refresh all projects
  - View trends over time

### `ProjectDetail.tsx`
- **Purpose**: Detailed view of single project
- **Features**:
  - All metrics displayed
  - Health score trends
  - Issue/MR/Commit breakdowns
  - SonarQube quality gates

### `ProjectCard.tsx`
- **Purpose**: Reusable project card component
- **Props**: project data, onClick handler
- **Displays**: Name, description, scores, last updated

## Rate Limiting & Performance

### GitLab API Rate Limiting
- **Limit**: ~10 requests/second
- **Solution**: Sequential processing with 200ms delays
- **Applied to**: Member fetching during sync

### Pagination
- **Implementation**: While loop checking `x-next-page` header
- **Page size**: 100 projects per page
- **Handles**: Unlimited number of projects

### Caching Strategy
- Projects stored in database (no repeated GitLab calls)
- Snapshots allow historical trend analysis
- Fast reads from PostgreSQL with indexes

## Error Handling

### Sync Errors
```typescript
try {
  await projectSyncService.syncAllProjects();
} catch (error) {
  // Log error, return 500
  res.status(500).json({ error: error.message });
}
```

### Missing SonarQube Keys
- Projects without SonarQube keys gracefully skip SonarQube fetch
- Only GitLab metrics collected for those projects

### Rate Limit Errors (503)
- Retry logic with exponential backoff
- Sequential processing prevents overwhelming GitLab API

## Configuration

### Environment Variables
```env
GITLAB_URL=https://gitlab.com
GITLAB_TOKEN=your_gitlab_token
SONARQUBE_URL=https://sonarqube.example.com
SONARQUBE_TOKEN=your_sonar_token
```

### Database Connection
```typescript
// db/connection.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

## Testing

### Manual Testing
1. **Sync**: Click "Sync from GitLab" → Verify projects appear
2. **Track**: Click "Track" → Verify tracked = true in DB
3. **Refresh**: Click "Refresh" → Verify new snapshot created
4. **Pagination**: Verify all projects synced (>100)

### Database Verification
```bash
npm run db:verify
```

## Common Issues

### Issue: Only 100 projects synced
**Cause**: Missing pagination  
**Fix**: Added pagination loop checking x-next-page header

### Issue: 503 errors during sync
**Cause**: Parallel member fetching overwhelms GitLab API  
**Fix**: Changed to sequential with 200ms delays

### Issue: Missing project data
**Cause**: Project not tracked or never refreshed  
**Fix**: Track project first, then refresh

## Future Enhancements
- [ ] Auto-refresh scheduler (daily/weekly)
- [ ] Webhook support for real-time updates
- [ ] Project groups/categories
- [ ] Custom metric thresholds per project
- [ ] Export project data to CSV/Excel
