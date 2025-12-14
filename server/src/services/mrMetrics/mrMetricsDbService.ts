// MR Metrics Database Service
// Handles storage and retrieval of MR metrics from PostgreSQL
// Follows the same pattern as issueMetricsDbService.ts

import { getPool } from '../../db/connection';
import { 
  MRHealthMetrics, 
  MRMetricsHistory, 
  MRWeekOverWeekComparison 
} from '../../types/mrMetrics.types';
import { calculateMRHealthScore } from '../../utils/healthScoreCalculator';

class MRMetricsDbService {

  /**
   * Save new MR metrics snapshot for a project (always insert, never update)
   */
  async saveMetrics(
    projectId: number,
    metrics: Omit<MRHealthMetrics, 'uuid' | 'row_id' | 'project_id' | 'calculated_at'>
  ): Promise<MRHealthMetrics> {
    try {
      const query = `
        INSERT INTO mr_health_metrics (
          uuid,
          project_id,
          total_open_mrs,
          total_merged_mrs,
          mrs_merged_last_7d,
          mrs_merged_last_30d,
          total_merge_time_hours,
          mrs_with_merge_time,
          avg_merge_time_hours,
          avg_merge_time_days,
          total_review_comments,
          mrs_checked_for_comments,
          avg_review_comments_per_mr,
          reverted_mrs_count,
          mrs_checked_for_reverts,
          revert_rate_percent,
          mrs_opened_last_7d,
          mrs_opened_last_30d,
          net_mr_change_7d,
          stale_mrs_count,
          stale_mrs_percent,
          total_reviewers_count,
          mrs_checked_for_reviewers,
          avg_reviewers_per_mr,
          closure_rate_percent,
          merge_velocity_alert_level,
          merge_time_alert_level,
          revert_rate_alert_level,
          stale_mrs_alert_level,
          calculated_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;

      const values = [
        projectId,
        metrics.total_open_mrs,
        metrics.total_merged_mrs,
        metrics.mrs_merged_last_7d,
        metrics.mrs_merged_last_30d,
        metrics.total_merge_time_hours,
        metrics.mrs_with_merge_time,
        metrics.avg_merge_time_hours,
        metrics.avg_merge_time_days,
        metrics.total_review_comments,
        metrics.mrs_checked_for_comments,
        metrics.avg_review_comments_per_mr,
        metrics.reverted_mrs_count,
        metrics.mrs_checked_for_reverts,
        metrics.revert_rate_percent,
        metrics.mrs_opened_last_7d,
        metrics.mrs_opened_last_30d,
        metrics.net_mr_change_7d,
        metrics.stale_mrs_count,
        metrics.stale_mrs_percent,
        metrics.total_reviewers_count,
        metrics.mrs_checked_for_reviewers,
        metrics.avg_reviewers_per_mr,
        metrics.closure_rate_percent,
        metrics.merge_velocity_alert_level,
        metrics.merge_time_alert_level,
        metrics.revert_rate_alert_level,
        metrics.stale_mrs_alert_level,
      ];

      const result = await getPool().query(query, values);
      console.log(`[MRMetricsDb] Saved metrics for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[MRMetricsDb] Error saving metrics:', error);
      throw error;
    }
  }

  /**
   * Save historical snapshot (for daily trend tracking)
   */
  async saveHistoricalSnapshot(projectId: number): Promise<MRMetricsHistory> {
    try {
      // Get current metrics
      const currentMetrics = await this.getMetrics(projectId);
      if (!currentMetrics) {
        throw new Error('No current metrics found to create snapshot');
      }

      // Calculate health score
      const healthScore = calculateMRHealthScore({
        avg_merge_time_days: currentMetrics.avg_merge_time_days,
        revert_rate_percent: currentMetrics.revert_rate_percent,
        mrs_merged_last_7d: currentMetrics.mrs_merged_last_7d,
        avg_review_comments_per_mr: currentMetrics.avg_review_comments_per_mr,
      });

      const query = `
        INSERT INTO mr_metrics_history (
          uuid,
          project_id,
          snapshot_date,
          total_open_mrs,
          total_merged_mrs,
          mrs_merged_last_7d,
          avg_merge_time_days,
          avg_review_comments_per_mr,
          revert_rate_percent,
          stale_mrs_count,
          avg_reviewers_per_mr,
          closure_rate_percent,
          mrs_merged_last_30d,
          mrs_opened_last_30d,
          health_score
        ) VALUES (
          gen_random_uuid(),
          $1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (project_id, snapshot_date)
        DO UPDATE SET
          total_open_mrs = EXCLUDED.total_open_mrs,
          total_merged_mrs = EXCLUDED.total_merged_mrs,
          mrs_merged_last_7d = EXCLUDED.mrs_merged_last_7d,
          avg_merge_time_days = EXCLUDED.avg_merge_time_days,
          avg_review_comments_per_mr = EXCLUDED.avg_review_comments_per_mr,
          revert_rate_percent = EXCLUDED.revert_rate_percent,
          stale_mrs_count = EXCLUDED.stale_mrs_count,
          avg_reviewers_per_mr = EXCLUDED.avg_reviewers_per_mr,
          closure_rate_percent = EXCLUDED.closure_rate_percent,
          mrs_merged_last_30d = EXCLUDED.mrs_merged_last_30d,
          mrs_opened_last_30d = EXCLUDED.mrs_opened_last_30d,
          health_score = EXCLUDED.health_score
        RETURNING *;
      `;

      const values = [
        projectId,
        currentMetrics.total_open_mrs,
        currentMetrics.total_merged_mrs,
        currentMetrics.mrs_merged_last_7d,
        currentMetrics.avg_merge_time_days,
        currentMetrics.avg_review_comments_per_mr,
        currentMetrics.revert_rate_percent,
        currentMetrics.stale_mrs_count,
        currentMetrics.avg_reviewers_per_mr,
        currentMetrics.closure_rate_percent,
        currentMetrics.mrs_merged_last_30d,
        currentMetrics.mrs_opened_last_30d,
        healthScore,
      ];

      const result = await getPool().query(query, values);
      console.log(`[MRMetricsDb] Saved historical snapshot for project ${projectId} with health score: ${healthScore}`);
      return result.rows[0];
    } catch (error) {
      console.error('[MRMetricsDb] Error saving historical snapshot:', error);
      throw error;
    }
  }

  /**
   * Get latest metrics for a project (most recent calculation)
   */
  async getMetrics(projectId: number): Promise<MRHealthMetrics | null> {
    try {
      const query = `
        SELECT * FROM mr_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[MRMetricsDb] Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics history for a project (last N days)
   */
  async getMetricsHistory(
    projectId: number,
    days: number = 30
  ): Promise<MRMetricsHistory[]> {
    try {
      const query = `
        SELECT * FROM mr_metrics_history
        WHERE project_id = $1
          AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY snapshot_date DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[MRMetricsDb] Error getting metrics history:', error);
      throw error;
    }
  }

  /**
   * Get week-over-week comparison
   */
  async getWeekOverWeekTrends(projectId: number): Promise<MRWeekOverWeekComparison | null> {
    try {
      // Get current metrics
      const current = await this.getMetrics(projectId);
      if (!current) {
        return null;
      }

      // Get metrics from 7 days ago
      const query = `
        SELECT * FROM mr_metrics_history
        WHERE project_id = $1
          AND snapshot_date = CURRENT_DATE - INTERVAL '7 days'
        ORDER BY snapshot_date DESC
        LIMIT 1;
      `;

      const result = await getPool().query(query, [projectId]);
      const previous = result.rows[0];

      if (!previous) {
        return {
          hasComparison: false,
          merge_velocity_change: null,
          merge_time_change: null,
          revert_rate_change: null,
          stale_mrs_change: null,
        };
      }

      return {
        hasComparison: true,
        merge_velocity_change: this.calculateChange(
          current.mrs_merged_last_7d,
          previous.mrs_merged_last_7d
        ),
        merge_time_change: this.calculateChange(
          current.avg_merge_time_days,
          previous.avg_merge_time_days
        ),
        revert_rate_change: this.calculateChange(
          current.revert_rate_percent,
          previous.revert_rate_percent
        ),
        stale_mrs_change: this.calculateChange(
          current.stale_mrs_count,
          previous.stale_mrs_count
        ),
      };
    } catch (error) {
      console.error('[MRMetricsDb] Error calculating trends:', error);
      throw error;
    }
  }

  /**
   * Calculate percentage change between two values
   */
  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  /**
   * Get ALL metrics snapshots for a project (complete history)
   */
  async getAllMetrics(projectId: number): Promise<MRHealthMetrics[]> {
    try {
      const query = `
        SELECT * FROM mr_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[MRMetricsDb] Error getting all metrics:', error);
      throw error;
    }
  }

  /**
   * Delete metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    try {
      await getPool().query('DELETE FROM mr_health_metrics WHERE project_id = $1', [
        projectId,
      ]);
      console.log(`[MRMetricsDb] Deleted metrics for project ${projectId}`);
    } catch (error) {
      console.error('[MRMetricsDb] Error deleting metrics:', error);
      throw error;
    }
  }
}

export default new MRMetricsDbService();
