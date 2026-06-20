import express from 'express';
import { getProjects, createProject, getProjectById, updateProject, deleteProject, getProjectTasks } from '../controllers/projectController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(requireRole('super_admin', 'manager'), createProject);

router.route('/:id')
  .get(getProjectById)
  .put(requireRole('super_admin', 'manager'), updateProject)
  .delete(requireRole('super_admin'), deleteProject);

router.get('/:id/tasks', getProjectTasks);

export default router;
