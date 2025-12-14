import React from "react";
import { Shield, User, VenetianMask, Inbox } from "lucide-react";
import { SensitiveMessage } from "./types";

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
      <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col">
        <header className="p-4 border-b border-gray-200 flex items-center gap-3 shrink-0">
          <Shield size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-gray-800">
            Hòm thư Hồng
          </h2>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-gray-500">
          <Inbox size={48} className="mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-700">
            Hòm thư trống
          </h3>
          <p className="text-sm mt-1">Chưa có tin nhắn nào.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-white border-r border-gray-200 flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
        <Shield size={20} className="text-red-600" />
        <h2 className="text-lg font-bold text-gray-800">
          Hòm thư Hồng
        </h2>
      </header>

      <div className="overflow-y-auto flex-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => onSelectMessage(msg.id)}
            className={`
              px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors duration-150
              ${
                selectedMessageId === msg.id
                  ? "bg-red-50 border-l-4 border-l-red-600"
                  : "border-l-4 border-l-transparent hover:bg-gray-50"
              }
            `}
          >
            {/* Dòng title: hiển thị trước */}
            <p className="text-sm font-semibold text-gray-900 truncate">
              {msg.title}
            </p>

            {/* Hàng icon + tên người gửi + trạng thái */}
            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2 text-sm">
                {msg.isAnonymous ? (
                  <VenetianMask size={14} className="text-red-600" />
                ) : (
                  <User size={14} className="text-gray-500" />
                )}
                <span className="text-gray-600">
                  {msg.isAnonymous ? "Ẩn danh" : msg.senderName}
                </span>
              </div>

              <span
                className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold
                  ${
                    msg.status === "Mới"
                      ? "bg-red-100 text-red-700"
                      : msg.status === "Đang xem xét"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-red-600 text-white"
                  }`}
              >
                {msg.status}
              </span>
            </div>

            {/* Dòng thời gian */}
            <p className="text-xs mt-1 text-gray-500">
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
