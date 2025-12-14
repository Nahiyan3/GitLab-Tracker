import { SonarSecurityApiService } from './sonarSecurityApiService';
import { SonarSecurityCalculationService } from './sonarSecurityCalculationService';
import { SonarSecurityDbService } from './sonarSecurityDbService';
import { getSonarProjectKey } from '../sonarqube/autoMapSonarProjectKeys';

export class SonarSecuritySyncService {
  private apiService: SonarSecurityApiService;
  private calculationService: SonarSecurityCalculationService;
  private dbService: SonarSecurityDbService;

  constructor() {
    this.apiService = new SonarSecurityApiService();
    this.calculationService = new SonarSecurityCalculationService();
    this.dbService = new SonarSecurityDbService();
  }

  /**
   * Sync security metrics for a project
   */
  async syncSecurityMetrics(projectId: number): Promise<void> {
    console.log(`\n🔄 Starting security metrics sync for project ${projectId}`);

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
      const metrics = this.calculationService.calculateMetrics(sonarData.measures);

      // Step 4: Save to database
      await this.dbService.saveMetrics(projectId, metrics);

      // Step 5: Save historical snapshot
      await this.dbService.saveHistoricalSnapshot(projectId, metrics);

      console.log(`✅ Successfully synced security metrics for project ${projectId}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to sync security metrics for project ${projectId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch all required data from SonarQube API
   */
  private async fetchSonarQubeData(projectKey: string) {
    // Fetch security measures
    const measuresResponse = await this.apiService.getSecurityMetrics(projectKey);

    return {
      measures: measuresResponse.component
    };
  }
}
