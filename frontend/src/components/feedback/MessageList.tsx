import React from "react";
import { Shield, User, VenetianMask, Inbox, Search, Mic, X } from "lucide-react";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";
import { DifficultyBadge } from "./DifficultySelector";

interface MessageListProps {
  messages: SensitiveMessage[];
  selectedMessageId: string | undefined;
  onSelectMessage: (id: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onVoiceClick?: () => void;
  isListening?: boolean;
  isVoiceSupported?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedMessageId,
  onSelectMessage,
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
            <Shield size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('feedback.pink_box_title')}
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

      <div className="overflow-y-auto flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400 h-full">
            <Inbox size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">
              {t('error_report.empty_queue')}
            </h3>
            <p className="text-sm mt-1">{t('message.no_data')}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => onSelectMessage(msg.id)}
              className={`
                mx-2 my-2 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                ${
                  selectedMessageId === msg.id
                    ? "bg-white dark:bg-neutral-800 shadow-md border-2 border-red-500 dark:border-red-500 scale-[1.02]"
                    : "bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:shadow-md hover:border-red-300 dark:hover:border-red-800"
                }
              `}
            >
              {/* Dòng title: hiển thị trước */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1">
                  {msg.title}
                </p>
                {msg.difficulty && <DifficultyBadge difficulty={msg.difficulty} size="sm" />}
              </div>

              {/* Hàng icon + tên người gửi + trạng thái */}
              <div className="flex justify-between items-center gap-3">
                <div className="flex items-center gap-2 text-xs flex-1 min-w-0">
                  {msg.isAnonymous ? (
                    <VenetianMask size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  ) : (
                    <User size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  )}
                  <span className="text-gray-600 dark:text-gray-400 truncate font-medium">
                    {msg.isAnonymous ? t('feedback.anonymous') : msg.senderName}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wide flex-shrink-0
                    ${
                      msg.status === "new"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : msg.status === "under_review"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                >
                  {t(`feedback.status.${msg.status}`)}
                </span>
              </div>

              {/* Dòng thời gian */}
              <p className="text-[11px] mt-2 text-gray-400 dark:text-gray-500 font-medium">
                {msg.timestamp.toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};
