import asyncHandler from '../utils/asyncHandler.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Department from '../models/Department.js';
import User from '../models/User.js';

const syncProjectProgress = async (projectId) => {
  const tasks = await Task.find({ project: projectId });
  if (!tasks.length) return;
  const done = tasks.filter(t => t.status === 'completed').length;
  await Project.findByIdAndUpdate(projectId, { progress: Math.round((done / tasks.length) * 100) });
};

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, project, assignedTo, priority, dueDate, tags } = req.body;
  const task = await Task.create({ title, description, project, assignedTo, priority, dueDate, tags, assignedBy: req.user._id });
  await syncProjectProgress(project);
  const populated = await Task.findById(task._id)
    .populate('assignedTo', 'name avatar')
    .populate('assignedBy', 'name')
    .populate('project', 'title');
  res.status(201).json(populated);
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate('project', 'title')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(tasks);
});

export const getAllTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignedTo } = req.query;
  const filter = {};
  if (project)    filter.project    = project;
  if (status)     filter.status     = status;
  if (priority)   filter.priority   = priority;
  if (assignedTo) filter.assignedTo = assignedTo;

  if (req.user.role === 'manager') {
    const dept = await Department.findOne({ manager: req.user._id });
    if (dept) {
      const employees = await User.find({ department: dept._id }).select('_id');
      const employeeIds = employees.map(e => e._id);
      if (assignedTo) {
        if (!employeeIds.some(id => id.toString() === assignedTo.toString())) {
          filter.assignedTo = null;
        }
      } else {
        filter.assignedTo = { $in: employeeIds };
      }
    } else {
      filter.assignedTo = null;
    }
  }

  const tasks = await Task.find(filter)
    .populate('project', 'title')
    .populate('assignedTo', 'name avatar')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(tasks);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  Object.assign(task, req.body);
  await task.save();
  await syncProjectProgress(task.project);
  const updated = await Task.findById(task._id)
    .populate('assignedTo', 'name avatar')
    .populate('assignedBy', 'name')
    .populate('project', 'title');
  res.json(updated);
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) { res.status(404); throw new Error('Task not found'); }
  await syncProjectProgress(task.project);
  res.json({ message: 'Task deleted' });
});
