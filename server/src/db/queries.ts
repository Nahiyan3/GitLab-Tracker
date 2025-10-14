// Database queries
import { getPool } from './connection';

/**
 * Initialize database tables
 */
export const initializeTables = async (): Promise<void> => {
  const pool = getPool();
  
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS tracked_projects (
      id INTEGER PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      web_url TEXT,
      last_activity_at TIMESTAMP,
      visibility VARCHAR(50),
      star_count INTEGER DEFAULT 0,
      forks_count INTEGER DEFAULT 0,
      parent_id INTEGER,
      group_path TEXT,
      full_path TEXT,
      tracked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_tracked_projects_parent_id ON tracked_projects(parent_id);
    CREATE INDEX IF NOT EXISTS idx_tracked_projects_tracked ON tracked_projects(tracked);
  `;

  // Migration: Add new columns if they don't exist
  const addColumnsQuery = `
    DO $$
    BEGIN
      -- Add tracked column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'tracked'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN tracked BOOLEAN DEFAULT FALSE;
      END IF;
      
      -- Add synced_at column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'synced_at'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      END IF;
      
      -- Add description column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'description'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN description TEXT;
      END IF;
      
      -- Add web_url column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'web_url'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN web_url TEXT;
      END IF;
      
      -- Add last_activity_at column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'last_activity_at'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN last_activity_at TIMESTAMP;
      END IF;
      
      -- Add visibility column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'visibility'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN visibility VARCHAR(50);
      END IF;
      
      -- Add star_count column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'star_count'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN star_count INTEGER DEFAULT 0;
      END IF;
      
      -- Add forks_count column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'forks_count'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN forks_count INTEGER DEFAULT 0;
      END IF;
      
      -- Add group_path column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'group_path'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN group_path TEXT;
      END IF;
      
      -- Add full_path column
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tracked_projects' AND column_name = 'full_path'
      ) THEN
        ALTER TABLE tracked_projects ADD COLUMN full_path TEXT;
      END IF;
    END $$;
  `;
  
  try {
    await pool.query(createTableQuery);
    await pool.query(addColumnsQuery);
    console.log('✅ Database tables initialized');
  } catch (error: any) {
    console.error('❌ Failed to initialize tables:', error.message);
    throw error;
  }
};

/**
 * Sync a project from GitLab to database (insert or update)
 */
export const syncProject = async (projectData: {
  id: number;
  name: string;
  description?: string;
  web_url?: string;
  last_activity_at?: string;
  visibility?: string;
  star_count?: number;
  forks_count?: number;
  parent_id?: number;
  group_path?: string;
  full_path?: string;
}): Promise<any> => {
  const pool = getPool();
  
  const query = `
    INSERT INTO tracked_projects (
      id, name, description, web_url, last_activity_at, 
      visibility, star_count, forks_count, parent_id, 
      group_path, full_path, synced_at, tracked
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, FALSE)
    ON CONFLICT (id) 
    DO UPDATE SET 
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      web_url = EXCLUDED.web_url,
      last_activity_at = EXCLUDED.last_activity_at,
      visibility = EXCLUDED.visibility,
      star_count = EXCLUDED.star_count,
      forks_count = EXCLUDED.forks_count,
      parent_id = EXCLUDED.parent_id,
      group_path = EXCLUDED.group_path,
      full_path = EXCLUDED.full_path,
      synced_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  
  try {
    const result = await pool.query(query, [
      projectData.id,
      projectData.name,
      projectData.description || null,
      projectData.web_url || null,
      projectData.last_activity_at || null,
      projectData.visibility || null,
      projectData.star_count || 0,
      projectData.forks_count || 0,
      projectData.parent_id || null,
      projectData.group_path || null,
      projectData.full_path || null,
    ]);
    return result.rows[0];
  } catch (error: any) {
    console.error('❌ Failed to sync project:', error.message);
    throw error;
  }
};

/**
 * Sync multiple projects from GitLab to database
 */
export const syncProjects = async (projects: Array<{
  id: number;
  name: string;
  description?: string;
  web_url?: string;
  last_activity_at?: string;
  visibility?: string;
  star_count?: number;
  forks_count?: number;
  parent_id?: number;
  group_path?: string;
  full_path?: string;
}>): Promise<void> => {
  const pool = getPool();
  
  try {
    for (const project of projects) {
      await syncProject(project);
    }
    console.log(`✅ Synced ${projects.length} projects to database`);
  } catch (error: any) {
    console.error('❌ Failed to sync projects:', error.message);
    throw error;
  }
};

/**
 * Set a project's tracked status to true
 */
export const setProjectTracked = async (id: number, tracked: boolean = true): Promise<any> => {
  const pool = getPool();
  
  const query = `
    UPDATE tracked_projects
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
    UPDATE tracked_projects
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
 * Get all tracked projects
 */
export const getTrackedProjects = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT id, name, parent_id, created_at, updated_at
    FROM tracked_projects
    WHERE tracked = TRUE
    ORDER BY updated_at DESC;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get tracked projects:', error.message);
    throw error;
  }
};

/**
 * Get all projects from database (tracked and untracked)
 */
export const getAllProjectsFromDB = async (): Promise<any[]> => {
  const pool = getPool();
  
  const query = `
    SELECT 
      id, name, description, web_url, last_activity_at,
      visibility, star_count, forks_count, parent_id,
      group_path, full_path, tracked, 
      created_at, updated_at, synced_at
    FROM tracked_projects
    ORDER BY synced_at DESC, name ASC;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error: any) {
    console.error('❌ Failed to get all projects from database:', error.message);
    throw error;
  }
};

/**
 * Check if a project is tracked
 */
export const isProjectTracked = async (id: number): Promise<boolean> => {
  const pool = getPool();
  
  const query = `
    SELECT id FROM tracked_projects WHERE id = $1 AND tracked = TRUE;
  `;
  
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
  
  const query = `
    SELECT id FROM tracked_projects WHERE tracked = TRUE;
  `;
  
  try {
    const result = await pool.query(query);
    return result.rows.map(row => row.id);
  } catch (error: any) {
    console.error('❌ Failed to get tracked project IDs:', error.message);
    throw error;
  }
};
