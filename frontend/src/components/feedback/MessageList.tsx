import React from "react";
import { Shield, User, VenetianMask, Inbox, Search, Mic, X } from "lucide-react";
import { SensitiveMessage } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";

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
    <aside className="w-[360px] bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col h-full transition-colors">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-neutral-800 flex flex-col gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {t('feedback.pink_box_title')}
          </h2>
        </div>

        {/* Search Bar */}
        {onSearchChange && (
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder={t('search.placeholder') || "Tìm kiếm..."}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`w-full pl-9 ${isVoiceSupported ? 'pr-16' : 'pr-8'} py-2 text-sm border border-gray-300 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-neutral-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors`}
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
                px-4 py-3 border-b border-gray-100 dark:border-neutral-800 cursor-pointer transition-colors duration-150
                ${
                  selectedMessageId === msg.id
                    ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-600 dark:border-l-red-500"
                    : "border-l-4 border-l-transparent hover:bg-gray-50 dark:hover:bg-neutral-800"
                }
              `}
            >
              {/* Dòng title: hiển thị trước */}
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {msg.title}
              </p>

              {/* Hàng icon + tên người gửi + trạng thái */}
              <div className="flex justify-between items-center mt-1">
                <div className="flex items-center gap-2 text-sm">
                  {msg.isAnonymous ? (
                    <VenetianMask size={14} className="text-red-600 dark:text-red-400" />
                  ) : (
                    <User size={14} className="text-gray-500 dark:text-gray-400" />
                  )}
                  <span className="text-gray-600 dark:text-gray-300">
                    {msg.isAnonymous ? t('feedback.anonymous') : msg.senderName}
                  </span>
                </div>

                <span
                  className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold
                    ${
                      msg.status === "new"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : msg.status === "under_review"
                        ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : "bg-red-600 text-white dark:bg-red-700"
                    }`}
                >
                  {t(`feedback.status.${msg.status}`)}
                </span>
              </div>

              {/* Dòng thời gian */}
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
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
