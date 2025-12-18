// Milestone Metrics Database Service
// Handles saving and retrieving milestone metrics from the database

import { getPool } from '../../db/connection';
import { MilestoneMetrics } from '../../types/milestoneMetrics.types';

class MilestoneMetricsDbService {
  /**
   * Save milestone metrics to database
   */
  async saveMetrics(projectId: number, metrics: MilestoneMetrics): Promise<MilestoneMetrics> {
    const pool = getPool();
    console.log(`[MilestoneMetricsDb] Saving metrics for project ${projectId}`);

    const query = `
      INSERT INTO milestone_metrics (
        project_id,
        max_issues,
        min_issues,
        avg_issues,
        total_milestones,
        milestone_with_max_issues,
        milestone_with_min_issues,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const values = [
      projectId,
      metrics.max_issues,
      metrics.min_issues,
      metrics.avg_issues,
      metrics.total_milestones,
      metrics.milestone_with_max_issues,
      metrics.milestone_with_min_issues,
    ];

    const result = await pool.query(query, values);
    console.log(`[MilestoneMetricsDb] ✅ Metrics saved for project ${projectId}`);

    return result.rows[0];
  }

  /**
   * Get latest milestone metrics for a project (most recent calculation)
   */
  async getMetrics(projectId: number): Promise<MilestoneMetrics | null> {
    try {
      const pool = getPool();
      console.log(`[MilestoneMetricsDb] Fetching latest metrics for project ${projectId}`);

      const query = `
        SELECT * FROM milestone_metrics
        WHERE project_id = $1
        ORDER BY calculated_at DESC
        LIMIT 1;
      `;

      const result = await pool.query(query, [projectId]);
      
      if (result.rows.length === 0) {
        console.log(`[MilestoneMetricsDb] No metrics found for project ${projectId}`);
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('[MilestoneMetricsDb] Error getting metrics:', error);
      throw error;
    }
  }
}

export default new MilestoneMetricsDbService();
