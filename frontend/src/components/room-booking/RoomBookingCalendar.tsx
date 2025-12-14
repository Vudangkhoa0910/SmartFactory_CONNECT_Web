/**
 * ROOM BOOKING CALENDAR - FullCalendar Integration
 * Modularized version with hooks and sub-components
 */
import React, { useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import roomBookingService from '../../services/room-booking.service';
import { useModal } from '../../hooks/useModal';
import {
  BookingFormModal,
  CalendarLoading,
  renderEventContent,
  useCalendarData,
  useBookingForm
} from './calendar';

const RoomBookingCalendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  
  // Custom hooks for state management
  const { rooms, bookings, events, loading, currentDateRange, loadData } = useCalendarData();
  const form = useBookingForm();

  // Set default room when rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && form.selectedRoom === 0) {
      form.setSelectedRoom(rooms[0].id);
    }
  }, [rooms, form.selectedRoom, form.setSelectedRoom]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    console.log('📅 RAW selectInfo:', {
      start: selectInfo.start,
      startStr: selectInfo.startStr,
      end: selectInfo.end,
      endStr: selectInfo.endStr,
      allDay: selectInfo.allDay
    });
    console.log('📅 Date selected:', selectInfo.startStr, 'Rooms:', rooms.length);
    
    form.resetForm(rooms);
    const startDate = selectInfo.startStr;
    console.log('📅 Setting eventStartDate to:', startDate);
    form.setEventStartDate(startDate);
    form.setEventStartTime('09:00');
    form.setEventEndTime('10:00');
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingId = parseInt(clickInfo.event.id);
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      form.populateFromBooking(booking);
      openModal();
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (!form.eventTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề cuộc họp');
      return;
    }
    
    console.log('🔍 Validation - selectedRoom:', form.selectedRoom, 'rooms available:', rooms.length);
    if (form.selectedRoom === 0) {
      toast.error('Vui lòng chọn phòng họp');
      return;
    }

    console.log('📝 Submitting booking with date:', form.eventStartDate, 'time:', form.eventStartTime, '-', form.eventEndTime);

    try {
      const bookingData = {
        room_id: form.selectedRoom,
        title: form.eventTitle,
        description: form.eventDescription,
        meeting_type: form.meetingType,
        attendees_count: form.attendeesCount,
        booking_date: form.eventStartDate,
        start_time: form.eventStartTime,
        end_time: form.eventEndTime,
        notes: ''
      };

      if (form.selectedBooking) {
        await roomBookingService.updateBooking(form.selectedBooking.id, bookingData);
        toast.success('Cập nhật đặt phòng thành công!');
      } else {
        await roomBookingService.createBooking(bookingData);
        toast.success('Đặt phòng thành công! Chờ admin duyệt.');
      }
      
      // Reload data
      if (currentDateRange) {
        await loadData(currentDateRange.start, currentDateRange.end);
      } else {
        await loadData();
      }
      
      closeModal();
      form.resetForm(rooms);
    } catch (error: unknown) {
      console.error('Error saving booking:', error);
      handleBookingError(error);
    }
  };

  const handleCloseModal = () => {
    closeModal();
    form.resetForm(rooms);
  };

  if (loading) {
    return <CalendarLoading />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
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
          locale="vi"
          firstDay={1}
          weekends={true}
          height="auto"
          timeZone="local"
        />
      </div>

      <BookingFormModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        selectedBooking={form.selectedBooking}
        rooms={rooms}
        eventTitle={form.eventTitle}
        eventDescription={form.eventDescription}
        selectedRoom={form.selectedRoom}
        meetingType={form.meetingType}
        attendeesCount={form.attendeesCount}
        eventStartTime={form.eventStartTime}
        eventEndTime={form.eventEndTime}
        setEventTitle={form.setEventTitle}
        setEventDescription={form.setEventDescription}
        setSelectedRoom={form.setSelectedRoom}
        setMeetingType={form.setMeetingType}
        setAttendeesCount={form.setAttendeesCount}
        setEventStartTime={form.setEventStartTime}
        setEventEndTime={form.setEventEndTime}
        onSubmit={handleAddOrUpdateEvent}
      />
    </div>
  );
};

function handleBookingError(error: unknown) {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
    const errorMessage = axiosError.response?.data?.message || 'Có lỗi xảy ra khi đặt phòng';
    toast.error(errorMessage);
  } else {
    toast.error('Có lỗi xảy ra khi đặt phòng');
  }
}

export default RoomBookingCalendar;
