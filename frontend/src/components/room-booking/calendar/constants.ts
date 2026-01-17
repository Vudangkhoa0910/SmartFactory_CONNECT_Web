/**
 * Room Booking Calendar - Constants & Types
 */
import { EventInput } from '@fullcalendar/core';
import { MeetingPurpose } from '../../../types/room-booking.types';

export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    bookingId: string;
    roomId: string;
    roomName: string;
    purpose: MeetingPurpose;
    status: string;
    description?: string;
    expectedAttendees: number;
  };
}

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const MEETING_PURPOSE_OPTIONS = [
  { value: 'meeting', label: 'Họp thường kỳ' },
  { value: 'training', label: 'Đào tạo' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'presentation', label: 'Thuyết trình/Báo cáo' },
  { value: 'brainstorming', label: 'Brainstorm ý tưởng' },
  { value: 'other', label: 'Khác' },
];
