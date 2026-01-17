import React from 'react';

interface ProgressRingProps {
    progress: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    showLabel?: boolean;
    strokeWidth?: number;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 'md',
    color = '#DC2626',
    showLabel = true,
    strokeWidth,
}) => {
    const sizeMap = {
        sm: { dimension: 40, stroke: strokeWidth || 3, fontSize: 'text-xs' },
        md: { dimension: 60, stroke: strokeWidth || 4, fontSize: 'text-sm' },
        lg: { dimension: 80, stroke: strokeWidth || 5, fontSize: 'text-base' },
    };

    const { dimension, stroke, fontSize } = sizeMap[size];
    const radius = (dimension - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg
                width={dimension}
                height={dimension}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="none"
                    className="text-gray-200 dark:text-neutral-700"
                />
                {/* Progress circle */}
                <circle
                    cx={dimension / 2}
                    cy={dimension / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-in-out"
                />
            </svg>
            {showLabel && (
                <span
                    className={`absolute ${fontSize} font-semibold text-gray-700 dark:text-gray-200`}
                >
                    {Math.round(progress)}%
                </span>
            )}
        </div>
    );
};
