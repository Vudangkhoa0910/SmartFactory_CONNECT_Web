/**
 * Quick Actions Component - SmartFactory CONNECT
 * Quick action buttons for common tasks
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { 
  AlertIcon, 
  BoxIcon, 
  CalenderIcon, 
  FileIcon
} from '../../icons';

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverColor: string;
  link?: string;
  onClick?: () => void;
  badge?: number;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
  columns?: 2 | 3 | 4;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: 'new-incident',
    label: 'Báo cáo sự cố',
    description: 'Tạo báo cáo sự cố mới',
    icon: <AlertIcon className="w-6 h-6" />,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    link: '/error-report/create',
  },
  {
    id: 'new-idea',
    label: 'Góp ý kiến',
    description: 'Gửi ý kiến đóng góp',
    icon: <BoxIcon className="w-6 h-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    link: '/feedback/create',
  },
  {
    id: 'book-room',
    label: 'Đặt phòng họp',
    description: 'Đặt lịch phòng họp',
    icon: <CalenderIcon className="w-6 h-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
    link: '/room-booking',
  },
  {
    id: 'view-news',
    label: 'Tin tức',
    description: 'Xem tin tức mới nhất',
    icon: <FileIcon className="w-6 h-6" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    link: '/news',
  },
];

const COLUMN_CLASSES = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
};

const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  className = '',
  columns = 4,
}) => {
  const navigate = useNavigate();

  const handleClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.link) {
      navigate(action.link);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 ${className}`}>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Thao tác nhanh
      </h3>
      
      <div className={`grid ${COLUMN_CLASSES[columns]} gap-3 sm:gap-4`}>
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action)}
            className={`
              relative flex flex-col items-center justify-center 
              p-4 sm:p-5 rounded-xl 
              ${action.bgColor} ${action.hoverColor}
              transition-all duration-200
              hover:shadow-md hover:scale-[1.02]
              group
            `}
          >
            {/* Badge */}
            {action.badge !== undefined && action.badge > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full">
                {action.badge > 99 ? '99+' : action.badge}
              </span>
            )}

            {/* Icon */}
            <div className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-xl 
              flex items-center justify-center
              bg-white dark:bg-gray-700
              shadow-sm
              ${action.color}
              group-hover:scale-110 transition-transform
            `}>
              {action.icon}
            </div>

            {/* Label */}
            <span className={`
              mt-3 text-sm font-medium text-gray-900 dark:text-white
              text-center line-clamp-1
            `}>
              {action.label}
            </span>

            {/* Description (optional, hidden on mobile) */}
            {action.description && (
              <span className="hidden sm:block mt-1 text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-1">
                {action.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
