/**
 * MY BOOKINGS PAGE
 * User's personal booking history and current bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import roomBookingService, { formatDate, formatTime } from '../services/room-booking.service';
import { 
  RoomBooking, 
  MEETING_TYPE_LABELS,
  BOOKING_STATUS_LABELS 
} from '../types/room-booking.types';
import BookingDetailModal from '../components/room-booking/BookingDetailModal';

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected'>('all');

  // Load user's bookings
  const loadMyBookings = async () => {
    try {
      setLoading(true);
      const data = await roomBookingService.getMyBookings({
        status: filter === 'all' ? undefined : filter
      });
      setBookings(data);
    } catch (error) {
      console.error('Error loading my bookings:', error);
      toast.error('Không thể tải danh sách đặt phòng của bạn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Handle view detail
  const handleViewDetail = (booking: RoomBooking) => {
    setSelectedBooking(booking);
    setShowDetail(true);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS]}
      </span>
    );
  };

  // Get stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    rejected: bookings.filter(b => b.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Lịch Đặt Phòng Của Tôi
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng</div>
          </div>
          <div
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Chờ duyệt</div>
          </div>
          <div
            onClick={() => setFilter('confirmed')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'confirmed'
                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.confirmed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Đã duyệt</div>
          </div>
          <div
            onClick={() => setFilter('cancelled')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'cancelled'
                ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.cancelled}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Đã hủy</div>
          </div>
          <div
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'rejected'
                ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Bị từ chối</div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chưa có lịch đặt phòng nào
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bạn chưa đặt phòng họp nào. Hãy đặt phòng ngay!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewDetail(booking)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {booking.title}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.room_code} - {booking.room_name}
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {/* Meeting Type */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: booking.color }}
                  ></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {MEETING_TYPE_LABELS[booking.meeting_type]}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{booking.attendees_count} người</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-500">
                  Đặt lúc: {new Date(booking.created_at).toLocaleString('vi-VN')}
                </div>

                {/* Rejection Reason */}
                {booking.status === 'rejected' && booking.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                    <strong>Lý do:</strong> {booking.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetail(false);
            setSelectedBooking(null);
          }}
          onUpdate={() => {
            loadMyBookings();
            setShowDetail(false);
            setSelectedBooking(null);
          }}
          adminMode={false}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
