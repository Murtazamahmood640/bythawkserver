import express from 'express';
import { checkIn, checkOut, getTodayStatus, getMyAttendance, getAttendanceLogs } from '../controllers/attendanceController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/checkin', checkIn);
router.put('/checkout', checkOut);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);
router.get('/logs', requireRole('super_admin', 'manager'), getAttendanceLogs);

export default router;
