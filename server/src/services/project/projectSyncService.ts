// Project Sync Service - orchestrates project syncing workflow
import gitlabProjectService from '../gitlab/gitlabProjectService';
import gitLabMemberService from '../gitlab/gitLabMemberService';
import projectEnrichmentService from './projectEnrichmentService';
import projectTransformService from './projectTransformService';
import { syncProjectsToRegistry, getAllProjectsFromRegistry } from '../../db/queries';
import { autoMapSonarProjectKeys } from '../sonarqube/autoMapSonarProjectKeys';

class ProjectSyncService {
  /**
   * Sync all projects from GitLab to registry (basic info only)
   * This updates the projects table (all projects)
   * Does NOT update snapshots - use refresh for that
   */
  syncAllProjects = async () => {
    // Step 1: Fetch all projects from GitLab
    const gitlabProjects = await gitlabProjectService.getUserProjects();
    
    // Step 2: Extract basic info for registry and fetch member info
    // Fetch members sequentially with delays to avoid rate limiting (503 errors)
    console.log(`🔄 Fetching members for ${gitlabProjects.length} projects (sequential)...`);
    
    const registryData = [];
    
    for (let i = 0; i < gitlabProjects.length; i++) {
      const project = gitlabProjects[i];
      
      // Fetch members for this project
      let members = [];
      try {
        members = await gitLabMemberService.getProjectMembers(project.id);
      } catch (error) {
        // Silently handle errors - members will be empty array
        members = [];
      }
      
      // Add to registry data
      registryData.push({
        id: project.id,
        name: project.name,
        full_path: project.path_with_namespace,
        group_path: project.namespace?.full_path,
        members_count: members.length,
        members: members,
        last_activity_at: project.last_activity_at,
        parent_id: project.namespace?.id,
        visibility: project.visibility,
      });
      
      // Progress indicator every 10 projects
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${gitlabProjects.length} projects processed`);
      }
      
      // Add delay between requests to avoid rate limiting (200ms)
      if (i < gitlabProjects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`✅ Processed all ${gitlabProjects.length} projects with member data`);
    
    // Step 3: Save to registry
    await syncProjectsToRegistry(registryData);
    
    // Step 4: Auto-map SonarCloud project keys
    try {
      await autoMapSonarProjectKeys();
      console.log('✅ Auto-mapped SonarCloud project keys');
    } catch (e) {
      console.warn('⚠️ Failed to auto-map SonarCloud keys:', (e as any).message);
    }
    
    // Step 5: Get final updated projects from registry
    const dbProjects = await getAllProjectsFromRegistry();
    
    // Step 6: Transform to API response format
    return projectTransformService.toApiResponseList(dbProjects);
  };

  /**
   * Sync a single project from GitLab to registry (basic info only)
   */
  syncProject = async (projectId: number) => {
    // Step 1: Fetch project from GitLab
    const gitlabProject = await gitlabProjectService.getProjectById(projectId);
    
    // Step 2: Extract basic info for registry and include member info
    const members = await gitLabMemberService.getProjectMembers(gitlabProject.id).catch(() => []);

    const registryData = {
      id: gitlabProject.id,
      name: gitlabProject.name,
      full_path: gitlabProject.path_with_namespace,
      group_path: gitlabProject.namespace?.full_path,
      members_count: members.length,
      members: members,
      last_activity_at: gitlabProject.last_activity_at,
      parent_id: gitlabProject.namespace?.id,
      visibility: gitlabProject.visibility,
    };
    
    // Step 3: Save to registry
    await syncProjectsToRegistry([registryData]);
    
    // Step 4: Auto-map SonarCloud project keys
    try {
      await autoMapSonarProjectKeys();
    } catch (e) {
      console.warn('⚠️ Failed to auto-map SonarCloud keys:', (e as any).message);
    }
    
    // Step 5: Get updated project from registry
    const dbProjects = await getAllProjectsFromRegistry();
    const updatedProject = dbProjects.find(p => p.id === projectId);
    
    if (!updatedProject) {
      throw new Error('Project not found after sync');
    }
    
    // Step 6: Transform to API response format
    return projectTransformService.toApiResponse(updatedProject);
  };

  // Note: getProjectsFromDatabase was removed because it was unused.
  // If you need to expose cached registry projects via this service in the future,
  // re-add a method that calls `getAllProjectsFromRegistry()` and transforms the result.
}

export default new ProjectSyncService();
