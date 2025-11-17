import React, { useRef, useEffect } from "react";
import { ChatMessage } from "./types";
import { Send } from "lucide-react";

interface IdeaChatProps {
  chat: ChatMessage[];
  onSend: (text: string) => void;
}

export const IdeaChat: React.FC<IdeaChatProps> = ({ chat, onSend }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [text, setText] = React.useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2 flex items-center gap-2">
        <Send size={16} /> Phản hồi
      </h3>
      <div className="h-48 overflow-y-auto bg-white dark:bg-gray-900 p-3 rounded-lg border dark:border-gray-700">
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
                  ? "bg-rose-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="flex mt-2 gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập phản hồi..."
          className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-gray-900 border dark:border-gray-700"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
        >
          <Send size={16} /> Gửi
        </button>
      </div>
    </div>
  );
};
