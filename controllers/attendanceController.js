import asyncHandler from '../utils/asyncHandler.js';
import Attendance from '../models/Attendance.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

const dayBounds = () => {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const checkIn = asyncHandler(async (req, res) => {
  const { start, end } = dayBounds();
  const existing = await Attendance.findOne({ employee: req.user._id, date: { $gte: start, $lte: end } });
  if (existing?.checkIn) { res.status(400); throw new Error('Already checked in today'); }
  const now = new Date();
  const record = existing
    ? Object.assign(existing, { checkIn: now, status: 'present' })
    : new Attendance({ employee: req.user._id, date: start, checkIn: now, status: 'present' });
  await record.save();
  res.status(201).json(record);
});

export const checkOut = asyncHandler(async (req, res) => {
  const { start, end } = dayBounds();
  const record = await Attendance.findOne({ employee: req.user._id, date: { $gte: start, $lte: end } });
  if (!record?.checkIn) { res.status(400); throw new Error('No check-in found for today'); }
  if (record.checkOut)  { res.status(400); throw new Error('Already checked out today'); }
  const now = new Date();
  record.checkOut  = now;
  const hours = parseFloat(((now - record.checkIn) / 3_600_000).toFixed(2));
  record.workHours = hours;
  if (hours < 6) {
    record.status = 'half-day';
  } else {
    record.status = 'present';
  }
  await record.save();
  res.json(record);
});

export const getTodayStatus = asyncHandler(async (req, res) => {
  const { start, end } = dayBounds();
  const record = await Attendance.findOne({ employee: req.user._id, date: { $gte: start, $lte: end } });
  res.json(record || null);
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { employee: req.user._id };
  if (month && year) {
    const m = parseInt(month, 10) - 1;
    const y = parseInt(year, 10);
    filter.date = { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59) };
  }
  const records = await Attendance.find(filter).sort({ date: -1 });
  res.json(records);
});

export const getAttendanceLogs = asyncHandler(async (req, res) => {
  const { employee, startDate, endDate } = req.query;
  const filter = {};
  if (employee)  filter.employee = employee;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate)   filter.date.$lte = new Date(endDate);
  }

  if (req.user.role === 'manager') {
    const dept = await Department.findOne({ manager: req.user._id });
    if (dept) {
      const employees = await User.find({ department: dept._id }).select('_id');
      const employeeIds = employees.map(e => e._id);
      if (employee) {
        // If they requested a specific employee, make sure they are in the manager's department
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

  const records = await Attendance.find(filter)
    .populate('employee', 'name email department')
    .sort({ date: -1 })
    .limit(500);
  res.json(records);
});
