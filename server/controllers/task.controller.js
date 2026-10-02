const Task = require('../models/Task');
const Project = require('../models/Project');

async function createTask(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { title, description, status, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      dueDate,
      project: project._id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function getTasks(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const filter = { project: project._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.dueBefore || req.query.dueAfter) {
      filter.dueDate = {};
      if (req.query.dueBefore) filter.dueDate.$lte = new Date(req.query.dueBefore);
      if (req.query.dueAfter) filter.dueDate.$gte = new Date(req.query.dueAfter);
    }

    if (req.query.search) {
      const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const tasks = await Task.find(filter);
    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, status, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, getTasks, updateTask, deleteTask };
