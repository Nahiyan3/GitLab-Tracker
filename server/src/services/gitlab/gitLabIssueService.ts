// GitLab Issues API service
import gitlabClient from './gitlabClient';
import { GitLabIssues } from '../../types';

class GitLabIssueService {
  /**
   * Get all issues for a specific project
   */
  getProjectIssues = async (projectId: number): Promise<GitLabIssues[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/issues`, {
        params: {
          state: 'all',
          order_by: 'updated_at',
          sort: 'desc',
          per_page: 100,
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching issues for project ${projectId}:`, error.message);
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
  };
}

export default new GitLabIssueService();
