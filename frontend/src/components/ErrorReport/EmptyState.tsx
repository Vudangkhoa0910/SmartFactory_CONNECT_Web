import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
    size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon,
    action,
    size = 'md',
}) => {
    const sizeClasses = {
        sm: {
            container: 'py-6',
            icon: 'p-3 mb-3',
            iconSize: 'w-8 h-8',
            title: 'text-sm',
            description: 'text-xs',
        },
        md: {
            container: 'py-8',
            icon: 'p-4 mb-4',
            iconSize: 'w-10 h-10',
            title: 'text-base',
            description: 'text-sm',
        },
        lg: {
            container: 'py-12',
            icon: 'p-5 mb-5',
            iconSize: 'w-12 h-12',
            title: 'text-lg',
            description: 'text-base',
        },
    };

    const classes = sizeClasses[size];

    return (
        <div
            className={`flex flex-col items-center justify-center text-center ${classes.container} animate-in fade-in duration-300`}
        >
            <div
                className={`${classes.icon} rounded-full bg-gray-100 dark:bg-neutral-700 inline-flex items-center justify-center`}
            >
                {icon ? (
                    <div className="text-gray-400 dark:text-gray-500">{icon}</div>
                ) : (
                    <Inbox className={`${classes.iconSize} text-gray-400 dark:text-gray-500`} />
                )}
            </div>
            <h3
                className={`${classes.title} font-semibold text-gray-800 dark:text-white mb-1`}
            >
                {title}
            </h3>
            <p className={`${classes.description} text-gray-500 dark:text-gray-400 max-w-sm`}>
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
