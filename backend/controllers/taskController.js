import Task from '../models/Task.js';
import { parsePagination, paginateQuery } from '../utils/pagination.js';

const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value));

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
};

const isValidTimeString = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const cleanText = (value, max) => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return '';
  const cleaned = value.trim();
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
};

// @desc    List the current user's personal tasks
// @route   GET /api/tasks?page=&limit=
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    const buildQuery = () =>
      Task.find(filter).sort({ date: 1, time: 1, createdAt: -1, _id: 1 }).lean();

    const { rows: tasks, total, meta } = await paginateQuery(
      buildQuery(),
      buildQuery(),
      parsePagination(req.query)
    );

    return res.status(200).json({ success: true, count: total, tasks, pagination: meta });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a personal task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const title = cleanText(req.body.title, 150);
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });

    let date = req.body.date === undefined || req.body.date === null ? '' : String(req.body.date).trim();
    let time = req.body.time === undefined || req.body.time === null ? '' : String(req.body.time).trim();
    if (date && !isValidDateString(date)) {
      return res.status(400).json({ success: false, message: 'Task date must be a valid date in YYYY-MM-DD format.' });
    }
    if (time && !isValidTimeString(time)) {
      return res.status(400).json({ success: false, message: 'Task time must be in HH:mm (24-hour) format.' });
    }

    const status = req.body.status === 'completed' ? 'completed' : 'pending';
    const priority = ['low', 'medium', 'high'].includes(req.body.priority) ? req.body.priority : 'medium';

    const task = await Task.create({
      user: req.user._id,
      title,
      description: cleanText(req.body.description, 1000),
      date,
      time,
      status,
      priority,
    });
    return res.status(201).json({ success: true, message: 'Task created successfully.', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a personal task (owner only, partial update)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid task ID.' });

    const patch = {};
    if (req.body.title !== undefined) {
      const title = cleanText(req.body.title, 150);
      if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });
      patch.title = title;
    }
    if (req.body.description !== undefined) patch.description = cleanText(req.body.description, 1000);
    if (req.body.date !== undefined) {
      const date = req.body.date === null ? '' : String(req.body.date).trim();
      if (date && !isValidDateString(date)) {
        return res.status(400).json({ success: false, message: 'Task date must be a valid date in YYYY-MM-DD format.' });
      }
      patch.date = date;
    }
    if (req.body.time !== undefined) {
      const time = req.body.time === null ? '' : String(req.body.time).trim();
      if (time && !isValidTimeString(time)) {
        return res.status(400).json({ success: false, message: 'Task time must be in HH:mm (24-hour) format.' });
      }
      patch.time = time;
    }
    if (req.body.status !== undefined) {
      if (!['pending', 'completed'].includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Task status must be "pending" or "completed".' });
      }
      patch.status = req.body.status;
    }
    if (req.body.priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(req.body.priority)) {
        return res.status(400).json({ success: false, message: 'Task priority must be "low", "medium", or "high".' });
      }
      patch.priority = req.body.priority;
    }

    const task = await Task.findOneAndUpdate({ _id: id, user: req.user._id }, { $set: patch }, { new: true, runValidators: true });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or you do not own it.' });
    }
    return res.status(200).json({ success: true, message: 'Task updated successfully.', task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a personal task (owner only)
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid task ID.' });

    const task = await Task.findOneAndDelete({ _id: id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or you do not own it.' });
    }
    return res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};