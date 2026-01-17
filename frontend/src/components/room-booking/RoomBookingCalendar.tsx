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
import viLocale from '@fullcalendar/core/locales/vi';
import jaLocale from '@fullcalendar/core/locales/ja';
import roomBookingService from '../../services/room-booking.service';
import { useModal } from '../../hooks/useModal';
import {
  BookingFormModal,
  CalendarLoading,
  renderEventContent,
  useCalendarData,
  useBookingForm
} from './calendar';
import { useTranslation } from "../../contexts/LanguageContext";

const RoomBookingCalendar: React.FC = () => {
  const { t, language } = useTranslation();
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  // Custom hooks for state management
  const { rooms, bookings, events, loading, currentDateRange, loadData } = useCalendarData();
  const form = useBookingForm();

  // Log rooms for debugging
  useEffect(() => {
    console.log('🏢 RoomBookingCalendar - rooms updated:', rooms.length, rooms);
  }, [rooms]);

  // Set default room when rooms are loaded
  useEffect(() => {
    if (rooms.length > 0 && !form.selectedRoom) {
      console.log('✅ Setting default room:', rooms[0].id);
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

    // Extract just the date part (YYYY-MM-DD) from the start
    // startStr could be "2026-01-14" or "2026-01-14T09:00:00+07:00"
    const startDate = selectInfo.start;
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    const dateOnly = `${year}-${month}-${day}`;

    console.log('📅 Setting eventStartDate to:', dateOnly);
    form.setEventStartDate(dateOnly);
    form.setEventStartTime('09:00');
    form.setEventEndTime('10:00');
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const bookingId = clickInfo.event.id;
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      form.populateFromBooking(booking);
      openModal();
    }
  };

  const handleBookingError = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      const errorMessage = axiosError.response?.data?.message || t('booking.error.generic');
      toast.error(errorMessage);
    } else {
      toast.error(t('booking.error.generic'));
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (!form.eventTitle.trim()) {
      toast.error(t('booking.validation.title_required'));
      return;
    }

    console.log('🔍 Validation - selectedRoom:', form.selectedRoom, 'rooms available:', rooms.length);
    if (!form.selectedRoom) {
      toast.error(t('booking.validation.room_required'));
      return;
    }

    console.log('📝 Submitting booking with date:', form.eventStartDate, 'time:', form.eventStartTime, '-', form.eventEndTime);

    try {
      // Construct ISO timestamps
      const startISO = `${form.eventStartDate}T${form.eventStartTime}:00Z`;
      const endISO = `${form.eventStartDate}T${form.eventEndTime}:00Z`;

      const bookingData = {
        room_id: form.selectedRoom,
        title: form.eventTitle,
        description: form.eventDescription,
        purpose: form.meetingPurpose,
        expected_attendees: form.expectedAttendees,
        start_time: startISO,
        end_time: endISO,
        notes: ''
      };

      if (form.selectedBooking) {
        await roomBookingService.updateBooking(form.selectedBooking.id, bookingData);
        toast.success(t('booking.success.update'));
      } else {
        await roomBookingService.createBooking(bookingData);
        toast.success(t('booking.success.create'));
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
    <div className="rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm transition-colors">
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
          locales={[viLocale, jaLocale]}
          locale={language}
          titleFormat={{ year: 'numeric', month: '2-digit' }}
          buttonText={{
            today: t('calendarf.today'),
            month: t('calendarf.month'),
            week: t('calendarf.week'),
            day: t('calendarf.day'),
            list: t('calendarf.list')
          }}
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
        meetingPurpose={form.meetingPurpose}
        expectedAttendees={form.expectedAttendees}
        eventStartTime={form.eventStartTime}
        eventEndTime={form.eventEndTime}
        setEventTitle={form.setEventTitle}
        setEventDescription={form.setEventDescription}
        setSelectedRoom={form.setSelectedRoom}
        setMeetingPurpose={form.setMeetingPurpose}
        setExpectedAttendees={form.setExpectedAttendees}
        setEventStartTime={form.setEventStartTime}
        setEventEndTime={form.setEventEndTime}
        onSubmit={handleAddOrUpdateEvent}
      />
    </div>
  );
};

export default RoomBookingCalendar;
