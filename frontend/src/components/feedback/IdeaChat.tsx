// src/components/feedback/IdeaChat.tsx

import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./types";
import { Send, MessageCircle, User, UserCog } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import TextArea from "../form/input/TextArea";

interface IdeaChatProps {
  chat: ChatMessage[];
  onSend: (text: string) => void;
}

const formatTime = (date: Date): string => {
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

export const IdeaChat: React.FC<IdeaChatProps> = ({ chat, onSend }) => {
  const { t, language } = useTranslation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevChatLengthRef = useRef<number>(chat.length);
  const [text, setText] = useState("");

  useEffect(() => {
    // Chỉ scroll xuống cuối khi có tin nhắn MỚI được thêm vào
    if (chat.length > prevChatLengthRef.current) {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    prevChatLengthRef.current = chat.length;
  }, [chat.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="space-y-4">
      {/* Chat messages */}
      <div
        ref={chatContainerRef}
        className="min-h-[120px] max-h-[300px] overflow-y-auto bg-gray-50 dark:bg-neutral-900 p-4 rounded-xl border border-gray-200 dark:border-neutral-700"
      >
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 py-8">
            <MessageCircle size={32} className="mb-2 opacity-50" />
            <p className="text-sm">{language === 'ja' ? 'まだメッセージがありません' : 'Chưa có tin nhắn nào'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === "manager" ? "flex-row-reverse" : "flex-row"
                  }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.sender === "manager"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-gray-200 dark:bg-neutral-700"
                  }`}>
                  {msg.sender === "manager"
                    ? <UserCog size={16} className="text-red-600 dark:text-red-400" />
                    : <User size={16} className="text-gray-600 dark:text-gray-400" />
                  }
                </div>

                {/* Message bubble */}
                <div className={`flex flex-col ${msg.sender === "manager" ? "items-end" : "items-start"} max-w-[75%]`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "manager"
                      ? "bg-red-600 text-white rounded-tr-sm"
                      : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-white border border-gray-200 dark:border-neutral-700 rounded-tl-sm"
                      }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                    {formatTime(msg.time instanceof Date ? msg.time : new Date(msg.time))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <TextArea
            value={text}
            onChange={(val) => setText(val)}
            rows={2}
            placeholder={t('idea.chat_placeholder') || (language === 'ja' ? '返信を入力...' : 'Nhập phản hồi...')}
            className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 dark:text-white resize-none"
            enableSpeech={true}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          disabled={!text.trim()}
        >
          <Send size={18} /> {t('button.submit') || (language === 'ja' ? '送信' : 'Gửi')}
        </button>
      </div>
    </div>
  );
};
