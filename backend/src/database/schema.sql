-- =====================================================
-- SmartFactory CONNECT - Complete Database Schema
-- Version: 2.0.0
-- Aligned with SRS v2.1
-- =====================================================
-- Run: psql -U smartfactory -d smartfactory_db -f schema.sql
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- DROP EXISTING TABLES (for clean install)
-- =====================================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS user_fcm_tokens CASCADE;
DROP TABLE IF EXISTS idea_ratings CASCADE;
DROP TABLE IF EXISTS idea_history CASCADE;
DROP TABLE IF EXISTS idea_responses CASCADE;
DROP TABLE IF EXISTS ideas CASCADE;
DROP TABLE IF EXISTS incident_history CASCADE;
DROP TABLE IF EXISTS incident_comments CASCADE;
DROP TABLE IF EXISTS incident_department_tasks CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS news_read_receipts CASCADE;
DROP TABLE IF EXISTS news_views CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS room_booking_history CASCADE;
DROP TABLE IF EXISTS room_approval_rules CASCADE;
DROP TABLE IF EXISTS room_bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS role_levels CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS incident_type CASCADE;
DROP TYPE IF EXISTS incident_status CASCADE;
DROP TYPE IF EXISTS incident_priority CASCADE;
DROP TYPE IF EXISTS ideabox_type CASCADE;
DROP TYPE IF EXISTS idea_category CASCADE;
DROP TYPE IF EXISTS idea_status CASCADE;
DROP TYPE IF EXISTS idea_difficulty CASCADE;
DROP TYPE IF EXISTS news_category CASCADE;
DROP TYPE IF EXISTS news_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- ENUM TYPES (SRS aligned)
-- =====================================================

-- User roles (SRS Section 9)
CREATE TYPE user_role AS ENUM (
  'admin',
  'general_manager',
  'manager',
  'supervisor',
  'team_leader',
  'operator',
  'technician',
  'qc_inspector',
  'maintenance_staff',
  'viewer'
);

-- Incident types (SRS Section 3)
CREATE TYPE incident_type AS ENUM (
  'safety',        -- An toàn lao động
  'quality',       -- Chất lượng sản phẩm
  'equipment',     -- Thiết bị/máy móc
  'other'          -- Khác
);

CREATE TYPE incident_status AS ENUM (
  'pending',       -- Chờ xử lý
  'assigned',      -- Đã phân công
  'in_progress',   -- Đang xử lý
  'resolved',      -- Đã giải quyết
  'closed',        -- Đã đóng
  'cancelled',     -- Đã hủy
  'escalated'      -- Đã leo thang
);

CREATE TYPE incident_priority AS ENUM (
  'critical',      -- Khẩn cấp
  'high',          -- Cao
  'medium',        -- Trung bình
  'low'            -- Thấp
);

-- Idea types (SRS Section 4)
CREATE TYPE ideabox_type AS ENUM (
  'white',         -- Hòm trắng (công khai)
  'pink'           -- Hòm hồng (ẩn danh)
);

-- Idea categories (SRS Section 6)
CREATE TYPE idea_category AS ENUM (
  'process_improvement',   -- Cải tiến quy trình
  'cost_reduction',        -- Giảm chi phí
  'quality_improvement',   -- Cải tiến chất lượng
  'safety_enhancement',    -- Tăng cường an toàn
  'productivity',          -- Năng suất
  'innovation',            -- Đổi mới
  'environment',           -- Môi trường
  'workplace',             -- Nơi làm việc
  'other'                  -- Khác
);

CREATE TYPE idea_status AS ENUM (
  'pending',        -- Chờ xem xét
  'under_review',   -- Đang xem xét
  'approved',       -- Đã phê duyệt
  'rejected',       -- Từ chối
  'implemented',    -- Đã triển khai
  'on_hold'         -- Tạm hoãn
);

CREATE TYPE idea_difficulty AS ENUM (
  'A',  -- Dễ (< 7 ngày)
  'B',  -- Trung bình (7-14 ngày)
  'C',  -- Khó (15-30 ngày)
  'D'   -- Rất khó (> 30 ngày)
);

-- White Box subtype (SRS Section 4)
CREATE TYPE whitebox_subtype AS ENUM (
  'idea',     -- Ý tưởng (sáng kiến cải tiến)
  'opinion'   -- Ý kiến (góp ý, phản hồi)
);

-- News categories (SRS Section 7)
CREATE TYPE news_category AS ENUM (
  'company_announcement',  -- Thông báo công ty
  'policy_update',         -- Cập nhật chính sách
  'event',                 -- Sự kiện
  'achievement',           -- Thành tựu
  'safety_alert',          -- Cảnh báo an toàn
  'maintenance',           -- Bảo trì
  'training',              -- Đào tạo
  'welfare',               -- Phúc lợi
  'newsletter',            -- Bản tin
  'emergency',             -- Khẩn cấp
  'other'                  -- Khác
);

CREATE TYPE news_status AS ENUM (
  'draft',       -- Bản nháp
  'published',   -- Đã xuất bản
  'archived',    -- Lưu trữ
  'deleted'      -- Đã xóa
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
  'incident_assigned',
  'incident_escalated',
  'incident_resolved',
  'incident_commented',
  'idea_submitted',
  'idea_reviewed',
  'idea_implemented',
  'idea_response',
  'news_published',
  'system_alert'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Departments Table (SRS Section 2)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_ja VARCHAR(100),
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE departments IS 'Phòng ban theo SRS Section 2: Sản xuất, Kiểm tra, Vận chuyển, Logistic, Thiết bị, MA, Kỹ thuật, QA, QLSX';

-- Users Table (SRS Section 9)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  full_name_ja VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  preferred_language VARCHAR(10) DEFAULT 'vi',
  role user_role NOT NULL DEFAULT 'operator',
  level INTEGER NOT NULL DEFAULT 5,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 6)
);

COMMENT ON TABLE users IS 'Người dùng với vai trò theo SRS Section 9';

-- Add foreign key for department manager
ALTER TABLE departments 
  ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Role Levels Reference Table
CREATE TABLE role_levels (
  id SERIAL PRIMARY KEY,
  role user_role UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  display_name_ja VARCHAR(100),
  description TEXT,
  can_manage_users BOOLEAN DEFAULT false,
  can_manage_departments BOOLEAN DEFAULT false,
  can_view_all_incidents BOOLEAN DEFAULT false,
  can_view_all_ideas BOOLEAN DEFAULT false,
  can_publish_news BOOLEAN DEFAULT false,
  can_view_statistics BOOLEAN DEFAULT false,
  can_access_pink_box BOOLEAN DEFAULT false,
  -- Room booking permissions
  can_approve_room_bookings BOOLEAN DEFAULT false,
  can_manage_rooms BOOLEAN DEFAULT false,
  can_book_all_rooms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert role level mappings (SRS Section 9)
INSERT INTO role_levels (role, level, display_name, display_name_ja, description, can_manage_users, can_manage_departments, can_view_all_incidents, can_view_all_ideas, can_publish_news, can_view_statistics, can_access_pink_box, can_approve_room_bookings, can_manage_rooms, can_book_all_rooms)
VALUES 
  ('admin', 1, 'System Administrator', 'システム管理者', 'Full system access', true, true, true, true, true, true, true, true, true, true),
  ('general_manager', 1, 'General Manager', '総務部長', 'Factory-wide oversight', true, true, true, true, true, true, true, true, true, true),
  ('manager', 2, 'Manager', 'マネージャー', 'Department management', false, true, true, true, true, true, true, true, false, true),
  ('supervisor', 3, 'Supervisor', '監督者', 'Team supervision', false, false, true, true, true, true, false, true, false, false),
  ('team_leader', 4, 'Team Leader', 'チームリーダー', 'Team coordination', false, false, false, false, false, false, false, false, false, false),
  ('operator', 5, 'Operator', 'オペレーター', 'Production operations', false, false, false, false, false, false, false, false, false, false),
  ('technician', 5, 'Technician', '技術者', 'Technical support', false, false, false, false, false, false, false, false, false, false),
  ('qc_inspector', 5, 'QC Inspector', '品質検査員', 'Quality control', false, false, false, false, false, false, false, false, false, false),
  ('maintenance_staff', 5, 'Maintenance Staff', 'メンテナンススタッフ', 'Equipment maintenance', false, false, false, false, false, false, false, false, false, false),
  ('viewer', 6, 'Viewer', '閲覧者', 'Read-only access', false, false, false, false, false, false, false, false, false, false);

-- =====================================================
-- INCIDENTS TABLES (SRS Section 3, 10, 11)
-- =====================================================

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type incident_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  title_ja VARCHAR(200),
  description TEXT NOT NULL,
  description_ja TEXT,
  location VARCHAR(200),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  priority incident_priority DEFAULT 'medium',
  status incident_status DEFAULT 'pending',
  escalation_level INTEGER DEFAULT 0,
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]',
  rag_suggestion JSONB,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolution_notes_ja TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  rating_feedback TEXT,
  rated_at TIMESTAMP WITH TIME ZONE,
  rated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE incidents IS 'Báo cáo sự cố theo SRS Section 3, 10, 11';

CREATE TABLE incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  comment_ja TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incident_department_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  task_description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- IDEAS TABLES (SRS Section 4, 5)
-- =====================================================

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ideabox_type ideabox_type NOT NULL,
  whitebox_subtype whitebox_subtype,  -- NULL for Pink Box, 'idea' or 'opinion' for White Box
  category idea_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  title_ja VARCHAR(200),
  description TEXT NOT NULL,
  description_ja TEXT,
  expected_benefit TEXT,
  expected_benefit_ja TEXT,
  submitter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  status idea_status DEFAULT 'pending',
  difficulty idea_difficulty,
  handler_level INTEGER DEFAULT 1,
  escalation_level INTEGER DEFAULT 0,
  escalated_to UUID REFERENCES users(id) ON DELETE SET NULL,
  escalated_at TIMESTAMP WITH TIME ZONE,
  current_handler_level INTEGER,
  attachments JSONB DEFAULT '[]',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  review_notes_ja TEXT,
  feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  implemented_at TIMESTAMP WITH TIME ZONE,
  implementation_notes TEXT,
  implementation_notes_ja TEXT,
  actual_benefit TEXT,
  actual_benefit_ja TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ideas IS 'Hộp thư góp ý (Hòm trắng/Hòm hồng) theo SRS Section 4, 5';

CREATE TABLE idea_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  response_ja TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idea_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idea_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  rated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  response_quality INTEGER CHECK (response_quality >= 1 AND response_quality <= 5),
  response_time INTEGER CHECK (response_time >= 1 AND response_time <= 5),
  implementation_quality INTEGER CHECK (implementation_quality >= 1 AND implementation_quality <= 5),
  feedback TEXT,
  is_satisfied BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(idea_id, rated_by)
);

-- =====================================================
-- NEWS TABLES (SRS Section 7)
-- =====================================================

CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category news_category NOT NULL,
  title VARCHAR(200) NOT NULL,
  title_ja VARCHAR(200),
  content TEXT NOT NULL,
  content_ja TEXT,
  excerpt VARCHAR(500),
  excerpt_ja VARCHAR(500),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_audience VARCHAR(50) DEFAULT 'all',
  target_departments JSONB,
  target_users JSONB,
  is_priority BOOLEAN DEFAULT false,
  publish_at TIMESTAMP WITH TIME ZONE,
  status news_status DEFAULT 'draft',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE news IS 'Tin tức nội bộ theo SRS Section 7';

CREATE TABLE news_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(news_id, user_id)
);

CREATE TABLE news_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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
  title_ja VARCHAR(200),
  message TEXT NOT NULL,
  message_ja TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  action_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ROOM BOOKING TABLES
-- =====================================================

-- Room status enum
CREATE TYPE room_status AS ENUM (
  'available',
  'occupied',
  'maintenance',
  'unavailable'
);

-- Booking status enum
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

-- Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_ja VARCHAR(100),
  description TEXT,
  description_ja TEXT,
  floor INTEGER NOT NULL DEFAULT 1,
  building VARCHAR(50) DEFAULT 'Main',
  location_details TEXT,
  capacity INTEGER NOT NULL DEFAULT 10,
  min_capacity INTEGER DEFAULT 2,
  has_projector BOOLEAN DEFAULT false,
  has_whiteboard BOOLEAN DEFAULT true,
  has_video_conference BOOLEAN DEFAULT false,
  has_audio_system BOOLEAN DEFAULT false,
  has_air_conditioner BOOLEAN DEFAULT true,
  has_tv_screen BOOLEAN DEFAULT false,
  other_equipment TEXT[],
  image_url TEXT,
  thumbnail_url TEXT,
  status room_status NOT NULL DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  max_booking_hours INTEGER DEFAULT 4,
  advance_booking_days INTEGER DEFAULT 14,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_capacity CHECK (capacity > 0 AND capacity <= 100),
  CONSTRAINT valid_floor CHECK (floor >= -2 AND floor <= 50)
);

COMMENT ON TABLE rooms IS 'Phòng họp trong nhà máy';

-- Room Bookings Table
CREATE TABLE room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  title_ja VARCHAR(200),
  description TEXT,
  purpose VARCHAR(100),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  expected_attendees INTEGER DEFAULT 1,
  attendee_emails TEXT[],
  status booking_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  cancelled_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50),
  recurring_end_date DATE,
  parent_booking_id UUID REFERENCES room_bookings(id),
  notes TEXT,
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_booking_time CHECK (end_time > start_time),
  CONSTRAINT valid_attendees CHECK (expected_attendees > 0)
);

COMMENT ON TABLE room_bookings IS 'Đặt phòng họp';

-- Room Booking History Table
CREATE TABLE room_booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES room_bookings(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES users(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  old_start_time TIMESTAMP WITH TIME ZONE,
  new_start_time TIMESTAMP WITH TIME ZONE,
  old_end_time TIMESTAMP WITH TIME ZONE,
  new_end_time TIMESTAMP WITH TIME ZONE,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE room_booking_history IS 'Lịch sử thay đổi booking phòng họp';

-- Room Approval Rules Table
CREATE TABLE room_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  approver_role VARCHAR(50),
  approver_level INTEGER,
  min_level_required INTEGER NOT NULL DEFAULT 5,
  auto_approve_for_level INTEGER,
  max_booking_hours_without_approval INTEGER DEFAULT 2,
  requires_manager_approval BOOLEAN DEFAULT false,
  requires_department_head_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_min_level CHECK (min_level_required >= 1 AND min_level_required <= 6),
  CONSTRAINT valid_auto_approve_level CHECK (auto_approve_for_level IS NULL OR (auto_approve_for_level >= 1 AND auto_approve_for_level <= 6))
);

COMMENT ON TABLE room_approval_rules IS 'Quy tắc phê duyệt phòng họp theo phòng ban và level';

-- Room indexes
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_capacity ON rooms(capacity);
CREATE INDEX idx_rooms_active ON rooms(is_active);

-- Room bookings indexes
CREATE INDEX idx_bookings_room ON room_bookings(room_id);
CREATE INDEX idx_bookings_user ON room_bookings(user_id);
CREATE INDEX idx_bookings_status ON room_bookings(status);
CREATE INDEX idx_bookings_time ON room_bookings(start_time, end_time);

-- Room booking history indexes
CREATE INDEX idx_room_booking_history_booking_id ON room_booking_history(booking_id);
CREATE INDEX idx_room_booking_history_changed_by ON room_booking_history(changed_by);
CREATE INDEX idx_room_booking_history_action ON room_booking_history(action);
CREATE INDEX idx_room_booking_history_created_at ON room_booking_history(created_at DESC);

-- Room approval rules indexes
CREATE INDEX idx_room_approval_rules_room_id ON room_approval_rules(room_id);
CREATE INDEX idx_room_approval_rules_department_id ON room_approval_rules(department_id);
CREATE INDEX idx_room_approval_rules_is_active ON room_approval_rules(is_active);

-- =====================================================
-- SYSTEM TABLES
-- =====================================================

CREATE TABLE user_fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_type VARCHAR(50),
  device_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fcm_token)
);

CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO system_settings (key, value, description, category)
VALUES 
  ('auto_assign_enabled', 'true', 'Enable AI auto-assignment for incidents', 'incidents'),
  ('auto_assign_threshold', '0.85', 'Confidence threshold for auto-assignment', 'incidents'),
  ('escalation_timeout_hours', '24', 'Hours before auto-escalation', 'escalation'),
  ('incident_priority_weights', '{"critical": 4, "high": 3, "medium": 2, "low": 1}', 'Priority weighting', 'incidents'),
  ('idea_difficulty_targets', '{"A": 7, "B": 14, "C": 30, "D": 60}', 'Target days by difficulty', 'ideas'),
  ('notification_retention_days', '90', 'Days to retain notifications', 'notifications'),
  ('max_file_size_mb', '10', 'Maximum upload file size', 'uploads');

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_code ON users(employee_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Departments indexes
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);

-- Incidents indexes
CREATE INDEX idx_incidents_reporter_id ON incidents(reporter_id);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_department_id ON incidents(department_id);
CREATE INDEX idx_incidents_assigned_department_id ON incidents(assigned_department_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_escalation_level ON incidents(escalation_level);

-- Ideas indexes
CREATE INDEX idx_ideas_submitter_id ON ideas(submitter_id);
CREATE INDEX idx_ideas_assigned_to ON ideas(assigned_to);
CREATE INDEX idx_ideas_department_id ON ideas(department_id);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_ideabox_type ON ideas(ideabox_type);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_difficulty ON ideas(difficulty);
CREATE INDEX idx_ideas_handler_level ON ideas(handler_level);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);

-- News indexes
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_publish_at ON news(publish_at);
CREATE INDEX idx_news_is_priority ON news(is_priority);
CREATE INDEX idx_news_created_at ON news(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Comments/Responses indexes
CREATE INDEX idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX idx_incident_comments_user_id ON incident_comments(user_id);
CREATE INDEX idx_idea_responses_idea_id ON idea_responses(idea_id);
CREATE INDEX idx_idea_responses_user_id ON idea_responses(user_id);

-- History indexes
CREATE INDEX idx_incident_history_incident_id ON incident_history(incident_id);
CREATE INDEX idx_idea_history_idea_id ON idea_history(idea_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

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

-- Function to auto-set user level based on role
CREATE OR REPLACE FUNCTION set_user_level()
RETURNS TRIGGER AS $$
BEGIN
  SELECT level INTO NEW.level 
  FROM role_levels 
  WHERE role = NEW.role::user_role;
  
  IF NEW.level IS NULL THEN
    NEW.level := 6;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_departments_timestamp
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_incidents_timestamp
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_ideas_timestamp
  BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_news_timestamp
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_system_settings_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_fcm_tokens_timestamp
  BEFORE UPDATE ON user_fcm_tokens
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Room timestamps function
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_timestamp
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_room_timestamp();

CREATE TRIGGER trigger_update_booking_timestamp
  BEFORE UPDATE ON room_bookings
  FOR EACH ROW EXECUTE FUNCTION update_room_timestamp();

-- Room booking history auto-log trigger
CREATE OR REPLACE FUNCTION log_room_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO room_booking_history (
    booking_id, changed_by, old_status, new_status,
    old_start_time, new_start_time, old_end_time, new_end_time,
    action, reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.cancelled_by, NEW.approved_by, NEW.user_id, OLD.user_id),
    OLD.status::TEXT,
    NEW.status::TEXT,
    OLD.start_time,
    NEW.start_time,
    OLD.end_time,
    NEW.end_time,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      WHEN OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time THEN 'time_changed'
      ELSE 'updated'
    END,
    COALESCE(NEW.rejection_reason, NEW.cancellation_reason)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_room_booking_change
  AFTER INSERT OR UPDATE ON room_bookings
  FOR EACH ROW EXECUTE FUNCTION log_room_booking_change();

-- Apply auto-level trigger
CREATE TRIGGER set_user_level_trigger
  BEFORE INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION set_user_level();

-- =====================================================
-- VIEWS
-- =====================================================

-- Active incidents view
CREATE OR REPLACE VIEW active_incidents AS
SELECT 
  i.*,
  u.full_name as reporter_name,
  u.employee_code as reporter_code,
  d.name as department_name,
  ad.name as assigned_department_name,
  a.full_name as assigned_to_name
FROM incidents i
LEFT JOIN users u ON i.reporter_id = u.id
LEFT JOIN departments d ON i.department_id = d.id
LEFT JOIN departments ad ON i.assigned_department_id = ad.id
LEFT JOIN users a ON i.assigned_to = a.id
WHERE i.status NOT IN ('closed', 'cancelled');

-- Active ideas view
CREATE OR REPLACE VIEW active_ideas AS
SELECT 
  i.*,
  CASE 
    WHEN i.is_anonymous = true THEN 'Ẩn danh'
    ELSE u.full_name 
  END as submitter_name,
  d.name as department_name
FROM ideas i
LEFT JOIN users u ON i.submitter_id = u.id
LEFT JOIN departments d ON i.department_id = d.id
WHERE i.status NOT IN ('rejected', 'implemented');

-- User permissions view
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  u.id as user_id,
  u.employee_code,
  u.full_name,
  u.email,
  u.role,
  u.level,
  u.department_id,
  d.name as department_name,
  rl.display_name as role_display_name,
  rl.can_manage_users,
  rl.can_manage_departments,
  rl.can_view_all_incidents,
  rl.can_view_all_ideas,
  rl.can_publish_news,
  rl.can_view_statistics,
  rl.can_access_pink_box
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN role_levels rl ON u.role = rl.role
WHERE u.is_active = true;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✓ SmartFactory CONNECT Database Schema v2.0 Created!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  • departments';
  RAISE NOTICE '  • users';
  RAISE NOTICE '  • role_levels';
  RAISE NOTICE '  • incidents, incident_comments, incident_history';
  RAISE NOTICE '  • ideas, idea_responses, idea_history, idea_ratings';
  RAISE NOTICE '  • news, news_views, news_read_receipts';
  RAISE NOTICE '  • notifications';
  RAISE NOTICE '  • user_fcm_tokens';
  RAISE NOTICE '  • system_settings';
  RAISE NOTICE '  • audit_logs';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Role Level Mapping (SRS Section 9):';
  RAISE NOTICE '  Level 1: admin, general_manager';
  RAISE NOTICE '  Level 2: manager';
  RAISE NOTICE '  Level 3: supervisor';
  RAISE NOTICE '  Level 4: team_leader';
  RAISE NOTICE '  Level 5: operator, technician, qc_inspector, maintenance_staff';
  RAISE NOTICE '  Level 6: viewer';
  RAISE NOTICE '=====================================================';
END $$;
