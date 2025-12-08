import { 
  SonarQubeComponentMeasures, 
  SonarQubeMaintainabilityCalculationResult 
} from '../../types/sonarQubeMetrics.types';

export class SonarMaintainabilityCalculationService {
  
  /**
   * Calculate maintainability metrics from SonarQube API responses
   */
  calculateMetrics(
    component: { key: string; name: string; qualifier: string; measures: any[] },
    highCount: number,
    blockerCount: number
  ): SonarQubeMaintainabilityCalculationResult {
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

    // Get maintainability rating (1-5) and convert to letter (A-E)
    const ratingValue = findMetric('sqale_rating');
    const maintainability_rating = this.getRatingLetter(ratingValue);

    const result = {
      maintainability_high: highCount,
      maintainability_blocker: blockerCount,
      technical_debt_ratio: findMetric('sqale_debt_ratio'),
      maintainability_rating,
      code_smells_total: findMetric('code_smells'),
      code_smells_new: findMetric('new_code_smells'),
      cyclomatic_complexity: findMetric('complexity'),
      cognitive_complexity: findMetric('cognitive_complexity'),
      duplicated_code_percentage: findMetric('duplicated_lines_density'),
      duplicated_lines_new: findMetric('new_duplicated_lines_density')
    };

    console.log('📊 Calculated metrics (detailed):', result);

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
