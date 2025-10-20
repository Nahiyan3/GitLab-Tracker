// Project Transformation Service - handles data mapping and transformations
interface DbProject {
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
  tracked: boolean;
  total_issues?: number;
  total_mrs?: number;
  open_milestones_count?: number;
  synced_at?: string;
  // SonarCloud metrics
  sonar_project_key?: string;
  sonar_security_high?: number;
  sonar_security_blocker?: number;
  sonar_reliability_high?: number;
  sonar_reliability_blocker?: number;
  sonar_maintainability_high?: number;
  sonar_maintainability_blocker?: number;
}

class ProjectTransformService {
  /**
   * Transform database project to API response format
   */
  toApiResponse = (dbProject: DbProject) => {
    return {
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description,
      web_url: dbProject.web_url,
      last_activity_at: dbProject.last_activity_at,
      visibility: dbProject.visibility,
      star_count: dbProject.star_count,
      forks_count: dbProject.forks_count,
      parent_id: dbProject.parent_id,
      groupPath: dbProject.group_path,
      fullPath: dbProject.full_path,
      isTracked: dbProject.tracked,
      totalIssues: dbProject.total_issues || 0,
      totalMrs: dbProject.total_mrs || 0,
      openMilestonesCount: dbProject.open_milestones_count || 0,
      synced_at: dbProject.synced_at,
      // SonarCloud metrics
      sonarProjectKey: dbProject.sonar_project_key,
      sonarSecurityHigh: dbProject.sonar_security_high || 0,
      sonarSecurityBlocker: dbProject.sonar_security_blocker || 0,
      sonarReliabilityHigh: dbProject.sonar_reliability_high || 0,
      sonarReliabilityBlocker: dbProject.sonar_reliability_blocker || 0,
      sonarMaintainabilityHigh: dbProject.sonar_maintainability_high || 0,
      sonarMaintainabilityBlocker: dbProject.sonar_maintainability_blocker || 0,
    };
  };

  /**
   * Transform array of database projects to API response format
   */
  toApiResponseList = (dbProjects: DbProject[]) => {
    return dbProjects.map(p => this.toApiResponse(p));
  };
}

export default new ProjectTransformService();
