import React from "react";
import { Shield, User, VenetianMask, Inbox } from "lucide-react";
import { SensitiveMessage } from "./data";

interface MessageListProps {
  messages: SensitiveMessage[];
  selectedMessageId: string | undefined;
  onSelectMessage: (id: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedMessageId,
  onSelectMessage,
}) => {
  // Trạng thái rỗng
  if (messages.length === 0) {
    return (
      <aside className="w-[360px] bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <header className="p-4 border-b dark:border-gray-700 flex items-center gap-3 shrink-0">
          <Shield size={20} className="text-rose-600" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Hòm thư Hồng
          </h2>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-gray-500 dark:text-gray-400">
          <Inbox size={48} className="mb-4 text-gray-400" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-200">
            Hòm thư trống
          </h3>
          <p className="text-sm mt-1">Chưa có tin nhắn nào.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col h-full">
      <header className="p-4 border-b dark:border-gray-700 flex items-center gap-3 flex-shrink-0">
        <Shield size={20} className="text-rose-600" />
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          Hòm thư Hồng
        </h2>
      </header>

      <div className="overflow-y-auto flex-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg.id)}
            className={`
              px-4 py-3 border-b dark:border-gray-700 cursor-pointer transition-colors duration-150
              ${
                selectedMessageId === msg.id
                  ? "bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-600"
                  : "border-l-4 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/30"
              }
            `}
          >
            {/* Dòng title: hiển thị trước */}
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate">
              {msg.title}
            </p>

            {/* Hàng icon + tên người gửi + trạng thái */}
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2 text-sm">
                {msg.isAnonymous ? (
                  <VenetianMask size={14} className="text-rose-600" />
                ) : (
                  <User
                    size={14}
                    className="text-gray-600 dark:text-gray-300"
                  />
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  {msg.isAnonymous ? "Ẩn danh" : msg.senderName}
                </span>
              </div>

              <span
                className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold
                  ${
                    msg.status === "Mới"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200"
                      : msg.status === "Đang xem xét"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200"
                      : "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200"
                  }`}
              >
                {msg.status}
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
        ))}
      </div>
    </aside>
  );
};
