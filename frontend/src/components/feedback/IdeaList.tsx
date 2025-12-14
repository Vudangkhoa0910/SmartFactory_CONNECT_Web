// src/components/IdeaList.tsx

import React from "react";
import { Inbox, Mail } from "lucide-react";
import { PublicIdea } from "./types";
import { useTranslation } from "../../contexts/LanguageContext";

interface IdeaListProps {
  ideas: PublicIdea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const IdeaList: React.FC<IdeaListProps> = ({
  ideas,
  selectedId,
  onSelect,
}) => {
  const { t } = useTranslation();

  // Empty state
  if (ideas.length === 0) {
    return (
      <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col h-full">
        <header className="p-4 border-b border-gray-200 flex items-center gap-3 shrink-0">
          <Mail size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-gray-900">
            {t('feedback.white_box_title')}
          </h2>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
          <Inbox size={48} className="mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700">
            {t('error_report.empty_queue')}
          </h3>
          <p className="text-sm mt-1 text-gray-500">{t('message.no_data')}</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <Mail size={20} className="text-red-600" />
        <h2 className="text-lg font-bold text-gray-900">
          {t('feedback.white_box_title')}
        </h2>
      </header>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => onSelect(idea.id)}
            className={`
              px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors
              ${
                selectedId === idea.id
                  ? "bg-red-50 border-l-4 border-l-red-600"
                  : "border-l-4 border-l-transparent hover:bg-gray-50"
              }
            `}
          >
            <div className="flex justify-between items-start">
              <p
                className={`text-sm pr-2 truncate ${
                  !idea.isRead
                    ? "font-bold text-gray-900"
                    : "font-semibold text-gray-700"
                }`}
              >
                {idea.title}
              </p>
              {!idea.isRead && (
                <div className="w-2 h-2 bg-red-600 rounded-full shrink-0 mt-1.5"></div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
              <p className="truncate pr-2">
                {idea.senderName} • {idea.group}
              </p>
              <p className="shrink-0">
                {idea.timestamp.toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
