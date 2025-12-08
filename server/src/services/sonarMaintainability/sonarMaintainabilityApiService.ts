import axios from 'axios';
import { SonarQubeComponentMeasures } from '../../types/sonarQubeMetrics.types';

export class SonarMaintainabilityApiService {
  private baseUrl: string;
  private token: string;
  private initialized: boolean = false;

  constructor(baseUrl?: string, token?: string) {
    console.log('[SonarMaintainabilityApiService] Constructor called with:', {
      baseUrl,
      token: token ? `${token.substring(0, 10)}...` : undefined,
      envUrl: process.env.SONARQUBE_URL,
      envToken: process.env.SONARQUBE_TOKEN ? `${process.env.SONARQUBE_TOKEN.substring(0, 10)}...` : undefined
    });
    this.baseUrl = (baseUrl || process.env.SONARQUBE_URL || '').trim().replace(/\/$/, '');
    this.token = (token || process.env.SONARQUBE_TOKEN || '').trim();
    console.log('[SonarMaintainabilityApiService] After assignment:', {
      baseUrl: this.baseUrl,
      token: this.token ? `${this.token.substring(0, 10)}...` : 'EMPTY'
    });
  }

  private ensureInitialized() {
    if (this.initialized) return;

    if (!this.baseUrl || !/^https?:\/\//.test(this.baseUrl)) {
      throw new Error('Invalid or missing SONARQUBE_URL. Please set it in your .env file.');
    }
    if (!this.token) {
      throw new Error('Missing SONARQUBE_TOKEN. Please set it in your .env file.');
    }

    this.initialized = true;
    console.log(`🔧 SonarMaintainabilityApiService initialized with URL: ${this.baseUrl}`);
  }

  private getAuthHeader() {
    return {
      Authorization: 'Basic ' + Buffer.from(this.token + ':').toString('base64'),
    };
  }

  /**
   * Fetch maintainability metrics from SonarQube
   */
  async getMaintainabilityMetrics(projectKey: string): Promise<SonarQubeComponentMeasures> {
    this.ensureInitialized();
    
    const metricKeys = [
      'sqale_debt_ratio',           // Technical Debt Ratio
      'sqale_rating',                // Maintainability Rating (1-5)
      'code_smells',                 // Total Code Smells
      'new_code_smells',             // New Code Smells (last 30 days)
      'complexity',                  // Cyclomatic Complexity
      'cognitive_complexity',        // Cognitive Complexity
      'duplicated_lines_density',    // Duplicated Code Percentage
      'new_duplicated_lines_density', // Duplicated Lines in New Code
      'ncloc'                        // Lines of Code (for context)
    ].join(',');

    const url = `${this.baseUrl}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys}`;

    try {
      console.log(`📊 Fetching maintainability metrics for project: ${projectKey}`);
      console.log(`📍 URL: ${url}`);
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      console.log(`✅ Received response with ${response.data.component?.measures?.length || 0} measures`);
      console.log('📦 Measures received:', JSON.stringify(response.data.component?.measures, null, 2));
      return response.data;
    } catch (err: any) {
      console.error(`[SonarMaintainabilityApiService] Error fetching metrics for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      } else {
        console.error('Error:', err.message);
      }
      throw err;
    }
  }

  /**
   * Fetch issue counts by severity (HIGH and BLOCKER code smells)
   */
  async getIssueCount(projectKey: string, type: string, severity: string): Promise<number> {
    this.ensureInitialized();

    const url = `${this.baseUrl}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&types=${type}&severities=${severity}&resolved=false`;

    try {
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      return response.data.total || 0;
    } catch (err: any) {
      console.error(`[SonarMaintainabilityApiService] Error fetching ${type}/${severity} for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      throw err;
    }
  }

  /**
   * Fetch New Code Period definition to understand the timeline
   */
  async getNewCodePeriod(projectKey: string): Promise<any> {
    this.ensureInitialized();

    const url = `${this.baseUrl}/api/new_code_periods/show?project=${encodeURIComponent(projectKey)}`;

    try {
      console.log(`📅 Fetching New Code Period definition for: ${projectKey}`);
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      console.log('📅 New Code Period:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (err: any) {
      console.error(`[SonarMaintainabilityApiService] Error fetching New Code Period for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
      }
      // Return null instead of throwing - this is optional information
      return null;
    }
  }
}
