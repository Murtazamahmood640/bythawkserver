import express from 'express';
import { getOverview, getTaskCompletion, getAttendanceSummary, getTicketStats } from '../controllers/analyticsController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect, requireRole('super_admin', 'manager'));

router.get('/overview', getOverview);
router.get('/task-completion', getTaskCompletion);
router.get('/attendance-summary', getAttendanceSummary);
router.get('/ticket-stats', getTicketStats);

export default router;
