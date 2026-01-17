/**
 * WorkflowTimeline.tsx
 * Component hiển thị timeline workflow cho Hòm trắng/hồng
 * Workflow timeline component for White Box / Pink Box
 */
import React from "react";
import {
  CheckCircle2,
  Clock,
  Circle,
  ArrowRight,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

interface WorkflowStep {
  id: string;
  label: string;
  labelJa?: string;
  status: "completed" | "current" | "pending" | "error";
  timestamp?: Date;
  actor?: string;
  note?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  boxType: "white" | "pink";
  compact?: boolean;
}

// Workflow steps definition for White Box
export const getWhiteBoxWorkflowSteps = (
  currentStatus: string,
  _language: string = "vi"
): WorkflowStep[] => {
  const statusOrder = [
    "submitted",
    "reviewed",
    "approved",
    "implemented",
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return [
    {
      id: "submitted",
      label: "Đã gửi",
      labelJa: "送信済み",
      status: currentIndex >= 0 ? "completed" : "pending",
    },
    {
      id: "reviewed",
      label: "Đang xem xét",
      labelJa: "確認中",
      status:
        currentIndex > 0 ? "completed" : currentIndex === 0 ? "current" : "pending",
    },
    {
      id: "approved",
      label: "Đã phê duyệt",
      labelJa: "承認済み",
      status:
        currentIndex > 2 ? "completed" : currentIndex === 2 ? "current" : "pending",
    },
    {
      id: "implemented",
      label: "Đã triển khai",
      labelJa: "実施済み",
      status: currentIndex >= 3 ? "completed" : "pending",
    },
  ];
};

// Workflow steps definition for Pink Box
export const getPinkBoxWorkflowSteps = (
  currentStatus: string,
  _language: string = "vi"
): WorkflowStep[] => {
  const statusMap: Record<string, number> = {
    pending: 0,
    new: 0,
    under_review: 1,
    forwarded: 2,
    department_responded: 3,
    coordinator_reviewing: 4,
    published: 5,
  };
  const currentIndex = statusMap[currentStatus] ?? 0;

  return [
    {
      id: "submitted",
      label: "Đã gửi",
      labelJa: "送信済み",
      status: currentIndex >= 0 ? "completed" : "pending",
    },
    {
      id: "coordinator_review",
      label: "Coordinator xem xét",
      labelJa: "コーディネーター確認",
      status:
        currentIndex > 1 ? "completed" : currentIndex >= 1 ? "current" : "pending",
    },
    {
      id: "forwarded",
      label: "Chuyển Phòng ban",
      labelJa: "部署へ転送",
      status:
        currentIndex > 2 ? "completed" : currentIndex === 2 ? "current" : "pending",
    },
    {
      id: "department_responded",
      label: "Phòng ban phản hồi",
      labelJa: "部署回答済み",
      status:
        currentIndex > 3 ? "completed" : currentIndex === 3 ? "current" : "pending",
    },
    {
      id: "coordinator_reviewing",
      label: "Coordinator duyệt",
      labelJa: "コーディネーター承認",
      status:
        currentIndex > 4 ? "completed" : currentIndex === 4 ? "current" : "pending",
    },
    {
      id: "published",
      label: "Công khai",
      labelJa: "公開済み",
      status: currentIndex >= 5 ? "completed" : "pending",
    },
  ];
};

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  steps,
  boxType,
  compact = false,
}) => {
  const { language } = useTranslation();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={compact ? 16 : 20} className="text-white" />;
      case "current":
        return <Clock size={compact ? 16 : 20} className="text-white animate-pulse" />;
      case "error":
        return <AlertCircle size={compact ? 16 : 20} className="text-white" />;
      default:
        return <Circle size={compact ? 16 : 20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return boxType === "white"
          ? "bg-gradient-to-br from-green-500 to-emerald-600"
          : "bg-gradient-to-br from-green-500 to-emerald-600";
      case "current":
        return "bg-gradient-to-br from-red-500 to-red-600";
      case "error":
        return "bg-gradient-to-br from-orange-500 to-red-500";
      default:
        return "bg-gray-200 dark:bg-neutral-700";
    }
  };

  const getLineColor = (status: string) => {
    switch (status) {
      case "completed":
        return boxType === "white"
          ? "bg-gradient-to-b from-green-500 to-green-600"
          : "bg-gradient-to-b from-green-500 to-green-600";
      case "current":
        return "bg-gradient-to-b from-red-300 to-gray-300";
      default:
        return "bg-gray-200 dark:bg-neutral-700";
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap
                ${
                  step.status === "completed"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : step.status === "current"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 ring-2 ring-red-500/50"
                    : step.status === "error"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    : "bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400"
                }
              `}
            >
              {step.status === "completed" && <CheckCircle2 size={12} />}
              {step.status === "current" && <Clock size={12} className="animate-pulse" />}
              {step.status === "error" && <AlertCircle size={12} />}
              {language === "ja" && step.labelJa ? step.labelJa : step.label}
            </div>
            {index < steps.length - 1 && (
              <ArrowRight
                size={14}
                className={
                  step.status === "completed"
                    ? "text-green-400"
                    : "text-gray-300 dark:text-neutral-600"
                }
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-4">
          {/* Timeline line and dot */}
          <div className="flex flex-col items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center shadow-md
                ${getStatusColor(step.status)}
              `}
            >
              {getStatusIcon(step.status)}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-[40px] ${getLineColor(step.status)}`}
              />
            )}
          </div>

          {/* Content */}
          <div className={`pb-6 flex-1 ${index === steps.length - 1 ? "pb-0" : ""}`}>
            <p
              className={`font-semibold ${
                step.status === "completed" || step.status === "current"
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {language === "ja" && step.labelJa ? step.labelJa : step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar size={12} />
                {step.timestamp.toLocaleString(
                  language === "ja" ? "ja-JP" : "vi-VN"
                )}
              </p>
            )}
            {step.actor && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <User size={12} />
                {step.actor}
              </p>
            )}
            {step.note && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">
                "{step.note}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkflowTimeline;
