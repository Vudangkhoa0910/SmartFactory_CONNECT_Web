const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const incidentController = require('../controllers/incident.controller');
const { authenticate, authorize, authorizeLevel } = require('../middlewares/auth.middleware');
const { uploadIncidentFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');

// Validation rules
const createIncidentValidation = [
  body('incident_type')
    .isIn(['safety', 'quality', 'equipment', 'other'])
    .withMessage('Invalid incident type'),
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
  body('location')
    .optional()
    .trim(),
  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority')
];

const assignIncidentValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('assigned_to')
    .notEmpty()
    .withMessage('Assigned user is required')
    .isUUID()
    .withMessage('Invalid user ID')
];

const updateStatusValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('status')
    .isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
];

const addCommentValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
];

const escalateIncidentValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('escalate_to')
    .notEmpty()
    .withMessage('Escalate to user is required')
    .isUUID()
    .withMessage('Invalid user ID'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Escalation reason is required')
];

const resolveIncidentValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('resolution_notes')
    .trim()
    .notEmpty()
    .withMessage('Resolution notes are required'),
  body('root_cause')
    .optional()
    .trim(),
  body('corrective_actions')
    .optional()
    .trim()
];

const rateIncidentValidation = [
  param('id').isUUID().withMessage('Invalid incident ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .trim()
];

const getIncidentByIdValidation = [
  param('id').isUUID().withMessage('Invalid incident ID')
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
  query('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID')
];

// Routes

/**
 * @route   POST /api/incidents
 * @desc    Create new incident
 * @access  Private (All authenticated users)
 */
router.post(
  '/',
  authenticate,
  uploadIncidentFiles,
  createIncidentValidation,
  validate,
  incidentController.createIncident
);

/**
 * @route   GET /api/incidents
 * @desc    Get all incidents with filters and pagination
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  pagination,
  parseSort,
  parseFilters([
    'status',
    'incident_type',
    'priority',
    'department_id',
    'assigned_to',
    'date_from',
    'date_to'
  ]),
  incidentController.getIncidents
);

/**
 * @route   GET /api/incidents/stats
 * @desc    Get incident statistics
 * @access  Private (Supervisor and above)
 */
router.get(
  '/stats',
  authenticate,
  authorizeLevel(4), // Supervisor and above
  statsQueryValidation,
  validate,
  incidentController.getIncidentStats
);

/**
 * @route   GET /api/incidents/:id
 * @desc    Get incident by ID
 * @access  Private (Authenticated users - own incidents or authorized roles)
 */
router.get(
  '/:id',
  authenticate,
  getIncidentByIdValidation,
  validate,
  incidentController.getIncidentById
);

/**
 * @route   PUT /api/incidents/:id/assign
 * @desc    Assign incident to user
 * @access  Private (Team Leader and above)
 */
router.put(
  '/:id/assign',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  assignIncidentValidation,
  validate,
  incidentController.assignIncident
);

/**
 * @route   PUT /api/incidents/:id/status
 * @desc    Update incident status
 * @access  Private (Assigned user or Team Leader and above)
 */
router.put(
  '/:id/status',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  updateStatusValidation,
  validate,
  incidentController.updateIncidentStatus
);

/**
 * @route   POST /api/incidents/:id/comments
 * @desc    Add comment to incident
 * @access  Private (Authenticated users involved in incident)
 */
router.post(
  '/:id/comments',
  authenticate,
  uploadIncidentFiles,
  addCommentValidation,
  validate,
  incidentController.addComment
);

/**
 * @route   PUT /api/incidents/:id/escalate
 * @desc    Escalate incident to higher authority
 * @access  Private (Team Leader and above)
 */
router.put(
  '/:id/escalate',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  escalateIncidentValidation,
  validate,
  incidentController.escalateIncident
);

/**
 * @route   PUT /api/incidents/:id/resolve
 * @desc    Mark incident as resolved
 * @access  Private (Assigned user or Supervisor and above)
 */
router.put(
  '/:id/resolve',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  resolveIncidentValidation,
  validate,
  incidentController.resolveIncident
);

/**
 * @route   POST /api/incidents/:id/rate
 * @desc    Rate incident resolution
 * @access  Private (Incident reporter only)
 */
router.post(
  '/:id/rate',
  authenticate,
  rateIncidentValidation,
  validate,
  incidentController.rateIncident
);

module.exports = router;
