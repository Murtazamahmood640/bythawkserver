import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Department from '../models/Department.js';

export const getUsers = asyncHandler(async (req, res) => {
  const { role, department, page = 1, limit = 200 } = req.query;
  const filter = {};

  // Managers can only see their own department
  if (req.user.role === 'manager') {
    const dept = await Department.findOne({ manager: req.user._id });
    filter.department = dept ? dept._id : null;
  } else {
    if (department) filter.department = department;
  }

  if (role) filter.role = role;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-passwordHash -refreshToken')
    .populate('department', 'name')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ users, total, page: Number(page), limit: Number(limit) });
});


export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, designation, phone, dateOfJoining } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already in use'); }
  const user = await User.create({ name, email, passwordHash: password, role, department, designation, phone, dateOfJoining });
  const populated = await User.findById(user._id).select('-passwordHash -refreshToken').populate('department', 'name');
  res.status(201).json(populated);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-passwordHash -refreshToken')
    .populate('department', 'name');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json(user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  const { name, email, role, department, designation, phone, dateOfJoining, isActive, password } = req.body;
  if (name)        user.name        = name;
  if (email)       user.email       = email;
  if (role)        user.role        = role;
  if (department !== undefined) user.department = department;
  if (designation) user.designation = designation;
  if (phone)       user.phone       = phone;
  if (dateOfJoining) user.dateOfJoining = dateOfJoining;
  if (isActive !== undefined) user.isActive = isActive;
  if (password)    user.passwordHash = password;
  await user.save();
  const updated = await User.findById(user._id).select('-passwordHash -refreshToken').populate('department', 'name');
  res.json(updated);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = false;
  await user.save({ validateBeforeSave: false });
  res.json({ message: 'User deactivated' });
});
