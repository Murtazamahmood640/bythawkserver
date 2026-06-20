import express from 'express';
import { submitLeave, getMyLeaves, getAllLeaves, reviewLeave, getMyQuota, updateQuota } from '../controllers/leaveController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .post(submitLeave)
  .get(requireRole('super_admin', 'manager'), getAllLeaves);

router.get('/my', getMyLeaves);
router.get('/my-quota', getMyQuota);
router.put('/:id/review', requireRole('super_admin', 'manager'), reviewLeave);
router.put('/quota/:id', requireRole('super_admin', 'manager'), updateQuota);

export default router;
