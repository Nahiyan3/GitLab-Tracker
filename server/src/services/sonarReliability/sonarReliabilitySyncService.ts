import { SonarReliabilityApiService } from './sonarReliabilityApiService';
import { SonarReliabilityCalculationService } from './sonarReliabilityCalculationService';
import { SonarReliabilityDbService } from './sonarReliabilityDbService';
import { getSonarProjectKey } from '../sonarqube/autoMapSonarProjectKeys';

export class SonarReliabilitySyncService {
  private apiService: SonarReliabilityApiService;
  private calculationService: SonarReliabilityCalculationService;
  private dbService: SonarReliabilityDbService;

  constructor() {
    this.apiService = new SonarReliabilityApiService();
    this.calculationService = new SonarReliabilityCalculationService();
    this.dbService = new SonarReliabilityDbService();
  }

  /**
   * Sync reliability metrics for a project
   */
  async syncReliabilityMetrics(projectId: number): Promise<void> {
    console.log(`\n🔄 Starting reliability metrics sync for project ${projectId}`);

    try {
      // Step 1: Get SonarQube project key
      const sonarProjectKey = await getSonarProjectKey(projectId);
      if (!sonarProjectKey) {
        throw new Error(`No SonarQube project key found for project ${projectId}`);
      }

      console.log(`📌 SonarQube project key: ${sonarProjectKey}`);

      // Step 2: Fetch data from SonarQube API
      const sonarData = await this.fetchSonarQubeData(sonarProjectKey);

      // Step 3: Calculate metrics
      const metrics = this.calculationService.calculateMetrics(
        sonarData.measures,
        sonarData.criticalCount,
        sonarData.blockerCount
      );

      // Step 4: Save to database
      await this.dbService.saveMetrics(projectId, metrics);

      // Step 5: Save historical snapshot
      await this.dbService.saveHistoricalSnapshot(projectId, metrics);

      console.log(`✅ Successfully synced reliability metrics for project ${projectId}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to sync reliability metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch all required data from SonarQube API
   */
  private async fetchSonarQubeData(projectKey: string) {
    // Fetch measures (bugs, rating, remediation effort)
    const measuresResponse = await this.apiService.getReliabilityMetrics(projectKey);

    // Fetch bug counts for CRITICAL and BLOCKER bugs
    const criticalCount = await this.apiService.getBugCount(projectKey, 'CRITICAL');
    const blockerCount = await this.apiService.getBugCount(projectKey, 'BLOCKER');

    return {
      measures: measuresResponse.component,
      criticalCount,
      blockerCount
    };
  }
}
