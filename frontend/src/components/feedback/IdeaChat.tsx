// src/components/feedback/IdeaChat.tsx

import React, { useRef, useEffect, useState } from "react";
import { ChatMessage } from "./types";
import { Send } from "lucide-react";

interface IdeaChatProps {
  chat: ChatMessage[];
  onSend: (text: string) => void;
}

export const IdeaChat: React.FC<IdeaChatProps> = ({ chat, onSend }) => {
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
      <div className="h-48 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-200">
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
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Mốc để cuộn tới */}
        <div ref={chatEndRef} />
      </div>
      <div className="flex mt-3 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập phản hồi..."
          className="flex-1 px-3 py-2 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
          disabled={!text.trim()}
        >
          <Send size={16} /> Gửi
        </button>
      </div>
    </div>
  );
};
