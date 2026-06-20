import asyncHandler from '../utils/asyncHandler.js';
import Holiday from '../models/Holiday.js';

export const getHolidays = asyncHandler(async (req, res) => {
  const holidays = await Holiday.find().sort({ date: 1 });
  res.json(holidays);
});

export const createHoliday = asyncHandler(async (req, res) => {
  const { title, date, description } = req.body;
  if (!title || !date) {
    res.status(400);
    throw new Error('Title and date are required');
  }
  const holiday = await Holiday.create({ title, date, description });
  res.status(201).json(holiday);
});

export const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findByIdAndDelete(req.params.id);
  if (!holiday) {
    res.status(404);
    throw new Error('Holiday not found');
  }
  res.json({ message: 'Holiday deleted successfully' });
});
