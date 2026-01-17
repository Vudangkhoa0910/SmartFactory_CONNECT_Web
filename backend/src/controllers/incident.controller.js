const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const path = require('path');
const fs = require('fs').promises;
const ExcelJS = require('exceljs');
const escalationService = require('../services/escalation.service');
const ratingService = require('../services/rating.service');
const emailService = require('../services/email.service');
const { isAutoAssignEnabled } = require('./settings.controller');
const { getLanguageFromRequest } = require('../utils/i18n.helper');
const { uploadFilesToGridFS, updateFilesRelatedId } = require('../utils/media-upload.helper');

// RAG Service configuration
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

/**
 * Helper function to call RAG service for department suggestion
 * Supports multi-field matching for better accuracy
 */
async function suggestDepartmentFromRAG(description, location = null, incident_type = null, priority = null) {
  try {
    // Build request body with all available fields
    const requestBody = {
      description,
      ...(location && { location }),
      ...(incident_type && { incident_type }),
      ...(priority && { priority })
    };

    console.log('[RAG] Sending multi-field request:', JSON.stringify(requestBody));

    const response = await fetch(`${RAG_SERVICE_URL}/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout for background processing
    });

    if (!response.ok) {
      console.log('[RAG] Service returned error:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('[RAG] Suggestion result:', JSON.stringify(data));

    if (data.success && data.suggestion) {
      // Extract similar_incidents (limit to top 5)
      const similarIncidents = (data.similar_incidents || []).slice(0, 5).map(inc => ({
        id: inc.id,
        title: inc.main_text || inc.title || '',
        description: inc.description || '',
        similarity: inc.similarity || 0,
        status: inc.status || 'unknown',
        department_name: inc.department_name || '',
        created_at: inc.created_at
      }));

      return {
        department_id: data.suggestion.department_id,
        department_name: data.suggestion.department_name,
        confidence: data.suggestion.confidence,
        auto_assign: data.suggestion.auto_assign,
        similar_incidents: similarIncidents
      };
    }
    return null;
  } catch (error) {
    console.log('[RAG] Service unavailable:', error.message);
    return null;
  }
}

/**
 * Background RAG processing - runs AFTER response sent to mobile
 * Updates incident with department suggestion asynchronously
 */
async function processRAGInBackground(incidentId, description, location, incident_type, priority, reporterId) {
  try {
    console.log(`[RAG-BG] Starting background processing for incident ${incidentId}`);

    // Call RAG with multi-field data
    const rag_suggestion = await suggestDepartmentFromRAG(description, location, incident_type, priority);

    if (rag_suggestion && rag_suggestion.department_id) {
      // Update incident with RAG suggestion
      // If auto_assign (>=85% confidence): assign department AND move to assigned
      // If not auto_assign (<85%): just save suggestion, keep status as pending
      const updateQuery = rag_suggestion.auto_assign
        ? `UPDATE incidents 
           SET assigned_department_id = $1, 
               rag_suggestion = $2,
               status = 'assigned',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`
        : `UPDATE incidents 
           SET rag_suggestion = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`;

      const updateValues = rag_suggestion.auto_assign
        ? [rag_suggestion.department_id, JSON.stringify(rag_suggestion), incidentId]
        : [JSON.stringify(rag_suggestion), incidentId];

      await db.query(updateQuery, updateValues);

      // Log history - different action based on auto_assign
      const historyAction = rag_suggestion.auto_assign ? 'ai_auto_assigned' : 'rag_processed';
      await db.query(
        `INSERT INTO incident_history (incident_id, action, performed_by, details)
         VALUES ($1, $2, $3, $4)`,
        [incidentId, historyAction, reporterId, JSON.stringify({
          department_id: rag_suggestion.department_id,
          department_name: rag_suggestion.department_name,
          confidence: rag_suggestion.confidence,
          auto_assigned: rag_suggestion.auto_assign,
          new_status: rag_suggestion.auto_assign ? 'assigned' : 'pending'
        })]
      );

      const statusMsg = rag_suggestion.auto_assign ? '→ assigned' : '(suggest only)';
      console.log(`[RAG-BG] Incident ${incidentId} updated: ${rag_suggestion.department_name} (${(rag_suggestion.confidence * 100).toFixed(0)}%) ${statusMsg}`);

      // Send email to admin when auto-assigned
      if (rag_suggestion.auto_assign && emailService.isAvailable()) {
        try {
          // Get incident details for email
          const incidentResult = await db.query(
            `SELECT i.*, u.full_name as reporter_name 
             FROM incidents i 
             LEFT JOIN users u ON i.reporter_id = u.id 
             WHERE i.id = $1`,
            [incidentId]
          );

          if (incidentResult.rows.length > 0) {
            const incident = incidentResult.rows[0];
            await emailService.sendAutoAssignNotificationEmail({
              incident_id: incidentId,
              title: incident.title,
              description: incident.description,
              incident_type: incident.incident_type,
              priority: incident.priority,
              location: incident.location,
              reporter_name: incident.reporter_name,
              department_name: rag_suggestion.department_name,
              confidence: rag_suggestion.confidence
            });
            console.log(`[RAG-BG] Auto-assign email sent for incident ${incidentId}`);
          }
        } catch (emailError) {
          console.error(`[RAG-BG] Failed to send auto-assign email:`, emailError.message);
        }
      }
    } else {
      console.log(`[RAG-BG] No suggestion for incident ${incidentId}`);
    }
  } catch (error) {
    console.error(`[RAG-BG] Error processing incident ${incidentId}:`, error.message);
  }
}

/**
 * Create new incident
 * POST /api/incidents
 * 
 * FAST RESPONSE: Saves incident immediately, RAG runs in background
 */
const createIncident = asyncHandler(async (req, res) => {
  const {
    incident_type,
    title,
    title_ja,
    description,
    description_ja,
    location,
    department_id,
    priority
  } = req.body;

  const reporter_id = req.user.id;

  // Upload files to MongoDB GridFS
  let attachments = [];
  if (req.files && req.files.length > 0) {
    attachments = await uploadFilesToGridFS(req.files, {
      type: 'incident',
      relatedType: 'incident',
      uploadedBy: reporter_id,
    });
  }

  // INSERT IMMEDIATELY - No waiting for RAG
  const query = `
    INSERT INTO incidents (
      incident_type,
      title,
      title_ja,
      description,
      description_ja,
      location,
      department_id,
      assigned_department_id,
      reporter_id,
      priority,
      attachments,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, 'pending')
    RETURNING *
  `;

  const values = [
    incident_type,
    title,
    title_ja || null,
    description,
    description_ja || null,
    location,
    department_id || null,
    reporter_id,
    priority || 'medium',
    JSON.stringify(attachments)
  ];

  const result = await db.query(query, values);
  const incident = result.rows[0];

  // Update files with incident ID (for linking)
  if (attachments.length > 0) {
    const fileIds = attachments.map(a => a.file_id);
    setImmediate(() => {
      updateFilesRelatedId(fileIds, incident.id, 'incident');
    });
  }

  // Log history - FAST, no RAG info yet
  const historyDetails = {
    status: 'pending',
    rag_processing: 'pending'  // Will be updated by background process
  };

  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'created', $2, $3)`,
    [incident.id, reporter_id, JSON.stringify(historyDetails)]
  );

  // RESPOND IMMEDIATELY to mobile - don't wait for RAG
  res.status(201).json({
    success: true,
    message: 'Incident reported successfully',
    data: incident,
    rag_processing: 'background'  // Indicate RAG is processing in background
  });

  // BROADCAST incident_created for real-time updates (e.g., AnomalyAlerts)
  const io = req.app.get('io');
  if (io && io.broadcastIncident) {
    io.broadcastIncident('incident_created', {
      id: incident.id,
      title: incident.title,
      incident_type: incident.incident_type,
      location: incident.location,
      priority: incident.priority,
      created_at: incident.created_at
    });
  }

  // Send FCM push notifications to supervisors+ of the department
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIncidentCreatedNotification(incident);
      } catch (err) {
        console.error('[Incident] Error sending push notification:', err.message);
      }
    });
  }

  // START RAG PROCESSING IN BACKGROUND (after response sent)
  if (description && description.length >= 10 && isAutoAssignEnabled()) {
    // Use setImmediate to ensure response is sent first
    setImmediate(() => {
      processRAGInBackground(
        incident.id,
        description,
        location,
        incident_type,
        priority || 'medium',
        reporter_id
      );
    });
  } else if (!isAutoAssignEnabled()) {
    console.log('[RAG] Auto-assign is DISABLED, skipping background processing');
  }
});

/**
 * Get all incidents with filters
 * GET /api/incidents
 */
const getIncidents = asyncHandler(async (req, res) => {
  const { pagination, sort, filters } = req;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userLevel = req.user.level;
  const lang = getLanguageFromRequest(req);

  // Build WHERE conditions based on role
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Filter by role permissions
  // User requested that everyone can view all incidents
  /*
  if (userLevel < 5) {
    // Admin, Factory Manager, Production Manager, Supervisor, Team Leader can see all
    // No restriction
  } else if (userLevel === 5) {
    // Team Leader can see assigned to them or their team
    conditions.push(`(assigned_to = $${paramIndex} OR department_id IN (SELECT id FROM departments WHERE manager_id = $${paramIndex}))`);
    params.push(userId);
    paramIndex++;
  } else {
    // Regular users can only see their own incidents
    conditions.push(`reporter_id = $${paramIndex}`);
    params.push(userId);
    paramIndex++;
  }
  */

  // Apply search filter
  if (req.query.search) {
    conditions.push(`(
      LOWER(i.title) LIKE $${paramIndex}
      OR LOWER(COALESCE(i.title_ja, '')) LIKE $${paramIndex}
      OR LOWER(i.description) LIKE $${paramIndex}
      OR LOWER(COALESCE(i.description_ja, '')) LIKE $${paramIndex}
      OR LOWER(COALESCE(i.location, '')) LIKE $${paramIndex}
    )`);
    params.push(`%${req.query.search.toLowerCase()}%`);
    paramIndex++;
  }

  // Apply filters
  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.incident_type) {
    conditions.push(`incident_type = $${paramIndex}`);
    params.push(filters.incident_type);
    paramIndex++;
  }

  if (filters.priority) {
    conditions.push(`priority = $${paramIndex}`);
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters.department_id) {
    conditions.push(`department_id = $${paramIndex}`);
    params.push(filters.department_id);
    paramIndex++;
  }

  if (filters.assigned_to) {
    conditions.push(`assigned_to = $${paramIndex}`);
    params.push(filters.assigned_to);
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`i.created_at >= $${paramIndex}`);
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`i.created_at <= $${paramIndex}`);
    params.push(filters.date_to);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM incidents i ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);

  // Get incidents with pagination
  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
      u.full_name as reporter_name,
      u.employee_code as reporter_code,
      d.name as department_name,
      a.full_name as assigned_to_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    ${whereClause}
    ORDER BY ${sort.sortBy} ${sort.sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(pagination.limit, pagination.offset);

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit)
    }
  });
});

/**
 * Get incident by ID
 * GET /api/incidents/:id
 */
const getIncidentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userLevel = req.user.level;
  const lang = getLanguageFromRequest(req);

  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
      u.full_name as reporter_name,
      u.employee_code as reporter_code,
      u.email as reporter_email,
      d.name as department_name,
      a.full_name as assigned_to_name,
      a.email as assigned_to_email,
      r.full_name as resolved_by_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.resolved_by = r.id
    WHERE i.id = $1
  `;

  const result = await db.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  const incident = result.rows[0];

  // Check access permissions
  // User requested that everyone can view all incidents
  /*
  if (userLevel >= 6 && incident.reporter_id !== userId) {
    throw new AppError('You do not have permission to view this incident', 403);
  }
  */

  // Get comments
  const commentsQuery = `
    SELECT 
      c.*,
      COALESCE(${lang === 'ja' ? 'c.comment_ja' : 'NULL'}, c.comment) as comment,
      u.full_name as user_name,
      u.employee_code,
      u.role
    FROM incident_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.incident_id = $1
    ORDER BY c.created_at ASC
  `;

  const commentsResult = await db.query(commentsQuery, [id]);
  incident.comments = commentsResult.rows;

  // Get history
  const historyQuery = `
    SELECT 
      h.*,
      u.full_name as performed_by_name,
      u.role
    FROM incident_history h
    LEFT JOIN users u ON h.performed_by = u.id
    WHERE h.incident_id = $1
    ORDER BY h.created_at DESC
  `;

  const historyResult = await db.query(historyQuery, [id]);
  incident.history = historyResult.rows;

  res.json({
    success: true,
    data: incident
  });
});

/**
 * Assign incident to user
 * PUT /api/incidents/:id/assign
 */
const assignIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigned_to } = req.body;
  const userId = req.user.id;

  // Get incident
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  // Check if user exists and has appropriate role
  const assignee = await db.query('SELECT * FROM users WHERE id = $1', [assigned_to]);

  if (assignee.rows.length === 0) {
    throw new AppError('Assignee not found', 404);
  }

  // Update incident
  const query = `
    UPDATE incidents
    SET 
      assigned_to = $1,
      status = CASE 
        WHEN status = 'pending' THEN 'assigned'
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [assigned_to, id]);

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'assigned', $2, $3)`,
    [id, userId, JSON.stringify({ assigned_to, assignee_name: assignee.rows[0].full_name })]
  );

  // TODO: Send notification to assigned user

  res.json({
    success: true,
    message: 'Incident assigned successfully',
    data: result.rows[0]
  });
});

/**
 * Update incident status
 * PUT /api/incidents/:id/status
 */
const updateIncidentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const userId = req.user.id;

  // Get incident
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  const oldStatus = incident.rows[0].status;

  // Update status
  const query = `
    UPDATE incidents
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [status, id]);

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'status_changed', $2, $3)`,
    [id, userId, JSON.stringify({ old_status: oldStatus, new_status: status, notes })]
  );

  // If status is 'in_progress', add comment if notes provided
  if (notes) {
    await db.query(
      `INSERT INTO incident_comments (incident_id, user_id, comment)
       VALUES ($1, $2, $3)`,
      [id, userId, notes]
    );
  }

  // TODO: Send notification to reporter

  res.json({
    success: true,
    message: 'Incident status updated successfully',
    data: result.rows[0]
  });
});

/**
 * Add comment to incident
 * POST /api/incidents/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment, comment_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Check if incident exists
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  // Handle attachments
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];

  const query = `
    INSERT INTO incident_comments (incident_id, user_id, comment, comment_ja, attachments)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const result = await db.query(query, [id, userId, comment, comment_ja || null, JSON.stringify(attachments)]);

  // Get user info for response
  const commentWithUser = await db.query(`
    SELECT 
      c.*,
      COALESCE(${lang === 'ja' ? 'c.comment_ja' : 'NULL'}, c.comment) as comment,
      u.full_name as user_name,
      u.employee_code,
      u.role
    FROM incident_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `, [result.rows[0].id]);

  // TODO: Send notification to relevant users

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: commentWithUser.rows[0]
  });
});

/**
 * Escalate incident
 * PUT /api/incidents/:id/escalate
 */
const escalateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { escalate_to, reason } = req.body;
  const userId = req.user.id;

  // Get incident
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  // Verify escalate_to user exists and has higher role
  const escalateTo = await db.query('SELECT * FROM users WHERE id = $1', [escalate_to]);

  if (escalateTo.rows.length === 0) {
    throw new AppError('User to escalate to not found', 404);
  }

  if (escalateTo.rows[0].level >= req.user.level) {
    throw new AppError('Can only escalate to higher level users', 400);
  }

  // Update incident
  const query = `
    UPDATE incidents
    SET 
      escalated_to = $1,
      escalated_at = CURRENT_TIMESTAMP,
      escalation_level = COALESCE(escalation_level, 0) + 1,
      status = 'escalated',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [escalate_to, id]);

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'escalated', $2, $3)`,
    [
      id,
      userId,
      JSON.stringify({
        escalated_to,
        escalate_to_name: escalateTo.rows[0].full_name,
        reason,
        level: result.rows[0].escalation_level
      })
    ]
  );

  // Add comment with reason
  if (reason) {
    await db.query(
      `INSERT INTO incident_comments (incident_id, user_id, comment)
       VALUES ($1, $2, $3)`,
      [id, userId, `Escalated: ${reason}`]
    );
  }

  // TODO: Send notification to escalated user

  res.json({
    success: true,
    message: 'Incident escalated successfully',
    data: result.rows[0]
  });
});

/**
 * Resolve incident
 * PUT /api/incidents/:id/resolve
 */
const resolveIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution_notes, root_cause, corrective_actions } = req.body;
  const userId = req.user.id;

  // Get incident
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  // Update incident
  const query = `
    UPDATE incidents
    SET 
      status = 'resolved',
      resolved_by = $1,
      resolved_at = CURRENT_TIMESTAMP,
      resolution_notes = $2,
      root_cause = $3,
      corrective_actions = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING *
  `;

  const result = await db.query(query, [
    userId,
    resolution_notes,
    root_cause,
    corrective_actions,
    id
  ]);

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'resolved', $2, $3)`,
    [id, userId, JSON.stringify({ resolution_notes, root_cause, corrective_actions })]
  );

  // TODO: Send notification to reporter

  res.json({
    success: true,
    message: 'Incident resolved successfully',
    data: result.rows[0]
  });
});

/**
 * Rate incident resolution
 * POST /api/incidents/:id/rate
 */
const rateIncident = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user.id;

  // Get incident
  const incident = await db.query('SELECT * FROM incidents WHERE id = $1', [id]);

  if (incident.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  // Only reporter can rate
  if (incident.rows[0].reporter_id !== userId) {
    throw new AppError('Only the reporter can rate this incident', 403);
  }

  // Must be resolved
  if (incident.rows[0].status !== 'resolved') {
    throw new AppError('Can only rate resolved incidents', 400);
  }

  // Update rating
  const query = `
    UPDATE incidents
    SET 
      rating = $1,
      rating_feedback = $2,
      status = 'closed',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;

  const result = await db.query(query, [rating, feedback, id]);

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'rated', $2, $3)`,
    [id, userId, JSON.stringify({ rating, feedback })]
  );

  res.json({
    success: true,
    message: 'Thank you for your feedback',
    data: result.rows[0]
  });
});

/**
 * Get incident statistics
 * GET /api/incidents/stats
 */
const getIncidentStats = asyncHandler(async (req, res) => {
  const { date_from, date_to, department_id } = req.query;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (date_from) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(date_to);
    paramIndex++;
  }

  if (department_id) {
    conditions.push(`department_id = $${paramIndex}`);
    params.push(department_id);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_incidents,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
      COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated,
      AVG(CASE WHEN rating IS NOT NULL THEN rating END) as avg_rating,
      AVG(CASE 
        WHEN resolved_at IS NOT NULL THEN 
          EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
      END) as avg_resolution_hours
    FROM incidents
    ${whereClause}
  `;

  const statsResult = await db.query(statsQuery, params);

  // By type
  const byTypeQuery = `
    SELECT 
      incident_type,
      COUNT(*) as count
    FROM incidents
    ${whereClause}
    GROUP BY incident_type
  `;

  const byTypeResult = await db.query(byTypeQuery, params);

  // By priority
  const byPriorityQuery = `
    SELECT 
      priority,
      COUNT(*) as count
    FROM incidents
    ${whereClause}
    GROUP BY priority
  `;

  const byPriorityResult = await db.query(byPriorityQuery, params);

  // By department
  const byDepartmentQuery = `
    SELECT 
      d.name as department_name,
      COUNT(*) as count
    FROM incidents i
    LEFT JOIN departments d ON i.department_id = d.id
    ${whereClause}
    GROUP BY d.name
  `;

  const byDepartmentResult = await db.query(byDepartmentQuery, params);

  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      by_type: byTypeResult.rows,
      by_priority: byPriorityResult.rows,
      by_department: byDepartmentResult.rows
    }
  });
});

/**
 * Get incidents queue (for Command Room)
 * GET /api/incidents/queue
 * Returns only new/pending and critical incidents for quick action
 */
const getIncidentQueue = asyncHandler(async (req, res) => {
  const lang = getLanguageFromRequest(req);
  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
      u.full_name as reporter_name,
      u.employee_code as reporter_code,
      d.name as department_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    WHERE i.status IN ('pending', 'assigned') 
       OR i.priority IN ('critical', 'high')
    ORDER BY 
      CASE i.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      i.created_at DESC
  `;

  const result = await db.query(query);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length
  });
});

/**
 * Quick acknowledge incident
 * POST /api/incidents/:id/acknowledge
 */
const quickAcknowledge = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Update status to assigned
  const updateQuery = `
    UPDATE incidents
    SET status = 'assigned',
        assigned_to = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(updateQuery, [userId, id]);

  if (result.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  const incident = result.rows[0];

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'acknowledged', $2, $3)`,
    [id, userId, JSON.stringify({ status: 'assigned' })]
  );

  // TODO: Send notification

  res.json({
    success: true,
    message: 'Incident acknowledged successfully',
    data: incident
  });
});

/**
 * Quick assign incident to department
 * POST /api/incidents/:id/quick-assign
 */
const quickAssignToDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department_id, assigned_to } = req.body;
  const userId = req.user.id;

  // Update incident
  const updateQuery = `
    UPDATE incidents
    SET department_id = $1,
        assigned_to = $2,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const result = await db.query(updateQuery, [department_id, assigned_to || null, id]);

  if (result.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  const incident = result.rows[0];

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'quick_assigned', $2, $3)`,
    [id, userId, JSON.stringify({ department_id, assigned_to, status: 'assigned' })]
  );

  // TODO: Send notification to department/user

  res.json({
    success: true,
    message: 'Incident assigned successfully',
    data: incident
  });
});

/**
 * Get Kanban board data
 * GET /api/incidents/kanban
 */
const getKanbanData = asyncHandler(async (req, res) => {
  const { department_id } = req.query;
  const userId = req.user.id;
  const userLevel = req.user.level;
  const lang = getLanguageFromRequest(req);

  const statusColumns = [
    'pending',
    'assigned',
    'in_progress',
    'on_hold',
    'resolved',
    'closed'
  ];

  const kanbanData = {};

  for (const status of statusColumns) {
    try {
      let query = `
        SELECT 
          i.id,
          i.incident_type,
          COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
          COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
          i.title as title_vi,
          i.title_ja,
          i.description as description_vi,
          i.description_ja,
          i.location,
          i.status,
          i.priority,
          i.department_id,
          i.reporter_id,
          i.assigned_to,
          i.created_at,
          i.updated_at,
          (SELECT full_name FROM users WHERE id = i.reporter_id) as reporter_name,
          (SELECT full_name FROM users WHERE id = i.assigned_to) as assigned_to_name,
          (SELECT name FROM departments WHERE id = i.department_id) as department_name
        FROM incidents i
        WHERE i.status = $1
      `;

      const params = [status];
      let paramIndex = 2;

      if (department_id) {
        query += ` AND i.department_id = $${paramIndex}`;
        params.push(department_id);
        paramIndex++;
      } else if (userLevel > 3 && req.user.department_id) {
        // Regular users see their department only (if they have one)
        query += ` AND (i.department_id = $${paramIndex} OR i.assigned_to = $${paramIndex + 1})`;
        params.push(req.user.department_id, userId);
        paramIndex += 2;
      }

      query += `
        ORDER BY 
          CASE i.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          i.created_at DESC
        LIMIT 100
      `;

      const result = await db.query(query, params);
      kanbanData[status] = result.rows;
    } catch (error) {
      console.error(`Error fetching ${status} incidents:`, error);
      kanbanData[status] = [];
    }
  }

  res.json({
    success: true,
    data: kanbanData
  });
});

/**
 * Update incident status (for Kanban drag-drop)
 * PATCH /api/incidents/:id/move
 */
const moveIncidentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { new_status, new_assigned_to } = req.body;
  const userId = req.user.id;

  const updateQuery = `
    UPDATE incidents
    SET status = $1,
        assigned_to = COALESCE($2, assigned_to),
        updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;

  const result = await db.query(updateQuery, [new_status, new_assigned_to, id]);

  if (result.rows.length === 0) {
    throw new AppError('Incident not found', 404);
  }

  const incident = result.rows[0];

  // Log history
  await db.query(
    `INSERT INTO incident_history (incident_id, action, performed_by, details)
     VALUES ($1, 'status_changed', $2, $3)`,
    [id, userId, JSON.stringify({ old_status: 'unknown', new_status, new_assigned_to })]
  );

  res.json({
    success: true,
    message: 'Incident status updated',
    data: incident
  });
});

/**
 * Bulk update incidents
 * POST /api/incidents/bulk-update
 */
const bulkUpdateIncidents = asyncHandler(async (req, res) => {
  const { incident_ids, action, data } = req.body;
  const userId = req.user.id;

  if (!incident_ids || incident_ids.length === 0) {
    throw new AppError('No incidents selected', 400);
  }

  let updateQuery = '';
  let params = [];

  switch (action) {
    case 'assign':
      updateQuery = `
        UPDATE incidents
        SET assigned_to = $1, status = 'assigned', updated_at = NOW()
        WHERE id = ANY($2::uuid[])
        RETURNING id
      `;
      params = [data.assigned_to, incident_ids];
      break;

    case 'change_status':
      updateQuery = `
        UPDATE incidents
        SET status = $1, updated_at = NOW()
        WHERE id = ANY($2::uuid[])
        RETURNING id
      `;
      params = [data.status, incident_ids];
      break;

    case 'change_priority':
      updateQuery = `
        UPDATE incidents
        SET priority = $1, updated_at = NOW()
        WHERE id = ANY($2::uuid[])
        RETURNING id
      `;
      params = [data.priority, incident_ids];
      break;

    default:
      throw new AppError('Invalid bulk action', 400);
  }

  const result = await db.query(updateQuery, params);

  // Log history for each incident
  for (const incident_id of incident_ids) {
    await db.query(
      `INSERT INTO incident_history (incident_id, action, performed_by, details)
       VALUES ($1, $2, $3, $4)`,
      [incident_id, `bulk_${action}`, userId, JSON.stringify(data)]
    );
  }

  res.json({
    success: true,
    message: `Successfully updated ${result.rows.length} incidents`,
    count: result.rows.length
  });
});

/**
 * Export incidents to Excel
 * GET /api/incidents/export
 */
const exportIncidentsToExcel = asyncHandler(async (req, res) => {
  const { filters } = req;
  const lang = getLanguageFromRequest(req);

  // Build WHERE conditions (same as getIncidents but without pagination)
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Apply filters
  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.incident_type) {
    conditions.push(`incident_type = $${paramIndex}`);
    params.push(filters.incident_type);
    paramIndex++;
  }

  if (filters.priority) {
    conditions.push(`priority = $${paramIndex}`);
    params.push(filters.priority);
    paramIndex++;
  }

  if (filters.department_id) {
    conditions.push(`department_id = $${paramIndex}`);
    params.push(filters.department_id);
    paramIndex++;
  }

  if (filters.assigned_to) {
    conditions.push(`assigned_to = $${paramIndex}`);
    params.push(filters.assigned_to);
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(filters.date_to);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
      u.full_name as reporter_name,
      u.employee_code as reporter_code,
      d.name as department_name,
      a.full_name as assigned_to_name,
      r.full_name as resolved_by_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.resolved_by = r.id
    ${whereClause}
    ORDER BY i.created_at DESC
  `;

  const result = await db.query(query, params);
  const incidents = result.rows;

  // Create Workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Incidents');

  // Define Columns
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 36 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Type', key: 'incident_type', width: 15 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Department', key: 'department_name', width: 20 },
    { header: 'Reporter', key: 'reporter_name', width: 20 },
    { header: 'Assigned To', key: 'assigned_to_name', width: 20 },
    { header: 'Created At', key: 'created_at', width: 20 },
    { header: 'Resolved At', key: 'resolved_at', width: 20 },
    { header: 'Resolved By', key: 'resolved_by_name', width: 20 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Resolution Notes', key: 'resolution_notes', width: 50 },
    { header: 'Root Cause', key: 'root_cause', width: 50 },
    { header: 'Corrective Actions', key: 'corrective_actions', width: 50 }
  ];

  // Add Rows
  incidents.forEach(incident => {
    worksheet.addRow({
      ...incident,
      created_at: incident.created_at ? new Date(incident.created_at).toLocaleString() : '',
      resolved_at: incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : ''
    });
  });

  // Style Header
  worksheet.getRow(1).font = { bold: true };

  // Set Response Headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=incidents.xlsx');

  // Write to Response
  await workbook.xlsx.write(res);
  res.end();
});

/**
 * Escalate incident to next handler level
 * POST /api/incidents/:id/escalate-level
 */
const escalateToNextLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const result = await escalationService.escalateIncident(id, userId, reason, false);

  // Get notification service and send notification
  const notificationService = req.app.get('notificationService');
  if (notificationService && result.newHandler) {
    await notificationService.createNotification({
      type: 'incident_escalated',
      title: 'Incident Escalated to You',
      message: `An incident has been escalated to ${result.levelName}`,
      user_id: result.newHandler.id,
      reference_type: 'incident',
      reference_id: id,
    });
  }

  res.json({
    success: true,
    message: `Incident escalated to ${result.levelName}`,
    data: result
  });
});

/**
 * Assign incident to multiple departments
 * POST /api/incidents/:id/assign-departments
 */
const assignToDepartments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { departments } = req.body; // Array of { department_id, assigned_to, task_description, priority, due_date }
  const userId = req.user.id;

  if (!departments || !Array.isArray(departments) || departments.length === 0) {
    throw new AppError('Departments array is required', 400);
  }

  const results = await escalationService.assignIncidentToDepartments(id, departments, userId);

  // Send notifications to assigned departments
  const notificationService = req.app.get('notificationService');
  const io = req.app.get('io');

  for (const assignment of results) {
    // Notify department
    if (io && assignment.department_id) {
      io.notifyDepartment(assignment.department_id, 'department_task_assigned', {
        type: 'incident',
        incident_id: id,
        task_description: assignment.task_description,
        priority: assignment.priority,
      });
    }

    // Notify specific assignee
    if (notificationService && assignment.assigned_to) {
      await notificationService.createNotification({
        type: 'incident_assigned',
        title: 'New Department Task',
        message: `Your department has been assigned to help with an incident`,
        user_id: assignment.assigned_to,
        reference_type: 'incident',
        reference_id: id,
      });
    }
  }

  res.json({
    success: true,
    message: `Incident assigned to ${results.length} department(s)`,
    data: results
  });
});

/**
 * Get department assignments for an incident
 * GET /api/incidents/:id/departments
 */
const getDepartmentAssignments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(`
    SELECT 
      ida.*,
      d.name as department_name,
      d.code as department_code,
      u1.full_name as assigned_by_name,
      u2.full_name as assigned_to_name
    FROM incident_department_assignments ida
    JOIN departments d ON ida.department_id = d.id
    JOIN users u1 ON ida.assigned_by = u1.id
    LEFT JOIN users u2 ON ida.assigned_to = u2.id
    WHERE ida.incident_id = $1
    ORDER BY ida.created_at DESC
  `, [id]);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Update department assignment status
 * PUT /api/incidents/:id/departments/:assignmentId
 */
const updateDepartmentAssignment = asyncHandler(async (req, res) => {
  const { id, assignmentId } = req.params;
  const { status, completion_notes } = req.body;
  const userId = req.user.id;

  const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [status];
  let paramIndex = 2;

  if (status === 'in_progress' && !req.body.started_at) {
    updateFields.push(`started_at = CURRENT_TIMESTAMP`);
  }

  if (status === 'completed') {
    updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
    if (completion_notes) {
      updateFields.push(`completion_notes = $${paramIndex++}`);
      params.push(completion_notes);
    }
  }

  params.push(assignmentId, id);

  const result = await db.query(`
    UPDATE incident_department_assignments
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex++} AND incident_id = $${paramIndex}
    RETURNING *
  `, params);

  if (result.rows.length === 0) {
    throw new AppError('Assignment not found', 404);
  }

  // Log history
  await db.query(`
    INSERT INTO incident_history (incident_id, action, performed_by, details)
    VALUES ($1, 'department_task_updated', $2, $3)
  `, [id, userId, JSON.stringify({ assignment_id: assignmentId, status })]);

  res.json({
    success: true,
    message: 'Department assignment updated',
    data: result.rows[0]
  });
});

/**
 * Submit detailed rating for incident
 * POST /api/incidents/:id/detailed-rating
 */
const submitDetailedRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const rating = await ratingService.rateIncident(id, userId, req.body);

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: rating
  });
});

/**
 * Get rating statistics for incidents
 * GET /api/incidents/rating-stats
 */
const getRatingStats = asyncHandler(async (req, res) => {
  const { department_id, start_date, end_date } = req.query;

  const stats = await ratingService.getIncidentRatingStats({
    department_id,
    start_date,
    end_date
  });

  res.json({
    success: true,
    data: stats
  });
});

/**
 * Get my incidents (incidents reported by current user)
 * GET /api/incidents/my
 * For App Mobile - shows user's own reported incidents
 */
const getMyIncidents = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, priority, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const conditions = ['i.reporter_id = $1'];
  const params = [userId];
  let paramIndex = 2;
  
  if (status) {
    conditions.push(`i.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  
  if (priority) {
    conditions.push(`i.priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM incidents i WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get incidents
  params.push(parseInt(limit), offset);
  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as display_description,
      d.name as department_name,
      d.name_ja as department_name_ja,
      a.full_name as assigned_to_name,
      r.full_name as resolved_by_name,
      (SELECT COUNT(*) FROM incident_comments WHERE incident_id = i.id) as comment_count
    FROM incidents i
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.resolved_by = r.id
    WHERE ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const result = await db.query(query, params);
  
  // Get summary counts
  const summaryResult = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed
    FROM incidents
    WHERE reporter_id = $1
  `, [userId]);
  
  res.json({
    success: true,
    data: result.rows,
    summary: summaryResult.rows[0],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Get incidents assigned to me
 * GET /api/incidents/assigned-to-me
 * For Team Leader/Supervisor - shows incidents they need to handle
 */
const getAssignedToMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userLevel = req.user.level;
  const { status, priority, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);
  
  // Only Level 4 and above can have assigned incidents
  if (userLevel > 4) {
    return res.json({
      success: true,
      data: [],
      summary: { total: 0, pending: 0, in_progress: 0 },
      pagination: { page: 1, limit: parseInt(limit), total: 0, total_pages: 0 }
    });
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const conditions = ['i.assigned_to = $1'];
  const params = [userId];
  let paramIndex = 2;
  
  if (status) {
    conditions.push(`i.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  
  if (priority) {
    conditions.push(`i.priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM incidents i WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get incidents
  params.push(parseInt(limit), offset);
  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
      u.full_name as reporter_name,
      u.employee_code as reporter_code,
      d.name as department_name,
      (SELECT COUNT(*) FROM incident_comments WHERE incident_id = i.id) as comment_count
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    WHERE ${whereClause}
    ORDER BY 
      CASE i.priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const result = await db.query(query, params);
  
  // Get summary counts
  const summaryResult = await db.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved
    FROM incidents
    WHERE assigned_to = $1
  `, [userId]);
  
  res.json({
    success: true,
    data: result.rows,
    summary: summaryResult.rows[0],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Get incidents by department (for department managers)
 * GET /api/incidents/department/:departmentId
 */
const getIncidentsByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const userLevel = req.user.level;
  const { status, priority, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);
  
  // Check permission
  if (userLevel > 3) {
    throw new AppError('Permission denied', 403);
  }
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const conditions = ['(i.department_id = $1 OR i.assigned_department_id = $1)'];
  const params = [departmentId];
  let paramIndex = 2;
  
  if (status) {
    conditions.push(`i.status = $${paramIndex}`);
    params.push(status);
    paramIndex++;
  }
  
  if (priority) {
    conditions.push(`i.priority = $${paramIndex}`);
    params.push(priority);
    paramIndex++;
  }
  
  const whereClause = conditions.join(' AND ');
  
  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM incidents i WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get incidents
  params.push(parseInt(limit), offset);
  const query = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
      u.full_name as reporter_name,
      d.name as department_name,
      a.full_name as assigned_to_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    WHERE ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Get incident history (timeline of actions)
 * GET /api/incidents/:id/history
 * For App Mobile - shows timeline of all actions on an incident
 */
const getIncidentHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lang = getLanguageFromRequest(req);
  
  // Get history records
  const historyResult = await db.query(`
    SELECT 
      h.*,
      u.full_name as performed_by_name,
      u.role as performed_by_role
    FROM incident_history h
    LEFT JOIN users u ON h.performed_by = u.id
    WHERE h.incident_id = $1
    ORDER BY h.created_at DESC
  `, [id]);
  
  // Format history items
  const history = historyResult.rows.map(item => ({
    id: item.id,
    action: item.action,
    action_label: getActionLabel(item.action, lang),
    details: item.details,
    performed_by: item.performed_by_name,
    performed_by_role: item.performed_by_role,
    created_at: item.created_at
  }));
  
  res.json({
    success: true,
    data: history
  });
});

/**
 * Get action label for i18n
 */
function getActionLabel(action, lang) {
  const labels = {
    created: { vi: 'Tạo mới', ja: '作成' },
    assigned: { vi: 'Phân công', ja: '割り当て' },
    status_updated: { vi: 'Cập nhật trạng thái', ja: 'ステータス更新' },
    commented: { vi: 'Thêm bình luận', ja: 'コメント追加' },
    escalated: { vi: 'Chuyển cấp', ja: 'エスカレーション' },
    resolved: { vi: 'Hoàn thành', ja: '解決' },
    closed: { vi: 'Đóng', ja: 'クローズ' },
    rated: { vi: 'Đánh giá', ja: '評価' },
    department_assigned: { vi: 'Giao phòng ban', ja: '部門割り当て' }
  };
  
  return labels[action]?.[lang] || labels[action]?.vi || action;
}

/**
 * Get incident comments
 * GET /api/incidents/:id/comments
 * For App Mobile - shows all comments on an incident
 */
const getIncidentComments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  // Count total
  const countResult = await db.query(
    'SELECT COUNT(*) FROM incident_comments WHERE incident_id = $1',
    [id]
  );
  const total = parseInt(countResult.rows[0].count);
  
  // Get comments
  const result = await db.query(`
    SELECT 
      c.*,
      u.full_name as author_name,
      u.role as author_role,
      u.avatar_url as author_avatar
    FROM incident_comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.incident_id = $1
    ORDER BY c.created_at ASC
    LIMIT $2 OFFSET $3
  `, [id, parseInt(limit), offset]);
  
  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Export all functions at the end
module.exports = {
  createIncident,
  getIncidents,
  getIncidentById,
  assignIncident,
  updateIncidentStatus,
  addComment,
  escalateIncident,
  resolveIncident,
  rateIncident,
  getIncidentStats,
  // New APIs
  getIncidentQueue,
  quickAcknowledge,
  quickAssignToDepartment,
  getKanbanData,
  moveIncidentStatus,
  bulkUpdateIncidents,
  exportIncidentsToExcel,
  // New escalation & rating APIs
  escalateToNextLevel,
  assignToDepartments,
  getDepartmentAssignments,
  updateDepartmentAssignment,
  submitDetailedRating,
  getRatingStats,
  // My incidents APIs (for App Mobile)
  getMyIncidents,
  getAssignedToMe,
  getIncidentsByDepartment,
  // History & Comments APIs (for App Mobile)
  getIncidentHistory,
  getIncidentComments,
};
