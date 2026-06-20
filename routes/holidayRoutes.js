import express from 'express';
import { getHolidays, createHoliday, deleteHoliday } from '../controllers/holidayController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getHolidays)
  .post(requireRole('super_admin'), createHoliday);

router.route('/:id')
  .delete(requireRole('super_admin'), deleteHoliday);

export default router;
