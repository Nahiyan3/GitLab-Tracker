import { getPool } from '../../db/connection';
import {
  SonarQubeReliabilityMetrics,
  SonarQubeReliabilityHistory,
  SonarQubeReliabilityCalculationResult
} from '../../types/sonarQubeMetrics.types';
import { calculateReliabilityHealthScore } from '../../utils/healthScoreCalculator';

export class SonarReliabilityDbService {
  
  /**
   * Save reliability metrics to database
   */
  async saveMetrics(
    projectId: number,
    metrics: SonarQubeReliabilityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Get reliability_rating_value from rating letter
    const ratingValue = this.getRatingValue(metrics.reliability_rating);
    
    const query = `
      INSERT INTO sonarqube_reliability_metrics (
        project_id,
        bugs_total,
        bugs_critical,
        bugs_blocker,
        bugs_new,
        reliability_rating,
        reliability_rating_value,
        reliability_remediation_effort,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    const values = [
      projectId,
      metrics.bugs_total,
      metrics.bugs_critical,
      metrics.bugs_blocker,
      metrics.bugs_new,
      metrics.reliability_rating,
      ratingValue,
      metrics.reliability_remediation_effort
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved reliability metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to save reliability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Save historical snapshot (one per day per project)
   */
  async saveHistoricalSnapshot(
    projectId: number,
    metrics: SonarQubeReliabilityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Calculate health score
    const healthScore = calculateReliabilityHealthScore({
      reliability_rating: metrics.reliability_rating,
      bugs_total: metrics.bugs_total,
    });
    
    const query = `
      INSERT INTO sonarqube_reliability_history (
        project_id,
        bugs_total,
        reliability_rating,
        health_score,
        snapshot_date
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE)
      ON CONFLICT (project_id, snapshot_date)
      DO UPDATE SET
        bugs_total = EXCLUDED.bugs_total,
        reliability_rating = EXCLUDED.reliability_rating,
        health_score = EXCLUDED.health_score
    `;

    const values = [
      projectId,
      metrics.bugs_total,
      metrics.reliability_rating,
      healthScore
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved reliability historical snapshot for project ${projectId} with health score: ${healthScore}`);
    } catch (error: any) {
      console.error(`❌ Failed to save reliability historical snapshot for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest reliability metrics for a project
   */
  async getMetrics(projectId: number): Promise<SonarQubeReliabilityMetrics | null> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_reliability_metrics
      WHERE project_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      console.error(`❌ Failed to get reliability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get reliability metrics history
   */
  async getMetricsHistory(projectId: number, days: number = 30): Promise<SonarQubeReliabilityHistory[]> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_reliability_history
      WHERE project_id = $1
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY snapshot_date DESC
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error: any) {
      console.error(`❌ Failed to get reliability metrics history for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete all metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    const pool = getPool();
    
    try {
      await pool.query('DELETE FROM sonarqube_reliability_metrics WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM sonarqube_reliability_history WHERE project_id = $1', [projectId]);
      console.log(`✅ Deleted all reliability metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete reliability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Convert rating letter to numeric value
   */
  private getRatingValue(rating: string): number {
    const map: { [key: string]: number } = {
      'A': 1,
      'B': 2,
      'C': 3,
      'D': 4,
      'E': 5
    };
    return map[rating] || 1;
  }
}
