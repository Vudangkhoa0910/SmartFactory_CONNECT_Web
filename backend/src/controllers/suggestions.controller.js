/**
 * Suggestions Controller
 * API endpoints for real-time suggestions (CONNECT feature)
 * 
 * Provides suggestions for:
 * - Incidents: Similar incidents when typing title/description
 * - Ideas: Similar ideas when submitting
 * - Auto-fill form data based on description
 */
const axios = require('axios');
const db = require('../config/database');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

/**
 * Check if RAG service is available
 */
async function isRagAvailable() {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/health`, { timeout: 2000 });
    return response.data?.status === 'healthy';
  } catch (error) {
    console.log('[Suggestions] RAG service not available:', error.message);
    return false;
  }
}

/**
 * Fallback: Search incidents using PostgreSQL full-text search
 */
async function searchIncidentsPostgres(query, limit = 5) {
  try {
    const result = await db.query(`
      SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.priority,
        i.incident_type,
        i.location,
        i.resolution_notes as resolution,
        d.name as department_name,
        d.code as department_code,
        ts_rank(
          setweight(to_tsvector('simple', COALESCE(i.title, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(i.description, '')), 'B'),
          plainto_tsquery('simple', $1)
        ) as relevance
      FROM incidents i
      LEFT JOIN departments d ON i.assigned_department_id = d.id
      WHERE 
        i.status IN ('resolved', 'closed')
        AND (
          i.title ILIKE $2
          OR i.description ILIKE $2
          OR to_tsvector('simple', COALESCE(i.title, '') || ' ' || COALESCE(i.description, '')) 
             @@ plainto_tsquery('simple', $1)
        )
      ORDER BY relevance DESC, i.created_at DESC
      LIMIT $3
    `, [query, `%${query}%`, limit]);

    return result.rows;
  } catch (error) {
    console.error('[Suggestions] Postgres search error:', error.message);
    return [];
  }
}

/**
 * Fallback: Search ideas using PostgreSQL full-text search  
 */
async function searchIdeasPostgres(query, userId, limit = 5) {
  try {
    // Đầu tiên tìm các ý tưởng tương tự
    const result = await db.query(`
      SELECT 
        i.id,
        i.title,
        i.description,
        i.status,
        i.category,
        i.difficulty,
        i.created_at,
        i.whitebox_subtype,
        i.ideabox_type,
        d.name as department_name,
        d.code as department_code,
        u.full_name as submitter_name,
        h.full_name as handler_name,
        COALESCE(i.implementation_notes, i.review_notes, i.published_response) as last_response,
        EXISTS (
          SELECT 1 FROM idea_supports 
          WHERE idea_id = i.id 
          AND user_id = $4
          AND support_type = 'support'
        ) as is_supported,
        ts_rank(
          setweight(to_tsvector('simple', COALESCE(i.title, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(i.description, '')), 'B'),
          plainto_tsquery('simple', $1)
        ) as relevance
      FROM ideas i
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users u ON i.submitter_id = u.id
      LEFT JOIN users h ON i.assigned_to = h.id
      WHERE 
        i.title ILIKE $2
        OR i.description ILIKE $2
        OR to_tsvector('simple', COALESCE(i.title, '') || ' ' || COALESCE(i.description, '')) 
           @@ plainto_tsquery('simple', $1)
      ORDER BY relevance DESC, i.created_at DESC
      LIMIT $3
    `, [query, `%${query}%`, limit, userId]);

    // Tính số lượng ý kiến tương tự cho mỗi kết quả (để hiển thị xN ủng hộ)
    const ideasWithSupport = await Promise.all(result.rows.map(async (idea) => {
      try {
        // Đếm số ý kiến có nội dung tương tự
        const countResult = await db.query(`
          SELECT COUNT(*) as similar_count
          FROM ideas 
          WHERE id != $1
            AND (
              title ILIKE $2
              OR description ILIKE $2
              OR similarity(COALESCE(title, ''), COALESCE($3, '')) > 0.3
              OR similarity(COALESCE(description, ''), COALESCE($4, '')) > 0.3
            )
        `, [idea.id, `%${query}%`, idea.title || '', idea.description || '']);

        return {
          ...idea,
          support_count: 1 + parseInt(countResult.rows[0]?.similar_count || 0)
        };
      } catch (e) {
        // Nếu không có extension pg_trgm, trả về count mặc định
        return { ...idea, support_count: 1 };
      }
    }));

    return ideasWithSupport;
  } catch (error) {
    console.error('[Suggestions] Postgres ideas search error:', error.message);
    return [];
  }
}

/**
 * Get similar incidents - uses RAG if available, falls back to Postgres
 */
exports.getSimilarIncidents = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query || query.trim().length < 3) {
      return res.json({
        success: true,
        data: [],
        message: 'Query too short (min 3 characters)'
      });
    }

    let results = [];
    let source = 'postgres';

    // Try RAG service first
    if (await isRagAvailable()) {
      try {
        const response = await axios.get(`${RAG_SERVICE_URL}/similar`, {
          params: { description: query.trim(), limit: parseInt(limit) },
          timeout: 5000
        });

        if (response.data?.incidents) {
          results = response.data.incidents.map(inc => ({
            id: inc.id,
            title: inc.title || inc.description?.substring(0, 100),
            description: inc.description,
            status: inc.status,
            priority: inc.priority,
            incident_type: inc.incident_type,
            location: inc.location,
            resolution: inc.resolution_notes || inc.resolution,
            department_name: inc.department_name,
            similarity: inc.similarity || inc.score
          }));
          source = 'rag';
        }
      } catch (ragError) {
        console.log('[Suggestions] RAG error, falling back to Postgres:', ragError.message);
      }
    }

    // Fallback to Postgres if RAG didn't return results
    if (results.length === 0) {
      results = await searchIncidentsPostgres(query.trim(), parseInt(limit));
    }

    return res.json({
      success: true,
      data: results,
      source,
      count: results.length
    });

  } catch (error) {
    console.error('[Suggestions] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message
    });
  }
};

/**
 * Get similar ideas - uses RAG if available, falls back to Postgres
 */
exports.getSimilarIdeas = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 3) {
      return res.json({
        success: true,
        data: [],
        message: 'Query too short (min 3 characters)'
      });
    }

    let results = [];
    let source = 'postgres';

    // Try RAG service first (if it supports ideas)
    if (await isRagAvailable()) {
      try {
        const response = await axios.get(`${RAG_SERVICE_URL}/similar-ideas`, {
          params: { query: query.trim(), limit: parseInt(limit) },
          timeout: 5000
        });

        if (response.data?.ideas) {
          results = response.data.ideas;
          source = 'rag';
        }
      } catch (ragError) {
        // RAG may not support ideas search, fall back silently
        console.log('[Suggestions] RAG ideas error:', ragError.message);
      }
    }

    // Fallback to Postgres
    if (results.length === 0) {
      results = await searchIdeasPostgres(query.trim(), userId, parseInt(limit));
    }

    return res.json({
      success: true,
      data: results,
      source,
      count: results.length
    });

  } catch (error) {
    console.error('[Suggestions] Ideas error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get idea suggestions',
      error: error.message
    });
  }
};

/**
 * Get department suggestion for new incident
 */
exports.suggestDepartment = async (req, res) => {
  try {
    const { description, location, incident_type, priority } = req.body;

    if (!description || description.trim().length < 10) {
      return res.json({
        success: true,
        suggestion: null,
        message: 'Description too short (min 10 characters)'
      });
    }

    // Must use RAG for this feature
    if (!await isRagAvailable()) {
      return res.json({
        success: true,
        suggestion: null,
        similar_incidents: [],
        message: 'RAG service not available'
      });
    }

    try {
      const response = await axios.post(`${RAG_SERVICE_URL}/suggest`, {
        description: description.trim(),
        location: location || null,
        incident_type: incident_type || null,
        priority: priority || null
      }, { timeout: 10000 });

      return res.json({
        success: true,
        suggestion: response.data.suggestion,
        similar_incidents: response.data.similar_incidents || [],
        auto_assign: response.data.suggestion?.auto_assign || false,
        message: response.data.message
      });

    } catch (ragError) {
      console.error('[Suggestions] RAG suggest error:', ragError.message);
      return res.json({
        success: true,
        suggestion: null,
        similar_incidents: [],
        message: 'Could not get department suggestion'
      });
    }

  } catch (error) {
    console.error('[Suggestions] Department suggest error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get department suggestion',
      error: error.message
    });
  }
};

/**
 * Auto-fill form fields based on description
 */
exports.autoFillForm = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 10) {
      return res.json({
        success: true,
        suggestions: {},
        message: 'Description too short'
      });
    }

    if (!await isRagAvailable()) {
      return res.json({
        success: true,
        suggestions: {},
        message: 'RAG service not available'
      });
    }

    try {
      const response = await axios.post(`${RAG_SERVICE_URL}/auto-fill`, {
        description: description.trim()
      }, { timeout: 10000 });

      return res.json({
        success: true,
        suggestions: response.data.suggestions || {},
        confidence: response.data.confidence || 0,
        reference_incident_id: response.data.reference_incident_id
      });

    } catch (ragError) {
      return res.json({
        success: true,
        suggestions: {},
        message: 'Could not auto-fill'
      });
    }

  } catch (error) {
    console.error('[Suggestions] Auto-fill error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to auto-fill form',
      error: error.message
    });
  }
};

/**
 * Get RAG service status
 */
exports.getStatus = async (req, res) => {
  try {
    const ragAvailable = await isRagAvailable();

    let ragInfo = null;
    if (ragAvailable) {
      try {
        const response = await axios.get(`${RAG_SERVICE_URL}/health`, { timeout: 2000 });
        ragInfo = response.data;
      } catch (e) { }
    }

    return res.json({
      success: true,
      rag_service: {
        available: ragAvailable,
        url: RAG_SERVICE_URL,
        info: ragInfo
      },
      features: {
        similar_incidents: true,
        similar_ideas: true,
        department_suggestion: ragAvailable,
        auto_fill: ragAvailable
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
