import { getPool } from '../../db/connection';
import {
  SonarQubeSecurityMetrics,
  SonarQubeSecurityHistory,
  SonarQubeSecurityCalculationResult
} from '../../types/sonarQubeMetrics.types';
import { calculateSecurityHealthScore } from '../../utils/healthScoreCalculator';

export class SonarSecurityDbService {
  
  /**
   * Save security metrics to database
   */
  async saveMetrics(
    projectId: number,
    metrics: SonarQubeSecurityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Get rating values from rating letters
    const securityRatingValue = this.getRatingValue(metrics.security_rating);
    const securityReviewRatingValue = this.getRatingValue(metrics.security_review_rating);
    
    const query = `
      INSERT INTO sonarqube_security_metrics (
        project_id,
        vulnerabilities_total,
        vulnerabilities_new,
        security_rating,
        security_rating_value,
        security_hotspots_total,
        security_hotspots_reviewed,
        security_review_rating,
        security_review_rating_value,
        security_remediation_effort,
        calculated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
    `;

    const values = [
      projectId,
      metrics.vulnerabilities_total,
      metrics.vulnerabilities_new,
      metrics.security_rating,
      securityRatingValue,
      metrics.security_hotspots_total,
      metrics.security_hotspots_reviewed,
      metrics.security_review_rating,
      securityReviewRatingValue,
      metrics.security_remediation_effort
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved security metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to save security metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Save historical snapshot (one per day per project)
   */
  async saveHistoricalSnapshot(
    projectId: number,
    metrics: SonarQubeSecurityCalculationResult
  ): Promise<void> {
    const pool = getPool();
    
    // Calculate health score
    const healthScore = calculateSecurityHealthScore({
      security_rating: metrics.security_rating,
      vulnerabilities_total: metrics.vulnerabilities_total,
      security_hotspots_total: metrics.security_hotspots_total,
    });
    
    const query = `
      INSERT INTO sonarqube_security_history (
        project_id,
        vulnerabilities_total,
        security_rating,
        security_hotspots_total,
        health_score,
        snapshot_date,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIMESTAMP)
    `;

    const values = [
      projectId,
      metrics.vulnerabilities_total,
      metrics.security_rating,
      metrics.security_hotspots_total,
      healthScore
    ];

    try {
      await pool.query(query, values);
      console.log(`✅ Saved security historical snapshot for project ${projectId} with health score: ${healthScore}`);
    } catch (error: any) {
      console.error(`❌ Failed to save security historical snapshot for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest security metrics for a project
   */
  async getMetrics(projectId: number): Promise<SonarQubeSecurityMetrics | null> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_security_metrics
      WHERE project_id = $1
      ORDER BY calculated_at DESC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error: any) {
      console.error(`❌ Failed to get security metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get security metrics history
   */
  async getMetricsHistory(projectId: number, days: number = 30): Promise<SonarQubeSecurityHistory[]> {
    const pool = getPool();
    
    const query = `
      SELECT * FROM sonarqube_security_history
      WHERE project_id = $1
        AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY snapshot_date DESC
    `;

    try {
      const result = await pool.query(query, [projectId]);
      return result.rows;
    } catch (error: any) {
      console.error(`❌ Failed to get security metrics history for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete all metrics for a project
   */
  async deleteMetrics(projectId: number): Promise<void> {
    const pool = getPool();
    
    try {
      await pool.query('DELETE FROM sonarqube_security_metrics WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM sonarqube_security_history WHERE project_id = $1', [projectId]);
      console.log(`✅ Deleted all security metrics for project ${projectId}`);
    } catch (error: any) {
      console.error(`❌ Failed to delete security metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Convert rating letter (A-E) to value (1-5)
   */
  private getRatingValue(rating: string): number {
    switch (rating) {
      case 'A': return 1;
      case 'B': return 2;
      case 'C': return 3;
      case 'D': return 4;
      case 'E': return 5;
      default: return 5;
    }
  }
}
