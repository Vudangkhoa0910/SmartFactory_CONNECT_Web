/**
 * MY BOOKINGS PAGE
 * User's personal booking history and current bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, Users, CalendarX, Search, Mic, X } from 'lucide-react';
import PageMeta from '../components/common/PageMeta';
import roomBookingService, { formatDate, formatTime } from '../services/room-booking.service';
import { 
  RoomBooking
} from '../types/room-booking.types';
import BookingDetailModal from '../components/room-booking/BookingDetailModal';
import { useTranslation } from '../contexts/LanguageContext';
import { useSpeechToText } from '../hooks/useSpeechToText';

const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, '');
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

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
      toast.error(t('booking.load_error'));
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
        {t(`booking.status.${status}`)}
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

  const filteredBookings = bookings.filter(booking => 
    booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.room_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.room_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${t('menu.my_bookings')} | SmartFactory CONNECT`}
        description={t('booking.my_bookings_desc')}
      />
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('menu.my_bookings')}
            </h1>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('search.placeholder') || "Tìm kiếm lịch đặt..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 ${isSupported ? 'pr-20' : 'pr-10'} py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isSupported && (
                  <button
                    onClick={startListening}
                    className={`text-gray-400 hover:text-red-500 transition-colors ${
                      isListening ? "text-red-500 animate-pulse" : ""
                    }`}
                    title="Click to speak"
                  >
                    <Mic size={16} />
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div
            onClick={() => setFilter('all')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500'
                : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('common.total')}</div>
          </div>
          <div
            onClick={() => setFilter('pending')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'pending'
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500'
                : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pending}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('status.pending')}</div>
          </div>
          <div
            onClick={() => setFilter('confirmed')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'confirmed'
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500'
                : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.confirmed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('status.confirmed')}</div>
          </div>
          <div
            onClick={() => setFilter('cancelled')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'cancelled'
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500'
                : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.cancelled}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('status.cancelled')}</div>
          </div>
          <div
            onClick={() => setFilter('rejected')}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              filter === 'rejected'
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-500'
                : 'bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('status.rejected')}</div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 p-12 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 text-center">
          <CalendarX className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('booking.no_bookings')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? t('search.no_results') : t('booking.no_bookings_message')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetail(booking)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {booking.title}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
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
                    {t(`booking.meeting_type.${booking.meeting_type}`)}
                  </span>
                </div>

                {/* Date & Time */}
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{booking.attendees_count} {t('booking.attendees_unit')}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-500 dark:text-gray-500">
                  {t('booking.created_at')}: {new Date(booking.created_at).toLocaleString('vi-VN')}
                </div>

                {/* Rejection Reason */}
                {booking.status === 'rejected' && booking.rejection_reason && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400">
                    <strong>{t('booking.reason')}:</strong> {booking.rejection_reason}
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
    </>
  );
};

export default MyBookingsPage;
