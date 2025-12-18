// Milestone Metrics Controller
// Handles HTTP requests for milestone metrics

import { Request, Response } from 'express';
import milestoneMetricsSyncService from '../services/milestoneMetrics/milestoneMetricsSyncService';
import milestoneMetricsDbService from '../services/milestoneMetrics/milestoneMetricsDbService';

/**
 * Refresh milestone metrics for a project
 * POST /projects/:id/milestone-metrics/refresh
 */
export const refreshMilestoneMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    console.log(`[MilestoneMetricsController] Refresh requested for project ${projectId}`);

    // Trigger sync
    const metrics = await milestoneMetricsSyncService.syncMilestoneMetrics(projectId);

    res.json({
      success: true,
      message: 'Milestone metrics refreshed successfully',
      data: metrics,
    });
  } catch (error) {
    console.error('[MilestoneMetricsController] Error refreshing metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh milestone metrics',
    });
  }
};

/**
 * Get current milestone metrics for a project
 * GET /projects/:id/milestone-metrics
 */
export const getMilestoneMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    console.log(`[MilestoneMetricsController] Get metrics requested for project ${projectId}`);

    const metrics = await milestoneMetricsDbService.getMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Milestone metrics not found. Please refresh metrics first.',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[MilestoneMetricsController] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get milestone metrics',
    });
  }
};
