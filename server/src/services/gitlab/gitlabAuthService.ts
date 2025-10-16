// GitLab Authentication Service
import gitlabClient from './gitlabClient';

class GitLabAuthService {
  /**
   * Verify GitLab token and connection
   */
  verifyConnection = async (): Promise<boolean> => {
    try {
      const client = gitlabClient.getClient();
      await client.get('/user');
      return true;
    } catch (error: any) {
      console.error('GitLab connection failed:', error.message);
      return false;
    }
  };

  /**
   * Get current authenticated user
   */
  getCurrentUser = async () => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get('/user');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching current user:', error.message);
      throw new Error(`Failed to fetch current user: ${error.message}`);
    }
  };
}

export default new GitLabAuthService();
