/**
 * Dashboard - Activity Item Component
 */
import React from 'react';
import { RecentActivity } from '../../../services/dashboard.service';
import { AlertIcon, BoxIcon, CalenderIcon, FileIcon } from '../../../icons';

interface ActivityItemProps {
  activity: RecentActivity;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const Icon = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{formatTime(activity.timestamp)}</span>
    </div>
  );
};

function getActivityIcon(type: string) {
  if (type.includes('incident')) return AlertIcon;
  if (type.includes('idea')) return BoxIcon;
  if (type.includes('booking')) return CalenderIcon;
  return FileIcon;
}

function getActivityColor(type: string): string {
  if (type.includes('resolved') || type.includes('approved')) return 'bg-green-50 text-green-600';
  if (type.includes('incident') || type.includes('created')) return 'bg-red-50 text-red-600';
  return 'bg-gray-50 text-gray-600';
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
}

export default ActivityItem;
