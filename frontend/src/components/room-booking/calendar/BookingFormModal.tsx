/**
 * Room Booking Form Modal Component
 */
import React from 'react';
import { Room, RoomBooking, MeetingType } from '../../../types/room-booking.types';
import { Modal } from '../../ui/modal';
import { TIME_SLOTS, MEETING_TYPE_OPTIONS } from './constants';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooking: RoomBooking | null;
  rooms: Room[];
  // Form values
  eventTitle: string;
  eventDescription: string;
  selectedRoom: number;
  meetingType: MeetingType;
  attendeesCount: number;
  eventStartTime: string;
  eventEndTime: string;
  // Setters
  setEventTitle: (value: string) => void;
  setEventDescription: (value: string) => void;
  setSelectedRoom: (value: number) => void;
  setMeetingType: (value: MeetingType) => void;
  setAttendeesCount: (value: number) => void;
  setEventStartTime: (value: string) => void;
  setEventEndTime: (value: string) => void;
  // Actions
  onSubmit: () => void;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  selectedBooking,
  rooms,
  eventTitle,
  eventDescription,
  selectedRoom,
  meetingType,
  attendeesCount,
  eventStartTime,
  eventEndTime,
  setEventTitle,
  setEventDescription,
  setSelectedRoom,
  setMeetingType,
  setAttendeesCount,
  setEventStartTime,
  setEventEndTime,
  onSubmit
}) => {
  const inputClass = "dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] p-6 lg:p-10">
      <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar max-h-[80vh]">
        <ModalHeader selectedBooking={selectedBooking} />
        
        <div className="mt-8 space-y-6">
          {/* Room Selection */}
          <FormField label="Phòng Họp" required>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(parseInt(e.target.value))}
              disabled={selectedBooking !== null}
              className={inputClass}
            >
              <option value={0}>Chọn phòng họp</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name} ({room.capacity} người)
                </option>
              ))}
            </select>
          </FormField>

          {/* Title */}
          <FormField label="Tiêu Đề Cuộc Họp" required>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Nhập tiêu đề cuộc họp"
              className={`${inputClass} placeholder:text-gray-400 dark:placeholder:text-white/30`}
            />
          </FormField>

          {/* Description */}
          <FormField label="Mô Tả">
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Mô tả chi tiết cuộc họp..."
              rows={3}
              className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </FormField>

          {/* Meeting Type */}
          <FormField label="Loại Cuộc Họp">
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              className={inputClass}
            >
              {MEETING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </FormField>

          {/* Attendees Count */}
          <FormField label="Số Người Tham Dự" required>
            <input
              type="number"
              min="1"
              value={attendeesCount}
              onChange={(e) => setAttendeesCount(parseInt(e.target.value) || 1)}
              className={inputClass}
            />
          </FormField>

          {/* Time Selection */}
          <TimeSelectionFields
            eventStartTime={eventStartTime}
            eventEndTime={eventEndTime}
            setEventStartTime={setEventStartTime}
            setEventEndTime={setEventEndTime}
          />

          {/* Status Display */}
          {selectedBooking && (
            <BookingStatusDisplay status={selectedBooking.status} />
          )}
        </div>

        <ModalFooter 
          onClose={onClose}
          onSubmit={onSubmit}
          selectedBooking={selectedBooking}
        />
      </div>
    </Modal>
  );
};

// Sub-components
const ModalHeader: React.FC<{ selectedBooking: RoomBooking | null }> = ({ selectedBooking }) => (
  <div>
    <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
      {selectedBooking ? 'Chi Tiết Đặt Phòng' : 'Đặt Phòng Họp'}
    </h5>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {selectedBooking ? 'Xem thông tin chi tiết hoặc chỉnh sửa đặt phòng' : 'Điền thông tin để đặt phòng họp mới'}
    </p>
  </div>
);

const FormField: React.FC<{ 
  label: string; 
  required?: boolean; 
  children: React.ReactNode 
}> = ({ label, required, children }) => (
  <div>
    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const TimeSelectionFields: React.FC<{
  eventStartTime: string;
  eventEndTime: string;
  setEventStartTime: (value: string) => void;
  setEventEndTime: (value: string) => void;
}> = ({ eventStartTime, eventEndTime, setEventStartTime, setEventEndTime }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField label="Giờ Bắt Đầu">
      <select
        value={eventStartTime}
        onChange={(e) => setEventStartTime(e.target.value)}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        {TIME_SLOTS.map((time) => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </FormField>

    <FormField label="Giờ Kết Thúc">
      <select
        value={eventEndTime}
        onChange={(e) => setEventEndTime(e.target.value)}
        className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
      >
        {TIME_SLOTS.map((time) => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </FormField>
  </div>
);

const BookingStatusDisplay: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    confirmed: { label: 'Đã Duyệt', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    pending: { label: 'Chờ Duyệt', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    rejected: { label: 'Bị Từ Chối', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    completed: { label: 'Đã Hoàn Thành', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    default: { label: 'Đã Hủy', className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
  };
  
  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        Trạng Thái
      </label>
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    </div>
  );
};

const ModalFooter: React.FC<{
  onClose: () => void;
  onSubmit: () => void;
  selectedBooking: RoomBooking | null;
}> = ({ onClose, onSubmit, selectedBooking }) => (
  <div className="flex items-center gap-3 mt-8 sm:justify-end">
    <button
      onClick={onClose}
      type="button"
      className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
    >
      Đóng
    </button>
    {(!selectedBooking || selectedBooking.status === 'pending') && (
      <button
        onClick={onSubmit}
        type="button"
        className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
      >
        {selectedBooking ? 'Cập Nhật' : 'Đặt Phòng'}
      </button>
    )}
  </div>
);

export default BookingFormModal;
