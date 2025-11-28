/**
 * BOOKING DETAIL MODAL
 * Modal showing booking details with approve/reject/cancel actions
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import roomBookingService, { formatDate, formatTime } from '../../services/room-booking.service';
import { 
  RoomBooking, 
  BookingHistoryEntry,
  MEETING_TYPE_LABELS,
  BOOKING_STATUS_LABELS 
} from '../../types/room-booking.types';

interface BookingDetailModalProps {
  booking: RoomBooking;
  onClose: () => void;
  onUpdate: () => void;
  adminMode?: boolean;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  onClose,
  onUpdate,
  adminMode = false
}) => {
  const [currentBooking, setCurrentBooking] = useState<RoomBooking>(booking);
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Get current user
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser && currentUser.role === 'admin';
  const isOwner = currentUser && currentUser.id === currentBooking.booked_by_user_id;

  // Load booking details with history
  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await roomBookingService.getBookingById(currentBooking.id);
        setCurrentBooking(data.booking);
        setHistory(data.history);
      } catch (error) {
        console.error('Error loading booking details:', error);
      }
    };

    loadDetails();
  }, [currentBooking.id]);

  // Handle approve
  const handleApprove = async () => {
    if (!window.confirm('Bạn có chắc muốn phê duyệt lịch đặt phòng này?')) return;

    setLoading(true);
    try {
      await roomBookingService.approveBooking(currentBooking.id);
      toast.success('Đã phê duyệt lịch đặt phòng');
      onUpdate();
    } catch (error: unknown) {
      console.error('Error approving booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể phê duyệt');
    } finally {
      setLoading(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setLoading(true);
    try {
      await roomBookingService.rejectBooking(currentBooking.id, rejectionReason);
      toast.success('Đã từ chối lịch đặt phòng');
      onUpdate();
    } catch (error: unknown) {
      console.error('Error rejecting booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể từ chối');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel (for owner)
  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy lịch đặt phòng này?')) return;

    setLoading(true);
    try {
      await roomBookingService.cancelBooking(currentBooking.id);
      toast.success('Đã hủy lịch đặt phòng');
      onUpdate();
    } catch (error: unknown) {
      console.error('Error cancelling booking:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Không thể hủy');
    } finally {
      setLoading(false);
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS]}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-gray-400/50 backdrop-blur-[32px]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentBooking.title}
              </h3>
              {getStatusBadge(currentBooking.status)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentBooking.room_name} ({currentBooking.room_code})
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Meeting Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Loại cuộc họp</label>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: currentBooking.color }}
                ></span>
                <span className="text-gray-900 dark:text-white">
                  {MEETING_TYPE_LABELS[currentBooking.meeting_type]}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Số người tham dự</label>
              <p className="text-gray-900 dark:text-white mt-1">
                {currentBooking.attendees_count} người
              </p>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Thời gian</label>
            <p className="text-gray-900 dark:text-white mt-1">
              📅 {formatDate(currentBooking.booking_date)}
            </p>
            <p className="text-gray-900 dark:text-white mt-1">
              🕐 {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
            </p>
          </div>

          {/* Description */}
          {currentBooking.description && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Mô tả</label>
              <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                {currentBooking.description}
              </p>
            </div>
          )}

          {/* Notes */}
          {currentBooking.notes && (
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ghi chú</label>
              <p className="text-gray-900 dark:text-white mt-1">
                {currentBooking.notes}
              </p>
            </div>
          )}

          {/* Booker Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Người đặt</label>
            <p className="text-gray-900 dark:text-white mt-1">
              👤 {currentBooking.booked_by_name}
            </p>
            {currentBooking.department_name && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                🏢 {currentBooking.department_name}
              </p>
            )}
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
              Đặt lúc: {new Date(currentBooking.created_at).toLocaleString('vi-VN')}
            </p>
          </div>

          {/* Approval Info */}
          {currentBooking.approved_by_name && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {currentBooking.status === 'confirmed' ? 'Người phê duyệt' : 'Người xử lý'}
              </label>
              <p className="text-gray-900 dark:text-white mt-1">
                👤 {currentBooking.approved_by_name}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                Lúc: {currentBooking.approved_at ? new Date(currentBooking.approved_at).toLocaleString('vi-VN') : 'N/A'}
              </p>
              {currentBooking.rejection_reason && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  <strong>Lý do từ chối:</strong> {currentBooking.rejection_reason}
                </p>
              )}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
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
                        {entry.action === 'created' && 'đã tạo lịch đặt phòng'}
                        {entry.action === 'approved' && 'đã phê duyệt'}
                        {entry.action === 'rejected' && 'đã từ chối'}
                        {entry.action === 'cancelled' && 'đã hủy'}
                        {entry.action === 'updated' && 'đã cập nhật'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">
                        {new Date(entry.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Admin Actions - Pending Status */}
            {isAdmin && adminMode && currentBooking.status === 'pending' && (
              <div className="space-y-3">
                {!showRejectForm ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      ✓ Phê duyệt
                    </button>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      ✗ Từ chối
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lý do từ chối
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Nhập lý do từ chối..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReject}
                        disabled={loading || !rejectionReason.trim()}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Xác nhận từ chối
                      </button>
                      <button
                        onClick={() => {
                          setShowRejectForm(false);
                          setRejectionReason('');
                        }}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Owner Cancel - Pending Status */}
            {isOwner && !adminMode && currentBooking.status === 'pending' && (
              <div className="mb-3">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Hủy lịch đặt phòng
                </button>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 mt-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
