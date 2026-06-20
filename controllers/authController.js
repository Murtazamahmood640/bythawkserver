import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const getSetupStatus = asyncHandler(async (req, res) => {
  const count = await User.countDocuments({ role: 'super_admin' });
  res.json({ isSetupDone: count > 0 });
});

export const setupAdmin = asyncHandler(async (req, res) => {
  const count = await User.countDocuments({ role: 'super_admin' });
  if (count > 0) { res.status(400); throw new Error('Setup already complete'); }
  const { name, email, password } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error('All fields required'); }
  const user = await User.create({ name, email, passwordHash: password, role: 'super_admin' });
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  res.cookie('refreshToken', refreshToken, cookieOpts);
  res.status(201).json({
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, designation: '', avatar: '' },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401); throw new Error('Invalid email or password');
  }
  if (!user.isActive) { res.status(403); throw new Error('Account deactivated'); }
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  res.cookie('refreshToken', refreshToken, cookieOpts);
  res.json({
    accessToken,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, designation: user.designation, avatar: user.avatar },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) { user.refreshToken = null; await user.save({ validateBeforeSave: false }); }
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) { res.status(401); throw new Error('No refresh token'); }
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) { res.status(401); throw new Error('Invalid refresh token'); }
    const accessToken = generateAccessToken(user._id, user.role);
    res.json({ accessToken });
  } catch {
    res.status(401); throw new Error('Refresh token expired');
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new passwords are required');
  }
  const user = await User.findById(req.user._id);
  if (!user || !(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Invalid current password');
  }
  user.passwordHash = newPassword;
  await user.save();
  res.json({ message: 'Password changed successfully' });
});
