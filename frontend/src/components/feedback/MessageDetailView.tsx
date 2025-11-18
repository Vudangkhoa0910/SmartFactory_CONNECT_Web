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
import { SensitiveMessage, HistoryAction } from "./data";
import { ActionPanel } from "./ActionPanel";

interface MessageDetailViewProps {
  message: SensitiveMessage | undefined;
  onForward: (messageId: string, department: string, note: string) => void;
  onReply: (messageId: string, content: string) => void;
}

export const MessageDetailView: React.FC<MessageDetailViewProps> = ({
  message,
  onForward,
  onReply,
}) => {
  const [activePanel, setActivePanel] = useState<"none" | "forward">("none");
  const [replyContent, setReplyContent] = useState("");

  if (!message) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-gray-700 dark:text-gray-300">
        <Inbox size={64} />
        <p className="mt-4 text-lg">Chưa có góp ý nào được chọn</p>
      </main>
    );
  }

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(message.id, replyContent);
    setReplyContent("");
  };

  const getActionIcon = (action: HistoryAction) => {
    switch (action) {
      case "FORWARDED":
        return <ArrowRight size={14} className="text-blue-500" />;
      case "REPLIED":
        return <MessageSquare size={14} className="text-green-500" />;
      default:
        return <CornerDownRight size={14} className="text-gray-500" />;
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 relative">
      <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center shadow-sm bg-white dark:bg-gray-800 flex-shrink-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {message.title}
        </h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Archive size={14} /> Lưu trữ
          </button>
          <button
            onClick={() => setActivePanel("forward")}
            className="px-3 py-1.5 text-sm text-white bg-rose-600 rounded-md hover:bg-rose-700 flex items-center gap-1.5 transition-colors"
          >
            <Send size={14} /> Chuyển tiếp
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-base leading-relaxed">{message.fullContent}</p>
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              className="max-w-lg rounded-lg mt-4 border dark:border-gray-700"
            />
          )}
        </div>
        <div className="space-y-4">
          {message.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                {reply.author.charAt(0)}
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow w-full">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{reply.author}</span>
                  <span className="text-xs text-gray-500">
                    {reply.timestamp.toLocaleString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="font-semibold text-sm mb-2">Phản hồi góp ý</h4>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung phản hồi..."
            className="w-full p-2 border dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <div className="text-right mt-2">
            <button
              onClick={handleReply}
              className="px-4 py-2 text-sm text-white bg-rose-600 rounded-md hover:bg-rose-700 disabled:bg-rose-400"
              disabled={!replyContent.trim()}
            >
              Gửi phản hồi
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h4 className="font-semibold text-sm mb-3">Lịch sử hoạt động</h4>
          <ul className="space-y-3">
            {message.history.map((entry, index) => (
              <li key={index} className="flex items-start gap-3 text-sm">
                <div className="mt-1">{getActionIcon(entry.action)}</div>
                <div>
                  <p className="text-gray-800 dark:text-gray-200">
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
          onClose={() => setActivePanel("none")}
          onForward={onForward}
        />
      )}
    </main>
  );
};
