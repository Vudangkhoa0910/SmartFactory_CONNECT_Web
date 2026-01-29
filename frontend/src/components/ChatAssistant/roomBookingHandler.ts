import { toast } from 'react-toastify';
import roomBookingService from '../../services/room-booking.service';
import { UIMessage } from './types';
import { MeetingType } from '../../types/room-booking.types';

interface BookingRequest {
  attendees?: number;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  meetingType?: MeetingType;
  roomId?: number;
}

// Map từ khóa tiếng Việt sang meeting type
const MEETING_TYPE_MAP: Record<string, MeetingType> = {
  'họp phòng ban': 'department_meeting',
  'phòng ban': 'department_meeting',
  'họp team': 'team_standup',
  'standup': 'team_standup',
  'review': 'project_review',
  'đánh giá': 'project_review',
  'dự án': 'project_review',
  'đào tạo': 'training_session',
  'training': 'training_session',
  'khách hàng': 'client_meeting',
  'đối tác': 'client_meeting',
  'client': 'client_meeting',
  'phỏng vấn': 'interview',
  'interview': 'interview',
  'tuyển dụng': 'interview',
  'workshop': 'workshop',
  'hội thảo': 'workshop',
  'sự kiện': 'company_event',
  'event': 'company_event',
  'sinh nhật': 'celebration',
  'kỷ niệm': 'celebration',
  'celebration': 'celebration',
  'thảo luận': 'technical_discussion',
  'kỹ thuật': 'technical_discussion',
  'brainstorm': 'brainstorming',
  'ý tưởng': 'brainstorming',
  'thuyết trình': 'presentation',
  'báo cáo': 'presentation',
  'presentation': 'presentation',
};

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  'department_meeting': 'Họp phòng ban',
  'team_standup': 'Họp đứng team',
  'project_review': 'Họp review dự án',
  'training_session': 'Đào tạo nội bộ',
  'client_meeting': 'Gặp khách hàng/đối tác',
  'interview': 'Phỏng vấn tuyển dụng',
  'workshop': 'Workshop/Hội thảo',
  'company_event': 'Sự kiện công ty',
  'celebration': 'Sinh nhật/Kỷ niệm',
  'technical_discussion': 'Thảo luận kỹ thuật',
  'brainstorming': 'Brainstorm ý tưởng',
  'presentation': 'Thuyết trình/Báo cáo',
  'other': 'Khác'
};

export async function handleRoomBooking(
  input: string,
  lowerInput: string,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
): Promise<boolean> {

  // Check keywords
  if (!lowerInput.includes('đặt phòng') && !lowerInput.includes('book') && !lowerInput.includes('đặt lịch')) {
    return false;
  }

  setMessages(prev => [...prev, { role: 'model', text: 'Đang xử lý yêu cầu đặt phòng...' }]);

  try {
    // Parse booking request
    const request = parseBookingRequest(input, lowerInput);

    // Get available rooms
    const rooms = await roomBookingService.getRooms();

    if (rooms.length === 0) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: '**Không có phòng họp nào khả dụng**\n\nVui lòng liên hệ quản trị viên để thêm phòng họp.'
      }]);
      return true;
    }

    // Check for conflicts if we have enough info
    const missingFields: string[] = [];
    if (!request.date) missingFields.push('ngày');
    if (!request.startTime) missingFields.push('giờ bắt đầu');
    if (!request.endTime) missingFields.push('giờ kết thúc');
    if (!request.title) missingFields.push('tiêu đề cuộc họp');

    if (missingFields.length > 0) {
      // Ask for missing information
      const exampleText = `Vui lòng cung cấp đầy đủ thông tin:\n\n**Thông tin còn thiếu:**\n${missingFields.map(f => `• ${f}`).join('\n')}\n\n**Ví dụ:**\n"Đặt phòng 10 người tổ chức sinh nhật từ 9 giờ đến 10 giờ ngày 28 tháng 11 năm 2025"`;

      setMessages(prev => [...prev, {
        role: 'model',
        text: `**Thiếu thông tin**\n\n${exampleText}`
      }]);
      return true;
    }

    // Show available rooms and conflicts
    let responseText = `THÔNG TIN ĐẶT PHÒNG\n\n`;
    responseText += `Ngày: ${formatDateDisplay(request.date!)}\n`;
    responseText += `Thời gian: ${request.startTime} - ${request.endTime}\n`;
    responseText += `Số người: ${request.attendees || 'Chưa xác định'}\n`;
    responseText += `Tiêu đề: ${request.title}\n`;
    responseText += `Loại: ${MEETING_TYPE_LABELS[request.meetingType || 'other']}\n\n`;

    // Check conflicts for each room
    responseText += `DANH SÁCH PHÒNG:\n\n`;

    const conflicts = await Promise.all(
      rooms.map(async (room) => {
        try {
          const bookings = await roomBookingService.getBookingsByDateRange(request.date!, request.date!);
          const roomBookings = bookings.filter(b =>
            b.room_id === room.id &&
            b.status !== 'cancelled' &&
            b.status !== 'rejected'
          );

          const hasConflict = roomBookings.some(b => {
            // start_time is usually ISO string or HH:mm from backend
            const bookingStart = (b.start_time as string).includes('T') ? b.start_time.split('T')[1].substring(0, 5) : b.start_time.substring(0, 5);
            const bookingEnd = (b.end_time as string).includes('T') ? b.end_time.split('T')[1].substring(0, 5) : b.end_time.substring(0, 5);
            return !(request.endTime! <= bookingStart || request.startTime! >= bookingEnd);
          });

          return {
            room,
            hasConflict,
            bookings: roomBookings
          };
        } catch {
          return {
            room,
            hasConflict: false,
            bookings: []
          };
        }
      })
    );

    conflicts.forEach(({ room, hasConflict, bookings }) => {
      const status = hasConflict ? 'Đã có người đặt' : 'Còn trống';
      const suitableCapacity = !request.attendees || room.capacity >= request.attendees;
      const capacityNote = suitableCapacity ? '' : ` (Không đủ chỗ)`;

      responseText += `${status} - ${room.name} (${room.capacity} người)${capacityNote}\n`;

      if (hasConflict && bookings.length > 0) {
        bookings.forEach(b => {
          const s = (b.start_time as string).includes('T') ? b.start_time.split('T')[1].substring(0, 5) : b.start_time.substring(0, 5);
          const e = (b.end_time as string).includes('T') ? b.end_time.split('T')[1].substring(0, 5) : b.end_time.substring(0, 5);
          responseText += `  └─ ${s}-${e}: ${b.title}\n`;
        });
      }
      responseText += `\n`;
    });

    // Find best room (available + suitable capacity)
    const availableRoom = conflicts.find(c =>
      !c.hasConflict &&
      (!request.attendees || c.room.capacity >= request.attendees)
    );

    if (availableRoom) {
      responseText += `\nGỢI Ý: Phòng ${availableRoom.room.name} phù hợp nhất!\n\n`;
      responseText += `Bạn có muốn đặt phòng ${availableRoom.room.name} không?`;

      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText,
        actions: [
          {
            label: `Đặt phòng ${availableRoom.room.name}`,
            onClick: async () => {
              try {
                // Create full ISO timestamps for backend
                // assuming date is YYYY-MM-DD
                const startISO = `${request.date}T${request.startTime}:00Z`;
                const endISO = `${request.date}T${request.endTime}:00Z`;

                await roomBookingService.createBooking({
                  room_id: availableRoom.room.id,
                  title: request.title!,
                  description: `Đặt qua chat - ${request.attendees || 0} người`,
                  booking_purpose: request.meetingType || 'other',
                  expected_attendees: request.attendees || 1,
                  start_time: startISO,
                  end_time: endISO,
                  notes: 'Đặt phòng qua chatbot'
                } as any);

                setMessages(prev => [...prev, {
                  role: 'model',
                  text: `Đặt phòng thành công!\n\nPhòng ${availableRoom.room.name} đã được đặt vào ${formatDateDisplay(request.date!)} từ ${request.startTime} đến ${request.endTime}.\n\nVui lòng đợi admin phê duyệt.`,
                  actions: [
                    {
                      label: 'Xem lịch đặt phòng',
                      onClick: () => window.location.href = '/room-booking',
                      className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    }
                  ]
                }]);

                toast.success('Đặt phòng thành công!');
              } catch (error: any) {
                let errorMsg = 'Có lỗi xảy ra';
                if (error?.response?.data?.message) {
                  errorMsg = error.response.data.message;
                }
                setMessages(prev => [...prev, {
                  role: 'model',
                  text: `Đặt phòng thất bại\n\n${errorMsg}`
                }]);
                toast.error(errorMsg);
              }
            },
            className: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400'
          },
          {
            label: 'Hủy',
            onClick: () => {
              setMessages(prev => [...prev, {
                role: 'model',
                text: 'Đã hủy đặt phòng.'
              }]);
            },
            className: 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
          }
        ]
      }]);
    } else {
      responseText += `\n**Không có phòng trống phù hợp**\n\nVui lòng chọn thời gian khác hoặc liên hệ quản trị viên.`;

      setMessages(prev => [...prev, {
        role: 'model',
        text: responseText,
        actions: [
          {
            label: 'Xem lịch đặt phòng',
            onClick: () => window.location.href = '/room-booking',
            className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
          }
        ]
      }]);
    }

    return true;

  } catch (error) {
    console.error('Room booking error:', error);
    setMessages(prev => [...prev, {
      role: 'model',
      text: 'Lỗi\n\nKhông thể xử lý yêu cầu đặt phòng. Vui lòng thử lại sau.'
    }]);
    return true;
  }
}

function parseBookingRequest(input: string, lowerInput: string): BookingRequest {
  const request: BookingRequest = {};

  // Parse attendees count
  const attendeesMatch = input.match(/(\d+)\s*(người|nguoi|nguời|ngưởi|nguwoif|ngưoi|nguơi|person|people)/i);
  if (attendeesMatch) {
    request.attendees = parseInt(attendeesMatch[1]);
  }

  // Parse meeting type
  for (const [keyword, type] of Object.entries(MEETING_TYPE_MAP)) {
    if (lowerInput.includes(keyword)) {
      request.meetingType = type;
      break;
    }
  }

  // Parse title - extract main subject by removing keywords and all date/time formats
  const title = input
    .replace(/đặt phòng|book|đặt lịch/gi, '')
    .replace(/(\d+)\s*(người|nguoi|nguời|ngưởi|nguwoif|ngưoi|nguơi|person|people)/gi, '')
    .replace(/từ\s+\d{1,2}\s*(giờ|giừo|gio|h)(?::\d{2})?/gi, '')
    .replace(/đến\s+\d{1,2}\s*(giờ|giừo|gio|h)(?::\d{2})?/gi, '')
    .replace(/ngày\s+\d{1,2}/gi, '')
    .replace(/tháng\s+\d{1,2}/gi, '')
    .replace(/năm\s+\d{4}/gi, '')
    .replace(/\d{1,2}\s*[/-]\s*\d{1,2}\s*[/-]\s*\d{2,4}/g, '') // Xóa format DD/MM/YYYY hoặc DD-MM-YYYY
    .replace(/\d{1,2}\s*[/-]\s*\d{1,2}/g, '') // Xóa format DD/MM
    .trim();

  if (title.length > 3) {
    request.title = title.substring(0, 100);
  }

  // Parse time
  const timeMatch = input.match(/từ\s+(\d{1,2})(?::(\d{2}))?\s*(?:giờ|giừo|gio|h)?\s*đến\s+(\d{1,2})(?::(\d{2}))?\s*(?:giờ|giừo|gio|h)?/i);
  if (timeMatch) {
    const startHour = parseInt(timeMatch[1]);
    const startMin = timeMatch[2] || '00';
    const endHour = parseInt(timeMatch[3]);
    const endMin = timeMatch[4] || '00';

    request.startTime = `${startHour.toString().padStart(2, '0')}:${startMin}`;
    request.endTime = `${endHour.toString().padStart(2, '0')}:${endMin}`;
  }

  // Parse date
  const currentYear = new Date().getFullYear();

  // Format 1: "ngày X tháng Y năm Z"
  const dateMatch1 = input.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i);
  if (dateMatch1) {
    const day = parseInt(dateMatch1[1]);
    const month = parseInt(dateMatch1[2]);
    const year = dateMatch1[3] ? parseInt(dateMatch1[3]) : currentYear;
    request.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  // Format 2: DD/MM/YYYY
  if (!request.date) {
    const dateMatch2 = input.match(/(?:ngày\s+)?(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2,4})/i);
    if (dateMatch2) {
      const day = parseInt(dateMatch2[1]);
      const month = parseInt(dateMatch2[2]);
      let year = parseInt(dateMatch2[3]);
      if (year < 100) year += 2000;
      request.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  // Format 3: ngày DD/MM
  if (!request.date) {
    const dateMatch3 = input.match(/ngày\s+(\d{1,2})\s*[/-]\s*(\d{1,2})(?!\s*[/-]?\s*\d)/i);
    if (dateMatch3) {
      const day = parseInt(dateMatch3[1]);
      const month = parseInt(dateMatch3[2]);
      request.date = `${currentYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  return request;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
