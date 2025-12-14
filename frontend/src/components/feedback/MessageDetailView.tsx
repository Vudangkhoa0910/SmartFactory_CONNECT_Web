// src/pages/SensitiveInbox/MessageDetailView.tsx
import React, { useState } from "react";
import {
  Inbox,
  Send,
  Archive,
  MessageSquare,
  ArrowRight,
  CornerDownRight,
} from "lucide-react";
import { SensitiveMessage, HistoryAction } from "./types";
import { ActionPanel } from "./ActionPanel";
import { useTranslation } from "../../contexts/LanguageContext";

interface Department {
  id: string;
  name: string;
}

interface MessageDetailViewProps {
  message: SensitiveMessage | undefined;
  departments?: Department[];
  loading?: boolean;
  onForward: (messageId: string, departmentId: string, note: string) => Promise<void> | void;
  onReply: (messageId: string, content: string) => void;
}

export const MessageDetailView: React.FC<MessageDetailViewProps> = ({
  message,
  departments = [],
  loading = false,
  onForward,
  onReply,
}) => {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<"none" | "forward">("none");
  const [replyContent, setReplyContent] = useState("");

  if (!message) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
        <Inbox size={64} className="text-gray-300" />
        <p className="mt-4 text-lg">{t('feedback.no_selection')}</p>
      </main>
    );
  }

  const handleForwardWrapper = async (messageId: string, departmentId: string, note: string) => {
    await onForward(messageId, departmentId, note);
    setActivePanel("none");
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(message.id, replyContent);
    setReplyContent("");
  };

  const getActionIcon = (action: HistoryAction) => {
    switch (action) {
      case "FORWARDED":
        return <ArrowRight size={14} className="text-red-500" />;
      case "REPLIED":
        return <MessageSquare size={14} className="text-red-600" />;
      default:
        return <CornerDownRight size={14} className="text-gray-400" />;
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-gray-50 relative">
      <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900">
          {message.title}
        </h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-lg flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700">
            <Archive size={14} /> {t('feedback.archive')}
          </button>
          <button
            onClick={() => setActivePanel("forward")}
            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1.5 transition-colors"
          >
            <Send size={14} /> {t('feedback.forward')}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-base leading-relaxed text-gray-700">{message.fullContent}</p>
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              className="max-w-lg rounded-lg mt-4 border border-gray-200"
            />
          )}
        </div>
        <div className="space-y-4">
          {message.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                {reply.author.charAt(0)}
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-gray-900">{reply.author}</span>
                  <span className="text-xs text-gray-500">
                    {reply.timestamp.toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm mb-3 text-gray-900">{t('feedback.reply_title')}</h4>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            placeholder={t('feedback.reply_placeholder')}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <div className="text-right mt-3">
            <button
              onClick={handleReply}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
              disabled={!replyContent.trim()}
            >
              {t('feedback.send_reply')}
            </button>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm mb-3 text-gray-900">{t('feedback.history_title')}</h4>
          <ul className="space-y-3">
            {message.history.map((entry, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div className="mt-1">{getActionIcon(entry.action)}</div>
                <div>
                  <p className="text-gray-700">
                    {entry.details} -{" "}
                    <span className="font-semibold">{entry.actor}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.timestamp.toLocaleString("vi-VN")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        </div>
      </div>

      {activePanel === "forward" && (
        <ActionPanel
          message={message}
          departments={departments}
          loading={loading}
          onClose={() => setActivePanel("none")}
          onForward={handleForwardWrapper}
        />
      )}
    </main>
  );
};
