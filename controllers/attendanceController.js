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
  const record = await Attendance.findOne({ employee: req.user._id }).sort({ date: -1 });
  if (!record?.checkIn) { res.status(400); throw new Error('No check-in found'); }
  if (record.checkOut)  { res.status(400); throw new Error('Already checked out or no active check-in'); }
  
  const now = new Date();
  if ((now - record.checkIn) > 24 * 3600 * 1000) {
    res.status(400);
    throw new Error('Active check-in session has expired (exceeded 24 hours)');
  }

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
  const record = await Attendance.findOne({ employee: req.user._id }).sort({ date: -1 });
  if (record) {
    const now = new Date();
    // If the record has no checkOut and is within 24 hours, it is considered an active check-in
    if (!record.checkOut && (now - record.checkIn) < 24 * 3600 * 1000) {
      return res.json(record);
    }
    // If the record has checkOut, we only return it if it belongs to the current calendar day
    if (record.checkOut) {
      const { start, end } = dayBounds();
      if (record.date >= start && record.date <= end) {
        return res.json(record);
      }
    }
  }
  res.json(null);
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

export const updateAttendanceLog = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, date, status, notes } = req.body;
  const record = await Attendance.findById(req.params.id);
  if (!record) { res.status(404); throw new Error('Attendance record not found'); }

  if (date) record.date = new Date(date);
  if (status) record.status = status;
  if (notes !== undefined) record.notes = notes;

  if (checkIn) {
    record.checkIn = new Date(checkIn);
  } else if (req.body.hasOwnProperty('checkIn') && !checkIn) {
    record.checkIn = undefined;
  }

  if (checkOut) {
    record.checkOut = new Date(checkOut);
  } else if (req.body.hasOwnProperty('checkOut') && !checkOut) {
    record.checkOut = undefined;
  }

  if (record.checkIn && record.checkOut) {
    const hours = parseFloat(((record.checkOut - record.checkIn) / 3_600_000).toFixed(2));
    record.workHours = hours;
  } else {
    record.workHours = 0;
  }

  await record.save();
  res.json(record);
});
