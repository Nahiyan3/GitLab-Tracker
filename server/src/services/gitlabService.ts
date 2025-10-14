// GitLab API client service
import axios, { AxiosInstance } from 'axios';
import { GitLabGroup, GitLabProject } from '../types';

class GitLabService {
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

  private getClient = (): AxiosInstance => {
    if (!this.client) {
      this.initializeClient();
    }
    return this.client!;
  };

  /**
   * Get all projects owned by the authenticated user
   */
  getUserProjects = async (): Promise<GitLabProject[]> => {
    try {
      const client = this.getClient();
      const response = await client.get('/projects', {
        params: {
          membership: true,
          per_page: 100,
          order_by: 'last_activity_at',
          sort: 'desc',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitLab projects:', error.message);
      throw new Error(`Failed to fetch projects from GitLab: ${error.message}`);
    }
  };

  /**
   * Get a specific project by ID
   */
  getProjectById = async (projectId: string | number): Promise<GitLabProject> => {
    try {
      const client = this.getClient();
      const response = await client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitLab project:', error.message);
      throw new Error(`Failed to fetch project from GitLab: ${error.message}`);
    }
  };

  /**
   * Verify GitLab token and connection
   */
  verifyConnection = async (): Promise<boolean> => {
    try {
      const client = this.getClient();
      const response = await client.get('/user');
      return true;
    } catch (error: any) {
      console.error('GitLab connection failed:', error.message);
      return false;
    }
  };

  getAllGroups = async (): Promise<GitLabGroup[]> => {
    try {
      const client = this.getClient();
        const response = await client.get('/groups', {
        params: {
          per_page: 100,
        },
      });
      return response.data;
    }
    catch (error: any) {
        console.error('Error fetching GitLab groups:', error.message);
        throw new Error(`Failed to fetch groups from GitLab: ${error.message}`);
    }
  };

  /**
   * Get a specific group by ID
   */
  getGroupById = async (groupId: number): Promise<GitLabGroup> => {
    try {
      const client = this.getClient();
      const response = await client.get(`/groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitLab group:', error.message);
      throw new Error(`Failed to fetch group from GitLab: ${error.message}`);
    }
  };

  /**
   * Build full group hierarchy path (current/parent1/parent2)
   */
  buildGroupPath = async (groupId: number): Promise<string> => {
    try {
      const groups: string[] = [];
      let currentGroupId: number | undefined = groupId;

      // Traverse up the hierarchy
      while (currentGroupId) {
        const group = await this.getGroupById(currentGroupId);
        groups.push(group.name); // Collect all group names
        currentGroupId = group.parent_id;
      }

      // Reverse to show: current -> parent1 -> parent2
      return groups.reverse().join('/');
    } catch (error: any) {
      console.error('Error building group path:', error.message);
      return '';
    }
  };
}

 

export default new GitLabService();
