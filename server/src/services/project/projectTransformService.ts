// Project Transformation Service - handles data mapping and transformations
interface DbProject {
  // From projects table
  id: number;
  name: string;
  full_path?: string;
  group_path?: string;
  members_count?: number;
  last_activity_at?: string;
  parent_id?: number;
  visibility?: string;
  tracked: boolean;
  synced_at?: string;
  
  // From snapshots table (when joined)
  description?: string;
  web_url?: string;
  open_issues?: number;
  open_mrs?: number;
  open_milestones_count?: number;
  snapshot_date?: string;
  
  // SonarCloud metrics (from snapshots)
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
      lastActivityAt: dbProject.last_activity_at,
      visibility: dbProject.visibility,
      membersCount: dbProject.members_count || 0,
      parentId: dbProject.parent_id,
      groupPath: dbProject.group_path,
      fullPath: dbProject.full_path,
      tracked: dbProject.tracked,
      syncedAt: dbProject.synced_at,
      
      // Snapshot data (for tracked projects)
      openIssues: dbProject.open_issues || 0,
      openMrs: dbProject.open_mrs || 0,
      openMilestonesCount: dbProject.open_milestones_count || 0,
      snapshotDate: dbProject.snapshot_date,
      
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
