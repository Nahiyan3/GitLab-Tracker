// GitLab Group Service - handles group-related operations
import gitlabClient from './gitlabClient';
import { GitLabGroup } from '../../types';

class GitLabGroupService {
  /**
   * Get all groups
   */
  getAllGroups = async (): Promise<GitLabGroup[]> => {
    try {
      const client = gitlabClient.getClient();
      const response = await client.get('/groups', {
        params: {
          per_page: 100,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching GitLab groups:', error.message);
      throw new Error(`Failed to fetch groups from GitLab: ${error.message}`);
    }
  };

  /**
   * Get a specific group by ID
   */
  getGroupById = async (groupId: number): Promise<GitLabGroup> => {
    try {
      const client = gitlabClient.getClient();
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

export default new GitLabGroupService();
