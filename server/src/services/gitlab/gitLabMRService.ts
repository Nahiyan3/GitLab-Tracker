// GitLab Merge Requests API service
import gitlabClient from './gitlabClient';
import { GitLabMergeRequest } from '../../types';

class GitLabMRService {
  /**
   * Get all merge requests for a specific project
   */
  getProjectMergeRequests = async (projectId: number): Promise<GitLabMergeRequest[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/merge_requests`, {
        params: {
          state: 'opened', // Fetch only open merge requests
          order_by: 'updated_at',
          sort: 'desc',
          per_page: 100,
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching merge requests for project ${projectId}:`, error.message);
      throw new Error(`Failed to fetch merge requests: ${error.message}`);
    }
  };

  /**
   * Get count of merge requests using X-Total header (fast, no data transfer)
   */
  getMRCount = async (projectId: number, state: 'opened' | 'closed' | 'merged' | 'all' = 'opened'): Promise<number> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/merge_requests`, {
        params: {
          state,
          per_page: 1, // Minimize data transfer
        },
      });
      
      const total = response.headers['x-total'];
      return total ? parseInt(total, 10) : 0;
    } catch (error: any) {
      console.error(`Error fetching MR count for project ${projectId}:`, error.message);
      return 0;
    }
  };
}

export default new GitLabMRService();
