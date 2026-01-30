/**
 * ROOM BOOKING API SERVICE
 * Frontend service for Room Booking System 
 */

import api from './api';
import {
  Room,
  RoomBooking,
  CreateBookingDTO,
  UpdateBookingDTO,
  GetBookingsParams,
  GetRoomsResponse,
  GetBookingsResponse,
  GetBookingByIdResponse,
  CreateBookingResponse,
  BulkApproveResponse,
  MEETING_PURPOSE_COLORS
} from '../types/room-booking.types';

const roomBookingService = {
  // =====================================================
  // ROOMS
  // =====================================================

  /**
   * Get all available meeting rooms
   */
  getRooms: async (): Promise<Room[]> => {
    const response = await api.get<GetRoomsResponse>('/room-bookings/rooms');
    return response.data.rooms;
  },

  // =====================================================
  // BOOKINGS
  // =====================================================

  /**
   * Get bookings with optional filters
   */
  getBookings: async (params?: GetBookingsParams): Promise<RoomBooking[]> => {
    const response = await api.get<GetBookingsResponse>('/room-bookings', { params });
    return response.data.bookings;
  },

  /**
   * Get current user's bookings
   */
  getMyBookings: async (params?: { status?: string; date_from?: string; date_to?: string }): Promise<RoomBooking[]> => {
    const response = await api.get<{ bookings: RoomBooking[] }>('/room-bookings/my', { params });
    return response.data.bookings;
  },

  /**
   * Get pending bookings for admin approval
   */
  getPendingBookings: async (): Promise<RoomBooking[]> => {
    console.log('🌐 API Request - getPendingBookings');
    try {
      const response = await api.get<GetBookingsResponse>('/room-bookings/pending');
      console.log('📥 API Response - getPendingBookings:', response);
      console.log('📦 Response data:', response.data);
      console.log('📋 Bookings array:', response.data?.bookings);

      // If response is valid, return it
      if (response.data?.bookings) {
        return response.data.bookings;
      }

      // Fallback: use getBookings with status filter
      console.log('⚠️ No bookings in response, trying fallback with getBookings...');
      return await roomBookingService.getBookings({ status: 'pending' });
    } catch (error) {
      console.error('❌ Error in getPendingBookings, trying fallback:', error);
      // Fallback: use getBookings with status filter
      return await roomBookingService.getBookings({ status: 'pending' });
    }
  },

  /**
   * Get booking by ID with full details and history
   */
  getBookingById: async (id: string): Promise<GetBookingByIdResponse> => {
    const response = await api.get<GetBookingByIdResponse>(`/room-bookings/${id}`);
    return response.data;
  },

  /**
   * Create new booking
   */
  createBooking: async (data: CreateBookingDTO): Promise<CreateBookingResponse> => {
    console.log('🌐 API Request - createBooking with data:', data);
    const response = await api.post<CreateBookingResponse>('/room-bookings', data);
    console.log('✅ API Response - createBooking:', response.data);
    return response.data;
  },

  /**
   * Update existing booking (owner only, pending status only)
   */
  updateBooking: async (id: string, data: UpdateBookingDTO): Promise<void> => {
    await api.put(`/room-bookings/${id}`, data);
  },

  /**
   * Approve booking (admin only)
   */
  approveBooking: async (id: string): Promise<void> => {
    await api.post(`/room-bookings/${id}/approve`);
  },

  /**
   * Reject booking (admin only)
   */
  rejectBooking: async (id: string, reason?: string): Promise<void> => {
    await api.post(`/room-bookings/${id}/reject`, { reason });
  },

  /**
   * Cancel booking (owner or admin)
   */
  cancelBooking: async (id: string): Promise<void> => {
    await api.delete(`/room-bookings/${id}`);
  },

  /**
   * Mark booking as completed (admin only)
   */
  completeBooking: async (id: string): Promise<void> => {
    await api.post(`/room-bookings/${id}/complete`);
  },

  /**
   * Bulk approve multiple bookings (admin only)
   */
  bulkApproveBookings: async (bookingIds: string[]): Promise<BulkApproveResponse> => {
    const response = await api.post<BulkApproveResponse>('/room-bookings/bulk-approve', {
      booking_ids: bookingIds
    });
    return response.data;
  },

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Get bookings for current week
   */
  getCurrentWeekBookings: async (): Promise<RoomBooking[]> => {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    return roomBookingService.getBookings({ week_number: weekNumber, year });
  },

  /**
   * Get bookings for a specific date range
   */
  getBookingsByDateRange: async (startDate: string, endDate: string): Promise<RoomBooking[]> => {
    return roomBookingService.getBookings({ date_from: startDate, date_to: endDate });
  },

  /**
   * Get bookings for a specific room
   */
  getRoomBookings: async (roomId: string, params?: GetBookingsParams): Promise<RoomBooking[]> => {
    return roomBookingService.getBookings({ ...params, room_id: roomId });
  },

  /**
   * Check if a time slot is available for booking
   */
  checkAvailability: async (
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    // Get bookings for the same day as startTime to check for conflicts
    const dateStr = startTime.split('T')[0];
    const bookings = await roomBookingService.getBookings({
      room_id: roomId,
      date_from: `${dateStr}T00:00:00Z`,
      date_to: `${dateStr}T23:59:59Z`
    });

    // Check for conflicts
    const hasConflict = bookings.some(booking => {
      // Skip the booking we're updating
      if (excludeBookingId && booking.id === excludeBookingId) {
        return false;
      }

      // Only check pending and confirmed bookings
      if (!['pending', 'confirmed', 'in_progress'].includes(booking.status)) {
        return false;
      }

      // Check time overlap
      return (
        (booking.start_time <= startTime && booking.end_time > startTime) ||
        (booking.start_time < endTime && booking.end_time >= endTime) ||
        (booking.start_time >= startTime && booking.end_time <= endTime)
      );
    });

    return !hasConflict;
  },

  /**
   * Format booking for calendar display
   */
  formatBookingForCalendar: (booking: RoomBooking) => {
    const startDateTime = new Date(booking.start_time);
    const endDateTime = new Date(booking.end_time);

    // Map purpose to color
    const color = booking.purpose ? MEETING_PURPOSE_COLORS[booking.purpose] : '#6B7280';

    return {
      id: booking.id,
      title: `${booking.room_code || ''} - ${booking.title}`,
      start: startDateTime,
      end: endDateTime,
      backgroundColor: color,
      borderColor: color,
      textColor: '#ffffff',
      extendedProps: {
        booking,
        room_code: booking.room_code,
        room_name: booking.room_name,
        status: booking.status
      }
    };
  }
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Calculate ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Format time for display (extract HH:mm from ISO timestamp or time string)
 */
export function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';

  // If it's already in HH:mm format (5 chars or HH:mm:ss)
  if (timeStr.length === 5 && timeStr.includes(':')) {
    return timeStr;
  }

  // Handle ISO timestamp format like "2026-01-14T09:00:00.000Z"
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) {
      return timeStr.substring(0, 5); // Fallback
    }
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return timeStr.substring(0, 5);
  }
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return 'Invalid Date';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format date for input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get start and end of week
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday

  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get time slots for a day (default: 8:00 - 18:00, 30min intervals)
 */
export function getTimeSlots(startHour = 8, endHour = 18, intervalMinutes = 30): string[] {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(timeStr);
    }
  }

  // Add end hour
  slots.push(`${String(endHour).padStart(2, '0')}:00`);

  return slots;
}

/**
 * Validate booking time
 */
export function validateBookingTime(startTime: string, endTime: string): { valid: boolean; error?: string } {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);

  if (start >= end) {
    return { valid: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu' };
  }

  const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes

  if (duration < 30) {
    return { valid: false, error: 'Thời gian đặt phòng tối thiểu là 30 phút' };
  }

  if (duration > 480) { // 8 hours
    return { valid: false, error: 'Thời gian đặt phòng tối đa là 8 giờ' };
  }

  return { valid: true };
}

export default roomBookingService;
