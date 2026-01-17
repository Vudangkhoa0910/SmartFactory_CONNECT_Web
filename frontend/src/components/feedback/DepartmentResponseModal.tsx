/**
 * DepartmentResponseModal.tsx
 * Modal để Phòng ban phản hồi ý kiến Pink Box đã được chuyển tiếp
 * Modal for Department to respond to forwarded Pink Box feedback
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState } from "react";
import { X, MessageSquare, Send } from "lucide-react";
import { toast } from "react-toastify";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";

interface DepartmentResponseModalProps {
  message: SensitiveMessage;
  onClose: () => void;
  onSuccess: (messageId: string) => void;
}

export const DepartmentResponseModal: React.FC<DepartmentResponseModalProps> = ({
  message,
  onClose,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const [responseVi, setResponseVi] = useState("");
  const [responseJa, setResponseJa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!responseVi.trim() && !responseJa.trim()) {
      toast.warning(
        language === 'ja' 
          ? '回答内容を入力してください' 
          : 'Vui lòng nhập nội dung phản hồi'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post(`/ideas/${message.id}/department-response`, {
        response: responseVi,
        response_ja: responseJa
      });

      toast.success(
        language === 'ja'
          ? '回答を送信しました。管理者が確認します。'
          : 'Đã gửi phản hồi. Coordinator sẽ xem xét.'
      );
      
      onSuccess(message.id);
      onClose();
    } catch (error: any) {
      console.error("Response submission failed:", error);
      toast.error(
        language === 'ja'
          ? `送信に失敗しました: ${error.response?.data?.message || error.message}`
          : `Gửi phản hồi thất bại: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-500">
          <div className="flex items-center gap-2 text-white">
            <MessageSquare size={20} />
            <h3 className="text-lg font-semibold">
              {language === 'ja' ? '意見への回答' : 'Phản hồi Ý kiến'}
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
          {/* Original message */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {language === 'ja' ? '元の意見' : 'Ý kiến gốc'}:
            </p>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              {message.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {message.fullContent}
            </p>
            {message.forwardInfo?.forwarded_note && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {language === 'ja' ? '管理者からの備考' : 'Ghi chú từ Coordinator'}:
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {language === 'ja' 
                    ? message.forwardInfo.forwarded_note_ja || message.forwardInfo.forwarded_note
                    : message.forwardInfo.forwarded_note}
                </p>
              </div>
            )}
          </div>

          {/* Response Vietnamese */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🇻🇳 Phản hồi (Tiếng Việt) *
            </label>
            <textarea
              rows={5}
              value={responseVi}
              onChange={(e) => setResponseVi(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập nội dung phản hồi chi tiết..."
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Response Japanese */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🇯🇵 回答 (日本語) *
            </label>
            <textarea
              rows={5}
              value={responseJa}
              onChange={(e) => setResponseJa(e.target.value)}
              disabled={isSubmitting}
              placeholder="詳細な回答内容を入力..."
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {language === 'ja' 
                ? '💡 回答は管理者（Coordinator）が確認後、公開ボードに掲載されます。匿名性は保持されます。'
                : '💡 Phản hồi của bạn sẽ được Coordinator xem xét trước khi đăng lên bảng công khai. Tính ẩn danh được bảo toàn.'}
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
            onClick={handleSubmit}
            disabled={isSubmitting || (!responseVi.trim() && !responseJa.trim())}
            className={`px-5 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 flex items-center gap-2 transition-colors ${
              isSubmitting || (!responseVi.trim() && !responseJa.trim()) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Send size={16} />
            {isSubmitting 
              ? (language === 'ja' ? '送信中...' : 'Đang gửi...')
              : (language === 'ja' ? '回答を送信' : 'Gửi phản hồi')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentResponseModal;
