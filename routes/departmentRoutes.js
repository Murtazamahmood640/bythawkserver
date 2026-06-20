import express from 'express';
import { getDepartments, createDepartment, getDepartmentById, updateDepartment, deleteDepartment } from '../controllers/departmentController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(requireRole('super_admin', 'manager'), createDepartment);

router.route('/:id')
  .get(getDepartmentById)
  .put(requireRole('super_admin', 'manager'), updateDepartment)
  .delete(requireRole('super_admin'), deleteDepartment);

export default router;
