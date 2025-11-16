-- ============================================
-- SMARTFACTORY CONNECT - DATABASE SCHEMA
-- Module: Incident Reports, Idea Box, News
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INCIDENT REPORTS & SUPPORT REQUESTS
-- ============================================

-- Incident types enumeration
CREATE TYPE incident_type AS ENUM (
    'realtime_issue',       -- Sự cố realtime
    'support_request',      -- Yêu cầu hỗ trợ
    'manpower_request',     -- Huy động nhân lực
    'improvement_proposal'  -- Đề xuất cải tiến
);

-- Incident status
CREATE TYPE incident_status AS ENUM (
    'pending',              -- Chờ xử lý
    'assigned',             -- Đã phân công
    'in_progress',          -- Đang xử lý
    'need_escalation',      -- Cần leo thang
    'resolved',             -- Đã xử lý
    'closed',               -- Đã đóng
    'rejected'              -- Từ chối
);

-- Incident priority
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_code VARCHAR(50) UNIQUE NOT NULL,
    incident_type incident_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Reporter information
    reported_by UUID NOT NULL, -- FK to users
    reporter_location VARCHAR(255),
    department_id UUID, -- FK to departments
    workstation_id UUID, -- FK to workstations (optional)
    
    -- Status & Assignment
    status incident_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    assigned_to UUID, -- FK to users
    assigned_at TIMESTAMP,
    
    -- Related departments (JSONB array)
    related_departments JSONB DEFAULT '[]',
    
    -- Attachments (JSONB array of file objects)
    attachments JSONB DEFAULT '[]',
    -- Format: [{"type": "image|video|audio|document", "url": "path", "filename": "name"}]
    
    -- Timeline
    estimated_resolution_time TIMESTAMP,
    actual_resolution_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Rating & Feedback
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    rated_at TIMESTAMP,
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}'
);

-- Incident comments/updates
CREATE TABLE incident_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- FK to users
    comment_type VARCHAR(50) DEFAULT 'comment', -- comment, status_update, escalation
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT false, -- Internal note or visible to reporter
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incident history/audit log
CREATE TABLE incident_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- created, assigned, status_changed, escalated, resolved, etc.
    old_value JSONB,
    new_value JSONB,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Department task assignments for incidents
CREATE TABLE incident_department_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    department_id UUID NOT NULL, -- FK to departments
    assigned_by UUID NOT NULL, -- FK to users
    assigned_to UUID, -- Specific user in department (optional)
    task_description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    progress_note TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. IDEA BOX (HÒM THƯ GÓP Ý)
-- ============================================

-- Idea box types
CREATE TYPE ideabox_type AS ENUM ('white', 'pink');

-- Idea categories
CREATE TYPE idea_category AS ENUM (
    'quality',              -- Chất lượng
    'safety',               -- An toàn
    'performance',          -- Hiệu suất
    'material_saving',      -- Tiết kiệm nguyên liệu
    'welfare',              -- Phúc lợi
    'human_resources',      -- Nhân sự
    'infrastructure',       -- Cơ sở hạ tầng
    'work_quality',         -- Chất lượng công việc
    'other'                 -- Khác
);

-- Difficulty level
CREATE TYPE difficulty_level AS ENUM ('A', 'B', 'C', 'D');

-- Idea status
CREATE TYPE idea_status AS ENUM (
    'submitted',            -- Đã gửi
    'under_review',         -- Đang xem xét
    'approved',             -- Chấp nhận
    'in_implementation',    -- Đang triển khai
    'implemented',          -- Đã triển khai
    'rejected',             -- Từ chối
    'deferred'              -- Hoãn lại
);

-- Ideas table
CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_code VARCHAR(50) UNIQUE NOT NULL,
    box_type ideabox_type NOT NULL,
    
    -- Submitter information
    submitted_by UUID, -- NULL if anonymous
    is_anonymous BOOLEAN DEFAULT false,
    submitter_name VARCHAR(255), -- For white box
    submitter_employee_id VARCHAR(50), -- For white box
    
    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category idea_category NOT NULL,
    difficulty difficulty_level,
    tags JSONB DEFAULT '[]',
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Status & Processing
    status idea_status DEFAULT 'submitted',
    priority priority_level DEFAULT 'medium',
    
    -- Assigned handlers
    current_handler_id UUID, -- Current person handling
    handler_level VARCHAR(50), -- supervisor, manager, general_manager
    related_departments JSONB DEFAULT '[]',
    
    -- Timeline
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    review_started_at TIMESTAMP,
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Feedback & Rating
    has_received_feedback BOOLEAN DEFAULT false,
    user_satisfaction_rating INTEGER CHECK (user_satisfaction_rating BETWEEN 1 AND 5),
    user_satisfaction_comment TEXT,
    rated_at TIMESTAMP,
    
    -- Implementation
    implementation_cost DECIMAL(15,2),
    expected_benefit TEXT,
    actual_benefit TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idea responses/feedback
CREATE TABLE idea_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL, -- FK to users
    responder_role VARCHAR(100), -- supervisor, manager, general_manager, department_head
    response_type VARCHAR(50), -- feedback, status_update, decision
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    estimated_time VARCHAR(100), -- Thời gian dự kiến
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idea history/audit
CREATE TABLE idea_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idea department assignments (for pink box)
CREATE TABLE idea_department_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    department_id UUID NOT NULL,
    assigned_by UUID NOT NULL, -- Usually admin
    status VARCHAR(50) DEFAULT 'pending',
    response TEXT,
    responded_by UUID,
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. NEWS & ANNOUNCEMENTS
-- ============================================

-- News categories
CREATE TYPE news_category AS ENUM (
    'technical',            -- Kỹ thuật
    'safety',               -- An toàn
    'human_resources',      -- Nhân sự
    'quality',              -- Chất lượng
    'process',              -- Quy trình
    'improvement',          -- Cải tiến
    'welfare',              -- Phúc lợi
    'planning',             -- Kế hoạch
    'announcement',         -- Thông báo chung
    'event',                -- Sự kiện
    'other'                 -- Khác
);

-- News status
CREATE TYPE news_status AS ENUM ('draft', 'published', 'archived');

-- News table
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_code VARCHAR(50) UNIQUE NOT NULL,
    
    -- Content
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    category news_category NOT NULL,
    tags JSONB DEFAULT '[]',
    
    -- Media
    featured_image VARCHAR(500),
    images JSONB DEFAULT '[]', -- Array of image URLs
    videos JSONB DEFAULT '[]', -- Array of video URLs/embeds
    audios JSONB DEFAULT '[]', -- Array of audio URLs
    files JSONB DEFAULT '[]',  -- Array of document files
    
    -- Publishing
    status news_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    is_pinned BOOLEAN DEFAULT false,
    
    -- Author & Publishing
    author_id UUID NOT NULL, -- FK to users
    published_by UUID,
    published_at TIMESTAMP,
    
    -- Target audience (JSONB array of role IDs or department IDs)
    target_roles JSONB DEFAULT '[]',
    target_departments JSONB DEFAULT '[]',
    target_all BOOLEAN DEFAULT true,
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    
    -- Scheduling
    scheduled_publish_at TIMESTAMP,
    archive_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News views tracking
CREATE TABLE news_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_info JSONB,
    UNIQUE(news_id, user_id)
);

-- News read receipts (for important news)
CREATE TABLE news_read_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMP,
    UNIQUE(news_id, user_id)
);

-- ============================================
-- 4. NOTIFICATIONS
-- ============================================

CREATE TYPE notification_type AS ENUM (
    'incident',
    'idea',
    'news',
    'system',
    'task_assignment',
    'status_update',
    'escalation',
    'feedback_request'
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Reference to related entity
    reference_type VARCHAR(50), -- incidents, ideas, news, etc.
    reference_id UUID,
    
    -- Action URL
    action_url VARCHAR(500),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    is_pushed BOOLEAN DEFAULT false,
    pushed_at TIMESTAMP,
    
    -- Priority
    priority priority_level DEFAULT 'medium',
    
    -- Expiry
    expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Incidents indexes
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incident_comments_incident_id ON incident_comments(incident_id);

-- Ideas indexes
CREATE INDEX idx_ideas_submitted_by ON ideas(submitted_by);
CREATE INDEX idx_ideas_box_type ON ideas(box_type);
CREATE INDEX idx_ideas_status ON ideas(status);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_submitted_at ON ideas(submitted_at DESC);
CREATE INDEX idx_idea_responses_idea_id ON idea_responses(idea_id);

-- News indexes
CREATE INDEX idx_news_status ON news(status);
CREATE INDEX idx_news_category ON news(category);
CREATE INDEX idx_news_published_at ON news(published_at DESC);
CREATE INDEX idx_news_author_id ON news(author_id);
CREATE INDEX idx_news_is_pinned ON news(is_pinned);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_reference ON notifications(reference_type, reference_id);

-- ============================================
-- 6. TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. VIEWS FOR COMMON QUERIES
-- ============================================

-- View for incident statistics
CREATE OR REPLACE VIEW incident_statistics AS
SELECT 
    DATE(created_at) as date,
    incident_type,
    status,
    priority,
    COUNT(*) as count,
    AVG(user_rating) as avg_rating,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
FROM incidents
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), incident_type, status, priority;

-- View for idea statistics
CREATE OR REPLACE VIEW idea_statistics AS
SELECT 
    DATE(submitted_at) as date,
    box_type,
    category,
    status,
    COUNT(*) as count,
    AVG(user_satisfaction_rating) as avg_satisfaction
FROM ideas
WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(submitted_at), box_type, category, status;

-- ============================================
-- 8. SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample incident types for reference
COMMENT ON TYPE incident_type IS 'Loại sự cố: realtime_issue, support_request, manpower_request, improvement_proposal';
COMMENT ON TYPE ideabox_type IS 'Loại hòm thư: white (công khai), pink (ẩn danh/nhạy cảm)';
COMMENT ON TYPE idea_category IS 'Danh mục ý tưởng: quality, safety, performance, material_saving, welfare, human_resources, infrastructure, work_quality, other';

-- End of schema
