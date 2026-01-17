-- =====================================================
-- SmartFactory CONNECT - Room Booking Schema
-- Version: 1.0.0
-- =====================================================

-- Drop existing room tables if any
DROP TABLE IF EXISTS room_bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TYPE IF EXISTS room_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Room status
CREATE TYPE room_status AS ENUM (
  'available',      -- Sẵn sàng sử dụng
  'occupied',       -- Đang sử dụng
  'maintenance',    -- Đang bảo trì
  'unavailable'     -- Không khả dụng
);

-- Booking status
CREATE TYPE booking_status AS ENUM (
  'pending',        -- Chờ duyệt
  'confirmed',      -- Đã xác nhận
  'in_progress',    -- Đang diễn ra
  'completed',      -- Hoàn thành
  'cancelled'       -- Đã hủy
);

-- =====================================================
-- ROOMS TABLE
-- =====================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  code VARCHAR(20) UNIQUE NOT NULL,           -- Mã phòng (VD: MH-01, MH-02)
  name VARCHAR(100) NOT NULL,                 -- Tên phòng
  name_ja VARCHAR(100),                       -- Tên tiếng Nhật
  description TEXT,                           -- Mô tả phòng
  description_ja TEXT,                        -- Mô tả tiếng Nhật
  
  -- Location
  floor INTEGER NOT NULL DEFAULT 1,           -- Tầng
  building VARCHAR(50) DEFAULT 'Main',        -- Tòa nhà
  location_details TEXT,                      -- Chi tiết vị trí
  
  -- Capacity & Equipment
  capacity INTEGER NOT NULL DEFAULT 10,       -- Sức chứa tối đa
  min_capacity INTEGER DEFAULT 2,             -- Số người tối thiểu
  
  -- Equipment available
  has_projector BOOLEAN DEFAULT false,        -- Máy chiếu
  has_whiteboard BOOLEAN DEFAULT true,        -- Bảng trắng
  has_video_conference BOOLEAN DEFAULT false, -- Thiết bị họp video
  has_audio_system BOOLEAN DEFAULT false,     -- Hệ thống âm thanh
  has_air_conditioner BOOLEAN DEFAULT true,   -- Điều hòa
  has_tv_screen BOOLEAN DEFAULT false,        -- Màn hình TV
  other_equipment TEXT[],                     -- Thiết bị khác
  
  -- Images
  image_url TEXT,                             -- Ảnh phòng
  thumbnail_url TEXT,                         -- Ảnh thumbnail
  
  -- Status & Settings
  status room_status NOT NULL DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,    -- Cần duyệt không
  max_booking_hours INTEGER DEFAULT 4,        -- Số giờ tối đa mỗi lần đặt
  advance_booking_days INTEGER DEFAULT 14,    -- Đặt trước tối đa bao nhiêu ngày
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_capacity CHECK (capacity > 0 AND capacity <= 100),
  CONSTRAINT valid_floor CHECK (floor >= -2 AND floor <= 50)
);

COMMENT ON TABLE rooms IS 'Danh sách phòng họp có thể đặt';

-- =====================================================
-- ROOM BOOKINGS TABLE
-- =====================================================
CREATE TABLE room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Room & User
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Booking details
  title VARCHAR(200) NOT NULL,                -- Tiêu đề cuộc họp
  title_ja VARCHAR(200),                      -- Tiêu đề tiếng Nhật
  description TEXT,                           -- Mô tả
  purpose VARCHAR(100),                       -- Mục đích (meeting, training, interview...)
  
  -- Time
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE, -- Thời gian bắt đầu thực tế
  actual_end_time TIMESTAMP WITH TIME ZONE,   -- Thời gian kết thúc thực tế
  
  -- Attendees
  expected_attendees INTEGER DEFAULT 1,
  attendee_emails TEXT[],                     -- Danh sách email người tham dự
  
  -- Status
  status booking_status NOT NULL DEFAULT 'pending',
  
  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Cancellation
  cancelled_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Recurring booking
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(50),              -- daily, weekly, monthly
  recurring_end_date DATE,
  parent_booking_id UUID REFERENCES room_bookings(id),
  
  -- Notes
  notes TEXT,
  special_requirements TEXT,                  -- Yêu cầu đặc biệt
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_booking_time CHECK (end_time > start_time),
  CONSTRAINT valid_attendees CHECK (expected_attendees > 0)
);

COMMENT ON TABLE room_bookings IS 'Lịch đặt phòng họp';

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_floor ON rooms(floor);
CREATE INDEX idx_rooms_capacity ON rooms(capacity);
CREATE INDEX idx_rooms_active ON rooms(is_active);

CREATE INDEX idx_bookings_room ON room_bookings(room_id);
CREATE INDEX idx_bookings_user ON room_bookings(user_id);
CREATE INDEX idx_bookings_status ON room_bookings(status);
CREATE INDEX idx_bookings_time ON room_bookings(start_time, end_time);
-- CREATE INDEX idx_bookings_date ON room_bookings((start_time::date));

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for rooms
CREATE OR REPLACE FUNCTION update_room_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE TRIGGER trigger_update_room_timestamp
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamp();

CREATE TRIGGER trigger_update_booking_timestamp
  BEFORE UPDATE ON room_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_room_timestamp();

-- =====================================================
-- SEED DATA - PHÒNG HỌP
-- =====================================================

INSERT INTO rooms (code, name, name_ja, description, floor, building, capacity, min_capacity,
  has_projector, has_whiteboard, has_video_conference, has_audio_system, has_air_conditioner, has_tv_screen,
  other_equipment, status, requires_approval, max_booking_hours, advance_booking_days) VALUES

-- Tầng 1 - Phòng họp nhỏ
('MH-101', 'Phòng họp Sakura', '会議室 さくら', 
 'Phòng họp nhỏ phù hợp cho các cuộc họp nhóm 4-6 người', 
 1, 'Main Building', 6, 2,
 true, true, false, false, true, false,
 ARRAY['Bảng flip chart', 'Wifi tốc độ cao'],
 'available', false, 4, 14),

('MH-102', 'Phòng họp Fuji', '会議室 ふじ',
 'Phòng họp nhỏ với thiết bị họp video cơ bản',
 1, 'Main Building', 8, 2,
 true, true, true, true, true, false,
 ARRAY['Webcam HD', 'Micro không dây'],
 'available', false, 4, 14),

('MH-103', 'Phòng phỏng vấn A', '面接室 A',
 'Phòng dành cho phỏng vấn và trao đổi 1-1',
 1, 'Main Building', 4, 2,
 false, true, false, false, true, false,
 ARRAY['Bàn họp vuông'],
 'available', false, 2, 7),

-- Tầng 2 - Phòng họp trung bình
('MH-201', 'Phòng họp Momiji', '会議室 もみじ',
 'Phòng họp trung bình với đầy đủ thiết bị trình chiếu',
 2, 'Main Building', 12, 4,
 true, true, true, true, true, true,
 ARRAY['Bảng trắng thông minh', 'Apple TV', 'Micro hội nghị'],
 'available', false, 4, 14),

('MH-202', 'Phòng họp Bamboo', '会議室 たけ',
 'Phòng họp kiểu workshop với bàn ghế linh hoạt',
 2, 'Main Building', 15, 5,
 true, true, false, true, true, true,
 ARRAY['Bàn ghế di động', 'Bảng trắng di động x2'],
 'available', false, 6, 14),

('MH-203', 'Phòng đào tạo 1', 'トレーニングルーム 1',
 'Phòng đào tạo với máy tính cho học viên',
 2, 'Main Building', 20, 8,
 true, true, true, true, true, true,
 ARRAY['10 máy tính PC', 'Bảng điện tử', 'Hệ thống PA'],
 'available', true, 8, 21),

-- Tầng 3 - Phòng họp lớn
('MH-301', 'Phòng họp Taiyo', '会議室 たいよう',
 'Phòng họp lớn cho các cuộc họp cấp quản lý',
 3, 'Main Building', 25, 10,
 true, true, true, true, true, true,
 ARRAY['Hệ thống âm thanh chuyên nghiệp', 'Màn hình 85 inch', '2 micro không dây'],
 'available', true, 4, 21),

('MH-302', 'Phòng hội nghị Denso', 'デンソー会議室',
 'Phòng hội nghị chính cho các sự kiện quan trọng',
 3, 'Main Building', 50, 20,
 true, true, true, true, true, true,
 ARRAY['Sân khấu nhỏ', 'Hệ thống PA', 'Màn hình LED lớn', '4 micro không dây', 'Podium'],
 'available', true, 8, 30),

-- Tầng 4 - Phòng VIP & Đặc biệt
('MH-401', 'Phòng họp VIP', 'VIP会議室',
 'Phòng họp VIP dành cho khách hàng và đối tác quan trọng',
 4, 'Main Building', 10, 4,
 true, true, true, true, true, true,
 ARRAY['Nội thất cao cấp', 'Mini bar', 'Màn hình 65 inch'],
 'available', true, 4, 30),

('MH-402', 'Phòng họp Ban Giám đốc', '役員会議室',
 'Phòng họp dành cho Ban Giám đốc và cấp cao',
 4, 'Main Building', 15, 5,
 true, true, true, true, true, true,
 ARRAY['Bàn họp oval', 'Hệ thống bảo mật', '2 màn hình 55 inch'],
 'available', true, 4, 30),

-- Tòa nhà phụ - Workshop
('WS-101', 'Workshop Room A', 'ワークショップ A',
 'Phòng workshop với không gian mở',
 1, 'Workshop Building', 30, 10,
 true, true, false, true, true, true,
 ARRAY['Bàn làm việc nhóm x6', 'Bảng trắng x4', 'Vật liệu craft'],
 'available', false, 8, 14),

('WS-102', 'Workshop Room B', 'ワークショップ B',
 'Phòng workshop nhỏ cho brainstorming',
 1, 'Workshop Building', 15, 5,
 true, true, false, true, true, false,
 ARRAY['Bean bags', 'Standing desks', 'Post-it supplies'],
 'available', false, 6, 14);

-- =====================================================
-- VIEW: Available rooms with booking count
-- =====================================================
CREATE OR REPLACE VIEW v_rooms_availability AS
SELECT 
  r.*,
  COALESCE(
    (SELECT COUNT(*) FROM room_bookings rb 
     WHERE rb.room_id = r.id 
     AND rb.status IN ('confirmed', 'in_progress')
     AND rb.start_time >= CURRENT_DATE
     AND rb.start_time < CURRENT_DATE + INTERVAL '7 days'),
    0
  ) as bookings_this_week,
  COALESCE(
    (SELECT COUNT(*) FROM room_bookings rb 
     WHERE rb.room_id = r.id 
     AND rb.status IN ('confirmed', 'in_progress')
     AND DATE(rb.start_time) = CURRENT_DATE),
    0
  ) as bookings_today
FROM rooms r
WHERE r.is_active = true;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE '✓ Room Booking Schema Created!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables: rooms, room_bookings';
  RAISE NOTICE 'Rooms seeded: 13 meeting rooms';
  RAISE NOTICE '=====================================================';
END $$;
