/**
 * =============================================================
 * ESCALATION SERVICE
 * =============================================================
 * Handles escalation logic for incidents and ideas according to SRS:
 * - Incident: User -> Team Leader -> Supervisor -> Manager -> Admin
 * - Ideas (White Box): Supervisor -> Manager -> General Manager
 * - Ideas (Pink Box): Admin handles directly
 * 
 * Uses centralized role constants from /constants/roles.js
 */

const db = require('../config/database');
const {
  ROLES,
  LEVELS,
  INCIDENT_ESCALATION_LEVELS,
  IDEA_ESCALATION_LEVELS
} = require('../constants/roles');

/**
 * Escalate an incident to the next level
 */
const escalateIncident = async (incidentId, escalatedBy, reason, isAutomatic = false) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current incident
    const incidentResult = await client.query(
      'SELECT * FROM incidents WHERE id = $1',
      [incidentId]
    );
    
    if (incidentResult.rows.length === 0) {
      throw new Error('Incident not found');
    }
    
    const incident = incidentResult.rows[0];
    const currentLevel = incident.handler_level || 1;
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > 4) {
      throw new Error('Incident is already at maximum escalation level');
    }
    
    // Find next handler based on role and department
    const nextHandler = await findNextHandler(
      client,
      'incident',
      nextLevel,
      incident.department_id
    );
    
    // Update incident
    await client.query(`
      UPDATE incidents SET
        handler_level = $1,
        escalated_to = $2,
        escalated_at = CURRENT_TIMESTAMP,
        escalation_level = escalation_level + 1,
        status = 'escalated',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [nextLevel, nextHandler?.id || null, incidentId]);
    
    // Log escalation history
    await client.query(`
      INSERT INTO escalation_history 
        (reference_type, reference_id, from_level, to_level, from_handler_id, to_handler_id, reason, is_automatic, escalated_by)
      VALUES 
        ('incident', $1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      incidentId,
      currentLevel,
      nextLevel,
      incident.assigned_to,
      nextHandler?.id || null,
      reason,
      isAutomatic,
      escalatedBy
    ]);
    
    // Log incident history
    await client.query(`
      INSERT INTO incident_history (incident_id, action, performed_by, details)
      VALUES ($1, 'escalated', $2, $3)
    `, [
      incidentId,
      escalatedBy,
      JSON.stringify({
        from_level: currentLevel,
        to_level: nextLevel,
        reason,
        is_automatic: isAutomatic,
        new_handler: nextHandler?.full_name || 'Unassigned'
      })
    ]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      previousLevel: currentLevel,
      newLevel: nextLevel,
      newHandler: nextHandler,
      levelName: INCIDENT_ESCALATION_LEVELS[nextLevel]?.name
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Escalate an idea to the next level
 */
const escalateIdea = async (ideaId, escalatedBy, reason, isAutomatic = false) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current idea
    const ideaResult = await client.query(
      'SELECT * FROM ideas WHERE id = $1',
      [ideaId]
    );
    
    if (ideaResult.rows.length === 0) {
      throw new Error('Idea not found');
    }
    
    const idea = ideaResult.rows[0];
    const currentLevel = idea.handler_level || 1;
    const nextLevel = currentLevel + 1;
    
    if (nextLevel > 3) {
      throw new Error('Idea is already at maximum escalation level');
    }
    
    // Find next handler
    const nextHandler = await findNextHandler(
      client,
      'idea',
      nextLevel,
      idea.department_id
    );
    
    // Update idea
    await client.query(`
      UPDATE ideas SET
        handler_level = $1,
        current_handler_id = $2,
        escalated_at = CURRENT_TIMESTAMP,
        escalation_reason = $3,
        status = 'under_review',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [nextLevel, nextHandler?.id || null, reason, ideaId]);
    
    // Log escalation history
    await client.query(`
      INSERT INTO escalation_history 
        (reference_type, reference_id, from_level, to_level, from_handler_id, to_handler_id, reason, is_automatic, escalated_by)
      VALUES 
        ('idea', $1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      ideaId,
      currentLevel,
      nextLevel,
      idea.current_handler_id,
      nextHandler?.id || null,
      reason,
      isAutomatic,
      escalatedBy
    ]);
    
    // Log idea history
    await client.query(`
      INSERT INTO idea_history (idea_id, action, performed_by, details)
      VALUES ($1, 'escalated', $2, $3)
    `, [
      ideaId,
      escalatedBy,
      JSON.stringify({
        from_level: currentLevel,
        to_level: nextLevel,
        reason,
        is_automatic: isAutomatic,
        new_handler: nextHandler?.full_name || 'Unassigned'
      })
    ]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      previousLevel: currentLevel,
      newLevel: nextLevel,
      newHandler: nextHandler,
      levelName: IDEA_ESCALATION_LEVELS[nextLevel]?.name
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Find appropriate handler for the next level
 * Uses centralized role constants
 */
const findNextHandler = async (client, entityType, level, departmentId) => {
  const levels = entityType === 'incident' ? INCIDENT_ESCALATION_LEVELS : IDEA_ESCALATION_LEVELS;
  const levelInfo = levels[level];
  
  if (!levelInfo) return null;
  
  // First try to find someone in the same department
  let query = `
    SELECT id, full_name, email, role, department_id
    FROM users
    WHERE role = $1 AND is_active = true
  `;
  const params = [levelInfo.role];
  
  if (departmentId) {
    query += ` AND department_id = $2 ORDER BY created_at ASC LIMIT 1`;
    params.push(departmentId);
  } else {
    query += ` ORDER BY created_at ASC LIMIT 1`;
  }
  
  let result = await client.query(query, params);
  
  // If not found in department, find any user with that role
  if (result.rows.length === 0 && departmentId) {
    result = await client.query(`
      SELECT id, full_name, email, role, department_id
      FROM users
      WHERE role = $1 AND is_active = true
      ORDER BY created_at ASC LIMIT 1
    `, [levelInfo.role]);
  }
  
  return result.rows[0] || null;
};

/**
 * Assign incident to multiple departments
 */
const assignIncidentToDepartments = async (incidentId, departmentAssignments, assignedBy) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    
    for (const assignment of departmentAssignments) {
      const { department_id, assigned_to, task_description, priority, due_date } = assignment;
      
      // Insert or update assignment
      const result = await client.query(`
        INSERT INTO incident_department_assignments 
          (incident_id, department_id, assigned_by, assigned_to, task_description, priority, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (incident_id, department_id) 
        DO UPDATE SET
          assigned_to = EXCLUDED.assigned_to,
          task_description = EXCLUDED.task_description,
          priority = EXCLUDED.priority,
          due_date = EXCLUDED.due_date,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [incidentId, department_id, assignedBy, assigned_to, task_description, priority || 'medium', due_date]);
      
      results.push(result.rows[0]);
    }
    
    // Log history
    await client.query(`
      INSERT INTO incident_history (incident_id, action, performed_by, details)
      VALUES ($1, 'departments_assigned', $2, $3)
    `, [
      incidentId,
      assignedBy,
      JSON.stringify({ departments: departmentAssignments.map(d => d.department_id) })
    ]);
    
    await client.query('COMMIT');
    
    return results;
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check and auto-escalate based on SLA
 */
const checkSLAAndEscalate = async () => {
  // Get SLA configurations
  const slaConfigs = await db.query(`
    SELECT * FROM sla_configurations WHERE is_active = true
  `);
  
  // Check incidents that need escalation
  const incidents = await db.query(`
    SELECT i.*, 
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - i.created_at))/60 as minutes_open,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(i.first_response_at, CURRENT_TIMESTAMP)))/60 as minutes_since_response
    FROM incidents i
    WHERE i.status NOT IN ('resolved', 'closed', 'cancelled')
    AND i.handler_level < 4
  `);
  
  const escalated = [];
  
  for (const incident of incidents.rows) {
    // Find matching SLA config
    const sla = slaConfigs.rows.find(s => 
      s.entity_type === 'incident' && 
      s.priority === incident.priority &&
      (!s.severity || s.severity === incident.severity)
    );
    
    if (sla && sla.escalation_time && incident.minutes_open > sla.escalation_time) {
      try {
        // Get system user for auto-escalation
        const systemUser = await db.query(`
          SELECT id FROM users WHERE role = 'admin' LIMIT 1
        `);
        
        if (systemUser.rows.length > 0) {
          await escalateIncident(
            incident.id,
            systemUser.rows[0].id,
            `Auto-escalated: SLA escalation time (${sla.escalation_time} minutes) exceeded`,
            true
          );
          escalated.push(incident.id);
        }
      } catch (error) {
        console.error(`Failed to auto-escalate incident ${incident.id}:`, error);
      }
    }
  }
  
  return escalated;
};

module.exports = {
  escalateIncident,
  escalateIdea,
  assignIncidentToDepartments,
  checkSLAAndEscalate,
  // Re-export from constants for backward compatibility
  INCIDENT_LEVELS: INCIDENT_ESCALATION_LEVELS,
  IDEA_LEVELS: IDEA_ESCALATION_LEVELS,
};
