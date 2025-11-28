/**
 * ADMIN APPROVAL PAGE
 * Page for admin to review and approve/reject pending bookings
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import roomBookingService, { formatDate, formatTime } from '../services/room-booking.service';
import { 
  RoomBooking, 
  MEETING_TYPE_LABELS 
} from '../types/room-booking.types';
import BookingDetailModal from '../components/room-booking/BookingDetailModal';

const AdminApprovalPage: React.FC = () => {
  const [pendingBookings, setPendingBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Load pending bookings
  const loadPendingBookings = async () => {
    try {
      setLoading(true);
      const data = await roomBookingService.getPendingBookings();
      setPendingBookings(data);
    } catch (error) {
      console.error('Error loading pending bookings:', error);
      toast.error('Không thể tải danh sách chờ duyệt');
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
      toast.error('Vui lòng chọn ít nhất một lịch đặt phòng');
      return;
    }

    if (!window.confirm(`Bạn có chắc muốn phê duyệt ${selectedIds.length} lịch đặt phòng?`)) {
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
    if (!window.confirm('Bạn có chắc muốn phê duyệt lịch đặt phòng này?')) return;

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phê Duyệt Lịch Đặt Phòng
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingBookings.length} lịch đặt phòng đang chờ phê duyệt
            </p>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã chọn: {selectedIds.length}
              </span>
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✓ Phê duyệt hàng loạt
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Hủy chọn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {pendingBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không có lịch đặt phòng nào chờ duyệt
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Tất cả lịch đặt phòng đã được xử lý
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === pendingBookings.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Phòng
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tiêu đề
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Loại
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thời gian
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Người đặt
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Chờ từ
                  </th>
                  <th className="p-4 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pendingBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(booking.id)}
                        onChange={() => handleSelect(booking.id)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {booking.room_code}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.room_name}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {booking.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {booking.attendees_count} người
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: booking.color }}
                        ></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {MEETING_TYPE_LABELS[booking.meeting_type]}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(booking.booking_date)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {booking.booked_by_name}
                      </div>
                      {booking.department_name && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {booking.department_name}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(booking.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(booking.created_at).toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(booking)}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                        >
                          ✓ Duyệt
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
  );
};

export default AdminApprovalPage;
