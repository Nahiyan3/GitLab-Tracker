// DORA Metrics Calculation Service
// Calculates aggregated DORA metrics for dashboards and reports

import { getPool } from '../../db/connection';
import { DoraMetricsSummary } from '../../types/doraMetrics.types';

/**
 * Calculate DORA metrics summary for a project
 * @param projectId - The project ID
 * @param days - Number of days to look back (0 or null = all time)
 */
export const calculateDoraMetricsSummary = async (
  projectId: number,
  days: number = 30
): Promise<DoraMetricsSummary> => {
  const pool = getPool();

  // Build time filter based on days parameter
  // 0 or null = all time, otherwise filter by days
  const timeFilter = days > 0 
    ? `AND deployment_timestamp >= NOW() - INTERVAL '${days} days'`
    : '';

  const timeFilterMerged = days > 0
    ? `AND merged_timestamp >= NOW() - INTERVAL '${days} days'`
    : '';

  const timeFilterIncident = days > 0
    ? `AND start_time >= NOW() - INTERVAL '${days} days'`
    : '';

  // 1. Deployment Frequency
  const deploymentFrequencyQuery = `
    SELECT 
      COUNT(*) as total_deployments,
      COUNT(*) FILTER (WHERE environment = 'production') as production_deployments
    FROM deployment_frequency
    WHERE project_id = $1
      ${timeFilter}
  `;

  const deploymentResult = await pool.query(deploymentFrequencyQuery, [projectId]);
  const deploymentData = deploymentResult.rows[0];
  
  // For all-time metrics, calculate frequency metrics based on the full dataset
  let deployments_per_day = 0;
  let deployments_per_week = 0;
  let deployments_per_month = 0;
  
  if (days === 0 || days === null) {
    // Calculate based on entire dataset time range
    const timeRangeQuery = `
      SELECT 
        MIN(deployment_timestamp) as earliest,
        MAX(deployment_timestamp) as latest
      FROM deployment_frequency
      WHERE project_id = $1 AND environment = 'production'
    `;
    const rangeResult = await pool.query(timeRangeQuery, [projectId]);
    const { earliest, latest } = rangeResult.rows[0];
    
    if (earliest && latest) {
      const totalDays = Math.max(1, Math.ceil((new Date(latest).getTime() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24)));
      const totalDeployments = parseInt(deploymentData.production_deployments) || 0;
      
      deployments_per_day = parseFloat((totalDeployments / totalDays).toFixed(2));
      deployments_per_week = parseFloat((totalDeployments / (totalDays / 7)).toFixed(2));
      deployments_per_month = parseFloat((totalDeployments / (totalDays / 30)).toFixed(2));
    }
  } else {
    // For time-filtered queries, count recent deployments
    const recentQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '1 day') as daily,
        COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '7 days') as weekly,
        COUNT(*) FILTER (WHERE environment = 'production' AND deployment_timestamp >= NOW() - INTERVAL '30 days') as monthly
      FROM deployment_frequency
      WHERE project_id = $1
    `;
    const recentResult = await pool.query(recentQuery, [projectId]);
    const recentData = recentResult.rows[0];
    
    deployments_per_day = parseInt(recentData.daily) || 0;
    deployments_per_week = parseInt(recentData.weekly) || 0;
    deployments_per_month = parseInt(recentData.monthly) || 0;
  }

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
      ${timeFilterMerged}
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
      ${timeFilter}
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
      ${timeFilterIncident}
  `;

  const timeToRestoreResult = await pool.query(timeToRestoreQuery, [projectId]);
  const timeToRestoreData = timeToRestoreResult.rows[0];

  return {
    project_id: projectId,
    deployment_frequency: {
      total_deployments: parseInt(deploymentData.total_deployments) || 0,
      production_deployments: parseInt(deploymentData.production_deployments) || 0,
      deployments_per_day: deployments_per_day,
      deployments_per_week: deployments_per_week,
      deployments_per_month: deployments_per_month,
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
