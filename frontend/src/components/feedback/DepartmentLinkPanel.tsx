/**
 * DepartmentLinkPanel.tsx
 * Panel hiển thị các liên kết và trạng thái với các phòng ban
 * Panel showing department links and status
 */
import React from "react";
import {
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  MessageSquare,
  Eye,
  Send,
  Users,
  Calendar,
  User,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { ForwardInfo, DepartmentResponse, PublishedInfo } from "./types";

interface Department {
  id: string;
  name: string;
  name_ja?: string;
}

interface DepartmentLinkPanelProps {
  forwardInfo?: ForwardInfo;
  departmentResponse?: DepartmentResponse;
  publishedInfo?: PublishedInfo;
  departments?: Department[];
  onForward?: () => void;
  onPublish?: () => void;
  canForward?: boolean;
  canPublish?: boolean;
}

export const DepartmentLinkPanel: React.FC<DepartmentLinkPanelProps> = ({
  forwardInfo,
  departmentResponse,
  publishedInfo,
  departments = [],
  onForward,
  onPublish,
  canForward = true,
  canPublish = true,
}) => {
  const { language } = useTranslation();

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleString(language === "ja" ? "ja-JP" : "vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDepartmentName = (deptId: string | undefined) => {
    if (!deptId) return "";
    const dept = departments.find((d) => d.id === deptId);
    if (dept) {
      return language === "ja" && dept.name_ja ? dept.name_ja : dept.name;
    }
    return deptId;
  };

  // Calculate current step
  const isForwarded = !!forwardInfo?.forwarded_to_department_id;
  const hasResponse = !!departmentResponse?.department_response;
  const isPublished = publishedInfo?.is_published || false;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
        <div className="flex items-center gap-2">
          <Building2 size={20} className="text-red-600 dark:text-red-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language === "ja" ? "部署連携" : "Liên kết Phòng ban"}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === "ja"
            ? "この意見の処理状況"
            : "Trạng thái xử lý ý kiến này"}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="p-4 space-y-4">
        {/* Step 1: Forward to Department */}
        <div
          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
            isForwarded
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
          }`}
        >
          <div
            className={`p-2 rounded-full ${
              isForwarded
                ? "bg-green-500 text-white"
                : "bg-gray-300 dark:bg-neutral-600 text-gray-500 dark:text-gray-400"
            }`}
          >
            {isForwarded ? <CheckCircle2 size={16} /> : <Send size={16} />}
          </div>
          <div className="flex-1">
            <p
              className={`font-medium ${
                isForwarded
                  ? "text-green-700 dark:text-green-300"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {language === "ja" ? "部署へ転送" : "Chuyển tiếp đến Phòng ban"}
            </p>
            {isForwarded && forwardInfo ? (
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-center gap-1">
                  <Building2 size={12} />
                  {forwardInfo.forwarded_to_department_name ||
                    getDepartmentName(forwardInfo.forwarded_to_department_id)}
                </p>
                {forwardInfo.forwarded_at && (
                  <p className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(forwardInfo.forwarded_at)}
                  </p>
                )}
                {forwardInfo.forwarded_by && (
                  <p className="flex items-center gap-1">
                    <User size={12} />
                    {forwardInfo.forwarded_by}
                  </p>
                )}
                {(forwardInfo.forwarded_note || forwardInfo.forwarded_note_ja) && (
                  <div className="mt-2 p-2 bg-white dark:bg-neutral-800 rounded border-l-2 border-red-500">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {language === "ja" ? "備考:" : "Ghi chú:"}
                    </p>
                    <p className="text-sm italic">
                      {language === "ja"
                        ? forwardInfo.forwarded_note_ja || forwardInfo.forwarded_note
                        : forwardInfo.forwarded_note}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-2">
                {canForward && onForward && (
                  <button
                    onClick={onForward}
                    className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <ArrowRight size={14} />
                    {language === "ja" ? "今すぐ転送" : "Chuyển tiếp ngay"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        {isForwarded && (
          <div className="flex justify-center">
            <div className="w-0.5 h-4 bg-gray-300 dark:bg-neutral-600" />
          </div>
        )}

        {/* Step 2: Department Response */}
        {isForwarded && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              hasResponse
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                hasResponse
                  ? "bg-green-500 text-white"
                  : "bg-yellow-500 text-white animate-pulse"
              }`}
            >
              {hasResponse ? (
                <CheckCircle2 size={16} />
              ) : (
                <Clock size={16} />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  hasResponse
                    ? "text-green-700 dark:text-green-300"
                    : "text-yellow-700 dark:text-yellow-300"
                }`}
              >
                {language === "ja" ? "部署からの回答" : "Phản hồi từ Phòng ban"}
              </p>
              {hasResponse && departmentResponse ? (
                <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {departmentResponse.department_responded_at && (
                    <p className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(departmentResponse.department_responded_at)}
                    </p>
                  )}
                  {departmentResponse.department_responded_by && (
                    <p className="flex items-center gap-1">
                      <User size={12} />
                      {departmentResponse.department_responded_by}
                    </p>
                  )}
                  <div className="mt-2 p-3 bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1 mb-1 text-xs text-gray-500">
                      <MessageSquare size={12} />
                      {language === "ja" ? "回答内容:" : "Nội dung phản hồi:"}
                    </div>
                    <p className="text-sm">
                      {language === "ja"
                        ? departmentResponse.department_response_ja ||
                          departmentResponse.department_response
                        : departmentResponse.department_response}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  {language === "ja"
                    ? "部署からの回答を待っています..."
                    : "Đang chờ phản hồi từ phòng ban..."}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Arrow */}
        {hasResponse && (
          <div className="flex justify-center">
            <div className="w-0.5 h-4 bg-gray-300 dark:bg-neutral-600" />
          </div>
        )}

        {/* Step 3: Published */}
        {hasResponse && (
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              isPublished
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                isPublished
                  ? "bg-red-500 text-white"
                  : "bg-gray-300 dark:bg-neutral-600 text-gray-500 dark:text-gray-400"
              }`}
            >
              {isPublished ? <CheckCircle2 size={16} /> : <Users size={16} />}
            </div>
            <div className="flex-1">
              <p
                className={`font-medium ${
                  isPublished
                    ? "text-red-700 dark:text-red-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {language === "ja" ? "公開" : "Công khai"}
              </p>
              {isPublished && publishedInfo ? (
                <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {publishedInfo.published_at && (
                    <p className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(publishedInfo.published_at)}
                    </p>
                  )}
                  {publishedInfo.published_response && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-1 mb-1 text-xs text-red-600 dark:text-red-400">
                        <Eye size={12} />
                        {language === "ja" ? "公開回答:" : "Phản hồi công khai:"}
                      </div>
                      <p className="text-sm">
                        {language === "ja"
                          ? publishedInfo.published_response_ja ||
                            publishedInfo.published_response
                          : publishedInfo.published_response}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  {canPublish && onPublish && (
                    <button
                      onClick={onPublish}
                      className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <Eye size={14} />
                      {language === "ja" ? "今すぐ公開" : "Công khai ngay"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentLinkPanel;
