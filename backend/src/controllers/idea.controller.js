const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const escalationService = require('../services/escalation.service');
const ratingService = require('../services/rating.service');
const translationService = require('../services/translation.service');
const ragService = require('../services/rag.service');
const { getLanguageFromRequest } = require('../utils/i18n.helper');
const { uploadFilesToGridFS, updateFilesRelatedId } = require('../utils/media-upload.helper');

/**
 * Detect language of text (simple heuristic)
 * Returns 'ja' if contains Japanese characters, otherwise 'vi'
 */
const detectLanguage = (text) => {
  if (!text) return 'vi';
  // Check for Japanese characters (Hiragana, Katakana, CJK)
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(text) ? 'ja' : 'vi';
};

/**
 * Auto-translate text bidirectionally (vi ↔ ja)
 * Returns { original, translated, originalLang }
 */
const autoTranslate = async (text, fieldName = 'text') => {
  if (!text || text.trim() === '') {
    return { original: text, translated: null, originalLang: 'vi' };
  }

  const detectedLang = detectLanguage(text);
  const targetLang = detectedLang === 'ja' ? 'vi' : 'ja';

  try {
    const translated = await translationService.translateText(text, detectedLang, targetLang, false);
    console.log(`[Auto-translate] ${fieldName}: ${detectedLang} → ${targetLang}`);
    return { original: text, translated, originalLang: detectedLang };
  } catch (error) {
    console.error(`[Auto-translate] Failed for ${fieldName}:`, error.message);
    return { original: text, translated: null, originalLang: detectedLang };
  }
};

/**
 * Background async processing for idea (translation + file upload)
 * This function runs AFTER response is sent to client
 */
const processIdeaAsync = async (ideaId, data, files, submitterId) => {
  console.log(`[ProcessIdeaAsync] Starting background processing for idea ${ideaId}`);

  try {
    const {
      title,
      title_ja,
      description,
      description_ja,
      expected_benefit,
      expected_benefit_ja,
    } = data;

    // ===== AUTO-TRANSLATE: Vietnamese ↔ Japanese =====
    let finalTitleJa = title_ja;
    let finalTitle = title;
    let finalDescriptionJa = description_ja;
    let finalDescription = description;
    let finalExpectedBenefitJa = expected_benefit_ja;
    let finalExpectedBenefit = expected_benefit;

    // Auto-translate title
    if (title && !title_ja) {
      const titleResult = await autoTranslate(title, 'title');
      if (titleResult.originalLang === 'ja') {
        finalTitleJa = title;
        finalTitle = titleResult.translated || title;
      } else {
        finalTitleJa = titleResult.translated;
      }
    } else if (title_ja && !title) {
      const titleResult = await autoTranslate(title_ja, 'title');
      finalTitle = titleResult.translated || title_ja;
      finalTitleJa = title_ja;
    }

    // Auto-translate description
    if (description && !description_ja) {
      const descResult = await autoTranslate(description, 'description');
      if (descResult.originalLang === 'ja') {
        finalDescriptionJa = description;
        finalDescription = descResult.translated || description;
      } else {
        finalDescriptionJa = descResult.translated;
      }
    } else if (description_ja && !description) {
      const descResult = await autoTranslate(description_ja, 'description');
      finalDescription = descResult.translated || description_ja;
      finalDescriptionJa = description_ja;
    }

    // Auto-translate expected_benefit
    if (expected_benefit && !expected_benefit_ja) {
      const benefitResult = await autoTranslate(expected_benefit, 'expected_benefit');
      if (benefitResult.originalLang === 'ja') {
        finalExpectedBenefitJa = expected_benefit;
        finalExpectedBenefit = benefitResult.translated || expected_benefit;
      } else {
        finalExpectedBenefitJa = benefitResult.translated;
      }
    } else if (expected_benefit_ja && !expected_benefit) {
      const benefitResult = await autoTranslate(expected_benefit_ja, 'expected_benefit');
      finalExpectedBenefit = benefitResult.translated || expected_benefit_ja;
      finalExpectedBenefitJa = expected_benefit_ja;
    }

    console.log(`[ProcessIdeaAsync] Auto-translated: title=${!!finalTitleJa}, desc=${!!finalDescriptionJa}, benefit=${!!finalExpectedBenefitJa}`);

    // Upload files to MongoDB GridFS
    let attachments = [];
    if (files && files.length > 0) {
      attachments = await uploadFilesToGridFS(files, {
        type: 'idea',
        relatedType: 'idea',
        uploadedBy: submitterId,
      });

      // Update files with idea ID (for linking)
      if (attachments.length > 0) {
        const fileIds = attachments.map(a => a.file_id);
        await updateFilesRelatedId(fileIds, ideaId, 'idea');
      }
    }

    // Update idea with translated content and attachments
    const updateQuery = `
      UPDATE ideas SET
        title = COALESCE($1, title),
        title_ja = COALESCE($2, title_ja),
        description = COALESCE($3, description),
        description_ja = COALESCE($4, description_ja),
        expected_benefit = COALESCE($5, expected_benefit),
        expected_benefit_ja = COALESCE($6, expected_benefit_ja),
        attachments = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `;

    await db.query(updateQuery, [
      finalTitle,
      finalTitleJa,
      finalDescription,
      finalDescriptionJa,
      finalExpectedBenefit,
      finalExpectedBenefitJa,
      JSON.stringify(attachments),
      ideaId
    ]);

    console.log(`[ProcessIdeaAsync] Completed background processing for idea ${ideaId}`);
  } catch (error) {
    console.error(`[ProcessIdeaAsync] Error processing idea ${ideaId}:`, error);
    // Don't throw - this is background processing, log error and continue
  }
};

/**
 * Helper to fetch full idea details and broadcast event
 */
const fetchAndBroadcastIdea = async (app, ideaId, eventName, extraData = {}) => {
  const io = app.get('io');
  if (!io || !io.broadcastIdea) return;

  try {
    const query = `
      SELECT 
        i.id,
        i.ideabox_type,
        i.whitebox_subtype,
        i.category,
        i.title,
        i.description,
        i.expected_benefit,
        i.created_at,
        i.status,
        i.difficulty,
        i.actual_benefit,
        i.submitter_id,
        i.department_id,
        i.assigned_to,
        i.reviewed_by,
        i.is_anonymous,
        i.attachments,
        '[]'::jsonb as history,
        '[]'::jsonb as responses,
        CASE 
          WHEN i.is_anonymous = true THEN 'Anonymous'
          ELSE u.full_name 
        END as submitter_name,
        CASE 
          WHEN i.is_anonymous = true THEN NULL
          ELSE u.employee_code 
        END as submitter_code,
        d.name as department_name,
        a.full_name as assigned_to_name,
        r.full_name as reviewed_by_name,
        (SELECT ir.overall_rating FROM idea_ratings ir WHERE ir.idea_id = i.id LIMIT 1) as "satisfactionRating",
        (SELECT ir.feedback FROM idea_ratings ir WHERE ir.idea_id = i.id LIMIT 1) as "satisfactionComment"
      FROM ideas i
      LEFT JOIN users u ON i.submitter_id = u.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users a ON i.assigned_to = a.id
      LEFT JOIN users r ON i.reviewed_by = r.id
      WHERE i.id = $1
    `;

    const result = await db.query(query, [ideaId]);
    if (result.rows.length > 0) {
      const idea = result.rows[0];
      if (idea.is_anonymous) {
        delete idea.submitter_id;
      }

      console.log(`[Broadcast] Broadcasting idea ${ideaId} for event ${eventName}. Title: ${idea.title?.substring(0, 20)}...`);

      io.broadcastIdea(eventName, {
        ...idea,
        ...extraData
      });
    }
  } catch (error) {
    console.error(`[Broadcast] Error fetching idea ${ideaId}: `, error);
  }
};

/**
 * Create new idea
 * POST /api/ideas
 * 
 * ASYNC PROCESSING: 
 * - Creates idea immediately with original content
 * - Returns response to client right away (no waiting)
 * - Translation and file upload happen in background
 */
const createIdea = asyncHandler(async (req, res) => {
  const {
    ideabox_type,
    whitebox_subtype,
    category,
    title,
    title_ja,
    description,
    description_ja,
    expected_benefit,
    expected_benefit_ja,
    department_id,
    difficulty
  } = req.body;

  const submitter_id = req.user.id;

  // For Pink Box (anonymous), we still store submitter_id but mark as anonymous
  const is_anonymous = ideabox_type === 'pink';

  // Set initial handler level as INTEGER
  // White Box: Starts at Supervisor (level 1)
  // Pink Box: Starts at Admin/GM (level 3)
  const handler_level = ideabox_type === 'pink' ? 3 : 1;

  // Determine whitebox_subtype for White Box if not provided
  let finalWhiteboxSubtype = null;
  if (ideabox_type === 'white') {
    if (whitebox_subtype) {
      finalWhiteboxSubtype = whitebox_subtype;
    } else {
      const ideaCategories = ['process_improvement', 'cost_reduction', 'safety_enhancement', 'quality_improvement'];
      finalWhiteboxSubtype = ideaCategories.includes(category) ? 'idea' : 'opinion';
    }
  }

  // ===== SYNC: Create idea immediately with original content =====
  const query = `
    INSERT INTO ideas(
        ideabox_type,
        whitebox_subtype,
        category,
        title,
        title_ja,
        description,
        description_ja,
        expected_benefit,
        expected_benefit_ja,
        submitter_id,
        department_id,
        is_anonymous,
        attachments,
        status,
        handler_level,
        difficulty
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', $14, $15)
    RETURNING *
      `;

  const values = [
    ideabox_type,
    finalWhiteboxSubtype,
    category,
    title,           // Original title (will be translated async)
    title_ja || null,
    description,     // Original description (will be translated async)
    description_ja || null,
    expected_benefit || null,
    expected_benefit_ja || null,
    submitter_id,
    department_id || null,
    is_anonymous,
    JSON.stringify([]), // Empty attachments (will be uploaded async)
    handler_level,
    difficulty || null
  ];

  const result = await db.query(query, values);
  const idea = result.rows[0];

  // Log history (sync - quick operation)
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
    VALUES($1, 'submitted', $2, $3)`,
    [idea.id, submitter_id, JSON.stringify({ status: 'pending', ideabox_type })]
  );

  // Hide submitter info if anonymous
  if (is_anonymous && req.user.level > 1) {
    delete idea.submitter_id;
  }

  // ===== ASYNC: Process translation and file upload in background =====
  // Use setImmediate to not block response
  const filesForProcessing = req.files ? [...req.files] : [];
  setImmediate(() => {
    processIdeaAsync(idea.id, {
      title,
      title_ja,
      description,
      description_ja,
      expected_benefit,
      expected_benefit_ja,
    }, filesForProcessing, submitter_id);
  });

  // Send notification to Supervisor/Admin about new idea
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIdeaCreatedNotification(
          idea,
          req.user.full_name || 'Nhân viên'
        );
      } catch (err) {
        console.error('[Idea] Error sending new idea notification:', err.message);
      }
    });
  }

  // Return immediately - don't wait for translation/upload
  res.status(201).json({
    success: true,
    message: 'Idea submitted successfully',
    data: idea
  });

  // BROADCAST idea_created for real-time updates (WhiteBoxLanding, etc.)
  // Use helper to broadcast full data with small delay to ensure DB commit
  setTimeout(() => {
    fetchAndBroadcastIdea(req.app, idea.id, 'idea_created');
  }, 100);
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
  const lang = getLanguageFromRequest(req);

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Check if this is a chat search request
  // Chat search will have 'from_chat' query param set by frontend
  const isChatSearch = req.query.from_chat === 'true';

  // Access control based on ideabox_type
  // SPECIAL RULE FOR CHAT SEARCH: Admin (level 1) can see ALL ideas regardless of handler_level/status
  // In normal page view (Ideas List), apply strict visibility rules

  if (isChatSearch && userLevel === 1) {
    // Admin in chat search: Can see ALL ideas without restrictions
    // Just apply ideabox_type filter if specified
    if (filters.ideabox_type) {
      conditions.push(`i.ideabox_type = $${paramIndex} `);
      params.push(filters.ideabox_type);
      paramIndex++;
    }
  } else if (filters.ideabox_type === 'pink') {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(filters.ideabox_type);
    paramIndex++;

    if (userLevel > 1) {
      // Non-admin can only see their own pink box ideas
      conditions.push(`i.submitter_id = $${paramIndex} `);
      params.push(userId);
      paramIndex++;
    }
    // Admin can see all pink ideas (no additional condition)
  } else if (filters.ideabox_type === 'white') {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(filters.ideabox_type);
    paramIndex++;

    // White Box / General Logic
    // 1. Approved/Implemented ideas are visible to EVERYONE
    // 2. Submitter can always see their own ideas
    // 3. Supervisors (Level 3) see ideas at handler_level = 1 (supervisor level)
    // 4. Managers (Level 2) see ideas at handler_level = 2 (manager level)
    // 5. Admins (Level 1) see ideas at handler_level = 3 (general_manager level)
    // Note: handler_level is stored as INTEGER (1=supervisor, 2=manager, 3=general_manager)

    let visibilityClause = `(
      i.status IN('approved', 'implemented') 
      OR i.submitter_id = $${paramIndex}
      `;
    params.push(userId);
    paramIndex++;

    if (userLevel === 1) { // Admin - sees ideas escalated to GM level (handler_level = 3)
      visibilityClause += ` OR i.handler_level >= 1`; // Admin sees ALL levels
    } else if (userLevel === 2) { // Manager - sees ideas at manager level
      visibilityClause += ` OR i.handler_level <= 2`;
    } else if (userLevel <= 4) { // Supervisor (Level 3/4) - sees ideas at supervisor level
      visibilityClause += ` OR i.handler_level = 1`;
    }

    visibilityClause += `)`;
    conditions.push(visibilityClause);
  } else if (!isChatSearch || userLevel > 1) {
    // No ideabox_type specified and either:
    // - Not a chat search, OR
    // - User is not admin
    // Show only approved/implemented + own ideas
    conditions.push(`(i.status IN('approved', 'implemented') OR i.submitter_id = $${paramIndex})`);
    params.push(userId);
    paramIndex++;
  }

  // Apply search filter
  // Smart search with Vietnamese accent normalization
  // Strategy: Split into words and use AND logic (all words must appear)
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase().trim();
    // Keep words >= 2 chars (was 3, now more flexible for Vietnamese)
    const keywords = searchTerm.split(/\s+/).filter(k => k.length >= 2);

    if (keywords.length > 0) {
      // Normalize Vietnamese accents for better matching
      const normalizeVietnamese = (text) => {
        return text
          .replace(/hoá/g, 'hóa')
          .replace(/uỷ/g, 'ủy')
          .replace(/thuỷ/g, 'thủy')
          .replace(/khoá/g, 'khóa')
          .replace(/toá/g, 'tóa');
      };

      // Build normalized field expressions
      const normalizedTitle = `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.title, 'hoá', 'hóa'), 'uỷ', 'ủy'), 'thuỷ', 'thủy'), 'khoá', 'khóa'), 'toá', 'tóa'))`;
      const normalizedDesc = `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.description, 'hoá', 'hóa'), 'uỷ', 'ủy'), 'thuỷ', 'thủy'), 'khoá', 'khóa'), 'toá', 'tóa'))`;
      const normalizedBenefit = `LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(i.expected_benefit, 'hoá', 'hóa'), 'uỷ', 'ủy'), 'thuỷ', 'thủy'), 'khoá', 'khóa'), 'toá', 'tóa'))`;
      const titleJa = `LOWER(COALESCE(i.title_ja, ''))`;
      const descJa = `LOWER(COALESCE(i.description_ja, ''))`;
      const benefitJa = `LOWER(COALESCE(i.expected_benefit_ja, ''))`;

      // Each keyword must appear in at least one field (AND logic for all keywords)
      const keywordConditions = keywords.map((keyword) => {
        const normalizedKeyword = normalizeVietnamese(keyword);
        const searchPattern = `% ${normalizedKeyword}% `;
        const condition = `(
        ${normalizedTitle} LIKE $${paramIndex}
          OR ${normalizedDesc} LIKE $${paramIndex}
          OR ${normalizedBenefit} LIKE $${paramIndex}
          OR ${titleJa} LIKE $${paramIndex}
          OR ${descJa} LIKE $${paramIndex}
          OR ${benefitJa} LIKE $${paramIndex}
      )`;
        params.push(searchPattern);
        paramIndex++;
        return condition;
      });

      // All keywords must match (AND logic)
      conditions.push(`(${keywordConditions.join(' AND ')})`);
    }
  }

  if (filters.status) {
    conditions.push(`i.status = $${paramIndex} `);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.category) {
    conditions.push(`i.category = $${paramIndex} `);
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.department_id) {
    conditions.push(`i.department_id = $${paramIndex} `);
    params.push(filters.department_id);
    paramIndex++;
  }

  if (filters.assigned_to) {
    conditions.push(`i.assigned_to = $${paramIndex} `);
    params.push(filters.assigned_to);
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`i.created_at >= $${paramIndex} `);
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`i.created_at <= $${paramIndex} `);
    params.push(filters.date_to);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} ` : '';

  // Get total count (need alias 'i' to match WHERE conditions)
  const countQuery = `SELECT COUNT(*) FROM ideas i ${whereClause} `;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);

  // Get ideas with pagination
  const query = `
    SELECT
    i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
        COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.expected_benefit_ja' : 'NULL'}, i.expected_benefit) as expected_benefit,
    COALESCE(${lang === 'ja' ? 'i.actual_benefit_ja' : 'NULL'}, i.actual_benefit) as actual_benefit,
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
  r.full_name as reviewed_by_name,
  (SELECT ir.overall_rating FROM idea_ratings ir WHERE ir.idea_id = i.id AND ir.rated_by = $${paramIndex} LIMIT 1) as "satisfactionRating"
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

  // Fetch history and responses for each idea
  const ideasWithDetails = await Promise.all(result.rows.map(async (idea) => {
    // Get responses for this idea
    const responsesQuery = `
SELECT
r.*,
  COALESCE(${lang === 'ja' ? 'r.response_ja' : 'NULL'}, r.response) as response,
  u.full_name as responder_name,
  u.employee_code,
  u.role
      FROM idea_responses r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.idea_id = $1
      ORDER BY r.created_at ASC
  `;
    const responsesResult = await db.query(responsesQuery, [idea.id]);

    // Get history for this idea (only for authorized users)
    let historyResult = { rows: [] };
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
      historyResult = await db.query(historyQuery, [idea.id]);
    }

    return {
      ...idea,
      responses: responsesResult.rows,
      history: historyResult.rows
    };
  }));

  res.json({
    success: true,
    data: ideasWithDetails,
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
  const lang = getLanguageFromRequest(req);

  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.expected_benefit_ja' : 'NULL'}, i.expected_benefit) as expected_benefit,
  COALESCE(${lang === 'ja' ? 'i.actual_benefit_ja' : 'NULL'}, i.actual_benefit) as actual_benefit,
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
  r.full_name as reviewed_by_name,
  (SELECT ir.overall_rating FROM idea_ratings ir WHERE ir.idea_id = i.id AND ir.rated_by = $2 LIMIT 1) as "satisfactionRating",
    (SELECT ir.feedback FROM idea_ratings ir WHERE ir.idea_id = i.id AND ir.rated_by = $2 LIMIT 1) as "satisfactionComment"
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
  COALESCE(${lang === 'ja' ? 'r.response_ja' : 'NULL'}, r.response) as response,
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
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'assigned', $2, $3)`,
    [id, userId, JSON.stringify({ assigned_to, department_id })]
  );

  // Send notification to assigned user (WHITE BOX only)
  if (assigned_to && idea.rows[0].ideabox_type === 'white') {
    const pushNotificationService = req.app.get('pushNotificationService');
    if (pushNotificationService) {
      setImmediate(async () => {
        try {
          await pushNotificationService.sendIdeaAssignedNotification(
            result.rows[0],
            assigned_to
          );
        } catch (err) {
          console.error('[Idea] Error sending assignment notification:', err.message);
        }
      });
    }
  }

  res.json({
    success: true,
    message: 'Idea assigned successfully',
    data: result.rows[0]
  });

  // BROADCAST idea_updated for real-time updates
  setImmediate(() => {
    fetchAndBroadcastIdea(req.app, result.rows[0].id, 'idea_updated', {
      old_status: oldStatus,
      new_status: status
    });
  });
});

/**
 * Add response to idea
 * POST /api/ideas/:id/responses
 * All authenticated users can add responses/comments to ideas
 */
const addResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response, response_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Check if idea exists
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);

  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  // All authenticated users can respond/comment on ideas
  // This encourages discussion and collaboration
  // Note: Anonymous Pink Box ideas still hide submitter info in responses

  // Handle attachments
  const attachments = req.files ? req.files.map(file => ({
    filename: file.filename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size: file.size,
    path: file.path
  })) : [];

  const query = `
    INSERT INTO idea_responses(idea_id, user_id, response, response_ja, attachments)
VALUES($1, $2, $3, $4, $5)
RETURNING *
  `;

  const result = await db.query(query, [id, userId, response, response_ja || null, JSON.stringify(attachments)]);

  // Get user info for response
  const responseWithUser = await db.query(`
SELECT
r.*,
  COALESCE(${lang === 'ja' ? 'r.response_ja' : 'NULL'}, r.response) as response,
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

  // Send FCM push notification to submitter
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService && idea.rows[0].submitter_id) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIdeaResponseNotification(
          idea.rows[0],
          result.rows[0],
          userId
        );
      } catch (err) {
        console.error('[Idea] Error sending push notification:', err.message);
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Response added successfully',
    data: responseWithUser.rows[0]
  });

  // BROADCAST idea_response for real-time updates
  const io = req.app.get('io');
  if (io) {
    const responseData = {
      idea_id: id,
      response_id: result.rows[0].id,
      response: responseWithUser.rows[0],
      updated_at: result.rows[0].created_at
    };
    
    // Broadcast to global ideas room
    if (io.broadcastIdea) {
      io.broadcastIdea('idea_response', responseData);
    }
    
    // Also emit to specific idea room for real-time chat
    io.to(`idea_${id}`).emit('idea_response', responseData);
  }
});

/**
 * Update idea status and review
 * PUT /api/ideas/:id/review
 */
const reviewIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, review_notes, feasibility_score, impact_score, difficulty } = req.body;
  const userId = req.user.id;

  // Get idea
  const idea = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);

  if (idea.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  const oldStatus = idea.rows[0].status;

  // Update idea - only update difficulty if explicitly provided
  const query = `
    UPDATE ideas
SET
status = $1,
  review_notes = $2,
  feasibility_score = $3,
  impact_score = $4,
  difficulty = COALESCE($5, difficulty),
  reviewed_by = $6,
  reviewed_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
RETURNING *
  `;

  const result = await db.query(query, [
    status,
    review_notes,
    feasibility_score || null,
    impact_score || null,
    difficulty || null,
    userId,
    id
  ]);

  // Log history
  const historyDetails = {
    old_status: oldStatus,
    new_status: status
  };

  // Only add review_notes if provided and not just a difficulty update message
  if (review_notes && !review_notes.startsWith('Updated difficulty to')) {
    historyDetails.review_notes = review_notes;
  }

  // Add difficulty if provided
  if (difficulty) {
    historyDetails.difficulty = difficulty;
  }

  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'reviewed', $2, $3)`,
    [id, userId, JSON.stringify(historyDetails)]
  );

  // Send notification to submitter about status change
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService && idea.rows[0].submitter_id && oldStatus !== status) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIdeaStatusChangedNotification(
          result.rows[0],
          oldStatus,
          status
        );
      } catch (err) {
        console.error('[Idea] Error sending review notification:', err.message);
      }
    });
  }

  // INDEX TO RAG when approved or implemented (for duplicate detection)
  if (['approved', 'implemented', 'in_progress'].includes(status)) {
    setImmediate(async () => {
      try {
        const ragResult = await ragService.indexIdea(id);
        console.log(`[Idea] RAG indexed idea ${id}:`, ragResult.message);
      } catch (err) {
        console.error('[Idea] Error indexing idea to RAG:', err.message);
      }
    });
  }

  res.json({
    success: true,
    message: 'Idea reviewed successfully',
    data: result.rows[0]
  });

  // BROADCAST idea_updated for real-time updates
  setImmediate(() => {
    fetchAndBroadcastIdea(req.app, result.rows[0].id, 'idea_updated', {
      old_status: oldStatus,
      new_status: status
    });
  });
});

/**
 * Implement idea
 * PUT /api/ideas/:id/implement
 */
const implementIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { implementation_notes, actual_benefit, actual_benefit_ja } = req.body;
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
  actual_benefit_ja = COALESCE($3, actual_benefit_ja),
  implemented_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
RETURNING *
  `;

  const result = await db.query(query, [implementation_notes, actual_benefit, actual_benefit_ja || null, id]);

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'implemented', $2, $3)`,
    [id, userId, JSON.stringify({ implementation_notes, actual_benefit, actual_benefit_ja: actual_benefit_ja || null })]
  );

  // Send notification to submitter about implementation
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService && idea.rows[0].submitter_id) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIdeaStatusChangedNotification(
          result.rows[0],
          idea.rows[0].status,
          'implemented'
        );
      } catch (err) {
        console.error('[Idea] Error sending implementation notification:', err.message);
      }
    });
  }

  // INDEX TO RAG when implemented (for duplicate detection & knowledge base)
  setImmediate(async () => {
    try {
      const ragResult = await ragService.indexIdea(id);
      console.log(`[Idea] RAG indexed implemented idea ${id}:`, ragResult.message);
    } catch (err) {
      console.error('[Idea] Error indexing implemented idea to RAG:', err.message);
    }
  });

  res.json({
    success: true,
    message: 'Idea marked as implemented successfully',
    data: result.rows[0]
  });

  // BROADCAST idea_updated for real-time updates
  setImmediate(() => {
    fetchAndBroadcastIdea(req.app, result.rows[0].id, 'idea_updated');
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
    conditions.push(`created_at >= $${paramIndex} `);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`created_at <= $${paramIndex} `);
    params.push(date_to);
    paramIndex++;
  }

  if (ideabox_type) {
    conditions.push(`ideabox_type = $${paramIndex} `);
    params.push(ideabox_type);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} ` : '';

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
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'escalated', $2, $3)`,
    [id, userId, JSON.stringify({ from_level: idea.handler_level, to_level: nextLevel, reason })]
  );

  // Add response about escalation
  await db.query(
    `INSERT INTO idea_responses(idea_id, user_id, response)
VALUES($1, $2, $3)`,
    [id, userId, `Escalated to ${nextLevel}.Reason: ${reason || 'No reason provided'} `]
  );

  // Send notification to users at the escalated level (Manager/GM)
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendIdeaCreatedNotification(
          { ...result.rows[0], title: `[Escalated] ${result.rows[0].title} ` },
          req.user.full_name || 'Người xử lý'
        );
      } catch (err) {
        console.error('[Idea] Error sending escalation notification:', err.message);
      }
    });
  }

  res.json({
    success: true,
    message: `Idea escalated to ${nextLevel} successfully`,
    data: result.rows[0]
  });

  // BROADCAST idea_updated for real-time updates (Escalation)
  setImmediate(() => {
    fetchAndBroadcastIdea(req.app, result.rows[0].id, 'idea_updated');
  });
});

/**
 * Get Kaizen Bank (Archive of implemented ideas)
 * GET /api/ideas/archive
 */
const getKaizenBank = asyncHandler(async (req, res) => {
  const { pagination, filters } = req;
  const { search, category } = req.query;
  const lang = getLanguageFromRequest(req);

  const conditions = ["i.status = 'implemented'"];
  const params = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(`(
  i.title ILIKE $${paramIndex}
      OR i.title_ja ILIKE $${paramIndex}
      OR i.description ILIKE $${paramIndex}
      OR i.description_ja ILIKE $${paramIndex}
)`);
    params.push(`% ${search}% `);
    paramIndex++;
  }

  if (category) {
    conditions.push(`i.category = $${paramIndex} `);
    params.push(category);
    paramIndex++;
  }

  if (filters && filters.ideabox_type) {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(filters.ideabox_type);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')} `;

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM ideas i ${whereClause} `;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);

  // Get archived ideas
  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.expected_benefit_ja' : 'NULL'}, i.expected_benefit) as expected_benefit,
  COALESCE(${lang === 'ja' ? 'i.actual_benefit_ja' : 'NULL'}, i.actual_benefit) as actual_benefit,
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
  const lang = getLanguageFromRequest(req);

  if (!q || q.trim().length < 2) {
    throw new AppError('Search query must be at least 2 characters', 400);
  }

  const conditions = ["status = 'implemented'"];
  const params = [`% ${q}% `];
  let paramIndex = 2;

  if (category) {
    conditions.push(`category = $${paramIndex} `);
    params.push(category);
    paramIndex++;
  }

  if (date_from) {
    conditions.push(`implemented_at >= $${paramIndex} `);
    params.push(date_from);
    paramIndex++;
  }

  if (date_to) {
    conditions.push(`implemented_at <= $${paramIndex} `);
    params.push(date_to);
    paramIndex++;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')} `;

  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.expected_benefit_ja' : 'NULL'}, i.expected_benefit) as expected_benefit,
  COALESCE(${lang === 'ja' ? 'i.actual_benefit_ja' : 'NULL'}, i.actual_benefit) as actual_benefit,
  CASE 
        WHEN i.is_anonymous = false THEN u.full_name
        ELSE 'Anonymous'
END as contributor_name,
  ts_rank(
    to_tsvector('english',
      COALESCE(i.title, '') || ' ' || COALESCE(i.title_ja, '') || ' ' ||
      COALESCE(i.description, '') || ' ' || COALESCE(i.description_ja, '') || ' ' ||
      COALESCE(i.actual_benefit, '') || ' ' || COALESCE(i.actual_benefit_ja, '') || ' ' ||
      COALESCE(i.expected_benefit, '') || ' ' || COALESCE(i.expected_benefit_ja, '')
    ),
    plainto_tsquery('english', $1)
  ) as relevance
    FROM ideas i
    LEFT JOIN users u ON i.submitter_id = u.id
    ${whereClause}
AND(
  i.title ILIKE $1 
      OR i.title_ja ILIKE $1
      OR i.description ILIKE $1 
      OR i.description_ja ILIKE $1
      OR i.actual_benefit ILIKE $1
      OR i.actual_benefit_ja ILIKE $1
      OR i.expected_benefit ILIKE $1
      OR i.expected_benefit_ja ILIKE $1
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
  const lang = getLanguageFromRequest(req);

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
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.expected_benefit_ja' : 'NULL'}, i.expected_benefit) as expected_benefit,
  COALESCE(${lang === 'ja' ? 'i.actual_benefit_ja' : 'NULL'}, i.actual_benefit) as actual_benefit,
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

/**
 * Get idea responses history
 * GET /api/ideas/:id/responses
 */
const getIdeaResponses = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lang = getLanguageFromRequest(req);

  // Check if idea exists
  const ideaQuery = `
    SELECT id, ideabox_type, submitter_id, department_id
    FROM ideas
    WHERE id = $1
  `;

  const ideaResult = await db.query(ideaQuery, [id]);

  if (ideaResult.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  const idea = ideaResult.rows[0];
  const userLevel = req.user.level;
  const userRole = req.user.role;

  // Check access permission
  // Only admin can view responses history via chatbox
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view idea responses history', 403);
  }

  // Get all responses with user information
  const responsesQuery = `
SELECT
ir.id,
  COALESCE(${lang === 'ja' ? 'ir.response_ja' : 'NULL'}, ir.response) as response,
  ir.response as response_vi,
  ir.response_ja,
  ir.attachments,
  ir.created_at,
  u.id as user_id,
  u.full_name as user_name,
  u.role as user_role,
  u.level as user_level,
  d.name as department_name
    FROM idea_responses ir
    LEFT JOIN users u ON ir.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE ir.idea_id = $1
    ORDER BY ir.created_at ASC
  `;

  const responsesResult = await db.query(responsesQuery, [id]);

  res.json({
    success: true,
    data: responsesResult.rows
  });
});

/**
 * Get idea history
 * GET /api/ideas/:id/history
 */
const getIdeaHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if idea exists
  const ideaQuery = `
    SELECT id, ideabox_type, submitter_id, department_id
    FROM ideas
    WHERE id = $1
  `;

  const ideaResult = await db.query(ideaQuery, [id]);

  if (ideaResult.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  const idea = ideaResult.rows[0];
  const userRole = req.user.role;

  // Check access permission
  // Only admin can view action history via chatbox
  if (userRole !== 'admin') {
    throw new AppError('Only administrators can view idea action history', 403);
  }

  // Get all history with user information
  const historyQuery = `
SELECT
ih.id,
  ih.action,
  ih.details,
  ih.created_at,
  u.id as user_id,
  u.full_name as user_name,
  u.role as user_role,
  u.level as user_level,
  d.name as department_name
    FROM idea_history ih
    LEFT JOIN users u ON ih.performed_by = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE ih.idea_id = $1
    ORDER BY ih.created_at ASC
  `;

  const historyResult = await db.query(historyQuery, [id]);

  res.json({
    success: true,
    data: historyResult.rows
  });
});

/**
 * Escalate idea to next handler level (Supervisor -> Manager -> GM)
 * POST /api/ideas/:id/escalate-level
 */
const escalateToNextLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const result = await escalationService.escalateIdea(id, userId, reason, false);

  // Send notification
  const notificationService = req.app.get('notificationService');
  if (notificationService && result.newHandler) {
    await notificationService.createNotification({
      type: 'idea_escalated',
      title: 'Idea Escalated to You',
      message: `An idea has been escalated to ${result.levelName} `,
      user_id: result.newHandler.id,
      reference_type: 'idea',
      reference_id: id,
    });
  }

  res.json({
    success: true,
    message: `Idea escalated to ${result.levelName} `,
    data: result
  });
});

/**
 * Submit rating for an idea
 * POST /api/ideas/:id/rating
 */
const submitRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const rating = await ratingService.rateIdea(id, userId, req.body);

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    data: rating
  });
});

/**
 * Get rating for an idea
 * GET /api/ideas/:id/rating
 */
const getRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const rating = await ratingService.getIdeaRating(id, userId);

  res.json({
    success: true,
    data: rating
  });
});

/**
 * Get rating statistics for ideas
 * GET /api/ideas/rating-stats
 */
const getRatingStats = asyncHandler(async (req, res) => {
  const { department_id, start_date, end_date } = req.query;

  const stats = await ratingService.getIdeaRatingStats({
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
 * Update difficulty level (A-D classification)
 * PUT /api/ideas/:id/difficulty
 */
const updateDifficultyLevel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { difficulty_level } = req.body;
  const userId = req.user.id;

  if (!['A', 'B', 'C', 'D'].includes(difficulty_level)) {
    throw new AppError('Invalid difficulty level. Must be A, B, C, or D', 400);
  }

  const result = await db.query(`
    UPDATE ideas 
    SET difficulty_level = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
RETURNING *
  `, [difficulty_level, id]);

  if (result.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  // Log history
  await db.query(`
    INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'difficulty_updated', $2, $3)
  `, [id, userId, JSON.stringify({ difficulty_level })]);

  res.json({
    success: true,
    message: 'Difficulty level updated',
    data: result.rows[0]
  });
});

/**
 * Get my ideas (ideas submitted by current user)
 * GET /api/ideas/my
 * For App Mobile - shows user's own submitted ideas
 */
const getMyIdeas = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { ideabox_type, status, category, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = ['i.submitter_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (ideabox_type) {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(ideabox_type);
    paramIndex++;
  }

  if (status) {
    conditions.push(`i.status = $${paramIndex} `);
    params.push(status);
    paramIndex++;
  }

  if (category) {
    conditions.push(`i.category = $${paramIndex} `);
    params.push(category);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM ideas i WHERE ${whereClause} `,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get ideas
  params.push(parseInt(limit), offset);
  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as display_description,
  d.name as department_name,
  d.name_ja as department_name_ja,
  a.full_name as assigned_to_name,
  r.full_name as reviewed_by_name,
  (SELECT COUNT(*) FROM idea_responses WHERE idea_id = i.id) as response_count,
    (SELECT ir.overall_rating FROM idea_ratings ir WHERE ir.idea_id = i.id LIMIT 1) as my_rating
    FROM ideas i
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users a ON i.assigned_to = a.id
    LEFT JOIN users r ON i.reviewed_by = r.id
    WHERE ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
`;

  const result = await db.query(query, params);

  // Get summary counts
  const summaryResult = await db.query(`
SELECT
COUNT(*) as total,
  COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box,
  COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'implemented' THEN 1 END) as implemented,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
    FROM ideas
    WHERE submitter_id = $1
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
 * Get ideas to review (for Supervisor/Manager)
 * GET /api/ideas/to-review
 * Shows ideas that need current user's review/approval
 */
const getIdeasToReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userLevel = req.user.level;
  const userRole = req.user.role;
  const { ideabox_type, category, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);

  // Level 4+ cannot review
  if (userLevel > 3) {
    return res.json({
      success: true,
      data: [],
      summary: { total: 0, pending: 0, under_review: 0 },
      pagination: { page: 1, limit: parseInt(limit), total: 0, total_pages: 0 }
    });
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Determine handler_level based on user role
  // Supervisor (level 3) handles level 1 (white box first step)
  // Manager (level 2) handles level 2
  // Admin/GM (level 1) handles level 3 (pink box and escalated)
  let handlerLevelCondition;
  if (userLevel === 1) {
    // Admin/GM can see all, especially pink box (handler_level = 3)
    handlerLevelCondition = 'i.handler_level IN (2, 3)';
  } else if (userLevel === 2) {
    // Manager sees escalated from supervisor (handler_level = 2)
    handlerLevelCondition = 'i.handler_level = 2';
  } else {
    // Supervisor sees initial white box (handler_level = 1)
    handlerLevelCondition = 'i.handler_level = 1';
  }

  const conditions = [
    handlerLevelCondition,
    "i.status IN ('pending', 'under_review')"
  ];
  const params = [];
  let paramIndex = 1;

  if (ideabox_type) {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(ideabox_type);
    paramIndex++;
  }

  if (category) {
    conditions.push(`i.category = $${paramIndex} `);
    params.push(category);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM ideas i WHERE ${whereClause} `,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get ideas
  params.push(parseInt(limit), offset);
  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
  d.name as department_name,
  CASE WHEN i.is_anonymous THEN NULL ELSE u.full_name END as submitter_name,
    CASE WHEN i.is_anonymous THEN NULL ELSE u.employee_code END as submitter_code,
      (SELECT COUNT(*) FROM idea_responses WHERE idea_id = i.id) as response_count
    FROM ideas i
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users u ON i.submitter_id = u.id
    WHERE ${whereClause}
    ORDER BY i.created_at ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
`;

  const result = await db.query(query, params);

  // Get summary
  const summaryResult = await db.query(`
SELECT
COUNT(*) as total,
  COUNT(CASE WHEN ideabox_type = 'white' THEN 1 END) as white_box,
  COUNT(CASE WHEN ideabox_type = 'pink' THEN 1 END) as pink_box,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'under_review' THEN 1 END) as under_review
    FROM ideas i
    WHERE ${whereClause}
`, params.slice(0, -2));

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
 * Get ideas by department
 * GET /api/ideas/department/:departmentId
 */
const getIdeasByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const userLevel = req.user.level;
  const { ideabox_type, status, limit = 20, page = 1 } = req.query;
  const lang = getLanguageFromRequest(req);

  // Check permission
  if (userLevel > 3) {
    throw new AppError('Permission denied', 403);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = ['i.department_id = $1'];
  const params = [departmentId];
  let paramIndex = 2;

  // Non-admin cannot see pink box by department
  if (userLevel > 1) {
    conditions.push("i.ideabox_type = 'white'");
  } else if (ideabox_type) {
    conditions.push(`i.ideabox_type = $${paramIndex} `);
    params.push(ideabox_type);
    paramIndex++;
  }

  if (status) {
    conditions.push(`i.status = $${paramIndex} `);
    params.push(status);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM ideas i WHERE ${whereClause} `,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get ideas
  params.push(parseInt(limit), offset);
  const query = `
SELECT
i.*,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as display_title,
  d.name as department_name,
  CASE WHEN i.is_anonymous THEN NULL ELSE u.full_name END as submitter_name,
    a.full_name as assigned_to_name
    FROM ideas i
    LEFT JOIN departments d ON i.department_id = d.id
    LEFT JOIN users u ON i.submitter_id = u.id
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

// =====================================================
// PINK BOX WORKFLOW APIs (Hòm Hồng / ピンクボックス)
// =====================================================

/**
 * Forward pink box idea to department
 * POST /api/ideas/:id/forward
 * Chuyển ý kiến hòm hồng cho phòng ban xử lý
 * ピンクボックスの意見を部門に転送する
 */
const forwardToDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department_id, note, note_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Verify idea exists and is pink box
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý kiến', 404);
  }

  const idea = ideaResult.rows[0];
  if (idea.ideabox_type !== 'pink') {
    throw new AppError(
      lang === 'ja' ? 'この機能はピンクボックスのみ利用可能です' : 'Chức năng này chỉ dành cho Hòm hồng',
      400
    );
  }

  // Verify department exists
  const deptResult = await db.query('SELECT * FROM departments WHERE id = $1', [department_id]);
  if (deptResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '部門が見つかりません' : 'Không tìm thấy phòng ban', 404);
  }

  // Update idea
  const updateQuery = `
    UPDATE ideas
SET
status = 'forwarded',
  coordinator_id = $1,
  forwarded_to_department_id = $2,
  forwarded_at = CURRENT_TIMESTAMP,
  forwarded_by = $1,
  forwarded_note = $3,
  forwarded_note_ja = $4,
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
RETURNING *
  `;

  const result = await db.query(updateQuery, [userId, department_id, note, note_ja, id]);

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'forwarded', $2, $3)`,
    [id, userId, JSON.stringify({
      department_id,
      department_name: deptResult.rows[0].name,
      note,
      note_ja
    })]
  );

  // TODO: Send notification to department managers/supervisors

  res.json({
    success: true,
    message: lang === 'ja' ? '部門に転送しました' : 'Đã chuyển cho phòng ban',
    data: result.rows[0]
  });
});

/**
 * Department responds to forwarded idea
 * POST /api/ideas/:id/department-response
 * Phòng ban trả lời ý kiến được chuyển
 * 部門が転送された意見に回答する
 */
const departmentRespond = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { response, response_ja } = req.body;
  const userId = req.user.id;
  const userDepartmentId = req.user.department_id;
  const lang = getLanguageFromRequest(req);

  // Verify idea exists and is forwarded to user's department
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý kiến', 404);
  }

  const idea = ideaResult.rows[0];

  // Check if user's department matches forwarded department (or user is admin)
  if (req.user.level > 1 && idea.forwarded_to_department_id !== userDepartmentId) {
    throw new AppError(
      lang === 'ja' ? 'この意見はあなたの部門に割り当てられていません' : 'Ý kiến này không được giao cho phòng ban của bạn',
      403
    );
  }

  // Update idea
  const updateQuery = `
    UPDATE ideas
SET
status = 'department_responded',
  department_response = $1,
  department_response_ja = $2,
  department_responded_by = $3,
  department_responded_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
RETURNING *
  `;

  const result = await db.query(updateQuery, [response, response_ja, userId, id]);

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'department_responded', $2, $3)`,
    [id, userId, JSON.stringify({ response: response?.substring(0, 100) })]
  );

  // TODO: Notify coordinator

  res.json({
    success: true,
    message: lang === 'ja' ? '回答を送信しました' : 'Đã gửi phản hồi',
    data: result.rows[0]
  });
});

/**
 * Coordinator requests revision from department
 * POST /api/ideas/:id/request-revision
 * Yêu cầu phòng ban bổ sung thông tin
 * 部門に追加情報を要求する
 */
const requestRevision = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { revision_note, revision_note_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Update idea
  const updateQuery = `
    UPDATE ideas
SET
status = 'need_revision',
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
RETURNING *
  `;

  const result = await db.query(updateQuery, [id]);

  // Add response as revision request
  await db.query(
    `INSERT INTO idea_responses(idea_id, user_id, response, response_ja)
VALUES($1, $2, $3, $4)`,
    [id, userId, `[YÊU CẦU BỔ SUNG] ${revision_note} `, `[修正依頼] ${revision_note_ja || revision_note} `]
  );

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'revision_requested', $2, $3)`,
    [id, userId, JSON.stringify({ note: revision_note })]
  );

  res.json({
    success: true,
    message: lang === 'ja' ? '修正依頼を送信しました' : 'Đã gửi yêu cầu bổ sung',
    data: result.rows[0]
  });
});

/**
 * Publish response to public board
 * POST /api/ideas/:id/publish
 * Công bố phản hồi lên trang chung
 * 回答を公開掲示板に公開する
 */
const publishResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { published_response, published_response_ja } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Verify idea exists and has department response
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý kiến', 404);
  }

  const idea = ideaResult.rows[0];
  if (!idea.department_response && !published_response) {
    throw new AppError(
      lang === 'ja' ? '公開する回答がありません' : 'Chưa có phản hồi để công bố',
      400
    );
  }

  // Update idea
  const updateQuery = `
    UPDATE ideas
SET
status = 'published',
  published_response = COALESCE($1, department_response),
  published_response_ja = COALESCE($2, department_response_ja),
  published_at = CURRENT_TIMESTAMP,
  published_by = $3,
  is_published = true,
  updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
RETURNING *
  `;

  const result = await db.query(updateQuery, [published_response, published_response_ja, userId, id]);

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'published', $2, $3)`,
    [id, userId, JSON.stringify({ published: true })]
  );

  // TODO: Send private notification to original submitter

  res.json({
    success: true,
    message: lang === 'ja' ? '回答を公開しました' : 'Đã công bố phản hồi',
    data: result.rows[0]
  });
});

/**
 * Get all published ideas (Pink Box public board)
 * GET /api/ideas/published
 * Lấy danh sách ý kiến đã công bố
 * 公開された意見一覧を取得
 */
const getPublishedIdeas = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  const lang = getLanguageFromRequest(req);
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const conditions = ['is_published = true'];
  const params = [];
  let paramIndex = 1;

  if (category) {
    conditions.push(`category = $${paramIndex} `);
    params.push(category);
    paramIndex++;
  }

  if (search) {
    conditions.push(`(
  title ILIKE $${paramIndex} OR
      description ILIKE $${paramIndex} OR
      published_response ILIKE $${paramIndex}
)`);
    params.push(`% ${search}% `);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Count total
  const countResult = await db.query(
    `SELECT COUNT(*) FROM ideas WHERE ${whereClause} `,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get published ideas (HIDE all submitter info)
  params.push(parseInt(limit), offset);
  const query = `
SELECT
i.id,
  i.category,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.published_response_ja' : 'NULL'}, i.published_response) as response,
  i.published_at,
  i.created_at,
  d.name as resolved_by_department,
  sl.label_vi as status_label_vi,
  sl.label_ja as status_label_ja,
  sl.color as status_color
    FROM ideas i
    LEFT JOIN departments d ON i.forwarded_to_department_id = d.id
    LEFT JOIN idea_status_labels sl ON i.status:: text = sl.status
    WHERE ${whereClause}
    ORDER BY i.published_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
`;

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// =====================================================
// MEETING SCHEDULING APIs (Đặt phòng họp / 会議室予約)
// =====================================================

/**
 * Schedule meeting for idea discussion
 * POST /api/ideas/:id/schedule-meeting
 * Đặt lịch họp face-to-face với người đưa ý kiến
 * 意見提出者との対面ミーティングを予約
 */
const scheduleMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { room_id, start_time, end_time, title, title_ja, note } = req.body;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  // Verify idea exists
  const ideaResult = await db.query('SELECT * FROM ideas WHERE id = $1', [id]);
  if (ideaResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '意見が見つかりません' : 'Không tìm thấy ý kiến', 404);
  }

  const idea = ideaResult.rows[0];

  // Verify room exists
  const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1 AND is_active = true', [room_id]);
  if (roomResult.rows.length === 0) {
    throw new AppError(lang === 'ja' ? '会議室が見つかりません' : 'Không tìm thấy phòng họp', 404);
  }

  // Check room availability
  const conflictCheck = await db.query(`
    SELECT id FROM room_bookings 
    WHERE room_id = $1 
    AND status IN('pending', 'confirmed', 'in_progress')
AND(
  (start_time <= $2 AND end_time > $2) OR
    (start_time < $3 AND end_time >= $3) OR
      (start_time >= $2 AND end_time <= $3)
    )
`, [room_id, start_time, end_time]);

  if (conflictCheck.rows.length > 0) {
    throw new AppError(
      lang === 'ja' ? 'この時間帯は既に予約されています' : 'Phòng đã được đặt trong khung giờ này',
      409
    );
  }

  // Create room booking
  const meetingTitle = title || (lang === 'ja'
    ? `意見討議: ${idea.title?.substring(0, 50)} `
    : `Thảo luận ý kiến: ${idea.title?.substring(0, 50)} `);

  const bookingQuery = `
    INSERT INTO room_bookings(
  room_id, user_id, department_id,
  title, title_ja, description, purpose,
  start_time, end_time, expected_attendees,
  status, related_idea_id, booking_purpose
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, 2, 'confirmed', $10, 'idea_discussion')
RETURNING *
  `;

  const bookingResult = await db.query(bookingQuery, [
    room_id,
    userId,
    req.user.department_id,
    meetingTitle,
    title_ja || meetingTitle,
    note || `Thảo luận về ý kiến #${idea.id.substring(0, 8)} `,
    'idea_discussion',
    start_time,
    end_time,
    id
  ]);

  const booking = bookingResult.rows[0];

  // Update idea with meeting link
  await db.query(
    `UPDATE ideas SET meeting_booking_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [booking.id, id]
  );

  // Log history
  await db.query(
    `INSERT INTO idea_history(idea_id, action, performed_by, details)
VALUES($1, 'meeting_scheduled', $2, $3)`,
    [id, userId, JSON.stringify({
      booking_id: booking.id,
      room_name: roomResult.rows[0].name,
      start_time,
      end_time
    })]
  );

  // TODO: Send notification to idea submitter

  // Get room info for response
  const room = roomResult.rows[0];

  res.status(201).json({
    success: true,
    message: lang === 'ja' ? '会議を予約しました' : 'Đã đặt lịch họp',
    data: {
      booking,
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        floor: room.floor,
        building: room.building
      },
      idea_id: id
    }
  });
});

/**
 * Get meeting info for an idea
 * GET /api/ideas/:id/meeting
 * Lấy thông tin cuộc họp của ý kiến
 * 意見の会議情報を取得
 */
const getIdeaMeeting = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lang = getLanguageFromRequest(req);

  const query = `
SELECT
rb.*,
  COALESCE(${lang === 'ja' ? 'r.name_ja' : 'NULL'}, r.name) as room_name,
  r.code as room_code,
  r.floor,
  r.building,
  u.full_name as booked_by_name
    FROM room_bookings rb
    JOIN rooms r ON rb.room_id = r.id
    JOIN users u ON rb.user_id = u.id
    WHERE rb.related_idea_id = $1
    ORDER BY rb.start_time DESC
    LIMIT 1
  `;

  const result = await db.query(query, [id]);

  if (result.rows.length === 0) {
    return res.json({
      success: true,
      data: null,
      message: lang === 'ja' ? '予約された会議はありません' : 'Chưa có cuộc họp nào được đặt'
    });
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get status labels (for UI dropdowns)
 * GET /api/ideas/status-labels
 */
const getStatusLabels = asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT * FROM idea_status_labels ORDER BY sort_order'
  );

  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get ideas forwarded to current user's department
 * GET /api/ideas/department-inbox
 * Lấy ý kiến được chuyển đến phòng ban của user
 * ユーザーの部門に転送された意見を取得
 */
const getDepartmentInbox = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const userDepartmentId = req.user.department_id;
  const lang = getLanguageFromRequest(req);
  const offset = (parseInt(page) - 1) * parseInt(limit);

  if (!userDepartmentId && req.user.level > 1) {
    return res.json({
      success: true,
      data: [],
      message: lang === 'ja' ? '部門が設定されていません' : 'Bạn chưa được gán phòng ban'
    });
  }

  const conditions = ['i.forwarded_to_department_id = $1'];
  const params = [userDepartmentId];
  let paramIndex = 2;

  if (status) {
    conditions.push(`i.status = $${paramIndex} `);
    params.push(status);
    paramIndex++;
  } else {
    // Default: show forwarded and need_revision
    conditions.push(`i.status IN('forwarded', 'need_revision')`);
  }

  const whereClause = conditions.join(' AND ');

  // Count
  const countResult = await db.query(
    `SELECT COUNT(*) FROM ideas i WHERE ${whereClause} `,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  // Get ideas (HIDE submitter info as it's Pink Box)
  params.push(parseInt(limit), offset);
  const query = `
SELECT
i.id,
  i.category,
  COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
  COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
  COALESCE(${lang === 'ja' ? 'i.forwarded_note_ja' : 'NULL'}, i.forwarded_note) as coordinator_note,
  i.status,
  i.forwarded_at,
  i.created_at,
  u.full_name as forwarded_by_name,
  sl.label_vi as status_label_vi,
  sl.label_ja as status_label_ja,
  sl.color as status_color
    FROM ideas i
    LEFT JOIN users u ON i.forwarded_by = u.id
    LEFT JOIN idea_status_labels sl ON i.status:: text = sl.status
    WHERE ${whereClause}
    ORDER BY i.forwarded_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
`;

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// NOTE: module.exports moved to end of file after all function definitions

/**
 * Toggle Like on an idea
 * POST /api/ideas/:id/like
 */
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // From auth middleware

  // Check if idea exists
  const ideaCheck = await db.query('SELECT id FROM ideas WHERE id = $1', [id]);
  if (ideaCheck.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  // Check if already liked
  const likeCheck = await db.query(
    'SELECT * FROM idea_likes WHERE idea_id = $1 AND user_id = $2',
    [id, userId]
  );

  let isLiked = false;

  if (likeCheck.rows.length > 0) {
    // Already liked -> UNLIKE (Delete)
    await db.query(
      'DELETE FROM idea_likes WHERE idea_id = $1 AND user_id = $2',
      [id, userId]
    );
    isLiked = false;
  } else {
    // Not liked -> LIKE (Insert)
    await db.query(
      'INSERT INTO idea_likes (idea_id, user_id) VALUES ($1, $2)',
      [id, userId]
    );
    isLiked = true;
  }

  // Get updated count
  // We can rely on the trigger to update the count in 'ideas' table
  // But for immediate response, we can just query the count or select from ideas table
  const countResult = await db.query(
    'SELECT like_count FROM ideas WHERE id = $1',
    [id]
  );

  const likeCount = countResult.rows[0].like_count;

  res.json({
    success: true,
    data: {
      is_liked: isLiked,
      like_count: likeCount
    }
  });
});

/**
 * DELETE /api/ideas/:id
 * Delete an idea (Admin, Manager or idea owner)
 */
const deleteIdea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userLevel = req.user.level || 1;

  console.log(`[DeleteIdea] Request - User: ${userId}, Level: ${userLevel}, IdeaId: ${id}`);
  console.log(`[DeleteIdea] Full user object:`, JSON.stringify(req.user));

  // Check if idea exists and get submitter info
  const ideaResult = await db.query(
    'SELECT id, title, submitter_id, ideabox_type, status FROM ideas WHERE id = $1',
    [id]
  );

  if (ideaResult.rows.length === 0) {
    throw new AppError('Idea not found', 404);
  }

  const idea = ideaResult.rows[0];

  console.log(`[DeleteIdea] Idea submitter_id: ${idea.submitter_id}`);

  // Authorization: Admin (role or level <= 1), Manager (level <= 2), Supervisor (level <= 3), or the submitter
  // Note: Lower level number = higher privilege
  const userRole = req.user.role || '';
  const isAdmin = userRole === 'admin' || userLevel <= 1;
  const isManager = userRole === 'manager' || userLevel <= 2;
  const isSupervisor = userLevel <= 3;
  const isOwner = idea.submitter_id === userId;

  console.log(`[DeleteIdea] Authorization check - role: ${userRole}, level: ${userLevel}, isAdmin: ${isAdmin}, isManager: ${isManager}, isSupervisor: ${isSupervisor}, isOwner: ${isOwner}`);

  if (!isAdmin && !isManager && !isSupervisor && !isOwner) {
    console.log(`[DeleteIdea] REJECTED - User ${userId} (level ${userLevel}) cannot delete idea ${id}`);
    throw new AppError('You are not authorized to delete this idea', 403);
  }

  // Start transaction to delete all related data
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Delete related data in correct order (foreign key constraints)
    // Use try-catch for each table in case some don't exist
    const tablesToDelete = [
      'idea_likes',
      'idea_supports', 
      'idea_responses',
      'idea_status_transitions',
      'idea_history'
    ];

    for (const table of tablesToDelete) {
      try {
        await client.query(`DELETE FROM ${table} WHERE idea_id = $1`, [id]);
      } catch (tableError) {
        // Table might not exist, continue
        console.log(`[DeleteIdea] Table ${table} might not exist, skipping`);
      }
    }
    
    // Finally delete the idea itself
    await client.query('DELETE FROM ideas WHERE id = $1', [id]);

    await client.query('COMMIT');

    console.log(`[DeleteIdea] Idea ${id} deleted by user ${userId} (level ${userLevel})`);

    res.json({
      success: true,
      message: 'Idea deleted successfully',
      message_ja: 'アイデアが正常に削除されました',
      data: {
        id: idea.id,
        title: idea.title,
        ideabox_type: idea.ideabox_type
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[DeleteIdea] Transaction error:', error);
    throw new AppError('Failed to delete idea', 500);
  } finally {
    client.release();
  }
});

// Export all functions at the end
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
  getIdeasKanban,
  getIdeaResponses,
  getIdeaHistory,
  // SRS Escalation & Rating APIs
  escalateToNextLevel,
  submitRating,
  getRating,
  getRatingStats,
  updateDifficultyLevel,
  // My ideas APIs (for App Mobile)
  getMyIdeas,
  getIdeasToReview,
  getIdeasByDepartment,
  // Pink Box Workflow APIs
  forwardToDepartment,
  departmentRespond,
  requestRevision,
  publishResponse,
  getPublishedIdeas,
  getDepartmentInbox,
  // Meeting Scheduling APIs
  scheduleMeeting,
  getIdeaMeeting,
  // Status Labels
  getStatusLabels,
  // Feature: Like Idea
  toggleLike,
  // Delete Idea
  deleteIdea,
};
