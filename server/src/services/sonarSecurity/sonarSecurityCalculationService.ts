import { SonarQubeSecurityCalculationResult } from '../../types/sonarQubeMetrics.types';

export class SonarSecurityCalculationService {
  
  /**
   * Calculate security metrics from SonarQube API responses
   */
  calculateMetrics(
    component: { key: string; name: string; qualifier: string; measures: any[] }
  ): SonarQubeSecurityCalculationResult {
    const measures = component.measures || [];
    
    // Helper to find metric value (handles both direct value and period.value)
    const findMetric = (key: string): number => {
      const measure = measures.find(m => m.metric === key);
      if (!measure) return 0;
      
      // Check for direct value first
      if (measure.value !== undefined) {
        return parseFloat(measure.value) || 0;
      }
      
      // Check for period value (for "new" metrics)
      if (measure.period?.value !== undefined) {
        return parseFloat(measure.period.value) || 0;
      }
      
      return 0;
    };

    // Get security rating (1-5) and convert to letter (A-E)
    const securityRatingValue = findMetric('security_rating');
    const security_rating = this.getRatingLetter(securityRatingValue);

    // Get security review rating (1-5) and convert to letter (A-E)
    const securityReviewRatingValue = findMetric('security_review_rating');
    const security_review_rating = this.getRatingLetter(securityReviewRatingValue);

    const result = {
      vulnerabilities_total: findMetric('vulnerabilities'),
      vulnerabilities_new: findMetric('new_vulnerabilities'),
      security_rating,
      security_hotspots_total: findMetric('security_hotspots'),
      security_hotspots_reviewed: findMetric('security_hotspots_reviewed'),
      security_review_rating,
      security_remediation_effort: findMetric('security_remediation_effort')
    };

    console.log('📊 Calculated security metrics:', result);

    return result;
  }

  /**
   * Convert SonarQube rating (1-5) to letter grade (A-E)
   */
  private getRatingLetter(rating: number): string {
    if (rating <= 1) return 'A';
    if (rating <= 2) return 'B';
    if (rating <= 3) return 'C';
    if (rating <= 4) return 'D';
    return 'E';
  }
}
