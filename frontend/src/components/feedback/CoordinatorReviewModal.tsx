/**
 * CoordinatorReviewModal.tsx
 * Modal để Coordinator xem xét phản hồi từ phòng ban và quyết định công khai hoặc yêu cầu chỉnh sửa
 * Modal for Coordinator to review department response and decide to publish or request revision
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState } from "react";
import { X, Check, RotateCcw, Globe, Edit3 } from "lucide-react";
import { toast } from "react-toastify";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";

interface CoordinatorReviewModalProps {
  message: SensitiveMessage;
  onClose: () => void;
  onSuccess: (messageId: string, action: 'publish' | 'revision') => void;
}

export const CoordinatorReviewModal: React.FC<CoordinatorReviewModalProps> = ({
  message,
  onClose,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const [action, setAction] = useState<'publish' | 'revision' | null>(null);
  const [editedResponseVi, setEditedResponseVi] = useState(message.departmentResponse?.department_response || "");
  const [editedResponseJa, setEditedResponseJa] = useState(message.departmentResponse?.department_response_ja || "");
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    if (!editedResponseVi.trim() && !editedResponseJa.trim()) {
      toast.warning(
        language === 'ja' 
          ? '公開する回答内容を入力してください' 
          : 'Vui lòng nhập nội dung phản hồi để công khai'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post(`/ideas/${message.id}/publish`, {
        response: editedResponseVi,
        response_ja: editedResponseJa
      });

      toast.success(
        language === 'ja'
          ? '回答を公開しました'
          : 'Đã công khai phản hồi lên bảng thông báo'
      );
      
      onSuccess(message.id, 'publish');
      onClose();
    } catch (error: any) {
      console.error("Publish failed:", error);
      toast.error(
        language === 'ja'
          ? `公開に失敗しました: ${error.response?.data?.message || error.message}`
          : `Công khai thất bại: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) {
      toast.warning(
        language === 'ja' 
          ? '修正依頼の内容を入力してください' 
          : 'Vui lòng nhập nội dung yêu cầu chỉnh sửa'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post(`/ideas/${message.id}/request-revision`, {
        note: revisionNote
      });

      toast.success(
        language === 'ja'
          ? '修正依頼を送信しました'
          : 'Đã gửi yêu cầu chỉnh sửa đến phòng ban'
      );
      
      onSuccess(message.id, 'revision');
      onClose();
    } catch (error: any) {
      console.error("Request revision failed:", error);
      toast.error(
        language === 'ja'
          ? `送信に失敗しました: ${error.response?.data?.message || error.message}`
          : `Gửi yêu cầu thất bại: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center bg-gradient-to-r from-green-600 to-green-500 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Check size={20} />
            <h3 className="text-lg font-semibold">
              {language === 'ja' ? '回答の確認・公開' : 'Xem xét & Công khai Phản hồi'}
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

        {/* Content - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Original question */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              📩 {language === 'ja' ? '元の意見' : 'Ý kiến gốc'}:
            </p>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {message.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {message.fullContent}
            </p>
          </div>

          {/* Department response (read-only) */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium">
              📝 {language === 'ja' ? '部署からの回答' : 'Phản hồi từ Phòng ban'}:
            </p>
            <div className="space-y-2">
              {message.departmentResponse?.department_response && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  🇻🇳 {message.departmentResponse.department_response}
                </p>
              )}
              {message.departmentResponse?.department_response_ja && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  🇯🇵 {message.departmentResponse.department_response_ja}
                </p>
              )}
            </div>
          </div>

          {/* Action selection */}
          <div className="flex gap-4">
            <button
              onClick={() => setAction('publish')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'publish'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-green-300'
              }`}
            >
              <Globe size={24} className={`mx-auto mb-2 ${action === 'publish' ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${action === 'publish' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {language === 'ja' ? '公開する' : 'Công khai'}
              </p>
            </button>
            <button
              onClick={() => setAction('revision')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                action === 'revision'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-neutral-700 hover:border-orange-300'
              }`}
            >
              <RotateCcw size={24} className={`mx-auto mb-2 ${action === 'revision' ? 'text-orange-600' : 'text-gray-400'}`} />
              <p className={`text-sm font-medium ${action === 'revision' ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {language === 'ja' ? '修正依頼' : 'Yêu cầu chỉnh sửa'}
              </p>
            </button>
          </div>

          {/* Publish form */}
          {action === 'publish' && (
            <div className="space-y-4 border-t border-gray-200 dark:border-neutral-700 pt-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Edit3 size={16} />
                <p className="text-sm font-medium">
                  {language === 'ja' 
                    ? '公開前に回答を編集できます（任意）' 
                    : 'Có thể chỉnh sửa trước khi công khai (tùy chọn)'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  🇻🇳 Phản hồi công khai (Tiếng Việt)
                </label>
                <textarea
                  rows={4}
                  value={editedResponseVi}
                  onChange={(e) => setEditedResponseVi(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  🇯🇵 公開する回答 (日本語)
                </label>
                <textarea
                  rows={4}
                  value={editedResponseJa}
                  onChange={(e) => setEditedResponseJa(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Revision request form */}
          {action === 'revision' && (
            <div className="space-y-4 border-t border-gray-200 dark:border-neutral-700 pt-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  {language === 'ja' ? '修正依頼の内容 *' : 'Nội dung yêu cầu chỉnh sửa *'}
                </label>
                <textarea
                  rows={4}
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  disabled={isSubmitting}
                  placeholder={language === 'ja' 
                    ? '部署に修正してほしい点を入力...' 
                    : 'Nhập nội dung cần phòng ban chỉnh sửa...'}
                  className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3 border-t dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm rounded-lg border dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {language === 'ja' ? 'キャンセル' : 'Hủy'}
          </button>
          
          {action === 'publish' && (
            <button
              onClick={handlePublish}
              disabled={isSubmitting || (!editedResponseVi.trim() && !editedResponseJa.trim())}
              className={`px-5 py-2 text-sm text-white bg-gradient-to-r from-green-600 to-green-500 rounded-lg hover:from-green-700 hover:to-green-600 flex items-center gap-2 transition-colors ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Globe size={16} />
              {isSubmitting 
                ? (language === 'ja' ? '処理中...' : 'Đang xử lý...')
                : (language === 'ja' ? '公開する' : 'Công khai')}
            </button>
          )}
          
          {action === 'revision' && (
            <button
              onClick={handleRequestRevision}
              disabled={isSubmitting || !revisionNote.trim()}
              className={`px-5 py-2 text-sm text-white bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg hover:from-orange-700 hover:to-orange-600 flex items-center gap-2 transition-colors ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RotateCcw size={16} />
              {isSubmitting 
                ? (language === 'ja' ? '送信中...' : 'Đang gửi...')
                : (language === 'ja' ? '修正依頼を送信' : 'Gửi yêu cầu')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorReviewModal;
