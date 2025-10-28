// Routes for Tracked Projects page
import { Router } from 'express';
import projectController from '../controllers/projectController';

const router = Router();

/**
 * @route   GET /api/tracking
 * @desc    Get all tracked projects with their latest snapshots
 * @access  Public
 */
router.get('/', projectController.getTrackedProjectsFromDB);

/**
 * @route   POST /api/tracking/refresh-all
 * @desc    Refresh (create new snapshots) for all tracked projects
 * @access  Public
 */
router.post('/refresh-all', projectController.refreshAllTrackedProjects);

/**
 * @route   POST /api/tracking/refresh/:id
 * @desc    Refresh (create new snapshot) for a single tracked project
 * @access  Public
 */
router.post('/refresh/:id', projectController.refreshSingleProject);

export default router;
