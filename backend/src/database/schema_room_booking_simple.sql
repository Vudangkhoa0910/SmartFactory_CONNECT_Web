-- SIMPLE ROOM BOOKING SETUP (NO FOREIGN KEYS)
-- This version creates tables without foreign key constraints for easier setup

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) NOT NULL UNIQUE,
  room_name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  location VARCHAR(100),
  facilities JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEETING TYPES ENUM
DO $$ BEGIN
  CREATE TYPE meeting_type AS ENUM (
    'department_meeting', 'team_standup', 'project_review', 'training_session',
    'client_meeting', 'interview', 'workshop', 'company_event', 'celebration',
    'technical_discussion', 'brainstorming', 'presentation', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. BOOKING STATUS ENUM
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'confirmed', 'cancelled', 'rejected', 'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. ROOM BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS room_bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  meeting_type meeting_type NOT NULL DEFAULT 'other',
  attendees_count INTEGER DEFAULT 1,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  booked_by_user_id INTEGER NOT NULL,
  booked_by_name VARCHAR(100) NOT NULL,
  department_id INTEGER,
  department_name VARCHAR(100),
  status booking_status DEFAULT 'pending',
  approved_by_user_id INTEGER,
  approved_by_name VARCHAR(100),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_attendees CHECK (attendees_count > 0)
);

-- 5. BOOKING HISTORY
CREATE TABLE IF NOT EXISTS room_booking_history (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by_user_id INTEGER,
  performed_by_name VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_room_bookings_date ON room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room ON room_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status ON room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_room_bookings_user ON room_bookings(booked_by_user_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_week ON room_bookings(week_number, year);
CREATE INDEX IF NOT EXISTS idx_room_bookings_conflict 
  ON room_bookings(room_id, booking_date, start_time, end_time) 
  WHERE status IN ('pending', 'confirmed');

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_room_booking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_room_booking_timestamp ON room_bookings;
CREATE TRIGGER trigger_update_room_booking_timestamp
  BEFORE UPDATE ON room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_booking_timestamp();

DROP TRIGGER IF EXISTS trigger_update_rooms_timestamp ON rooms;
CREATE TRIGGER trigger_update_rooms_timestamp
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_booking_timestamp();

-- HISTORY LOGGING
CREATE OR REPLACE FUNCTION log_booking_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO room_booking_history (booking_id, action, performed_by_user_id, performed_by_name, details)
    VALUES (NEW.id, 'created', NEW.booked_by_user_id, NEW.booked_by_name, 
            jsonb_build_object('status', NEW.status));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
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
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_history ON room_bookings;
CREATE TRIGGER trigger_log_booking_history
  AFTER INSERT OR UPDATE ON room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_history();

-- CONFLICT CHECK FUNCTION
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
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    );
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- CLEANUP FUNCTION
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

-- SEED 5 ROOMS
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
