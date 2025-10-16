// GitLab HTTP client - shared by all GitLab services
import axios, { AxiosInstance } from 'axios';

class GitLabClient {
  private client: AxiosInstance | null = null;
  private gitlabUrl: string;
  private token: string;

  constructor() {
    this.gitlabUrl = '';
    this.token = '';
  }

  private initializeClient = () => {
    if (this.client) return; // Already initialized

    this.gitlabUrl = process.env.GITLAB_URL || 'https://gitlab.com';
    this.token = process.env.GITLAB_TOKEN?.trim() || '';

    if (!this.token) {
      console.warn('⚠️ GITLAB_TOKEN is not set in environment variables');
    }

    this.client = axios.create({
      baseURL: `${this.gitlabUrl}/api/v4`,
      headers: {
        'PRIVATE-TOKEN': this.token,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  };

  getClient = (): AxiosInstance => {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  };
}

export default new GitLabClient();
