const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ideaController = require('../controllers/idea.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { uploadIdeaFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');

/**
 * @swagger
 * /api/ideas:
 *   get:
 *     summary: Get all ideas
 *     tags: [Ideas]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, under_review, approved, rejected, implemented, on_hold]
 *       - in: query
 *         name: box_type
 *         schema:
 *           type: string
 *           enum: [white, pink]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of ideas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Idea'
 *   post:
 *     summary: Create new idea
 *     tags: [Ideas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIdea'
 *     responses:
 *       201:
 *         description: Idea created successfully
 */

/**
 * @swagger
 * /api/ideas/stats:
 *   get:
 *     summary: Get idea statistics
 *     tags: [Ideas]
 *     responses:
 *       200:
 *         description: Idea statistics
 */

/**
 * @swagger
 * /api/ideas/kaizen-bank:
 *   get:
 *     summary: Get Kaizen Bank (implemented ideas)
 *     tags: [Ideas]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of implemented ideas
 */

/**
 * @swagger
 * /api/ideas/{id}:
 *   get:
 *     summary: Get idea by ID
 *     tags: [Ideas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Idea details
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @swagger
 * /api/ideas/{id}/review:
 *   put:
 *     summary: Review idea (approve/reject)
 *     tags: [Ideas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               review_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Idea reviewed successfully
 */

// Validation rules
const createIdeaValidation = [
  body('ideabox_type')
    .isIn(['white', 'pink'])
    .withMessage('Invalid ideabox type. Must be "white" or "pink"'),
  body('category')
    .isIn([
      'process_improvement',
      'cost_reduction',
      'quality_improvement',
      'safety_enhancement',
      'productivity',
      'innovation',
      'environment',
      'workplace',
      'other'
    ])
    .withMessage('Invalid category'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('expected_benefit')
    .optional()
    .trim(),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID')
];

const assignIdeaValidation = [
  param('id').isUUID().withMessage('Invalid idea ID'),
  body('assigned_to')
    .optional()
    .isUUID()
    .withMessage('Invalid user ID'),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID')
];

const addResponseValidation = [
  param('id').isUUID().withMessage('Invalid idea ID'),
  body('response')
    .trim()
    .notEmpty()
    .withMessage('Response is required')
];

const reviewIdeaValidation = [
  param('id').isUUID().withMessage('Invalid idea ID'),
  body('status')
    .isIn(['under_review', 'approved', 'rejected', 'implemented', 'on_hold'])
    .withMessage('Invalid status'),
  body('review_notes')
    .trim()
    .notEmpty()
    .withMessage('Review notes are required'),
  body('feasibility_score')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Feasibility score must be between 1 and 10'),
  body('impact_score')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Impact score must be between 1 and 10')
];

const implementIdeaValidation = [
  param('id').isUUID().withMessage('Invalid idea ID'),
  body('implementation_notes')
    .trim()
    .notEmpty()
    .withMessage('Implementation notes are required'),
  body('actual_benefit')
    .optional()
    .trim()
];

const ideaIdValidation = [
  param('id').isUUID().withMessage('Invalid idea ID')
];

const statsQueryValidation = [
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('ideabox_type')
    .optional()
    .isIn(['white', 'pink'])
    .withMessage('Invalid ideabox type')
];

// Routes

/**
 * @route   POST /api/ideas
 * @desc    Create new idea (White or Pink Box)
 * @access  Private (All authenticated users)
 */
router.post(
  '/',
  authenticate,
  uploadIdeaFiles,
  createIdeaValidation,
  validate,
  ideaController.createIdea
);

/**
 * @route   GET /api/ideas
 * @desc    Get all ideas with filters
 * @access  Private (Role-based access)
 */
router.get(
  '/',
  authenticate,
  pagination,
  parseSort,
  parseFilters([
    'ideabox_type',
    'status',
    'category',
    'department_id',
    'assigned_to',
    'date_from',
    'date_to'
  ]),
  ideaController.getIdeas
);

/**
 * @route   GET /api/ideas/stats
 * @desc    Get idea statistics
 * @access  Private (Supervisor and above)
 */
router.get(
  '/stats',
  authenticate,
  authorizeLevel(4), // Supervisor and above
  statsQueryValidation,
  validate,
  ideaController.getIdeaStats
);

/**
 * @route   GET /api/ideas/archive
 * @desc    Get Kaizen Bank (archive of implemented ideas)
 * @access  Private
 */
router.get(
  '/archive/search',
  authenticate,
  [
    query('q').trim().isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
  ],
  validate,
  ideaController.searchKaizenBank
);

/**
 * @route   GET /api/ideas/archive/search
 * @desc    Search in Kaizen Bank
 * @access  Private
 */
router.get(
  '/archive',
  authenticate,
  pagination,
  parseFilters,
  ideaController.getKaizenBank
);

/**
 * @route   GET /api/ideas/difficulty
 * @desc    Get idea difficulty distribution
 * @access  Private (Manager+)
 */
router.get(
  '/difficulty',
  authenticate,
  authorizeLevel(4), // Manager and above
  ideaController.getIdeaDifficulty
);

/**
 * @route   GET /api/ideas/kanban
 * @desc    Get ideas organized by status columns
 * @access  Private
 */
router.get(
  '/kanban',
  authenticate,
  ideaController.getIdeasKanban
);

/**
 * @route   GET /api/ideas/:id/responses
 * @desc    Get idea responses history
 * @access  Private
 */
router.get(
  '/:id/responses',
  authenticate,
  ideaIdValidation,
  validate,
  ideaController.getIdeaResponses
);

/**
 * @route   GET /api/ideas/:id/history
 * @desc    Get idea action history
 * @access  Private
 */
router.get(
  '/:id/history',
  authenticate,
  ideaIdValidation,
  validate,
  ideaController.getIdeaHistory
);

/**
 * @route   GET /api/ideas/:id
 * @desc    Get idea by ID
 * @access  Private (Role-based access)
 */
router.get(
  '/:id',
  authenticate,
  ideaIdValidation,
  validate,
  ideaController.getIdeaById
);

/**
 * @route   PUT /api/ideas/:id/assign
 * @desc    Assign idea to user/department
 * @access  Private (Admin for Pink Box, Supervisor+ for White Box)
 */
router.put(
  '/:id/assign',
  authenticate,
  authorizeLevel(4), // Supervisor and above (Pink Box checked in controller)
  assignIdeaValidation,
  validate,
  ideaController.assignIdea
);

/**
 * @route   POST /api/ideas/:id/responses
 * @desc    Add response to idea
 * @access  Private (Assigned user or Supervisor+)
 */
router.post(
  '/:id/responses',
  authenticate,
  uploadIdeaFiles,
  addResponseValidation,
  validate,
  ideaController.addResponse
);

/**
 * @route   PUT /api/ideas/:id/review
 * @desc    Review and update idea status
 * @access  Private (Supervisor and above)
 */
router.put(
  '/:id/review',
  authenticate,
  authorizeLevel(4), // Supervisor and above
  reviewIdeaValidation,
  validate,
  ideaController.reviewIdea
);

/**
 * @route   PUT /api/ideas/:id/implement
 * @desc    Mark idea as implemented
 * @access  Private (Supervisor and above)
 */
router.put(
  '/:id/implement',
  authenticate,
  authorizeLevel(4), // Supervisor and above
  implementIdeaValidation,
  validate,
  ideaController.implementIdea
);

/**
 * @route   POST /api/ideas/:id/escalate
 * @desc    Escalate idea to higher management level
 * @access  Private (Assigned user or Supervisor+)
 */
router.post(
  '/:id/escalate',
  authenticate,
  [
    param('id').isUUID().withMessage('Invalid idea ID'),
    body('reason').optional().trim()
  ],
  validate,
  ideaController.escalateIdea
);

/**
 * @route   POST /api/ideas/:id/escalate-level
 * @desc    Escalate idea to next handler level (Supervisor -> Manager -> GM)
 * @access  Private (Supervisor and above)
 */
router.post(
  '/:id/escalate-level',
  authenticate,
  authorizeLevel(4),
  [
    param('id').isUUID(),
    body('reason').trim().notEmpty().withMessage('Escalation reason is required')
  ],
  validate,
  ideaController.escalateToNextLevel
);

/**
 * @route   POST /api/ideas/:id/rating
 * @desc    Submit rating for an idea
 * @access  Private (Submitter only)
 */
router.post(
  '/:id/rating',
  authenticate,
  [
    param('id').isUUID(),
    body('overall_rating').isInt({ min: 1, max: 5 }),
    body('response_quality').optional().isInt({ min: 1, max: 5 }),
    body('response_time').optional().isInt({ min: 1, max: 5 }),
    body('implementation_quality').optional().isInt({ min: 1, max: 5 }),
    body('feedback').optional().trim(),
    body('is_satisfied').optional().isBoolean()
  ],
  validate,
  ideaController.submitRating
);

/**
 * @route   GET /api/ideas/:id/rating
 * @desc    Get rating for an idea
 * @access  Private
 */
router.get(
  '/:id/rating',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaController.getRating
);

/**
 * @route   GET /api/ideas/rating-stats
 * @desc    Get rating statistics
 * @access  Private (Supervisor and above)
 */
router.get(
  '/rating-stats',
  authenticate,
  authorizeLevel(4),
  [
    query('department_id').optional().isUUID(),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ],
  validate,
  ideaController.getRatingStats
);

/**
 * @route   PUT /api/ideas/:id/difficulty
 * @desc    Update idea difficulty level (A-D)
 * @access  Private (Supervisor and above)
 */
router.put(
  '/:id/difficulty',
  authenticate,
  authorizeLevel(4),
  [
    param('id').isUUID(),
    body('difficulty_level').isIn(['A', 'B', 'C', 'D']).withMessage('Difficulty must be A, B, C, or D')
  ],
  validate,
  ideaController.updateDifficultyLevel
);

module.exports = router;
