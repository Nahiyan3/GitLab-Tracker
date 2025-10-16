// Routes for Tracked Projects page
import { Router } from 'express';
import projectController from '../controllers/projectController';

const router = Router();

/**
 * @route   GET /api/tracking
 * @desc    Get all tracked projects with their statistics (reuses project controller logic)
 * @access  Public
 */
router.get('/', projectController.getProjectsFromDB);

/**
 * @route   POST /api/tracking/sync
 * @desc    Sync statistics for all tracked projects from GitLab (reuses sync logic)
 * @access  Public
 */
router.post('/sync', projectController.syncProjectsFromGitLab);

/**
 * @route   POST /api/tracking/sync/:id
 * @desc    Sync statistics for a single tracked project (reuses single sync logic)
 * @access  Public
 */
router.post('/sync/:id', projectController.syncSingleProject);

export default router;
