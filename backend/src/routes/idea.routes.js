const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ideaController = require('../controllers/idea.controller');
const ideaSupportController = require('../controllers/ideaSupport.controller');
const { authenticate, authorizeLevel, authorizePinkBoxAccess } = require('../middlewares/auth.middleware');
const { uploadIdeaFiles } = require('../middlewares/upload.middleware');
const { validate, pagination, parseSort, parseFilters } = require('../middlewares/validation.middleware');
const { LEVELS } = require('../constants/roles');

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
  body('whitebox_subtype')
    .optional()
    .isIn(['idea', 'opinion'])
    .withMessage('Invalid whitebox subtype. Must be "idea" or "opinion"'),
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
  body('difficulty')
    .optional()
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Invalid difficulty. Must be A, B, C, or D'),
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
    .optional()
    .trim(),
  body('feasibility_score')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Feasibility score must be between 1 and 10'),
  body('impact_score')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Impact score must be between 1 and 10'),
  body('difficulty')
    .optional()
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Invalid difficulty')
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.MANAGER),
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
 * @route   GET /api/ideas/my
 * @desc    Get current user's submitted ideas
 * @access  Private (All authenticated users)
 */
router.get(
  '/my',
  authenticate,
  pagination,
  parseFilters(['ideabox_type', 'status', 'category']),
  ideaController.getMyIdeas
);

/**
 * @route   GET /api/ideas/published
 * @desc    Get published ideas (Pink Box public board)
 * @access  Public (No authentication required)
 */
router.get(
  '/published',
  // Public endpoint - no authentication required
  ideaController.getPublishedIdeas
);

/**
 * @route   GET /api/ideas/to-review
 * @desc    Get ideas that need current user's review
 * @access  Private (Supervisor and above)
 */
router.get(
  '/to-review',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  pagination,
  parseFilters(['ideabox_type', 'category']),
  ideaController.getIdeasToReview
);

/**
 * @route   GET /api/ideas/department/:departmentId
 * @desc    Get ideas by department
 * @access  Private (Supervisor and above)
 */
router.get(
  '/department/:departmentId',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [param('departmentId').isUUID().withMessage('Invalid department ID')],
  validate,
  pagination,
  parseFilters(['ideabox_type', 'status']),
  ideaController.getIdeasByDepartment
);

/**
 * @route   GET /api/ideas/kaizen-bank
 * @desc    Get archived (implemented) ideas for Kaizen Bank
 * @access  Private
 */
router.get(
  '/kaizen-bank',
  authenticate,
  pagination,
  parseFilters(['category', 'ideabox_type']),
  ideaController.getKaizenBank
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.SUPERVISOR),
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
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    param('id').isUUID(),
    body('difficulty_level').isIn(['A', 'B', 'C', 'D']).withMessage('Difficulty must be A, B, C, or D')
  ],
  validate,
  ideaController.updateDifficultyLevel
);

// =====================================================
// PINK BOX WORKFLOW ROUTES (Hòm Hồng / ピンクボックス)
// =====================================================

/**
 * @swagger
 * /api/ideas/status-labels:
 *   get:
 *     summary: Get status labels (bilingual)
 *     description: Lấy danh sách nhãn trạng thái / ステータスラベル一覧を取得
 *     tags: [Ideas]
 *     responses:
 *       200:
 *         description: Status labels in Vietnamese and Japanese
 */
router.get(
  '/status-labels',
  authenticate,
  ideaController.getStatusLabels
);

/**
 * @swagger
 * /api/ideas/department-inbox:
 *   get:
 *     summary: Get ideas forwarded to user's department
 *     description: Lấy ý kiến được chuyển đến phòng ban / 部門に転送された意見を取得
 *     tags: [Ideas - Pink Box]
 *     responses:
 *       200:
 *         description: Ideas in department inbox
 */
router.get(
  '/department-inbox',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  ideaController.getDepartmentInbox
);

/**
 * @swagger
 * /api/ideas/{id}/forward:
 *   post:
 *     summary: Forward pink box idea to department
 *     description: Chuyển ý kiến hòm hồng cho phòng ban / ピンクボックスの意見を部門に転送
 *     tags: [Ideas - Pink Box]
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
 *               - department_id
 *             properties:
 *               department_id:
 *                 type: string
 *                 format: uuid
 *               note:
 *                 type: string
 *                 description: Note in Vietnamese
 *               note_ja:
 *                 type: string
 *                 description: Note in Japanese
 *     responses:
 *       200:
 *         description: Idea forwarded successfully
 */
router.post(
  '/:id/forward',
  authenticate,
  authorizeLevel(LEVELS.ADMIN), // Only Admin/GM can forward
  [
    param('id').isUUID(),
    body('department_id').isUUID().withMessage('Department ID is required'),
    body('note').optional().trim(),
    body('note_ja').optional().trim()
  ],
  validate,
  ideaController.forwardToDepartment
);

/**
 * @swagger
 * /api/ideas/{id}/department-response:
 *   post:
 *     summary: Department responds to forwarded idea
 *     description: Phòng ban trả lời ý kiến / 部門が意見に回答する
 *     tags: [Ideas - Pink Box]
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
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 description: Response in Vietnamese
 *               response_ja:
 *                 type: string
 *                 description: Response in Japanese
 *     responses:
 *       200:
 *         description: Response submitted successfully
 */
router.post(
  '/:id/department-response',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    param('id').isUUID(),
    body('response').notEmpty().withMessage('Response is required'),
    body('response_ja').optional().trim()
  ],
  validate,
  ideaController.departmentRespond
);

/**
 * @swagger
 * /api/ideas/{id}/request-revision:
 *   post:
 *     summary: Request revision from department
 *     description: Yêu cầu phòng ban bổ sung / 部門に修正を依頼
 *     tags: [Ideas - Pink Box]
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
 *               - revision_note
 *             properties:
 *               revision_note:
 *                 type: string
 *               revision_note_ja:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revision requested
 */
router.post(
  '/:id/request-revision',
  authenticate,
  authorizeLevel(LEVELS.ADMIN),
  [
    param('id').isUUID(),
    body('revision_note').notEmpty().withMessage('Revision note is required'),
    body('revision_note_ja').optional().trim()
  ],
  validate,
  ideaController.requestRevision
);

/**
 * @swagger
 * /api/ideas/{id}/publish:
 *   post:
 *     summary: Publish response to public board
 *     description: Công bố phản hồi lên trang chung / 回答を公開掲示板に公開
 *     tags: [Ideas - Pink Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               published_response:
 *                 type: string
 *                 description: Edited response for public (Vietnamese)
 *               published_response_ja:
 *                 type: string
 *                 description: Edited response for public (Japanese)
 *     responses:
 *       200:
 *         description: Response published successfully
 */
router.post(
  '/:id/publish',
  authenticate,
  authorizeLevel(LEVELS.ADMIN),
  [
    param('id').isUUID(),
    body('published_response').optional().trim(),
    body('published_response_ja').optional().trim()
  ],
  validate,
  ideaController.publishResponse
);

// =====================================================
// MEETING SCHEDULING ROUTES (Đặt phòng họp / 会議室予約)
// =====================================================

/**
 * @swagger
 * /api/ideas/{id}/schedule-meeting:
 *   post:
 *     summary: Schedule meeting for idea discussion
 *     description: Đặt lịch họp face-to-face / 対面ミーティングを予約
 *     tags: [Ideas - Meeting]
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
 *               - room_id
 *               - start_time
 *               - end_time
 *             properties:
 *               room_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               title:
 *                 type: string
 *               title_ja:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Meeting scheduled successfully
 */
router.post(
  '/:id/schedule-meeting',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    param('id').isUUID(),
    body('room_id').isUUID().withMessage('Room ID is required'),
    body('start_time').isISO8601().withMessage('Valid start time is required'),
    body('end_time').isISO8601().withMessage('Valid end time is required'),
    body('title').optional().trim(),
    body('title_ja').optional().trim(),
    body('note').optional().trim()
  ],
  validate,
  ideaController.scheduleMeeting
);

/**
 * @swagger
 * /api/ideas/{id}/meeting:
 *   get:
 *     summary: Get meeting info for an idea
 *     description: Lấy thông tin cuộc họp / 会議情報を取得
 *     tags: [Ideas - Meeting]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Meeting info or null if not scheduled
 */
router.get(
  '/:id/meeting',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaController.getIdeaMeeting
);

// =====================================================
// WHITE BOX WORKFLOW ROUTES (Hòm Trắng / ホワイトボックス)
// =====================================================

/**
 * @swagger
 * /api/ideas/check-duplicate:
 *   post:
 *     summary: Check duplicate before submitting idea
 *     description: Kiểm tra trùng lặp trước khi gửi / 送信前に重複をチェック
 *     tags: [Ideas - White Box]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               whitebox_subtype:
 *                 type: string
 *                 enum: [idea, opinion]
 *               ideabox_type:
 *                 type: string
 *                 enum: [white, pink]
 *     responses:
 *       200:
 *         description: Duplicate check result
 */
router.post(
  '/check-duplicate',
  authenticate,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('whitebox_subtype').optional().isIn(['idea', 'opinion']),
    body('ideabox_type').optional().isIn(['white', 'pink'])
  ],
  validate,
  ideaSupportController.checkDuplicate
);

/**
 * @swagger
 * /api/ideas/workflow-stages:
 *   get:
 *     summary: Get all workflow stages
 *     description: Lấy danh sách các giai đoạn workflow / ワークフローステージ一覧を取得
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: query
 *         name: applicable_to
 *         schema:
 *           type: string
 *           enum: [white, pink]
 *     responses:
 *       200:
 *         description: List of workflow stages
 */
router.get(
  '/workflow-stages',
  authenticate,
  ideaSupportController.getWorkflowStages
);

/**
 * @swagger
 * /api/ideas/{id}/support:
 *   post:
 *     summary: Support an idea
 *     description: Ủng hộ ý tưởng / アイデアを支持する
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Optional support message
 *     responses:
 *       201:
 *         description: Support added successfully
 */
router.post(
  '/:id/support',
  authenticate,
  [
    param('id').isUUID(),
    body('message').optional().trim()
  ],
  validate,
  ideaSupportController.supportIdea
);

/**
 * @swagger
 * /api/ideas/{id}/remind:
 *   post:
 *     summary: Remind about an idea
 *     description: Nhắc nhở về ý tưởng / アイデアについてリマインドする
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Optional remind message
 *     responses:
 *       201:
 *         description: Remind sent successfully
 */
router.post(
  '/:id/remind',
  authenticate,
  [
    param('id').isUUID(),
    body('message').optional().trim()
  ],
  validate,
  ideaSupportController.remindIdea
);

/**
 * @swagger
 * /api/ideas/{id}/support:
 *   delete:
 *     summary: Remove support/remind
 *     description: Xóa ủng hộ/nhắc nhở / 支持/リマインドを削除
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: support_type
 *         schema:
 *           type: string
 *           enum: [support, remind]
 *     responses:
 *       200:
 *         description: Support/remind removed
 */
router.delete(
  '/:id/support',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaSupportController.removeSupport
);

/**
 * @swagger
 * /api/ideas/{id}/supports:
 *   get:
 *     summary: Get supports/reminds for an idea
 *     description: Lấy danh sách ủng hộ/nhắc nhở / 支持/リマインド一覧を取得
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: support_type
 *         schema:
 *           type: string
 *           enum: [support, remind]
 *     responses:
 *       200:
 *         description: List of supports/reminds
 */
router.get(
  '/:id/supports',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaSupportController.getIdeaSupports
);

/**
 * @swagger
 * /api/ideas/{id}/workflow-history:
 *   get:
 *     summary: Get workflow history (status transitions)
 *     description: Lấy lịch sử workflow / ワークフロー履歴を取得
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Workflow history
 */
router.get(
  '/:id/workflow-history',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaSupportController.getWorkflowHistory
);

/**
 * @swagger
 * /api/ideas/{id}/workflow-stage:
 *   put:
 *     summary: Update workflow stage
 *     description: Cập nhật giai đoạn workflow / ワークフローステージを更新
 *     tags: [Ideas - White Box]
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
 *               - stage
 *             properties:
 *               stage:
 *                 type: string
 *               reason:
 *                 type: string
 *               reason_ja:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stage updated
 */
router.put(
  '/:id/workflow-stage',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  [
    param('id').isUUID(),
    body('stage').notEmpty().withMessage('Stage is required'),
    body('reason').optional().trim(),
    body('reason_ja').optional().trim()
  ],
  validate,
  ideaSupportController.updateWorkflowStage
);

/**
 * @swagger
 * /api/ideas/{id}/workflow:
 *   get:
 *     summary: Get idea with full workflow info
 *     description: Lấy ý tưởng với đầy đủ thông tin workflow / ワークフロー情報付きでアイデアを取得
 *     tags: [Ideas - White Box]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Idea with workflow info
 */
router.get(
  '/:id/workflow',
  authenticate,
  param('id').isUUID(),
  validate,
  ideaSupportController.getIdeaWorkflow
);

module.exports = router;
