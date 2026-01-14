// DORA Metrics Trend Service
// Provides trend data for weekly, monthly, and yearly analysis

import { getPool } from '../../db/connection';

export interface DoraTrendDataPoint {
  period: string; // e.g., "2024-01", "2024-W01", "2024"
  deployment_frequency: number;
  avg_lead_time_hours: number;
  failure_rate_percent: number;
  avg_restore_time_hours: number;
  total_deployments: number;
  total_changes: number;
  failed_deployments: number;
  total_incidents: number;
}

export interface DoraTrendResponse {
  granularity: 'weekly' | 'monthly' | 'yearly';
  data: DoraTrendDataPoint[];
  summary: {
    deployment_frequency: {
      current: number;
      avg: number;
      trend: 'up' | 'down' | 'stable';
      change_percent: number;
    };
    lead_time: {
      current: number;
      avg: number;
      trend: 'up' | 'down' | 'stable';
      change_percent: number;
    };
    failure_rate: {
      current: number;
      avg: number;
      trend: 'up' | 'down' | 'stable';
      change_percent: number;
    };
    restore_time: {
      current: number;
      avg: number;
      trend: 'up' | 'down' | 'stable';
      change_percent: number;
    };
  };
}

/**
 * Calculate trend direction and percentage change
 */
function calculateTrend(current: number, previous: number, lowerIsBetter: boolean = false): {
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
} {
  if (previous === 0) {
    return { trend: 'stable', change_percent: 0 };
  }
  
  const change_percent = ((current - previous) / previous) * 100;
  
  // Only treat as stable if change is less than 1%
  if (Math.abs(change_percent) < 1) {
    return { trend: 'stable', change_percent };
  }
  
  // For all metrics: 'up' means value increased, 'down' means value decreased
  // The frontend will handle coloring based on whether that's good or bad
  return {
    trend: change_percent > 0 ? 'up' : 'down',
    change_percent,
  };
}

/**
 * Get DORA metrics trends for a project
 * @param projectId - The project ID
 * @param granularity - 'weekly', 'monthly', or 'yearly'
 * @param periods - Number of periods to retrieve (max 12)
 * @param offset - Number of period sets to skip (0 = current, 1 = previous 12 periods, etc.)
 */
export const getDoraTrends = async (
  projectId: number,
  granularity: 'weekly' | 'monthly' | 'yearly' = 'monthly',
  periods: number = 12,
  offset: number = 0
): Promise<DoraTrendResponse> => {
  const pool = getPool();
  periods = Math.min(periods, 12); // Cap at 12 periods
  offset = Math.max(0, offset); // Ensure offset is non-negative

  let dateFormat: string;
  let dateGrouping: string;
  let intervalString: string;
  let totalOffsetString: string;

  switch (granularity) {
    case 'weekly':
      dateFormat = 'IYYY-"W"IW'; // ISO week format: 2024-W01
      dateGrouping = 'EXTRACT(YEAR FROM deployment_timestamp), EXTRACT(WEEK FROM deployment_timestamp)';
      intervalString = `${periods} weeks`;
      totalOffsetString = `${periods * (offset + 1)} weeks`;
      break;
    case 'yearly':
      dateFormat = 'YYYY';
      dateGrouping = 'EXTRACT(YEAR FROM deployment_timestamp)';
      intervalString = `${periods} years`;
      totalOffsetString = `${periods * (offset + 1)} years`;
      break;
    case 'monthly':
    default:
      dateFormat = 'YYYY-MM';
      dateGrouping = 'EXTRACT(YEAR FROM deployment_timestamp), EXTRACT(MONTH FROM deployment_timestamp)';
      intervalString = `${periods} months`;
      totalOffsetString = `${periods * (offset + 1)} months`;
      break;
  }

  // Calculate the date range: from (offset+1)*periods to offset*periods ago
  const offsetIntervalString = offset > 0 ? `${periods * offset} ${granularity === 'weekly' ? 'weeks' : granularity === 'yearly' ? 'years' : 'months'}` : '0 days';

  // 1. Get deployment frequency trends  
  const deploymentQuery = `
    SELECT 
      TO_CHAR(deployment_timestamp, '${dateFormat}') as period,
      COUNT(*) as deployment_count
    FROM deployment_frequency
    WHERE project_id = $1
      AND environment = 'production'
      AND deployment_timestamp >= CURRENT_DATE - INTERVAL '${totalOffsetString}'
      AND deployment_timestamp < CURRENT_DATE - INTERVAL '${offsetIntervalString}'
    GROUP BY TO_CHAR(deployment_timestamp, '${dateFormat}')
    ORDER BY period DESC
    LIMIT ${periods}
  `;

  console.log('[doraTrendsService] Executing deployment query for project:', projectId);
  console.log('[doraTrendsService] Date format:', dateFormat);
  console.log('[doraTrendsService] Interval:', intervalString);
  console.log('[doraTrendsService] Date range: CURRENT_DATE - ${totalOffsetString} to CURRENT_DATE - ${offsetIntervalString}');
   
  const deploymentResult = await pool.query(deploymentQuery, [projectId]);

  // 2. Get lead time trends
  const leadTimeQuery = `
    SELECT 
      TO_CHAR(merged_timestamp, '${dateFormat}') as period,
      COUNT(*) as change_count,
      AVG(lead_time_hours) as avg_lead_time
    FROM lead_time_changes
    WHERE project_id = $1
      AND merged_timestamp >= CURRENT_DATE - INTERVAL '${totalOffsetString}'
      AND merged_timestamp < CURRENT_DATE - INTERVAL '${offsetIntervalString}'
    GROUP BY TO_CHAR(merged_timestamp, '${dateFormat}')
    ORDER BY period DESC
    LIMIT ${periods}
  `;

  const leadTimeResult = await pool.query(leadTimeQuery, [projectId]);

  // 3. Get change failure rate trends
  const failureQuery = `
    SELECT 
      TO_CHAR(deployment_timestamp, '${dateFormat}') as period,
      COUNT(*) as total_deploys,
      COUNT(*) FILTER (WHERE is_failure = true) as failed_deploys,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE is_failure = true)::DECIMAL / COUNT(*)) * 100
        ELSE 0
      END as failure_rate
    FROM change_failure_rate
    WHERE project_id = $1
      AND deployment_timestamp >= CURRENT_DATE - INTERVAL '${totalOffsetString}'
      AND deployment_timestamp < CURRENT_DATE - INTERVAL '${offsetIntervalString}'
    GROUP BY TO_CHAR(deployment_timestamp, '${dateFormat}')
    ORDER BY period DESC
    LIMIT ${periods}
  `;

  const failureResult = await pool.query(failureQuery, [projectId]);

  // 4. Get time to restore trends
  const restoreQuery = `
    SELECT 
      TO_CHAR(start_time, '${dateFormat}') as period,
      COUNT(*) as incident_count,
      AVG(restore_time_hours) as avg_restore_time
    FROM time_to_restore_service
    WHERE project_id = $1
      AND start_time >= CURRENT_DATE - INTERVAL '${totalOffsetString}'
      AND start_time < CURRENT_DATE - INTERVAL '${offsetIntervalString}'
    GROUP BY TO_CHAR(start_time, '${dateFormat}')
    ORDER BY period DESC
    LIMIT ${periods}
  `;

  const restoreResult = await pool.query(restoreQuery, [projectId]);

  // Combine data from all queries
  const periodMap = new Map<string, DoraTrendDataPoint>();

  // Collect all unique periods from all queries
  const allPeriods = new Set<string>();
  
  deploymentResult.rows.forEach(row => allPeriods.add(row.period));
  leadTimeResult.rows.forEach(row => allPeriods.add(row.period));
  failureResult.rows.forEach(row => allPeriods.add(row.period));
  restoreResult.rows.forEach(row => allPeriods.add(row.period));

  // Initialize all periods with zero values
  allPeriods.forEach(period => {
    periodMap.set(period, {
      period,
      deployment_frequency: 0,
      avg_lead_time_hours: 0,
      failure_rate_percent: 0,
      avg_restore_time_hours: 0,
      total_deployments: 0,
      total_changes: 0,
      failed_deployments: 0,
      total_incidents: 0,
    });
  });

  // Fill in deployment data
  deploymentResult.rows.forEach(row => {
    const point = periodMap.get(row.period);
    if (point) {
      point.deployment_frequency = parseInt(row.deployment_count) || 0;
      point.total_deployments = parseInt(row.deployment_count) || 0;
    }
  });

  // Add lead time data
  leadTimeResult.rows.forEach(row => {
    const point = periodMap.get(row.period);
    if (point) {
      point.avg_lead_time_hours = parseFloat(row.avg_lead_time) || 0;
      point.total_changes = parseInt(row.change_count) || 0;
    }
  });

  // Add failure rate data
  failureResult.rows.forEach(row => {
    const point = periodMap.get(row.period);
    if (point) {
      point.failure_rate_percent = parseFloat(row.failure_rate) || 0;
      point.failed_deployments = parseInt(row.failed_deploys) || 0;
    }
  });

  // Add restore time data
  restoreResult.rows.forEach(row => {
    const point = periodMap.get(row.period);
    if (point) {
      point.avg_restore_time_hours = parseFloat(row.avg_restore_time) || 0;
      point.total_incidents = parseInt(row.incident_count) || 0;
    }
  });

  const data = Array.from(periodMap.values()).sort((a, b) => 
    a.period.localeCompare(b.period)
  );

  // Calculate summary statistics
  const deploymentFreqs = data.map(d => d.deployment_frequency).filter(d => d > 0);
  const leadTimes = data.map(d => d.avg_lead_time_hours).filter(d => d > 0);
  const failureRates = data.map(d => d.failure_rate_percent);
  const restoreTimes = data.map(d => d.avg_restore_time_hours).filter(d => d > 0);

  const current = data[data.length - 1] || {
    deployment_frequency: 0,
    avg_lead_time_hours: 0,
    failure_rate_percent: 0,
    avg_restore_time_hours: 0,
  };

  const previous = data[data.length - 2] || current;

  const avgDeploymentFreq = deploymentFreqs.length > 0 
    ? deploymentFreqs.reduce((a, b) => a + b, 0) / deploymentFreqs.length 
    : 0;
  const avgLeadTime = leadTimes.length > 0 
    ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length 
    : 0;
  const avgFailureRate = failureRates.length > 0 
    ? failureRates.reduce((a, b) => a + b, 0) / failureRates.length 
    : 0;
  const avgRestoreTime = restoreTimes.length > 0 
    ? restoreTimes.reduce((a, b) => a + b, 0) / restoreTimes.length 
    : 0;

  return {
    granularity,
    data,
    summary: {
      deployment_frequency: {
        current: current.deployment_frequency,
        avg: avgDeploymentFreq,
        ...calculateTrend(current.deployment_frequency, previous.deployment_frequency, false),
      },
      lead_time: {
        current: current.avg_lead_time_hours,
        avg: avgLeadTime,
        ...calculateTrend(current.avg_lead_time_hours, previous.avg_lead_time_hours, true),
      },
      failure_rate: {
        current: current.failure_rate_percent,
        avg: avgFailureRate,
        ...calculateTrend(current.failure_rate_percent, previous.failure_rate_percent, true),
      },
      restore_time: {
        current: current.avg_restore_time_hours,
        avg: avgRestoreTime,
        ...calculateTrend(current.avg_restore_time_hours, previous.avg_restore_time_hours, true),
      },
    },
  };
};
