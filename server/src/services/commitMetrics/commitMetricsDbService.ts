// Commit Metrics Database Service
// Handles all database operations for commit metrics
// Follows the same pattern as issueMetricsDbService.ts and mrMetricsDbService.ts

import { getPool } from '../../db/connection';
import { CommitHealthMetrics, CommitMetricsHistory, CommitMetricsCalculationResult } from '../../types/commitMetrics.types';
import { calculateCommitHealthScore } from '../../utils/healthScoreCalculator';

class CommitMetricsDbService {

  /**
   * Save commit metrics to database (INSERT only, no updates)
   */
  async saveMetrics(
    projectId: number,
    metrics: CommitMetricsCalculationResult
  ): Promise<CommitHealthMetrics> {
    try {
      const query = `
        INSERT INTO commit_health_metrics (
          uuid,
          project_id,
          total_commits_last_7d,
          total_lines_changed,
          commits_analyzed,
          avg_commit_size,
          total_lines_added,
          total_lines_deleted,
          lines_added_deleted_ratio,
          commits_per_week,
          total_contributors,
          contributors_above_50_percent,
          bus_factor,
          commit_details,
          calculated_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;

      const values = [
        projectId,
        metrics.total_commits_last_7d,
        metrics.total_lines_changed,
        metrics.commits_analyzed,
        metrics.avg_commit_size,
        metrics.total_lines_added,
        metrics.total_lines_deleted,
        metrics.lines_added_deleted_ratio,
        metrics.commits_per_week,
        metrics.total_contributors,
        metrics.contributors_above_50_percent,
        metrics.bus_factor,
        JSON.stringify(metrics.commit_details),
      ];

      const result = await getPool().query(query, values);
      console.log(`[CommitMetricsDb] Saved metrics for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[CommitMetricsDb] Error saving metrics:', error);
      throw error;
    }
  }

  /**
   * Save historical snapshot (for daily trend tracking)
   */
  async saveHistoricalSnapshot(projectId: number): Promise<CommitMetricsHistory> {
    try {
      // Get current metrics
      const currentMetrics = await this.getMetrics(projectId);
      if (!currentMetrics) {
        throw new Error('No current metrics found to create snapshot');
      }

      // Calculate health score
      const healthScore = calculateCommitHealthScore({
        total_commits_last_7d: currentMetrics.total_commits_last_7d,
        avg_commit_size: currentMetrics.avg_commit_size,
        bus_factor: currentMetrics.bus_factor,
      });

      const query = `
        INSERT INTO commit_metrics_history (
          uuid,
          project_id,
          snapshot_date,
          total_commits_last_7d,
          avg_commit_size,
          total_lines_added,
          total_lines_deleted,
          bus_factor,
          health_score
        ) VALUES (
          gen_random_uuid(),
          $1, CURRENT_DATE, $2, $3, $4, $5, $6, $7
        )
        ON CONFLICT (project_id, snapshot_date)
        DO UPDATE SET
          total_commits_last_7d = EXCLUDED.total_commits_last_7d,
          avg_commit_size = EXCLUDED.avg_commit_size,
          total_lines_added = EXCLUDED.total_lines_added,
          total_lines_deleted = EXCLUDED.total_lines_deleted,
          bus_factor = EXCLUDED.bus_factor,
          health_score = EXCLUDED.health_score
        RETURNING *;
      `;

      const values = [
        projectId,
        currentMetrics.total_commits_last_7d,
        currentMetrics.avg_commit_size,
        currentMetrics.total_lines_added,
        currentMetrics.total_lines_deleted,
        currentMetrics.bus_factor,
        healthScore,
      ];

      const result = await getPool().query(query, values);
      console.log(`[CommitMetricsDb] Saved historical snapshot for project ${projectId} with health score: ${healthScore}`);
      return result.rows[0];
    } catch (error) {
      console.error('[CommitMetricsDb] Error saving historical snapshot:', error);
      throw error;
    }
  }

  /**
   * Get latest metrics for a project (most recent calculation)
   */
  async getMetrics(projectId: number): Promise<CommitHealthMetrics | null> {
    try {
      const query = `
        SELECT * FROM commit_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[CommitMetricsDb] Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get all metrics for a project (complete history)
   */
  async getAllMetrics(projectId: number): Promise<CommitHealthMetrics[]> {
    try {
      const query = `
        SELECT * FROM commit_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[CommitMetricsDb] Error getting all metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics history for a project (daily snapshots)
   */
  async getMetricsHistory(
    projectId: number,
    days: number = 30
  ): Promise<CommitMetricsHistory[]> {
    try {
      const query = `
        SELECT * FROM commit_metrics_history
        WHERE project_id = $1
          AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY snapshot_date DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[CommitMetricsDb] Error getting metrics history:', error);
      throw error;
    }
  }

  /**
   * Delete metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    try {
      await getPool().query('DELETE FROM commit_health_metrics WHERE project_id = $1', [
        projectId,
      ]);
      await getPool().query('DELETE FROM commit_metrics_history WHERE project_id = $1', [
        projectId,
      ]);
      console.log(`[CommitMetricsDb] Deleted all metrics for project ${projectId}`);
    } catch (error) {
      console.error('[CommitMetricsDb] Error deleting metrics:', error);
      throw error;
    }
  }
}

export default new CommitMetricsDbService();
