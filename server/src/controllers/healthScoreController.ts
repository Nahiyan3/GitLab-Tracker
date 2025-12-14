// Health Score Controller
// Provides endpoints to fetch health score trends for all 6 metrics

import { Request, Response } from 'express';
import { getPool } from '../db/connection';

/**
 * Get health score history for all 6 metrics
 * GET /projects/:id/health-scores/history
 */
export const getHealthScoreHistory = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const pool = getPool();

    // Fetch health scores from all 6 history tables
    const [
      issueHistory,
      mrHistory,
      commitHistory,
      reliabilityHistory,
      maintainabilityHistory,
      securityHistory,
    ] = await Promise.all([
      // Issue Metrics History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM issue_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),

      // MR Metrics History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM mr_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),

      // Commit Metrics History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM commit_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),

      // SonarQube Reliability History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM sonarqube_reliability_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),

      // SonarQube Maintainability History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM sonarqube_maintainability_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),

      // SonarQube Security History
      pool.query(`
        SELECT DATE_TRUNC('minute', created_at) as created_at, health_score
        FROM sonarqube_security_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        ORDER BY created_at ASC
      `, [projectId]),
    ]);

    // Combine all histories into a unified timeline
    // Create separate entries for each timestamp to get vertical stacking
    const allEntries: any[] = [];
    const timestampMap = new Map<string, Set<string>>();

    const processHistory = (history: { rows: any[] }, metricName: string) => {
      history.rows.forEach((row: any) => {
        const timestamp = new Date(row.created_at).toISOString();
        
        // Track which timestamps we've seen
        if (!timestampMap.has(timestamp)) {
          timestampMap.set(timestamp, new Set());
        }
        timestampMap.get(timestamp)!.add(metricName);
        
        // Find existing entry for this timestamp or create new one
        let entry = allEntries.find(e => e.timestamp === timestamp);
        if (!entry) {
          entry = { timestamp, date: timestamp };
          allEntries.push(entry);
        }
        entry[metricName] = row.health_score ? parseFloat(row.health_score) : null;
      });
    };

    processHistory(issueHistory, 'issue_health');
    processHistory(mrHistory, 'mr_health');
    processHistory(commitHistory, 'commit_health');
    processHistory(reliabilityHistory, 'reliability_health');
    processHistory(maintainabilityHistory, 'maintainability_health');
    processHistory(securityHistory, 'security_health');

    // Sort by timestamp
    const combinedHistory = allEntries.sort((a, b) => 
      a.timestamp.localeCompare(b.timestamp)
    );

    res.json({
      success: true,
      data: combinedHistory,
    });
  } catch (error) {
    console.error('[HealthScoreController] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch health score history',
    });
  }
};

/**
 * Get latest health scores for all 6 metrics
 * GET /projects/:id/health-scores/latest
 */
export const getLatestHealthScores = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const pool = getPool();

    // Fetch latest health scores from all 6 history tables
    const [
      issueLatest,
      mrLatest,
      commitLatest,
      reliabilityLatest,
      maintainabilityLatest,
      securityLatest,
    ] = await Promise.all([
      pool.query(`
        SELECT health_score, created_at
        FROM issue_metrics_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),

      pool.query(`
        SELECT health_score, created_at
        FROM mr_metrics_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),

      pool.query(`
        SELECT health_score, created_at
        FROM commit_metrics_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),

      pool.query(`
        SELECT health_score, created_at
        FROM sonarqube_reliability_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),

      pool.query(`
        SELECT health_score, created_at
        FROM sonarqube_maintainability_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),

      pool.query(`
        SELECT health_score, created_at
        FROM sonarqube_security_history
        WHERE project_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [projectId]),
    ]);

    const latestScores = {
      issue_health: issueLatest.rows[0]?.health_score ? parseFloat(issueLatest.rows[0].health_score) : null,
      mr_health: mrLatest.rows[0]?.health_score ? parseFloat(mrLatest.rows[0].health_score) : null,
      commit_health: commitLatest.rows[0]?.health_score ? parseFloat(commitLatest.rows[0].health_score) : null,
      reliability_health: reliabilityLatest.rows[0]?.health_score ? parseFloat(reliabilityLatest.rows[0].health_score) : null,
      maintainability_health: maintainabilityLatest.rows[0]?.health_score ? parseFloat(maintainabilityLatest.rows[0].health_score) : null,
      security_health: securityLatest.rows[0]?.health_score ? parseFloat(securityLatest.rows[0].health_score) : null,
      created_at: issueLatest.rows[0]?.created_at || null,
    };

    res.json({
      success: true,
      data: latestScores,
    });
  } catch (error) {
    console.error('[HealthScoreController] Error fetching latest scores:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch latest health scores',
    });
  }
};
