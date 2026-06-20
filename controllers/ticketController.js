import asyncHandler from '../utils/asyncHandler.js';
import Ticket from '../models/Ticket.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

export const createTicket = asyncHandler(async (req, res) => {
  const { title, description, category, priority } = req.body;
  const ticket = await Ticket.create({ title, description, category, priority, raisedBy: req.user._id });
  res.status(201).json(ticket);
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ raisedBy: req.user._id })
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });
  res.json(tickets);
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const { status, category, priority } = req.query;
  const filter = {};
  if (status)   filter.status   = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  if (req.user.role === 'manager') {
    const dept = await Department.findOne({ manager: req.user._id });
    if (dept) {
      const employees = await User.find({ department: dept._id }).select('_id');
      const employeeIds = employees.map(e => e._id);
      filter.raisedBy = { $in: employeeIds };
    } else {
      filter.raisedBy = null;
    }
  }

  const tickets = await Ticket.find(filter)
    .populate('raisedBy', 'name email')
    .populate('assignedTo', 'name')
    .sort({ createdAt: -1 });
  res.json(tickets);
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) { res.status(404); throw new Error('Ticket not found'); }
  Object.assign(ticket, req.body);
  await ticket.save();
  res.json(ticket);
});
