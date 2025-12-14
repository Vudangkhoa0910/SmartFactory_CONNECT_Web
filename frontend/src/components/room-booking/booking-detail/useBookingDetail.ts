/**
 * useBookingDetail Hook - SmartFactory CONNECT
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import roomBookingService from '../../../services/room-booking.service';
import { RoomBooking, BookingHistoryEntry } from '../../../types/room-booking.types';

interface UseBookingDetailProps {
  booking: RoomBooking;
  onUpdate: () => void;
}

interface UseBookingDetailReturn {
  currentBooking: RoomBooking;
  history: BookingHistoryEntry[];
  loading: boolean;
  showRejectForm: boolean;
  setShowRejectForm: (show: boolean) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isAdmin: boolean;
  isOwner: boolean;
  handleApprove: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleCancel: () => Promise<void>;
}

export function useBookingDetail({ booking, onUpdate }: UseBookingDetailProps): UseBookingDetailReturn {
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
  const handleApprove = useCallback(async () => {
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
  }, [currentBooking.id, onUpdate]);

  // Handle reject
  const handleReject = useCallback(async () => {
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
  }, [currentBooking.id, rejectionReason, onUpdate]);

  // Handle cancel (for owner)
  const handleCancel = useCallback(async () => {
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
  }, [currentBooking.id, onUpdate]);

  return {
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
  };
}

export default useBookingDetail;
