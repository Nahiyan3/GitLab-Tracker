import { SonarQubeReliabilityCalculationResult } from '../../types/sonarQubeMetrics.types';

export class SonarReliabilityCalculationService {
  
  /**
   * Calculate reliability metrics from SonarQube API responses
   */
  calculateMetrics(
    component: { key: string; name: string; qualifier: string; measures: any[] },
    criticalCount: number,
    blockerCount: number
  ): SonarQubeReliabilityCalculationResult {
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

    // Get reliability rating (1-5) and convert to letter (A-E)
    const ratingValue = findMetric('reliability_rating');
    const reliability_rating = this.getRatingLetter(ratingValue);

    const result = {
      bugs_total: findMetric('bugs'),
      bugs_critical: criticalCount,
      bugs_blocker: blockerCount,
      bugs_new: findMetric('new_bugs'),
      reliability_rating,
      reliability_remediation_effort: findMetric('reliability_remediation_effort')
    };

    console.log('📊 Calculated reliability metrics:', result);

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
