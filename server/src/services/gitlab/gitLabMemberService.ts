// GitLab Member Service - fetches members info for projects
import gitlabClient from './gitlabClient';

class GitLabMemberService {
  /**
   * Get the number of members for a given project.
   * Uses GitLab's members/all endpoint. If GitLab returns X-Total header
   * we use that for an accurate count; otherwise fall back to array length.
   */
  getProjectMemberCount = async (projectId: number | string): Promise<number> => {
    try {
      const client = gitlabClient.getClient();
      // Request first page with a large per_page; this covers most cases.
      const resp = await client.get(`/projects/${projectId}/members/all`, {
        params: { per_page: 100, page: 1 },
      });

      const totalHeader = resp.headers?.['x-total'] ?? resp.headers?.['x-total-count'];
      if (totalHeader) {
        const parsed = parseInt(totalHeader, 10);
        if (!isNaN(parsed)) return parsed;
      }

      // Fallback: return the number of items in the response body
      if (Array.isArray(resp.data)) return resp.data.length;

      return 0;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch members for project ${projectId}: ${error?.message || error}`);
      return 0;
    }
  };

  /**
   * Get the full list of members for a project.
   * Paginates through results (per_page=100) until no more pages.
   * Returns an array of simplified member objects: { id, name, username, accessLevel }
   */
  getProjectMembers = async (projectId: number | string): Promise<Array<{id:number; name:string; username:string; accessLevel?: number;}>> => {
    try {
      const client = gitlabClient.getClient();
      const perPage = 100;
      let page = 1;
      const members: Array<any> = [];

      while (true) {
        const resp = await client.get(`/projects/${projectId}/members/all`, {
          params: { per_page: perPage, page },
        });

        if (!Array.isArray(resp.data) || resp.data.length === 0) break;

        members.push(...resp.data);

        // If fewer than perPage returned, we're done
        if (resp.data.length < perPage) break;
        page += 1;
      }

      // Map to simplified shape
      return members.map((m: any) => ({
        id: m.id,
        name: m.name || m.username || '',
        username: m.username,
        accessLevel: m.access_level || m.accessLevel || undefined,
      }));
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch member list for project ${projectId}: ${error?.message || error}`);
      return [];
    }
  };
}

export default new GitLabMemberService();
