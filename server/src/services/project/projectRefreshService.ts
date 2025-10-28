// Project Refresh Service - creates new snapshots for tracked projects
import { GitLabProject } from '../../types';
import gitlabProjectService from '../gitlab/gitlabProjectService';
import gitLabIssueService from '../gitlab/gitLabIssueService';
import gitLabMRService from '../gitlab/gitLabMRService';
import gitLabMilestoneService from '../gitlab/gitlabMilestoneService';
import { SonarQubeService } from '../sonarqube/sonarQubeService';
import { getSonarProjectKey } from '../sonarqube/autoMapSonarProjectKeys';
import { insertProjectSnapshot, getTrackedProjectIds } from '../../db/queries';

interface SnapshotData {
  project_id: number;
  description?: string;
  web_url?: string;
  open_issues?: number;
  open_mrs?: number;
  open_milestones_count?: number;
  sonar_project_key?: string;
  sonar_security_high?: number;
  sonar_security_blocker?: number;
  sonar_reliability_high?: number;
  sonar_reliability_blocker?: number;
  sonar_maintainability_high?: number;
  sonar_maintainability_blocker?: number;
}

class ProjectRefreshService {
  private isRefreshing: boolean = false;
  
  /**
   * Get OPEN issues count for a project
   */
  private getOpenIssuesCount = async (projectId: number): Promise<number> => {
    try {
      const issues = await gitLabIssueService.getProjectIssues(projectId);
      // Filter only open issues
      const openIssues = issues.filter(issue => issue.state === 'opened');
      return openIssues.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch issues for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Get OPEN merge requests count for a project
   */
  private getOpenMRsCount = async (projectId: number): Promise<number> => {
    try {
      const mrs = await gitLabMRService.getProjectMergeRequests(projectId);
      // Filter only open MRs
      const openMRs = mrs.filter(mr => mr.state === 'opened');
      return openMRs.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch MRs for project ${projectId}:`, error.message);
      return 0;
    }
  };
   
  /**
   * Get OPEN milestones count for a project
   */
  private getOpenMilestonesCount = async (projectId: number): Promise<number> => {
    try {
      const milestones = await gitLabMilestoneService.getProjectMilestones(projectId);
      // Filter only active milestones
      const openMilestones = milestones.filter(m => m.state === 'active');
      return openMilestones.length;
    } catch (error: any) {
      console.warn(`⚠️ Failed to fetch milestones for project ${projectId}:`, error.message);
      return 0;
    }
  };

  /**
   * Create snapshot data for a single project
   */
  private createSnapshotData = async (project: GitLabProject): Promise<SnapshotData> => {
    const [openIssues, openMrs, openMilestones] = await Promise.all([
      this.getOpenIssuesCount(project.id),
      this.getOpenMRsCount(project.id),
      this.getOpenMilestonesCount(project.id),
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
      } catch (e) {
        console.warn(`⚠️ Failed to fetch SonarQube metrics for ${sonarProjectKey}:`, (e as any).message);
      }
    }

    return {
      project_id: project.id,
      description: project.description || undefined,
      web_url: project.web_url,
      open_issues: openIssues,
      open_mrs: openMrs,
      open_milestones_count: openMilestones,
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
   * Refresh a single tracked project (create new snapshot)
   */
  refreshProject = async (projectId: number): Promise<void> => {
    // Step 1: Fetch project from GitLab
    const gitlabProject = await gitlabProjectService.getProjectById(projectId);
    
    // Step 2: Create snapshot data
    const snapshotData = await this.createSnapshotData(gitlabProject);
    
    // Step 3: Insert snapshot
    await insertProjectSnapshot(snapshotData);
    console.log(`✅ Created snapshot for project ${gitlabProject.name}`);
  };

  /**
   * Refresh all tracked projects (create new snapshots for all)
   */
  refreshAllTrackedProjects = async (): Promise<void> => {
    // Prevent concurrent refresh operations
    if (this.isRefreshing) {
      console.log(`⚠️ Refresh already in progress, skipping duplicate request`);
      return;
    }
    
    try {
      this.isRefreshing = true;
      
      // Step 1: Get all tracked project IDs
      const trackedProjectIds = await getTrackedProjectIds();
      console.log(`📊 Refreshing ${trackedProjectIds.length} tracked projects...`);
      
      // Step 2: Refresh each project
      for (const projectId of trackedProjectIds) {
        try {
          await this.refreshProject(projectId);
        } catch (error: any) {
          console.error(`❌ Failed to refresh project ${projectId}:`, error.message);
          // Continue with next project
        }
      }
      
      console.log(`✅ Completed refresh of tracked projects`);
    } finally {
      this.isRefreshing = false;
    }
  };
}

export default new ProjectRefreshService();
