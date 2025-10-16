// Project Enrichment Service - enriches projects with GitLab data
import { GitLabProject } from '../../types';
import gitlabGroupService from '../gitlab/gitlabGroupService';
import gitLabIssueService from '../gitlab/gitLabIssueService';
import gitLabMRService from '../gitlab/gitLabMRService';

interface EnrichedProject {
  id: number;
  name: string;
  description?: string;
  web_url: string;
  last_activity_at: string;
  visibility: string;
  star_count: number;
  forks_count: number;
  parent_id?: number;
  group_path?: string;
  full_path?: string;
  total_issues: number;
  total_mrs: number;
}

class ProjectEnrichmentService {
  /**
   * Get group hierarchy path for a project
   */
  private getGroupPath = async (project: GitLabProject): Promise<string> => {
    if (project.namespace?.id && project.namespace.kind === 'group') {
      return await gitlabGroupService.buildGroupPath(project.namespace.id);
    }
    return '';
  };

  /**
   * Get issues count for a project
   */
  private getIssuesCount = async (projectId: number): Promise<number> => {
    try {
      const issues = await gitLabIssueService.getProjectIssues(projectId);
      return issues.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch issues for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Get merge requests count for a project
   */
  private getMRsCount = async (projectId: number): Promise<number> => {
    try {
      const mrs = await gitLabMRService.getProjectMergeRequests(projectId);
      return mrs.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch MRs for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Enrich a single project with GitLab data (group path, issues, MRs)
   */
  enrichProject = async (project: GitLabProject): Promise<EnrichedProject> => {
    const [groupPath, totalIssues, totalMrs] = await Promise.all([
      this.getGroupPath(project),
      this.getIssuesCount(project.id),
      this.getMRsCount(project.id),
    ]);

    return {
      id: project.id,
      name: project.name,
      description: project.description || undefined,
      web_url: project.web_url,
      last_activity_at: project.last_activity_at,
      visibility: project.visibility,
      star_count: project.star_count,
      forks_count: project.forks_count,
      parent_id: project.namespace?.id,
      group_path: groupPath || undefined,
      full_path: groupPath ? `${project.name}/${groupPath}` : project.name,
      total_issues: totalIssues,
      total_mrs: totalMrs,
    };
  };

  /**
   * Enrich multiple projects with GitLab data
   */
  enrichProjects = async (projects: GitLabProject[]): Promise<EnrichedProject[]> => {
    return await Promise.all(projects.map(p => this.enrichProject(p)));
  };
}

export default new ProjectEnrichmentService();
