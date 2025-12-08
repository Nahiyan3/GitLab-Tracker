import { SonarMaintainabilityApiService } from './sonarMaintainabilityApiService';
import { SonarMaintainabilityCalculationService } from './sonarMaintainabilityCalculationService';
import { SonarMaintainabilityDbService } from './sonarMaintainabilityDbService';
import { getSonarProjectKey } from '../sonarqube/autoMapSonarProjectKeys';

export class SonarMaintainabilitySyncService {
  private apiService: SonarMaintainabilityApiService;
  private calculationService: SonarMaintainabilityCalculationService;
  private dbService: SonarMaintainabilityDbService;

  constructor() {
    this.apiService = new SonarMaintainabilityApiService();
    this.calculationService = new SonarMaintainabilityCalculationService();
    this.dbService = new SonarMaintainabilityDbService();
  }

  /**
   * Sync maintainability metrics for a project
   */
  async syncMaintainabilityMetrics(projectId: number): Promise<void> {
    console.log(`\n🔄 Starting maintainability metrics sync for project ${projectId}`);

    try {
      // Step 1: Get SonarQube project key
      const sonarProjectKey = await getSonarProjectKey(projectId);
      if (!sonarProjectKey) {
        throw new Error(`No SonarQube project key found for project ${projectId}`);
      }

      console.log(`📌 SonarQube project key: ${sonarProjectKey}`);

      // Step 1.5: Fetch New Code Period definition
      const newCodePeriod = await this.apiService.getNewCodePeriod(sonarProjectKey);

      // Step 2: Fetch data from SonarQube API
      const sonarData = await this.fetchSonarQubeData(sonarProjectKey);

      // Step 3: Calculate metrics
      const metrics = this.calculationService.calculateMetrics(
        sonarData.measures,
        sonarData.highCount,
        sonarData.blockerCount
      );

      console.log(`📊 Calculated metrics:`, {
        maintainability_high: metrics.maintainability_high,
        maintainability_blocker: metrics.maintainability_blocker,
        technical_debt_ratio: metrics.technical_debt_ratio,
        maintainability_rating: metrics.maintainability_rating,
        code_smells_total: metrics.code_smells_total,
        code_smells_new: metrics.code_smells_new
      });

      // Step 4: Save to database
      await this.dbService.saveMetrics(projectId, metrics);

      // Step 5: Save historical snapshot
      await this.dbService.saveHistoricalSnapshot(projectId, metrics);

      console.log(`✅ Successfully synced maintainability metrics for project ${projectId}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to sync maintainability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch all required data from SonarQube API
   */
  private async fetchSonarQubeData(projectKey: string) {
    // Fetch measures (technical debt, complexity, duplication, etc.)
    const measuresResponse = await this.apiService.getMaintainabilityMetrics(projectKey);

    // Fetch issue counts for HIGH and BLOCKER code smells
    const highCount = await this.apiService.getIssueCount(projectKey, 'CODE_SMELL', 'CRITICAL');
    const blockerCount = await this.apiService.getIssueCount(projectKey, 'CODE_SMELL', 'BLOCKER');

    console.log('🔍 Measures response structure:', {
      hasComponent: !!measuresResponse.component,
      hasMeasures: !!measuresResponse.component?.measures,
      measuresCount: measuresResponse.component?.measures?.length || 0
    });

    return {
      measures: measuresResponse.component,
      highCount,
      blockerCount
    };
  }
}
