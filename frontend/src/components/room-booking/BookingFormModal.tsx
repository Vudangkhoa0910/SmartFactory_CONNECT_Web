/**
 * BOOKING FORM MODAL
 * Modal for creating/editing room bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import roomBookingService, { 
  formatDateForInput, 
  getTimeSlots, 
  validateBookingTime 
} from '../../services/room-booking.service';
import { 
  Room, 
  CreateBookingDTO, 
  MEETING_TYPE_OPTIONS 
} from '../../types/room-booking.types';

interface BookingFormModalProps {
  room: Room;
  initialDate?: Date;
  initialStartTime?: string;
  onClose: () => void;
  onSubmit: () => void;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  room,
  initialDate,
  initialStartTime,
  onClose,
  onSubmit
}) => {
  const timeSlots = getTimeSlots(8, 18, 30);
  
  const [formData, setFormData] = useState<CreateBookingDTO>({
    room_id: room.id,
    title: '',
    description: '',
    meeting_type: 'department_meeting',
    attendees_count: 1,
    booking_date: initialDate ? formatDateForInput(initialDate) : formatDateForInput(new Date()),
    start_time: initialStartTime || '09:00',
    end_time: initialStartTime ? 
      timeSlots[timeSlots.indexOf(initialStartTime) + 2] || '10:00' 
      : '10:00',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Check availability when time changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.booking_date || !formData.start_time || !formData.end_time) return;
      
      setChecking(true);
      try {
        const available = await roomBookingService.checkAvailability(
          formData.room_id,
          formData.booking_date,
          formData.start_time,
          formData.end_time
        );
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking availability:', error);
      } finally {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkAvailability, 300);
    return () => clearTimeout(timer);
  }, [formData.booking_date, formData.start_time, formData.end_time, formData.room_id]);

  const handleChange = (field: keyof CreateBookingDTO, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-update color when meeting type changes
    if (field === 'meeting_type') {
      const selectedType = MEETING_TYPE_OPTIONS.find(opt => opt.value === value);
      if (selectedType) {
        setFormData(prev => ({ ...prev, color: selectedType.color }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề cuộc họp');
      return;
    }

    if (formData.attendees_count > room.capacity) {
      toast.error(`Số người tham dự vượt quá sức chứa phòng (${room.capacity} người)`);
      return;
    }

    const timeValidation = validateBookingTime(formData.start_time, formData.end_time);
    if (!timeValidation.valid) {
      toast.error(timeValidation.error);
      return;
    }

    if (!isAvailable) {
      toast.error('Phòng đã được đặt trong khung giờ này');
      return;
    }

    setLoading(true);
    try {
      await roomBookingService.createBooking(formData);
      onSubmit();
    } catch (error: unknown) {
      console.error('Error creating booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể tạo lịch đặt phòng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Đặt Phòng Họp
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {room.room_name} - Sức chứa: {room.capacity} người
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tiêu đề cuộc họp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="VD: Họp Team Sprint Planning"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại cuộc họp <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.meeting_type}
              onChange={(e) => handleChange('meeting_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            >
              {MEETING_TYPE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Attendees */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.booking_date}
                onChange={(e) => handleChange('booking_date', e.target.value)}
                min={formatDateForInput(new Date())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số người tham dự <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.attendees_count}
                onChange={(e) => handleChange('attendees_count', parseInt(e.target.value) || 1)}
                min={1}
                max={room.capacity}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giờ bắt đầu <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              >
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giờ kết thúc <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              >
                {timeSlots.filter(t => t > formData.start_time).map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability Status */}
          {checking ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Đang kiểm tra trạng thái phòng...
            </div>
          ) : !isAvailable ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Phòng đã được đặt trong khung giờ này. Vui lòng chọn thời gian khác.
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Phòng còn trống trong khung giờ này
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô tả cuộc họp
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Mô tả chi tiết về cuộc họp..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Ghi chú thêm (nếu có)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !isAvailable || checking}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Đặt phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
