import express from 'express';
import { createTask, getMyTasks, getAllTasks, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/my', getMyTasks);

router.route('/')
  .get(getAllTasks)
  .post(requireRole('super_admin', 'manager'), createTask);

router.route('/:id')
  .put(updateTask)
  .delete(requireRole('super_admin', 'manager'), deleteTask);

export default router;
