// GitLab Project Service - handles project-related operations
import gitlabClient from './gitlabClient';
import { GitLabProject } from '../../types';

class GitLabProjectService {
  /**
   * Get all projects owned by the authenticated user (with pagination)
   */
  getUserProjects = async (): Promise<GitLabProject[]> => {
    try {
      const client = gitlabClient.getClient();
      const allProjects: GitLabProject[] = [];
      let page = 1;
      let hasMorePages = true;
      
      console.log('🔄 Fetching all projects from GitLab (with pagination)...');
      
      while (hasMorePages) {
        const response = await client.get('/projects', {
          params: {
            membership: true,
            per_page: 100,
            page: page,
            order_by: 'last_activity_at',
            sort: 'desc',
          },
        });
        
        const projects = response.data;
        allProjects.push(...projects);
        
        console.log(`   Page ${page}: fetched ${projects.length} projects (total: ${allProjects.length})`);
        
        // Check if there are more pages
        // GitLab uses 'x-next-page' header or checks if we got less than per_page
        const nextPage = response.headers['x-next-page'];
        hasMorePages = nextPage && nextPage !== '' && projects.length === 100;
        
        page++;
        
        // Safety limit to prevent infinite loops
        if (page > 20) {
          console.warn('⚠️  Reached page limit of 20, stopping pagination');
          break;
        }
      }
      
      console.log(`✅ Total projects fetched: ${allProjects.length}`);
      return allProjects;
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
