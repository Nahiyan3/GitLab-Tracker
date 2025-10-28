// Service for fetching projects from DATABASE (not GitLab API)
// Used for page loads - fast and no API rate limits
import { getAllProjectsFromRegistry, getLatestSnapshotsForTrackedProjects } from '../../db/queries';
import projectTransformService from './projectTransformService';

class ProjectFetchService {
  /**
   * Get all projects from registry (for All Projects page)
   * NO GitLab API calls - purely database fetch from projects table
   * Used for: All Projects page load
   */
  getAllProjectsFromDB = async () => {
    const dbProjects = await getAllProjectsFromRegistry();
    return projectTransformService.toApiResponseList(dbProjects);
  };

  /**
   * Get latest snapshots for tracked projects (for Tracked Projects page)
   * NO GitLab API calls - purely database fetch
   * Joins projects + latest snapshot per project
   * Used for: Tracked Projects page
   */
  getTrackedProjectsFromDB = async () => {
    const latestSnapshots = await getLatestSnapshotsForTrackedProjects();
    return projectTransformService.toApiResponseList(latestSnapshots);
  };
}

export default new ProjectFetchService();