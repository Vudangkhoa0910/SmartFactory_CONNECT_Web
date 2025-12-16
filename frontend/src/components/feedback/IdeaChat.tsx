// src/components/feedback/IdeaChat.tsx

import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./types";
import { Send } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import Input from "../form/input/InputField";

interface IdeaChatProps {
  chat: ChatMessage[];
  onSend: (text: string) => void;
}

export const IdeaChat: React.FC<IdeaChatProps> = ({ chat, onSend }) => {
  const { t } = useTranslation();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    // Logic này bây giờ chỉ chạy khi một tin nhắn mới được thêm vào,
    // không chạy khi chuyển đổi giữa các idea khác nhau.
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  // CẢI TIẾN: Cho phép nhấn Enter để gửi
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn không cho xuống dòng trong input
      handleSend();
    }
  };

  return (
    <div>
      <div className="h-48 overflow-y-auto bg-gray-50 dark:bg-neutral-900 p-3 rounded-lg border border-gray-200 dark:border-neutral-700">
        {chat.map((msg) => (
          <div
            key={msg.id}
            className={`mb-2 flex ${
              msg.sender === "manager" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs text-sm ${
                msg.sender === "manager"
                  ? "bg-red-600 text-white"
                  : "bg-white dark:bg-neutral-800 text-gray-800 dark:text-white border border-gray-200 dark:border-neutral-700"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Mốc để cuộn tới */}
        <div ref={chatEndRef} />
      </div>
      <div className="flex mt-3 gap-2 items-center">
        <div className="flex-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('idea.chat_placeholder')}
            className="bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-700 focus:ring-red-500 focus:border-transparent dark:text-white"
            enableSpeech={true}
          />
        </div>
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors h-[44px]"
          disabled={!text.trim()}
        >
          <Send size={16} /> {t('button.submit')}
        </button>
      </div>
    </div>
  );
};
