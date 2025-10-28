// Controllers handle HTTP requests and responses
import { Request, Response } from 'express';
import { trackProject, untrackProject } from '../db/queries';
import projectSyncService from '../services/project/projectSyncService';
import projectFetchService from '../services/project/projectFetchService';
import projectRefreshService from '../services/project/projectRefreshService';
import gitlabGroupService from '../services/gitlab/gitlabGroupService';
import gitLabMemberService from '../services/gitlab/gitLabMemberService';

class ProjectController {

  /**
   * Get all projects from database (with cached data)
   * FAST - no GitLab API calls
   */
  getProjectsFromDB = async (req: Request, res: Response) => {
    try {
      const projects = await projectFetchService.getAllProjectsFromDB();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Get tracked projects with latest snapshots
   * FAST - no GitLab API calls
   */
  getTrackedProjectsFromDB = async (req: Request, res: Response) => {
    try {
      const projects = await projectFetchService.getTrackedProjectsFromDB();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Sync projects from GitLab to database (updates registry only)
   * SLOW - calls GitLab API, updates DB
   */
  syncProjectsFromGitLab = async (req: Request, res: Response) => {
    try {
      const projects = await projectSyncService.syncAllProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Sync a single project from GitLab by ID (updates registry only)
   * SLOW - calls GitLab API, updates DB
   */
  syncSingleProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectId = Number(id);

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      const project = await projectSyncService.syncProject(projectId);
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Refresh a single tracked project (create new snapshot)
   * SLOW - calls GitLab API + SonarCloud, creates snapshot
   */
  refreshSingleProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectId = Number(id);

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      await projectRefreshService.refreshProject(projectId);
      res.json({ success: true, id: projectId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  /**
   * Refresh all tracked projects (create new snapshots for all)
   * SLOW - calls GitLab API + SonarCloud for all tracked projects
   */
  refreshAllTrackedProjects = async (req: Request, res: Response) => {
    try {
      await projectRefreshService.refreshAllTrackedProjects();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };



  trackProjectHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Project id is required' });
      }

      const trackedProject = await trackProject(id);
      
      if (!trackedProject) {
        return res.status(404).json({ error: 'Project not found in database. Please refresh the page.' });
      }
      
      res.json(trackedProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  untrackProjectHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const success = await untrackProject(Number(id));
      
      if (!success) {
        return res.status(404).json({ error: 'Project not found or already untracked' });
      }
      
      res.json({ id: Number(id) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

getProjectGroupsHandler = async (req: Request, res: Response) => {
    try {
            const groups = await gitlabGroupService.getAllGroups();
            
            // Map to return only id and name
            const simplifiedGroups = groups.map(group => ({
                    id: group.id,
                    name: group.name
            }));
            
            res.json(simplifiedGroups);
    }
    catch (error: any) {
            res.status(500).json({ error: error.message });
    }
}

  /**
   * Get members for a project by calling GitLab API (no DB persistence)
   */
  getProjectMembersHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectId = Number(id);

      if (!projectId || isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }

      const members = await gitLabMemberService.getProjectMembers(projectId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
export default new ProjectController();
