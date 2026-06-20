import asyncHandler from '../utils/asyncHandler.js';
import Leave from '../models/Leave.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import dayjs from 'dayjs';

// ── Helpers ────────────────────────────────────────────────────────────────
const daysBetween = (start, end) =>
  Math.max(1, dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day') + 1);

// Compute used days per type for the current calendar year
const usedDays = async (employeeId) => {
  const yearStart = dayjs().startOf('year').toDate();
  const yearEnd   = dayjs().endOf('year').toDate();
  const approved  = await Leave.find({
    employee: employeeId,
    status:   'approved',
    startDate: { $gte: yearStart, $lte: yearEnd },
  });
  const used = { annual: 0, sick: 0, emergency: 0 };
  for (const l of approved) {
    if (used[l.type] !== undefined) used[l.type] += daysBetween(l.startDate, l.endDate);
  }
  return used;
};

export const submitLeave = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, reason } = req.body;
  if (!type || !startDate || !endDate || !reason) {
    res.status(400); throw new Error('All fields required');
  }
  // Quota check for quota-tracked leave types
  if (['annual', 'sick', 'emergency'].includes(type)) {
    const emp = await User.findById(req.user._id);
    const quota = emp.leaveQuota?.[type] ?? 0;
    const used  = (await usedDays(req.user._id))[type] ?? 0;
    const days  = daysBetween(startDate, endDate);
    if (used + days > quota) {
      res.status(400);
      throw new Error(`Leave quota exceeded. You have ${quota - used} ${type} day(s) remaining.`);
    }
  }
  const leave = await Leave.create({ employee: req.user._id, type, startDate, endDate, reason });
  res.status(201).json(leave);
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await Leave.find({ employee: req.user._id })
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(leaves);
});

export const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, type, employee } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type)   filter.type   = type;
  if (employee) filter.employee = employee;

  if (req.user.role === 'manager') {
    const dept = await Department.findOne({ manager: req.user._id });
    if (dept) {
      const employees = await User.find({ department: dept._id }).select('_id');
      const employeeIds = employees.map(e => e._id);
      if (employee) {
        if (!employeeIds.some(id => id.toString() === employee.toString())) {
          filter.employee = null;
        }
      } else {
        filter.employee = { $in: employeeIds };
      }
    } else {
      filter.employee = null;
    }
  }

  const leaves = await Leave.find(filter)
    .populate('employee', 'name email department')
    .populate('reviewedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(leaves);
});

export const reviewLeave = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  const leave = await Leave.findById(req.params.id);
  if (!leave) { res.status(404); throw new Error('Leave not found'); }
  if (leave.status !== 'pending') { res.status(400); throw new Error('Leave already reviewed'); }
  leave.status     = status;
  leave.reviewedBy = req.user._id;
  leave.reviewNote = reviewNote || '';
  await leave.save();
  const populated = await Leave.findById(leave._id)
    .populate('employee', 'name email leaveQuota')
    .populate('reviewedBy', 'name');
  res.json(populated);
});

// Get quota + usage for the logged-in user
export const getMyQuota = asyncHandler(async (req, res) => {
  const emp  = await User.findById(req.user._id);
  const used = await usedDays(req.user._id);
  const quota = emp.leaveQuota ?? { annual: 15, sick: 10, emergency: 5 };
  res.json({
    quota,
    used,
    remaining: {
      annual:    Math.max(0, quota.annual    - (used.annual    || 0)),
      sick:      Math.max(0, quota.sick      - (used.sick      || 0)),
      emergency: Math.max(0, quota.emergency - (used.emergency || 0)),
    },
  });
});

// Admin/Manager: update an employee's leave quota
export const updateQuota = asyncHandler(async (req, res) => {
  const { annual, sick, emergency } = req.body;
  const emp = await User.findById(req.params.id);
  if (!emp) { res.status(404); throw new Error('User not found'); }
  if (annual    !== undefined) emp.leaveQuota.annual    = annual;
  if (sick      !== undefined) emp.leaveQuota.sick      = sick;
  if (emergency !== undefined) emp.leaveQuota.emergency = emergency;
  await emp.save({ validateBeforeSave: false });
  const used = await usedDays(emp._id);
  res.json({
    quota: emp.leaveQuota,
    used,
    remaining: {
      annual:    Math.max(0, emp.leaveQuota.annual    - (used.annual    || 0)),
      sick:      Math.max(0, emp.leaveQuota.sick      - (used.sick      || 0)),
      emergency: Math.max(0, emp.leaveQuota.emergency - (used.emergency || 0)),
    },
  });
});
