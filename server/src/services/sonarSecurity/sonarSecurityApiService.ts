import axios from 'axios';
import { SonarQubeComponentMeasures } from '../../types/sonarQubeMetrics.types';

export class SonarSecurityApiService {
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
    console.log(`🔧 SonarSecurityApiService initialized with URL: ${this.baseUrl}`);
  }

  private getAuthHeader() {
    return {
      Authorization: 'Basic ' + Buffer.from(this.token + ':').toString('base64'),
    };
  }

  /**
   * Fetch security metrics from SonarQube
   */
  async getSecurityMetrics(projectKey: string): Promise<SonarQubeComponentMeasures> {
    this.ensureInitialized();
    
    const metricKeys = [
      'vulnerabilities',                    // Total Vulnerabilities
      'new_vulnerabilities',                // Vulnerabilities in New Code
      'security_rating',                    // Security Rating (1-5)
      'security_hotspots',                  // Security Hotspots count
      'security_hotspots_reviewed',         // Security Hotspots Reviewed percentage
      'security_review_rating',             // Security Review Rating (1-5)
      'security_remediation_effort'         // Time to fix all vulnerabilities (minutes)
    ].join(',');

    const url = `${this.baseUrl}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys}`;

    try {
      console.log(`📊 Fetching security metrics for project: ${projectKey}`);
      const response = await axios.get(url, { headers: this.getAuthHeader() });
      console.log(`✅ Received response with ${response.data.component?.measures?.length || 0} measures`);
      return response.data;
    } catch (err: any) {
      console.error(`[SonarSecurityApiService] Error fetching metrics for ${projectKey}`);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      throw err;
    }
  }
}
