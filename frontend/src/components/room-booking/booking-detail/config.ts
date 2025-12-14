/**
 * BookingDetailModal Types and Utilities - SmartFactory CONNECT
 */
import { BOOKING_STATUS_LABELS } from '../../types/room-booking.types';

export interface BookingDetailModalProps {
  booking: import('../../types/room-booking.types').RoomBooking;
  onClose: () => void;
  onUpdate: () => void;
  adminMode?: boolean;
}

// Status badge styles
export const STATUS_BADGE_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
};

export const getStatusBadge = (status: string) => {
  const label = BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] || status;
  const style = STATUS_BADGE_STYLES[status as keyof typeof STATUS_BADGE_STYLES] || STATUS_BADGE_STYLES.pending;
  return { label, style };
};
