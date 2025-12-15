/**
 * ROOM BOOKING SYSTEM TYPES
 * TypeScript interfaces for Room Booking System
 */

// Meeting Types
export type MeetingType =
  | 'department_meeting'    // Họp phòng ban
  | 'team_standup'         // Họp đứng team
  | 'project_review'       // Họp review dự án
  | 'training_session'     // Đào tạo nội bộ
  | 'client_meeting'       // Gặp khách hàng/đối tác
  | 'interview'            // Phỏng vấn tuyển dụng
  | 'workshop'             // Workshop/Hội thảo
  | 'company_event'        // Sự kiện công ty
  | 'celebration'          // Sinh nhật/Kỷ niệm
  | 'technical_discussion' // Thảo luận kỹ thuật
  | 'brainstorming'        // Brainstorm ý tưởng
  | 'presentation'         // Thuyết trình/Báo cáo
  | 'other';               // Khác

// Booking Status
export type BookingStatus =
  | 'pending'    // Chờ duyệt
  | 'confirmed'  // Đã xác nhận
  | 'cancelled'  // Đã hủy
  | 'rejected'   // Bị từ chối
  | 'completed'; // Đã hoàn thành

// Room Facilities
export type RoomFacility =
  | 'projector'
  | 'whiteboard'
  | 'video_conference'
  | 'sound_system'
  | 'microphone'
  | 'air_conditioner'
  | 'wifi';

// Room Interface
export interface Room {
  id: string;
  room_code: string;
  room_name: string;
  capacity: number;
  location: string;
  facilities: RoomFacility[];
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Room Booking Interface
export interface RoomBooking {
  id: string;
  room_id: string;
  room_code?: string;
  room_name?: string;
  title: string;
  description?: string;
  meeting_type: MeetingType;
  attendees_count: number;
  booking_date: string; // ISO date string
  start_time: string;   // HH:mm format
  end_time: string;     // HH:mm format
  week_number: number;
  year: number;
  booked_by_user_id: string;
  booked_by_name: string;
  booked_by_email?: string;
  department_id?: string;
  department_name?: string;
  status: BookingStatus;
  approved_by_user_id?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  color: string; // Hex color code
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Booking History Entry
export interface BookingHistoryEntry {
  id: string;
  booking_id: string;
  action: 'created' | 'updated' | 'approved' | 'rejected' | 'cancelled';
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

// Create Booking DTO
export interface CreateBookingDTO {
  room_id: string;
  title: string;
  description?: string;
  meeting_type: MeetingType;
  attendees_count: number;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:mm
  end_time: string;     // HH:mm
  color?: string;
  notes?: string;
}

// Update Booking DTO
export interface UpdateBookingDTO {
  room_id?: string;
  title?: string;
  description?: string;
  meeting_type?: MeetingType;
  attendees_count?: number;
  booking_date?: string;
  start_time?: string;
  end_time?: string;
  color?: string;
  notes?: string;
}

// Meeting Type Info (for UI)
export interface MeetingTypeInfo {
  value: MeetingType;
  label: string;
  color: string;
  icon?: string;
}

// Meeting Type Color Mapping
export const MEETING_TYPE_COLORS: Record<MeetingType, string> = {
  department_meeting: '#3B82F6',    // Blue
  team_standup: '#10B981',          // Green
  project_review: '#8B5CF6',        // Purple
  training_session: '#F59E0B',      // Amber
  client_meeting: '#EC4899',        // Pink
  interview: '#EF4444',             // Red
  workshop: '#06B6D4',              // Cyan
  company_event: '#F97316',         // Orange
  celebration: '#A855F7',           // Violet
  technical_discussion: '#6366F1',  // Indigo
  brainstorming: '#14B8A6',         // Teal
  presentation: '#84CC16',          // Lime
  other: '#6B7280'                  // Gray
};

// Meeting Type Labels (Vietnamese)
export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  department_meeting: 'Họp phòng ban',
  team_standup: 'Họp đứng team',
  project_review: 'Họp review dự án',
  training_session: 'Đào tạo nội bộ',
  client_meeting: 'Gặp khách hàng/đối tác',
  interview: 'Phỏng vấn tuyển dụng',
  workshop: 'Workshop/Hội thảo',
  company_event: 'Sự kiện công ty',
  celebration: 'Sinh nhật/Kỷ niệm',
  technical_discussion: 'Thảo luận kỹ thuật',
  brainstorming: 'Brainstorm ý tưởng',
  presentation: 'Thuyết trình/Báo cáo',
  other: 'Khác'
};

// Booking Status Labels (Vietnamese)
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  rejected: 'Bị từ chối',
  completed: 'Đã hoàn thành'
};

// Get all meeting type options for select/dropdown
export const MEETING_TYPE_OPTIONS: MeetingTypeInfo[] = [
  { value: 'department_meeting', label: 'Họp phòng ban', color: '#3B82F6', icon: '👥' },
  { value: 'team_standup', label: 'Họp đứng team', color: '#10B981', icon: '🏃' },
  { value: 'project_review', label: 'Họp review dự án', color: '#8B5CF6', icon: '📋' },
  { value: 'training_session', label: 'Đào tạo nội bộ', color: '#F59E0B', icon: '📚' },
  { value: 'client_meeting', label: 'Gặp khách hàng/đối tác', color: '#EC4899', icon: '🤝' },
  { value: 'interview', label: 'Phỏng vấn tuyển dụng', color: '#EF4444', icon: '💼' },
  { value: 'workshop', label: 'Workshop/Hội thảo', color: '#06B6D4', icon: '🎓' },
  { value: 'company_event', label: 'Sự kiện công ty', color: '#F97316', icon: '🎉' },
  { value: 'celebration', label: 'Sinh nhật/Kỷ niệm', color: '#A855F7', icon: '🎂' },
  { value: 'technical_discussion', label: 'Thảo luận kỹ thuật', color: '#6366F1', icon: '💻' },
  { value: 'brainstorming', label: 'Brainstorm ý tưởng', color: '#14B8A6', icon: '💡' },
  { value: 'presentation', label: 'Thuyết trình/Báo cáo', color: '#84CC16', icon: '📊' },
  { value: 'other', label: 'Khác', color: '#6B7280', icon: '📝' }
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
