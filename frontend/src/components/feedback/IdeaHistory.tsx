// src/components/feedback/IdeaHistory.tsx

import React from "react";
import { ActionHistory } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";

interface Department {
  id: string;
  name: string;
}

interface IdeaHistoryProps {
  history: ActionHistory[];
  departments?: Department[];
}

export const IdeaHistory: React.FC<IdeaHistoryProps> = ({
  history,
  departments = []
}) => {
  const { t } = useTranslation();

  const formatHistoryNote = (note: string | undefined, departments: Department[]): string => {
    if (!note) return '';

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(note);

      // Build readable message
      const parts: string[] = [];

      const statusMap: Record<string, string> = {
        'new': 'Mới',
        'pending': 'Chờ xử lý',
        'under_review': 'Đang xem xét',
        'approved': 'Đã phê duyệt',
        'rejected': 'Đã từ chối',
        'implemented': 'Đã triển khai',
        'on_hold': 'Tạm dừng',
        'processed': 'Đã xử lý'
      };

      // Handle initial creation log
      if (parsed.status && parsed.ideabox_type && !parsed.old_status) {
        const boxName = parsed.ideabox_type === 'white' ? 'Hòm trắng' : 'Hòm hồng';
        parts.push(`Đã gửi vào ${boxName}`);
      }

      if (parsed.old_status && parsed.new_status) {
        const oldStatus = statusMap[parsed.old_status] || parsed.old_status;
        const newStatus = statusMap[parsed.new_status] || parsed.new_status;
        parts.push(`Chuyển trạng thái: ${oldStatus} → ${newStatus}`);
      }

      if (parsed.difficulty) {
        parts.push(`Đánh giá độ khó: ${parsed.difficulty}`);
      }

      if (parsed.reason) {
        parts.push(`Lý do: ${parsed.reason}`);
      }

      if (parsed.review_notes) {
        // Parse review notes to extract difficulty info
        const diffMatch = parsed.review_notes.match(/Updated difficulty to ([A-D])/);
        if (diffMatch && !parsed.difficulty) {
          parts.push(`Đánh giá độ khó: ${diffMatch[1]}`);
        } else if (!diffMatch) {
          parts.push(parsed.review_notes);
        }
      }

      if (parsed.assigned_to) {
        parts.push(`Phân công cho: ${parsed.assigned_to}`);
      }

      if (parsed.department) {
        parts.push(`Phòng ban: ${parsed.department}`);
      }

      // Handle department_id - lookup department name
      if (parsed.department_id) {
        const dept = departments.find(d => d.id === parsed.department_id);
        if (dept) {
          parts.push(`Phân công phòng ban: ${dept.name}`);
        } else {
          parts.push(`Phân công phòng ban: ${parsed.department_id}`);
        }
      }

      return parts.length > 0 ? parts.join(' • ') : note;
    } catch (e) {
      // Not JSON, return as-is
      return note;
    }
  };

  const formatDate = (dateValue: string | Date) => {
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }

      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {t('idea.no_history')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
        {t('idea.action_history')}
      </h3>
      {history.map((item, idx) => {
        // Format action name
        const actionMap: Record<string, string> = {
          'submitted': 'Đã gửi',
          'assigned': 'Đã phân công',
          'reviewed': 'Đã xem xét',
          'implemented': 'Đã triển khai',
          'escalated': 'Đã chuyển cấp trên',
          'responded': 'Đã phản hồi'
        };
        const actionLabel = actionMap[item.action || ''] || item.action || 'Cập nhật';

        // Format note - skip showing raw JSON for initial submission
        const formattedNote = String(formatHistoryNote(item.note, departments) || '');
        const isInitialSubmission = item.action === 'submitted' && formattedNote.includes('Đã gửi vào');

        return (
          <div
            key={idx}
            className="bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {actionLabel}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(item.time)}
              </span>
            </div>
            {item.note && !isInitialSubmission && formattedNote && (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formattedNote}
              </p>
            )}
            {item.by && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('idea.performed_by')}: {item.by}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

