/**
 * BookingInfo Component - SmartFactory CONNECT
 */
import React from 'react';
import { Calendar, Clock, User, Building2 } from 'lucide-react';
import { formatDate, formatTime } from '../../../services/room-booking.service';
import { RoomBooking, MEETING_PURPOSE_LABELS, MEETING_PURPOSE_COLORS } from '../../../types/room-booking.types';
import { useTranslation } from "../../../contexts/LanguageContext";

interface BookingInfoProps {
  booking: RoomBooking;
}

const BookingInfo: React.FC<BookingInfoProps> = ({ booking }) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Meeting Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.purpose')}</label>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: booking.purpose ? MEETING_PURPOSE_COLORS[booking.purpose] : (booking.color || '#6B7280') }}
            ></span>
            <span className="text-gray-900 dark:text-white">
              {booking.purpose ? MEETING_PURPOSE_LABELS[booking.purpose] : t('booking.purpose.other')}
            </span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.expected_attendees')}</label>
          <p className="text-gray-900 dark:text-white mt-1">
            {booking.expected_attendees} {t('booking.info.attendees_unit')}
          </p>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.time_label')}</label>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {formatDate(booking.start_time)}
        </p>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4" /> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
        </p>
      </div>

      {/* Description */}
      {booking.description && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.description')}</label>
          <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
            {booking.description}
          </p>
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.notes')}</label>
          <p className="text-gray-900 dark:text-white mt-1">
            {booking.notes}
          </p>
        </div>
      )}

      {/* Booker Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('booking.info.booker')}</label>
        <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
          <User className="w-4 h-4" /> {booking.booked_by_name}
        </p>
        {booking.department_name && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {booking.department_name}
          </p>
        )}
        <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
          {t('booking.info.booked_at')} {new Date(booking.created_at).toLocaleString('vi-VN')}
        </p>
      </div>

      {/* Approval Info */}
      {booking.approved_by_name && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {booking.status === 'confirmed' ? t('booking.approver') : t('booking.handler')}
          </label>
          <p className="text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <User className="w-4 h-4" /> {booking.approved_by_name}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
            {t('booking.info.at_time')} {booking.approved_at ? new Date(booking.approved_at).toLocaleString('vi-VN') : 'N/A'}
          </p>
          {booking.rejection_reason && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
              <strong>{t('booking.reject_reason')}</strong> {booking.rejection_reason}
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default BookingInfo;
