// SonarQube Security Metrics Controller
// HTTP request handlers for SonarQube security metrics endpoints

import { Request, Response } from 'express';
import { SonarSecuritySyncService } from '../services/sonarSecurity/sonarSecuritySyncService';
import { SonarSecurityDbService } from '../services/sonarSecurity/sonarSecurityDbService';

/**
 * POST /api/projects/:id/sonarqube/security/refresh
 * Refresh security metrics for a project
 */
export const refreshSecurityMetrics = async (req: Request, res: Response) => {
  const syncService = new SonarSecuritySyncService();
  const dbService = new SonarSecurityDbService();
  try {
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid project ID' 
      });
    }

    console.log(`[SonarSecurityController] Refreshing metrics for project ${projectId}`);

    await syncService.syncSecurityMetrics(projectId);
    const metrics = await dbService.getMetrics(projectId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarSecurityController] Error refreshing metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh security metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/security
 * Get latest security metrics for a project
 */
export const getSecurityMetrics = async (req: Request, res: Response) => {
  const dbService = new SonarSecurityDbService();
  
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
        error: 'No security metrics found for this project',
      });
    }

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[SonarSecurityController] Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security metrics',
      message: error.message,
    });
  }
};

/**
 * GET /api/projects/:id/sonarqube/security/history
 * Get security metrics history for a project
 */
export const getSecurityMetricsHistory = async (req: Request, res: Response) => {
  const dbService = new SonarSecurityDbService();
  
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
    console.error('[SonarSecurityController] Error fetching metrics history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security metrics history',
      message: error.message,
    });
  }
};
