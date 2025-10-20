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

  constructor(baseUrl?: string, token?: string) {
    this.baseUrl = baseUrl || process.env.SONARQUBE_URL || '';
    this.token = token || process.env.SONARQUBE_TOKEN || '';
    if (!this.baseUrl || !/^https?:\/\//.test(this.baseUrl)) {
      throw new Error('Invalid or missing SONARQUBE_URL. Please set it in your .env file.');
    }
    if (!this.token) {
      throw new Error('Missing SONARQUBE_TOKEN. Please set it in your .env file.');
    }
  }

  private getAuthHeader() {
    return {
      Authorization: 'Basic ' + Buffer.from(this.token + ':').toString('base64'),
    };
  }

  async fetchIssueCounts(projectKey: string): Promise<SonarIssueCounts> {
    // Helper to fetch count for a type/severity
    const fetchCount = async (type: string, severity: string) => {
      const url = `${this.baseUrl}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&types=${type}&severities=${severity}`;
      try {
        const resp = await axios.get(url, { headers: this.getAuthHeader() });
        return resp.data.total || 0;
      } catch (err: any) {
        // Print debug info for all errors
        console.error(`[SonarQubeService] Error for projectKey='${projectKey}' url='${url}'`);
        if (err.response) {
          console.error('Response data:', err.response.data);
        } else {
          console.error('Error:', err.message);
        }
        throw err;
      }
    };
    return {
      security_high: await fetchCount('VULNERABILITY', 'CRITICAL'),
      security_blocker: await fetchCount('VULNERABILITY', 'BLOCKER'),
      reliability_high: await fetchCount('BUG', 'CRITICAL'),
      reliability_blocker: await fetchCount('BUG', 'BLOCKER'),
      maintainability_high: await fetchCount('CODE_SMELL', 'CRITICAL'),
      maintainability_blocker: await fetchCount('CODE_SMELL', 'BLOCKER'),
    };
  }
}
