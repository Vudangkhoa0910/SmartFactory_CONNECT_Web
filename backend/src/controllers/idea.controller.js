const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

/**
 * Create new idea
 * POST /api/ideas
 */
const createIdea = asyncHandler(async (req, res) => {
  const {
    ideabox_type,
    category,
    title,
    description,
    expected_benefit,
    department_id
  } = req.body;
  
  const submitter_id = req.user.id;
  
  // Handle file attachments
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];
  
  // For Pink Box (anonymous), we still store submitter_id but mark as anonymous
  const is_anonymous = ideabox_type === 'pink';
  
  // Set initial handler level
  // White Box: Starts at Supervisor
  // Pink Box: Starts at Admin (General Manager)
  const handler_level = ideabox_type === 'pink' ? 'general_manager' : 'supervisor';

  const query = `
    INSERT INTO ideas (
      ideabox_type,
      category,
      title,
      description,
      expected_benefit,
      submitter_id,
      department_id,
      is_anonymous,
      attachments,
      status,
      handler_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
    RETURNING *
  `;
  
  const values = [
    ideabox_type,
    category,
    title,
    description,
    expected_benefit || null,
    submitter_id,
    department_id || null,
    is_anonymous,
    JSON.stringify(attachments),
    handler_level
  ];
  
  const result = await db.query(query, values);
  const idea = result.rows[0];
  
  // Log history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'submitted', $2, $3)`,
    [idea.id, submitter_id, JSON.stringify({ status: 'pending', ideabox_type })]
  );
  
  // If Pink Box, assign to Admin
  // If White Box, assign to Supervisor
  let assignedRole = ideabox_type === 'pink' ? 'admin' : 'supervisor';
  
  // TODO: Send notification to assigned role
  
  // Hide submitter info if anonymous
  if (is_anonymous && req.user.level > 1) {
    delete idea.submitter_id;
  }
  
  res.status(201).json({
    success: true,
    message: 'Idea submitted successfully',
    data: idea
  });
});

/**
 * Get all ideas with filters
 * GET /api/ideas
 */
const getIdeas = asyncHandler(async (req, res) => {
  const { pagination, sort, filters } = req;
  const userId = req.user.id;
  const userLevel = req.user.level;
  const userRole = req.user.role;
  
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Access control based on ideabox_type
  // Pink Box: Only Admin can see all, others see only their own
  // White Box: Visibility based on handler_level and status
  
  if (filters.ideabox_type === 'pink') {
    if (userLevel > 1) {
      // Non-admin can only see their own pink box ideas
      conditions.push(`submitter_id = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
    }
  } else if (filters.ideabox_type === 'white') {
    // White Box / General Logic
    // 1. Approved/Implemented ideas are visible to EVERYONE
    // 2. Submitter can always see their own ideas
    // 3. Supervisors (Level 3) see 'supervisor' level ideas
    // 4. Managers (Level 2) see 'manager' level ideas
    // 5. Admins (Level 1) see 'general_manager' level ideas
    
    let visibilityClause = `(
      status IN ('approved', 'implemented') 
      OR submitter_id = $${paramIndex}
    `;
    params.push(userId);
    paramIndex++;

    if (userLevel === 1) { // Admin
      visibilityClause += ` OR handler_level = 'general_manager'`;
    } else if (userLevel === 2) { // Manager
      visibilityClause += ` OR handler_level = 'manager'`;
    } else if (userLevel <= 4) { // Supervisor (Level 3/4)
      visibilityClause += ` OR handler_level = 'supervisor'`; 
    }
    
    visibilityClause += `)`;
    conditions.push(visibilityClause);
  }
  
  // Apply other filters
  if (filters.ideabox_type) {
    conditions.push(`ideabox_type = $${paramIndex}`);
    params.push(filters.ideabox_type);
    paramIndex++;
  }

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  
  if (filters.category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(filters.category);
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
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM ideas ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);
  
  // Get ideas with pagination
  const query = `
    SELECT 
      i.*,
      CASE 
        WHEN i.is_anonymous = true AND i.submitter_id != $${paramIndex} AND $${paramIndex + 1} > 1 
        THEN NULL 
        ELSE u.full_name 
      END as submitter_name,
      CASE 
        WHEN i.is_anonymous = true AND i.submitter_id != $${paramIndex} AND $${paramIndex + 1} > 1 
        THEN NULL 
        ELSE u.employee_code 
      END as submitter_code,
      d.name as department_name,
      a.full_name as assigned_to_name,
      r.full_name as reviewed_by_name
    FROM ideas i
    LEFT JOIN users u ON i.submitter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.reviewed_by = r.id
    ${whereClause}
    ORDER BY ${sort.sortBy} ${sort.sortOrder}
    LIMIT $${paramIndex + 2} OFFSET $${paramIndex + 3}
  `;
  
  params.push(userId, userLevel, pagination.limit, pagination.offset);
  
  const result = await db.query(query, params);
  
  // Hide submitter_id for anonymous ideas
  result.rows.forEach(idea => {
    if (idea.is_anonymous && idea.submitter_id !== userId && userLevel > 1) {
      delete idea.submitter_id;
    }
  });
  
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
 * Get idea by ID
 * GET /api/ideas/:id
 */
const getIdeaById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userLevel = req.user.level;
  
  const query = `
    SELECT 
      i.*,
      CASE 
        WHEN i.is_anonymous = true AND i.submitter_id != $2 AND $3 > 1 
        THEN NULL 
        ELSE u.full_name 
      END as submitter_name,
      CASE 
        WHEN i.is_anonymous = true AND i.submitter_id != $2 AND $3 > 1 
        THEN NULL 
        ELSE u.employee_code 
      END as submitter_code,
      CASE 
        WHEN i.is_anonymous = true AND i.submitter_id != $2 AND $3 > 1 
        THEN NULL 
        ELSE u.email 
      END as submitter_email,
      d.name as department_name,
      a.full_name as assigned_to_name,
      r.full_name as reviewed_by_name
    FROM ideas i
    LEFT JOIN users u ON i.submitter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.reviewed_by = r.id
    WHERE i.id = $1
  `;
  
  const result = await db.query(query, [id, userId, userLevel]);
  
  if (result.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  const idea = result.rows[0];
  
  // Check access permissions for Pink Box
  if (idea.ideabox_type === 'pink' && userLevel > 1 && idea.submitter_id !== userId) {
    throw new AppError('You do not have permission to view this idea', 403);
  }
  
  // Hide submitter_id for anonymous ideas
  if (idea.is_anonymous && idea.submitter_id !== userId && userLevel > 1) {
    delete idea.submitter_id;
  }
  
  // Get responses
  const responsesQuery = `
    SELECT 
      r.*,
      u.full_name as responder_name,
      u.employee_code,
      u.role
    FROM idea_responses r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.idea_id = $1
    ORDER BY r.created_at ASC
  `;
  
  const responsesResult = await db.query(responsesQuery, [id]);
  idea.responses = responsesResult.rows;
  
  // Get history (only for authorized users)
  if (userLevel <= 4 || idea.submitter_id === userId) {
    const historyQuery = `
      SELECT 
        h.*,
        u.full_name as performed_by_name,
        u.role
      FROM idea_history h
      LEFT JOIN users u ON h.performed_by = u.id
      WHERE h.idea_id = $1
      ORDER BY h.created_at DESC
    `;
    
    const historyResult = await db.query(historyQuery, [id]);
    idea.history = historyResult.rows;
  }
  
  res.json({
    success: true,
    data: idea
  });
});

/**
 * Assign idea to user/department
 * PUT /api/ideas/:id/assign
 */
const assignIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigned_to, department_id } = req.body;
  const userId = req.user.id;
  
  // Get idea
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  
  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  // Pink Box: Only Admin can assign
  // White Box: Supervisor and above can assign
  if (idea.rows[0].ideabox_type === 'pink' && req.user.level > 1) {
    throw new AppError('Only Admin can assign Pink Box ideas', 403);
  }
  
  // Verify assignee if provided
  if (assigned_to) {
    const assignee = await db.query('SELECT * FROM users WHERE id = $1', [assigned_to]);
    if (assignee.rows.length === 0) {
      throw new AppError('Assignee not found', 404);
    }
  }
  
  // Update idea
  const query = `
    UPDATE ideas
    SET 
      assigned_to = $1,
      department_id = COALESCE($2, department_id),
      status = CASE 
        WHEN status = 'pending' THEN 'under_review'
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await db.query(query, [assigned_to, department_id, id]);
  
  // Log history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'assigned', $2, $3)`,
    [id, userId, JSON.stringify({ assigned_to, department_id })]
  );
  
  // TODO: Send notification to assigned user
  
  res.json({
    success: true,
    message: 'Idea assigned successfully',
    data: result.rows[0]
  });
});

/**
 * Add response to idea
 * POST /api/ideas/:id/responses
 */
const addResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  const userId = req.user.id;
  
  // Check if idea exists
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  
  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  // Check permission: assigned user, department manager, or supervisor+
  const canRespond = 
    idea.rows[0].assigned_to === userId ||
    req.user.level <= 4;
  
  if (!canRespond) {
    throw new AppError('You do not have permission to respond to this idea', 403);
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
    INSERT INTO idea_responses (idea_id, user_id, response, attachments)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const result = await db.query(query, [id, userId, response, JSON.stringify(attachments)]);
  
  // Get user info for response
  const responseWithUser = await db.query(`
    SELECT 
      r.*,
      u.full_name as responder_name,
      u.employee_code,
      u.role
    FROM idea_responses r
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.id = $1
  `, [result.rows[0].id]);
  
  // Update idea status to under_review if pending
  await db.query(
    `UPDATE ideas 
     SET status = CASE WHEN status = 'pending' THEN 'under_review' ELSE status END 
     WHERE id = $1`,
    [id]
  );
  
  // TODO: Send notification to submitter
  
  res.status(201).json({
    success: true,
    message: 'Response added successfully',
    data: responseWithUser.rows[0]
  });
});

/**
 * Update idea status and review
 * PUT /api/ideas/:id/review
 */
const reviewIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, review_notes, feasibility_score, impact_score } = req.body;
  const userId = req.user.id;
  
  // Get idea
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  
  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  const oldStatus = idea.rows[0].status;
  
  // If status is rejected, delete the idea (as per requirement for White Box)
  if (status === 'rejected') {
    await db.query('DELETE FROM ideas WHERE id = $1', [id]);
    
    return res.json({
      success: true,
      message: 'Idea rejected and deleted successfully',
      data: { id, status: 'rejected' }
    });
  }

  // Update idea
  const query = `
    UPDATE ideas
    SET 
      status = $1,
      review_notes = $2,
      feasibility_score = $3,
      impact_score = $4,
      reviewed_by = $5,
      reviewed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6
    RETURNING *
  `;
  
  const result = await db.query(query, [
    status,
    review_notes,
    feasibility_score || null,
    impact_score || null,
    userId,
    id
  ]);
  
  // Log history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'reviewed', $2, $3)`,
    [id, userId, JSON.stringify({ old_status: oldStatus, new_status: status, review_notes })]
  );
  
  // TODO: Send notification to submitter
  
  res.json({
    success: true,
    message: 'Idea reviewed successfully',
    data: result.rows[0]
  });
});

/**
 * Implement idea
 * PUT /api/ideas/:id/implement
 */
const implementIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { implementation_notes, actual_benefit } = req.body;
  const userId = req.user.id;
  
  // Get idea
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  
  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  // Update idea
  const query = `
    UPDATE ideas
    SET 
      status = 'implemented',
      implementation_notes = $1,
      actual_benefit = $2,
      implemented_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await db.query(query, [implementation_notes, actual_benefit, id]);
  
  // Log history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'implemented', $2, $3)`,
    [id, userId, JSON.stringify({ implementation_notes, actual_benefit })]
  );
  
  // TODO: Send notification to submitter with congratulations
  
  res.json({
    success: true,
    message: 'Idea marked as implemented successfully',
    data: result.rows[0]
  });
});

/**
 * Get idea statistics
 * GET /api/ideas/stats
 */
const getIdeaStats = asyncHandler(async (req, res) => {
  const { date_from, date_to, ideabox_type } = req.query;
  
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
  
  if (ideabox_type) {
    conditions.push(`ideabox_type = $${paramIndex}`);
    params.push(ideabox_type);
    paramIndex++;
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_ideas,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
      COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
      COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
      COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
      AVG(feasibility_score) as avg_feasibility,
      AVG(impact_score) as avg_impact
    FROM ideas
    ${whereClause}
  `;
  
  const statsResult = await db.query(statsQuery, params);
  
  // By category
  const byCategoryQuery = `
    SELECT 
      category,
      COUNT(*) as count
    FROM ideas
    ${whereClause}
    GROUP BY category
  `;
  
  const byCategoryResult = await db.query(byCategoryQuery, params);
  
  // By ideabox type
  const byTypeQuery = `
    SELECT 
      ideabox_type,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count
    FROM ideas
    ${whereClause}
    GROUP BY ideabox_type
  `;
  
  const byTypeResult = await db.query(byTypeQuery, params);
  
  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      by_category: byCategoryResult.rows,
      by_type: byTypeResult.rows
    }
  });
});

/**
 * Escalate idea to higher level
 * POST /api/ideas/:id/escalate
 */
const escalateIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;
  const userLevel = req.user.level;
  
  // Get current idea
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  
  if (ideaResult.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }
  
  const idea = ideaResult.rows[0];
  
  // Determine next level
  let nextLevel = '';
  if (userLevel >= 3) { // Supervisor (3, 4, 5?) - Assuming 3/4 is SV
    nextLevel = 'manager';
  } else if (userLevel === 2) { // Manager
    nextLevel = 'general_manager';
  } else {
    throw new AppError('You do not have permission to escalate this idea', 403);
  }
  
  // Update idea
  const updateQuery = `
    UPDATE ideas
    SET handler_level = $1,
        status = 'under_review',
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  
  const result = await db.query(updateQuery, [nextLevel, id]);
  
  // Log history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'escalated', $2, $3)`,
    [id, userId, JSON.stringify({ from_level: idea.handler_level, to_level: nextLevel, reason })]
  );
  
  // Add response about escalation
  await db.query(
    `INSERT INTO idea_responses (idea_id, user_id, response)
     VALUES ($1, $2, $3)`,
    [id, userId, `Escalated to ${nextLevel}. Reason: ${reason || 'No reason provided'}`]
  );
  
  // TODO: Send notification to escalated_to user
  
  res.json({
    success: true,
    message: `Idea escalated to ${nextLevel} successfully`,
    data: result.rows[0]
  });
});

/**
 * Get Kaizen Bank (Archive of implemented ideas)
 * GET /api/ideas/archive
 */
const getKaizenBank = asyncHandler(async (req, res) => {
  const { pagination, filters } = req;
  const { search, category } = req.query;
  
  const conditions = ["status = 'implemented'"];
  const params = [];
  let paramIndex = 1;
  
  if (search) {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  if (category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }
  
  if (filters && filters.ideabox_type) {
    conditions.push(`ideabox_type = $${paramIndex}`);
    params.push(filters.ideabox_type);
    paramIndex++;
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM ideas ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);
  
  // Get archived ideas
  const query = `
    SELECT 
      i.*,
      CASE 
        WHEN i.is_anonymous = false THEN u.full_name
        ELSE 'Anonymous'
      END as contributor_name,
      u.employee_code as contributor_code,
      d.name as department_name,
      r.full_name as reviewed_by_name
    FROM ideas i
    LEFT JOIN users u ON i.submitter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users r ON i.reviewed_by = r.id
    ${whereClause}
    ORDER BY COALESCE(i.implemented_at, i.updated_at) DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  
  params.push(pagination && pagination.limit ? pagination.limit : 20, pagination && pagination.offset ? pagination.offset : 0);
  
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
 * Search Kaizen Bank
 * GET /api/ideas/archive/search
 */
const searchKaizenBank = asyncHandler(async (req, res) => {
  const { q, category, date_from, date_to } = req.query;
  
  if (!q || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }
  
  const conditions = ["status = 'implemented'"];
  const params = [`%${q}%`];
  let paramIndex = 2;
  
  if (category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }
  
  if (date_from) {
    conditions.push(`implemented_at >= $${paramIndex}`);
    params.push(date_from);
    paramIndex++;
  }
  
  if (date_to) {
    conditions.push(`implemented_at <= $${paramIndex}`);
    params.push(date_to);
    paramIndex++;
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  
  const query = `
    SELECT 
      i.*,
      CASE 
        WHEN i.is_anonymous = false THEN u.full_name
        ELSE 'Anonymous'
      END as contributor_name,
      ts_rank(
        to_tsvector('english', i.title || ' ' || i.description || ' ' || COALESCE(i.actual_benefit, '')),
        plainto_tsquery('english', $1)
      ) as relevance
    FROM ideas i
    LEFT JOIN users u ON i.submitter_id = u.id
    ${whereClause}
    AND (
      i.title ILIKE $1 
      OR i.description ILIKE $1 
      OR i.actual_benefit ILIKE $1
      OR i.expected_benefit ILIKE $1
    )
    ORDER BY relevance DESC, i.implemented_at DESC
    LIMIT 50
  `;
  
  const result = await db.query(query, params);
  
  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length
  });
});

/**
 * Get idea difficulty distribution
 * GET /api/ideas/difficulty
 */
const getIdeaDifficulty = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      CASE 
        WHEN feasibility_score >= 8 THEN 'easy'
        WHEN feasibility_score >= 5 THEN 'medium'
        WHEN feasibility_score >= 3 THEN 'hard'
        ELSE 'very_hard'
      END as difficulty_level,
      COUNT(*) as count,
      AVG(impact_score) as avg_impact
    FROM ideas
    WHERE feasibility_score IS NOT NULL
    GROUP BY difficulty_level
    ORDER BY 
      CASE difficulty_level
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        WHEN 'very_hard' THEN 4
      END
  `;
  
  const result = await db.query(query);
  
  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get ideas by status for Kanban view
 * GET /api/ideas/kanban
 */
const getIdeasKanban = asyncHandler(async (req, res) => {
  const { ideabox_type } = req.query;
  const userId = req.user.id;
  const userLevel = req.user.level;
  
  let typeFilter = '';
  const params = [];
  
  if (ideabox_type) {
    typeFilter = 'AND ideabox_type = $1';
    params.push(ideabox_type);
  }
  
  const statusColumns = [
    'pending',
    'under_review',
    'approved',
    'rejected',
    'implemented',
    'on_hold'
  ];
  
  const kanbanData = {};
  
  for (const status of statusColumns) {
    const query = `
      SELECT 
        i.*,
        CASE 
          WHEN i.is_anonymous = true AND i.ideabox_type = 'pink' AND $${params.length + 1} > 1
          THEN 'Anonymous'
          ELSE u.full_name
        END as submitter_name,
        a.full_name as assigned_to_name,
        d.name as department_name
      FROM ideas i
      LEFT JOIN users u ON i.submitter_id = u.id
      LEFT JOIN users a ON i.assigned_to = a.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.status = '${status}' ${typeFilter}
      ORDER BY i.created_at DESC
    `;
    
    const result = await db.query(query, [...params, userLevel]);
    kanbanData[status] = result.rows;
  }
  
  res.json({
    success: true,
    data: kanbanData
  });
});

module.exports = {
  createIdea,
  getIdeas,
  getIdeaById,
  assignIdea,
  addResponse,
  reviewIdea,
  implementIdea,
  getIdeaStats,
  // New APIs
  escalateIdea,
  getKaizenBank,
  searchKaizenBank,
  getIdeaDifficulty,
  getIdeasKanban
};
