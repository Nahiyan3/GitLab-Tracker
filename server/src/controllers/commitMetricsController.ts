// Commit Metrics Controller
// HTTP request handlers for commit metrics endpoints
// Follows the same pattern as issueMetricsController.ts and mrMetricsController.ts

import { Request, Response } from 'express';
import commitMetricsSyncService from '../services/commitMetrics/commitMetricsSyncService';
import commitMetricsDbService from '../services/commitMetrics/commitMetricsDbService';

/**
 * POST /api/projects/:id/commit-metrics/refresh
 * Refresh commit metrics for a project
 */
export const refreshCommitMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    console.log(`[CommitMetricsController] Refreshing metrics for project ${projectId}`);

    const metrics = await commitMetricsSyncService.syncCommitMetrics(projectId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[CommitMetricsController] Error refreshing metrics:', error);
    console.error(error.stack);
    res.status(500).json({
      error: 'Failed to refresh commit metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/commit-metrics
 * Get latest commit metrics for a project
 */
export const getCommitMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const metrics = await commitMetricsDbService.getMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No commit metrics found for this project. Please refresh metrics first.',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[CommitMetricsController] Error getting commit metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get commit metrics',
    });
  }
};

/**
 * GET /api/projects/:id/commit-metrics/history
 * Get commit metrics history for a project
 */
export const getCommitMetricsHistory = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const history = await commitMetricsDbService.getMetricsHistory(projectId, days);

    res.json(history);
  } catch (error: any) {
    console.error('[CommitMetricsController] Error getting commit metrics history:', error);
    res.status(500).json({
      error: 'Failed to get commit metrics history',
      message: error.message,
    });
  }
};
