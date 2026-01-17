/**
 * BOOKING DETAIL MODAL
 * Modal showing booking details with approve/reject/cancel actions
 * Refactored to use modular components
 */

import React from 'react';
import { RoomBooking } from '../../../types/room-booking.types';
import { getStatusBadge } from './config';
import useBookingDetail from './useBookingDetail';
import BookingInfo from './BookingInfo';
import BookingHistory from './BookingHistory';
import BookingActions from './BookingActions';

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
  const {
    currentBooking,
    history,
    loading,
    showRejectForm,
    setShowRejectForm,
    rejectionReason,
    setRejectionReason,
    isAdmin,
    isOwner,
    handleApprove,
    handleReject,
    handleCancel,
  } = useBookingDetail({ booking, onUpdate });

  const statusBadge = getStatusBadge(currentBooking.status);

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
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.style}`}>
                {statusBadge.label}
              </span>
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
          <BookingInfo booking={currentBooking} />
          <BookingHistory history={history} />
          <BookingActions
            isAdmin={isAdmin}
            isOwner={isOwner}
            adminMode={adminMode}
            status={currentBooking.status}
            loading={loading}
            showRejectForm={showRejectForm}
            rejectionReason={rejectionReason}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
            onClose={onClose}
            onShowRejectForm={setShowRejectForm}
            onRejectionReasonChange={setRejectionReason}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;
