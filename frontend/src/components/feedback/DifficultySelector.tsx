import React from 'react';
import { DifficultyLevel } from './types';
import { useTranslation } from '../../contexts/LanguageContext';

interface DifficultySelectorProps {
  value?: DifficultyLevel;
  onChange?: (difficulty: DifficultyLevel) => void;
  disabled?: boolean;
  label?: string;
}

const difficultyConfigColors = {
  A: {
    color: 'bg-white text-gray-700 dark:bg-neutral-800 dark:text-gray-300 border-gray-300 dark:border-neutral-600',
    selectedColor: 'bg-red-600 text-white dark:bg-red-600 border-red-600 dark:border-red-600'
  },
  B: {
    color: 'bg-white text-gray-700 dark:bg-neutral-800 dark:text-gray-300 border-gray-300 dark:border-neutral-600',
    selectedColor: 'bg-red-600 text-white dark:bg-red-600 border-red-600 dark:border-red-600'
  },
  C: {
    color: 'bg-white text-gray-700 dark:bg-neutral-800 dark:text-gray-300 border-gray-300 dark:border-neutral-600',
    selectedColor: 'bg-red-600 text-white dark:bg-red-600 border-red-600 dark:border-red-600'
  },
  D: {
    color: 'bg-white text-gray-700 dark:bg-neutral-800 dark:text-gray-300 border-gray-300 dark:border-neutral-600',
    selectedColor: 'bg-red-600 text-white dark:bg-red-600 border-red-600 dark:border-red-600'
  }
};

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  label
}) => {
  const { t } = useTranslation();
  const displayLabel = label || t('difficulty.label');
  
  return (
    <div className="space-y-2">
      {displayLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {displayLabel}
        </label>
      )}
      <div className="grid grid-cols-4 gap-2">
        {(Object.keys(difficultyConfigColors) as DifficultyLevel[]).map((level) => {
          const config = difficultyConfigColors[level];
          const isSelected = value === level;
          
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange?.(level)}
              disabled={disabled || !onChange}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected ? config.selectedColor : config.color}
                ${!disabled && 'hover:scale-105 hover:shadow-md cursor-pointer'}
                ${disabled && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <span className="text-sm font-bold">{level}</span>
              <span className="text-[10px] text-center mt-1">
                {t(`difficulty.${level}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DifficultyBadge: React.FC<{ 
  difficulty?: DifficultyLevel; 
  size?: 'sm' | 'md' 
}> = ({ difficulty, size = 'md' }) => {
  if (!difficulty) return null;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px]' 
    : 'px-2.5 py-1 text-xs';
  
  return (
    <span className={`inline-flex items-center rounded-full font-bold bg-red-600 text-white ${sizeClasses}`}>
      <span>{difficulty}</span>
    </span>
  );
};
