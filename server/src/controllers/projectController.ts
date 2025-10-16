// Controllers handle HTTP requests and responses
import { Request, Response } from 'express';
import { trackProject, untrackProject } from '../db/queries';
import projectSyncService from '../services/project/projectSyncService';
import projectFetchService from '../services/project/projectFetchService';
import gitlabGroupService from '../services/gitlab/gitlabGroupService';

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
   * Sync projects from GitLab to database
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
   * Sync a single project from GitLab by ID
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
}
export default new ProjectController();
