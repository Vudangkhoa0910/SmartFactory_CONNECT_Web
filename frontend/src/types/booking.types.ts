/**
 * Room Booking Types - SmartFactory CONNECT
 * Types for Meeting Room Booking System
 */

// Status & Types
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type RoomType = 'meeting' | 'conference' | 'training' | 'video_call' | 'workshop';
export type TimeSlot = '08:00' | '08:30' | '09:00' | '09:30' | '10:00' | '10:30' | '11:00' | '11:30' | '12:00' | '12:30' | '13:00' | '13:30' | '14:00' | '14:30' | '15:00' | '15:30' | '16:00' | '16:30' | '17:00' | '17:30';

// Labels
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
  completed: 'Hoàn thành',
  no_show: 'Không đến',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  meeting: 'Phòng họp',
  conference: 'Phòng hội nghị',
  training: 'Phòng đào tạo',
  video_call: 'Phòng video call',
  workshop: 'Phòng workshop',
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: 'Không lặp',
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  biweekly: '2 tuần/lần',
  monthly: 'Hàng tháng',
};

// Colors
export const BOOKING_STATUS_COLORS: Record<BookingStatus, { text: string; bg: string; border: string }> = {
  pending: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  confirmed: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
  cancelled: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
  completed: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-500' },
  no_show: { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-500' },
};

// Room
export interface Room {
  id: string;
  name: string;
  code: string;
  floor: string;
  building?: string;
  type: RoomType;
  capacity: number;
  description?: string;
  
  // Amenities
  amenities: RoomAmenity[];
  
  // Images
  images?: string[];
  thumbnail?: string;
  
  // Availability
  is_active: boolean;
  operating_hours?: {
    start: string;
    end: string;
  };
  blocked_dates?: string[];
  
  // Approval
  requires_approval: boolean;
  approver_ids?: string[];
  
  // Stats
  utilization_rate?: number;
  total_bookings?: number;
  
  created_at: string;
  updated_at?: string;
}

export type RoomAmenity = 
  | 'projector'
  | 'screen'
  | 'whiteboard'
  | 'video_conference'
  | 'phone_conference'
  | 'air_conditioning'
  | 'wifi'
  | 'computer'
  | 'webcam'
  | 'microphone'
  | 'speaker'
  | 'coffee_service';

export const ROOM_AMENITY_LABELS: Record<RoomAmenity, string> = {
  projector: 'Máy chiếu',
  screen: 'Màn hình',
  whiteboard: 'Bảng trắng',
  video_conference: 'Video conference',
  phone_conference: 'Phone conference',
  air_conditioning: 'Điều hòa',
  wifi: 'WiFi',
  computer: 'Máy tính',
  webcam: 'Webcam',
  microphone: 'Microphone',
  speaker: 'Loa',
  coffee_service: 'Phục vụ cà phê',
};

// Booking
export interface Booking {
  id: string;
  booking_number: string;
  title: string;
  description?: string;
  
  // Room
  room_id: string;
  room_name: string;
  room_code: string;
  room_floor?: string;
  
  // Time
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_minutes: number;
  
  // Recurrence
  recurrence_type: RecurrenceType;
  recurrence_end_date?: string;
  recurrence_parent_id?: string;
  
  // Status
  status: BookingStatus;
  
  // Organizer
  organizer_id: string;
  organizer_name: string;
  organizer_email?: string;
  organizer_department?: string;
  
  // Attendees
  attendees: BookingAttendee[];
  attendees_count: number;
  external_attendees?: string[];
  
  // Approval
  requires_approval: boolean;
  approved_by_id?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  
  // Additional
  meeting_link?: string;
  notes?: string;
  is_private?: boolean;
  
  // Reminder
  reminder_sent?: boolean;
  reminder_minutes_before?: number;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
  cancelled_by_id?: string;
  cancelled_reason?: string;
}

export interface BookingAttendee {
  user_id: string;
  user_name: string;
  user_email?: string;
  user_avatar?: string;
  response_status: 'pending' | 'accepted' | 'declined' | 'tentative';
  is_required: boolean;
}

// Time Slot
export interface TimeSlotAvailability {
  time: string;
  is_available: boolean;
  booking_id?: string;
  booking_title?: string;
}

export interface RoomAvailability {
  room_id: string;
  room_name: string;
  date: string;
  slots: TimeSlotAvailability[];
}

// Calendar View
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    room_id: string;
    room_name: string;
    status: BookingStatus;
    organizer_name: string;
    attendees_count: number;
  };
  color: string;
}

// Filters
export interface BookingFilters {
  search?: string;
  room_id?: string;
  room_type?: RoomType | RoomType[];
  status?: BookingStatus | BookingStatus[];
  date?: string;
  date_from?: string;
  date_to?: string;
  organizer_id?: string;
  attendee_id?: string;
  floor?: string;
  building?: string;
  min_capacity?: number;
  amenities?: RoomAmenity[];
  page?: number;
  limit?: number;
}

export interface RoomSearchFilters {
  date: string;
  start_time: string;
  end_time: string;
  min_capacity?: number;
  amenities?: RoomAmenity[];
  floor?: string;
  building?: string;
  room_type?: RoomType;
}

// Statistics
export interface BookingStats {
  total_bookings: number;
  by_status: Record<BookingStatus, number>;
  by_room: {
    room_id: string;
    room_name: string;
    count: number;
    hours: number;
    utilization_rate: number;
  }[];
  peak_hours: {
    hour: number;
    count: number;
  }[];
  peak_days: {
    day: string;
    count: number;
  }[];
  avg_duration_minutes: number;
  no_show_rate: number;
  cancellation_rate: number;
}

export interface RoomUtilization {
  room_id: string;
  room_name: string;
  period: {
    date: string;
    total_hours: number;
    booked_hours: number;
    utilization_rate: number;
  }[];
  avg_utilization: number;
}

// API Responses
export interface RoomsResponse {
  success: boolean;
  data: Room[];
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailabilityResponse {
  success: boolean;
  data: RoomAvailability[];
}

// Actions
export interface CreateBookingData {
  room_id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  attendee_ids?: string[];
  external_attendees?: string[];
  recurrence_type?: RecurrenceType;
  recurrence_end_date?: string;
  meeting_link?: string;
  notes?: string;
  is_private?: boolean;
  reminder_minutes_before?: number;
}

export interface UpdateBookingData {
  title?: string;
  description?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  attendee_ids?: string[];
  external_attendees?: string[];
  meeting_link?: string;
  notes?: string;
  is_private?: boolean;
  update_series?: boolean; // For recurring bookings
}

export interface CancelBookingData {
  reason: string;
  cancel_series?: boolean; // For recurring bookings
}

export interface AttendeeResponseData {
  response_status: 'accepted' | 'declined' | 'tentative';
}
