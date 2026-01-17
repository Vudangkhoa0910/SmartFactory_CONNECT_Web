/**
 * ScheduleMeetingModal.tsx
 * Modal để lên lịch họp trực tiếp cho White Box ideas
 * Modal to schedule face-to-face meeting for White Box ideas
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, Users, MapPin, Send } from "lucide-react";
import { toast } from "react-toastify";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location?: string;
}

interface ScheduleMeetingModalProps {
  idea: SensitiveMessage;
  onClose: () => void;
  onSuccess: (ideaId: string, bookingId: string) => void;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  idea,
  onClose,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  
  // Form state
  const [selectedRoom, setSelectedRoom] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("idea_discussion");
  const [noteVi, setNoteVi] = useState("");
  const [noteJa, setNoteJa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setRooms(res.data.data || []);
        if (res.data.data?.length > 0) {
          setSelectedRoom(res.data.data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        toast.error(
          language === 'ja' 
            ? '会議室の取得に失敗しました' 
            : 'Không thể tải danh sách phòng họp'
        );
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(tomorrow.toISOString().split('T')[0]);
  }, [language]);

  const handleSchedule = async () => {
    if (!selectedRoom) {
      toast.warning(
        language === 'ja' 
          ? '会議室を選択してください' 
          : 'Vui lòng chọn phòng họp'
      );
      return;
    }

    if (!meetingDate) {
      toast.warning(
        language === 'ja' 
          ? '日付を選択してください' 
          : 'Vui lòng chọn ngày họp'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      const startISO = `${meetingDate}T${startTime}:00Z`;
      const endISO = `${meetingDate}T${endTime}:00Z`;

      const res = await api.post(`/ideas/${idea.id}/schedule-meeting`, {
        room_id: selectedRoom,
        start_time: startISO,
        end_time: endISO,
        purpose: purpose,
        notes: noteVi,
        notes_ja: noteJa
      });

      toast.success(
        language === 'ja'
          ? '会議を予約しました'
          : 'Đã đặt lịch họp thành công'
      );
      
      onSuccess(idea.id, res.data.data?.booking?.id || '');
      onClose();
    } catch (error: any) {
      console.error("Schedule meeting failed:", error);
      toast.error(
        language === 'ja'
          ? `予約に失敗しました: ${error.response?.data?.message || error.message}`
          : `Đặt lịch thất bại: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeOptions = [
    { value: 'idea_discussion', labelVi: 'Thảo luận ý tưởng', labelJa: 'アイデア相談' },
    { value: 'problem_solving', labelVi: 'Giải quyết vấn đề', labelJa: '問題解決' },
    { value: 'follow_up', labelVi: 'Theo dõi tiến độ', labelJa: 'フォローアップ' },
    { value: 'clarification', labelVi: 'Làm rõ nội dung', labelJa: '内容確認' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-500">
          <div className="flex items-center gap-2 text-white">
            <Calendar size={20} />
            <h3 className="text-lg font-semibold">
              {language === 'ja' ? '会議を予約' : 'Đặt lịch họp'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Related idea */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {language === 'ja' ? '関連する意見' : 'Ý kiến liên quan'}:
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              "{idea.title}"
            </p>
          </div>

          {/* Room selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <MapPin size={16} />
              {language === 'ja' ? '会議室 *' : 'Phòng họp *'}
            </label>
            {loadingRooms ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-neutral-700 rounded-lg" />
            ) : (
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">
                  {language === 'ja' ? '-- 会議室を選択 --' : '-- Chọn phòng họp --'}
                </option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity} {language === 'ja' ? '名' : 'người'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <Calendar size={16} />
              {language === 'ja' ? '日付 *' : 'Ngày họp *'}
            </label>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              disabled={isSubmitting}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Time range */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Clock size={16} />
                {language === 'ja' ? '開始時間' : 'Giờ bắt đầu'}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                <Clock size={16} />
                {language === 'ja' ? '終了時間' : 'Giờ kết thúc'}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              <Users size={16} />
              {language === 'ja' ? '会議の目的' : 'Mục đích họp'}
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {purposeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {language === 'ja' ? opt.labelJa : opt.labelVi}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                🇻🇳 Ghi chú
              </label>
              <textarea
                rows={3}
                value={noteVi}
                onChange={(e) => setNoteVi(e.target.value)}
                disabled={isSubmitting}
                placeholder="Ghi chú cho cuộc họp..."
                className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                🇯🇵 備考
              </label>
              <textarea
                rows={3}
                value={noteJa}
                onChange={(e) => setNoteJa(e.target.value)}
                disabled={isSubmitting}
                placeholder="会議のメモ..."
                className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Info note */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              {language === 'ja' 
                ? '📅 会議予約後、意見の送信者に通知が届きます。会議は予約カレンダーにも追加されます。'
                : '📅 Sau khi đặt lịch, người gửi ý kiến sẽ nhận được thông báo. Cuộc họp cũng sẽ hiển thị trên lịch đặt phòng.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3 border-t dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-lg border dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {language === 'ja' ? 'キャンセル' : 'Hủy'}
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || !selectedRoom || !meetingDate}
            className={`px-5 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg hover:from-indigo-700 hover:to-indigo-600 flex items-center gap-2 transition-colors ${
              isSubmitting || !selectedRoom || !meetingDate ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Send size={16} />
            {isSubmitting 
              ? (language === 'ja' ? '予約中...' : 'Đang đặt...')
              : (language === 'ja' ? '予約する' : 'Đặt lịch')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
