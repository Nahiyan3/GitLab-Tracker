import { getPool } from '../../db/connection';
import {
  SonarQubeMaintainabilityMetrics,
  SonarQubeMaintainabilityHistory,
  SonarQubeMaintainabilityCalculationResult
} from '../../types/sonarQubeMetrics.types';
import { calculateMaintainabilityHealthScore } from '../../utils/healthScoreCalculator';

export class SonarMaintainabilityDbService {
  
  /**
   * Save maintainability metrics to database
   */
  async saveMetrics(
    projectId: number,
    metrics: SonarQubeMaintainabilityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Get maintainability_rating_value from rating letter
    const ratingValue = this.getRatingValue(metrics.maintainability_rating);
    
    const query = `
      INSERT INTO sonarqube_maintainability_metrics (
        project_id,
        maintainability_high,
        maintainability_blocker,
        technical_debt_ratio,
        maintainability_rating,
        maintainability_rating_value,
        code_smells_total,
        code_smells_new,
        cyclomatic_complexity,
        cognitive_complexity,
        duplicated_code_percentage,
        duplicated_lines_new,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    `;

    const values = [
      projectId,
      metrics.maintainability_high,
      metrics.maintainability_blocker,
      metrics.technical_debt_ratio,
      metrics.maintainability_rating,
      ratingValue,
      metrics.code_smells_total,
      metrics.code_smells_new,
      metrics.cyclomatic_complexity,
      metrics.cognitive_complexity,
      metrics.duplicated_code_percentage,
      metrics.duplicated_lines_new
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved maintainability metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to save maintainability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Save historical snapshot (one per day per project)
   */
  async saveHistoricalSnapshot(
    projectId: number,
    metrics: SonarQubeMaintainabilityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Calculate health score
    const healthScore = calculateMaintainabilityHealthScore({
      maintainability_rating: metrics.maintainability_rating,
      technical_debt_ratio: metrics.technical_debt_ratio,
      code_smells_total: metrics.code_smells_total,
      duplicated_code_percentage: metrics.duplicated_code_percentage,
    });
    
    const query = `
      INSERT INTO sonarqube_maintainability_history (
        project_id,
        maintainability_high,
        maintainability_blocker,
        technical_debt_ratio,
        maintainability_rating,
        code_smells_total,
        duplicated_code_percentage,
        health_score,
        snapshot_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
      ON CONFLICT (project_id, snapshot_date)
      DO UPDATE SET
        maintainability_high = EXCLUDED.maintainability_high,
        maintainability_blocker = EXCLUDED.maintainability_blocker,
        technical_debt_ratio = EXCLUDED.technical_debt_ratio,
        maintainability_rating = EXCLUDED.maintainability_rating,
        code_smells_total = EXCLUDED.code_smells_total,
        duplicated_code_percentage = EXCLUDED.duplicated_code_percentage,
        health_score = EXCLUDED.health_score
    `;

    const values = [
      projectId,
      metrics.maintainability_high,
      metrics.maintainability_blocker,
      metrics.technical_debt_ratio,
      metrics.maintainability_rating,
      metrics.code_smells_total,
      metrics.duplicated_code_percentage,
      healthScore
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved maintainability historical snapshot for project ${projectId} with health score: ${healthScore}`);
    } catch (error: any) {
      console.error(`❌ Failed to save maintainability historical snapshot for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest maintainability metrics for a project
   */
  async getMetrics(projectId: number): Promise<SonarQubeMaintainabilityMetrics | null> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_maintainability_metrics
      WHERE project_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      console.error(`❌ Failed to get maintainability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get maintainability metrics history
   */
  async getMetricsHistory(projectId: number, days: number = 30): Promise<SonarQubeMaintainabilityHistory[]> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_maintainability_history
      WHERE project_id = $1
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY snapshot_date DESC
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error: any) {
      console.error(`❌ Failed to get maintainability metrics history for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all metrics for a project (complete history)
   */
  async getAllMetrics(projectId: number): Promise<SonarQubeMaintainabilityMetrics[]> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_maintainability_metrics
      WHERE project_id = $1
      ORDER BY calculated_at DESC
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error: any) {
      console.error(`❌ Failed to get all maintainability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete all metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    const pool = getPool();
    
    try {
      await pool.query('DELETE FROM sonarqube_maintainability_metrics WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM sonarqube_maintainability_history WHERE project_id = $1', [projectId]);
      console.log(`✅ Deleted all maintainability metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete maintainability metrics for project ${projectId}:`, error.message);
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
