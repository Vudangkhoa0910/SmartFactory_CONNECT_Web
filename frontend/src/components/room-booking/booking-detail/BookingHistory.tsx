/**
 * BookingHistory Component - SmartFactory CONNECT
 */
import React from 'react';
import { BookingHistoryEntry } from '../../../types/room-booking.types';
import { useTranslation } from "../../../contexts/LanguageContext";

interface BookingHistoryProps {
  history: BookingHistoryEntry[];
}

const BookingHistory: React.FC<BookingHistoryProps> = ({ history }) => {
  const { t } = useTranslation();
  
  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: t('booking.history_action.created'),
      approved: t('booking.history_action.approved'),
      rejected: t('booking.history_action.rejected'),
      cancelled: t('booking.history_action.cancelled'),
      updated: t('booking.history_action.updated'),
    };
    return labels[action] || action;
  };

  if (history.length === 0) return null;

  return (
    <div>
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
        {t('booking.history')}
      </label>
      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 text-sm p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-1.5"></div>
            <div className="flex-1">
              <p className="text-gray-900 dark:text-white">
                <strong>{entry.performed_by_name || t('common.system')}</strong>{' '}
                {getActionLabel(entry.action)}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
                {new Date(entry.created_at).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingHistory;
