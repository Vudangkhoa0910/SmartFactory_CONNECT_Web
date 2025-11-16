const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const departmentController = require('../controllers/department.controller');
const { authenticate, authorizeLevel } = require('../middlewares/auth.middleware');
const { validate, pagination, parseSort } = require('../middlewares/validation.middleware');

// Validation rules
const createDepartmentValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ max: 50 })
    .withMessage('Code must not exceed 50 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent department ID'),
  body('manager_id')
    .optional()
    .isUUID()
    .withMessage('Invalid manager ID')
];

const updateDepartmentValidation = [
  param('id').isUUID().withMessage('Invalid department ID'),
  body('code')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Code must not exceed 50 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Invalid parent department ID'),
  body('manager_id')
    .optional()
    .isUUID()
    .withMessage('Invalid manager ID'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean')
];

const departmentIdValidation = [
  param('id').isUUID().withMessage('Invalid department ID')
];

// Routes

/**
 * @route   GET /api/departments/tree
 * @desc    Get department tree structure
 * @access  Private (All authenticated users)
 */
router.get(
  '/tree',
  authenticate,
  departmentController.getDepartmentTree
);

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  authenticate,
  pagination,
  parseSort,
  departmentController.getDepartments
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Private (All authenticated users)
 */
router.get(
  '/:id',
  authenticate,
  departmentIdValidation,
  validate,
  departmentController.getDepartmentById
);

/**
 * @route   GET /api/departments/:id/employees
 * @desc    Get department employees
 * @access  Private (Team Leader and above)
 */
router.get(
  '/:id/employees',
  authenticate,
  authorizeLevel(5), // Team Leader and above
  departmentIdValidation,
  validate,
  departmentController.getDepartmentEmployees
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Private (Admin, Factory Manager)
 */
router.post(
  '/',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  createDepartmentValidation,
  validate,
  departmentController.createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (Admin, Factory Manager)
 */
router.put(
  '/:id',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  updateDepartmentValidation,
  validate,
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (Admin, Factory Manager)
 */
router.delete(
  '/:id',
  authenticate,
  authorizeLevel(2), // Factory Manager and above
  departmentIdValidation,
  validate,
  departmentController.deleteDepartment
);

module.exports = router;
