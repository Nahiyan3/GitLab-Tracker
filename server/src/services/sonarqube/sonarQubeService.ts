import axios from 'axios';

export interface SonarIssueCounts {
  security_high: number;
  security_blocker: number;
  reliability_high: number;
  reliability_blocker: number;
  maintainability_high: number;
  maintainability_blocker: number;
}

export class SonarQubeService {
  private baseUrl: string;
  private token: string;
  private isSonarCloud: boolean;

  constructor(baseUrl?: string, token?: string) {
    // Trim and remove trailing slash
    this.baseUrl = (baseUrl || process.env.SONARQUBE_URL || '').trim().replace(/\/$/, '');
    this.token = (token || process.env.SONARQUBE_TOKEN || '').trim();
    this.isSonarCloud = this.baseUrl.includes('sonarcloud.io');
    
    if (!this.baseUrl || !/^https?:\/\//.test(this.baseUrl)) {
      throw new Error('Invalid or missing SONARQUBE_URL. Please set it in your .env file.');
    }
    if (!this.token) {
      throw new Error('Missing SONARQUBE_TOKEN. Please set it in your .env file.');
    }
    
    console.log(`🔧 SonarQubeService initialized with URL: ${this.baseUrl}`);
  }

  private getAuthHeader() {
    if (this.isSonarCloud) {
      return {
        Authorization: `Bearer ${this.token}`,
      };
    }
    return {
      Authorization: 'Basic ' + Buffer.from(this.token + ':').toString('base64'),
    };
  }

  async fetchIssueCounts(projectKey: string): Promise<SonarIssueCounts> {
    console.log(`📊 Fetching SonarQube metrics for project: ${projectKey}`);
    
    // Helper to fetch count for a type/severity
    const fetchCount = async (type: string, severity: string) => {
      const url = `${this.baseUrl}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&types=${type}&severities=${severity}&resolved=false`;
      try {
        const resp = await axios.get(url, { headers: this.getAuthHeader() });
        const count = resp.data.total || 0;
        console.log(`  ✓ ${type}/${severity}: ${count}`);
        return count;
      } catch (err: any) {
        // Print debug info for all errors
        console.error(`[SonarQubeService] Error for projectKey='${projectKey}' type='${type}' severity='${severity}'`);
        if (err.response) {
          console.error('Response status:', err.response.status);
          console.error('Response data:', typeof err.response.data === 'string' ? err.response.data.substring(0, 200) : err.response.data);
        } else {
          console.error('Error:', err.message);
        }
        throw err;
      }
    };
    
    const results = {
      security_high: await fetchCount('VULNERABILITY', 'CRITICAL'),
      security_blocker: await fetchCount('VULNERABILITY', 'BLOCKER'),
      reliability_high: await fetchCount('BUG', 'CRITICAL'),
      reliability_blocker: await fetchCount('BUG', 'BLOCKER'),
      maintainability_high: await fetchCount('CODE_SMELL', 'CRITICAL'),
      maintainability_blocker: await fetchCount('CODE_SMELL', 'BLOCKER'),
    };
    
    console.log(`✅ Successfully fetched SonarQube metrics for ${projectKey}`);
    return results;
  }
}
