const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const protect = require('../middleware/auth.middleware');
const { updateTask, deleteTask } = require('../controllers/task.controller');
const handleValidation = require('../middleware/validate.middleware');

const taskUpdateRules = [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done'),
    body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid date'),
];

router.put('/:id', protect, taskUpdateRules, handleValidation, updateTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
