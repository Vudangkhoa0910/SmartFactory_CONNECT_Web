import React from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { Priority } from '../types';

interface TimelineBadgeProps {
    createdAt: Date;
    priority: Priority;
}

export const TimelineBadge: React.FC<TimelineBadgeProps> = ({
    createdAt,
    priority,
}) => {
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffMinutes = diffMs / (1000 * 60);

    // Determine badge type and styling
    let badgeText = '';
    let badgeClass = '';
    let icon = <Clock size={12} />;

    if (diffMinutes < 60) {
        // Less than 1 hour - "Mới"
        badgeText = 'Mới';
        badgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        icon = <Zap size={12} />;
    } else if (diffHours < 24) {
        // Less than 24 hours - show hours
        const hours = Math.floor(diffHours);
        badgeText = `${hours} giờ`;
        badgeClass = 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300';
    } else {
        // More than 24 hours - show days
        const days = Math.floor(diffHours / 24);
        badgeText = `${days} ngày`;
        badgeClass = 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-300';
    }

    // Override for critical/high priority items that are old - "Khẩn cấp"
    if ((priority === 'Critical' || priority === 'High') && diffHours > 2) {
        badgeText = 'Khẩn cấp';
        badgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse';
        icon = <AlertTriangle size={12} />;
    }

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
        >
            {icon}
            {badgeText}
        </span>
    );
};
