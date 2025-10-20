// Project Sync Service - orchestrates project syncing workflow
import gitlabProjectService from '../gitlab/gitlabProjectService';
import projectEnrichmentService from './projectEnrichmentService';
import projectTransformService from './projectTransformService';
import { syncProjects as syncProjectsToDb, getAllProjectsFromDB } from '../../db/queries';
import { autoMapSonarProjectKeys } from '../sonarqube/autoMapSonarProjectKeys';

class ProjectSyncService {
  /**
   * Sync all projects from GitLab to database
   */
  syncAllProjects = async () => {
    // Step 1: Fetch all projects from GitLab
    const gitlabProjects = await gitlabProjectService.getUserProjects();
    
    // Step 2: Enrich projects with GitLab data (group paths, issues, MRs) - NO SonarCloud yet
    const enrichedProjects = await projectEnrichmentService.enrichProjects(gitlabProjects);
    
    // Step 3: Save to database (without SonarCloud data)
    await syncProjectsToDb(enrichedProjects);
    
    // Step 4: Auto-map SonarCloud project keys (now projects exist in DB)
    try {
      await autoMapSonarProjectKeys();
      console.log('✅ Auto-mapped SonarCloud project keys');
    } catch (e) {
      console.warn('⚠️ Failed to auto-map SonarCloud keys:', (e as any).message);
    }
    
    // Step 5: Re-enrich with SonarCloud data (now that keys are mapped in DB)
    try {
      const enrichedWithSonar = await projectEnrichmentService.enrichProjects(gitlabProjects);
      await syncProjectsToDb(enrichedWithSonar);
      console.log('✅ Updated projects with SonarCloud metrics');
    } catch (e) {
      console.warn('⚠️ Failed to fetch SonarCloud metrics:', (e as any).message);
    }
    
    // Step 6: Get final updated projects from database
    const dbProjects = await getAllProjectsFromDB();
    
    // Step 7: Transform to API response format
    return projectTransformService.toApiResponseList(dbProjects);
  };

  /**
   * Sync a single project from GitLab to database
   */
  syncProject = async (projectId: number) => {
    // Step 1: Fetch project from GitLab
    const gitlabProject = await gitlabProjectService.getProjectById(projectId);
    
    // Step 2: Enrich project with GitLab data (NO SonarCloud yet)
    const enrichedProject = await projectEnrichmentService.enrichProject(gitlabProject);
    
    // Step 3: Save to database (without SonarCloud data)
    await syncProjectsToDb([enrichedProject]);
    
    // Step 4: Auto-map SonarCloud project keys (now project exists in DB)
    try {
      await autoMapSonarProjectKeys();
    } catch (e) {
      console.warn('⚠️ Failed to auto-map SonarCloud keys:', (e as any).message);
    }
    
    // Step 5: Re-enrich with SonarCloud data (now that key is mapped in DB)
    try {
      const enrichedWithSonar = await projectEnrichmentService.enrichProject(gitlabProject);
      await syncProjectsToDb([enrichedWithSonar]);
    } catch (e) {
      console.warn('⚠️ Failed to fetch SonarCloud metrics:', (e as any).message);
    }
    
    // Step 6: Get updated project from database
    const dbProjects = await getAllProjectsFromDB();
    const updatedProject = dbProjects.find(p => p.id === projectId);
    
    if (!updatedProject) {
      throw new Error('Project not found after sync');
    }
    
    // Step 7: Transform to API response format
    return projectTransformService.toApiResponse(updatedProject);
  };

  /**
   * Get all projects from database (cached data)
   */
  getProjectsFromDatabase = async () => {
    const dbProjects = await getAllProjectsFromDB();
    return projectTransformService.toApiResponseList(dbProjects);
  };
}

export default new ProjectSyncService();
