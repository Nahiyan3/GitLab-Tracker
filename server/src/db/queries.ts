// Database queries for two-table architecture (projects + tracked_project_snapshots)
import { getPool } from './connection';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Initialize all database tables from the consolidated schema.sql.
 * Every CREATE TABLE / CREATE INDEX uses IF NOT EXISTS so this is
 * fully idempotent and safe to call on every server start.
 */
export const initializeTables = async (): Promise<void> => {
  const pool = getPool();

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    console.log('✅ Database tables initialized from schema.sql (24 tables)');
  } catch (error: any) {
    console.error('❌ Failed to initialize tables:', error.message);
    throw error;
  }
};

// ============================================================================
// PROJECTS TABLE (Registry) - All Projects
// ============================================================================


/**
 * Sync a project to the projects registry (insert or update)
 * Used by "Sync from GitLab" - updates basic project info only
 * Note: Does not modify 'tracked' status - use trackProject/untrackProject for that
 */
export const syncProjectToRegistry = async (projectData: {
  id: number;
  name: string;
  full_path?: string;
  group_path?: string;
  members_count?: number;
  members?: any[];
  last_activity_at?: string;
  parent_id?: number;
  visibility?: string;
}): Promise<any> => {
  const pool = getPool();
  
  const query = `
    INSERT INTO projects (
      id, name, full_path, group_path, members_count, members,
      last_activity_at, parent_id, visibility,
      updated_at, synced_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
  `;
  
  try {
    const result = await pool.query(query, [
      projectData.id,
      projectData.name,
      projectData.full_path || null,
      projectData.group_path || null,
      projectData.members_count || 0,
      projectData.members ? JSON.stringify(projectData.members) : null,
      projectData.last_activity_at || null,
      projectData.parent_id || null,
      projectData.visibility || null,
    ]);
    return result.rows[0];
  } catch (error: any) {
    console.error('❌ Failed to sync project to registry:', error.message);
    throw error;
  }
};

/**
 * Sync multiple projects to registry
 */
export const syncProjectsToRegistry = async (projects: Array<{
  id: number;
  name: string;
  full_path?: string;
  group_path?: string;
  members_count?: number;
  members?: any[];
  last_activity_at?: string;
  parent_id?: number;
  visibility?: string;
}>): Promise<void> => {
  try {
    for (const project of projects) {
      await syncProjectToRegistry(project);
    }
    console.log(`✅ Synced ${projects.length} projects to registry`);
  } catch (error: any) {
    console.error('❌ Failed to sync projects to registry:', error.message);
    throw error;
  }
};

/**
 * Get all projects from registry
 */
export const getAllProjectsFromRegistry = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      uuid, row_id, id, name, full_path, group_path,
      members_count, members, last_activity_at, parent_id, visibility,
      tracked, created_at, updated_at, synced_at
    FROM projects
    ORDER BY synced_at DESC, name ASC;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get all projects from registry:', error.message);
    throw error;
  }
};

/**
 * Get a single project by ID from registry
 */
export const getProjectById = async (projectId: number): Promise<any> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      uuid, row_id, id, name, full_path, group_path,
      members_count, members, last_activity_at, parent_id, visibility,
      tracked, created_at, updated_at, synced_at
    FROM projects
    WHERE id = $1;
  `;
  
  try {
    const result = await pool.query(query, [projectId]);
    return result.rows[0] || null;
  } catch (error: any) {
    console.error('❌ Failed to get project by ID:', error.message);
    throw error;
  }
};

/**
 * Get project UUID by GitLab project ID
 */
export const getProjectUUID = async (projectId: number): Promise<string | null> => {
  const pool = getPool();
  
  const query = `SELECT uuid FROM projects WHERE id = $1;`;
  
  try {
    const result = await pool.query(query, [projectId]);
    return result.rows[0]?.uuid || null;
  } catch (error: any) {
    console.error('❌ Failed to get project UUID:', error.message);
    throw error;
  }
};


/**
 * Set a project's tracked status
 */
export const setProjectTracked = async (id: number, tracked: boolean = true): Promise<any> => {
  const pool = getPool();
  
  const query = `
    UPDATE projects
    SET tracked = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  
  try {
    const result = await pool.query(query, [id, tracked]);
    return result.rows[0];
  } catch (error: any) {
    console.error('❌ Failed to update project tracked status:', error.message);
    throw error;
  }
};

/**
 * Track a project (set tracked to true)
 */
export const trackProject = async (id: number): Promise<any> => {
  return setProjectTracked(id, true);
};

/**
 * Untrack a project (set tracked to false)
 */
export const untrackProject = async (id: number): Promise<boolean> => {
  const pool = getPool();
  
  const query = `
    UPDATE projects
    SET tracked = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id;
  `;
  
  try {
    const result = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error: any) {
    console.error('❌ Failed to untrack project:', error.message);
    throw error;
  }
};

/**
 * Check if a project is tracked
 */
export const isProjectTracked = async (id: number): Promise<boolean> => {
  const pool = getPool();
  
  const query = `SELECT id FROM projects WHERE id = $1 AND tracked = TRUE;`;
  
  try {
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  } catch (error: any) {
    console.error('❌ Failed to check if project is tracked:', error.message);
    throw error;
  }
};

/**
 * Get tracked project IDs
 */
export const getTrackedProjectIds = async (): Promise<number[]> => {
  const pool = getPool();
  
  const query = `SELECT id FROM projects WHERE tracked = TRUE;`;
  
  try {
    const result = await pool.query(query);
    return result.rows.map(row => row.id);
  } catch (error: any) {
    console.error('❌ Failed to get tracked project IDs:', error.message);
    throw error;
  }
};

// ============================================================================
// TRACKED_PROJECT_SNAPSHOTS TABLE - Historical Snapshots
// ============================================================================

/**
 * Insert a new snapshot for a tracked project (append-only)
 * Used by "Refresh" buttons - captures current state
 */
export const insertProjectSnapshot = async (snapshotData: {
  project_id: number;  // GitLab project ID
  description?: string;
  web_url?: string;
  open_issues?: number;
  open_mrs?: number;
  open_milestones_count?: number;
  sonar_project_key?: string;
  sonar_security_high?: number;
  sonar_security_blocker?: number;
  sonar_reliability_high?: number;
  sonar_reliability_blocker?: number;
  sonar_maintainability_high?: number;
  sonar_maintainability_blocker?: number;
}): Promise<any> => {
  const pool = getPool();
  
  // First get the project UUID
  const projectUUID = await getProjectUUID(snapshotData.project_id);
  if (!projectUUID) {
    throw new Error(`Project with ID ${snapshotData.project_id} not found in registry`);
  }
  
  const query = `
    INSERT INTO tracked_project_snapshots (
      project_uuid, description, web_url,
      open_issues, open_mrs, open_milestones_count,
      sonar_project_key, sonar_security_high, sonar_security_blocker,
      sonar_reliability_high, sonar_reliability_blocker,
      sonar_maintainability_high, sonar_maintainability_blocker,
      snapshot_date
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
    RETURNING *;
  `;
  
  try {
    const result = await pool.query(query, [
      projectUUID,
      snapshotData.description || null,
      snapshotData.web_url || null,
      snapshotData.open_issues ?? 0,
      snapshotData.open_mrs ?? 0,
      snapshotData.open_milestones_count ?? 0,
      snapshotData.sonar_project_key || null,
      snapshotData.sonar_security_high ?? 0,
      snapshotData.sonar_security_blocker ?? 0,
      snapshotData.sonar_reliability_high ?? 0,
      snapshotData.sonar_reliability_blocker ?? 0,
      snapshotData.sonar_maintainability_high ?? 0,
      snapshotData.sonar_maintainability_blocker ?? 0,
    ]);
    return result.rows[0];
  } catch (error: any) {
    console.error('❌ Failed to insert project snapshot:', error.message);
    throw error;
  }
};

/**
 * Get latest snapshot for each tracked project
 * Returns combined data from projects + latest snapshot
 */
export const getLatestSnapshotsForTrackedProjects = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT DISTINCT ON (p.uuid)
      p.uuid,
      p.row_id,
      p.id,
      p.name,
      p.full_path,
      p.group_path,
      p.members_count,
      p.members,
      p.last_activity_at,
      p.parent_id,
      p.visibility,
      p.tracked,
      p.synced_at,
      s.description,
      s.web_url,
      s.open_issues,
      s.open_mrs,
      s.open_milestones_count,
      s.sonar_project_key,
      s.sonar_security_high,
      s.sonar_security_blocker,
      s.sonar_reliability_high,
      s.sonar_reliability_blocker,
      s.sonar_maintainability_high,
      s.sonar_maintainability_blocker,
      s.snapshot_date
    FROM projects p
    LEFT JOIN tracked_project_snapshots s ON p.uuid = s.project_uuid
    WHERE p.tracked = TRUE
    ORDER BY p.uuid, s.snapshot_date DESC NULLS LAST;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get latest snapshots for tracked projects:', error.message);
    throw error;
  }
};

/**
 * Get all snapshots for a specific project (historical view)
 */
export const getProjectSnapshots = async (projectId: number): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      s.uuid,
      s.row_id,
      s.description,
      s.web_url,
      s.open_issues,
      s.open_mrs,
      s.open_milestones_count,
      s.sonar_project_key,
      s.sonar_security_high,
      s.sonar_security_blocker,
      s.sonar_reliability_high,
      s.sonar_reliability_blocker,
      s.sonar_maintainability_high,
      s.sonar_maintainability_blocker,
      s.snapshot_date
    FROM tracked_project_snapshots s
    JOIN projects p ON s.project_uuid = p.uuid
    WHERE p.id = $1
    ORDER BY s.snapshot_date DESC;
  `;
  
  try {
    const result = await pool.query(query, [projectId]);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get project snapshots:', error.message);
    throw error;
  }
};

/**
 * Get the latest snapshot for a project by project name
 * @param projectName - Name of the project
 * @returns Latest snapshot data with project info or null if not found
 */
export const getLatestSnapshotByProjectName = async (projectName: string) => {
  const pool = getPool();
  
  const query = `
    SELECT 
      p.id as project_id,
      p.name as project_name,
      p.full_path,
      p.last_activity_at,
      s.open_issues,
      s.open_mrs,
      s.open_milestones_count,
      s.sonar_security_high,
      s.sonar_security_blocker,
      s.sonar_reliability_high,
      s.sonar_reliability_blocker,
      s.sonar_maintainability_high,
      s.sonar_maintainability_blocker,
      s.snapshot_date
    FROM projects p
    LEFT JOIN tracked_project_snapshots s ON s.project_uuid = p.uuid
    WHERE LOWER(p.name) = LOWER($1)
      AND p.tracked = true
    ORDER BY s.snapshot_date DESC
    LIMIT 1;
  `;
  
  try {
    const result = await pool.query(query, [projectName]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error: any) {
    console.error('❌ Failed to get latest snapshot by project name:', error.message);
    throw error;
  }
};

// ============================================================================
// LEGACY COMPATIBILITY (for migration period)
// ============================================================================

/**
 * @deprecated Use syncProjectToRegistry instead
 */
export const syncProject = syncProjectToRegistry;

/**
 * @deprecated Use syncProjectsToRegistry instead
 */
export const syncProjects = syncProjectsToRegistry;

/**
 * @deprecated Use getAllProjectsFromRegistry instead
 */
export const getAllProjectsFromDB = getAllProjectsFromRegistry;

/**
 * @deprecated Use getLatestSnapshotsForTrackedProjects instead
 */
export const getTrackedProjects = getLatestSnapshotsForTrackedProjects;


// ============================================================================
// PROJECT INSIGHTS QUERIES
// ============================================================================

/**
 * Save corrected AI insights for a project
 */
export const saveProjectInsights = async (
  projectName: string,
  insightsData: any
): Promise<void> => {
  const pool = getPool();
  
  try {
    // First, get the project UUID
    const projectResult = await pool.query(
      'SELECT uuid FROM projects WHERE LOWER(name) = LOWER($1)',
      [projectName]
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error(`Project "${projectName}" not found in database`);
    }
    
    const projectUuid = projectResult.rows[0].uuid;
    
    // Insert insights (one per day per project)
    await pool.query(
      `INSERT INTO project_insights 
       (project_uuid, insights_data, final_user_score, api_score, combined_score)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        projectUuid,
        JSON.stringify(insightsData),
        insightsData.final_user_score,
        insightsData.api_scores?.api_score,
        insightsData.combined_score
      ]
    );
    
    console.log(`✅ Saved insights for project: ${projectName}`);
  } catch (error: any) {
    console.error('❌ Failed to save project insights:', error.message);
    throw error;
  }
};

/**
 * Get latest insights for a project
 */
export const getLatestProjectInsights = async (projectName: string): Promise<any | null> => {
  const pool = getPool();
  
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
    LIMIT 1;
  `;
  
  try {
    const result = await pool.query(query, [projectName]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error: any) {
    console.error('❌ Failed to get latest project insights:', error.message);
    throw error;
  }
};

/**
 * Get all insights for a project (historical)
 */
export const getProjectInsightsHistory = async (projectName: string): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      pi.uuid,
      pi.row_id,
      pi.insights_data,
      pi.final_user_score,
      pi.api_score,
      pi.combined_score,
      pi.created_at
    FROM project_insights pi
    JOIN projects p ON pi.project_uuid = p.uuid
    WHERE LOWER(p.name) = LOWER($1)
    ORDER BY pi.created_at DESC;
  `;
  
  try {
    const result = await pool.query(query, [projectName]);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get project insights history:', error.message);
    throw error;
  }
};

/**
 * Get all insights for a project by project ID (historical)
 */
export const getProjectInsightsHistoryById = async (projectId: number): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      pi.uuid,
      pi.row_id,
      pi.insights_data,
      pi.final_user_score,
      pi.api_score,
      pi.combined_score,
      pi.created_at
    FROM project_insights pi
    JOIN projects p ON pi.project_uuid = p.uuid
    WHERE p.id = $1
    ORDER BY pi.created_at ASC;
  `;
  
  try {
    const result = await pool.query(query, [projectId]);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get project insights history by ID:', error.message);
    throw error;
  }
};

/**
 * Get all projects with their latest insight scores
 */
export const getAllProjectsWithInsights = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      p.uuid,
      p.name,
      p.full_path,
      pi.final_user_score,
      pi.api_score,
      pi.combined_score,
      pi.created_at as last_insight_date
    FROM projects p
    LEFT JOIN LATERAL (
      SELECT * FROM project_insights
      WHERE project_uuid = p.uuid
      ORDER BY created_at DESC
      LIMIT 1
    ) pi ON true
    ORDER BY p.name;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get all projects with insights:', error.message);
    throw error;
  }
};

/**
 * Get latest insights for all projects with full metrics breakdown
 */
export const getAllLatestProjectInsights = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      p.id,
      p.uuid,
      p.name,
      p.full_path,
      pi.insights_data,
      pi.final_user_score,
      pi.api_score,
      pi.combined_score,
      pi.created_at
    FROM projects p
    INNER JOIN LATERAL (
      SELECT * FROM project_insights
      WHERE project_uuid = p.uuid
      ORDER BY created_at DESC
      LIMIT 1
    ) pi ON true
    WHERE pi.insights_data IS NOT NULL
    ORDER BY p.name;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get all latest project insights:', error.message);
    throw error;
  }
};

/**
 * Get total count of all projects
 */
export const getTotalProjectsCount = async (): Promise<number> => {
  const pool = getPool();
  
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM projects');
    return parseInt(result.rows[0].count);
  } catch (error: any) {
    console.error('❌ Failed to get total projects count:', error.message);
    throw error;
  }
};

/**
 * Get count of tracked projects
 */
export const getTrackedProjectsCount = async (): Promise<number> => {
  const pool = getPool();
  
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM projects WHERE tracked = true');
    return parseInt(result.rows[0].count);
  } catch (error: any) {
    console.error('❌ Failed to get tracked projects count:', error.message);
    throw error;
  }
};

/**
 * Get latest combined scores for all projects with insights
 */
export const getLatestCombinedScores = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      p.id,
      p.uuid,
      p.name,
      p.full_path,
      p.tracked,
      pi.combined_score,
      pi.created_at
    FROM projects p
    INNER JOIN LATERAL (
      SELECT combined_score, created_at
      FROM project_insights
      WHERE project_uuid = p.uuid
      ORDER BY created_at DESC
      LIMIT 1
    ) pi ON true
    WHERE pi.combined_score IS NOT NULL;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get latest combined scores:', error.message);
    throw error;
  }
};

/**
 * Get projects needing attention (combined_score < 3) with full insights data
 */
export const getProjectsNeedingAttention = async (limit: number = 6): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      p.id,
      p.uuid,
      p.name,
      p.full_path,
      pi.insights_data,
      pi.combined_score,
      pi.created_at
    FROM projects p
    INNER JOIN LATERAL (
      SELECT * FROM project_insights
      WHERE project_uuid = p.uuid
      ORDER BY created_at DESC
      LIMIT 1
    ) pi ON true
    WHERE pi.combined_score < 3
    ORDER BY pi.combined_score ASC
    LIMIT $1;
  `;
  
  try {
    const result = await pool.query(query, [limit]);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get projects needing attention:', error.message);
    throw error;
  }
};


