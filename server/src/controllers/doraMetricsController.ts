// DORA Metrics Controller
// Handles HTTP requests for DORA metrics

import { Request, Response } from 'express';
import {
  saveDeploymentFrequency,
  saveLeadTimeChange,
  saveChangeFailureRate,
  saveTimeToRestoreService,
  getDeploymentFrequencyByProject,
  getLeadTimeChangesByProject,
  getChangeFailureRateByProject,
  getTimeToRestoreServiceByProject,
  deleteDeploymentFrequency,
  deleteLeadTimeChange,
  deleteChangeFailureRate,
  deleteTimeToRestoreService,
  searchDeploymentsByIdPrefix,
} from '../services/doraMetrics/doraMetricsDbService';
import { calculateDoraMetricsSummary } from '../services/doraMetrics/doraMetricsCalculationService';
import { 
  getWeeklySnapshotsForProject,
  captureLastWeekSnapshots 
} from '../services/doraMetrics/weeklyDoraSnapshotService';
import { getDoraTrends } from '../services/doraMetrics/doraTrendsService';

/**
 * POST /projects/:id/dora/deployment
 * Save a deployment frequency record
 */
export const createDeploymentFrequency = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { deployment_id, version, environment, deployment_timestamp } = req.body;

    // Validation
    if (!deployment_id || !deployment_timestamp) {
      return res.status(400).json({
        success: false,
        error: 'deployment_id and deployment_timestamp are required',
      });
    }

    const data = {
      project_id: projectId,
      deployment_id,
      version,
      environment: environment || 'production',
      deployment_timestamp,
    };

    const result = await saveDeploymentFrequency(data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Deployment logged successfully',
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error saving deployment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save deployment',
    });
  }
};

/**
 * POST /projects/:id/dora/leadtime
 * Save a lead time change record
 */
export const createLeadTimeChange = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { change_id, merged_timestamp, deployed_timestamp } = req.body;

    // Validation
    if (!change_id || !merged_timestamp || !deployed_timestamp) {
      return res.status(400).json({
        success: false,
        error: 'change_id, merged_timestamp, and deployed_timestamp are required',
      });
    }

    // Validate timestamps
    const mergedTime = new Date(merged_timestamp);
    const deployedTime = new Date(deployed_timestamp);

    if (deployedTime <= mergedTime) {
      return res.status(400).json({
        success: false,
        error: 'deployed_timestamp must be after merged_timestamp',
      });
    }

    const data = {
      project_id: projectId,
      change_id,
      merged_timestamp,
      deployed_timestamp,
    };

    const result = await saveLeadTimeChange(data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Lead time data logged successfully',
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error saving lead time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save lead time data',
    });
  }
};

/**
 * POST /projects/:id/dora/failure
 * Save a change failure rate record
 */
export const createChangeFailureRate = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { deployment_id, deployment_timestamp, has_incident, remediation_type } = req.body;

    // Validation
    if (!deployment_id || !deployment_timestamp || has_incident === undefined) {
      return res.status(400).json({
        success: false,
        error: 'deployment_id, deployment_timestamp, and has_incident are required',
      });
    }

    const data = {
      project_id: projectId,
      deployment_id,
      deployment_timestamp,
      has_incident,
      remediation_type: remediation_type || 'none',
    };

    const result = await saveChangeFailureRate(data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Failure data logged successfully',
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error saving failure data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save failure data',
    });
  }
};

/**
 * POST /projects/:id/dora/restore
 * Save a time to restore service record
 */
export const createTimeToRestoreService = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { incident_id, start_time, end_time, description } = req.body;

    // Validation
    if (!incident_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'incident_id, start_time, and end_time are required',
      });
    }

    // Validate timestamps
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: 'end_time must be after start_time',
      });
    }

    const data = {
      project_id: projectId,
      incident_id,
      start_time,
      end_time,
      description,
    };

    const result = await saveTimeToRestoreService(data);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Incident restore time logged successfully',
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error saving restore time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save restore time',
    });
  }
};

/**
 * GET /projects/:id/dora/deployment
 * Get deployment frequency records for a project
 */
export const getDeploymentFrequency = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    const data = await getDeploymentFrequencyByProject(projectId, days);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deployments',
    });
  }
};

/**
 * GET /projects/:id/dora/leadtime
 * Get lead time change records for a project
 */
export const getLeadTimeChanges = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    const data = await getLeadTimeChangesByProject(projectId, days);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching lead times:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch lead times',
    });
  }
};

/**
 * GET /projects/:id/dora/failure
 * Get change failure rate records for a project
 */
export const getChangeFailureRates = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    const data = await getChangeFailureRateByProject(projectId, days);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching failure rates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch failure rates',
    });
  }
};

/**
 * GET /projects/:id/dora/restore
 * Get time to restore service records for a project
 */
export const getTimeToRestoreServices = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const days = parseInt(req.query.days as string) || 30;

    const data = await getTimeToRestoreServiceByProject(projectId, days);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching restore times:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch restore times',
    });
  }
};

/**
 * GET /projects/:id/dora/summary
 * Get DORA metrics summary for a project
 */
export const getDoraMetricsSummary = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    // days=0 means all-time, otherwise use the provided value or default to 30
    const daysParam = req.query.days as string;
    const days = daysParam !== undefined ? parseInt(daysParam) : 30;

    const summary = await calculateDoraMetricsSummary(projectId, days);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error calculating summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate DORA metrics summary',
    });
  }
};

/**
 * GET /projects/:id/dora/deployment/search?q=term
 * Search deployments by deployment_id for autocomplete
 */
export const searchDeployments = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const searchTerm = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const data = await searchDeploymentsByIdPrefix(projectId, searchTerm, limit);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error searching deployments:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search deployments',
    });
  }
};

/**
 * DELETE /projects/:id/dora/deployment/:uuid
 * Delete a deployment frequency record
 */
export const deleteDeploymentFrequencyRecord = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const deleted = await deleteDeploymentFrequency(uuid);

    if (deleted) {
      res.json({
        success: true,
        message: 'Deployment record deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Deployment record not found',
      });
    }
  } catch (error) {
    console.error('[DoraMetricsController] Error deleting deployment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete deployment',
    });
  }
};

/**
 * DELETE /projects/:id/dora/leadtime/:uuid
 * Delete a lead time change record
 */
export const deleteLeadTimeChangeRecord = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const deleted = await deleteLeadTimeChange(uuid);

    if (deleted) {
      res.json({
        success: true,
        message: 'Lead time record deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Lead time record not found',
      });
    }
  } catch (error) {
    console.error('[DoraMetricsController] Error deleting lead time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete lead time',
    });
  }
};

/**
 * DELETE /projects/:id/dora/failure/:uuid
 * Delete a change failure rate record
 */
export const deleteChangeFailureRateRecord = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const deleted = await deleteChangeFailureRate(uuid);

    if (deleted) {
      res.json({
        success: true,
        message: 'Failure record deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Failure record not found',
      });
    }
  } catch (error) {
    console.error('[DoraMetricsController] Error deleting failure record:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete failure record',
    });
  }
};

/**
 * DELETE /projects/:id/dora/restore/:uuid
 * Delete a time to restore service record
 */
export const deleteTimeToRestoreServiceRecord = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const deleted = await deleteTimeToRestoreService(uuid);

    if (deleted) {
      res.json({
        success: true,
        message: 'Restore time record deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Restore time record not found',
      });
    }
  } catch (error) {
    console.error('[DoraMetricsController] Error deleting restore time:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete restore time',
    });
  }
};

/**
 * GET /projects/:id/dora/weekly-snapshots
 * Get weekly DORA snapshots for trend analysis
 */
export const getWeeklySnapshots = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 12; // Default 12 weeks

    const snapshots = await getWeeklySnapshotsForProject(projectId, limit);

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching weekly snapshots:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weekly snapshots',
    });
  }
};

/**
 * POST /dora/capture-last-week
 * Manually trigger capture of last week's snapshots (admin/testing)
 */
export const manualCaptureLastWeek = async (req: Request, res: Response) => {
  try {
    await captureLastWeekSnapshots();
    
    res.json({
      success: true,
      message: 'Last week snapshots captured successfully',
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error capturing last week:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to capture last week snapshots',
    });
  }
};

/**
 * GET /projects/:id/dora/trends
 * Get DORA metrics trends (weekly, monthly, or yearly)
 */
export const getDoraTrendsController = async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const granularity = (req.query.granularity as 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const periods = parseInt(req.query.periods as string) || 12;
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate granularity
    if (!['weekly', 'monthly', 'yearly'].includes(granularity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid granularity. Must be weekly, monthly, or yearly',
      });
    }

    console.log(`[DoraMetricsController] Fetching trends for project ${projectId}, granularity: ${granularity}, periods: ${periods}, offset: ${offset}`);

    const trends = await getDoraTrends(projectId, granularity, periods, offset);

    console.log(`[DoraMetricsController] Successfully fetched ${trends.data.length} data points`);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('[DoraMetricsController] Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch DORA trends',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
};
