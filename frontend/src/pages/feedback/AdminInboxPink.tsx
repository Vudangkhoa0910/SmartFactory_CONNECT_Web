import React, { useState } from "react";
import {
  Inbox,
  Shield,
  User,
  VenetianMask,
  Send,
  Archive,
  X,
} from "lucide-react";

type MessageStatus = "Mới" | "Đang xem xét" | "Đã xử lý";

interface SensitiveMessage {
  id: string;
  isAnonymous: boolean;
  senderName?: string;
  senderId?: string;
  title: string;
  fullContent: string;
  imageUrl?: string;
  timestamp: Date;
  status: MessageStatus;
}

const SENSITIVE_MESSAGES_DATA: SensitiveMessage[] = [
  {
    id: "MSG-SEC-01",
    isAnonymous: true,
    title: "Vấn đề an toàn thực phẩm ở canteen",
    fullContent:
      "Gửi ban quản lý, tôi nhận thấy gần đây chất lượng thực phẩm ở canteen đi xuống...",
    imageUrl:
      "https://storage.googleapis.com/gemini-prod/images/4d2a33f4-00d3-4652-901d-616335f458cf.png",
    timestamp: new Date(Date.now() - 3600000),
    status: "Mới",
  },
  {
    id: "MSG-SEC-02",
    isAnonymous: false,
    senderName: "Trần Văn Long",
    senderId: "NV-1024",
    title: "Góp ý về chính sách nghỉ phép năm",
    fullContent:
      "Tôi đề xuất công ty có thể cho phép nhân viên gối một phần ngày nghỉ phép chưa sử dụng...",
    timestamp: new Date(Date.now() - 2 * 3600000),
    status: "Mới",
  },
];

const DEPARTMENTS_TO_FORWARD = [
  "Phòng Nhân sự (HR)",
  "Quản lý Nhà máy",
  "Ban Giám đốc",
  "Công đoàn",
];

interface ForwardModalProps {
  message: SensitiveMessage;
  onClose: () => void;
  onForward: (messageId: string, department: string, note: string) => void;
}

const ForwardModal: React.FC<ForwardModalProps> = ({
  message,
  onClose,
  onForward,
}) => {
  const [department, setDepartment] = useState("");
  const [note, setNote] = useState("");

  const handleForward = () => {
    if (!department) {
      alert("Vui lòng chọn phòng ban để chuyển tiếp.");
      return;
    }
    onForward(message.id, department, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/20">
      <div className="w-full max-w-md shadow-xl rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Chuyển tiếp Góp ý
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm mb-4 text-gray-700 dark:text-gray-300">
            Bạn đang chuyển tiếp góp ý:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{message.title}"
            </span>
          </p>

          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Chuyển đến phòng ban
          </label>
          <select
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-2 border dark:border-gray-700 rounded-md text-sm 
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">-- Chọn phòng ban --</option>
            {DEPARTMENTS_TO_FORWARD.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <label className="block text-sm font-medium mt-4 mb-1 text-gray-700 dark:text-gray-300">
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            rows={4}
            onChange={(e) => setNote(e.target.value)}
            className="w-full p-2 border dark:border-gray-700 rounded-md text-sm
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200
              focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="px-5 py-3 flex justify-end gap-3 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border dark:border-gray-600 
              hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleForward}
            className="px-4 py-2 text-sm text-white bg-gradient-to-r from-rose-600 to-rose-500 rounded-md hover:from-rose-700 hover:to-rose-600 flex items-center gap-2 transition-colors"
          >
            <Send size={16} /> Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SensitiveInboxPage() {
  const [messages, setMessages] = useState(SENSITIVE_MESSAGES_DATA);
  const [selectedMessageId, setSelectedMessageId] = useState(messages[0]?.id);
  const [isForwarding, setIsForwarding] = useState(false);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  const handleForward = (id: string, dept: string, note: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Đang xem xét" } : m))
    );
    setIsForwarding(false);
  };

  return (
    <>
      {isForwarding && selectedMessage && (
        <ForwardModal
          message={selectedMessage}
          onClose={() => setIsForwarding(false)}
          onForward={handleForward}
        />
      )}

      <div className="h-screen w-full flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200">
        {/* LEFT LIST */}
        <aside className="w-[360px] border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
          <header className="p-4 border-b dark:border-gray-700">
            <h1 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
              <Shield size={20} className="text-rose-600" />
              Hòm thư Hồng
            </h1>
          </header>

          <div className="overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`p-3.5 border-b dark:border-gray-700 cursor-pointer flex flex-col transition-colors
                  ${
                    selectedMessageId === msg.id
                      ? "bg-gray-100 dark:bg-gray-700 border-l-4 border-rose-600 pl-2"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 pl-3.5"
                  }`}
              >
                <div className="flex gap-2 items-center font-semibold text-sm">
                  {msg.isAnonymous ? (
                    <VenetianMask size={14} className="text-rose-600" />
                  ) : (
                    <User
                      size={14}
                      className="text-gray-700 dark:text-gray-300"
                    />
                  )}
                  <span className="text-gray-900 dark:text-gray-200">
                    {msg.isAnonymous ? "Ẩn danh" : msg.senderName}
                  </span>
                  <span
                    className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold
                    ${
                      msg.status === "Mới"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-700 dark:text-rose-200"
                        : msg.status === "Đang xem xét"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200"
                        : "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200"
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>

                <p className="text-sm mt-1 truncate text-gray-700 dark:text-gray-300">
                  {msg.title}
                </p>

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

        {/* RIGHT DETAIL */}
        <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          {selectedMessage ? (
            <>
              <header className="p-4 border-b dark:border-gray-700 flex justify-between items-center shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedMessage.title}
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 border dark:border-gray-600 
                    hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <Archive size={14} />
                    Lưu trữ
                  </button>

                  <button
                    onClick={() => setIsForwarding(true)}
                    className="px-3 py-1.5 text-sm text-white bg-rose-600 rounded-md hover:bg-rose-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={14} />
                    Chuyển tiếp
                  </button>
                </div>
              </header>

              <div className="p-6 overflow-y-auto flex-grow text-gray-800 dark:text-gray-200">
                <p className="text-base leading-relaxed">
                  {selectedMessage.fullContent}
                </p>

                {selectedMessage.imageUrl && (
                  <img
                    src={selectedMessage.imageUrl}
                    className="max-w-lg rounded-lg mt-4 border dark:border-gray-700 shadow hover:scale-105 transition-transform duration-200"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-700 dark:text-gray-300">
              <Inbox size={64} />
              <p className="mt-4 text-lg">Chưa có góp ý nào được chọn</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
