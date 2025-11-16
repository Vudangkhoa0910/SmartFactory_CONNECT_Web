const db = require('../config/database');
const { AppError, asyncHandler } = require('../middlewares/error.middleware');

/**
 * Get all departments
 * GET /api/departments
 */
const getDepartments = asyncHandler(async (req, res) => {
  const { pagination, sort } = req;
  const { parent_id } = req.query;
  
  let whereClause = '';
  const params = [];
  
  if (parent_id) {
    whereClause = 'WHERE d.parent_id = $1';
    params.push(parent_id);
  } else if (parent_id === 'null') {
    whereClause = 'WHERE d.parent_id IS NULL';
  }
  
  // Get total count
  const countQuery = `SELECT COUNT(*) FROM departments d ${whereClause}`;
  const countResult = await db.query(countQuery, params);
  const totalItems = parseInt(countResult.rows[0].count);
  
  // Get departments
  const query = `
    SELECT 
      d.id,
      d.code,
      d.name,
      d.description,
      d.parent_id,
      d.manager_id,
      d.is_active,
      d.created_at,
      p.name as parent_name,
      u.full_name as manager_name,
      u.employee_code as manager_code,
      (SELECT COUNT(*) FROM users WHERE department_id = d.id) as employee_count
    FROM departments d
    LEFT JOIN departments p ON d.parent_id = p.id
    LEFT JOIN users u ON d.manager_id = u.id
    ${whereClause}
    ORDER BY ${sort.sortBy} ${sort.sortOrder}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;
  
  params.push(pagination.limit, pagination.offset);
  
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
 * Get department tree structure
 * GET /api/departments/tree
 */
const getDepartmentTree = asyncHandler(async (req, res) => {
  // Get all departments
  const query = `
    SELECT 
      d.id,
      d.code,
      d.name,
      d.description,
      d.parent_id,
      d.manager_id,
      d.is_active,
      u.full_name as manager_name,
      (SELECT COUNT(*) FROM users WHERE department_id = d.id) as employee_count
    FROM departments d
    LEFT JOIN users u ON d.manager_id = u.id
    WHERE d.is_active = true
    ORDER BY d.name
  `;
  
  const result = await db.query(query);
  const departments = result.rows;
  
  // Build tree structure
  const buildTree = (parentId = null) => {
    return departments
      .filter(dept => dept.parent_id === parentId)
      .map(dept => ({
        ...dept,
        children: buildTree(dept.id)
      }));
  };
  
  const tree = buildTree(null);
  
  res.json({
    success: true,
    data: tree
  });
});

/**
 * Get department by ID
 * GET /api/departments/:id
 */
const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      d.id,
      d.code,
      d.name,
      d.description,
      d.parent_id,
      d.manager_id,
      d.is_active,
      d.created_at,
      d.updated_at,
      p.name as parent_name,
      u.full_name as manager_name,
      u.employee_code as manager_code,
      u.email as manager_email,
      (SELECT COUNT(*) FROM users WHERE department_id = d.id) as employee_count
    FROM departments d
    LEFT JOIN departments p ON d.parent_id = p.id
    LEFT JOIN users u ON d.manager_id = u.id
    WHERE d.id = $1
  `;
  
  const result = await db.query(query, [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Department not found', 404);
  }
  
  const department = result.rows[0];
  
  // Get child departments
  const childrenQuery = `
    SELECT id, code, name
    FROM departments
    WHERE parent_id = $1 AND is_active = true
  `;
  
  const childrenResult = await db.query(childrenQuery, [id]);
  department.children = childrenResult.rows;
  
  res.json({
    success: true,
    data: department
  });
});

/**
 * Create new department
 * POST /api/departments
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { code, name, description, parent_id, manager_id } = req.body;
  
  // Check if code already exists
  const existingDept = await db.query(
    'SELECT id FROM departments WHERE code = $1',
    [code]
  );
  
  if (existingDept.rows.length > 0) {
    throw new AppError('Department code already exists', 409);
  }
  
  // Verify parent department if provided
  if (parent_id) {
    const parent = await db.query(
      'SELECT id FROM departments WHERE id = $1',
      [parent_id]
    );
    
    if (parent.rows.length === 0) {
      throw new AppError('Parent department not found', 404);
    }
  }
  
  // Verify manager if provided
  if (manager_id) {
    const manager = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [manager_id]
    );
    
    if (manager.rows.length === 0) {
      throw new AppError('Manager not found', 404);
    }
  }
  
  const query = `
    INSERT INTO departments (code, name, description, parent_id, manager_id, is_active)
    VALUES ($1, $2, $3, $4, $5, true)
    RETURNING *
  `;
  
  const result = await db.query(query, [
    code,
    name,
    description || null,
    parent_id || null,
    manager_id || null
  ]);
  
  res.status(201).json({
    success: true,
    message: 'Department created successfully',
    data: result.rows[0]
  });
});

/**
 * Update department
 * PUT /api/departments/:id
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, name, description, parent_id, manager_id, is_active } = req.body;
  
  // Check if department exists
  const dept = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
  
  if (dept.rows.length === 0) {
    throw new AppError('Department not found', 404);
  }
  
  // Check if code is already taken by another department
  if (code) {
    const existingDept = await db.query(
      'SELECT id FROM departments WHERE code = $1 AND id != $2',
      [code, id]
    );
    
    if (existingDept.rows.length > 0) {
      throw new AppError('Department code already exists', 409);
    }
  }
  
  // Prevent circular reference in parent_id
  if (parent_id === id) {
    throw new AppError('Department cannot be its own parent', 400);
  }
  
  // Verify parent department if provided
  if (parent_id) {
    const parent = await db.query(
      'SELECT id FROM departments WHERE id = $1',
      [parent_id]
    );
    
    if (parent.rows.length === 0) {
      throw new AppError('Parent department not found', 404);
    }
  }
  
  // Verify manager if provided
  if (manager_id) {
    const manager = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [manager_id]
    );
    
    if (manager.rows.length === 0) {
      throw new AppError('Manager not found', 404);
    }
  }
  
  const query = `
    UPDATE departments
    SET 
      code = COALESCE($1, code),
      name = COALESCE($2, name),
      description = COALESCE($3, description),
      parent_id = COALESCE($4, parent_id),
      manager_id = COALESCE($5, manager_id),
      is_active = COALESCE($6, is_active),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
    RETURNING *
  `;
  
  const result = await db.query(query, [
    code,
    name,
    description,
    parent_id,
    manager_id,
    is_active,
    id
  ]);
  
  res.json({
    success: true,
    message: 'Department updated successfully',
    data: result.rows[0]
  });
});

/**
 * Delete department (soft delete)
 * DELETE /api/departments/:id
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if department exists
  const dept = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
  
  if (dept.rows.length === 0) {
    throw new AppError('Department not found', 404);
  }
  
  // Check if department has employees
  const employees = await db.query(
    'SELECT COUNT(*) FROM users WHERE department_id = $1',
    [id]
  );
  
  if (parseInt(employees.rows[0].count) > 0) {
    throw new AppError('Cannot delete department with employees', 400);
  }
  
  // Check if department has child departments
  const children = await db.query(
    'SELECT COUNT(*) FROM departments WHERE parent_id = $1',
    [id]
  );
  
  if (parseInt(children.rows[0].count) > 0) {
    throw new AppError('Cannot delete department with child departments', 400);
  }
  
  // Soft delete
  await db.query(
    'UPDATE departments SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [id]
  );
  
  res.json({
    success: true,
    message: 'Department deleted successfully'
  });
});

/**
 * Get department employees
 * GET /api/departments/:id/employees
 */
const getDepartmentEmployees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if department exists
  const dept = await db.query('SELECT * FROM departments WHERE id = $1', [id]);
  
  if (dept.rows.length === 0) {
    throw new AppError('Department not found', 404);
  }
  
  const query = `
    SELECT 
      id,
      employee_code,
      email,
      full_name,
      phone,
      role,
      level,
      is_active,
      created_at,
      last_login
    FROM users
    WHERE department_id = $1
    ORDER BY full_name
  `;
  
  const result = await db.query(query, [id]);
  
  res.json({
    success: true,
    data: result.rows
  });
});

module.exports = {
  getDepartments,
  getDepartmentTree,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees
};
