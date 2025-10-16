// Service for fetching projects from DATABASE (not GitLab API)
// Used for page loads - fast and no API rate limits
import { getAllProjectsFromDB, getTrackedProjectIds } from '../../db/queries';
import projectTransformService from './projectTransformService';

class ProjectFetchService {
  /**
   * Get all projects from database with tracked status
   * NO GitLab API calls - purely database fetch
   * Used for: Page loads, refreshes, navigation
   */
  getAllProjectsFromDB = async () => {
    const [dbProjects, trackedIds] = await Promise.all([
      getAllProjectsFromDB(),
      getTrackedProjectIds(),
    ]);

    const trackedSet = new Set(trackedIds);
    
    // Transform and add tracked status
    const projects = projectTransformService.toApiResponseList(dbProjects);
    return projects.map((project) => ({
      ...project,
      tracked: trackedSet.has(project.id),
    }));
  };

  /**
   * Get only tracked projects from database
   * NO GitLab API calls - purely database fetch
   * Used for: Tracked Projects page
   */
  getTrackedProjectsFromDB = async () => {
    const allProjects = await this.getAllProjectsFromDB();
    return allProjects.filter((project) => project.tracked);
  };
}

export default new ProjectFetchService();