// Weekly DORA Metrics Snapshot Service
// Automatically captures weekly DORA metrics for trend analysis

import { getPool } from '../../db/connection';

interface WeeklyDoraSnapshot {
  uuid?: string;
  project_id: number;
  week_start_date: Date;
  week_end_date: Date;
  total_deployments: number;
  production_deployments: number;
  failed_deployments: number;
  failure_rate_percent: number;
  total_changes: number;
  avg_lead_time_hours: number | null;
  total_incidents: number;
  avg_restore_time_hours: number | null;
}

/**
 * Calculate and save weekly DORA snapshot for a specific project and week
 */
export const saveWeeklyDoraSnapshot = async (
  projectId: number,
  weekStartDate: Date,
  weekEndDate: Date
): Promise<WeeklyDoraSnapshot> => {
  const pool = getPool();

  // Calculate metrics for the week
  const deploymentQuery = `
    SELECT 
      COUNT(*) as total_deployments,
      COUNT(*) FILTER (WHERE environment = 'production') as production_deployments
    FROM deployment_frequency
    WHERE project_id = $1
      AND deployment_timestamp >= $2::date
      AND deployment_timestamp < ($3::date + INTERVAL '1 day')
  `;

  const changeFailureQuery = `
    SELECT 
      COUNT(*) as total_deployments,
      COUNT(*) FILTER (WHERE is_failure = true) as failed_deployments,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE is_failure = true)::DECIMAL / COUNT(*)) * 100
        ELSE 0
      END as failure_rate
    FROM change_failure_rate
    WHERE project_id = $1
      AND deployment_timestamp >= $2::date
      AND deployment_timestamp < ($3::date + INTERVAL '1 day')
  `;

  const leadTimeQuery = `
    SELECT 
      COUNT(*) as total_changes,
      AVG(lead_time_hours) as avg_lead_time
    FROM lead_time_changes
    WHERE project_id = $1
      AND merged_timestamp >= $2::date
      AND merged_timestamp < ($3::date + INTERVAL '1 day')
  `;

  const restoreTimeQuery = `
    SELECT 
      COUNT(*) as total_incidents,
      AVG(restore_time_hours) as avg_restore_time
    FROM time_to_restore_service
    WHERE project_id = $1
      AND start_time >= $2::date
      AND start_time < ($3::date + INTERVAL '1 day')
  `;

  const [deploymentResult, changeFailureResult, leadTimeResult, restoreTimeResult] = await Promise.all([
    pool.query(deploymentQuery, [projectId, weekStartDate, weekEndDate]),
    pool.query(changeFailureQuery, [projectId, weekStartDate, weekEndDate]),
    pool.query(leadTimeQuery, [projectId, weekStartDate, weekEndDate]),
    pool.query(restoreTimeQuery, [projectId, weekStartDate, weekEndDate]),
  ]);

  const deploymentData = deploymentResult.rows[0];
  const changeFailureData = changeFailureResult.rows[0];
  const leadTimeData = leadTimeResult.rows[0];
  const restoreTimeData = restoreTimeResult.rows[0];

  // Insert or update the weekly snapshot
  const insertQuery = `
    INSERT INTO weekly_dora_snapshots (
      project_id,
      week_start_date,
      week_end_date,
      total_deployments,
      production_deployments,
      failed_deployments,
      failure_rate_percent,
      total_changes,
      avg_lead_time_hours,
      total_incidents,
      avg_restore_time_hours
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (project_id, week_start_date)
    DO UPDATE SET
      week_end_date = EXCLUDED.week_end_date,
      total_deployments = EXCLUDED.total_deployments,
      production_deployments = EXCLUDED.production_deployments,
      failed_deployments = EXCLUDED.failed_deployments,
      failure_rate_percent = EXCLUDED.failure_rate_percent,
      total_changes = EXCLUDED.total_changes,
      avg_lead_time_hours = EXCLUDED.avg_lead_time_hours,
      total_incidents = EXCLUDED.total_incidents,
      avg_restore_time_hours = EXCLUDED.avg_restore_time_hours,
      created_at = NOW()
    RETURNING *
  `;

  const result = await pool.query(insertQuery, [
    projectId,
    weekStartDate,
    weekEndDate,
    parseInt(deploymentData.total_deployments) || 0,
    parseInt(deploymentData.production_deployments) || 0,
    parseInt(changeFailureData.failed_deployments) || 0,
    parseFloat(changeFailureData.failure_rate) || 0,
    parseInt(leadTimeData.total_changes) || 0,
    leadTimeData.avg_lead_time ? parseFloat(leadTimeData.avg_lead_time) : null,
    parseInt(restoreTimeData.total_incidents) || 0,
    restoreTimeData.avg_restore_time ? parseFloat(restoreTimeData.avg_restore_time) : null,
  ]);

  return result.rows[0];
};

/**
 * Save weekly snapshots for all tracked projects for a given week
 */
export const saveWeeklySnapshotsForAllProjects = async (
  weekStartDate: Date,
  weekEndDate: Date
): Promise<void> => {
  const pool = getPool();

  // Get all tracked projects
  const projectsQuery = `
    SELECT DISTINCT project_id FROM tracked_project_snapshots WHERE is_active = true
  `;
  const projectsResult = await pool.query(projectsQuery);
  const projectIds = projectsResult.rows.map(row => row.project_id);

  console.log(`📊 Saving weekly DORA snapshots for ${projectIds.length} projects...`);

  for (const projectId of projectIds) {
    try {
      await saveWeeklyDoraSnapshot(projectId, weekStartDate, weekEndDate);
      console.log(`✅ Saved weekly snapshot for project ${projectId}`);
    } catch (error) {
      console.error(`❌ Failed to save snapshot for project ${projectId}:`, error);
    }
  }

  console.log('✅ Weekly DORA snapshots saved for all projects');
};

/**
 * Get the start and end dates for the previous week (Sunday to Saturday)
 */
export const getPreviousWeekDates = (): { weekStart: Date; weekEnd: Date } => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate days to subtract to get to last Sunday
  const daysToLastSunday = dayOfWeek === 0 ? 7 : dayOfWeek;
  
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - daysToLastSunday);
  lastSunday.setHours(0, 0, 0, 0);
  
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  lastSaturday.setHours(23, 59, 59, 999);
  
  return {
    weekStart: lastSunday,
    weekEnd: lastSaturday,
  };
};

/**
 * Save snapshots for the previous week (to be called on Sunday)
 */
export const captureLastWeekSnapshots = async (): Promise<void> => {
  const { weekStart, weekEnd } = getPreviousWeekDates();
  
  console.log(`📊 Capturing DORA snapshots for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
  
  await saveWeeklySnapshotsForAllProjects(weekStart, weekEnd);
};

/**
 * Get weekly snapshots for a project (for trend analysis)
 */
export const getWeeklySnapshotsForProject = async (
  projectId: number,
  limit: number = 12 // Default to 12 weeks (3 months)
): Promise<WeeklyDoraSnapshot[]> => {
  const pool = getPool();

  const query = `
    SELECT *
    FROM weekly_dora_snapshots
    WHERE project_id = $1
    ORDER BY week_start_date DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [projectId, limit]);
  return result.rows;
};
