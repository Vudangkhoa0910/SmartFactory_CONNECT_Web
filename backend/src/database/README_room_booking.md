# Room Booking Database Schema

## Tổng quan

Schema hệ thống đặt phòng họp cho SmartFactory CONNECT, bao gồm quản lý phòng họp và lịch đặt phòng.

## Cấu trúc Database

### 1. ENUM Types

#### `room_status`
```sql
'available'      -- Sẵn sàng sử dụng
'occupied'       -- Đang sử dụng
'maintenance'    -- Đang bảo trì
'unavailable'    -- Không khả dụng
```

#### `booking_status`
```sql
'pending'        -- Chờ duyệt
'confirmed'      -- Đã xác nhận
'in_progress'    -- Đang diễn ra
'completed'      -- Hoàn thành
'cancelled'      -- Đã hủy
```

### 2. Tables

#### `rooms` - Danh sách phòng họp
**Cột chính:**
- `id` (UUID) - Primary key
- `code` (VARCHAR) - Mã phòng (VD: MH-101, MH-201)
- `name`, `name_ja` - Tên phòng (VN/JP)
- `floor` - Tầng (từ -2 đến 50)
- `building` - Tòa nhà
- `capacity`, `min_capacity` - Sức chứa tối đa/tối thiểu
- `has_*` - Các thiết bị (projector, whiteboard, video_conference, etc.)
- `status` - Trạng thái phòng (room_status enum)
- `requires_approval` - Cần duyệt hay không
- `max_booking_hours` - Số giờ đặt tối đa
- `advance_booking_days` - Đặt trước tối đa bao nhiêu ngày

**Constraints:**
- `valid_capacity`: capacity > 0 AND <= 100
- `valid_floor`: floor >= -2 AND <= 50

**Triggers:**
- `trigger_update_room_timestamp` - Tự động cập nhật `updated_at`

#### `room_bookings` - Lịch đặt phòng
**Cột chính:**
- `id` (UUID) - Primary key
- `room_id` (UUID) - FK tới `rooms`
- `user_id` (UUID) - FK tới `users`
- `department_id` (UUID) - FK tới `departments`
- `title`, `title_ja` - Tiêu đề cuộc họp
- `start_time`, `end_time` - Thời gian đặt
- `actual_start_time`, `actual_end_time` - Thời gian thực tế
- `expected_attendees` - Số người dự kiến
- `status` - Trạng thái booking (booking_status enum)
- `approved_by`, `approved_at` - Thông tin phê duyệt
- `cancelled_by`, `cancelled_at`, `cancellation_reason` - Thông tin hủy
- `is_recurring` - Đặt lịch định kỳ hay không
- `recurring_pattern` - Mẫu lặp lại (daily, weekly, monthly)
- `parent_booking_id` - ID của booking gốc (cho recurring)

**Constraints:**
- `valid_booking_time`: end_time > start_time
- `valid_attendees`: expected_attendees > 0

**Triggers:**
- `trigger_update_booking_timestamp` - Tự động cập nhật `updated_at`

### 3. Views

#### `v_rooms_availability`
View hiển thị tình trạng phòng với số lượng booking:
- Tất cả thông tin từ bảng `rooms`
- `bookings_this_week` - Số booking trong tuần này
- `bookings_today` - Số booking hôm nay

**Chỉ hiển thị các phòng active** (`is_active = true`)

### 4. Indexes

**Rooms:**
- `idx_rooms_status` - Index trên status
- `idx_rooms_floor` - Index trên floor  
- `idx_rooms_capacity` - Index trên capacity
- `idx_rooms_active` - Index trên is_active

**Room Bookings:**
- `idx_bookings_room` - Index trên room_id
- `idx_bookings_user` - Index trên user_id
- `idx_bookings_status` - Index trên status
- `idx_bookings_time` - Index trên (start_time, end_time)
- `idx_bookings_date` - Index trên DATE(start_time)

## Dữ liệu mẫu (Seed Data)

Hệ thống đã tạo sẵn **12 phòng họp**:

### Tầng 1 - Main Building
- **MH-101** - Phòng họp Sakura (6 người)
- **MH-102** - Phòng họp Fuji (8 người)
- **MH-103** - Phòng phỏng vấn A (4 người)

### Tầng 2 - Main Building
- **MH-201** - Phòng họp Momiji (12 người)
- **MH-202** - Phòng họp Bamboo (15 người) 
- **MH-203** - Phòng đào tạo 1 (20 người)

### Tầng 3 - Main Building
- **MH-301** - Phòng họp Taiyo (25 người)
- **MH-302** - Phòng hội nghị Denso (50 người)

### Tầng 4 - Main Building
- **MH-401** - Phòng họp VIP (10 người)
- **MH-402** - Phòng họp Ban Giám đốc (15 người)

### Workshop Building
- **WS-101** - Workshop Room A (30 người)
- **WS-102** - Workshop Room B (15 người)

## Cách sử dụng

### Import Schema vào Database

**Cách 1: Từ file (Khuyến nghị trên Windows PowerShell)**
```powershell
# Copy file vào container
docker cp backend/src/database/schema_room_booking.sql smartfactory_database:/tmp/schema_room_booking.sql

# Import
docker exec smartfactory_database psql -U smartfactory -d smartfactory_db -f /tmp/schema_room_booking.sql
```

**Cách 2: Pipe từ file local (PowerShell)**
```powershell
Get-Content backend/src/database/schema_room_booking.sql | docker exec -i smartfactory_database psql -U smartfactory -d smartfactory_db
```

**Cách 3: Bash/Linux**
```bash
docker exec -i smartfactory_database psql -U smartfactory -d smartfactory_db < backend/src/database/schema_room_booking.sql
```

### Kiểm tra kết quả

```sql
-- Xem danh sách bảng
\dt

-- Xem danh sách ENUM types
\dT+

-- Xem danh sách views
\dv

-- Kiểm tra số phòng đã tạo
SELECT COUNT(*) FROM rooms;

-- Xem danh sách phòng
SELECT code, name, floor, capacity, status FROM rooms ORDER BY floor, code;

-- Xem thông tin chi tiết bảng
\d+ rooms
\d+ room_bookings
```

## Queries thường dùng

### Lấy danh sách phòng có sẵn
```sql
SELECT * FROM rooms 
WHERE status = 'available' 
  AND is_active = true
ORDER BY floor, code;
```

### Lấy phòng theo sức chứa
```sql
SELECT * FROM rooms 
WHERE capacity >= 10 
  AND status = 'available'
  AND is_active = true;
```

### Kiểm tra phòng trống trong khoảng thời gian
```sql
SELECT r.* FROM rooms r
WHERE r.id NOT IN (
  SELECT room_id FROM room_bookings
  WHERE status IN ('confirmed', 'in_progress')
    AND start_time < '2026-01-15 14:00:00+07'
    AND end_time > '2026-01-15 10:00:00+07'
)
AND r.is_active = true
AND r.status = 'available';
```

### Lấy booking sắp tới
```sql
SELECT 
  rb.*,
  r.code as room_code,
  r.name as room_name,
  u.full_name as booked_by
FROM room_bookings rb
JOIN rooms r ON rb.room_id = r.id
JOIN users u ON rb.user_id = u.id
WHERE rb.start_time >= NOW()
  AND rb.status IN ('confirmed', 'pending')
ORDER BY rb.start_time;
```

### Thống kê sử dụng phòng
```sql
SELECT 
  r.code,
  r.name,
  COUNT(rb.id) as total_bookings,
  COUNT(CASE WHEN rb.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN rb.status = 'cancelled' THEN 1 END) as cancelled
FROM rooms r
LEFT JOIN room_bookings rb ON r.id = rb.room_id
GROUP BY r.id, r.code, r.name
ORDER BY total_bookings DESC;
```

## Lưu ý kỹ thuật

### PostgreSQL 15+ Compatibility
- Function `update_room_timestamp()` được đánh dấu `VOLATILE` vì sử dụng `CURRENT_TIMESTAMP`
- View `v_rooms_availability` sử dụng `CURRENT_DATE` - hoạt động bình thường trong views

### Cascade Deletes
- Xóa room sẽ cascade xóa tất cả bookings
- Xóa user/department sẽ cascade/set null tương ứng

### Recurring Bookings
- Sử dụng `parent_booking_id` để link các booking lặp lại
- `recurring_pattern`: 'daily', 'weekly', 'monthly'
- `recurring_end_date`: Ngày kết thúc chuỗi lặp

## API Endpoints (Tham khảo)

Các endpoint nên được implement trong backend:

- `GET /api/room-bookings/rooms` - Lấy danh sách phòng
- `GET /api/room-bookings/rooms/:id` - Chi tiết phòng
- `GET /api/room-bookings/rooms/available` - Phòng có sẵn
- `POST /api/room-bookings` - Tạo booking mới
- `GET /api/room-bookings` - Lấy danh sách bookings
- `GET /api/room-bookings/:id` - Chi tiết booking
- `PUT /api/room-bookings/:id` - Cập nhật booking
- `DELETE /api/room-bookings/:id` - Hủy booking
- `POST /api/room-bookings/:id/approve` - Phê duyệt booking
- `POST /api/room-bookings/:id/reject` - Từ chối booking

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-14  
**Author:** SmartFactory CONNECT Team
