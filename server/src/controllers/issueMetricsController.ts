// Issue Metrics Controller
// Handles HTTP requests for issue metrics

import { Request, Response } from 'express';
import issueMetricsSyncService from '../services/issueMetrics/issueMetricsSyncService';
import issueMetricsDbService from '../services/issueMetrics/issueMetricsDbService';

/**
 * Refresh issue metrics for a project
 * POST /projects/:id/issue-metrics/refresh
 */
export const refreshIssueMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    console.log(`[IssueMetricsController] Refresh requested for project ${projectId}`);

    // Trigger sync
    const metrics = await issueMetricsSyncService.syncIssueMetrics(projectId);

    res.json({
      success: true,
      message: 'Issue metrics refreshed successfully',
      data: metrics,
    });
  } catch (error) {
    console.error('[IssueMetricsController] Error refreshing metrics:', error);
    console.error('[IssueMetricsController] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh issue metrics',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
};

/**
 * Get current issue metrics for a project
 * GET /projects/:id/issue-metrics
 */
export const getIssueMetrics = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const metrics = await issueMetricsDbService.getMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this project. Please refresh metrics first.',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('[IssueMetricsController] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get issue metrics',
    });
  }
};

/**
 * Get issue metrics trends (week-over-week comparison)
 * GET /projects/:id/issue-metrics/trends
 */
export const getIssueMetricsTrends = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    // Get current metrics
    const currentMetrics = await issueMetricsDbService.getMetrics(projectId);

    if (!currentMetrics) {
      return res.status(404).json({
        success: false,
        error: 'No metrics found for this project. Please refresh metrics first.',
      });
    }

    // Get week-over-week comparison
    const trends = await issueMetricsDbService.getWeekOverWeekTrends(projectId);

    // Get historical data (last 30 days)
    const history = await issueMetricsDbService.getMetricsHistory(projectId, 30);

    res.json({
      success: true,
      data: {
        current: currentMetrics,
        weekOverWeek: trends,
        history,
      },
    });
  } catch (error) {
    console.error('[IssueMetricsController] Error getting trends:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get issue metrics trends',
    });
  }
};

/**
 * Get issue metrics history
 * GET /projects/:id/issue-metrics/history
 */
export const getIssueMetricsHistory = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const history = await issueMetricsDbService.getMetricsHistory(projectId, days);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('[IssueMetricsController] Error getting history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get issue metrics history',
    });
  }
};
