const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createProject, getProjects, getProject, updateProject, deleteProject } = require('../controllers/project.controller');
const { createTask, getTasks } = require('../controllers/task.controller');
const protect = require('../middleware/auth.middleware');
const handleValidation = require('../middleware/validate.middleware');

const projectRules = [
    body('title').trim().notEmpty().withMessage('Title is required'),
];

const projectUpdateRules = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
];

const taskRules = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),
    body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid date'),
];

router.post('/', protect, projectRules, handleValidation, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.put('/:id', protect, projectUpdateRules, handleValidation, updateProject);
router.delete('/:id', protect, deleteProject);

router.post('/:id/tasks', protect, taskRules, handleValidation, createTask);
router.get('/:id/tasks', protect, getTasks);

module.exports = router;
