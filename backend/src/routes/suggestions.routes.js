/**
 * Suggestions Routes
 * Real-time suggestions API for CONNECT features
 * 
 * All endpoints require authentication
 */
const express = require('express');
const router = express.Router();
const suggestionsController = require('../controllers/suggestions.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Suggestions
 *   description: Real-time suggestions for incidents, ideas (CONNECT features)
 */

/**
 * @swagger
 * /api/suggestions/status:
 *   get:
 *     summary: Get suggestion service status
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service status
 */
router.get('/status', authenticate, suggestionsController.getStatus);

/**
 * @swagger
 * /api/suggestions/incidents:
 *   get:
 *     summary: Get similar incidents while typing
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *         description: Search query (title or description)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           maximum: 20
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: List of similar incidents
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       resolution:
 *                         type: string
 *                       similarity:
 *                         type: number
 *                 source:
 *                   type: string
 *                   enum: [rag, postgres]
 */
router.get('/incidents', authenticate, suggestionsController.getSimilarIncidents);

/**
 * @swagger
 * /api/suggestions/ideas:
 *   get:
 *     summary: Get similar ideas while typing
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of similar ideas
 */
router.get('/ideas', authenticate, suggestionsController.getSimilarIdeas);

/**
 * @swagger
 * /api/suggestions/department:
 *   post:
 *     summary: Get department suggestion for incident
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *               location:
 *                 type: string
 *               incident_type:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department suggestion with confidence score
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 suggestion:
 *                   type: object
 *                   properties:
 *                     department_id:
 *                       type: string
 *                     department_name:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     auto_assign:
 *                       type: boolean
 *                 similar_incidents:
 *                   type: array
 */
router.post('/department', authenticate, suggestionsController.suggestDepartment);

/**
 * @swagger
 * /api/suggestions/auto-fill:
 *   post:
 *     summary: Auto-fill form fields based on description
 *     tags: [Suggestions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 minLength: 10
 *     responses:
 *       200:
 *         description: Suggested form field values
 */
router.post('/auto-fill', authenticate, suggestionsController.autoFillForm);

module.exports = router;
