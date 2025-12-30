// DORA Metrics Routes
// Routes for manual DORA metrics input

import { Router } from 'express';
import {
  createDeploymentFrequency,
  createLeadTimeChange,
  createChangeFailureRate,
  createTimeToRestoreService,
  getDeploymentFrequency,
  getLeadTimeChanges,
  getChangeFailureRates,
  getTimeToRestoreServices,
  getDoraMetricsSummary,
  deleteDeploymentFrequencyRecord,
  deleteLeadTimeChangeRecord,
  deleteChangeFailureRateRecord,
  deleteTimeToRestoreServiceRecord,
  searchDeployments,
  getWeeklySnapshots,
  manualCaptureLastWeek,
} from '../controllers/doraMetricsController';

const router = Router();

// Create/Save endpoints
router.post('/projects/:id/dora/deployment', createDeploymentFrequency);
router.post('/projects/:id/dora/leadtime', createLeadTimeChange);
router.post('/projects/:id/dora/failure', createChangeFailureRate);
router.post('/projects/:id/dora/restore', createTimeToRestoreService);

// Get/Fetch endpoints
router.get('/projects/:id/dora/deployment/search', searchDeployments);
router.get('/projects/:id/dora/deployment', getDeploymentFrequency);
router.get('/projects/:id/dora/leadtime', getLeadTimeChanges);
router.get('/projects/:id/dora/failure', getChangeFailureRates);
router.get('/projects/:id/dora/restore', getTimeToRestoreServices);

// Summary endpoint
router.get('/projects/:id/dora/summary', getDoraMetricsSummary);

// Weekly snapshots endpoint
router.get('/projects/:id/dora/weekly-snapshots', getWeeklySnapshots);

// Manual capture endpoint (for testing/admin)
router.post('/dora/capture-last-week', manualCaptureLastWeek);

// Delete endpoints
router.delete('/projects/:id/dora/deployment/:uuid', deleteDeploymentFrequencyRecord);
router.delete('/projects/:id/dora/leadtime/:uuid', deleteLeadTimeChangeRecord);
router.delete('/projects/:id/dora/failure/:uuid', deleteChangeFailureRateRecord);
router.delete('/projects/:id/dora/restore/:uuid', deleteTimeToRestoreServiceRecord);

export default router;
