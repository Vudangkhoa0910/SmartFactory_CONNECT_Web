/**
 * Room Booking Calendar - Form State Hook
 */
import { useState, useCallback } from 'react';
import { MeetingType, Room, RoomBooking } from '../../../types/room-booking.types';

export interface BookingFormState {
  eventTitle: string;
  eventDescription: string;
  eventStartDate: string;
  eventStartTime: string;
  eventEndTime: string;
  selectedRoom: number;
  meetingType: MeetingType;
  attendeesCount: number;
  selectedBooking: RoomBooking | null;
}

export interface UseBookingFormReturn extends BookingFormState {
  setEventTitle: (value: string) => void;
  setEventDescription: (value: string) => void;
  setEventStartDate: (value: string) => void;
  setEventStartTime: (value: string) => void;
  setEventEndTime: (value: string) => void;
  setSelectedRoom: (value: number) => void;
  setMeetingType: (value: MeetingType) => void;
  setAttendeesCount: (value: number) => void;
  setSelectedBooking: (value: RoomBooking | null) => void;
  resetForm: (rooms: Room[]) => void;
  populateFromBooking: (booking: RoomBooking) => void;
}

export function useBookingForm(): UseBookingFormReturn {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [selectedRoom, setSelectedRoom] = useState<number>(0);
  const [meetingType, setMeetingType] = useState<MeetingType>('department_meeting');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);

  const resetForm = useCallback((rooms: Room[]) => {
    setEventTitle('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setMeetingType('department_meeting');
    setAttendeesCount(1);
    setSelectedBooking(null);
    
    console.log('🏢 Rooms available in reset:', rooms.length, rooms);
    if (rooms.length > 0) {
      console.log('✅ Setting default room:', rooms[0].id, rooms[0].room_name);
      setSelectedRoom(rooms[0].id);
    } else {
      console.log('⚠️ No rooms available yet, keeping selectedRoom as 0');
    }
  }, []);

  const populateFromBooking = useCallback((booking: RoomBooking) => {
    setSelectedBooking(booking);
    setEventTitle(booking.title);
    setEventDescription(booking.description || '');
    setEventStartDate(booking.booking_date);
    setEventStartTime(booking.start_time);
    setEventEndTime(booking.end_time);
    setSelectedRoom(booking.room_id);
    setMeetingType(booking.meeting_type);
    setAttendeesCount(booking.attendees_count);
  }, []);

  return {
    eventTitle,
    eventDescription,
    eventStartDate,
    eventStartTime,
    eventEndTime,
    selectedRoom,
    meetingType,
    attendeesCount,
    selectedBooking,
    setEventTitle,
    setEventDescription,
    setEventStartDate,
    setEventStartTime,
    setEventEndTime,
    setSelectedRoom,
    setMeetingType,
    setAttendeesCount,
    setSelectedBooking,
    resetForm,
    populateFromBooking
  };
}
