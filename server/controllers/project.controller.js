const Project = require('../models/Project');

async function createProject(req, res, next) {
    try {
        const { title, description } = req.body;

        const project = await Project.create({
            title,
            description,
            owner: req.user.id
        });
        res.status(201).json({ success: true, data: project })
    } catch (error) {
        next(error);
    }
}

async function getProjects(req, res, next) {
  try {
    const projects = await Project.find({ owner: req.user.id });
    res.status(200).json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { title, description } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    await project.save();

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await project.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };

