import asyncHandler from '../utils/asyncHandler.js';
import Department from '../models/Department.js';

export const getDepartments = asyncHandler(async (req, res) => {
  const depts = await Department.find()
    .populate('manager', 'name email')
    .populate('createdBy', 'name')
    .sort({ name: 1 });
  res.json(depts);
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, manager } = req.body;
  const dept = await Department.create({ name, description, manager, createdBy: req.user._id });
  res.status(201).json(dept);
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id)
    .populate('manager', 'name email')
    .populate('createdBy', 'name');
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  res.json(dept);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findById(req.params.id);
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  const { name, description, manager } = req.body;
  if (name)        dept.name        = name;
  if (description !== undefined) dept.description = description;
  if (manager !== undefined)     dept.manager     = manager;
  await dept.save();
  res.json(dept);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndDelete(req.params.id);
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  res.json({ message: 'Department deleted' });
});
