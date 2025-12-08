import { Router } from 'express';
import projectController from '../controllers/projectController';
import aiController from '../controllers/aiController';
import * as issueMetricsController from '../controllers/issueMetricsController';
import * as mrMetricsController from '../controllers/mrMetricsController';
import * as commitMetricsController from '../controllers/commitMetricsController';
import * as sonarQubeMaintainabilityController from '../controllers/sonarQubeMaintainabilityController';
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
router.get('/projects/dashboard-stats', projectController.getDashboardStatsHandler);
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

// Issue Metrics routes (for Issue Health Metrics)
router.post('/projects/:id/issue-metrics/refresh', issueMetricsController.refreshIssueMetrics);
router.get('/projects/:id/issue-metrics', issueMetricsController.getIssueMetrics);
router.get('/projects/:id/issue-metrics/trends', issueMetricsController.getIssueMetricsTrends);
router.get('/projects/:id/issue-metrics/history', issueMetricsController.getIssueMetricsHistory);

// MR Metrics routes (for MR Health Metrics)
router.post('/projects/:id/mr-metrics/refresh', mrMetricsController.refreshMRMetrics);
router.get('/projects/:id/mr-metrics', mrMetricsController.getMRMetrics);
router.get('/projects/:id/mr-metrics/trends', mrMetricsController.getMRMetricsTrends);
router.get('/projects/:id/mr-metrics/history', mrMetricsController.getMRMetricsHistory);

// Commit Metrics routes (for Commit Health Metrics)
router.post('/projects/:id/commit-metrics/refresh', commitMetricsController.refreshCommitMetrics);
router.get('/projects/:id/commit-metrics', commitMetricsController.getCommitMetrics);
router.get('/projects/:id/commit-metrics/history', commitMetricsController.getCommitMetricsHistory);

// SonarQube Maintainability Metrics routes
router.post('/projects/:id/sonarqube/maintainability/refresh', sonarQubeMaintainabilityController.refreshMaintainabilityMetrics);
router.get('/projects/:id/sonarqube/maintainability', sonarQubeMaintainabilityController.getMaintainabilityMetrics);
router.get('/projects/:id/sonarqube/maintainability/history', sonarQubeMaintainabilityController.getMaintainabilityMetricsHistory);

// AI routes (for Gemini AI testing)
router.get('/ai/test', aiController.testConnection);
router.post('/ai/generate-text', aiController.generateText);
router.post('/ai/generate-with-pdf', aiController.generateWithPDF);
router.post('/ai/project-insights', aiController.generateProjectInsights);
router.get('/ai/project-insights/:projectName', aiController.getProjectInsights);
router.get('/ai/project-insights-history/:projectId', aiController.getProjectInsightsHistoryById);
router.get('/ai/all-project-insights', aiController.getAllProjectInsights);

export default router;
