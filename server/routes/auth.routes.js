const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { signup, login } = require('../controllers/auth.controller');
const handleValidation = require('../middleware/validate.middleware');

router.post(
    '/signup',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('A valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    handleValidation,
    signup
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('A valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    handleValidation,
    login
);

module.exports = router;
