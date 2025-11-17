// src/pages/SensitiveInbox/index.tsx
import React, { useState } from "react";
import {
  SENSITIVE_MESSAGES_DATA,
  CURRENT_USER,
  HistoryEntry,
  Reply,
  SensitiveMessage,
} from "../../components/feedback/data";
import { MessageList } from "../../components/feedback/MessageList";
import { MessageDetailView } from "../../components/feedback/MessageDetailView";

export default function SensitiveInboxPage() {
  const [messages, setMessages] = useState<SensitiveMessage[]>(
    SENSITIVE_MESSAGES_DATA
  );
  const [selectedMessageId, setSelectedMessageId] = useState(messages[0]?.id);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  const handleForward = (
    messageId: string,
    department: string,
    note: string
  ) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const newHistoryEntry: HistoryEntry = {
          action: "FORWARDED",
          timestamp: new Date(),
          details:
            `Chuyển tiếp đến ${department}` +
            (note ? ` với ghi chú: "${note}"` : ""),
          actor: CURRENT_USER,
        };
        return {
          ...m,
          status: "Đang xem xét",
          history: [...m.history, newHistoryEntry],
        };
      })
    );
  };

  const handleReply = (messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const newReply: Reply = {
          id: `REP-${Date.now()}`,
          author: CURRENT_USER,
          content: content,
          timestamp: new Date(),
        };
        const newHistoryEntry: HistoryEntry = {
          action: "REPLIED",
          timestamp: new Date(),
          details: `Đã phản hồi góp ý.`,
          actor: CURRENT_USER,
        };
        return {
          ...m,
          status: "Đã xử lý",
          replies: [...m.replies, newReply],
          history: [...m.history, newHistoryEntry],
        };
      })
    );
  };

  return (
    <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
      <MessageList
        messages={messages}
        selectedMessageId={selectedMessageId}
        onSelectMessage={setSelectedMessageId}
      />
      <MessageDetailView
        message={selectedMessage}
        onForward={handleForward}
        onReply={handleReply}
      />
    </div>
  );
}
