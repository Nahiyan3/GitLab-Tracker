// SonarQube Reliability Metrics Controller
// HTTP request handlers for SonarQube reliability metrics endpoints

import { Request, Response } from 'express';
import { SonarReliabilitySyncService } from '../services/sonarReliability/sonarReliabilitySyncService';
import { SonarReliabilityDbService } from '../services/sonarReliability/sonarReliabilityDbService';

/**
 * POST /api/projects/:id/sonarqube/reliability/refresh
 * Refresh reliability metrics for a project
 */
export const refreshReliabilityMetrics = async (req: Request, res: Response) => {
  const syncService = new SonarReliabilitySyncService();
  const dbService = new SonarReliabilityDbService();
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      });
    }

    console.log(`[SonarReliabilityController] Refreshing metrics for project ${projectId}`);

    await syncService.syncReliabilityMetrics(projectId);
    const metrics = await dbService.getMetrics(projectId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarReliabilityController] Error refreshing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh reliability metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/reliability
 * Get latest reliability metrics for a project
 */
export const getReliabilityMetrics = async (req: Request, res: Response) => {
  const dbService = new SonarReliabilityDbService();
  
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
        error: 'No reliability metrics found for this project',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarReliabilityController] Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reliability metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/reliability/history
 * Get reliability metrics history for a project
 */
export const getReliabilityMetricsHistory = async (req: Request, res: Response) => {
  const dbService = new SonarReliabilityDbService();
  
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
    console.error('[SonarReliabilityController] Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reliability metrics history',
      message: error.message,
    });
  }
};
