-- SmartFactory CONNECT - Role System Update
-- Add comprehensive role system with demo users

-- Update users table to ensure all columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- Insert demo departments if not exist
INSERT INTO departments (code, name, description) VALUES
('PROD', 'Production', 'Bộ phận sản xuất'),
('MA', 'Maintenance', 'Bộ phận bảo trì'),
('QC', 'Quality Control', 'Bộ phận kiểm soát chất lượng'),
('LOG', 'Logistics', 'Bộ phận kho vận'),
('SAFETY', 'Safety', 'Bộ phận an toàn')
ON CONFLICT (code) DO NOTHING;

-- Create demo users with various roles
-- Password for all demo users: Manager123!
-- Hash: $2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK

DO $$
DECLARE
  dept_prod_id UUID;
  dept_ma_id UUID;
  dept_qc_id UUID;
  dept_log_id UUID;
  dept_safety_id UUID;
BEGIN
  -- Get department IDs
  SELECT id INTO dept_prod_id FROM departments WHERE code = 'PROD' LIMIT 1;
  SELECT id INTO dept_ma_id FROM departments WHERE code = 'MA' LIMIT 1;
  SELECT id INTO dept_qc_id FROM departments WHERE code = 'QC' LIMIT 1;
  SELECT id INTO dept_log_id FROM departments WHERE code = 'LOG' LIMIT 1;
  SELECT id INTO dept_safety_id FROM departments WHERE code = 'SAFETY' LIMIT 1;

  -- Supervisor (Multi-department oversight)
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'SUP001', 
    'supervisor', 
    'supervisor@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Nguyễn Văn Giám Sát',
    'supervisor',
    4,
    NULL,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email;

  -- Production Manager
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'PROD001',
    'prod_manager',
    'prod.manager@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Trần Thị Sản Xuất',
    'production_manager',
    3,
    dept_prod_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

  -- Maintenance Manager
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'MA001',
    'ma_manager',
    'ma.manager@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Lê Văn Bảo Trì',
    'maintenance_manager',
    3,
    dept_ma_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

  -- QC Manager
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'QC001',
    'qc_manager',
    'qc.manager@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Phạm Thị Chất Lượng',
    'qc_inspector',
    8,
    dept_qc_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

  -- Logistics Manager
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'LOG001',
    'logistics_manager',
    'logistics.manager@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Hoàng Văn Kho Vận',
    'team_leader',
    5,
    dept_log_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

  -- Team Leader Production
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'TL001',
    'team_leader',
    'teamlead.prod@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Ngô Văn Trưởng Nhóm',
    'team_leader',
    5,
    dept_prod_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

  -- Operator (for demo - normally no web access)
  INSERT INTO users (employee_code, username, email, password, full_name, role, level, department_id, is_active)
  VALUES (
    'OP001',
    'operator',
    'operator@smartfactory.com',
    '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK',
    'Vũ Thị Công Nhân',
    'operator',
    6,
    dept_prod_id,
    true
  )
  ON CONFLICT (employee_code) DO UPDATE SET
    password = EXCLUDED.password,
    email = EXCLUDED.email,
    department_id = EXCLUDED.department_id;

END $$;

-- Update admin password to match demo users
UPDATE users 
SET password = '$2a$12$b.YKYHJ2aK4JD4Wa6TULkuw9dew8JxhBFF0l1fmLBXWzalqRi4YyK'
WHERE employee_code = 'ADMIN001';

-- Show created users
SELECT 
  u.employee_code,
  u.username,
  u.email,
  u.full_name,
  u.role,
  u.level,
  d.name as department,
  u.is_active
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
ORDER BY u.level, u.employee_code;
