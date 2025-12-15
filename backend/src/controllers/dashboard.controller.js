const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');
const { getLanguageFromRequest } = require('../utils/i18n.helper');

/**
 * Get Dashboard Overview Statistics
 * GET /api/dashboard/overview
 */
const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userLevel = req.user.level;
  const userDepartment = req.user.department_id;
  const lang = getLanguageFromRequest(req);

  // Get total counts
  const countsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM incidents WHERE status NOT IN ('closed', 'cancelled')) as active_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status = 'pending') as pending_incidents,
      (SELECT COUNT(*) FROM ideas WHERE status = 'pending') as pending_ideas,
      (SELECT COUNT(*) FROM news WHERE status = 'published' AND publish_at <= NOW()) as active_news,
      (SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false) as unread_notifications
  `;
  
  const counts = await db.query(countsQuery, [userId]);

  // Get recent incidents
  const recentIncidentsQuery = `
    SELECT 
      i.*,
      COALESCE(${lang === 'ja' ? 'i.title_ja' : 'NULL'}, i.title) as title,
      COALESCE(${lang === 'ja' ? 'i.description_ja' : 'NULL'}, i.description) as description,
      u.full_name as reporter_name,
      d.name as department_name
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
    SELECT 
      n.*,
      COALESCE(${lang === 'ja' ? 'n.title_ja' : 'NULL'}, n.title) as title,
      COALESCE(${lang === 'ja' ? 'n.excerpt_ja' : 'NULL'}, n.excerpt) as excerpt,
      u.full_name as author_name
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

/**
 * Get dashboard summary
 * GET /api/dashboard/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  // Note: idea_status enum values: pending, under_review, approved, rejected, implemented, on_hold
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM incidents) as total_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status IN ('pending', 'assigned', 'in_progress', 'escalated')) as pending_incidents,
      (SELECT COUNT(*) FROM incidents WHERE status IN ('resolved', 'closed')) as resolved_incidents,
      (SELECT COUNT(*) FROM ideas) as total_ideas,
      (SELECT COUNT(*) FROM ideas WHERE status IN ('pending', 'under_review')) as pending_ideas,
      (SELECT COUNT(*) FROM ideas WHERE status = 'implemented') as implemented_ideas,
      (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
      (SELECT COUNT(*) FROM departments WHERE is_active = true) as departments_count
  `;
  
  const result = await db.query(query);
  
  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get incident trend data for charts
 * GET /api/dashboard/incident-trend
 */
const getIncidentTrend = asyncHandler(async (req, res) => {
  const { period = 'year' } = req.query;
  
  let months = 12;
  if (period === 'half') months = 6;
  if (period === 'month') months = 1;
  
  // Generate month labels
  const categories = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    if (period === 'month') {
      // Daily for last month
      for (let d = 1; d <= 30; d++) {
        categories.push(`${d}`);
      }
      break;
    } else {
      categories.push(`T${date.getMonth() + 1}`);
    }
  }
  
  // Get monthly data
  const query = `
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW() - interval '${months - 1} months'),
        date_trunc('month', NOW()),
        '1 month'
      )::date as month
    )
    SELECT 
      to_char(m.month, 'YYYY-MM') as month,
      COALESCE(reported.count, 0) as reported,
      COALESCE(resolved.count, 0) as resolved
    FROM months m
    LEFT JOIN (
      SELECT date_trunc('month', created_at)::date as month, COUNT(*) as count
      FROM incidents
      WHERE created_at >= NOW() - interval '${months} months'
      GROUP BY date_trunc('month', created_at)
    ) reported ON m.month = reported.month
    LEFT JOIN (
      SELECT date_trunc('month', resolved_at)::date as month, COUNT(*) as count
      FROM incidents
      WHERE resolved_at >= NOW() - interval '${months} months' AND status IN ('resolved', 'closed')
      GROUP BY date_trunc('month', resolved_at)
    ) resolved ON m.month = resolved.month
    ORDER BY m.month
  `;
  
  const result = await db.query(query);
  
  const reported = result.rows.map(r => parseInt(r.reported) || 0);
  const resolved = result.rows.map(r => parseInt(r.resolved) || 0);
  
  res.json({
    success: true,
    data: {
      categories: categories.slice(0, result.rows.length),
      reported,
      resolved
    }
  });
});

/**
 * Get processing time by priority
 * GET /api/dashboard/processing-time
 */
const getProcessingTime = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      priority,
      ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as avg_hours
    FROM incidents
    WHERE resolved_at IS NOT NULL AND status IN ('resolved', 'closed')
    GROUP BY priority
    ORDER BY 
      CASE priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END
  `;
  
  const result = await db.query(query);
  
  // Map to expected format with defaults
  const priorityMap = { critical: 0, high: 0, medium: 0, low: 0 };
  result.rows.forEach(row => {
    priorityMap[row.priority] = parseFloat(row.avg_hours) || 0;
  });
  
  res.json({
    success: true,
    data: {
      categories: ['Nghiêm trọng', 'Cao', 'Trung bình', 'Thấp'],
      avgHours: [priorityMap.critical, priorityMap.high, priorityMap.medium, priorityMap.low]
    }
  });
});

/**
 * Get department KPI data
 * GET /api/dashboard/department-kpi
 */
const getDepartmentKPI = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  
  const query = `
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', NOW() - interval '${months - 1} months'),
        date_trunc('month', NOW()),
        '1 month'
      )::date as month
    )
    SELECT 
      to_char(m.month, 'YYYY-MM') as month,
      CASE 
        WHEN COALESCE(total.count, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(resolved.count, 0)::numeric / COALESCE(total.count, 1)) * 100, 1)
      END as kpi_percentage
    FROM months m
    LEFT JOIN (
      SELECT date_trunc('month', created_at)::date as month, COUNT(*) as count
      FROM incidents
      WHERE created_at >= NOW() - interval '${months} months'
      GROUP BY date_trunc('month', created_at)
    ) total ON m.month = total.month
    LEFT JOIN (
      SELECT date_trunc('month', resolved_at)::date as month, COUNT(*) as count
      FROM incidents
      WHERE resolved_at >= NOW() - interval '${months} months' AND status IN ('resolved', 'closed')
      GROUP BY date_trunc('month', resolved_at)
    ) resolved ON m.month = resolved.month
    ORDER BY m.month
  `;
  
  const result = await db.query(query);
  
  const categories = result.rows.map(r => {
    const [year, month] = r.month.split('-');
    return `Tháng ${parseInt(month)}`;
  });
  
  const kpiPercentages = result.rows.map(r => parseFloat(r.kpi_percentage) || 0);
  
  res.json({
    success: true,
    data: {
      categories,
      kpiPercentages
    }
  });
});

/**
 * Get top machines with errors
 * GET /api/dashboard/top-machines
 */
const getTopMachines = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  const query = `
    SELECT 
      machine_code,
      COALESCE(machine_name, machine_code) as machine_name,
      COUNT(*) as error_count,
      d.name as department
    FROM incidents i
    LEFT JOIN departments d ON i.department_id = d.id
    WHERE machine_code IS NOT NULL AND machine_code != ''
    GROUP BY machine_code, machine_name, d.name
    ORDER BY error_count DESC
    LIMIT $1
  `;
  
  const result = await db.query(query, [parseInt(limit)]);
  
  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get priority distribution
 * GET /api/dashboard/priority-distribution
 */
const getPriorityDistribution = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      priority,
      COUNT(*) as count
    FROM incidents
    GROUP BY priority
  `;
  
  const result = await db.query(query);
  
  const distribution = { critical: 0, high: 0, medium: 0, low: 0 };
  result.rows.forEach(row => {
    distribution[row.priority] = parseInt(row.count) || 0;
  });
  
  res.json({
    success: true,
    data: distribution
  });
});

/**
 * Get department statistics
 * GET /api/dashboard/department-stats
 */
const getDepartmentStats = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      d.id as department_id,
      d.name as department_name,
      COALESCE(total.count, 0) as total_incidents,
      COALESCE(resolved.count, 0) as resolved_incidents,
      COALESCE(avg_time.avg_hours, 0) as avg_resolution_time_hours,
      CASE 
        WHEN COALESCE(total.count, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(resolved.count, 0)::numeric / COALESCE(total.count, 1)) * 100, 1)
      END as kpi_percentage
    FROM departments d
    LEFT JOIN (
      SELECT department_id, COUNT(*) as count
      FROM incidents
      GROUP BY department_id
    ) total ON d.id = total.department_id
    LEFT JOIN (
      SELECT department_id, COUNT(*) as count
      FROM incidents
      WHERE status IN ('resolved', 'closed')
      GROUP BY department_id
    ) resolved ON d.id = resolved.department_id
    LEFT JOIN (
      SELECT department_id, 
        ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)::numeric, 1) as avg_hours
      FROM incidents
      WHERE resolved_at IS NOT NULL
      GROUP BY department_id
    ) avg_time ON d.id = avg_time.department_id
    WHERE d.is_active = true
    ORDER BY total_incidents DESC
  `;
  
  const result = await db.query(query);
  
  res.json({
    success: true,
    data: result.rows
  });
});

/**
 * Get realtime stats
 * GET /api/dashboard/realtime
 */
const getRealTimeStats = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM incidents WHERE priority = 'critical' AND status NOT IN ('resolved', 'closed')) as pending_critical,
      (SELECT COUNT(*) FROM incidents WHERE status = 'in_progress') as processing_now,
      (SELECT COUNT(*) FROM incidents WHERE DATE(resolved_at) = CURRENT_DATE) as resolved_today,
      (SELECT COUNT(*) FROM ideas WHERE DATE(created_at) = CURRENT_DATE) as new_ideas_today
  `;
  
  const result = await db.query(query);
  
  res.json({
    success: true,
    data: result.rows[0]
  });
});

/**
 * Get idea difficulty distribution
 * GET /api/dashboard/idea-difficulty
 */
const getIdeaDifficulty = asyncHandler(async (req, res) => {
  const query = `
    SELECT 
      COALESCE(difficulty_level, 'B') as difficulty_level,
      COUNT(*) as count
    FROM ideas
    GROUP BY difficulty_level
    ORDER BY 
      CASE difficulty_level 
        WHEN 'A' THEN 1 
        WHEN 'B' THEN 2 
        WHEN 'C' THEN 3 
        WHEN 'D' THEN 4 
      END
  `;
  
  const result = await db.query(query);
  
  const difficultyMap = { A: 0, B: 0, C: 0, D: 0 };
  result.rows.forEach(row => {
    if (row.difficulty_level) {
      difficultyMap[row.difficulty_level] = parseInt(row.count) || 0;
    }
  });
  
  res.json({
    success: true,
    data: {
      categories: ['Dễ', 'Trung bình', 'Khó', 'Rất khó'],
      counts: [difficultyMap.A, difficultyMap.B, difficultyMap.C, difficultyMap.D]
    }
  });
});

/**
 * Get idea status distribution
 * GET /api/dashboard/idea-status
 */
const getIdeaStatus = asyncHandler(async (req, res) => {
  const query = `
    SELECT status, COUNT(*) as count
    FROM ideas
    GROUP BY status
  `;
  
  const result = await db.query(query);
  
  // Note: idea_status enum values: pending, under_review, approved, rejected, implemented, on_hold
  const statusMap = { 
    pending: 0, under_review: 0, approved: 0, 
    rejected: 0, implemented: 0, on_hold: 0 
  };
  result.rows.forEach(row => {
    if (statusMap.hasOwnProperty(row.status)) {
      statusMap[row.status] = parseInt(row.count) || 0;
    }
  });
  
  res.json({
    success: true,
    data: statusMap
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
      (SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false) as unread_notifications
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
  getComprehensiveDashboard,
  // New APIs for frontend charts
  getSummary,
  getIncidentTrend,
  getProcessingTime,
  getDepartmentKPI,
  getTopMachines,
  getPriorityDistribution,
  getDepartmentStats,
  getRealTimeStats,
  getIdeaDifficulty,
  getIdeaStatus
};
