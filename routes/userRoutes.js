import express from 'express';
import { getUsers, createUser, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(requireRole('super_admin', 'manager'), getUsers)
  .post(requireRole('super_admin', 'manager'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(requireRole('super_admin', 'manager'), updateUser)
  .delete(requireRole('super_admin'), deleteUser);

export default router;
