-- SmartFactory CONNECT - Role System Update
-- Add comprehensive role system

-- Update users table to ensure all columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Role system indexes created successfully!';
  RAISE NOTICE '✓ Ready to create users and departments via API.';
END $$;
