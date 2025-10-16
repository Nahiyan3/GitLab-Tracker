// GitLab Project Service - handles project-related operations
import gitlabClient from './gitlabClient';
import { GitLabProject } from '../../types';

class GitLabProjectService {
  /**
   * Get all projects owned by the authenticated user
   */
  getUserProjects = async (): Promise<GitLabProject[]> => {
    try {
      const client = gitlabClient.getClient();
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
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitLab project:', error.message);
      throw new Error(`Failed to fetch project from GitLab: ${error.message}`);
    }
  };
}

export default new GitLabProjectService();
