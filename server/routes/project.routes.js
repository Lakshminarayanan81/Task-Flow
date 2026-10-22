const express = require('express');
const router = express.Router();
// CHANGE [filters]: WAS `const { body } = ...`. `query` is the same validator family as
// `body`, but it checks values in the URL's query string (req.query) instead of the JSON body.
const { body, query } = require('express-validator');
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

// ─── CHANGE [filters] ─────────────────────────────────────────────────────────
// WAS:    GET /:id/tasks had NO validation. getTasks used req.query as-is, which meant:
//           ?search=a&search=b   → Express turns repeated keys into an ARRAY → .replace() on
//                                  an array crashed → 500 Internal Server Error
//           ?status=bogus        → silently returned an empty list
//           ?dueBefore=garbage   → only failed later, by luck, as a Mongoose CastError
// NOW:    Every filter is checked BEFORE getTasks runs, the same pattern as the body() rules
//         above: rules → handleValidation (sends 400 if any failed) → controller.
// PIECES: query(field, message) → default error message for every check in this chain.
//                                  (.withMessage() only applies to the ONE check before it.)
//         .optional({ values: 'falsy' }) → skip if missing OR empty, so "?status=" means
//                                  "no filter" — the same way getTasks already treats it.
//         .isString()            → rejects arrays (repeated keys). Found while testing:
//                                  isIn() alone checks each array item, so
//                                  ?status=todo&status=done slipped through without it.
//         .isIn / .isISO8601 / .isLength → the actual value checks.
// BETTER: Bad URLs get a clear 400 instead of a crash, and anything reaching the database
//         is guaranteed to be a plain string — an explicit defense against NoSQL injection
//         like ?status[$ne]=x (Express 5 already parses that safely, but now we don't rely on it).
// ─────────────────────────────────────────────────────────────────────────────
const taskQueryRules = [
    query('status', 'status must be one of todo, in-progress, done').optional({ values: 'falsy' }).isString().isIn(['todo', 'in-progress', 'done']),
    query('dueBefore', 'dueBefore must be a single valid date').optional({ values: 'falsy' }).isString().isISO8601(),
    query('dueAfter', 'dueAfter must be a single valid date').optional({ values: 'falsy' }).isString().isISO8601(),
    query('search', 'search must be a single value up to 100 characters').optional({ values: 'falsy' }).isString().isLength({ max: 100 }),
];

router.post('/', protect, projectRules, handleValidation, createProject);
router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);
router.put('/:id', protect, projectUpdateRules, handleValidation, updateProject);
router.delete('/:id', protect, deleteProject);

router.post('/:id/tasks', protect, taskRules, handleValidation, createTask);
// CHANGE [filters]: WAS `router.get('/:id/tasks', protect, getTasks)` — no validation step.
// Order matters: protect (who are you?) → taskQueryRules + handleValidation (is the URL valid?) → getTasks.
router.get('/:id/tasks', protect, taskQueryRules, handleValidation, getTasks);

module.exports = router;
