import express from 'express';
import { getSetupStatus, setupAdmin, login, logout, refreshToken, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/setup-status', getSetupStatus);
router.post('/setup', setupAdmin);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refreshToken);
router.put('/change-password', protect, changePassword);

export default router;
