// src/components/IdeaList.tsx

import React from "react";
import { Inbox, Mail, Search, Mic, X } from "lucide-react";
import { PublicIdea } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import { DifficultyBadge } from "./DifficultySelector";

interface IdeaListProps {
  ideas: PublicIdea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onVoiceClick?: () => void;
  isListening?: boolean;
  isVoiceSupported?: boolean;
}

export const IdeaList: React.FC<IdeaListProps> = ({
  ideas,
  selectedId,
  onSelect,
  searchTerm = "",
  onSearchChange,
  onVoiceClick,
  isListening = false,
  isVoiceSupported = false,
}) => {
  const { t } = useTranslation();

  return (
    <aside className="w-[380px] bg-gray-50 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full transition-colors">
      {/* Header */}
      <header className="p-5 border-b border-gray-200 dark:border-neutral-800 flex flex-col gap-4 shrink-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <Mail size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('feedback.white_box_title')}
          </h2>
        </div>
        
        {/* Search Bar */}
        {onSearchChange && (
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('search.placeholder') || "Tìm kiếm..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-11 ${isVoiceSupported ? 'pr-16' : 'pr-10'} py-2.5 text-sm border border-gray-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm`}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isVoiceSupported && onVoiceClick && (
                <button
                  onClick={onVoiceClick}
                  className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors ${
                    isListening ? "text-red-500 animate-pulse" : "text-gray-400"
                  }`}
                  title="Voice Search"
                >
                  <Mic size={14} />
                </button>
              )}
              {searchTerm && (
                <button
                  onClick={() => onSearchChange("")}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 h-full">
            <Inbox size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              {t('error_report.empty_queue')}
            </h3>
            <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">{t('message.no_data')}</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => onSelect(idea.id)}
              className={`
                mx-2 my-2 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 relative
                ${
                  selectedId === idea.id
                    ? "bg-white dark:bg-neutral-800 shadow-md border-2 border-red-500 dark:border-red-500 scale-[1.02]"
                    : "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:shadow-md hover:border-red-300 dark:hover:border-red-800"
                }
              `}
            >
              <div className="flex justify-between items-start gap-2 mb-3">
                <p
                  className={`text-sm pr-2 truncate flex-1 ${
                    !idea.isRead
                      ? "font-bold text-gray-900 dark:text-white"
                      : "font-semibold text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {idea.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {idea.difficulty && <DifficultyBadge difficulty={idea.difficulty} size="sm" />}
                  {!idea.isRead && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <p className="truncate pr-2 font-medium">
                  <span className="text-gray-700 dark:text-gray-300">{idea.senderName}</span>
                  <span className="mx-1.5">•</span>
                  <span>{idea.group}</span>
                </p>
                <p className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                  {idea.timestamp.toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
