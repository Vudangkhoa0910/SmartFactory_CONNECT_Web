/**
 * ForwardToDepartmentModal.tsx
 * Modal để Coordinator (Admin) chuyển tiếp ý kiến Pink Box đến phòng ban
 * Modal for Coordinator (Admin) to forward Pink Box feedback to department
 * 
 * Song ngữ / Bilingual: Việt - Nhật
 */
import React, { useState } from "react";
import { X, Send, Building2 } from "lucide-react";
import { toast } from "react-toastify";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import api from "../../services/api";

interface Department {
  id: string;
  name: string;
  name_ja?: string;
}

interface ForwardToDepartmentModalProps {
  message: SensitiveMessage;
  departments: Department[];
  loading?: boolean;
  onClose: () => void;
  onSuccess: (messageId: string, departmentId: string) => void;
}

export const ForwardToDepartmentModal: React.FC<ForwardToDepartmentModalProps> = ({
  message,
  departments = [],
  loading = false,
  onClose,
  onSuccess,
}) => {
  const { language } = useTranslation();
  const [departmentId, setDepartmentId] = useState("");
  const [noteVi, setNoteVi] = useState("");
  const [noteJa, setNoteJa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForward = async () => {
    if (!departmentId) {
      toast.warning(
        language === 'ja' 
          ? '転送先の部署を選択してください' 
          : 'Vui lòng chọn phòng ban để chuyển tiếp'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      
      await api.post(`/ideas/${message.id}/forward`, {
        department_id: departmentId,
        note: noteVi,
        note_ja: noteJa
      });

      toast.success(
        language === 'ja'
          ? '意見を部署に転送しました'
          : 'Đã chuyển tiếp ý kiến đến phòng ban'
      );
      
      onSuccess(message.id, departmentId);
      onClose();
    } catch (error: any) {
      console.error("Forward failed:", error);
      toast.error(
        language === 'ja'
          ? `転送に失敗しました: ${error.response?.data?.message || error.message}`
          : `Chuyển tiếp thất bại: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center bg-gradient-to-r from-red-600 to-red-500 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Building2 size={20} />
            <h3 className="text-lg font-semibold">
              {language === 'ja' ? '部署へ転送' : 'Chuyển tiếp đến Phòng ban'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Selected idea */}
          <div className="bg-gray-50 dark:bg-neutral-900 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {language === 'ja' ? '転送する意見' : 'Ý kiến sẽ chuyển tiếp'}:
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              "{message.title}"
            </p>
          </div>

          {/* Department select */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              {language === 'ja' ? '転送先部署 *' : 'Chọn phòng ban *'}
            </label>
            <select
              onChange={(e) => setDepartmentId(e.target.value)}
              value={departmentId}
              disabled={isLoading}
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">
                {language === 'ja' ? '-- 部署を選択 --' : '-- Chọn phòng ban --'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'ja' && d.name_ja ? d.name_ja : d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Note Vietnamese */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🇻🇳 Ghi chú (Tiếng Việt)
            </label>
            <textarea
              rows={3}
              value={noteVi}
              onChange={(e) => setNoteVi(e.target.value)}
              disabled={isLoading}
              placeholder="Nhập ghi chú cho phòng ban..."
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Note Japanese */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🇯🇵 備考 (日本語)
            </label>
            <textarea
              rows={3}
              value={noteJa}
              onChange={(e) => setNoteJa(e.target.value)}
              disabled={isLoading}
              placeholder="部署へのメモを入力..."
              className="w-full p-3 border dark:border-neutral-600 rounded-lg text-sm bg-white dark:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          {/* Info note */}
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300">
              {language === 'ja' 
                ? '⚠️ 転送後、部署が回答を提出するまでお待ちください。回答後、確認してから公開できます。'
                : '⚠️ Sau khi chuyển tiếp, phòng ban sẽ nhận được thông báo và phản hồi. Bạn sẽ xem xét phản hồi trước khi công khai.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex justify-end gap-3 border-t dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded-lg border dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
          >
            {language === 'ja' ? 'キャンセル' : 'Hủy'}
          </button>
          <button
            onClick={handleForward}
            disabled={isLoading || !departmentId}
            className={`px-5 py-2 text-sm text-white bg-gradient-to-r from-red-600 to-red-500 rounded-lg hover:from-red-700 hover:to-red-600 flex items-center gap-2 transition-colors ${
              isLoading || !departmentId ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Send size={16} />
            {isLoading 
              ? (language === 'ja' ? '処理中...' : 'Đang xử lý...')
              : (language === 'ja' ? '転送する' : 'Chuyển tiếp')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardToDepartmentModal;
