/**
 * Activity Feed Component - SmartFactory CONNECT
 * Real-time activity timeline
 */
import React from 'react';
import { TimeIcon, AlertIcon, CheckCircleIcon, BoxIcon, UserIcon } from '../../icons';

export type ActivityType = 
  | 'incident_created' 
  | 'incident_resolved'
  | 'incident_assigned' 
  | 'incident_escalated'
  | 'idea_submitted'
  | 'idea_approved'
  | 'idea_implemented'
  | 'booking_created'
  | 'booking_cancelled'
  | 'news_published'
  | 'user_login'
  | 'user_registered'
  | 'system';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  timestamp: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  onItemClick?: (item: ActivityItem) => void;
  className?: string;
  compact?: boolean;
}

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  incident_created: {
    icon: AlertIcon,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  incident_resolved: {
    icon: CheckCircleIcon,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  incident_assigned: {
    icon: UserIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  incident_escalated: {
    icon: AlertIcon,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  idea_submitted: {
    icon: BoxIcon,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  idea_approved: {
    icon: CheckCircleIcon,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  idea_implemented: {
    icon: CheckCircleIcon,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  booking_created: {
    icon: TimeIcon,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  booking_cancelled: {
    icon: TimeIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  news_published: {
    icon: BoxIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  user_login: {
    icon: UserIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  user_registered: {
    icon: UserIcon,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  system: {
    icon: BoxIcon,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

// Helper to format relative time in Vietnamese
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit',
    year: diffDay > 365 ? 'numeric' : undefined 
  });
};

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  onItemClick,
  className = '',
  compact = false,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Hoạt động gần đây
        </h3>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            Xem tất cả
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className={`${compact ? 'p-3' : 'p-4 sm:p-5'}`}>
        {displayedActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Chưa có hoạt động nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity, index) => {
              const config = ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.system;
              const IconComponent = config.icon;
              const isLast = index === displayedActivities.length - 1;

              return (
                <div
                  key={activity.id}
                  className={`
                    flex gap-3 relative
                    ${onItemClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 py-1 rounded-lg' : ''}
                  `}
                  onClick={() => onItemClick?.(activity)}
                >
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                  )}

                  {/* Icon */}
                  <div className={`
                    relative z-10 flex-shrink-0 w-8 h-8 rounded-full 
                    flex items-center justify-center
                    ${config.bgColor}
                  `}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`
                          font-medium text-gray-900 dark:text-white
                          ${compact ? 'text-sm' : 'text-sm sm:text-base'}
                          line-clamp-1
                        `}>
                          {activity.title}
                        </p>
                        {activity.description && !compact && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* User & Time */}
                    <div className="flex items-center gap-2 mt-1">
                      {activity.user && (
                        <>
                          {activity.user.avatar ? (
                            <img
                              src={activity.user.avatar}
                              alt={activity.user.name}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {activity.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.user.name}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
