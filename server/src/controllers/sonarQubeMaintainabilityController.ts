// SonarQube Maintainability Metrics Controller
// HTTP request handlers for SonarQube maintainability metrics endpoints
// Follows the same pattern as issueMetricsController.ts, mrMetricsController.ts, and commitMetricsController.ts

import { Request, Response } from 'express';
import { SonarMaintainabilitySyncService } from '../services/sonarMaintainability/sonarMaintainabilitySyncService';
import { SonarMaintainabilityDbService } from '../services/sonarMaintainability/sonarMaintainabilityDbService';

/**
 * POST /api/projects/:id/sonarqube/maintainability/refresh
 * Refresh maintainability metrics for a project
 */
export const refreshMaintainabilityMetrics = async (req: Request, res: Response) => {
  const syncService = new SonarMaintainabilitySyncService();
  const dbService = new SonarMaintainabilityDbService();
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      });
    }

    console.log(`[SonarQubeMaintainabilityController] Refreshing metrics for project ${projectId}`);

    await syncService.syncMaintainabilityMetrics(projectId);
    const metrics = await dbService.getMetrics(projectId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarQubeMaintainabilityController] Error refreshing metrics:', error);
    console.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh maintainability metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/maintainability
 * Get latest maintainability metrics for a project
 */
export const getMaintainabilityMetrics = async (req: Request, res: Response) => {
  const dbService = new SonarMaintainabilityDbService();
  
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const metrics = await dbService.getMetrics(projectId);

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'No maintainability metrics found for this project',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarQubeMaintainabilityController] Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintainability metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/maintainability/history
 * Get maintainability metrics history for a project
 */
export const getMaintainabilityMetricsHistory = async (req: Request, res: Response) => {
  const dbService = new SonarMaintainabilityDbService();
  
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID',
      });
    }

    const history = await dbService.getMetricsHistory(projectId, days);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('[SonarQubeMaintainabilityController] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintainability metrics history',
      message: error.message,
    });
  }
};
