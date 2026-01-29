// src/components/feedback/IdeaHistory.tsx

import React from "react";
import { ActionHistory } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import {
  History,
  User,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  FastForward,
  Info,
  Star
} from "lucide-react";

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

  // Capitalize first letter helper
  const capitalize = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatHistoryNote = (note: string | undefined, departments: Department[]): string => {
    if (!note) return '';

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(note);

      // If it's the specific format {"note":"..."}
      if (parsed.note && Object.keys(parsed).length === 1) {
        return capitalize(parsed.note);
      }

      // Build readable message
      const parts: string[] = [];

      const statusMap: Record<string, string> = {
        'new': 'Mới',
        'pending': 'Chờ xử lý',
        'under_review': 'Đã xem xét',
        'approved': 'Đã phê duyệt',
        'rejected': 'Đã từ chối',
        'implemented': 'Đã triển khai',
        'on_hold': 'Tạm hoãn',
        'processed': 'Đã xử lý',
        'in_progress': 'Đang xử lý'
      };

      // Handle note field if it exists alongside other fields
      if (parsed.note) {
        parts.push(capitalize(parsed.note));
      }

      // Handle initial creation log
      if (parsed.status && parsed.ideabox_type && !parsed.old_status) {
        const boxName = parsed.ideabox_type === 'white' ? t('idea.white_box') : t('idea.pink_box');
        parts.push(`${capitalize(t('idea.submitted'))} ${boxName}`);
      }

      if (parsed.old_status && parsed.new_status) {
        const oldStatus = statusMap[parsed.old_status] || capitalize(parsed.old_status);
        const newStatus = statusMap[parsed.new_status] || capitalize(parsed.new_status);
        parts.push(`${capitalize(t('feedback.updated_status_to'))}: ${oldStatus} → ${newStatus}`);
      }

      if (parsed.difficulty) {
        parts.push(`${capitalize(t('kaizen.difficulty'))}: ${parsed.difficulty}`);
      }

      if (parsed.reason) {
        parts.push(`${capitalize(t('booking.reason'))}: ${capitalize(parsed.reason)}`);
      }

      if (parsed.review_notes) {
        // Parse review notes to extract difficulty info
        const diffMatch = parsed.review_notes.match(/Updated difficulty to ([A-D])/);
        if (diffMatch && !parsed.difficulty) {
          parts.push(`${capitalize(t('kaizen.difficulty'))}: ${diffMatch[1]}`);
        } else if (!diffMatch) {
          parts.push(capitalize(parsed.review_notes));
        }
      }

      if (parsed.assigned_to) {
        parts.push(`${capitalize(t('label.assigned_to'))}: ${parsed.assigned_to}`);
      }

      if (parsed.department) {
        parts.push(`${capitalize(t('label.department'))}: ${parsed.department}`);
      }

      // Handle department_id - lookup department name
      if (parsed.department_id) {
        const dept = departments.find(d => d.id === parsed.department_id);
        if (dept) {
          parts.push(`${capitalize(t('feedback.forward_to'))}: ${dept.name}`);
        } else {
          parts.push(`${capitalize(t('feedback.forward_to'))}: ${parsed.department_id}`);
        }
      }

      if (parsed.overall_rating) {
        parts.push(`${capitalize(t('idea.rated'))}: ${parsed.overall_rating} ${t('idea.stars')}`);
      }

      if (parsed.is_satisfied !== undefined) {
        parts.push(capitalize(parsed.is_satisfied ? t('kaizen.is_satisfied_yes') : t('kaizen.is_satisfied_no')));
      }

      return parts.length > 0 ? parts.join(' • ') : capitalize(note);
    } catch (e) {
      // Not JSON, return as-is with capitalize
      return capitalize(note);
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-gray-600 dark:text-gray-400">
          <History size={18} />
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('idea.action_history')}
        </h3>
      </div>

      <div className="relative pl-5 space-y-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-neutral-700">
        {history.map((item, idx) => {
          // Parse note to get new_status for better label
          let newStatus = null;
          try {
            if (item.note) {
              const parsed = JSON.parse(item.note);
              newStatus = parsed.new_status;
            }
          } catch (e) {
            // Ignore parse error
          }

          // Format action name and icon
          const actionMap: Record<string, { label: string, icon: React.ReactNode, color: string }> = {
            'submitted': { label: capitalize(t('idea.submitted')), icon: <CheckCircle2 size={12} />, color: 'bg-green-500' },
            'created': { label: capitalize(t('idea.submitted')), icon: <CheckCircle2 size={12} />, color: 'bg-green-500' },
            'assigned': { label: capitalize(t('status.assigned')), icon: <User size={12} />, color: 'bg-blue-500' },
            'reviewed': { label: 'Đã xem xét', icon: <Info size={12} />, color: 'bg-amber-500' },
            'approved': { label: 'Đã phê duyệt', icon: <CheckCircle2 size={12} />, color: 'bg-emerald-500' },
            'rejected': { label: 'Đã từ chối', icon: <XCircle size={12} />, color: 'bg-red-500' },
            'implemented': { label: 'Đã triển khai', icon: <CheckCircle2 size={12} />, color: 'bg-indigo-500' },
            'escalated': { label: capitalize(t('feedback.escalate')), icon: <FastForward size={12} />, color: 'bg-purple-500' },
            'responded': { label: capitalize(t('feedback.replied')), icon: <MessageSquare size={12} />, color: 'bg-sky-500' },
            'rated': { label: capitalize(t('idea.rated')), icon: <Star size={12} className="fill-white" />, color: 'bg-amber-500' },
            'updated': { label: capitalize(t('button.update')), icon: <RefreshCcw size={12} />, color: 'bg-gray-500' },
            // Status-based labels for when action is 'reviewed' but we have new_status
            'under_review': { label: 'Đã xem xét', icon: <Info size={12} />, color: 'bg-amber-500' },
            'pending': { label: 'Chờ xử lý', icon: <Clock size={12} />, color: 'bg-yellow-500' },
            'on_hold': { label: 'Tạm hoãn', icon: <Info size={12} />, color: 'bg-gray-500' },
            'in_progress': { label: 'Đang xử lý', icon: <RefreshCcw size={12} />, color: 'bg-blue-500' }
          };

          const isRated = item.action?.toLowerCase() === 'rated';
          let ratingValue = 0;
          let feedbackText = '';

          if (isRated && item.note) {
            try {
              const parsed = JSON.parse(item.note);
              ratingValue = parsed.overall_rating || 0;
              feedbackText = parsed.feedback || '';
            } catch (e) {
              // Ignore parse error
            }
          }

          // If action is 'reviewed' and we have new_status, use new_status for label
          const actionKey = (item.action?.toLowerCase() === 'reviewed' && newStatus)
            ? newStatus
            : item.action?.toLowerCase() || '';

          const config = actionMap[actionKey] || {
            label: capitalize(item.action || t('button.update')),
            icon: <Info size={12} />,
            color: 'bg-gray-400'
          };

          const formattedNote = String(formatHistoryNote(item.note, departments) || '');
          const isInitialSubmission = (item.action === 'submitted' || item.action === 'created') && formattedNote.includes(capitalize(t('idea.submitted')));

          return (
            <div key={idx} className="relative">
              {/* Timeline marker */}
              <div className={`absolute -left-[16px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${config.color} z-10`} />

              <div className={`
                ${isRated
                  ? 'bg-amber-50/70 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'
                  : 'bg-white dark:bg-neutral-800/50 border-gray-100 dark:border-neutral-700/50'
                } border rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200
              `}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center justify-center w-5 h-5 rounded-md ${config.color} text-white`}>
                      {config.icon}
                    </span>
                    <span className={`font-semibold text-sm ${isRated ? 'text-amber-900 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <Clock size={12} />
                    {formatDate(item.time)}
                  </div>
                </div>

                {isRated ? (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={`${s <= ratingValue
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-200 dark:text-neutral-700'
                            }`}
                        />
                      ))}
                    </div>
                    {feedbackText && (
                      <div className="text-sm text-gray-700 dark:text-neutral-300 italic px-2 border-l-2 border-amber-200 dark:border-amber-800/50">
                        "{feedbackText}"
                      </div>
                    )}
                  </div>
                ) : (
                  item.note && !isInitialSubmission && formattedNote && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-neutral-900/50 p-2.5 rounded-lg border-l-2 border-gray-200 dark:border-neutral-700">
                      {formattedNote}
                    </div>
                  )
                )}

                {item.by && (
                  <div className={`flex items-center gap-1.5 mt-2.5 pt-2 border-t text-[11px] ${isRated ? 'border-amber-100/50 dark:border-amber-900/20 text-amber-700/70 dark:text-amber-500/50' : 'border-gray-50 dark:border-neutral-700/30 text-gray-500 dark:text-gray-400'}`}>
                    <User size={10} />
                    <span>{capitalize(t('idea.performed_by'))}: </span>
                    <span className={`font-medium ${isRated ? 'text-amber-800 dark:text-amber-300' : 'text-gray-700 dark:text-gray-200'}`}>{item.by}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
