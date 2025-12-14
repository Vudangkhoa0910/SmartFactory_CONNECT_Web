/**
 * Room Booking Calendar - Constants & Types
 */
import { EventInput } from '@fullcalendar/core';
import { MeetingType } from '../../types/room-booking.types';

export interface CalendarEvent extends EventInput {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    bookingId: number;
    roomId: number;
    roomName: string;
    meetingType: MeetingType;
    status: string;
    description?: string;
    attendeesCount: number;
  };
}

export const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

export const MEETING_TYPE_OPTIONS = [
  { value: 'department_meeting', label: 'Họp phòng ban' },
  { value: 'team_standup', label: 'Họp đứng team' },
  { value: 'project_review', label: 'Họp review dự án' },
  { value: 'training_session', label: 'Đào tạo nội bộ' },
  { value: 'client_meeting', label: 'Gặp khách hàng' },
  { value: 'interview', label: 'Phỏng vấn' },
  { value: 'workshop', label: 'Workshop/Hội thảo' },
  { value: 'company_event', label: 'Sự kiện công ty' },
  { value: 'celebration', label: 'Sinh nhật/Kỷ niệm' },
  { value: 'technical_discussion', label: 'Thảo luận kỹ thuật' },
  { value: 'brainstorming', label: 'Brainstorm ý tưởng' },
  { value: 'presentation', label: 'Thuyết trình' },
  { value: 'other', label: 'Khác' },
];
