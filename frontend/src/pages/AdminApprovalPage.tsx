/**
 * ADMIN APPROVAL PAGE
 * Page for admin to review and approve/reject pending bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Inbox, Check } from 'lucide-react';
import PageMeta from '../components/common/PageMeta';
import roomBookingService, { formatDate, formatTime } from '../services/room-booking.service';
import { 
  RoomBooking 
} from '../types/room-booking.types';
import BookingDetailModal from '../components/room-booking/BookingDetailModal';
import { useTranslation } from '../contexts/LanguageContext';

const AdminApprovalPage: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { t } = useTranslation();

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
    if (selectedIds.length === pendingBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingBookings.map(b => b.id));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error(t('booking.select_at_least_one'));
      return;
    }

    if (!window.confirm(t('booking.confirm_bulk_approve'))) {
      return;
    }

    try {
      const result = await roomBookingService.bulkApproveBookings(selectedIds);
      toast.success(result.message);
      setSelectedIds([]);
      loadPendingBookings();
    } catch (error: unknown) {
      console.error('Error bulk approving:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể phê duyệt hàng loạt');
    }
  };

  // Handle approve single
  const handleApprove = async (id: number) => {
    if (!window.confirm(t('booking.confirm_single_approve'))) return;

    try {
      await roomBookingService.approveBooking(id);
      toast.success('Đã phê duyệt lịch đặt phòng');
      loadPendingBookings();
    } catch (error: unknown) {
      console.error('Error approving:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể phê duyệt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
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
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('menu.admin_approval')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {pendingBookings.length} {t('booking.pending_count')}
              </p>
            </div>          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('common.selected')}: {selectedIds.length}
              </span>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4" /> {t('button.bulk_approve')}
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('button.deselect_all')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {pendingBookings.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('booking.no_pending_approvals')}
          </h3>
          <p className="text-gray-500">
            {t('booking.all_processed')}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === pendingBookings.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
                    {t('booking.room')}
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">
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
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          ✓ {t('button.approve')}
                        </button>
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
