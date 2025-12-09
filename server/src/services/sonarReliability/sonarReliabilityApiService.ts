import axios from 'axios';
import { SonarQubeComponentMeasures } from '../../types/sonarQubeMetrics.types';

export class SonarReliabilityApiService {
  private baseUrl: string;
  private token: string;
  private initialized: boolean = false;

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = (baseUrl || process.env.SONARQUBE_URL || '').trim().replace(/\/$/, '');
    this.token = (token || process.env.SONARQUBE_TOKEN || '').trim();
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
    console.log(`🔧 SonarReliabilityApiService initialized with URL: ${this.baseUrl}`);
  }

  private getAuthHeader() {
    return {
      Authorization: 'Basic ' + Buffer.from(this.token + ':').toString('base64'),
    };
  }

  /**
   * Fetch reliability metrics from SonarQube
   */
  async getReliabilityMetrics(projectKey: string): Promise<SonarQubeComponentMeasures> {
    this.ensureInitialized();
    
    const metricKeys = [
      'bugs',                           // Total Bugs
      'new_bugs',                       // Bugs in New Code
      'reliability_rating',             // Reliability Rating (1-5)
      'reliability_remediation_effort'  // Time to fix all bugs (minutes)
    ].join(',');

    const url = `${this.baseUrl}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys}`;

    try {
      console.log(`📊 Fetching reliability metrics for project: ${projectKey}`);
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      console.log(`✅ Received response with ${response.data.component?.measures?.length || 0} measures`);
      return response.data;
    } catch (err: any) {
      console.error(`[SonarReliabilityApiService] Error fetching metrics for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      throw err;
    }
  }

  /**
   * Fetch bug counts by severity (CRITICAL and BLOCKER bugs)
   */
  async getBugCount(projectKey: string, severity: string): Promise<number> {
    this.ensureInitialized();

    const url = `${this.baseUrl}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&types=BUG&severities=${severity}&resolved=false`;

    try {
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      return response.data.total || 0;
    } catch (err: any) {
      console.error(`[SonarReliabilityApiService] Error fetching BUG/${severity} for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
      }
      throw err;
    }
  }
}
