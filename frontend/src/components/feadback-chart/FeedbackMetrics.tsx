import React from "react";
import Badge from "../ui/badge/Badge";

// Định nghĩa các component Icon đơn giản
const CheckCircleIcon: React.FC = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const XCircleIcon: React.FC = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
      clipRule="evenodd"
    ></path>
  </svg>
);
const ClockIcon: React.FC = () => (
  <svg
    stroke="currentColor"
    fill="currentColor"
    strokeWidth="0"
    viewBox="0 0 20 20"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
      clipRule="evenodd"
    ></path>
  </svg>
);

export default function FeedbackMetrics({ data }: { data?: any }) {
  // Calculate rates from real data
  const totalIdeas = data?.total_ideas || 0;
  const approvedCount = data?.approved || 0;
  const rejectedCount = data?.rejected || 0;
  
  const acceptanceRate = totalIdeas > 0 ? Math.round((approvedCount / totalIdeas) * 100) : 0;
  const rejectionRate = totalIdeas > 0 ? Math.round((rejectedCount / totalIdeas) * 100) : 0;
  const avgProcessingDays = data?.avg_processing_days || 0;
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
      {/* Thống kê tỷ lệ chấp nhận */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-800/20">
          <CheckCircleIcon />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tỷ lệ chấp nhận
            </span>
            <h4 className="mt-2 font-bold text-gray-900 text-title-sm dark:text-white">
              {acceptanceRate}%
            </h4>
          </div>
          <Badge color="success">{approvedCount} ý tưởng</Badge>
        </div>
      </div>

      {/* Thống kê tỷ lệ từ chối */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl dark:bg-red-800/20">
          <XCircleIcon />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tỷ lệ từ chối
            </span>
            <h4 className="mt-2 font-bold text-gray-900 text-title-sm dark:text-white">
              {rejectionRate}%
            </h4>
          </div>
          <Badge color="error">{rejectedCount} ý tưởng</Badge>
        </div>
      </div>

      {/* Thời gian xử lý trung bình */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-800/20">
          <ClockIcon />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Thời gian xử lý trung bình
            </span>
            <h4 className="mt-2 font-bold text-gray-900 text-title-sm dark:text-white">
              {avgProcessingDays > 0 ? `${avgProcessingDays.toFixed(1)} Ngày` : 'N/A'}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
