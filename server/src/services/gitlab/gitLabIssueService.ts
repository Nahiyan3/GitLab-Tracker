// GitLab Issues API service
import gitlabClient from './gitlabClient';
import { GitLabIssues } from '../../types';
import { GitLabIssueStateEvent, GitLabIssueMRReference } from '../../types/issueMetrics.types';

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

  // ========================================================================
  // EXTENDED METHODS FOR ISSUE METRICS (DO NOT AFFECT EXISTING FUNCTIONALITY)
  // ========================================================================

  /**
   * Get count of issues using X-Total header (fast, no data transfer)
   */
  getIssueCount = async (projectId: number, state: 'opened' | 'closed' | 'all'): Promise<number> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/issues`, {
        params: {
          state,
          per_page: 1,
        },
      });
      
      const total = response.headers['x-total'];
      return total ? parseInt(total, 10) : 0;
    } catch (error: any) {
      console.error(`Error fetching issue count for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Get issues closed in a specific time period
   * Note: Fetches recent closed issues and filters by closed_at date
   */
  getClosedIssues = async (
    projectId: number, 
    closedAfter?: string,
    maxResults: number = 200
  ): Promise<GitLabIssues[]> => {
    try {
      const client = gitlabClient.getClient();
      const allIssues: GitLabIssues[] = [];
      let page = 1;
      const perPage = 100; // GitLab max per page
      
      // If we have a date filter, we need to fetch multiple pages until we go past the date
      const cutoffDate = closedAfter ? new Date(closedAfter) : null;
      
      while (allIssues.length < maxResults) {
        const response = await client.get(`/projects/${projectId}/issues`, {
          params: {
            state: 'closed',
            order_by: 'updated_at',  // closed_at not supported in all GitLab versions
            sort: 'desc',  // Most recently updated first
            per_page: perPage,
            page,
          },
        });
        
        const issues = response.data || [];
        
        if (issues.length === 0) {
          break; // No more issues
        }
        
        // If we have a cutoff date, filter and check if we should continue
        if (cutoffDate) {
          for (const issue of issues) {
            if (issue.closed_at) {
              const closedDate = new Date(issue.closed_at);
              if (closedDate >= cutoffDate) {
                allIssues.push(issue);
              } else {
                // We've reached issues older than cutoff, stop fetching
                return allIssues;
              }
            }
          }
        } else {
          allIssues.push(...issues);
        }
        
        // If we got less than perPage, we've reached the end
        if (issues.length < perPage) {
          break;
        }
        
        page++;
        
        // Safety limit: don't fetch more than 10 pages
        if (page > 10) {
          console.warn(`[GitLabIssueService] Reached page limit (10) for project ${projectId}`);
          break;
        }
      }
      
      return allIssues.slice(0, maxResults);
    } catch (error: any) {
      console.error(`Error fetching closed issues for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get issues opened in a specific time period
   */
  getOpenedIssues = async (
    projectId: number, 
    createdAfter: string,
    perPage: number = 100
  ): Promise<GitLabIssues[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(`/projects/${projectId}/issues`, {
        params: {
          created_after: createdAfter,
          order_by: 'created_at',
          sort: 'desc',
          per_page: perPage,
        },
      });
      
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching opened issues for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get issues by label
   */
  getIssuesByLabel = async (
    projectId: number,
    labels: string[],
    createdAfter?: string,
    state: 'opened' | 'closed' | 'all' = 'all'
  ): Promise<GitLabIssues[]> => {
    try {
      const client = gitlabClient.getClient();
      const params: any = {
        labels: labels.join(','),
        state,
        per_page: 100,
      };

      if (createdAfter) {
        params.created_after = createdAfter;
      }

      const response = await client.get(`/projects/${projectId}/issues`, { params });
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching issues by label for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get open issues (for stale issue detection)
   */
  getOpenIssues = async (projectId: number, perPage: number = 100): Promise<GitLabIssues[]> => {
    try {
      const client = gitlabClient.getClient();
      // Fetch all pages up to perPage
      const response = await client.get(`/projects/${projectId}/issues`, {
        params: {
          state: 'opened',
          order_by: 'updated_at',
          sort: 'asc',  // Oldest first (for stale detection)
          per_page: Math.min(perPage, 100),  // GitLab max is 100 per page
        },
      });
      
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching open issues for project ${projectId}:`, error.message);
      return [];
    }
  };

  /**
   * Get issue state events (for reopen detection)
   */
  getIssueStateEvents = async (projectId: number, issueIid: number): Promise<GitLabIssueStateEvent[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/issues/${issueIid}/resource_state_events`
      );
      
      return response.data || [];
    } catch (error: any) {
      console.error(`Error fetching state events for issue ${issueIid}:`, error.message);
      return [];
    }
  };

  /**
   * Get merge requests that closed an issue
   */
  getIssueClosedBy = async (projectId: number, issueIid: number): Promise<GitLabIssueMRReference[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/issues/${issueIid}/closed_by`
      );
      
      return response.data || [];
    } catch (error: any) {
      // This endpoint might not exist in all GitLab versions
      return [];
    }
  };

  /**
   * Get issue links
   */
  getIssueLinks = async (projectId: number, issueIid: number): Promise<any[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get(
        `/projects/${projectId}/issues/${issueIid}/links`
      );
      
      return response.data || [];
    } catch (error: any) {
      return [];
    }
  };
}

export default new GitLabIssueService();
