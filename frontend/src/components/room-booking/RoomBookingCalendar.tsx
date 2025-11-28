/**
 * ROOM BOOKING CALENDAR - FullCalendar Integration
 */

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventInput, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import roomBookingService from '../../services/room-booking.service';
import { 
  RoomBooking, 
  Room, 
  MEETING_TYPE_COLORS,
  MeetingType
} from '../../types/room-booking.types';
import { Modal } from '../ui/modal';
import { useModal } from '../../hooks/useModal';

interface CalendarEvent extends EventInput {
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

const RoomBookingCalendar: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string } | null>(null);
  // const [isViewMode, setIsViewMode] = useState(false); // View existing booking vs create/edit
  
  // Form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [selectedRoom, setSelectedRoom] = useState<number>(0);
  const [meetingType, setMeetingType] = useState<MeetingType>('department_meeting');
  const [attendeesCount, setAttendeesCount] = useState(1);
  
  const calendarRef = useRef<FullCalendar>(null);
  const isLoadingRef = useRef(false);
  const { isOpen, openModal, closeModal } = useModal();

  // Get current user
  // const userStr = localStorage.getItem('user');
  // const currentUser = userStr ? JSON.parse(userStr) : null;
  // const isAdmin = currentUser && currentUser.role === 'admin';

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const meetingTypeOptions = [
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

  const loadData = async (startDate?: string, endDate?: string) => {
    console.log('🔄 loadData called with:', { startDate, endDate });
    // Prevent concurrent loading
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
      
      const calendarEvents: CalendarEvent[] = bookingsData.map((booking) => {
        // Extract date only (YYYY-MM-DD) from booking_date
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
      
      console.log('🎯 Calendar events created:', calendarEvents.length, calendarEvents);
      
      setEvents(calendarEvents);
      if (roomsData.length > 0 && selectedRoom === 0) {
        setSelectedRoom(roomsData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu đặt phòng');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Load bookings for the full month range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const startStr = firstDay.toISOString().split('T')[0];
    const endStr = lastDay.toISOString().split('T')[0];
    setCurrentDateRange({ start: startStr, end: endStr });
    loadData(startStr, endStr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('📅 RAW selectInfo:', {
      start: selectInfo.start,
      startStr: selectInfo.startStr,
      end: selectInfo.end,
      endStr: selectInfo.endStr,
      allDay: selectInfo.allDay
    });
    console.log('📅 Date selected:', selectInfo.startStr, 'Rooms:', rooms.length);
    resetModalFields();
    // Use selectInfo.startStr to avoid timezone issues
    const startDate = selectInfo.startStr;
    console.log('📅 Setting eventStartDate to:', startDate);
    setEventStartDate(startDate);
    
    // Default time slots instead of using selectInfo.start (timezone issue)
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingId = parseInt(clickInfo.event.id);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      // setIsViewMode(true); // Enable view mode
      setEventTitle(booking.title);
      setEventDescription(booking.description || '');
      setEventStartDate(booking.booking_date);
      setEventStartTime(booking.start_time);
      setEventEndTime(booking.end_time);
      setSelectedRoom(booking.room_id);
      setMeetingType(booking.meeting_type);
      setAttendeesCount(booking.attendees_count);
      openModal();
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề cuộc họp');
      return;
    }
    console.log('🔍 Validation - selectedRoom:', selectedRoom, 'rooms available:', rooms.length);
    if (selectedRoom === 0) {
      toast.error('Vui lòng chọn phòng họp');
      return;
    }
    // Removed capacity validation - no limit on attendees

    console.log('📝 Submitting booking with date:', eventStartDate, 'time:', eventStartTime, '-', eventEndTime);

    try {
      if (selectedBooking) {
        await roomBookingService.updateBooking(selectedBooking.id, {
          room_id: selectedRoom,
          title: eventTitle,
          description: eventDescription,
          meeting_type: meetingType,
          attendees_count: attendeesCount,
          booking_date: eventStartDate,
          start_time: eventStartTime,
          end_time: eventEndTime,
          notes: ''
        });
        toast.success('Cập nhật đặt phòng thành công!');
      } else {
        await roomBookingService.createBooking({
          room_id: selectedRoom,
          title: eventTitle,
          description: eventDescription,
          meeting_type: meetingType,
          attendees_count: attendeesCount,
          booking_date: eventStartDate,
          start_time: eventStartTime,
          end_time: eventEndTime,
          notes: ''
        });
        toast.success('Đặt phòng thành công! Chờ admin duyệt.');
      }
      // Reload with current date range
      if (currentDateRange) {
        await loadData(currentDateRange.start, currentDateRange.end);
      } else {
        await loadData();
      }
      closeModal();
      resetModalFields();
    } catch (error: unknown) {
      console.error('Error saving booking:', error);
      
      // Handle Axios error with proper type checking
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        const errorMessage = axiosError.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng';
        
        // Show specific error messages based on status code
        if (axiosError.response?.status === 409) {
          toast.error('⚠️ ' + errorMessage);
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Có lỗi xảy ra khi đặt phòng');
      }
    }
  };

  const resetModalFields = () => {
    setEventTitle('');
    setEventDescription('');
    setEventStartDate('');
    setEventStartTime('09:00');
    setEventEndTime('10:00');
    setMeetingType('department_meeting');
    setAttendeesCount(1);
    setSelectedBooking(null);
    // setIsViewMode(false);
    console.log('🏢 Rooms available in reset:', rooms.length, rooms);
    if (rooms.length > 0) {
      console.log('✅ Setting default room:', rooms[0].id, rooms[0].room_name);
      setSelectedRoom(rooms[0].id);
    } else {
      console.log('⚠️ No rooms available yet, keeping selectedRoom as 0');
    }
  };

  const renderEventContent = (eventInfo: { timeText: string; event: { title: string; extendedProps: { status: string } } }) => {
    const status = eventInfo.event.extendedProps.status;
    const statusColor = status === 'confirmed' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500';
    return (
      <div className="flex items-start gap-1 p-1 overflow-hidden">
        <div className={`w-1.5 h-1.5 rounded-full ${statusColor} mt-1 flex-shrink-0`}></div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{eventInfo.timeText}</div>
          <div className="text-xs truncate">{eventInfo.event.title}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 dark:text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="custom-calendar">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={new Date().toISOString()}
          headerToolbar={{
            left: 'prev,next today ',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          // customButtons={{
          //   addEventButton: {
          //     text: 'Đặt Phòng +',
          //     click: () => {
          //       resetModalFields();
          //       setEventStartDate(new Date().toISOString().split('T')[0]);
          //       openModal();
          //     },
          //   },
          // }}
          locale="vi"
          firstDay={1}
          weekends={true}
          height="auto"
          timeZone="local"
        />
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] p-6 lg:p-10">
        <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar max-h-[80vh]">
          <div>
            <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {selectedBooking ? 'Chi Tiết Đặt Phòng' : 'Đặt Phòng Họp'}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedBooking ? 'Xem thông tin chi tiết hoặc chỉnh sửa đặt phòng' : 'Điền thông tin để đặt phòng họp mới'}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Phòng Họp <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => {
                  const newRoomId = parseInt(e.target.value);
                  console.log('🔄 Room selection changed:', newRoomId);
                  setSelectedRoom(newRoomId);
                }}
                disabled={selectedBooking !== null}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value={0}>Chọn phòng họp</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.room_name} ({room.capacity} người)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Tiêu Đề Cuộc Họp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Nhập tiêu đề cuộc họp"
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Mô Tả
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Mô tả chi tiết cuộc họp..."
                rows={3}
                className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Loại Cuộc Họp
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                {meetingTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Số Người Tham Dự <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>

            {/* Time Selection Only - Date is selected from calendar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Giờ Bắt Đầu
                </label>
                <select
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Giờ Kết Thúc
                </label>
                <select
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedBooking && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Trạng Thái
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  selectedBooking.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  selectedBooking.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {selectedBooking.status === 'confirmed' ? '✓ Đã Duyệt' :
                   selectedBooking.status === 'pending' ? '⏳ Chờ Duyệt' :
                   selectedBooking.status === 'rejected' ? '✗ Bị Từ Chối' : 
                   selectedBooking.status === 'completed' ? '✓ Đã Hoàn Thành' : '⊗ Đã Hủy'}
                </span>
              </div>
            )}
          </div>

        

          <div className="flex items-center gap-3 mt-8 sm:justify-end">
            <button
              onClick={closeModal}
              type="button"
              className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
            >
              Đóng
            </button>
            {(!selectedBooking || selectedBooking.status === 'pending') && (
              <button
                onClick={handleAddOrUpdateEvent}
                type="button"
                className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
              >
                {selectedBooking ? 'Cập Nhật' : 'Đặt Phòng'}
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomBookingCalendar;
