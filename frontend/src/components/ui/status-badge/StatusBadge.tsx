/**
 * StatusBadge Component - SmartFactory CONNECT
 * Displays status with color coding for incidents, ideas, bookings
 */
import React from 'react';
import { 
  CheckCircleIcon, 
  TimeIcon, 
  AlertIcon, 
  CloseIcon 
} from '../../../icons';

// Status types from different modules
export type StatusType = 
  // Incident statuses
  | 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'cancelled' | 'escalated'
  // Idea statuses
  | 'under_review' | 'approved' | 'rejected' | 'implemented' | 'on_hold'
  // Booking statuses
  | 'confirmed' | 'completed' | 'no_show'
  // News statuses
  | 'draft' | 'published' | 'archived' | 'scheduled'
  // Generic
  | 'active' | 'inactive' | 'success' | 'error' | 'warning' | 'info';

export type StatusSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  status: StatusType;
  size?: StatusSize;
  showIcon?: boolean;
  showDot?: boolean;
  pulse?: boolean;
  className?: string;
  customLabel?: string;
}

// Status configuration with Vietnamese labels and colors
const STATUS_CONFIG: Record<StatusType, { 
  label: string; 
  bgColor: string; 
  textColor: string;
  borderColor: string;
  icon?: React.ComponentType<{ className?: string }>;
}> = {
  // Incident statuses
  pending: { 
    label: 'Chờ xử lý', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', 
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: TimeIcon 
  },
  assigned: { 
    label: 'Đã tiếp nhận', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30', 
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  in_progress: { 
    label: 'Đang xử lý', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30', 
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700',
    icon: TimeIcon 
  },
  resolved: { 
    label: 'Hoàn thành', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircleIcon 
  },
  closed: { 
    label: 'Đã đóng', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    textColor: 'text-gray-700 dark:text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  cancelled: { 
    label: 'Đã hủy', 
    bgColor: 'bg-red-100 dark:bg-red-900/30', 
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: CloseIcon 
  },
  escalated: { 
    label: 'Leo thang', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30', 
    textColor: 'text-orange-700 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700',
    icon: AlertIcon 
  },
  
  // Idea statuses
  under_review: { 
    label: 'Đang xem xét', 
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', 
    textColor: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-300 dark:border-indigo-700'
  },
  approved: { 
    label: 'Đã duyệt', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', 
    textColor: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-300 dark:border-emerald-700',
    icon: CheckCircleIcon 
  },
  rejected: { 
    label: 'Từ chối', 
    bgColor: 'bg-red-100 dark:bg-red-900/30', 
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: CloseIcon 
  },
  implemented: { 
    label: 'Đã triển khai', 
    bgColor: 'bg-teal-100 dark:bg-teal-900/30', 
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-300 dark:border-teal-700',
    icon: CheckCircleIcon 
  },
  on_hold: { 
    label: 'Tạm hoãn', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30', 
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700'
  },
  
  // Booking statuses
  confirmed: { 
    label: 'Đã xác nhận', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircleIcon 
  },
  completed: { 
    label: 'Hoàn thành', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30', 
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: CheckCircleIcon 
  },
  no_show: { 
    label: 'Không đến', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  
  // News statuses
  draft: { 
    label: 'Bản nháp', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  published: { 
    label: 'Đã đăng', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircleIcon 
  },
  archived: { 
    label: 'Lưu trữ', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  scheduled: { 
    label: 'Đã lên lịch', 
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', 
    textColor: 'text-cyan-700 dark:text-cyan-400',
    borderColor: 'border-cyan-300 dark:border-cyan-700',
    icon: TimeIcon 
  },
  
  // Generic
  active: { 
    label: 'Hoạt động', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700'
  },
  inactive: { 
    label: 'Không hoạt động', 
    bgColor: 'bg-gray-100 dark:bg-gray-800', 
    textColor: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-gray-300 dark:border-gray-600'
  },
  success: { 
    label: 'Thành công', 
    bgColor: 'bg-green-100 dark:bg-green-900/30', 
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: CheckCircleIcon 
  },
  error: { 
    label: 'Lỗi', 
    bgColor: 'bg-red-100 dark:bg-red-900/30', 
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700',
    icon: AlertIcon 
  },
  warning: { 
    label: 'Cảnh báo', 
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', 
    textColor: 'text-yellow-700 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: AlertIcon 
  },
  info: { 
    label: 'Thông tin', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30', 
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
};

const SIZE_CLASSES: Record<StatusSize, { badge: string; icon: string; dot: string }> = {
  sm: { badge: 'px-2 py-0.5 text-xs', icon: 'w-3 h-3', dot: 'w-1.5 h-1.5' },
  md: { badge: 'px-2.5 py-1 text-sm', icon: 'w-4 h-4', dot: 'w-2 h-2' },
  lg: { badge: 'px-3 py-1.5 text-base', icon: 'w-5 h-5', dot: 'w-2.5 h-2.5' },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = false,
  showDot = false,
  pulse = false,
  className = '',
  customLabel,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.info;
  const sizeClasses = SIZE_CLASSES[size];
  const Icon = config.icon;
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses.badge}
        ${className}
      `}
    >
      {/* Pulse dot indicator */}
      {showDot && (
        <span className="relative flex">
          {pulse && (
            <span 
              className={`
                absolute inline-flex h-full w-full animate-ping rounded-full opacity-75
                ${config.bgColor}
              `}
            />
          )}
          <span 
            className={`
              relative inline-flex rounded-full 
              ${sizeClasses.dot}
              ${config.textColor.replace('text-', 'bg-').replace('-700', '-500').replace('-600', '-500')}
            `}
          />
        </span>
      )}
      
      {/* Icon */}
      {showIcon && Icon && (
        <Icon className={sizeClasses.icon} />
      )}
      
      {/* Label */}
      <span>{customLabel || config.label}</span>
    </span>
  );
};

export default StatusBadge;
