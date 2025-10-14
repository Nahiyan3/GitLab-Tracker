import { Router } from 'express';
import projectController from '../controllers/projectController';
import gitlabService from '../services/gitlabService';
import { ApiResponse } from '../types';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'ok' },
    message: 'Server is running'
  };
  res.json(response);
});

// GitLab connection test
router.get('/gitlab/verify', async (req, res) => {
  try {
    const isConnected = await gitlabService.verifyConnection();
    const response: ApiResponse<{ connected: boolean }> = {
      success: isConnected,
      data: { connected: isConnected },
      message: isConnected ? 'GitLab connection verified' : 'GitLab connection failed'
    };
    res.json(response);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Project routes
router.get('/projects', projectController.getAllProjects);
router.get('/projects/db', projectController.getProjectsFromDB);
router.post('/projects/sync', projectController.syncProjectsFromGitLab);
router.post('/projects/sync/:id', projectController.syncSingleProject);
router.post('/projects/track', projectController.trackProjectHandler);
router.patch('/projects/untrack/:id', projectController.untrackProjectHandler);
router.get('/projects/groups', projectController.getProjectGroupsHandler);
export default router;
