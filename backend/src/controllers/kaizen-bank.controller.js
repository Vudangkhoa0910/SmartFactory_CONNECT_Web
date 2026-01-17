/**
 * KAIZEN BANK CONTROLLER
 * Quản lý Ngân hàng Kaizen - Kho lưu trữ các ý tưởng đã triển khai thành công
 * 
 * THEO SRS v2.1:
 * - Ideas (Hòm thư góp ý) = Hòm trắng + Hòm hồng → Sử dụng idea.controller.js
 * - Kaizen Bank = Kho lưu trữ các ideas đã implemented
 */

const pool = require('../config/database');

// Helper function for pagination
const getPagination = (page, size) => {
  const limit = size ? +size : 20;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

// =====================================================
// KAIZEN BANK CONTROLLERS
// =====================================================

/**
 * Get all Kaizen entries with filtering
 */
const getAllKaizens = async (req, res) => {
  try {
    const { 
      page = 0, 
      size = 20, 
      category, 
      department_id,
      fiscal_year,
      award_level,
      submitter_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const { limit, offset } = getPagination(page, size);
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`kb.category = $${paramIndex++}`);
      params.push(category);
    }
    if (department_id) {
      whereConditions.push(`kb.department_id = $${paramIndex++}`);
      params.push(department_id);
    }
    if (fiscal_year) {
      whereConditions.push(`kb.fiscal_year = $${paramIndex++}`);
      params.push(fiscal_year);
    }
    if (award_level) {
      whereConditions.push(`kb.award_level = $${paramIndex++}`);
      params.push(award_level);
    }
    if (submitter_id) {
      whereConditions.push(`kb.submitter_id = $${paramIndex++}`);
      params.push(submitter_id);
    }
    if (search) {
      whereConditions.push(`(kb.title ILIKE $${paramIndex} OR kb.kaizen_code ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const validSortColumns = ['created_at', 'overall_score', 'actual_cost_savings', 'kaizen_code'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        kb.*,
        u.full_name as submitter_name,
        u.employee_code as submitter_code,
        d.name as department_name,
        d.code as department_code
      FROM kaizen_bank kb
      LEFT JOIN users u ON kb.submitter_id = u.id
      LEFT JOIN departments d ON kb.department_id = d.id
      ${whereClause}
      ORDER BY kb.${sortColumn} ${sortDir}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total FROM kaizen_bank kb ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        size: parseInt(size),
        total_pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting kaizens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Get single Kaizen by ID
 */
const getKaizenById = async (req, res) => {
  try {
    const { id } = req.params;

    const kaizenQuery = `
      SELECT 
        kb.*,
        u.full_name as submitter_name,
        u.employee_code as submitter_code,
        d.name as department_name,
        i.title as source_idea_title,
        i.ideabox_type as source_idea_type
      FROM kaizen_bank kb
      LEFT JOIN users u ON kb.submitter_id = u.id
      LEFT JOIN departments d ON kb.department_id = d.id
      LEFT JOIN ideas i ON kb.source_idea_id = i.id
      WHERE kb.id = $1
    `;

    const scoresQuery = `
      SELECT 
        kes.*,
        kec.name as criteria_name,
        kec.weight as criteria_weight,
        u.full_name as evaluator_name
      FROM kaizen_evaluation_scores kes
      LEFT JOIN kaizen_evaluation_criteria kec ON kes.criteria_id = kec.id
      LEFT JOIN users u ON kes.evaluator_id = u.id
      WHERE kes.kaizen_id = $1
    `;

    const replicationsQuery = `
      SELECT 
        krh.*,
        d.name as target_department_name,
        u.full_name as replicated_by_name
      FROM kaizen_replication_history krh
      LEFT JOIN departments d ON krh.target_department_id = d.id
      LEFT JOIN users u ON krh.replicated_by = u.id
      WHERE krh.source_kaizen_id = $1
      ORDER BY krh.replicated_at DESC
    `;

    const [kaizenResult, scoresResult, replicationsResult] = await Promise.all([
      pool.query(kaizenQuery, [id]),
      pool.query(scoresQuery, [id]),
      pool.query(replicationsQuery, [id])
    ]);

    if (kaizenResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy Kaizen' 
      });
    }

    res.json({
      success: true,
      data: {
        ...kaizenResult.rows[0],
        evaluation_scores: scoresResult.rows,
        replications: replicationsResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thông tin Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Create Kaizen from implemented Idea
 * Chuyển Idea đã triển khai thành công vào Kaizen Bank
 */
const createKaizenFromIdea = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { idea_id, ...kaizenData } = req.body;
    const user_id = req.user?.id || req.body.created_by;

    // Get idea details
    const ideaResult = await client.query(`
      SELECT i.*, u.full_name as submitter_name
      FROM ideas i
      LEFT JOIN users u ON i.submitter_id = u.id
      WHERE i.id = $1
    `, [idea_id]);

    if (ideaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy Idea' 
      });
    }

    const idea = ideaResult.rows[0];

    // Check if idea is implemented
    if (idea.status !== 'implemented') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Chỉ có thể chuyển Idea đã triển khai (status=implemented) vào Kaizen Bank' 
      });
    }

    // Check if already in Kaizen Bank
    const existingCheck = await client.query(
      'SELECT id FROM kaizen_bank WHERE source_idea_id = $1',
      [idea_id]
    );
    if (existingCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Idea này đã được thêm vào Kaizen Bank' 
      });
    }

    // Map idea category to kaizen category
    const categoryMap = {
      'quality_improvement': 'quality',
      'safety_enhancement': 'safety',
      'productivity': 'productivity',
      'cost_reduction': 'cost_reduction',
      'process_improvement': 'process_improvement',
      'environment': 'environment',
      'other': 'other'
    };
    const kaizenCategory = categoryMap[idea.category] || 'other';

    // Insert into kaizen_bank
    const insertQuery = `
      INSERT INTO kaizen_bank (
        source_idea_id,
        title, title_ja,
        category, difficulty,
        problem_description, problem_description_ja,
        solution_description, solution_description_ja,
        before_situation, before_metrics, before_images,
        after_situation, after_metrics, after_images,
        improvement_rate,
        submitter_id, department_id,
        is_team_submission, team_name, team_members,
        benefit_type, currency,
        implementation_cost, implementation_cost_breakdown,
        actual_cost_savings, actual_time_savings_hours,
        actual_quality_improvement, actual_productivity_gain,
        actual_safety_improvement,
        roi_percentage, payback_period_months, annual_savings,
        idea_submitted_at, idea_approved_at,
        implementation_start_date, implementation_end_date, days_to_implement,
        effectiveness_score, overall_score, submitter_satisfaction,
        replication_potential, can_replicate_to,
        is_standardized, standard_document_url, sop_number,
        award_level, award_date, award_amount, certificate_number,
        attachments, video_url,
        created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33, $34, $35, $36,
        $37, $38, $39, $40, $41, $42, $43, $44, $45,
        $46, $47, $48, $49, $50
      )
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      idea_id,
      kaizenData.title || idea.title,
      kaizenData.title_ja || idea.title_ja,
      kaizenCategory,
      kaizenData.difficulty || idea.difficulty,
      kaizenData.problem_description || idea.description,
      kaizenData.problem_description_ja || idea.description_ja,
      kaizenData.solution_description || idea.implementation_notes || '',
      kaizenData.solution_description_ja || idea.implementation_notes_ja,
      kaizenData.before_situation,
      JSON.stringify(kaizenData.before_metrics || {}),
      JSON.stringify(kaizenData.before_images || []),
      kaizenData.after_situation,
      JSON.stringify(kaizenData.after_metrics || {}),
      JSON.stringify(kaizenData.after_images || []),
      kaizenData.improvement_rate,
      idea.submitter_id,
      idea.department_id,
      kaizenData.is_team_submission || false,
      kaizenData.team_name,
      JSON.stringify(kaizenData.team_members || []),
      kaizenData.benefit_type || 'tangible',
      kaizenData.currency || 'VND',
      kaizenData.implementation_cost || 0,
      JSON.stringify(kaizenData.implementation_cost_breakdown || {}),
      kaizenData.actual_cost_savings,
      kaizenData.actual_time_savings_hours,
      kaizenData.actual_quality_improvement,
      kaizenData.actual_productivity_gain,
      kaizenData.actual_safety_improvement,
      kaizenData.roi_percentage,
      kaizenData.payback_period_months,
      kaizenData.annual_savings,
      idea.created_at,
      idea.reviewed_at,
      kaizenData.implementation_start_date,
      kaizenData.implementation_end_date,
      kaizenData.days_to_implement,
      kaizenData.effectiveness_score,
      kaizenData.overall_score,
      kaizenData.submitter_satisfaction,
      kaizenData.replication_potential,
      JSON.stringify(kaizenData.can_replicate_to || []),
      kaizenData.is_standardized || false,
      kaizenData.standard_document_url,
      kaizenData.sop_number,
      kaizenData.award_level,
      kaizenData.award_date,
      kaizenData.award_amount,
      kaizenData.certificate_number,
      JSON.stringify(kaizenData.attachments || idea.attachments || []),
      kaizenData.video_url,
      user_id
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Đã thêm vào Kaizen Bank thành công',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo Kaizen', 
      error: error.message 
    });
  } finally {
    client.release();
  }
};

/**
 * Create Kaizen directly (without source idea)
 */
const createKaizen = async (req, res) => {
  try {
    const {
      title, title_ja,
      category, difficulty,
      problem_description, problem_description_ja,
      solution_description, solution_description_ja,
      before_situation, before_metrics, before_images,
      after_situation, after_metrics, after_images,
      improvement_rate,
      submitter_id, department_id,
      is_team_submission, team_name, team_members,
      benefit_type, currency,
      implementation_cost, implementation_cost_breakdown,
      actual_cost_savings, actual_time_savings_hours,
      actual_quality_improvement, actual_productivity_gain,
      actual_safety_improvement,
      roi_percentage, payback_period_months, annual_savings,
      implementation_start_date, implementation_end_date, days_to_implement,
      effectiveness_score, overall_score, submitter_satisfaction,
      replication_potential, can_replicate_to,
      is_standardized, standard_document_url, sop_number,
      award_level, award_date, award_amount, certificate_number,
      attachments, video_url
    } = req.body;

    const user_id = req.user?.id || submitter_id;

    const result = await pool.query(`
      INSERT INTO kaizen_bank (
        title, title_ja, category, difficulty,
        problem_description, problem_description_ja,
        solution_description, solution_description_ja,
        before_situation, before_metrics, before_images,
        after_situation, after_metrics, after_images,
        improvement_rate,
        submitter_id, department_id,
        is_team_submission, team_name, team_members,
        benefit_type, currency,
        implementation_cost, implementation_cost_breakdown,
        actual_cost_savings, actual_time_savings_hours,
        actual_quality_improvement, actual_productivity_gain,
        actual_safety_improvement,
        roi_percentage, payback_period_months, annual_savings,
        implementation_start_date, implementation_end_date, days_to_implement,
        effectiveness_score, overall_score, submitter_satisfaction,
        replication_potential, can_replicate_to,
        is_standardized, standard_document_url, sop_number,
        award_level, award_date, award_amount, certificate_number,
        attachments, video_url,
        created_by
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
        $41, $42, $43, $44, $45, $46, $47, $48, $49
      )
      RETURNING *
    `, [
      title, title_ja, category, difficulty,
      problem_description, problem_description_ja,
      solution_description, solution_description_ja,
      before_situation, JSON.stringify(before_metrics || {}), JSON.stringify(before_images || []),
      after_situation, JSON.stringify(after_metrics || {}), JSON.stringify(after_images || []),
      improvement_rate,
      user_id, department_id,
      is_team_submission || false, team_name, JSON.stringify(team_members || []),
      benefit_type || 'tangible', currency || 'VND',
      implementation_cost || 0, JSON.stringify(implementation_cost_breakdown || {}),
      actual_cost_savings, actual_time_savings_hours,
      actual_quality_improvement, actual_productivity_gain,
      actual_safety_improvement,
      roi_percentage, payback_period_months, annual_savings,
      implementation_start_date, implementation_end_date, days_to_implement,
      effectiveness_score, overall_score, submitter_satisfaction,
      replication_potential, JSON.stringify(can_replicate_to || []),
      is_standardized || false, standard_document_url, sop_number,
      award_level, award_date, award_amount, certificate_number,
      JSON.stringify(attachments || []), video_url,
      user_id
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo Kaizen thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tạo Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Update Kaizen
 */
const updateKaizen = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user_id = req.user?.id || updates.updated_by;

    const allowedFields = [
      'title', 'title_ja', 'category', 'difficulty',
      'problem_description', 'problem_description_ja',
      'solution_description', 'solution_description_ja', 'root_cause_analysis',
      'before_situation', 'before_metrics', 'before_images',
      'after_situation', 'after_metrics', 'after_images',
      'improvement_rate',
      'is_team_submission', 'team_name', 'team_members',
      'benefit_type', 'currency',
      'implementation_cost', 'implementation_cost_breakdown',
      'actual_cost_savings', 'actual_time_savings_hours',
      'actual_quality_improvement', 'actual_productivity_gain',
      'actual_safety_improvement',
      'roi_percentage', 'payback_period_months', 'annual_savings',
      'implementation_start_date', 'implementation_end_date', 'days_to_implement',
      'effectiveness_score', 'overall_score', 'submitter_satisfaction',
      'replication_potential', 'can_replicate_to',
      'is_standardized', 'standard_document_url', 'sop_number',
      'award_level', 'award_date', 'award_amount', 'certificate_number',
      'attachments', 'video_url'
    ];

    let setClause = [];
    let values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = $${paramIndex++}`);
        if (['before_metrics', 'after_metrics', 'before_images', 'after_images',
             'team_members', 'implementation_cost_breakdown', 'can_replicate_to', 'attachments'].includes(field)) {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (setClause.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có dữ liệu cập nhật' });
    }

    values.push(id);
    const result = await pool.query(`
      UPDATE kaizen_bank 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Kaizen' });
    }

    res.json({
      success: true,
      message: 'Cập nhật Kaizen thành công',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Delete Kaizen
 */
const deleteKaizen = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM kaizen_bank WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Kaizen' });
    }

    res.json({
      success: true,
      message: 'Đã xóa Kaizen thành công'
    });
  } catch (error) {
    console.error('Error deleting kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xóa Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Add evaluation score
 */
const addEvaluationScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { criteria_id, score, comments } = req.body;
    const evaluator_id = req.user?.id || req.body.evaluator_id;

    const criteriaResult = await pool.query(
      'SELECT weight FROM kaizen_evaluation_criteria WHERE id = $1',
      [criteria_id]
    );

    if (criteriaResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tiêu chí đánh giá' });
    }

    const weight = criteriaResult.rows[0].weight;
    const weighted_score = (score * weight) / 100;

    const result = await pool.query(`
      INSERT INTO kaizen_evaluation_scores (kaizen_id, criteria_id, evaluator_id, score, weighted_score, comments)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (kaizen_id, criteria_id, evaluator_id) 
      DO UPDATE SET score = $4, weighted_score = $5, comments = $6, evaluated_at = NOW()
      RETURNING *
    `, [id, criteria_id, evaluator_id, score, weighted_score, comments]);

    // Update overall score
    const overallResult = await pool.query(`
      SELECT SUM(weighted_score) as total_score
      FROM kaizen_evaluation_scores
      WHERE kaizen_id = $1
    `, [id]);

    if (overallResult.rows[0].total_score) {
      await pool.query(`
        UPDATE kaizen_bank SET overall_score = $1 WHERE id = $2
      `, [Math.round(overallResult.rows[0].total_score), id]);
    }

    res.json({
      success: true,
      message: 'Đã thêm điểm đánh giá',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding evaluation score:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi thêm điểm đánh giá', 
      error: error.message 
    });
  }
};

/**
 * Replicate Kaizen to another department/area
 */
const replicateKaizen = async (req, res) => {
  try {
    const { id } = req.params;
    const { target_department_id, target_area, notes } = req.body;
    const user_id = req.user?.id || req.body.replicated_by;

    const result = await pool.query(`
      INSERT INTO kaizen_replication_history (
        source_kaizen_id, target_department_id, target_area, replicated_by, notes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, target_department_id, target_area, user_id, notes]);

    res.status(201).json({
      success: true,
      message: 'Đã ghi nhận nhân rộng Kaizen',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error replicating kaizen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi nhân rộng Kaizen', 
      error: error.message 
    });
  }
};

/**
 * Get Kaizen statistics (SRS Section 11.2)
 */
const getKaizenStatistics = async (req, res) => {
  try {
    const { fiscal_year, department_id } = req.query;
    const year = fiscal_year || new Date().getFullYear();

    let departmentFilter = '';
    let params = [year];
    
    if (department_id) {
      departmentFilter = 'AND kb.department_id = $2';
      params.push(department_id);
    }

    // Kaizen statistics
    const kaizenStats = await pool.query(`
      SELECT 
        COUNT(*) as total_kaizens,
        COUNT(CASE WHEN is_team_submission = true THEN 1 END) as team_kaizens,
        COUNT(CASE WHEN is_team_submission = false THEN 1 END) as individual_kaizens,
        
        COALESCE(SUM(actual_cost_savings), 0) as total_savings,
        COALESCE(SUM(implementation_cost), 0) as total_implementation_cost,
        COALESCE(SUM(annual_savings), 0) as total_annual_savings,
        
        ROUND(AVG(overall_score), 2) as avg_score,
        ROUND(AVG(roi_percentage), 2) as avg_roi,
        ROUND(AVG(days_to_implement), 2) as avg_implementation_days,
        
        COUNT(CASE WHEN award_level = 'gold' THEN 1 END) as gold_awards,
        COUNT(CASE WHEN award_level = 'silver' THEN 1 END) as silver_awards,
        COUNT(CASE WHEN award_level = 'bronze' THEN 1 END) as bronze_awards,
        COALESCE(SUM(award_amount), 0) as total_award_amount,
        
        SUM(replication_count) as total_replications
      FROM kaizen_bank kb
      WHERE kb.fiscal_year = $1 ${departmentFilter}
    `, params);

    // Ideas statistics (SRS: Thống kê đề xuất)
    const ideasStatsQuery = department_id 
      ? `SELECT 
          COUNT(*) as total_ideas,
          COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box_count,
          COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          ROUND(COUNT(CASE WHEN status IN ('approved', 'implemented') THEN 1 END)::DECIMAL / 
                NULLIF(COUNT(*), 0) * 100, 2) as approval_rate
        FROM ideas
        WHERE EXTRACT(YEAR FROM created_at) = $1 AND department_id = $2`
      : `SELECT 
          COUNT(*) as total_ideas,
          COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box_count,
          COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          ROUND(COUNT(CASE WHEN status IN ('approved', 'implemented') THEN 1 END)::DECIMAL / 
                NULLIF(COUNT(*), 0) * 100, 2) as approval_rate
        FROM ideas
        WHERE EXTRACT(YEAR FROM created_at) = $1`;

    const ideasStats = await pool.query(ideasStatsQuery, params);

    // By category
    const categoryStats = await pool.query(`
      SELECT 
        category::TEXT,
        COUNT(*) as count,
        COALESCE(SUM(actual_cost_savings), 0) as total_savings
      FROM kaizen_bank kb
      WHERE kb.fiscal_year = $1 ${departmentFilter}
      GROUP BY category
      ORDER BY count DESC
    `, params);

    // By month
    const monthlyStats = await pool.query(`
      SELECT 
        fiscal_month,
        COUNT(*) as kaizen_count,
        COALESCE(SUM(actual_cost_savings), 0) as savings
      FROM kaizen_bank kb
      WHERE kb.fiscal_year = $1 ${departmentFilter}
      GROUP BY fiscal_month
      ORDER BY fiscal_month
    `, params);

    res.json({
      success: true,
      data: {
        fiscal_year: parseInt(year),
        kaizen: kaizenStats.rows[0],
        ideas: ideasStats.rows[0],
        by_category: categoryStats.rows,
        by_month: monthlyStats.rows
      }
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê', 
      error: error.message 
    });
  }
};

/**
 * Export Kaizen data for Excel/Word
 */
const exportKaizenData = async (req, res) => {
  try {
    const { fiscal_year, department_id } = req.query;
    
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    if (fiscal_year) {
      whereConditions.push(`fiscal_year = $${paramIndex++}`);
      params.push(fiscal_year);
    }
    if (department_id) {
      whereConditions.push(`department_id = $${paramIndex++}`);
      params.push(department_id);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const result = await pool.query(`
      SELECT * FROM kaizen_summary_report
      ${whereClause}
      ORDER BY fiscal_year DESC, fiscal_month DESC, kaizen_code
    `, params);

    res.json({
      success: true,
      export_date: new Date().toISOString(),
      total_records: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error exporting kaizen data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi xuất dữ liệu', 
      error: error.message 
    });
  }
};

/**
 * Get evaluation criteria
 */
const getEvaluationCriteria = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM kaizen_evaluation_criteria
      WHERE is_active = true
      ORDER BY sort_order, criteria_code
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting evaluation criteria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy tiêu chí đánh giá', 
      error: error.message 
    });
  }
};

/**
 * Get department performance (SRS Section 11.2)
 */
const getDepartmentPerformance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM department_kaizen_performance
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting department performance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy hiệu suất phòng ban', 
      error: error.message 
    });
  }
};

/**
 * Get Ideas Statistics (Hòm thư góp ý - SRS Section 4,5)
 * Thống kê Hòm trắng và Hòm hồng
 */
const getIdeasStatistics = async (req, res) => {
  try {
    const { year, department_id } = req.query;
    const targetYear = year || new Date().getFullYear();
    
    let departmentFilter = '';
    let params = [targetYear];
    
    if (department_id) {
      departmentFilter = 'AND department_id = $2';
      params.push(department_id);
    }

    const result = await pool.query(`
      SELECT * FROM ideas_statistics
      WHERE year = $1 ${departmentFilter ? 'AND department_id = $2' : ''}
      ORDER BY department_name
    `, params);

    // Overall summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_ideas,
        COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box_total,
        COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box_total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented_count,
        ROUND(COUNT(CASE WHEN status = 'implemented' THEN 1 END)::DECIMAL / 
              NULLIF(COUNT(*), 0) * 100, 2) as implementation_rate
      FROM ideas
      WHERE EXTRACT(YEAR FROM created_at) = $1 ${departmentFilter}
    `, params);

    res.json({
      success: true,
      data: {
        year: parseInt(targetYear),
        summary: summaryResult.rows[0],
        by_department: result.rows
      }
    });
  } catch (error) {
    console.error('Error getting ideas statistics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy thống kê ý kiến', 
      error: error.message 
    });
  }
};

/**
 * Get implemented ideas ready for Kaizen Bank
 */
const getImplementedIdeasForKaizen = async (req, res) => {
  try {
    const { page = 0, size = 20 } = req.query;
    const { limit, offset } = getPagination(page, size);

    const result = await pool.query(`
      SELECT 
        i.*,
        u.full_name as submitter_name,
        d.name as department_name,
        CASE WHEN kb.id IS NOT NULL THEN true ELSE false END as in_kaizen_bank
      FROM ideas i
      LEFT JOIN users u ON i.submitter_id = u.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN kaizen_bank kb ON kb.source_idea_id = i.id
      WHERE i.status = 'implemented'
      AND kb.id IS NULL
      ORDER BY i.updated_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM ideas i
      LEFT JOIN kaizen_bank kb ON kb.source_idea_id = i.id
      WHERE i.status = 'implemented'
      AND kb.id IS NULL
    `);

    res.json({
      success: true,
      message: 'Danh sách Ideas đã triển khai sẵn sàng đưa vào Kaizen Bank',
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (error) {
    console.error('Error getting implemented ideas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi lấy danh sách Ideas đã triển khai', 
      error: error.message 
    });
  }
};

module.exports = {
  // Kaizen Bank
  getAllKaizens,
  getKaizenById,
  createKaizen,
  createKaizenFromIdea,
  updateKaizen,
  deleteKaizen,
  addEvaluationScore,
  replicateKaizen,
  
  // Statistics & Reports
  getKaizenStatistics,
  exportKaizenData,
  getEvaluationCriteria,
  getDepartmentPerformance,
  getIdeasStatistics,
  getImplementedIdeasForKaizen
};
