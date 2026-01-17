const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const incidentController = require('../controllers/incident.controller');
const { authenticate, authorize, authorizeLevel } = require('../middlewares/auth.middleware');
const { uploadIncidentFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');
const { LEVELS } = require('../constants/roles');

/**
 * @swagger
 * /api/incidents:
 *   get:
 *     summary: Get all incidents
 *     tags: [Incidents]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, in_progress, resolved, closed, cancelled, escalated]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low]
 *       - in: query
 *         name: incident_type
 *         schema:
 *           type: string
 *           enum: [machine, quality, safety, environment, other]
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
 *         description: List of incidents
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
 *                     $ref: '#/components/schemas/Incident'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Create new incident
 *     tags: [Incidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateIncident'
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     tags: [Incidents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Incident details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Incident'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update incident
 *     tags: [Incidents]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Incident updated successfully
 */

/**
 * @swagger
 * /api/incidents/{id}/assign:
 *   put:
 *     summary: Assign incident to user
 *     tags: [Incidents]
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
 *               - assigned_to
 *             properties:
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Incident assigned successfully
 */

/**
 * @swagger
 * /api/incidents/{id}/status:
 *   put:
 *     summary: Update incident status
 *     tags: [Incidents]
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
 *                 enum: [pending, assigned, in_progress, resolved, closed, cancelled, escalated]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 */

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
 * @access  Private (Supervisor and above - Level 3)
 */
router.get(
  '/stats',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR), // Supervisor and above
  statsQueryValidation,
  validate,
  incidentController.getIncidentStats
);

/**
 * @route   GET /api/incidents/queue
 * @desc    Get incident queue for Command Room (pending/critical only)
 * @access  Private (Team Leader and above - Level 4)
 */
router.get(
  '/queue',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER), // Team Leader and above
  incidentController.getIncidentQueue
);

/**
 * @route   GET /api/incidents/kanban
 * @desc    Get incidents organized by status for Kanban board
 * @access  Private
 */
router.get(
  '/kanban',
  authenticate,
  incidentController.getKanbanData
);

/**
 * @route   POST /api/incidents/bulk-update
 * @desc    Bulk update multiple incidents
 * @access  Private (Supervisor and above - Level 3)
 */
router.post(
  '/bulk-update',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    body('incident_ids').isArray().notEmpty(),
    body('action').isIn(['assign', 'change_status', 'change_priority']),
    body('data').isObject()
  ],
  validate,
  incidentController.bulkUpdateIncidents
);

/**
 * @route   GET /api/incidents/export
 * @desc    Export incidents to Excel
 * @access  Private (All authenticated users)
 */
router.get(
  '/export',
  authenticate,
  parseFilters([
    'status',
    'incident_type',
    'priority',
    'department_id',
    'assigned_to',
    'date_from',
    'date_to'
  ]),
  incidentController.exportIncidentsToExcel
);

/**
 * @route   GET /api/incidents/rating-stats
 * @desc    Get rating statistics
 * @access  Private (Supervisor and above - Level 3)
 * NOTE: This route MUST be before /:id to avoid matching 'rating-stats' as an ID
 */
router.get(
  '/rating-stats',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    query('department_id').optional().isUUID(),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ],
  validate,
  incidentController.getRatingStats
);

/**
 * @route   GET /api/incidents/my
 * @desc    Get current user's reported incidents
 * @access  Private (All authenticated users)
 * NOTE: Must be before /:id route
 */
router.get(
  '/my',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated']),
    query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  validate,
  incidentController.getMyIncidents
);

/**
 * @route   GET /api/incidents/assigned-to-me
 * @desc    Get incidents assigned to current user
 * @access  Private (Team Leader and above - Level 4)
 * NOTE: Must be before /:id route
 */
router.get(
  '/assigned-to-me',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER),
  [
    query('status').optional().isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  validate,
  incidentController.getAssignedToMe
);

/**
 * @route   GET /api/incidents/department/:departmentId
 * @desc    Get incidents by department
 * @access  Private (Supervisor and above - Level 3)
 */
router.get(
  '/department/:departmentId',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    param('departmentId').isUUID(),
    query('status').optional().isIn(['pending', 'assigned', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('page').optional().isInt({ min: 1 })
  ],
  validate,
  incidentController.getIncidentsByDepartment
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
 * @access  Private (Team Leader and above - Level 4)
 */
router.put(
  '/:id/assign',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER), // Team Leader and above
  assignIncidentValidation,
  validate,
  incidentController.assignIncident
);

/**
 * @route   PUT /api/incidents/:id/status
 * @desc    Update incident status
 * @access  Private (Team Leader and above - Level 4)
 */
router.put(
  '/:id/status',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER), // Team Leader and above
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
 * @access  Private (Team Leader and above - Level 4)
 */
router.put(
  '/:id/escalate',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER), // Team Leader and above
  escalateIncidentValidation,
  validate,
  incidentController.escalateIncident
);

/**
 * @route   PUT /api/incidents/:id/resolution
 * @desc    Add resolution to incident
 * @access  Private (Assigned user)
 */
router.put(
  '/:id/resolution',
  authenticate,
  uploadIncidentFiles,
  resolveIncidentValidation,
  validate,
  incidentController.resolveIncident
);

/**
 * @route   POST /api/incidents/:id/acknowledge
 * @desc    Quick acknowledge incident (Command Room)
 * @access  Private (Team Leader and above - Level 4)
 */
router.post(
  '/:id/acknowledge',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER),
  param('id').isUUID(),
  validate,
  incidentController.quickAcknowledge
);

/**
 * @route   POST /api/incidents/:id/quick-assign
 * @desc    Quick assign incident to department/user
 * @access  Private (Team Leader and above - Level 4)
 */
router.post(
  '/:id/quick-assign',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER),
  [
    param('id').isUUID(),
    body('department_id').optional().isUUID(),
    body('assigned_to').optional().isUUID()
  ],
  validate,
  incidentController.quickAssignToDepartment
);

/**
 * @route   PATCH /api/incidents/:id/move
 * @desc    Move incident to new status (Kanban drag-drop)
 * @access  Private
 */
router.patch(
  '/:id/move',
  authenticate,
  [
    param('id').isUUID(),
    body('new_status').isIn(['pending', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed']),
    body('new_assigned_to').optional().isUUID()
  ],
  validate,
  incidentController.moveIncidentStatus
);

/**
 * @route   POST /api/incidents/:id/rate
 * @desc    Rate a resolved incident
 * @access  Private (Reporter only)
 */
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

/**
 * @route   POST /api/incidents/:id/escalate-level
 * @desc    Escalate incident to next handler level
 * @access  Private (Team Leader and above - Level 4)
 */
router.post(
  '/:id/escalate-level',
  authenticate,
  authorizeLevel(LEVELS.TEAM_LEADER),
  [
    param('id').isUUID(),
    body('reason').trim().notEmpty().withMessage('Escalation reason is required')
  ],
  validate,
  incidentController.escalateToNextLevel
);

/**
 * @route   POST /api/incidents/:id/assign-departments
 * @desc    Assign incident to multiple departments
 * @access  Private (Supervisor and above)
 */
router.post(
  '/:id/assign-departments',
  authenticate,
  authorizeLevel(4),
  [
    param('id').isUUID(),
    body('departments').isArray({ min: 1 }).withMessage('Departments array is required'),
    body('departments.*.department_id').isUUID().withMessage('Invalid department ID'),
    body('departments.*.assigned_to').optional().isUUID(),
    body('departments.*.task_description').optional().trim(),
    body('departments.*.priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('departments.*.due_date').optional().isISO8601()
  ],
  validate,
  incidentController.assignToDepartments
);

/**
 * @route   GET /api/incidents/:id/departments
 * @desc    Get department assignments for an incident
 * @access  Private
 */
router.get(
  '/:id/departments',
  authenticate,
  param('id').isUUID(),
  validate,
  incidentController.getDepartmentAssignments
);

/**
 * @route   PUT /api/incidents/:id/departments/:assignmentId
 * @desc    Update department assignment status
 * @access  Private
 */
router.put(
  '/:id/departments/:assignmentId',
  authenticate,
  [
    param('id').isUUID(),
    param('assignmentId').isUUID(),
    body('status').isIn(['pending', 'accepted', 'in_progress', 'completed', 'rejected']),
    body('completion_notes').optional().trim()
  ],
  validate,
  incidentController.updateDepartmentAssignment
);

/**
 * @route   POST /api/incidents/:id/detailed-rating
 * @desc    Submit detailed rating for incident
 * @access  Private (Reporter only)
 */
router.post(
  '/:id/detailed-rating',
  authenticate,
  [
    param('id').isUUID(),
    body('overall_rating').isInt({ min: 1, max: 5 }),
    body('response_speed').optional().isInt({ min: 1, max: 5 }),
    body('solution_quality').optional().isInt({ min: 1, max: 5 }),
    body('communication').optional().isInt({ min: 1, max: 5 }),
    body('professionalism').optional().isInt({ min: 1, max: 5 }),
    body('feedback').optional().trim(),
    body('is_satisfied').optional().isBoolean(),
    body('would_recommend').optional().isBoolean()
  ],
  validate,
  incidentController.submitDetailedRating
);

/**
 * @route   GET /api/incidents/:id/history
 * @desc    Get incident action history (timeline)
 * @access  Private
 */
router.get(
  '/:id/history',
  authenticate,
  param('id').isUUID().withMessage('Invalid incident ID'),
  validate,
  incidentController.getIncidentHistory
);

/**
 * @route   GET /api/incidents/:id/comments
 * @desc    Get incident comments
 * @access  Private
 */
router.get(
  '/:id/comments',
  authenticate,
  param('id').isUUID().withMessage('Invalid incident ID'),
  validate,
  incidentController.getIncidentComments
);

module.exports = router;
