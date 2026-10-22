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
        // CHANGE [design]: WAS .isLength({ min: 6 }). The design's signup hint is
        // "8+ characters, one number", so the SERVER rule now matches it — the browser check in
        // Signup.jsx is only for instant feedback; this one is what actually protects the data.
        // .matches(/\d/) = the value must contain at least one digit (\d is regex for 0-9).
        // Existing accounts are unaffected: login only checks that a password was sent.
        body('password')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
            .matches(/\d/).withMessage('Password must contain at least one number'),
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
