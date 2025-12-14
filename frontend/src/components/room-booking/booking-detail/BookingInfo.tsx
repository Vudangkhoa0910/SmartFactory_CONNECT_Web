/**
 * BookingInfo Component - SmartFactory CONNECT
 */
import React from 'react';
import { Calendar, Clock, User, Building2 } from 'lucide-react';
import { formatDate, formatTime } from '../../../services/room-booking.service';
import { RoomBooking, MEETING_TYPE_LABELS } from '../../../types/room-booking.types';

interface BookingInfoProps {
  booking: RoomBooking;
}

const BookingInfo: React.FC<BookingInfoProps> = ({ booking }) => {
  return (
    <>
      {/* Meeting Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Loại cuộc họp</label>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: booking.color }}
            ></span>
            <span className="text-gray-900 dark:text-white">
              {MEETING_TYPE_LABELS[booking.meeting_type]}
            </span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Số người tham dự</label>
          <p className="text-gray-900 dark:text-white mt-1">
            {booking.attendees_count} người
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Thời gian</label>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {formatDate(booking.booking_date)}
        </p>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4" /> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
        </p>
      </div>

      {/* Description */}
      {booking.description && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mô tả</label>
          <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
            {booking.description}
          </p>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ghi chú</label>
          <p className="text-gray-900 dark:text-white mt-1">
            {booking.notes}
          </p>
        </div>
      )}

      {/* Booker Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Người đặt</label>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <User className="w-4 h-4" /> {booking.booked_by_name}
        </p>
        {booking.department_name && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {booking.department_name}
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
          Đặt lúc: {new Date(booking.created_at).toLocaleString('vi-VN')}
        </p>
      </div>

      {/* Approval Info */}
      {booking.approved_by_name && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {booking.status === 'confirmed' ? 'Người phê duyệt' : 'Người xử lý'}
          </label>
          <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <User className="w-4 h-4" /> {booking.approved_by_name}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            Lúc: {booking.approved_at ? new Date(booking.approved_at).toLocaleString('vi-VN') : 'N/A'}
          </p>
          {booking.rejection_reason && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
              <strong>Lý do từ chối:</strong> {booking.rejection_reason}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default BookingInfo;
