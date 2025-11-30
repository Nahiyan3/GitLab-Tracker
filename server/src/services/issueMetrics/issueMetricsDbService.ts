// Issue Metrics Database Service
// Handles storage and retrieval of issue metrics from PostgreSQL

import { getPool } from '../../db/connection';
import { 
  IssueHealthMetrics, 
  IssueMetricsHistory, 
  WeekOverWeekComparison 
} from '../../types/issueMetrics.types';

class IssueMetricsDbService {

  /**
   * Save new issue metrics snapshot for a project (always insert, never update)
   */
  async saveMetrics(
    projectId: number,
    metrics: Omit<IssueHealthMetrics, 'uuid' | 'row_id' | 'project_id' | 'calculated_at'>
  ): Promise<IssueHealthMetrics> {
    try {
      const query = `
        INSERT INTO issue_health_metrics (
          uuid,
          project_id,
          total_open_issues,
          total_closed_issues,
          issues_closed_last_7d,
          issues_closed_last_30d,
          total_resolution_hours,
          issues_with_resolution_time,
          avg_cycle_time_hours,
          avg_cycle_time_days,
          issues_reopened_count,
          issues_checked_for_reopens,
          reopen_rate_percent,
          bug_issues_count,
          feature_issues_count,
          bug_ratio_percent,
          issues_opened_last_7d,
          issues_opened_last_30d,
          net_issue_change_7d,
          stale_issues_count,
          stale_issues_percent,
          critical_issues_open,
          blocker_issues_open,
          critical_avg_resolution_hours,
          issues_with_mr_links,
          total_closed_issues_checked,
          issue_mr_link_rate_percent,
          closure_rate_percent,
          velocity_alert_level,
          cycle_time_alert_level,
          reopen_rate_alert_level,
          bug_ratio_alert_level,
          calculated_at
        ) VALUES (
          gen_random_uuid(),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
          CURRENT_TIMESTAMP
        )
        RETURNING *;
      `;

      const values = [
        projectId,
        metrics.total_open_issues,
        metrics.total_closed_issues,
        metrics.issues_closed_last_7d,
        metrics.issues_closed_last_30d,
        metrics.total_resolution_hours,
        metrics.issues_with_resolution_time,
        metrics.avg_cycle_time_hours,
        metrics.avg_cycle_time_days,
        metrics.issues_reopened_count,
        metrics.issues_checked_for_reopens,
        metrics.reopen_rate_percent,
        metrics.bug_issues_count,
        metrics.feature_issues_count,
        metrics.bug_ratio_percent,
        metrics.issues_opened_last_7d,
        metrics.issues_opened_last_30d,
        metrics.net_issue_change_7d,
        metrics.stale_issues_count,
        metrics.stale_issues_percent,
        metrics.critical_issues_open,
        metrics.blocker_issues_open,
        metrics.critical_avg_resolution_hours,
        metrics.issues_with_mr_links,
        metrics.total_closed_issues_checked,
        metrics.issue_mr_link_rate_percent,
        metrics.closure_rate_percent,
        metrics.velocity_alert_level,
        metrics.cycle_time_alert_level,
        metrics.reopen_rate_alert_level,
        metrics.bug_ratio_alert_level,
      ];

      const result = await getPool().query(query, values);
      console.log(`[IssueMetricsDb] Saved metrics for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[IssueMetricsDb] Error saving metrics:', error);
      throw error;
    }
  }

  /**
   * Save historical snapshot
   */
  async saveHistoricalSnapshot(projectId: number): Promise<IssueMetricsHistory> {
    try {
      // Get current metrics
      const currentMetrics = await this.getMetrics(projectId);
      if (!currentMetrics) {
        throw new Error(`No metrics found for project ${projectId}`);
      }

      const query = `
        INSERT INTO issue_metrics_history (
          uuid,
          project_id,
          snapshot_date,
          total_open_issues,
          total_closed_issues,
          issues_closed_last_7d,
          avg_cycle_time_days,
          reopen_rate_percent,
          bug_ratio_percent,
          stale_issues_count,
          critical_issues_open,
          closure_rate_percent,
          issues_closed_last_30d,
          issues_opened_last_30d
        ) VALUES (
          gen_random_uuid(),
          $1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (project_id, snapshot_date)
        DO UPDATE SET
          total_open_issues = EXCLUDED.total_open_issues,
          total_closed_issues = EXCLUDED.total_closed_issues,
          issues_closed_last_7d = EXCLUDED.issues_closed_last_7d,
          avg_cycle_time_days = EXCLUDED.avg_cycle_time_days,
          reopen_rate_percent = EXCLUDED.reopen_rate_percent,
          bug_ratio_percent = EXCLUDED.bug_ratio_percent,
          stale_issues_count = EXCLUDED.stale_issues_count,
          critical_issues_open = EXCLUDED.critical_issues_open,
          closure_rate_percent = EXCLUDED.closure_rate_percent,
          issues_closed_last_30d = EXCLUDED.issues_closed_last_30d,
          issues_opened_last_30d = EXCLUDED.issues_opened_last_30d
        RETURNING *;
      `;

      const values = [
        projectId,
        currentMetrics.total_open_issues,
        currentMetrics.total_closed_issues,
        currentMetrics.issues_closed_last_7d,
        currentMetrics.avg_cycle_time_days,
        currentMetrics.reopen_rate_percent,
        currentMetrics.bug_ratio_percent,
        currentMetrics.stale_issues_count,
        currentMetrics.critical_issues_open,
        currentMetrics.closure_rate_percent,
        currentMetrics.issues_closed_last_30d,
        currentMetrics.issues_opened_last_30d,
      ];

      const result = await getPool().query(query, values);
      console.log(`[IssueMetricsDb] Saved historical snapshot for project ${projectId}`);
      return result.rows[0];
    } catch (error) {
      console.error('[IssueMetricsDb] Error saving historical snapshot:', error);
      throw error;
    }
  }

  /**
   * Get latest metrics for a project (most recent calculation)
   */
  async getMetrics(projectId: number): Promise<IssueHealthMetrics | null> {
    try {
      const query = `
        SELECT * FROM issue_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('[IssueMetricsDb] Error getting metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics history for a project
   */
  async getMetricsHistory(
    projectId: number,
    days: number = 30
  ): Promise<IssueMetricsHistory[]> {
    try {
      const query = `
        SELECT * FROM issue_metrics_history
        WHERE project_id = $1
          AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY snapshot_date DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[IssueMetricsDb] Error getting metrics history:', error);
      throw error;
    }
  }

  /**
   * Get week-over-week comparison
   */
  async getWeekOverWeekTrends(projectId: number): Promise<WeekOverWeekComparison | null> {
    try {
      // Get current metrics
      const current = await this.getMetrics(projectId);
      if (!current) {
        return null;
      }

      // Get metrics from 7 days ago
      const query = `
        SELECT * FROM issue_metrics_history
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
          velocity_change: null,
          cycle_time_change: null,
          reopen_rate_change: null,
          bug_ratio_change: null,
          stale_issues_change: null,
          critical_issues_change: null,
        };
      }

      return {
        hasComparison: true,
        velocity_change: this.calculateChange(
          current.issues_closed_last_7d,
          previous.issues_closed_last_7d
        ),
        cycle_time_change: this.calculateChange(
          current.avg_cycle_time_days,
          previous.avg_cycle_time_days
        ),
        reopen_rate_change: this.calculateChange(
          current.reopen_rate_percent,
          previous.reopen_rate_percent
        ),
        bug_ratio_change: this.calculateChange(
          current.bug_ratio_percent,
          previous.bug_ratio_percent
        ),
        stale_issues_change: this.calculateChange(
          current.stale_issues_count,
          previous.stale_issues_count
        ),
        critical_issues_change: this.calculateChange(
          current.critical_issues_open,
          previous.critical_issues_open
        ),
      };
    } catch (error) {
      console.error('[IssueMetricsDb] Error calculating trends:', error);
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
  async getAllMetrics(projectId: number): Promise<IssueHealthMetrics[]> {
    try {
      const query = `
        SELECT * FROM issue_health_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC;
      `;

      const result = await getPool().query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('[IssueMetricsDb] Error getting all metrics:', error);
      throw error;
    }
  }

  /**
   * Delete metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    try {
      await getPool().query('DELETE FROM issue_health_metrics WHERE project_id = $1', [
        projectId,
      ]);
      console.log(`[IssueMetricsDb] Deleted metrics for project ${projectId}`);
    } catch (error) {
      console.error('[IssueMetricsDb] Error deleting metrics:', error);
      throw error;
    }
  }
}

export default new IssueMetricsDbService();
