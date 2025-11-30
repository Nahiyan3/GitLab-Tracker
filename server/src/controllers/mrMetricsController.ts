// MR Metrics Controller
// HTTP request handlers for MR metrics endpoints
// Follows the same pattern as issueMetricsController.ts

import { Request, Response } from 'express';
import mrMetricsSyncService from '../services/mrMetrics/mrMetricsSyncService';
import mrMetricsDbService from '../services/mrMetrics/mrMetricsDbService';

/**
 * Refresh MR metrics for a project (trigger calculation)
 * POST /api/projects/:id/mr-metrics/refresh
 */
export const refreshMRMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    console.log(`[MRMetricsController] Refreshing MR metrics for project ${projectId}`);

    const metrics = await mrMetricsSyncService.syncMRMetrics(projectId);

    res.json({
      success: true,
      data: metrics,
      message: 'MR metrics refreshed successfully',
    });
  } catch (error: any) {
    console.error('[MRMetricsController] Error refreshing MR metrics:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh MR metrics',
      details: error.message,
    });
  }
};

/**
 * Get latest MR metrics for a project
 * GET /api/projects/:id/mr-metrics
 */
export const getMRMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const metrics = await mrMetricsDbService.getMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No MR metrics found for this project',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[MRMetricsController] Error getting MR metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MR metrics',
      details: error.message,
    });
  }
};

/**
 * Get MR metrics trends (week-over-week comparison)
 * GET /api/projects/:id/mr-metrics/trends
 */
export const getMRMetricsTrends = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const trends = await mrMetricsDbService.getWeekOverWeekTrends(projectId);

    if (!trends) {
      return res.status(404).json({
        success: false,
        error: 'No trend data available for this project',
      });
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    console.error('[MRMetricsController] Error getting MR metrics trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MR metrics trends',
      details: error.message,
    });
  }
};

/**
 * Get MR metrics history for a project
 * GET /api/projects/:id/mr-metrics/history
 */
export const getMRMetricsHistory = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const history = await mrMetricsDbService.getMetricsHistory(projectId, days);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('[MRMetricsController] Error getting MR metrics history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MR metrics history',
      details: error.message,
    });
  }
};
