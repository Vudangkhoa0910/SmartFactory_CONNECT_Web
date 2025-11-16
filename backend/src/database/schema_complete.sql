-- Complete Database Schema for SmartFactory CONNECT
-- Run this file to set up the entire database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & DEPARTMENTS TABLES
-- =====================================================

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key for department manager
ALTER TABLE departments ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_manager_id ON departments(manager_id);

-- =====================================================
-- ENUM TYPES
-- =====================================================

CREATE TYPE incident_type AS ENUM ('safety', 'quality', 'equipment', 'other');
CREATE TYPE incident_status AS ENUM ('pending', 'assigned', 'in_progress', 'resolved', 'closed', 'cancelled', 'escalated');

CREATE TYPE ideabox_type AS ENUM ('white', 'pink');
CREATE TYPE idea_category AS ENUM (
  'process_improvement',
  'cost_reduction', 
  'quality_improvement',
  'safety_enhancement',
  'productivity',
  'innovation',
  'environment',
  'workplace',
  'other'
);
CREATE TYPE idea_status AS ENUM ('pending', 'under_review', 'approved', 'rejected', 'implemented', 'on_hold');

CREATE TYPE news_category AS ENUM (
  'company_announcement',
  'policy_update',
  'event',
  'achievement',
  'safety_alert',
  'maintenance',
  'training',
  'welfare',
  'newsletter',
  'emergency',
  'other'
);
CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived', 'deleted');

CREATE TYPE notification_type AS ENUM (
  'incident_assigned',
  'incident_escalated',
  'incident_resolved',
  'idea_submitted',
  'idea_reviewed',
  'idea_implemented',
  'news_published',
  'system_alert',
  'comment_added',
  'response_added'
);

-- =====================================================
-- INCIDENTS TABLES
-- =====================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type incident_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(200),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  status incident_status DEFAULT 'pending',
  attachments JSONB,
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP,
  escalation_level INTEGER DEFAULT 0,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  task_description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- IDEAS TABLES
-- =====================================================

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ideabox_type ideabox_type NOT NULL,
  category idea_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  expected_benefit TEXT,
  submitter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status idea_status DEFAULT 'pending',
  attachments JSONB,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  implemented_at TIMESTAMP,
  implementation_notes TEXT,
  actual_benefit TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idea_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idea_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- NEWS TABLES
-- =====================================================

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category news_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_audience VARCHAR(50) DEFAULT 'all',
  target_departments JSONB,
  is_priority BOOLEAN DEFAULT false,
  publish_at TIMESTAMP,
  status news_status DEFAULT 'draft',
  attachments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE news_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id, user_id)
);

CREATE TABLE news_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id, user_id)
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Incidents indexes
CREATE INDEX idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_department_id ON incidents(department_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);
CREATE INDEX idx_incidents_priority ON incidents(priority);

-- Ideas indexes
CREATE INDEX idx_ideas_submitter_id ON ideas(submitter_id);
CREATE INDEX idx_ideas_assigned_to ON ideas(assigned_to);
CREATE INDEX idx_ideas_department_id ON ideas(department_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_ideabox_type ON ideas(ideabox_type);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);

-- News indexes
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_publish_at ON news(publish_at);
CREATE INDEX idx_news_created_at ON news(created_at);
CREATE INDEX idx_news_category ON news(category);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Comment indexes
CREATE INDEX idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX idx_incident_comments_user_id ON incident_comments(user_id);
CREATE INDEX idx_idea_responses_idea_id ON idea_responses(idea_id);
CREATE INDEX idx_idea_responses_user_id ON idea_responses(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_departments_timestamp
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_incidents_timestamp
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ideas_timestamp
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_news_timestamp
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- VIEWS
-- =====================================================

-- Active incidents view
CREATE OR REPLACE VIEW active_incidents AS
SELECT 
  i.*,
  u.full_name as reporter_name,
  d.name as department_name,
  a.full_name as assigned_to_name
FROM incidents i
LEFT JOIN users u ON i.reporter_id = u.id
LEFT JOIN departments d ON i.department_id = d.id
LEFT JOIN users a ON i.assigned_to = a.id
WHERE i.status NOT IN ('closed', 'cancelled');

-- Active ideas view
CREATE OR REPLACE VIEW active_ideas AS
SELECT 
  i.*,
  CASE 
    WHEN i.is_anonymous = true THEN 'Anonymous'
    ELSE u.full_name 
  END as submitter_name,
  d.name as department_name
FROM ideas i
LEFT JOIN users u ON i.submitter_id = u.id
LEFT JOIN departments d ON i.department_id = d.id
WHERE i.status NOT IN ('rejected', 'implemented');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE users IS 'System users with roles and permissions';
COMMENT ON TABLE departments IS 'Factory departments and organizational structure';
COMMENT ON TABLE incidents IS 'Incident reports from factory floor';
COMMENT ON TABLE ideas IS 'Employee ideas and suggestions (White and Pink Box)';
COMMENT ON TABLE news IS 'Company news and announcements';
COMMENT ON TABLE notifications IS 'User notifications for real-time updates';

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default admin user (password: Admin123)
INSERT INTO users (employee_code, email, password, full_name, role, level, is_active)
VALUES (
  'ADMIN001',
  'admin@smartfactory.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyLPnkC8U8Wy',
  'System Administrator',
  'admin',
  1,
  true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (code, name, description, is_active) VALUES
  ('PROD', 'Production', 'Main production department', true),
  ('QC', 'Quality Control', 'Quality assurance and control', true),
  ('MAINT', 'Maintenance', 'Equipment maintenance', true),
  ('ADMIN', 'Administration', 'Administrative department', true)
ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Database schema created successfully!';
  RAISE NOTICE '✓ Default admin user created: admin@smartfactory.com / Admin123';
  RAISE NOTICE '✓ Sample departments created';
END $$;
