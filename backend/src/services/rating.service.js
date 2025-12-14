/**
 * =============================================================
 * RATING SERVICE
 * =============================================================
 * Handles rating/voting for incidents and ideas
 */

const db = require('../config/database');

/**
 * Submit rating for an incident
 */
const rateIncident = async (incidentId, userId, ratingData) => {
  const {
    overall_rating,
    response_speed,
    solution_quality,
    communication,
    professionalism,
    feedback,
    is_satisfied,
    would_recommend
  } = ratingData;
  
  // Verify incident exists and is resolved
  const incident = await db.query(
    'SELECT * FROM incidents WHERE id = $1',
    [incidentId]
  );
  
  if (incident.rows.length === 0) {
    throw new Error('Incident not found');
  }
  
  if (!['resolved', 'closed'].includes(incident.rows[0].status)) {
    throw new Error('Can only rate resolved or closed incidents');
  }
  
  // Verify user is the reporter
  if (incident.rows[0].reporter_id !== userId) {
    throw new Error('Only the reporter can rate this incident');
  }
  
  // Insert or update rating
  const result = await db.query(`
    INSERT INTO incident_ratings 
      (incident_id, user_id, overall_rating, response_speed, solution_quality, 
       communication, professionalism, feedback, is_satisfied, would_recommend)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (incident_id, user_id) 
    DO UPDATE SET
      overall_rating = EXCLUDED.overall_rating,
      response_speed = EXCLUDED.response_speed,
      solution_quality = EXCLUDED.solution_quality,
      communication = EXCLUDED.communication,
      professionalism = EXCLUDED.professionalism,
      feedback = EXCLUDED.feedback,
      is_satisfied = EXCLUDED.is_satisfied,
      would_recommend = EXCLUDED.would_recommend,
      created_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    incidentId, userId, overall_rating, response_speed, solution_quality,
    communication, professionalism, feedback, is_satisfied, would_recommend
  ]);
  
  // Update incident's rating field with overall rating
  await db.query(`
    UPDATE incidents SET rating = $1, rating_feedback = $2 WHERE id = $3
  `, [overall_rating, feedback, incidentId]);
  
  // Log history
  await db.query(`
    INSERT INTO incident_history (incident_id, action, performed_by, details)
    VALUES ($1, 'rated', $2, $3)
  `, [incidentId, userId, JSON.stringify({ overall_rating, is_satisfied })]);
  
  return result.rows[0];
};

/**
 * Submit rating for an idea
 */
const rateIdea = async (ideaId, userId, ratingData) => {
  const {
    overall_rating,
    response_quality,
    response_time,
    implementation_quality,
    feedback,
    is_satisfied
  } = ratingData;
  
  // Verify idea exists
  const idea = await db.query(
    'SELECT * FROM ideas WHERE id = $1',
    [ideaId]
  );
  
  if (idea.rows.length === 0) {
    throw new Error('Idea not found');
  }
  
  // Verify user is the submitter
  if (idea.rows[0].submitter_id !== userId) {
    throw new Error('Only the submitter can rate this idea');
  }
  
  // Insert or update rating
  const result = await db.query(`
    INSERT INTO idea_ratings 
      (idea_id, user_id, overall_rating, response_quality, response_time, 
       implementation_quality, feedback, is_satisfied)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (idea_id, user_id) 
    DO UPDATE SET
      overall_rating = EXCLUDED.overall_rating,
      response_quality = EXCLUDED.response_quality,
      response_time = EXCLUDED.response_time,
      implementation_quality = EXCLUDED.implementation_quality,
      feedback = EXCLUDED.feedback,
      is_satisfied = EXCLUDED.is_satisfied,
      created_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    ideaId, userId, overall_rating, response_quality, response_time,
    implementation_quality, feedback, is_satisfied
  ]);
  
  // Log history
  await db.query(`
    INSERT INTO idea_history (idea_id, action, performed_by, details)
    VALUES ($1, 'rated', $2, $3)
  `, [ideaId, userId, JSON.stringify({ overall_rating, is_satisfied })]);
  
  return result.rows[0];
};

/**
 * Get rating for an incident
 */
const getIncidentRating = async (incidentId) => {
  const result = await db.query(`
    SELECT 
      ir.*,
      u.full_name as user_name
    FROM incident_ratings ir
    JOIN users u ON ir.user_id = u.id
    WHERE ir.incident_id = $1
  `, [incidentId]);
  
  return result.rows[0] || null;
};

/**
 * Get rating for an idea
 */
const getIdeaRating = async (ideaId) => {
  const result = await db.query(`
    SELECT 
      ir.*,
      u.full_name as user_name
    FROM idea_ratings ir
    JOIN users u ON ir.user_id = u.id
    WHERE ir.idea_id = $1
  `, [ideaId]);
  
  return result.rows[0] || null;
};

/**
 * Get rating statistics for incidents
 */
const getIncidentRatingStats = async (filters = {}) => {
  let query = `
    SELECT 
      COUNT(*) as total_ratings,
      ROUND(AVG(overall_rating)::numeric, 2) as avg_overall,
      ROUND(AVG(response_speed)::numeric, 2) as avg_response_speed,
      ROUND(AVG(solution_quality)::numeric, 2) as avg_solution_quality,
      ROUND(AVG(communication)::numeric, 2) as avg_communication,
      ROUND(AVG(professionalism)::numeric, 2) as avg_professionalism,
      COUNT(*) FILTER (WHERE is_satisfied = true) as satisfied_count,
      COUNT(*) FILTER (WHERE is_satisfied = false) as unsatisfied_count,
      COUNT(*) FILTER (WHERE would_recommend = true) as would_recommend_count
    FROM incident_ratings ir
    JOIN incidents i ON ir.incident_id = i.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (filters.department_id) {
    query += ` AND i.department_id = $${paramIndex++}`;
    params.push(filters.department_id);
  }
  
  if (filters.start_date) {
    query += ` AND ir.created_at >= $${paramIndex++}`;
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    query += ` AND ir.created_at <= $${paramIndex++}`;
    params.push(filters.end_date);
  }
  
  const result = await db.query(query, params);
  return result.rows[0];
};

/**
 * Get rating statistics for ideas
 */
const getIdeaRatingStats = async (filters = {}) => {
  let query = `
    SELECT 
      COUNT(*) as total_ratings,
      ROUND(AVG(overall_rating)::numeric, 2) as avg_overall,
      ROUND(AVG(response_quality)::numeric, 2) as avg_response_quality,
      ROUND(AVG(response_time)::numeric, 2) as avg_response_time,
      ROUND(AVG(implementation_quality)::numeric, 2) as avg_implementation_quality,
      COUNT(*) FILTER (WHERE is_satisfied = true) as satisfied_count,
      COUNT(*) FILTER (WHERE is_satisfied = false) as unsatisfied_count
    FROM idea_ratings ir
    JOIN ideas i ON ir.idea_id = i.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;
  
  if (filters.department_id) {
    query += ` AND i.department_id = $${paramIndex++}`;
    params.push(filters.department_id);
  }
  
  if (filters.start_date) {
    query += ` AND ir.created_at >= $${paramIndex++}`;
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    query += ` AND ir.created_at <= $${paramIndex++}`;
    params.push(filters.end_date);
  }
  
  const result = await db.query(query, params);
  return result.rows[0];
};

module.exports = {
  rateIncident,
  rateIdea,
  getIncidentRating,
  getIdeaRating,
  getIncidentRatingStats,
  getIdeaRatingStats,
};
