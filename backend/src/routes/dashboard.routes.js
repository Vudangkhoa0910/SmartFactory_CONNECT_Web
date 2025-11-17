const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview with counts and recent items
 * @access  Private
 */
router.get(
  '/overview',
  authenticate,
  dashboardController.getOverview
);

/**
 * @route   GET /api/dashboard/incidents/stats
 * @desc    Get detailed incident statistics for dashboard
 * @access  Private (Manager+)
 */
router.get(
  '/incidents/stats',
  authenticate,
  authorizeLevel(4), // Admin, Factory Manager, Production Manager, Supervisor
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
  authorizeLevel(4), // Admin, Factory Manager, Production Manager, Supervisor
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
  authorizeLevel(4),
  dashboardController.getComprehensiveDashboard
);

module.exports = router;
