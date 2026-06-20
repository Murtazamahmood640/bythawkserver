import asyncHandler from '../utils/asyncHandler.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

export const getProjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'employee') filter.members = req.user._id;
  const projects = await Project.find(filter)
    .populate('department', 'name')
    .populate('createdBy', 'name')
    .populate('members', 'name avatar')
    .sort({ createdAt: -1 });
  res.json(projects);
});

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, department, deadline, status, members } = req.body;
  const project = await Project.create({ title, description, department, deadline, status, members, createdBy: req.user._id });
  res.status(201).json(project);
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('department', 'name')
    .populate('createdBy', 'name')
    .populate('members', 'name avatar email');
  if (!project) { res.status(404); throw new Error('Project not found'); }
  res.json(project);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }
  Object.assign(project, req.body);
  await project.save();
  res.json(project);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) { res.status(404); throw new Error('Project not found'); }
  res.json({ message: 'Project deleted' });
});

export const getProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ project: req.params.id })
    .populate('assignedTo', 'name avatar')
    .populate('assignedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(tasks);
});
