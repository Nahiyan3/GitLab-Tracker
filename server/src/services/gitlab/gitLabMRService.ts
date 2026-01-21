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

  // ========================================================================
  // EXTENDED METHODS FOR MR METRICS (DO NOT AFFECT EXISTING FUNCTIONALITY)
  // ========================================================================

  /**
   * Get open MRs sorted by last updated (for stale detection)
   */
  getOpenMRs = async (projectId: number, perPage: number = 500): Promise<GitLabMergeRequest[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/merge_requests`, {
        params: {
          state: 'opened',
          order_by: 'updated_at',
          sort: 'desc',
          per_page: perPage,
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching open MRs for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get merged MRs after a specific date
   */
  getMergedMRs = async (
    projectId: number,
    mergedAfter?: string,
    perPage: number = 500
  ): Promise<GitLabMergeRequest[]> => {
    try {
      const client = gitlabClient.getClient();
      const params: any = {
        state: 'merged',
        order_by: 'updated_at',
        sort: 'desc',
        per_page: perPage,
      };

      if (mergedAfter) {
        params.updated_after = mergedAfter;
      }

      const response = await client.get(`/projects/${projectId}/merge_requests`, {
        params,
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching merged MRs for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get MRs opened after a specific date
   */
  getOpenedMRs = async (
    projectId: number,
    createdAfter: string,
    perPage: number = 500
  ): Promise<GitLabMergeRequest[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/merge_requests`, {
        params: {
          created_after: createdAfter,
          order_by: 'created_at',
          sort: 'desc',
          per_page: perPage,
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching opened MRs for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get discussion notes/comments for a specific MR
   */
  getMRNotes = async (projectId: number, mrIid: number): Promise<any[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/merge_requests/${mrIid}/notes`,
        {
          params: {
            per_page: 100,
          },
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching notes for MR ${mrIid}:`, error.message);
      return [];
    }
  };

  /**
   * Get reviewers for a specific MR
   */
  getMRReviewers = async (projectId: number, mrIid: number): Promise<any[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/merge_requests/${mrIid}`,
        {
          params: {
            include_rebase_in_progress: false,
          },
        }
      );
      
      // Return reviewers array (can be empty)
      return response.data.reviewers || [];
    } catch (error: any) {
      console.error(`Error fetching reviewers for MR ${mrIid}:`, error.message);
      return [];
    }
  };

  /**
   * Check if MR was reverted (look for revert commits or MRs)
   */
  checkMRReverted = async (projectId: number, mrIid: number): Promise<boolean> => {
    try {
      const client = gitlabClient.getClient();
      
      // Get MR details to check if it has been reverted
      const response = await client.get(
        `/projects/${projectId}/merge_requests/${mrIid}`
      );
      
      const mr = response.data;
      
      // Check if title contains "Revert" pattern
      if (mr.title && (
        mr.title.toLowerCase().includes('revert') ||
        mr.description?.toLowerCase().includes('revert')
      )) {
        return true;
      }
      
      // Check labels
      if (mr.labels && mr.labels.some((label: string) => 
        label.toLowerCase().includes('revert')
      )) {
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error(`Error checking if MR ${mrIid} was reverted:`, error.message);
      return false;
    }
  };
}

export default new GitLabMRService();
