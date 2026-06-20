import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Ticket from '../models/Ticket.js';

export const getOverview = asyncHandler(async (req, res) => {
  const [totalEmployees, totalDepartments, activeProjects, openTickets, pendingLeaves] = await Promise.all([
    User.countDocuments({ isActive: true, role: { $ne: 'super_admin' } }),
    Department.countDocuments(),
    Project.countDocuments({ status: 'active' }),
    Ticket.countDocuments({ status: { $ne: 'resolved' } }),
    Leave.countDocuments({ status: 'pending' }),
  ]);
  res.json({ totalEmployees, totalDepartments, activeProjects, openTickets, pendingLeaves });
});

export const getTaskCompletion = asyncHandler(async (req, res) => {
  const tasks = await Task.find();
  const total = tasks.length;
  const byStatus = { todo: 0, in_progress: 0, review: 0, completed: 0 };
  tasks.forEach(t => { byStatus[t.status] = (byStatus[t.status] || 0) + 1; });
  const completionRate = total ? Math.round((byStatus.completed / total) * 100) : 0;
  res.json({ total, byStatus, completionRate });
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const data = await Promise.all(days.map(async (d) => {
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end   = new Date(d); end.setHours(23, 59, 59, 999);
    const present = await Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'present' });
    return { date: d.toISOString().split('T')[0], present };
  }));
  res.json(data);
});

export const getTicketStats = asyncHandler(async (req, res) => {
  const [open, in_progress, resolved] = await Promise.all([
    Ticket.countDocuments({ status: 'open' }),
    Ticket.countDocuments({ status: 'in_progress' }),
    Ticket.countDocuments({ status: 'resolved' }),
  ]);
  res.json({ open, in_progress, resolved, total: open + in_progress + resolved });
});
