/**
 * BookingHistory Component - SmartFactory CONNECT
 */
import React from 'react';
import { BookingHistoryEntry } from '../../../types/room-booking.types';

interface BookingHistoryProps {
  history: BookingHistoryEntry[];
}

const ACTION_LABELS: Record<string, string> = {
  created: 'đã tạo lịch đặt phòng',
  approved: 'đã phê duyệt',
  rejected: 'đã từ chối',
  cancelled: 'đã hủy',
  updated: 'đã cập nhật',
};

const BookingHistory: React.FC<BookingHistoryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div>
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
        Lịch sử thay đổi
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
                <strong>{entry.performed_by_name || 'Hệ thống'}</strong>{' '}
                {ACTION_LABELS[entry.action] || entry.action}
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
