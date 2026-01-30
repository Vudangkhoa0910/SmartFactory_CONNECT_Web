/**
 * ROOM BOOKING SYSTEM TYPES
 * TypeScript interfaces for Room Booking System
 */

// Meeting Purposes (formerly MeetingType)
export type MeetingPurpose =
  | 'meeting'           // Họp thường kỳ
  | 'training'          // Đào tạo
  | 'interview'         // Phỏng vấn
  | 'workshop'          // Workshop
  | 'presentation'      // Thuyết trình/Báo cáo
  | 'brainstorming'     // Brainstorm ý tưởng
  | 'other';            // Khác

// Booking Status
export type BookingStatus =
  | 'pending'        // Chờ duyệt
  | 'confirmed'      // Đã xác nhận
  | 'in_progress'    // Đang diễn ra
  | 'completed'      // Hoàn thành
  | 'cancelled'       // Đã hủy
  | 'rejected';      // Bị từ chối (Note: in DB schema reject is not in enum, but rejection_reason is there. Wait, let me check the enum in SQL again.)

// Re-checking SQL enum:
// CREATE TYPE booking_status AS ENUM (
//   'pending',        -- Chờ duyệt
//   'confirmed',      -- Đã xác nhận
//   'in_progress',    -- Đang diễn ra
//   'completed',      -- Hoàn thành
//   'cancelled'       -- Đã hủy
// );
// SQL doesn't have 'rejected', but it has rejection_reason. 
// Usually 'rejected' is either a status or we use 'cancelled' with a reason.
// But the user's provided structure has 'status' as 'booking_status'.
// Let's stick to what's in the SQL file or if the user explicitly added 'rejected' in their prompt description?
// User prompt: status | booking_status | | not null | 'pending'::booking_status
// I'll use the SQL definition but maybe add rejected if needed by UI.

// Room Status
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'unavailable';

// Room Interface
export interface Room {
  id: string;
  code: string;
  name: string;
  name_ja?: string;
  description?: string;
  description_ja?: string;
  floor: number;
  building?: string;
  location_details?: string;
  capacity: number;
  min_capacity?: number;
  has_projector: boolean;
  has_whiteboard: boolean;
  has_video_conference: boolean;
  has_audio_system: boolean;
  has_air_conditioner: boolean;
  has_tv_screen: boolean;
  other_equipment?: string[];
  image_url?: string;
  thumbnail_url?: string;
  status: RoomStatus;
  is_active: boolean;
  requires_approval: boolean;
  max_booking_hours?: number;
  advance_booking_days?: number;
  created_at: string;
  updated_at: string;
}

// Room Booking Interface
export interface RoomBooking {
  id: string;
  room_id: string;
  user_id: string;
  department_id?: string;

  // Basic info
  title: string;
  title_ja?: string;
  description?: string;
  purpose?: MeetingPurpose;

  // Time (Full ISO timestamps)
  start_time: string;
  end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;

  // Attendees
  expected_attendees: number;
  attendee_emails?: string[];

  // Status & Approval
  status: BookingStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  // Cancellation
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  // Recurring
  is_recurring: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  parent_booking_id?: string;

  // Additional fields
  notes?: string;
  special_requirements?: string;

  // Virtual/Joined fields (from DB views or manual joins)
  room_code?: string;
  room_name?: string;
  booked_by_name?: string;
  department_name?: string;
  approved_by_name?: string;
  cancelled_by_name?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Legacy/UI Compatibility
  color?: string; // We can derive this from purpose in frontend
}

// Create Booking DTO
export interface CreateBookingDTO {
  room_id: string;
  title: string;
  title_ja?: string;
  description?: string;
  purpose?: MeetingPurpose;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  expected_attendees: number;
  attendee_emails?: string[];
  is_recurring?: boolean;
  recurring_pattern?: string;
  recurring_end_date?: string;
  notes?: string;
  special_requirements?: string;
}

// Update Booking DTO
export interface UpdateBookingDTO {
  room_id?: string;
  title?: string;
  title_ja?: string;
  description?: string;
  purpose?: MeetingPurpose;
  start_time?: string;
  end_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  expected_attendees?: number;
  attendee_emails?: string[];
  status?: BookingStatus;
  rejection_reason?: string;
  cancellation_reason?: string;
  notes?: string;
  special_requirements?: string;
}

// Booking History Entry
export interface BookingHistoryEntry {
  id: string;
  booking_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'cancelled' | 'status_change';
  performed_by_user_id?: string;
  performed_by_name?: string;
  details: {
    old_status?: BookingStatus;
    new_status?: BookingStatus;
    rejection_reason?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

// Meeting Purpose Info (for UI)
export interface MeetingPurposeInfo {
  value: MeetingPurpose;
  label: string;
  color: string;
  icon?: string;
}

// Meeting Purpose Color Mapping
export const MEETING_PURPOSE_COLORS: Record<MeetingPurpose, string> = {
  meeting: '#3B82F6',        // Blue
  training: '#F59E0B',       // Amber
  interview: '#EF4444',      // Red
  workshop: '#06B6D4',       // Cyan
  presentation: '#84CC16',   // Lime
  brainstorming: '#14B8A6',  // Teal
  other: '#6B7280'           // Gray
};

// Meeting Purpose Labels (Vietnamese / Japanese)
export const MEETING_PURPOSE_LABELS: Record<MeetingPurpose, string> = {
  meeting: 'Họp thường kỳ / 定例会議',
  training: 'Đào tạo / 研修',
  interview: 'Phỏng vấn / 面接',
  workshop: 'Workshop / ワークショップ',
  presentation: 'Thuyết trình / プレゼンテーション',
  brainstorming: 'Brainstorm / ブレインストーミング',
  other: 'Khác / その他'
};

// Booking Status Labels (Vietnamese / Japanese)
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ duyệt / 承認待ち',
  confirmed: 'Đã xác nhận / 承認済み',
  in_progress: 'Đang diễn ra / 進行中',
  completed: 'Đã hoàn thành / 完了',
  cancelled: 'Đã hủy / キャンセル済み',
  rejected: 'Bị từ chối / 却下済み'
};

// Get all meeting purpose options for select/dropdown
export const MEETING_PURPOSE_OPTIONS: MeetingPurposeInfo[] = [
  { value: 'meeting', label: 'Họp thường kỳ / 定例会議', color: '#3B82F6', icon: '👥' },
  { value: 'training', label: 'Đào tạo / 研修', color: '#F59E0B', icon: '📚' },
  { value: 'interview', label: 'Phỏng vấn / 面接', color: '#EF4444', icon: '💼' },
  { value: 'workshop', label: 'Workshop / ワークショップ', color: '#06B6D4', icon: '🎓' },
  { value: 'presentation', label: 'Thuyết trình / プレゼンテーション', color: '#84CC16', icon: '📊' },
  { value: 'brainstorming', label: 'Brainstorm / ブレインストーミング', color: '#14B8A6', icon: '💡' },
  { value: 'other', label: 'Khác / その他', color: '#6B7280', icon: '📝' }
];

// Calendar Event (for full calendar library)
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    booking: RoomBooking;
    room_code: string;
    room_name: string;
    status: BookingStatus;
  };
}

// Query params for getBookings API
export interface GetBookingsParams {
  week_number?: number;
  year?: number;
  room_id?: string;
  status?: BookingStatus;
  date_from?: string;
  date_to?: string;
}

// API Response Types
export interface GetRoomsResponse {
  rooms: Room[];
}

export interface GetBookingsResponse {
  bookings: RoomBooking[];
}

export interface GetBookingByIdResponse {
  booking: RoomBooking;
  history: BookingHistoryEntry[];
}

export interface CreateBookingResponse {
  message: string;
  booking_id: string;
}

export interface BulkApproveResponse {
  message: string;
  approved_count: number;
}
