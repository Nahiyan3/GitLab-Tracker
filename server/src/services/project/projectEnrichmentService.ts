// Project Enrichment Service - enriches projects with GitLab data
import { GitLabProject } from '../../types';
import gitlabGroupService from '../gitlab/gitlabGroupService';
import gitLabIssueService from '../gitlab/gitLabIssueService';
import gitLabMRService from '../gitlab/gitLabMRService';
import gitLabMilestoneService from '../gitlab/gitlabMilestoneService';
import { SonarQubeService } from '../sonarqube/sonarQubeService';
import { getSonarProjectKey } from '../sonarqube/autoMapSonarProjectKeys';

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
  open_milestones_count: number;
  // SonarQube data
  sonar_project_key?: string;
  sonar_security_high?: number;
  sonar_security_blocker?: number;
  sonar_reliability_high?: number;
  sonar_reliability_blocker?: number;
  sonar_maintainability_high?: number;
  sonar_maintainability_blocker?: number;
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
   
  private getMilestonesCount = async (projectId: number): Promise<number> => {
    try {
      const milestones = await gitLabMilestoneService.getProjectMilestones(projectId);
      return milestones.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch milestones for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Enrich a single project with GitLab data (group path, issues, MRs)
   */
  enrichProject = async (project: GitLabProject): Promise<EnrichedProject> => {
    const [groupPath, totalIssues, totalMrs, totalMilestones] = await Promise.all([
      this.getGroupPath(project),
      this.getIssuesCount(project.id),
      this.getMRsCount(project.id),
      this.getMilestonesCount(project.id),
    ]);

    // SonarQube metrics: fetch from database mapping
    const sonarProjectKey = await getSonarProjectKey(project.id);
    let sonarMetrics = {
      security_high: 0,
      security_blocker: 0,
      reliability_high: 0,
      reliability_blocker: 0,
      maintainability_high: 0,
      maintainability_blocker: 0,
    };
    
    if (sonarProjectKey) {
      try {
        const sonarQubeService = new SonarQubeService();
        sonarMetrics = await sonarQubeService.fetchIssueCounts(sonarProjectKey);
        console.log(`✅ Fetched SonarQube metrics for ${project.name} (key: ${sonarProjectKey})`);
      } catch (e) {
        console.warn(`⚠️ Failed to fetch SonarQube metrics for ${sonarProjectKey}:`, (e as any).message);
      }
    } else {
      console.warn(`⚠️ No SonarCloud key mapped for project ${project.name} (ID: ${project.id})`);
    }

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
      open_milestones_count: totalMilestones,
      sonar_project_key: sonarProjectKey || undefined,
      sonar_security_high: sonarMetrics.security_high,
      sonar_security_blocker: sonarMetrics.security_blocker,
      sonar_reliability_high: sonarMetrics.reliability_high,
      sonar_reliability_blocker: sonarMetrics.reliability_blocker,
      sonar_maintainability_high: sonarMetrics.maintainability_high,
      sonar_maintainability_blocker: sonarMetrics.maintainability_blocker,
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
