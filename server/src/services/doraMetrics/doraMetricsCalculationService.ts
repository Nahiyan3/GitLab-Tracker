// DORA Metrics Calculation Service
// Calculates aggregated DORA metrics for dashboards and reports

import { getPool } from '../../db/connection';
import { DoraMetricsSummary } from '../../types/doraMetrics.types';

/**
 * Calculate DORA metrics summary for a project
 * Now uses current calendar week (Sunday to Saturday)
 */
export const calculateDoraMetricsSummary = async (
  projectId: number,
  days: number = 30
): Promise<DoraMetricsSummary> => {
  const pool = getPool();

  // Calculate start of current week (Sunday)
  // EXTRACT(DOW FROM NOW()) returns 0 for Sunday, 1 for Monday, etc.
  const weekStartQuery = `
    (NOW()::date - INTERVAL '1 day' * EXTRACT(DOW FROM NOW())::integer)::timestamp
  `;

  // 1. Deployment Frequency
  const deploymentFrequencyQuery = `
    SELECT 
      COUNT(*) as total_deployments,
      COUNT(*) FILTER (WHERE environment = 'production') as production_deployments,
      COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '1 day') as daily,
      COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '7 days') as weekly,
      COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '30 days') as monthly
    FROM deployment_frequency
    WHERE project_id = $1
      AND deployment_timestamp >= ${weekStartQuery}
  `;

  const deploymentResult = await pool.query(deploymentFrequencyQuery, [projectId]);
  const deploymentData = deploymentResult.rows[0];

  // 2. Lead Time for Changes
  const leadTimeQuery = `
    SELECT 
      COUNT(*) as total_changes,
      AVG(lead_time_hours) as avg_lead_time,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lead_time_hours) as median_lead_time,
      MIN(lead_time_hours) as min_lead_time,
      MAX(lead_time_hours) as max_lead_time
    FROM lead_time_changes
    WHERE project_id = $1
      AND merged_timestamp >= ${weekStartQuery}
  `;

  const leadTimeResult = await pool.query(leadTimeQuery, [projectId]);
  const leadTimeData = leadTimeResult.rows[0];

  // 3. Change Failure Rate
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
      AND deployment_timestamp >= ${weekStartQuery}
  `;

  const changeFailureResult = await pool.query(changeFailureQuery, [projectId]);
  const changeFailureData = changeFailureResult.rows[0];

  // 4. Time to Restore Service
  const timeToRestoreQuery = `
    SELECT 
      COUNT(*) as total_incidents,
      AVG(restore_time_hours) as avg_restore_time,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY restore_time_hours) as median_restore_time,
      MIN(restore_time_hours) as min_restore_time,
      MAX(restore_time_hours) as max_restore_time
    FROM time_to_restore_service
    WHERE project_id = $1
      AND start_time >= ${weekStartQuery}
  `;

  const timeToRestoreResult = await pool.query(timeToRestoreQuery, [projectId]);
  const timeToRestoreData = timeToRestoreResult.rows[0];

  return {
    project_id: projectId,
    deployment_frequency: {
      total_deployments: parseInt(deploymentData.total_deployments) || 0,
      production_deployments: parseInt(deploymentData.production_deployments) || 0,
      deployments_per_day: parseInt(deploymentData.daily) || 0,
      deployments_per_week: parseInt(deploymentData.weekly) || 0,
      deployments_per_month: parseInt(deploymentData.monthly) || 0,
    },
    lead_time: {
      total_changes: parseInt(leadTimeData.total_changes) || 0,
      avg_lead_time_hours: parseFloat(leadTimeData.avg_lead_time) || 0,
      median_lead_time_hours: parseFloat(leadTimeData.median_lead_time) || 0,
      min_lead_time_hours: parseFloat(leadTimeData.min_lead_time) || 0,
      max_lead_time_hours: parseFloat(leadTimeData.max_lead_time) || 0,
    },
    change_failure_rate: {
      total_deployments: parseInt(changeFailureData.total_deployments) || 0,
      failed_deployments: parseInt(changeFailureData.failed_deployments) || 0,
      failure_rate_percent: parseFloat(changeFailureData.failure_rate) || 0,
    },
    time_to_restore: {
      total_incidents: parseInt(timeToRestoreData.total_incidents) || 0,
      avg_restore_time_hours: parseFloat(timeToRestoreData.avg_restore_time) || 0,
      median_restore_time_hours: parseFloat(timeToRestoreData.median_restore_time) || 0,
      min_restore_time_hours: parseFloat(timeToRestoreData.min_restore_time) || 0,
      max_restore_time_hours: parseFloat(timeToRestoreData.max_restore_time) || 0,
    },
  };
};
