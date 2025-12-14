/**
 * BookingActions Component - SmartFactory CONNECT
 */
import React from 'react';

interface BookingActionsProps {
  isAdmin: boolean;
  isOwner: boolean;
  adminMode: boolean;
  status: string;
  loading: boolean;
  showRejectForm: boolean;
  rejectionReason: string;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  onClose: () => void;
  onShowRejectForm: (show: boolean) => void;
  onRejectionReasonChange: (reason: string) => void;
}

const BookingActions: React.FC<BookingActionsProps> = ({
  isAdmin,
  isOwner,
  adminMode,
  status,
  loading,
  showRejectForm,
  rejectionReason,
  onApprove,
  onReject,
  onCancel,
  onClose,
  onShowRejectForm,
  onRejectionReasonChange,
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      {/* Admin Actions - Pending Status */}
      {isAdmin && adminMode && status === 'pending' && (
        <div className="space-y-3">
          {!showRejectForm ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onApprove}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Phê duyệt
              </button>
              <button
                onClick={() => onShowRejectForm(true)}
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
                onChange={(e) => onRejectionReasonChange(e.target.value)}
                placeholder="Nhập lý do từ chối..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận từ chối
                </button>
                <button
                  onClick={() => {
                    onShowRejectForm(false);
                    onRejectionReasonChange('');
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
      {isOwner && !adminMode && status === 'pending' && (
        <div className="mb-3">
          <button
            onClick={onCancel}
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
  );
};

export default BookingActions;
