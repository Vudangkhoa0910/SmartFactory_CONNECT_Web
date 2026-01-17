const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { LEVELS } = require('../constants/roles');

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview
 *     tags: [Dashboard]
 *     description: Returns counts and recent items for dashboard
 *     responses:
 *       200:
 *         description: Dashboard overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     counts:
 *                       type: object
 *                     recent_incidents:
 *                       type: array
 *                     recent_news:
 *                       type: array
 */
router.get(
  '/overview',
  authenticate,
  dashboardController.getOverview
);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardSummary'
 */
router.get(
  '/summary',
  authenticate,
  dashboardController.getSummary
);

/**
 * @swagger
 * /api/dashboard/incident-trend:
 *   get:
 *     summary: Get incident trend data
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *         description: Time period for trend data
 *     responses:
 *       200:
 *         description: Incident trend data for charts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/IncidentTrend'
 */
router.get(
  '/incident-trend',
  authenticate,
  dashboardController.getIncidentTrend
);

/**
 * @swagger
 * /api/dashboard/processing-time:
 *   get:
 *     summary: Get processing time by priority
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Processing time statistics
 */
router.get(
  '/processing-time',
  authenticate,
  dashboardController.getProcessingTime
);

/**
 * @route   GET /api/dashboard/department-kpi
 * @desc    Get department KPI data
 * @access  Private
 */
router.get(
  '/department-kpi',
  authenticate,
  dashboardController.getDepartmentKPI
);

/**
 * @route   GET /api/dashboard/top-machines
 * @desc    Get top machines with errors
 * @access  Private
 */
router.get(
  '/top-machines',
  authenticate,
  dashboardController.getTopMachines
);

/**
 * @route   GET /api/dashboard/priority-distribution
 * @desc    Get priority distribution
 * @access  Private
 */
router.get(
  '/priority-distribution',
  authenticate,
  dashboardController.getPriorityDistribution
);

/**
 * @route   GET /api/dashboard/department-stats
 * @desc    Get department statistics
 * @access  Private
 */
router.get(
  '/department-stats',
  authenticate,
  dashboardController.getDepartmentStats
);

/**
 * @route   GET /api/dashboard/realtime
 * @desc    Get realtime stats
 * @access  Private
 */
router.get(
  '/realtime',
  authenticate,
  dashboardController.getRealTimeStats
);

/**
 * @route   GET /api/dashboard/idea-difficulty
 * @desc    Get idea difficulty distribution
 * @access  Private
 */
router.get(
  '/idea-difficulty',
  authenticate,
  dashboardController.getIdeaDifficulty
);

/**
 * @route   GET /api/dashboard/idea-status
 * @desc    Get idea status distribution
 * @access  Private
 */
router.get(
  '/idea-status',
  authenticate,
  dashboardController.getIdeaStatus
);

/**
 * @route   GET /api/dashboard/incidents/stats
 * @desc    Get detailed incident statistics for dashboard
 * @access  Private (Manager+)
 */
router.get(
  '/incidents/stats',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  dashboardController.getIncidentStats
);

/**
 * @route   GET /api/dashboard/ideas/stats
 * @desc    Get detailed idea statistics for dashboard
 * @access  Private (Manager+)
 */
router.get(
  '/ideas/stats',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  dashboardController.getIdeaStats
);

/**
 * @route   GET /api/dashboard/comprehensive
 * @desc    Get comprehensive dashboard data (all stats)
 * @access  Private (Manager+)
 */
router.get(
  '/comprehensive',
  authenticate,
  authorizeLevel(LEVELS.SUPERVISOR),
  dashboardController.getComprehensiveDashboard
);

module.exports = router;
