const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

/**
 * Get Dashboard Overview Statistics
 * GET /api/dashboard/overview
 */
const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userLevel = req.user.level;
  const userDepartment = req.user.department_id;

  // Get total counts
  const countsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM incidents WHERE status NOT IN ('closed', 'cancelled')) as active_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status = 'pending') as pending_incidents,
      (SELECT COUNT(*) FROM ideas WHERE status = 'pending') as pending_ideas,
      (SELECT COUNT(*) FROM news WHERE status = 'published' AND publish_at <= NOW()) as active_news,
      (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
  `;
  
  const counts = await db.query(countsQuery, [userId]);

  // Get recent incidents
  const recentIncidentsQuery = `
    SELECT i.*, u.full_name as reporter_name, d.name as department_name
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN departments d ON i.department_id = d.id
    WHERE i.status NOT IN ('closed', 'cancelled')
    ORDER BY i.created_at DESC
    LIMIT 5
  `;
  
  const recentIncidents = await db.query(recentIncidentsQuery);

  // Get recent news
  const recentNewsQuery = `
    SELECT n.*, u.full_name as author_name
    FROM news n
    LEFT JOIN users u ON n.author_id = u.id
    WHERE n.status = 'published' AND n.publish_at <= NOW()
    ORDER BY n.publish_at DESC
    LIMIT 5
  `;
  
  const recentNews = await db.query(recentNewsQuery);

  // Get my tasks (incidents assigned to me)
  const myTasksQuery = `
    SELECT COUNT(*) as count
    FROM incidents
    WHERE assigned_to = $1 AND status IN ('assigned', 'in_progress')
  `;
  
  const myTasks = await db.query(myTasksQuery, [userId]);

  res.json({
    success: true,
    data: {
      counts: counts.rows[0],
      my_tasks: parseInt(myTasks.rows[0].count),
      recent_incidents: recentIncidents.rows,
      recent_news: recentNews.rows
    }
  });
});

/**
 * Get Incident Statistics for Dashboard
 * GET /api/dashboard/incidents/stats
 */
const getIncidentStats = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  // Date range filter
  let dateFilter = '';
  const params = [];
  let paramIndex = 1;
  
  if (start_date && end_date) {
    dateFilter = `WHERE created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(start_date, end_date);
    paramIndex += 2;
  }

  // 1. Incident by Type (Pie Chart)
  const byTypeQuery = `
    SELECT 
      incident_type,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM incidents
    ${dateFilter}
    GROUP BY incident_type
    ORDER BY count DESC
  `;
  
  const byType = await db.query(byTypeQuery, params);

  // 2. Top 10 Locations/Machines with Most Incidents (Bar Chart)
  const topLocationsQuery = `
    SELECT 
      location,
      COUNT(*) as count
    FROM incidents
    ${dateFilter}
    GROUP BY location
    ORDER BY count DESC
    LIMIT 10
  `;
  
  const topLocations = await db.query(topLocationsQuery, params);

  // 3. Average Response Time (Time to assign)
  const avgResponseQuery = `
    SELECT 
      AVG(EXTRACT(EPOCH FROM (
        (SELECT MIN(created_at) FROM incident_history 
         WHERE incident_id = incidents.id AND action = 'assigned')
        - incidents.created_at
      )) / 3600) as avg_response_hours
    FROM incidents
    ${dateFilter}
    WHERE status != 'pending'
  `;
  
  const avgResponse = await db.query(avgResponseQuery, params);

  // 4. Average Resolution Time (Time to resolve)
  const avgResolutionQuery = `
    SELECT 
      AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours
    FROM incidents
    ${dateFilter}
    WHERE resolved_at IS NOT NULL
  `;
  
  const avgResolution = await db.query(avgResolutionQuery, params);

  // 5. KPI by Department (Growth Chart)
  const departmentKPIQuery = `
    SELECT 
      d.name as department_name,
      d.code as department_code,
      COUNT(i.id) as total_incidents,
      COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) as resolved_incidents,
      ROUND(
        COUNT(CASE WHEN i.status = 'resolved' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(i.id), 0), 2
      ) as resolution_rate,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at)) / 3600), 2
      ) as avg_resolution_hours
    FROM departments d
    LEFT JOIN incidents i ON i.department_id = d.id ${dateFilter.replace('WHERE', 'AND')}
    GROUP BY d.id, d.name, d.code
    HAVING COUNT(i.id) > 0
    ORDER BY resolution_rate DESC
  `;
  
  const departmentKPI = await db.query(departmentKPIQuery, params);

  // 6. Incidents by Priority
  const byPriorityQuery = `
    SELECT 
      priority,
      COUNT(*) as count
    FROM incidents
    ${dateFilter}
    GROUP BY priority
    ORDER BY 
      CASE priority
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
  `;
  
  const byPriority = await db.query(byPriorityQuery, params);

  // 7. Incidents by Status
  const byStatusQuery = `
    SELECT 
      status,
      COUNT(*) as count
    FROM incidents
    ${dateFilter}
    GROUP BY status
    ORDER BY count DESC
  `;
  
  const byStatus = await db.query(byStatusQuery, params);

  // 8. Daily Trend (Last 30 days)
  const dailyTrendQuery = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM incidents
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  const dailyTrend = await db.query(dailyTrendQuery);

  res.json({
    success: true,
    data: {
      by_type: byType.rows,
      top_locations: topLocations.rows,
      avg_response_hours: parseFloat(avgResponse.rows[0].avg_response_hours || 0).toFixed(2),
      avg_resolution_hours: parseFloat(avgResolution.rows[0].avg_resolution_hours || 0).toFixed(2),
      department_kpi: departmentKPI.rows,
      by_priority: byPriority.rows,
      by_status: byStatus.rows,
      daily_trend: dailyTrend.rows
    }
  });
});

/**
 * Get Idea Statistics for Dashboard
 * GET /api/dashboard/ideas/stats
 */
const getIdeaStats = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  let dateFilter = '';
  const params = [];
  
  if (start_date && end_date) {
    dateFilter = `WHERE created_at BETWEEN $1 AND $2`;
    params.push(start_date, end_date);
  }

  // 1. Acceptance Rate (Pie Chart)
  const acceptanceRateQuery = `
    SELECT 
      CASE 
        WHEN status IN ('approved', 'implemented') THEN 'accepted'
        WHEN status = 'rejected' THEN 'rejected'
        ELSE 'pending'
      END as result,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM ideas
    ${dateFilter}
    GROUP BY result
  `;
  
  const acceptanceRate = await db.query(acceptanceRateQuery, params);

  // 2. By Category (Pie Chart with Tags)
  const byCategoryQuery = `
    SELECT 
      category,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM ideas
    ${dateFilter}
    GROUP BY category
    ORDER BY count DESC
  `;
  
  const byCategory = await db.query(byCategoryQuery, params);

  // 3. User Satisfaction Rating (Pie Chart)
  const satisfactionQuery = `
    SELECT 
      satisfaction_level,
      count,
      percentage
    FROM (
      SELECT 
        CASE 
          WHEN feasibility_score + impact_score >= 18 THEN 'very_satisfied'
          WHEN feasibility_score + impact_score >= 14 THEN 'satisfied'
          WHEN feasibility_score + impact_score >= 10 THEN 'acceptable'
          ELSE 'unsatisfied'
        END as satisfaction_level,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
      FROM ideas
      WHERE feasibility_score IS NOT NULL AND impact_score IS NOT NULL
      ${dateFilter.replace('WHERE', 'AND')}
      GROUP BY 
        CASE 
          WHEN feasibility_score + impact_score >= 18 THEN 'very_satisfied'
          WHEN feasibility_score + impact_score >= 14 THEN 'satisfied'
          WHEN feasibility_score + impact_score >= 10 THEN 'acceptable'
          ELSE 'unsatisfied'
        END
    ) sub
    ORDER BY 
      CASE satisfaction_level
        WHEN 'very_satisfied' THEN 1
        WHEN 'satisfied' THEN 2
        WHEN 'acceptable' THEN 3
        ELSE 4
      END
  `;
  
  const satisfaction = await db.query(satisfactionQuery, params);

  // 4. Average Processing Time
  const avgProcessingQuery = `
    SELECT 
      AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 86400) as avg_days
    FROM ideas
    ${dateFilter}
    WHERE reviewed_at IS NOT NULL
  `;
  
  const avgProcessing = await db.query(avgProcessingQuery, params);

  // 5. Difficulty Level Distribution
  const difficultyQuery = `
    SELECT 
      difficulty,
      count
    FROM (
      SELECT 
        CASE 
          WHEN feasibility_score >= 8 THEN 'easy'
          WHEN feasibility_score >= 5 THEN 'medium'
          WHEN feasibility_score >= 3 THEN 'hard'
          ELSE 'very_hard'
        END as difficulty,
        COUNT(*) as count
      FROM ideas
      WHERE feasibility_score IS NOT NULL
      ${dateFilter.replace('WHERE', 'AND')}
      GROUP BY 
        CASE 
          WHEN feasibility_score >= 8 THEN 'easy'
          WHEN feasibility_score >= 5 THEN 'medium'
          WHEN feasibility_score >= 3 THEN 'hard'
          ELSE 'very_hard'
        END
    ) sub
    ORDER BY 
      CASE difficulty
        WHEN 'easy' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'hard' THEN 3
        ELSE 4
      END
  `;
  
  const difficulty = await db.query(difficultyQuery, params);

  // 6. By IdeaBox Type
  const byTypeQuery = `
    SELECT 
      ideabox_type,
      COUNT(*) as count
    FROM ideas
    ${dateFilter}
    GROUP BY ideabox_type
  `;
  
  const byType = await db.query(byTypeQuery, params);

  // 7. Top Contributors (White Box only)
  const topContributorsQuery = `
    SELECT 
      u.full_name,
      u.employee_code,
      COUNT(i.id) as idea_count,
      COUNT(CASE WHEN i.status IN ('approved', 'implemented') THEN 1 END) as approved_count
    FROM ideas i
    JOIN users u ON i.submitter_id = u.id
    WHERE i.ideabox_type = 'white' AND i.is_anonymous = false
    ${dateFilter.replace('WHERE', 'AND')}
    GROUP BY u.id, u.full_name, u.employee_code
    ORDER BY idea_count DESC
    LIMIT 10
  `;
  
  const topContributors = await db.query(topContributorsQuery, params);

  res.json({
    success: true,
    data: {
      acceptance_rate: acceptanceRate.rows,
      by_category: byCategory.rows,
      satisfaction: satisfaction.rows,
      avg_processing_days: parseFloat(avgProcessing.rows[0].avg_days || 0).toFixed(2),
      difficulty: difficulty.rows,
      by_type: byType.rows,
      top_contributors: topContributors.rows
    }
  });
});

/**
 * Get comprehensive dashboard data
 * GET /api/dashboard/comprehensive
 */
const getComprehensiveDashboard = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  const userId = req.user.id;

  // Parallel execution for performance
  const [overview, incidentStats, ideaStats] = await Promise.all([
    getOverviewData(userId),
    getIncidentStatsData(start_date, end_date),
    getIdeaStatsData(start_date, end_date)
  ]);

  res.json({
    success: true,
    data: {
      overview,
      incidents: incidentStats,
      ideas: ideaStats
    }
  });
});

// Helper functions
async function getOverviewData(userId) {
  const countsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM incidents WHERE status NOT IN ('closed', 'cancelled')) as active_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status = 'pending') as pending_incidents,
      (SELECT COUNT(*) FROM ideas WHERE status = 'pending') as pending_ideas,
      (SELECT COUNT(*) FROM news WHERE status = 'published') as active_news,
      (SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false) as unread_notifications
  `;
  
  const result = await db.query(countsQuery, [userId]);
  return result.rows[0];
}

async function getIncidentStatsData(start_date, end_date) {
  // Simplified version - full implementation above
  return {};
}

async function getIdeaStatsData(start_date, end_date) {
  // Simplified version - full implementation above
  return {};
}

module.exports = {
  getOverview,
  getIncidentStats,
  getIdeaStats,
  getComprehensiveDashboard
};
