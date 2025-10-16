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
          state: 'all',
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
}

export default new GitLabMRService();
