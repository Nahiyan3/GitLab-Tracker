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

    // Fetch health scores from all 6 history tables, grouped by day
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
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM issue_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),

      // MR Metrics History
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM mr_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),

      // Commit Metrics History
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM commit_metrics_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),

      // SonarQube Reliability History
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM sonarqube_reliability_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),

      // SonarQube Maintainability History
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM sonarqube_maintainability_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),

      // SonarQube Security History
      pool.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') as date,
          AVG(health_score) as health_score
        FROM sonarqube_security_history
        WHERE project_id = $1
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '${days} days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY DATE_TRUNC('day', created_at) ASC
      `, [projectId]),
    ]);

    // Collect all unique dates from all metrics
    const allDates = new Set<string>();
    const addDates = (history: { rows: any[] }) => {
      history.rows.forEach((row: any) => {
        allDates.add(row.date);
      });
    };

    addDates(issueHistory);
    addDates(mrHistory);
    addDates(commitHistory);
    addDates(reliabilityHistory);
    addDates(maintainabilityHistory);
    addDates(securityHistory);

    // Create a map for quick lookup
    const createDateMap = (history: { rows: any[] }) => {
      const map = new Map<string, number | null>();
      history.rows.forEach((row: any) => {
        map.set(row.date, row.health_score ? parseFloat(row.health_score) : null);
      });
      return map;
    };

    const issueMap = createDateMap(issueHistory);
    const mrMap = createDateMap(mrHistory);
    const commitMap = createDateMap(commitHistory);
    const reliabilityMap = createDateMap(reliabilityHistory);
    const maintainabilityMap = createDateMap(maintainabilityHistory);
    const securityMap = createDateMap(securityHistory);

    // Build aligned data points - each date has all 6 metrics
    const combinedHistory = Array.from(allDates)
      .sort()
      .map(date => ({
        timestamp: date,
        date: date,
        issue_health: issueMap.get(date) ?? null,
        mr_health: mrMap.get(date) ?? null,
        commit_health: commitMap.get(date) ?? null,
        reliability_health: reliabilityMap.get(date) ?? null,
        maintainability_health: maintainabilityMap.get(date) ?? null,
        security_health: securityMap.get(date) ?? null,
      }));

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
