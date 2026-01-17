const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const { getLanguageFromRequest } = require('../utils/i18n.helper');
const { uploadFilesToGridFS, updateFilesRelatedId } = require('../utils/media-upload.helper');

/**
 * Create new news article
 * POST /api/news
 */
const createNews = asyncHandler(async (req, res) => {
  const {
    category,
    title,
    title_ja,
    content,
    content_ja,
    excerpt,
    excerpt_ja,
    target_audience,
    target_departments,
    target_users,
    is_priority,
    publish_at
  } = req.body;

  const author_id = req.user.id;

  // Upload files to MongoDB GridFS
  let attachments = [];
  if (req.files && req.files.length > 0) {
    attachments = await uploadFilesToGridFS(req.files, {
      type: 'news',
      relatedType: 'news',
      uploadedBy: author_id,
    });
  }

  // Determine status based on publish_at or request body
  let status = req.body.status || 'draft';
  let finalPublishAt = publish_at;

  if (publish_at) {
    const publishDate = new Date(publish_at);
    // If publish date is now or in the past, set as published
    if (publishDate <= new Date(Date.now() + 60000)) { // Add 1 min buffer
      status = 'published';
    } else {
      status = 'draft'; // Future date must be draft
    }
  } else if (status === 'published') {
    // If explicitly set to published but no date, set publish_at to now
    finalPublishAt = new Date().toISOString();
  }

  const query = `
    INSERT INTO news (
      category,
      title,
      title_ja,
      content,
      content_ja,
      excerpt,
      excerpt_ja,
      author_id,
      target_audience,
      target_departments,
      target_users,
      is_priority,
      publish_at,
      attachments,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;

  const values = [
    category,
    title,
    title_ja || null,
    content,
    content_ja || null,
    excerpt || null,
    excerpt_ja || null,
    author_id,
    target_audience || 'all',
    target_departments ? JSON.stringify(target_departments) : null,
    target_users ? JSON.stringify(target_users) : null,
    is_priority || false,
    finalPublishAt || null,
    JSON.stringify(attachments),
    status
  ];

  const result = await db.query(query, values);
  const news = result.rows[0];

  // Update files with news ID (for linking)
  if (attachments.length > 0) {
    const fileIds = attachments.map(a => a.file_id);
    setImmediate(() => {
      updateFilesRelatedId(fileIds, news.id, 'news');
    });
  }

  // Send response first
  res.status(201).json({
    success: true,
    message: 'News created successfully',
    data: news
  });

  // Broadcast news_created for real-time updates
  const io = req.app.get('io');
  if (io && io.broadcastNews) {
    io.broadcastNews('news_created', {
      id: news.id,
      title: news.title,
      category: news.category,
      status: news.status,
      created_at: news.created_at
    });
  }

  // If published immediately, send FCM push notifications
  if (status === 'published') {
    const pushNotificationService = req.app.get('pushNotificationService');
    if (pushNotificationService) {
      setImmediate(async () => {
        try {
          await pushNotificationService.sendNewsPublishedNotification(
            news,
            target_audience,
            target_departments,
            target_users
          );
        } catch (err) {
          console.error('[News] Error sending push notification:', err.message);
        }
      });
    }
  }
});

/**
 * Get all news with filters
 * GET /api/news
 */
const getNews = asyncHandler(async (req, res) => {
  const { pagination, sort, filters } = req;
  const userId = req.user.id;
  const userRole = req.user.role;
  const userLevel = req.user.level;
  const userDepartmentId = req.user.department_id;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // 1. Status Filter
  if (filters.status) {
    if (filters.status !== 'published') {
      // Only Admin/Manager/Supervisor (level <= 3) can see non-published
      if (userLevel > 3) {
        conditions.push(`n.status = 'published'`);
      } else {
        conditions.push(`n.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }
    } else {
      conditions.push(`n.status = 'published'`);
    }
  } else {
    // Default to published
    conditions.push(`n.status = 'published'`);
  }

  // 2. Targeting Filter
  // Admin (1) and Factory Manager (2) see ALL news
  if (userLevel > 2) {
    // Regular users see:
    // - target_audience = 'all'
    // - target_audience = 'departments' AND their department is in target_departments
    // - target_audience = 'users' AND they are in target_users
    conditions.push(`(
        n.target_audience = 'all' OR
        (n.target_audience = 'departments' AND n.target_departments IS NOT NULL AND 
         n.target_departments::jsonb @> $${paramIndex}::jsonb) OR
        (n.target_audience = 'users' AND n.target_users IS NOT NULL AND 
         n.target_users::jsonb @> $${paramIndex + 1}::jsonb)
      )`);
    // If user has no department, pass a dummy value to avoid matching empty array
    params.push(
      JSON.stringify(userDepartmentId ? [userDepartmentId] : ["__no_dept__"]),
      JSON.stringify([userId])
    );
    paramIndex += 2;
  }

  // 3. Publish Date Check
  // If status is 'published', check date.
  conditions.push(`(n.status != 'published' OR n.publish_at IS NULL OR n.publish_at <= CURRENT_TIMESTAMP)`);

  // Apply filters
  if (filters.category) {
    conditions.push(`n.category = $${paramIndex}`);
    params.push(filters.category);
    paramIndex++;
  }

  if (filters.is_priority !== undefined) {
    conditions.push(`n.is_priority = $${paramIndex}`);
    params.push(filters.is_priority === 'true');
    paramIndex++;
  }

  if (filters.date_from) {
    conditions.push(`n.created_at >= $${paramIndex}`);
    params.push(filters.date_from);
    paramIndex++;
  }

  if (filters.date_to) {
    conditions.push(`n.created_at <= $${paramIndex}`);
    params.push(filters.date_to);
    paramIndex++;
  }

  if (filters.search) {
    conditions.push(`(
      n.title ILIKE $${paramIndex} OR 
      n.title_ja ILIKE $${paramIndex} OR
      n.content ILIKE $${paramIndex} OR
      n.content_ja ILIKE $${paramIndex} OR
      n.excerpt ILIKE $${paramIndex}
      OR n.excerpt_ja ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM news n ${whereClause}`;
  console.log('News Query Conditions:', conditions);
  console.log('News Query Params:', params);
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);

  // Get news with pagination - multilingual support
  const lang = getLanguageFromRequest(req);
  const query = `
    SELECT 
      n.id,
      n.category,
      COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
      COALESCE(${lang === 'ja' ? 'n.excerpt_ja' : 'NULL'}, n.excerpt) as excerpt,
      n.status,
      n.is_priority,
      n.created_at,
      n.publish_at,
      n.attachments,
      u.full_name as author_name,
      u.employee_code as author_code,
      (SELECT COUNT(*) FROM news_views WHERE news_id = n.id) as view_count,
      EXISTS(SELECT 1 FROM news_views WHERE news_id = n.id AND user_id = $${paramIndex}) as is_viewed,
      EXISTS(SELECT 1 FROM news_read_receipts WHERE news_id = n.id AND user_id = $${paramIndex}) as is_read
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    ${whereClause}
    ORDER BY n.is_priority DESC, ${sort.sortBy} ${sort.sortOrder}
    LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}
  `;

  params.push(userId, pagination.limit, pagination.offset);

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
 * Get news by ID
 * GET /api/news/:id
 */
const getNewsById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const lang = getLanguageFromRequest(req);

  const query = `
    SELECT 
      n.id,
      n.category,
      COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
      COALESCE(${lang === 'ja' ? 'n.content_ja' : 'NULL'}, n.content) as content,
      COALESCE(${lang === 'ja' ? 'n.excerpt_ja' : 'NULL'}, n.excerpt) as excerpt,
      n.title as title_vi,
      n.title_ja,
      n.content as content_vi,
      n.content_ja,
      n.excerpt as excerpt_vi,
      n.excerpt_ja,
      n.target_audience,
      n.target_departments,
      n.is_priority,
      n.publish_at,
      n.status,
      n.attachments,
      n.created_at,
      n.updated_at,
      n.author_id,
      u.full_name as author_name,
      u.employee_code as author_code,
      u.email as author_email,
      (SELECT COUNT(*) FROM news_views WHERE news_id = n.id) as view_count,
      (SELECT COUNT(*) FROM news_read_receipts WHERE news_id = n.id) as read_count
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.id = $1
  `;

  const result = await db.query(query, [id]);

  if (result.rows.length === 0) {
    throw new AppError('News not found', 404);
  }

  const news = result.rows[0];

  // Record view
  await db.query(
    `INSERT INTO news_views (news_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (news_id, user_id) DO UPDATE
     SET viewed_at = CURRENT_TIMESTAMP`,
    [id, userId]
  );

  res.json({
    success: true,
    data: news
  });
});

/**
 * Update news
 * PUT /api/news/:id
 */
const updateNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    category,
    title,
    title_ja,
    content,
    content_ja,
    excerpt,
    excerpt_ja,
    target_audience,
    target_departments,
    is_priority,
    publish_at,
    status
  } = req.body;

  const userId = req.user.id;

  // Check if news exists
  const news = await db.query('SELECT * FROM news WHERE id = $1', [id]);

  if (news.rows.length === 0) {
    throw new AppError('News not found', 404);
  }

  // Only author or admin can update
  if (news.rows[0].author_id !== userId && req.user.level > 1) {
    throw new AppError('You do not have permission to update this news', 403);
  }

  // Handle new file attachments
  let attachments = news.rows[0].attachments || [];
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map(file => ({
      filename: file.filename,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size,
      path: file.path
    }));
    attachments = [...attachments, ...newAttachments];
  }

  const query = `
    UPDATE news
    SET 
      category = COALESCE($1, category),
      title = COALESCE($2, title),
      title_ja = COALESCE($3, title_ja),
      content = COALESCE($4, content),
      content_ja = COALESCE($5, content_ja),
      excerpt = COALESCE($6, excerpt),
      excerpt_ja = COALESCE($7, excerpt_ja),
      target_audience = COALESCE($8, target_audience),
      target_departments = COALESCE($9, target_departments),
      is_priority = COALESCE($10, is_priority),
      publish_at = COALESCE($11, publish_at),
      status = COALESCE($12, status),
      attachments = $13,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $14
    RETURNING *
  `;

  const result = await db.query(query, [
    category,
    title,
    title_ja,
    content,
    content_ja,
    excerpt,
    excerpt_ja,
    target_audience,
    target_departments ? JSON.stringify(target_departments) : null,
    is_priority,
    publish_at,
    status,
    JSON.stringify(attachments),
    id
  ]);

  // TODO: If newly published, send notifications

  res.json({
    success: true,
    message: 'News updated successfully',
    data: result.rows[0]
  });

  // Broadcast news_updated for real-time updates
  const io = req.app.get('io');
  if (io && io.broadcastNews) {
    io.broadcastNews('news_updated', {
      id: result.rows[0].id,
      title: result.rows[0].title,
      status: result.rows[0].status
    });
  }
});

/**
 * Publish news
 * POST /api/news/:id/publish
 */
const publishNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { publish_at } = req.body;

  // Check if news exists
  const news = await db.query('SELECT * FROM news WHERE id = $1', [id]);

  if (news.rows.length === 0) {
    throw new AppError('News not found', 404);
  }

  const query = `
    UPDATE news
    SET 
      status = 'published',
      publish_at = COALESCE($1, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [publish_at, id]);
  const publishedNews = result.rows[0];

  // Send response first
  res.json({
    success: true,
    message: 'News published successfully',
    data: publishedNews
  });

  // Broadcast news_published for real-time updates
  const io = req.app.get('io');
  if (io && io.broadcastNews) {
    io.broadcastNews('news_published', {
      id: publishedNews.id,
      title: publishedNews.title,
      status: publishedNews.status
    });
  }

  // Send FCM push notifications to target audience
  const pushNotificationService = req.app.get('pushNotificationService');
  if (pushNotificationService) {
    setImmediate(async () => {
      try {
        await pushNotificationService.sendNewsPublishedNotification(
          publishedNews,
          publishedNews.target_audience,
          publishedNews.target_departments
        );
      } catch (err) {
        console.error('[News] Error sending push notification:', err.message);
      }
    });
  }
});

/**
 * Delete news
 * DELETE /api/news/:id
 */
const deleteNews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if news exists
  const news = await db.query('SELECT * FROM news WHERE id = $1', [id]);

  if (news.rows.length === 0) {
    throw new AppError('News not found', 404);
  }

  // Only author or admin can delete
  if (news.rows[0].author_id !== userId && req.user.level > 1) {
    throw new AppError('You do not have permission to delete this news', 403);
  }

  // Soft delete
  await db.query(
    'UPDATE news SET status = \'deleted\', updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );

  res.json({
    success: true,
    message: 'News deleted successfully'
  });

  // Broadcast news_deleted for real-time updates
  const io = req.app.get('io');
  if (io && io.broadcastNews) {
    io.broadcastNews('news_deleted', { id });
  }
});

/**
 * Mark news as read
 * POST /api/news/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if news exists
  const news = await db.query('SELECT * FROM news WHERE id = $1', [id]);

  if (news.rows.length === 0) {
    throw new AppError('News not found', 404);
  }

  // Mark as read
  await db.query(
    `INSERT INTO news_read_receipts (news_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (news_id, user_id) DO UPDATE
     SET read_at = CURRENT_TIMESTAMP`,
    [id, userId]
  );

  res.json({
    success: true,
    message: 'News marked as read'
  });
});

/**
 * Get news statistics
 * GET /api/news/stats
 */
const getNewsStats = asyncHandler(async (req, res) => {
  const { date_from, date_to } = req.query;

  const conditions = ['status = \'published\''];
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

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Overall stats
  const statsQuery = `
    SELECT 
      COUNT(*) as total_news,
      COUNT(CASE WHEN is_priority = true THEN 1 END) as priority_news,
      AVG((SELECT COUNT(*) FROM news_views WHERE news_id = news.id)) as avg_views,
      AVG((SELECT COUNT(*) FROM news_read_receipts WHERE news_id = news.id)) as avg_reads
    FROM news
    ${whereClause}
  `;

  const statsResult = await db.query(statsQuery, params);

  // By category
  const byCategoryQuery = `
    SELECT 
      category,
      COUNT(*) as count
    FROM news
    ${whereClause}
    GROUP BY category
  `;

  const byCategoryResult = await db.query(byCategoryQuery, params);

  // Top viewed
  const topViewedQuery = `
    SELECT 
      n.id,
      n.title,
      n.category,
      n.created_at,
      COUNT(v.id) as view_count
    FROM news n
    LEFT JOIN news_views v ON n.id = v.news_id
    ${whereClause}
    GROUP BY n.id, n.title, n.category, n.created_at
    ORDER BY view_count DESC
    LIMIT 10
  `;

  const topViewedResult = await db.query(topViewedQuery, params);

  res.json({
    success: true,
    data: {
      overall: statsResult.rows[0],
      by_category: byCategoryResult.rows,
      top_viewed: topViewedResult.rows
    }
  });
});

/**
 * Get unread news count
 * GET /api/news/unread-count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userLevel = req.user.level;
  const userDepartmentId = req.user.department_id;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Base conditions
  conditions.push(`n.status = 'published'`);
  conditions.push(`(n.publish_at IS NULL OR n.publish_at <= CURRENT_TIMESTAMP)`);

  // Targeting filter (same logic as getNews)
  if (userLevel > 2) {
    conditions.push(`(
        n.target_audience = 'all' OR
        (n.target_audience = 'departments' AND n.target_departments IS NOT NULL AND 
         n.target_departments::jsonb @> $${paramIndex}::jsonb) OR
        (n.target_audience = 'users' AND n.target_users IS NOT NULL AND 
         n.target_users::jsonb @> $${paramIndex + 1}::jsonb)
      )`);
    params.push(
      JSON.stringify(userDepartmentId ? [userDepartmentId] : ["__no_dept__"]),
      JSON.stringify([userId])
    );
    paramIndex += 2;
  }

  // Not read by current user
  conditions.push(`NOT EXISTS (
      SELECT 1 FROM news_read_receipts 
      WHERE news_id = n.id AND user_id = $${paramIndex}
    )`);
  params.push(userId);

  const query = `
    SELECT COUNT(*) as unread_count
    FROM news n
    WHERE ${conditions.join(' AND ')}
  `;

  const result = await db.query(query, params);

  res.json({
    success: true,
    data: {
      unread_count: parseInt(result.rows[0].unread_count)
    }
  });
});

module.exports = {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  publishNews,
  deleteNews,
  markAsRead,
  getNewsStats,
  getUnreadCount
};
