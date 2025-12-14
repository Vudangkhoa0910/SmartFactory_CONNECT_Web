/**
 * Room Booking Calendar - Custom Hook for Data Loading
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import roomBookingService from '../../../services/room-booking.service';
import { RoomBooking, Room, MEETING_TYPE_COLORS } from '../../../types/room-booking.types';
import { CalendarEvent } from './constants';

interface UseCalendarDataReturn {
  rooms: Room[];
  bookings: RoomBooking[];
  events: CalendarEvent[];
  loading: boolean;
  currentDateRange: { start: string; end: string } | null;
  loadData: (startDate?: string, endDate?: string) => Promise<void>;
}

export function useCalendarData(): UseCalendarDataReturn {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string } | null>(null);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async (startDate?: string, endDate?: string) => {
    console.log('🔄 loadData called with:', { startDate, endDate });
    if (isLoadingRef.current) return;
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      
      const [roomsData, bookingsData] = await Promise.all([
        roomBookingService.getRooms(),
        startDate && endDate 
          ? roomBookingService.getBookingsByDateRange(startDate, endDate)
          : roomBookingService.getCurrentWeekBookings()
      ]);
      
      console.log('🏢 API returned rooms:', roomsData.length, roomsData);
      console.log('📅 API returned bookings:', bookingsData.length, bookingsData);
      
      setRooms(roomsData);
      setBookings(bookingsData);
      
      const calendarEvents = transformBookingsToEvents(bookingsData);
      console.log('🎯 Calendar events created:', calendarEvents.length, calendarEvents);
      
      setEvents(calendarEvents);
      
      if (startDate && endDate) {
        setCurrentDateRange({ start: startDate, end: endDate });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu đặt phòng');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const startStr = firstDay.toISOString().split('T')[0];
    const endStr = lastDay.toISOString().split('T')[0];
    setCurrentDateRange({ start: startStr, end: endStr });
    loadData(startStr, endStr);
  }, [loadData]);

  return { rooms, bookings, events, loading, currentDateRange, loadData };
}

function transformBookingsToEvents(bookings: RoomBooking[]): CalendarEvent[] {
  return bookings.map((booking) => {
    const dateOnly = booking.booking_date.split('T')[0];
    console.log('🔍 Processing booking:', booking.id, 'booking_date:', booking.booking_date, 'dateOnly:', dateOnly, 'start_time:', booking.start_time);
    
    return {
      id: booking.id.toString(),
      title: `${booking.room_name || 'Unknown'} - ${booking.title}`,
      start: `${dateOnly}T${booking.start_time}`,
      end: `${dateOnly}T${booking.end_time}`,
      allDay: false,
      backgroundColor: MEETING_TYPE_COLORS[booking.meeting_type] || '#3B82F6',
      borderColor: MEETING_TYPE_COLORS[booking.meeting_type] || '#3B82F6',
      extendedProps: {
        bookingId: booking.id,
        roomId: booking.room_id,
        roomName: booking.room_name || '',
        meetingType: booking.meeting_type,
        status: booking.status,
        description: booking.description,
        attendeesCount: booking.attendees_count
      }
    };
  });
}
