-- =====================================================
-- ROOM BOOKING SYSTEM DATABASE SCHEMA
-- Created: 2025-11-26
-- Description: Complete room booking system with approval workflow
-- =====================================================

-- 1. ROOMS TABLE (Meeting Rooms Configuration)
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE, -- 'A', 'B', 'C', 'D', 'E'
  room_name VARCHAR(100) NOT NULL,       -- 'Phòng Họp A', 'Phòng Họp B'...
  capacity INTEGER NOT NULL DEFAULT 10,  -- Sức chứa người
  location VARCHAR(100),                 -- 'Tầng 1', 'Tầng 2'...
  facilities JSONB DEFAULT '[]'::jsonb,  -- ["projector", "whiteboard", "video_conference"]
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEETING TYPES ENUM
DO $$ BEGIN
  CREATE TYPE meeting_type AS ENUM (
    'department_meeting',    -- Họp phòng ban
    'team_standup',         -- Họp đứng team
    'project_review',       -- Họp review dự án
    'training_session',     -- Đào tạo nội bộ
    'client_meeting',       -- Gặp khách hàng/đối tác
    'interview',            -- Phỏng vấn tuyển dụng
    'workshop',             -- Workshop/Hội thảo
    'company_event',        -- Sự kiện công ty
    'celebration',          -- Sinh nhật/Kỷ niệm
    'technical_discussion', -- Thảo luận kỹ thuật
    'brainstorming',        -- Brainstorm ý tưởng
    'presentation',         -- Thuyết trình/Báo cáo
    'other'                 -- Khác
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. BOOKING STATUS ENUM
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',      -- Chờ duyệt
    'confirmed',    -- Đã xác nhận
    'cancelled',    -- Đã hủy
    'rejected',     -- Bị từ chối
    'completed'     -- Đã hoàn thành (tự động sau khi qua thời gian)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. ROOM BOOKINGS TABLE (Main Booking Data)
CREATE TABLE IF NOT EXISTS room_bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  
  -- Booking Information
  title VARCHAR(200) NOT NULL,           -- "Họp Team Sprint Planning"
  description TEXT,                      -- Mô tả chi tiết
  meeting_type meeting_type NOT NULL DEFAULT 'other',
  attendees_count INTEGER DEFAULT 1,     -- Số người tham dự
  
  -- Time Information
  booking_date DATE NOT NULL,            -- Ngày đặt phòng
  start_time TIME NOT NULL,              -- Giờ bắt đầu
  end_time TIME NOT NULL,                -- Giờ kết thúc
  week_number INTEGER NOT NULL,          -- Tuần trong năm (1-53)
  year INTEGER NOT NULL,                 -- Năm
  
  -- Booker Information
  booked_by_user_id INTEGER NOT NULL,
  booked_by_name VARCHAR(100) NOT NULL,  -- Denormalized for quick display
  department_id INTEGER,
  department_name VARCHAR(100),          -- Denormalized
  
  -- Approval Workflow
  status booking_status DEFAULT 'pending',
  approved_by_user_id INTEGER,
  approved_by_name VARCHAR(100),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Display & Metadata
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  notes TEXT,                            -- Ghi chú thêm
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_attendees CHECK (attendees_count > 0)
);

-- Add foreign keys after table creation (with ON DELETE CASCADE)
DO $$ 
BEGIN
  -- Add room_id foreign key if rooms table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
    ALTER TABLE room_bookings 
    DROP CONSTRAINT IF EXISTS room_bookings_room_id_fkey,
    ADD CONSTRAINT room_bookings_room_id_fkey 
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE;
  END IF;
  
  -- Add user foreign keys if users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE room_bookings 
    DROP CONSTRAINT IF EXISTS room_bookings_booked_by_user_id_fkey,
    ADD CONSTRAINT room_bookings_booked_by_user_id_fkey 
      FOREIGN KEY (booked_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
      
    ALTER TABLE room_bookings 
    DROP CONSTRAINT IF EXISTS room_bookings_approved_by_user_id_fkey,
    ADD CONSTRAINT room_bookings_approved_by_user_id_fkey 
      FOREIGN KEY (approved_by_user_id) REFERENCES users(id);
  END IF;
  
  -- Add department foreign key if departments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
    ALTER TABLE room_bookings 
    DROP CONSTRAINT IF EXISTS room_bookings_department_id_fkey,
    ADD CONSTRAINT room_bookings_department_id_fkey 
      FOREIGN KEY (department_id) REFERENCES departments(id);
  END IF;
END $$;

-- 5. BOOKING HISTORY/AUDIT LOG
CREATE TABLE IF NOT EXISTS room_booking_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'cancelled'
  performed_by_user_id INTEGER,
  performed_by_name VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb, -- Store old/new values
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys for history table
DO $$ 
BEGIN
  -- Add booking_id foreign key
  ALTER TABLE room_booking_history 
  DROP CONSTRAINT IF EXISTS room_booking_history_booking_id_fkey,
  ADD CONSTRAINT room_booking_history_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES room_bookings(id) ON DELETE CASCADE;
  
  -- Add user foreign key if users table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE room_booking_history 
    DROP CONSTRAINT IF EXISTS room_booking_history_performed_by_user_id_fkey,
    ADD CONSTRAINT room_booking_history_performed_by_user_id_fkey 
      FOREIGN KEY (performed_by_user_id) REFERENCES users(id);
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_room_bookings_date ON room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_user ON room_bookings(booked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_week ON room_bookings(week_number, year);
CREATE INDEX IF NOT EXISTS idx_room_bookings_search ON room_bookings(title, description);

-- Composite index for conflict checking
CREATE INDEX IF NOT EXISTS idx_room_bookings_conflict 
  ON room_bookings(room_id, booking_date, start_time, end_time) 
  WHERE status IN ('pending', 'confirmed');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_booking_timestamp
  BEFORE UPDATE ON room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_booking_timestamp();

-- Auto-update rooms timestamp
CREATE TRIGGER trigger_update_rooms_timestamp
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_booking_timestamp();

-- Auto-log booking changes to history
CREATE OR REPLACE FUNCTION log_booking_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO room_booking_history (booking_id, action, performed_by_user_id, performed_by_name, details)
    VALUES (NEW.id, 'created', NEW.booked_by_user_id, NEW.booked_by_name, 
            jsonb_build_object('status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO room_booking_history (booking_id, action, performed_by_user_id, performed_by_name, details)
      VALUES (NEW.id, 
              CASE 
                WHEN NEW.status = 'confirmed' THEN 'approved'
                WHEN NEW.status = 'rejected' THEN 'rejected'
                WHEN NEW.status = 'cancelled' THEN 'cancelled'
                ELSE 'updated'
              END,
              NEW.approved_by_user_id, 
              NEW.approved_by_name,
              jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'rejection_reason', NEW.rejection_reason
              ));
    ELSE
      INSERT INTO room_booking_history (booking_id, action, performed_by_user_id, performed_by_name, details)
      VALUES (NEW.id, 'updated', NEW.booked_by_user_id, NEW.booked_by_name, '{}'::jsonb);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_booking_history
  AFTER INSERT OR UPDATE ON room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_history();

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict(
  p_room_id INTEGER,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_exclude_booking_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM room_bookings
  WHERE room_id = p_room_id
    AND booking_date = p_booking_date
    AND status IN ('pending', 'confirmed')
    AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    AND (
      -- Check for time overlap
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: INSERT 5 MEETING ROOMS
-- =====================================================

INSERT INTO rooms (room_code, room_name, capacity, location, facilities, description) VALUES
  ('A', 'Phòng Họp A', 8, 'Tầng 1 - Khu A', 
   '["projector", "whiteboard", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp nhỏ, phù hợp cho team meeting 6-8 người'),
  
  ('B', 'Phòng Họp B', 12, 'Tầng 1 - Khu B', 
   '["projector", "whiteboard", "video_conference", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp vừa, có thiết bị video conference'),
  
  ('C', 'Phòng Họp C', 20, 'Tầng 2 - Khu C', 
   '["projector", "whiteboard", "video_conference", "sound_system", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp lớn, phù hợp cho workshop và training'),
  
  ('D', 'Phòng Họp D', 6, 'Tầng 2 - Khu D', 
   '["whiteboard", "air_conditioner", "wifi"]'::jsonb,
   'Phòng họp mini, thích hợp cho thảo luận nhóm nhỏ'),
  
  ('E', 'Phòng Họp E', 30, 'Tầng 3 - Hội trường', 
   '["projector", "whiteboard", "video_conference", "sound_system", "microphone", "air_conditioner", "wifi"]'::jsonb,
   'Hội trường lớn, dùng cho sự kiện công ty và presentation')
ON CONFLICT (room_code) DO NOTHING;

-- =====================================================
-- MEETING TYPE COLOR MAPPING (for reference in frontend)
-- =====================================================

-- Use this mapping in your frontend:
-- department_meeting: #3B82F6 (Blue)
-- team_standup: #10B981 (Green)
-- project_review: #8B5CF6 (Purple)
-- training_session: #F59E0B (Amber)
-- client_meeting: #EC4899 (Pink)
-- interview: #EF4444 (Red)
-- workshop: #06B6D4 (Cyan)
-- company_event: #F97316 (Orange)
-- celebration: #A855F7 (Violet)
-- technical_discussion: #6366F1 (Indigo)
-- brainstorming: #14B8A6 (Teal)
-- presentation: #84CC16 (Lime)
-- other: #6B7280 (Gray)

-- =====================================================
-- CLEANUP OLD BOOKINGS (>1 month)
-- Run this as a cron job or scheduled task
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_bookings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM room_bookings
    WHERE booking_date < CURRENT_DATE - INTERVAL '1 month'
      AND status IN ('completed', 'cancelled', 'rejected')
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Current Week Bookings with Details
CREATE OR REPLACE VIEW v_current_week_bookings AS
SELECT 
  rb.id,
  rb.room_id,
  r.room_code,
  r.room_name,
  rb.title,
  rb.description,
  rb.meeting_type,
  rb.attendees_count,
  rb.booking_date,
  rb.start_time,
  rb.end_time,
  rb.booked_by_user_id,
  rb.booked_by_name,
  rb.department_name,
  rb.status,
  rb.approved_by_name,
  rb.approved_at,
  rb.color,
  rb.created_at
FROM room_bookings rb
JOIN rooms r ON rb.room_id = r.id
WHERE rb.week_number = EXTRACT(WEEK FROM CURRENT_DATE)
  AND rb.year = EXTRACT(YEAR FROM CURRENT_DATE)
  AND rb.status IN ('pending', 'confirmed')
ORDER BY rb.booking_date, rb.start_time;

-- View: Pending Approvals for Admin
CREATE OR REPLACE VIEW v_pending_bookings AS
SELECT 
  rb.id,
  rb.room_id,
  r.room_code,
  r.room_name,
  rb.title,
  rb.meeting_type,
  rb.attendees_count,
  rb.booking_date,
  rb.start_time,
  rb.end_time,
  rb.booked_by_user_id,
  rb.booked_by_name,
  u.email as booked_by_email,
  rb.department_name,
  rb.created_at,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - rb.created_at))/3600 as hours_waiting
FROM room_bookings rb
JOIN rooms r ON rb.room_id = r.id
JOIN users u ON rb.booked_by_user_id = u.id
WHERE rb.status = 'pending'
ORDER BY rb.created_at ASC;

-- =====================================================
-- GRANT PERMISSIONS (adjust based on your setup)
-- =====================================================

-- GRANT ALL PRIVILEGES ON TABLE rooms TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE room_bookings TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE room_booking_history TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

COMMENT ON TABLE rooms IS 'Meeting rooms configuration and capacity';
COMMENT ON TABLE room_bookings IS 'Main table for room booking requests with approval workflow';
COMMENT ON TABLE room_booking_history IS 'Audit log for all booking changes';
COMMENT ON FUNCTION check_booking_conflict IS 'Check if a booking conflicts with existing bookings';
COMMENT ON FUNCTION cleanup_old_bookings IS 'Delete bookings older than 1 month (run as cron job)';
