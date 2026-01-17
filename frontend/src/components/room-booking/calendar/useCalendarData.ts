/**
 * Room Booking Calendar - Custom Hook for Data Loading
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import roomBookingService from '../../../services/room-booking.service';
import { RoomBooking, Room, MEETING_PURPOSE_COLORS } from '../../../types/room-booking.types';
import { CalendarEvent } from './constants';
import { useTranslation } from "../../../contexts/LanguageContext";

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
  const { t } = useTranslation();

  const loadData = useCallback(async (startDate?: string, endDate?: string) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      console.log('🔄 Fetching rooms and bookings...', { startDate, endDate });

      // Fetch rooms
      let roomsData: Room[] = [];
      try {
        roomsData = await roomBookingService.getRooms();
        console.log('🏢 Loaded rooms:', roomsData?.length, roomsData);
        setRooms(roomsData || []);
      } catch (roomError: any) {
        console.error('❌ Error fetching rooms:', roomError);
        if (roomError.response) {
          console.error('🔍 Room Error Response Data:', roomError.response.data);
          toast.error(`Error loading rooms: ${roomError.response.data.message || roomError.message}`);
        }
        // Don't show toast for rooms error to avoid spamming if it's just one part failing
      }

      // Fetch bookings
      let bookingsData: RoomBooking[] = [];
      try {
        bookingsData = startDate && endDate
          ? await roomBookingService.getBookingsByDateRange(startDate, endDate)
          : await roomBookingService.getCurrentWeekBookings();

        console.log('📅 Loaded bookings:', bookingsData?.length, bookingsData);
        setBookings(bookingsData || []);

        const calendarEvents = transformBookingsToEvents(bookingsData || []);
        setEvents(calendarEvents);
      } catch (bookingError) {
        console.error('❌ Error fetching bookings:', bookingError);
        toast.error(t('booking.no_calendar_bookings'));
      }

      if (startDate && endDate) {
        setCurrentDateRange({ start: startDate, end: endDate });
      }
    } catch (error) {
      console.error('❌ Critical error in useCalendarData:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [t]);

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
    const color = MEETING_PURPOSE_COLORS[booking.purpose || 'other'];

    return {
      id: booking.id.toString(),
      title: `${booking.room_name || 'Room'} - ${booking.title}`,
      start: booking.start_time,
      end: booking.end_time,
      allDay: false,
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        bookingId: booking.id,
        roomId: booking.room_id,
        roomName: booking.room_name || '',
        purpose: booking.purpose || 'meeting',
        status: booking.status,
        description: booking.description,
        expectedAttendees: booking.expected_attendees
      }
    };
  });
}
