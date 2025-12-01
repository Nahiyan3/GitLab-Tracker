// GitLab Commits API service
import gitlabClient from './gitlabClient';
import { GitLabCommit } from '../../types';

class GitLabCommitService {
  /**
   * Get commits for a project after a specific date
   */
  getCommits = async (
    projectId: number,
    since?: string,
    perPage: number = 100
  ): Promise<GitLabCommit[]> => {
    try {
      const client = gitlabClient.getClient();
      const params: any = {
        per_page: perPage,
        with_stats: true, // Include additions/deletions stats
      };

      if (since) {
        params.since = since;
      }

      const response = await client.get(`/projects/${projectId}/repository/commits`, {
        params,
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching commits for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get a single commit with detailed stats
   */
  getCommit = async (projectId: number, sha: string): Promise<any> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/repository/commits/${sha}`,
        {
          params: {
            stats: true,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching commit ${sha}:`, error.message);
      return null;
    }
  };

  /**
   * Get commit count using X-Total header (fast, no data transfer)
   */
  getCommitCount = async (
    projectId: number,
    since?: string
  ): Promise<number> => {
    try {
      const client = gitlabClient.getClient();
      const params: any = {
        per_page: 1, // Minimize data transfer
      };

      if (since) {
        params.since = since;
      }

      const response = await client.get(
        `/projects/${projectId}/repository/commits`,
        { params }
      );
      
      const total = response.headers['x-total'];
      return total ? parseInt(total, 10) : 0;
    } catch (error: any) {
      console.error(`Error fetching commit count for project ${projectId}:`, error.message);
      return 0;
    }
  };
}

export default new GitLabCommitService();
