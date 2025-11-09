import { Router } from 'express';
import projectController from '../controllers/projectController';
import aiController from '../controllers/aiController';
import gitlabAuthService from '../services/gitlab/gitlabAuthService';
import trackingRoutes from './trackingRoutes';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// GitLab connection test
router.get('/gitlab/verify', async (req, res) => {
  try {
    const isConnected = await gitlabAuthService.verifyConnection();
    res.json({ connected: isConnected });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Project routes
router.get('/projects/db', projectController.getProjectsFromDB);
router.post('/projects/sync', projectController.syncProjectsFromGitLab);
router.post('/projects/sync/:id', projectController.syncSingleProject);
router.post('/projects/refresh/:id', projectController.refreshSingleProject);
router.post('/projects/refresh-all', projectController.refreshAllTrackedProjects);
router.post('/projects/track', projectController.trackProjectHandler);
router.patch('/projects/untrack/:id', projectController.untrackProjectHandler);
router.get('/projects/groups', projectController.getProjectGroupsHandler);
router.get('/projects/:id/members', projectController.getProjectMembersHandler);

// Tracking routes (for Tracked Projects page)
router.use('/tracking', trackingRoutes);

// AI routes (for Gemini AI testing)
router.get('/ai/test', aiController.testConnection);
router.post('/ai/generate-text', aiController.generateText);
router.post('/ai/generate-with-pdf', aiController.generateWithPDF);
router.post('/ai/project-insights', aiController.generateProjectInsights);

export default router;
