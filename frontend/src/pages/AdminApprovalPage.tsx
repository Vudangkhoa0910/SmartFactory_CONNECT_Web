/**
 * ADMIN APPROVAL PAGE
 * Page for admin to review and approve/reject pending bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Inbox, Check, AlertTriangle, Search, Mic, MicOff } from 'lucide-react';
import PageMeta from '../components/common/PageMeta';
import roomBookingService, { formatDate, formatTime } from '../services/room-booking.service';
import {
  RoomBooking
} from '../types/room-booking.types';
import BookingDetailModal from '../components/room-booking/BookingDetailModal';
import { useTranslation } from '../contexts/LanguageContext';
import { useSpeechToText } from '../hooks/useSpeechToText';

const AdminApprovalPage: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmBulkApprove, setConfirmBulkApprove] = useState(false);
  const [confirmApproveId, setConfirmApproveId] = useState<number | null>(null);
  const { t } = useTranslation();

  // Search & Voice
  const [searchQuery, setSearchQuery] = useState("");
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  // Load pending bookings
  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      const data = await roomBookingService.getPendingBookings();
      setPendingBookings(data);
    } catch (error) {
      console.error('Error loading pending bookings:', error);
      toast.error(t('booking.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingBookings();
  }, []);

  // Filter bookings
  const filteredBookings = pendingBookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    return (
      booking.title.toLowerCase().includes(query) ||
      booking.room_name.toLowerCase().includes(query) ||
      booking.user_name.toLowerCase().includes(query)
    );
  });

  // Handle view detail
  const handleViewDetail = (booking: RoomBooking) => {
    setSelectedBooking(booking);
    setShowDetail(true);
  };

  // Handle select/deselect
  const handleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map(b => b.id));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error(t('booking.select_at_least_one'));
      return;
    }

    try {
      const result = await roomBookingService.bulkApproveBookings(selectedIds);
      toast.success(result.message);
      setSelectedIds([]);
      setConfirmBulkApprove(false);
      loadPendingBookings();
    } catch (error: unknown) {
      console.error('Error bulk approving:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể phê duyệt hàng loạt');
    }
  };

  // Handle approve single
  const handleApprove = async (id: number) => {
    try {
      await roomBookingService.approveBooking(id);
      toast.success('Đã phê duyệt lịch đặt phòng');
      setConfirmApproveId(null);
      loadPendingBookings();
    } catch (error: unknown) {
      console.error('Error approving:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể phê duyệt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-neutral-900">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${t('menu.admin_approval')} | SmartFactory CONNECT`}
        description={t('booking.approval_description')}
      />
      <div className="p-4 space-y-4 bg-gray-50 dark:bg-neutral-900 min-h-screen transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('menu.admin_approval')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredBookings.length} {t('booking.pending_count')}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-12 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
                  isListening 
                    ? 'text-red-600 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
                title={t('common.voice_search')}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('common.selected')}: {selectedIds.length}
                </span>
                {confirmBulkApprove ? (
                  <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-1">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-400">{t('booking.confirm_bulk_approve')}</span>
                    <button
                      onClick={handleBulkApprove}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      {t('button.confirm')}
                    </button>
                    <button
                      onClick={() => setConfirmBulkApprove(false)}
                      className="px-3 py-1 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-300 dark:hover:bg-neutral-600"
                    >
                      {t('button.cancel')}
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setConfirmBulkApprove(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" /> {t('button.bulk_approve')}
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      {t('button.deselect_all')}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 p-12 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 text-center">
            <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? t('common.no_results') : t('booking.no_pending_approvals')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? t('common.try_different_keywords') : t('booking.all_processed')}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredBookings.length}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-red-600 focus:ring-red-500 dark:bg-neutral-800"
                      />
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('booking.room')}
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {t('booking.title')}
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      {t('booking.meeting_type')}
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      {t('booking.time')}
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      {t('booking.booker')}
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      {t('booking.created_at')}
                    </th>
                    <th className="p-4 text-right text-sm font-semibold text-gray-700">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(booking.id)}
                          onChange={() => handleSelect(booking.id)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">
                          {booking.room_code}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.room_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {booking.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {booking.attendees_count} {t('booking.attendees_unit')}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: booking.color }}
                          ></span>
                          <span className="text-sm text-gray-700">
                            {t(`booking.meeting_type.${booking.meeting_type}`)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900">
                          {booking.booked_by_name}
                        </div>
                        {booking.department_name && (
                          <div className="text-xs text-gray-500">
                            {booking.department_name}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(booking.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetail(booking)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            {t('button.view_details')}
                          </button>
                          {confirmApproveId === booking.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleApprove(booking.id)}
                                className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setConfirmApproveId(null)}
                                className="px-2 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                ✗
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmApproveId(booking.id)}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              ✓ {t('button.approve')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              loadPendingBookings();
              setShowDetail(false);
              setSelectedBooking(null);
            }}
            adminMode={true}
          />
        )}
      </div>
    </>
  );
};

export default AdminApprovalPage;
