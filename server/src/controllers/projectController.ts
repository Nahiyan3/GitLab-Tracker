// Controllers handle HTTP requests and responses
import { Request, Response } from 'express';
import gitlabService from '../services/gitlabService';
import { ApiResponse } from '../types';
import { trackProject, untrackProject, getTrackedProjectIds, syncProjects, getAllProjectsFromDB } from '../db/queries';

class ProjectController {

  /**
   * Get all projects from database (with cached data)
   */
  getProjectsFromDB = async (req: Request, res: Response) => {
    try {
      const dbProjects = await getAllProjectsFromDB();
      
      const response: ApiResponse<any> = {
        success: true,
        data: dbProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          web_url: p.web_url,
          last_activity_at: p.last_activity_at,
          visibility: p.visibility,
          star_count: p.star_count,
          forks_count: p.forks_count,
          parent_id: p.parent_id,
          groupPath: p.group_path,
          fullPath: p.full_path,
          isTracked: p.tracked,
          synced_at: p.synced_at,
        })),
        message: `Retrieved ${dbProjects.length} projects from database`
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to retrieve projects from database'
      };
      res.status(500).json(response);
    }
  };

  /**
   * Sync projects from GitLab to database
   */
  syncProjectsFromGitLab = async (req: Request, res: Response) => {
    try {
      const gitlabProjects = await gitlabService.getUserProjects();
      
      // Build projects with group hierarchy and sync to database
      const projectsToSync = await Promise.all(
        gitlabProjects.map(async (project) => {
          let groupPath = '';
          
          // Build the group hierarchy path if project has a parent group
          if (project.namespace?.id && project.namespace.kind === 'group') {
            groupPath = await gitlabService.buildGroupPath(project.namespace.id);
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
          };
        })
      );
      
      // Sync all GitLab projects to database
      await syncProjects(projectsToSync);
      
      // Get updated projects from database
      const dbProjects = await getAllProjectsFromDB();
      
      const response: ApiResponse<any> = {
        success: true,
        data: dbProjects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          web_url: p.web_url,
          last_activity_at: p.last_activity_at,
          visibility: p.visibility,
          star_count: p.star_count,
          forks_count: p.forks_count,
          parent_id: p.parent_id,
          groupPath: p.group_path,
          fullPath: p.full_path,
          isTracked: p.tracked,
          synced_at: p.synced_at,
        })),
        message: `Synced ${gitlabProjects.length} projects from GitLab`
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to sync projects from GitLab'
      };
      res.status(500).json(response);
    }
  };

  /**
   * Sync a single project from GitLab by ID
   */
  syncSingleProject = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const projectId = Number(id);

      if (!projectId || isNaN(projectId)) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Invalid project ID'
        };
        return res.status(400).json(response);
      }

      // Fetch single project from GitLab
      const gitlabProject = await gitlabService.getProjectById(projectId);
      
      // Build group hierarchy path
      let groupPath = '';
      if (gitlabProject.namespace?.id && gitlabProject.namespace.kind === 'group') {
        groupPath = await gitlabService.buildGroupPath(gitlabProject.namespace.id);
      }

      // Sync project to database
      const projectToSync = {
        id: gitlabProject.id,
        name: gitlabProject.name,
        description: gitlabProject.description || undefined,
        web_url: gitlabProject.web_url,
        last_activity_at: gitlabProject.last_activity_at,
        visibility: gitlabProject.visibility,
        star_count: gitlabProject.star_count,
        forks_count: gitlabProject.forks_count,
        parent_id: gitlabProject.namespace?.id,
        group_path: groupPath || undefined,
        full_path: groupPath ? `${gitlabProject.name}/${groupPath}` : gitlabProject.name,
      };

      const syncedProject = await syncProjects([projectToSync]);
      
      // Get updated project from database
      const dbProjects = await getAllProjectsFromDB();
      const updatedProject = dbProjects.find(p => p.id === projectId);

      const response: ApiResponse<any> = {
        success: true,
        data: updatedProject ? {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
          web_url: updatedProject.web_url,
          last_activity_at: updatedProject.last_activity_at,
          visibility: updatedProject.visibility,
          star_count: updatedProject.star_count,
          forks_count: updatedProject.forks_count,
          parent_id: updatedProject.parent_id,
          groupPath: updatedProject.group_path,
          fullPath: updatedProject.full_path,
          isTracked: updatedProject.tracked,
          synced_at: updatedProject.synced_at,
        } : null,
        message: `Project "${gitlabProject.name}" synced successfully`
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to sync project from GitLab'
      };
      res.status(500).json(response);
    }
  };

  getAllProjects = async (req: Request, res: Response) => {
    try {
      const gitlabProjects = await gitlabService.getUserProjects();
      
      // Sync all GitLab projects to database
      await syncProjects(
        gitlabProjects.map(p => ({
          id: p.id,
          name: p.name,
          parent_id: p.namespace?.id
        }))
      );
      
      // Get tracked project IDs after sync
      const trackedIds = await getTrackedProjectIds();
      
      // Build projects with group hierarchy
      const projects = await Promise.all(
        gitlabProjects.map(async (project) => {
          let groupPath = '';
          
          // Build the group hierarchy path if project has a parent group
          if (project.namespace?.id && project.namespace.kind === 'group') {
            groupPath = await gitlabService.buildGroupPath(project.namespace.id);
          }
          
          return {
            id: project.id,
            name: project.name,
            description: project.description,
            web_url: project.web_url,
            last_activity_at: project.last_activity_at,
            visibility: project.visibility,
            star_count: project.star_count,
            forks_count: project.forks_count,
            parent_id: project.namespace?.id,
            groupPath: groupPath,
            fullPath: groupPath ? `${project.name}/${groupPath}` : project.name,
            isTracked: trackedIds.includes(project.id),
          };
        })
      );
      
      const response: ApiResponse<any> = {
        success: true,
        data: projects,
        message: `Retrieved ${projects.length} projects successfully`
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to retrieve projects from GitLab'
      };
      res.status(500).json(response);
    }
  };

  trackProjectHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Project id is required'
        };
        return res.status(400).json(response);
      }

      const trackedProject = await trackProject(id);
      
      if (!trackedProject) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Project not found in database. Please refresh the page.'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: trackedProject,
        message: `Project "${trackedProject.name}" is now tracked`
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to track project'
      };
      res.status(500).json(response);
    }
  };

  untrackProjectHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const success = await untrackProject(Number(id));
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Project not found or already untracked'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<any> = {
        success: true,
        data: { id: Number(id) },
        message: 'Project untracked successfully'
      };
      
      res.json(response);
    } catch (error: any) {
      const response: ApiResponse<null> = {
        success: false,
        error: error.message,
        message: 'Failed to untrack project'
      };
      res.status(500).json(response);
    }
  };

getProjectGroupsHandler = async (req: Request, res: Response) => {
    try {
            const groups = await gitlabService.getAllGroups();
            
            // Map to return only id and name
            const simplifiedGroups = groups.map(group => ({
                    id: group.id,
                    name: group.name
            }));
            
            const response: ApiResponse<any> = {
                    success: true,
                    data: simplifiedGroups,
                    message: `Retrieved ${simplifiedGroups.length} groups successfully`
            };
            res.json(response);
    }
    catch (error: any) {
            const response: ApiResponse<null> = {
                    success: false,
                    error: error.message,
                    message: 'Failed to retrieve groups from GitLab'
            };
            res.status(500).json(response);
    }
}
}
export default new ProjectController();
