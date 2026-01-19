/**
 * Idea Support Controller
 * Xử lý ủng hộ/nhắc nhở cho ý tưởng
 */

const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const { getLanguageFromRequest } = require('../utils/i18n.helper');

/**
 * Support (ủng hộ) một ý tưởng
 * POST /api/ideas/:id/support
 */
const supportIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Check if idea exists
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý tưởng', 404);
  }

  const idea = ideaResult.rows[0];

  // Check if user already supported
  const existingSupport = await db.query(
    `SELECT * FROM idea_supports WHERE idea_id = $1 AND user_id = $2 AND support_type = 'support'`,
    [id, userId]
  );

  if (existingSupport.rows.length > 0) {
    throw new AppError(
      lang === 'ja' ? '既にこの意見を支持しています' : 'Bạn đã ủng hộ ý tưởng này rồi',
      400
    );
  }

  // Create support record
  const insertResult = await db.query(
    `INSERT INTO idea_supports (idea_id, user_id, support_type, message)
     VALUES ($1, $2, 'support', $3)
     RETURNING *`,
    [id, userId, message]
  );

  // Log to history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'supported', $2, $3)`,
    [id, userId, JSON.stringify({ message })]
  );

  // Get updated counts
  const countsResult = await db.query(
    `SELECT support_count, remind_count FROM ideas WHERE id = $1`,
    [id]
  );

  res.status(201).json({
    success: true,
    message: lang === 'ja' ? '支持しました' : 'Đã ủng hộ thành công',
    data: {
      support: insertResult.rows[0],
      support_count: countsResult.rows[0].support_count,
      remind_count: countsResult.rows[0].remind_count
    }
  });
});

/**
 * Remind (nhắc nhở) một ý tưởng
 * POST /api/ideas/:id/remind
 */
const remindIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Check if idea exists
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý tưởng', 404);
  }

  const idea = ideaResult.rows[0];

  // Only allow remind for ideas not yet implemented/resolved
  if (['implemented', 'rejected'].includes(idea.status)) {
    throw new AppError(
      lang === 'ja' ? 'この意見はすでに処理されています' : 'Ý tưởng này đã được xử lý',
      400
    );
  }

  // Check if user already reminded (allow re-remind after 7 days)
  const existingRemind = await db.query(
    `SELECT * FROM idea_supports 
     WHERE idea_id = $1 AND user_id = $2 AND support_type = 'remind'
     AND created_at > NOW() - INTERVAL '7 days'`,
    [id, userId]
  );

  if (existingRemind.rows.length > 0) {
    throw new AppError(
      lang === 'ja' ? '7日以内に既にリマインドしています' : 'Bạn đã nhắc trong vòng 7 ngày',
      400
    );
  }

  // Create remind record
  const insertResult = await db.query(
    `INSERT INTO idea_supports (idea_id, user_id, support_type, message)
     VALUES ($1, $2, 'remind', $3)
     RETURNING *`,
    [id, userId, message || (lang === 'ja' ? 'この意見の対応をお願いします' : 'Xin hãy xem xét ý tưởng này')]
  );

  // Log to history
  await db.query(
    `INSERT INTO idea_history (idea_id, action, performed_by, details)
     VALUES ($1, 'reminded', $2, $3)`,
    [id, userId, JSON.stringify({ message })]
  );

  // Get updated counts
  const countsResult = await db.query(
    `SELECT support_count, remind_count, last_reminded_at FROM ideas WHERE id = $1`,
    [id]
  );

  // TODO: Send notification to handlers
  // await notificationService.notifyIdeaReminder(idea, userId);

  res.status(201).json({
    success: true,
    message: lang === 'ja' ? 'リマインドしました' : 'Đã gửi nhắc nhở',
    data: {
      remind: insertResult.rows[0],
      support_count: countsResult.rows[0].support_count,
      remind_count: countsResult.rows[0].remind_count,
      last_reminded_at: countsResult.rows[0].last_reminded_at
    }
  });
});

/**
 * Remove support/remind
 * DELETE /api/ideas/:id/support
 */
const removeSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { support_type = 'support' } = req.query;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  const result = await db.query(
    `DELETE FROM idea_supports 
     WHERE idea_id = $1 AND user_id = $2 AND support_type = $3
     RETURNING *`,
    [id, userId, support_type]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      lang === 'ja' ? '支持/リマインドが見つかりません' : 'Không tìm thấy ủng hộ/nhắc nhở',
      404
    );
  }

  // Get updated counts
  const countsResult = await db.query(
    `SELECT support_count, remind_count FROM ideas WHERE id = $1`,
    [id]
  );

  res.json({
    success: true,
    message: lang === 'ja' ? '削除しました' : 'Đã xóa',
    data: {
      support_count: countsResult.rows[0].support_count,
      remind_count: countsResult.rows[0].remind_count
    }
  });
});

/**
 * Get supports/reminds for an idea
 * GET /api/ideas/:id/supports
 */
const getIdeaSupports = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { support_type } = req.query;
  const userId = req.user.id;

  let query = `
    SELECT 
      s.*,
      u.full_name as user_name,
      u.employee_code,
      u.role
    FROM idea_supports s
    LEFT JOIN users u ON s.user_id = u.id
    WHERE s.idea_id = $1
  `;
  const params = [id];

  if (support_type) {
    query += ` AND s.support_type = $2`;
    params.push(support_type);
  }

  query += ` ORDER BY s.created_at DESC`;

  const result = await db.query(query, params);

  // Check if current user has supported/reminded
  const userSupport = await db.query(
    `SELECT support_type FROM idea_supports WHERE idea_id = $1 AND user_id = $2`,
    [id, userId]
  );

  const userActions = userSupport.rows.map(r => r.support_type);

  res.json({
    success: true,
    data: {
      supports: result.rows,
      total_supports: result.rows.filter(r => r.support_type === 'support').length,
      total_reminds: result.rows.filter(r => r.support_type === 'remind').length,
      user_has_supported: userActions.includes('support'),
      user_has_reminded: userActions.includes('remind')
    }
  });
});

/**
 * Get workflow stages
 * GET /api/ideas/workflow-stages
 */
const getWorkflowStages = asyncHandler(async (req, res) => {
  const { applicable_to } = req.query;

  let query = `
    SELECT * FROM idea_workflow_stages 
    WHERE is_active = true
  `;
  const params = [];

  if (applicable_to) {
    query += ` AND (applicable_to = $1 OR applicable_to = 'both')`;
    params.push(applicable_to);
  }

  query += ` ORDER BY stage_order`;

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get idea workflow history (status transitions)
 * GET /api/ideas/:id/workflow-history
 */
const getWorkflowHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await db.query(`
    SELECT 
      t.*,
      u.full_name as transitioned_by_name,
      u.role as transitioned_by_role,
      ws_from.stage_name as from_stage_name,
      ws_from.color as from_stage_color,
      ws_to.stage_name as to_stage_name,
      ws_to.color as to_stage_color
    FROM idea_status_transitions t
    LEFT JOIN users u ON t.transitioned_by = u.id
    LEFT JOIN idea_workflow_stages ws_from ON t.from_stage = ws_from.stage_code
    LEFT JOIN idea_workflow_stages ws_to ON t.to_stage = ws_to.stage_code
    WHERE t.idea_id = $1
    ORDER BY t.created_at DESC
  `, [id]);

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Update workflow stage
 * PUT /api/ideas/:id/workflow-stage
 */
const updateWorkflowStage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stage, reason, reason_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Validate stage exists
  const stageResult = await db.query(
    `SELECT * FROM idea_workflow_stages WHERE stage_code = $1 AND is_active = true`,
    [stage]
  );

  if (stageResult.rows.length === 0) {
    throw new AppError(
      lang === 'ja' ? '無効なステージです' : 'Giai đoạn không hợp lệ',
      400
    );
  }

  // Get current idea
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý tưởng', 404);
  }

  const idea = ideaResult.rows[0];
  const oldStage = idea.workflow_stage;

  // Determine new status based on stage
  let newStatus = idea.status;
  if (stage === 'approved') newStatus = 'approved';
  else if (stage === 'implemented') newStatus = 'implemented';
  else if (stage === 'rejected') newStatus = 'rejected';
  else if (stage === 'on_hold') newStatus = 'on_hold';
  else if (['supervisor_review', 'manager_review', 'gm_review'].includes(stage)) newStatus = 'under_review';

  // Update idea
  const updateResult = await db.query(`
    UPDATE ideas 
    SET workflow_stage = $1, 
        status = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `, [stage, newStatus, id]);

  // Log transition (trigger will also log, but we add explicit reason)
  await db.query(`
    INSERT INTO idea_status_transitions 
    (idea_id, from_status, to_status, from_stage, to_stage, transitioned_by, reason, reason_ja)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [id, idea.status, newStatus, oldStage, stage, userId, reason, reason_ja]);

  // Log to history
  await db.query(`
    INSERT INTO idea_history (idea_id, action, performed_by, details)
    VALUES ($1, 'stage_changed', $2, $3)
  `, [id, userId, JSON.stringify({ 
    from_stage: oldStage, 
    to_stage: stage, 
    reason 
  })]);

  res.json({
    success: true,
    message: lang === 'ja' ? 'ステージを更新しました' : 'Đã cập nhật giai đoạn',
    data: updateResult.rows[0]
  });
});

/**
 * Check duplicate before submit
 * POST /api/ideas/check-duplicate
 */
const checkDuplicate = asyncHandler(async (req, res) => {
  const { title, description, whitebox_subtype, ideabox_type } = req.body;
  const lang = getLanguageFromRequest(req);

  // Call RAG service to check duplicate
  const axios = require('axios');
  const ragUrl = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

  try {
    const response = await axios.post(`${ragUrl}/check-duplicate`, {
      title,
      description,
      whitebox_subtype: whitebox_subtype || 'idea',
      ideabox_type: ideabox_type || 'white'
    }, {
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('[CheckDuplicate] RAG service error:', error.message);
    
    // Return safe default on RAG error
    res.json({
      success: true,
      data: {
        is_duplicate: false,
        can_submit: true,
        needs_confirmation: false,
        similarity_threshold: whitebox_subtype === 'opinion' ? 0.9 : 0.6,
        max_similarity: 0,
        message: lang === 'ja' 
          ? '重複チェックサービスが利用できません。送信を続けることができます。'
          : 'Không thể kiểm tra trùng lặp. Bạn có thể tiếp tục gửi.',
        message_ja: '重複チェックサービスが利用できません。送信を続けることができます。',
        similar_ideas: [],
        workflow_history: []
      }
    });
  }
});

/**
 * Get idea with full workflow info
 * GET /api/ideas/:id/workflow
 */
const getIdeaWorkflow = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lang = getLanguageFromRequest(req);

  const result = await db.query(`
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as display_description,
      ws.stage_name,
      ws.stage_name_ja,
      ws.description as stage_description,
      ws.color as stage_color,
      ws.icon as stage_icon,
      ws.stage_order,
      u.full_name as submitter_name,
      d.name as department_name,
      a.full_name as assigned_to_name,
      r.full_name as reviewed_by_name
    FROM ideas i
    LEFT JOIN idea_workflow_stages ws ON i.workflow_stage = ws.stage_code
    LEFT JOIN users u ON i.submitter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.reviewed_by = r.id
    WHERE i.id = $1
  `, [id]);

  if (result.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý tưởng', 404);
  }

  const idea = result.rows[0];

  // Get all workflow stages for progress display
  const stagesResult = await db.query(`
    SELECT * FROM idea_workflow_stages 
    WHERE is_active = true 
      AND (applicable_to = $1 OR applicable_to = 'both')
    ORDER BY stage_order
  `, [idea.ideabox_type]);

  // Get transitions history
  const transitionsResult = await db.query(`
    SELECT 
      t.*,
      u.full_name as transitioned_by_name
    FROM idea_status_transitions t
    LEFT JOIN users u ON t.transitioned_by = u.id
    WHERE t.idea_id = $1
    ORDER BY t.created_at DESC
  `, [id]);

  // Get supports/reminds counts
  const supportsResult = await db.query(`
    SELECT 
      COUNT(*) FILTER (WHERE support_type = 'support') as support_count,
      COUNT(*) FILTER (WHERE support_type = 'remind') as remind_count
    FROM idea_supports
    WHERE idea_id = $1
  `, [id]);

  res.json({
    success: true,
    data: {
      idea: idea,
      workflow_stages: stagesResult.rows,
      current_stage_index: stagesResult.rows.findIndex(s => s.stage_code === idea.workflow_stage),
      transitions: transitionsResult.rows,
      supports: supportsResult.rows[0]
    }
  });
});

module.exports = {
  supportIdea,
  remindIdea,
  removeSupport,
  getIdeaSupports,
  getWorkflowStages,
  getWorkflowHistory,
  updateWorkflowStage,
  checkDuplicate,
  getIdeaWorkflow
};
