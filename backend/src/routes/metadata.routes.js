const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadata.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { LEVELS } = require('../constants/roles');

/**
 * =============================================================
 * METADATA ROUTES - API cho App Mobile lấy các danh sách enum, 
 * filter options, menu configuration theo role
 * =============================================================
 * Phục vụ cho các dropdown, filter chips, navigation menu
 * Đảm bảo App không cần hardcode bất kỳ giá trị nào
 * =============================================================
 */

/**
 * @swagger
 * /api/metadata/enums:
 *   get:
 *     summary: Get all enum values for forms/filters
 *     tags: [Metadata]
 *     description: Returns all enum types used in the system (incident types, priorities, statuses, etc.)
 *     responses:
 *       200:
 *         description: All enum values
 */
router.get(
  '/enums',
  authenticate,
  metadataController.getAllEnums
);

/**
 * @swagger
 * /api/metadata/incidents/options:
 *   get:
 *     summary: Get incident form options
 *     tags: [Metadata]
 *     description: Returns all options for incident forms (types, priorities, statuses)
 *     responses:
 *       200:
 *         description: Incident form options
 */
router.get(
  '/incidents/options',
  authenticate,
  metadataController.getIncidentOptions
);

/**
 * @swagger
 * /api/metadata/ideas/options:
 *   get:
 *     summary: Get idea form options
 *     tags: [Metadata]
 *     description: Returns all options for idea forms (categories, difficulties, statuses)
 *     responses:
 *       200:
 *         description: Idea form options
 */
router.get(
  '/ideas/options',
  authenticate,
  metadataController.getIdeaOptions
);

/**
 * @swagger
 * /api/metadata/filters/incidents:
 *   get:
 *     summary: Get incident filter options based on user role
 *     tags: [Metadata]
 *     description: Returns available filter options for incident list based on user permissions
 *     responses:
 *       200:
 *         description: Available filter options
 */
router.get(
  '/filters/incidents',
  authenticate,
  metadataController.getIncidentFilters
);

/**
 * @swagger
 * /api/metadata/filters/ideas:
 *   get:
 *     summary: Get idea filter options based on user role
 *     tags: [Metadata]
 *     description: Returns available filter options for idea list based on user permissions
 *     responses:
 *       200:
 *         description: Available filter options
 */
router.get(
  '/filters/ideas',
  authenticate,
  metadataController.getIdeaFilters
);

/**
 * @swagger
 * /api/metadata/filters/incidents/dropdown:
 *   get:
 *     summary: Get incident filter dropdown for App Mobile
 *     tags: [Metadata]
 *     description: Returns 2-column filter dropdown matching App UI design
 *     responses:
 *       200:
 *         description: Dropdown layout with priorities and statuses
 */
router.get(
  '/filters/incidents/dropdown',
  authenticate,
  metadataController.getIncidentFilterDropdown
);

/**
 * @swagger
 * /api/metadata/navigation:
 *   get:
 *     summary: Get navigation menu based on user role
 *     tags: [Metadata]
 *     description: Returns available menu items and screens based on user role/level
 *     responses:
 *       200:
 *         description: Navigation menu configuration
 */
router.get(
  '/navigation',
  authenticate,
  metadataController.getNavigationMenu
);

/**
 * @swagger
 * /api/metadata/permissions:
 *   get:
 *     summary: Get current user's permissions
 *     tags: [Metadata]
 *     description: Returns detailed permissions for current user
 *     responses:
 *       200:
 *         description: User permissions
 */
router.get(
  '/permissions',
  authenticate,
  metadataController.getUserPermissions
);

/**
 * @swagger
 * /api/metadata/roles:
 *   get:
 *     summary: Get all roles hierarchy
 *     tags: [Metadata]
 *     description: Returns all roles with their levels and permissions (Admin only)
 *     responses:
 *       200:
 *         description: Roles hierarchy
 */
router.get(
  '/roles',
  authenticate,
  authorizeLevel(LEVELS.ADMIN),
  metadataController.getRolesHierarchy
);

/**
 * @swagger
 * /api/metadata/departments/options:
 *   get:
 *     summary: Get department dropdown options
 *     tags: [Metadata]
 *     description: Returns departments formatted for dropdown selection
 *     responses:
 *       200:
 *         description: Department options
 */
router.get(
  '/departments/options',
  authenticate,
  metadataController.getDepartmentOptions
);

/**
 * @swagger
 * /api/metadata/users/options:
 *   get:
 *     summary: Get user dropdown options for assignment
 *     tags: [Metadata]
 *     description: Returns users formatted for dropdown selection (based on permissions)
 *     responses:
 *       200:
 *         description: User options for assignment
 */
router.get(
  '/users/options',
  authenticate,
  metadataController.getUserOptions
);

/**
 * @swagger
 * /api/metadata/app-config:
 *   get:
 *     summary: Get app configuration for mobile
 *     tags: [Metadata]
 *     description: Returns app configuration including API versions, feature flags, etc.
 *     responses:
 *       200:
 *         description: App configuration
 */
router.get(
  '/app-config',
  authenticate,
  metadataController.getAppConfig
);

module.exports = router;
