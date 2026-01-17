/**
 * Room Booking Calendar - Form State Hook
 */
import { useState, useCallback } from 'react';
import { MeetingPurpose, Room, RoomBooking } from '../../../types/room-booking.types';

export interface BookingFormState {
  eventTitle: string;
  eventDescription: string;
  eventStartDate: string;
  eventStartTime: string;
  eventEndTime: string;
  selectedRoom: string;
  meetingPurpose: MeetingPurpose;
  expectedAttendees: number;
  selectedBooking: RoomBooking | null;
}

export interface UseBookingFormReturn extends BookingFormState {
  setEventTitle: (value: string) => void;
  setEventDescription: (value: string) => void;
  setEventStartDate: (value: string) => void;
  setEventStartTime: (value: string) => void;
  setEventEndTime: (value: string) => void;
  setSelectedRoom: (value: string) => void;
  setMeetingPurpose: (value: MeetingPurpose) => void;
  setExpectedAttendees: (value: number) => void;
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
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [meetingPurpose, setMeetingPurpose] = useState<MeetingPurpose>('meeting');
  const [expectedAttendees, setExpectedAttendees] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);

  const resetForm = useCallback((rooms: Room[]) => {
    setEventTitle('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setMeetingPurpose('meeting');
    setExpectedAttendees(1);
    setSelectedBooking(null);

    if (rooms.length > 0) {
      setSelectedRoom(rooms[0].id);
    } else {
      setSelectedRoom('');
    }
  }, []);

  const populateFromBooking = useCallback((booking: RoomBooking) => {
    setSelectedBooking(booking);
    setEventTitle(booking.title);
    setEventDescription(booking.description || '');

    // booking.start_time is an ISO string like "2023-10-01T09:00:00Z"
    if (booking.start_time) {
      const start = new Date(booking.start_time);
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      const hour = String(start.getHours()).padStart(2, '0');
      const minute = String(start.getMinutes()).padStart(2, '0');

      setEventStartDate(`${year}-${month}-${day}`);
      setEventStartTime(`${hour}:${minute}`);
    }

    if (booking.end_time) {
      const end = new Date(booking.end_time);
      const hour = String(end.getHours()).padStart(2, '0');
      const minute = String(end.getMinutes()).padStart(2, '0');
      setEventEndTime(`${hour}:${minute}`);
    }

    setSelectedRoom(booking.room_id);
    setMeetingPurpose(booking.purpose || 'meeting');
    setExpectedAttendees(booking.expected_attendees);
  }, []);

  return {
    eventTitle,
    eventDescription,
    eventStartDate,
    eventStartTime,
    eventEndTime,
    selectedRoom,
    meetingPurpose,
    expectedAttendees,
    selectedBooking,
    setEventTitle,
    setEventDescription,
    setEventStartDate,
    setEventStartTime,
    setEventEndTime,
    setSelectedRoom,
    setMeetingPurpose,
    setExpectedAttendees,
    setSelectedBooking,
    resetForm,
    populateFromBooking
  };
}
