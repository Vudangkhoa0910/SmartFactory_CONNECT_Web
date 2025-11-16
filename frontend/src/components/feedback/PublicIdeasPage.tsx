import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  ArrowUpRight,
  Check,
  X,
  MessageSquare,
  Layers,
} from "lucide-react";

/* =======================================================
   1) TYPES
======================================================= */

interface PublicIdea {
  id: string;
  senderId: string;
  senderName: string;
  group: string;
  line: string;
  title: string;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  status: StatusType;
  history: ActionHistory[];
  chat: ChatMessage[];
}

type StatusType =
  | "Mới"
  | "Đang xem xét"
  | "Đã chuyển Manager"
  | "Đã duyệt"
  | "Đã từ chối"
  | "Đã triển khai"
  | "Đã hoàn tất";

interface ChatMessage {
  id: string;
  sender: "user" | "manager";
  text: string;
  time: Date;
}

interface ActionHistory {
  time: Date;
  by: string;
  action: string;
  note?: string;
}

/* =======================================================
   2) DUMMY DATA
======================================================= */

const IDEAS_DATA: PublicIdea[] = [
  {
    id: "KAIZEN-001",
    senderId: "NV-1032",
    senderName: "Phan Văn Nam",
    group: "Tổ Hàn",
    line: "Line 04",
    title: "Cải tiến khu vực cấp phôi",
    content:
      "Đề xuất thay đổi vị trí để giảm thao tác thừa, giúp tăng năng suất.",
    timestamp: new Date(),
    status: "Mới",
    history: [],
    chat: [],
  },
  {
    id: "KAIZEN-002",
    senderId: "NV-1102",
    senderName: "Nguyễn Thị B",
    group: "Tổ Đột Dập",
    line: "Line 02",
    title: "Góp ý về việc bố trí dụng cụ",
    content:
      "Kệ dụng cụ hiện tại quá cao, gây bất tiện khi thao tác nhiều lần.",
    timestamp: new Date(Date.now() - 3600000),
    status: "Đang xem xét",
    history: [{ time: new Date(), by: "Supervisor A", action: "Tiếp nhận" }],
    chat: [],
  },
];

/* =======================================================
   3) COMPONENT CHÍNH
======================================================= */

export default function PublicIdeasPage() {
  const [ideas, setIdeas] = useState(IDEAS_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(ideas[0].id);
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedIdea = ideas.find((i) => i.id === selectedId);

  /* Auto scroll chat */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedIdea?.chat]);

  /* =======================================================
     HANDLE ACTIONS
  ======================================================= */

  const handleChatSend = () => {
    if (!selectedIdea || !chatText.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "manager",
      text: chatText.trim(),
      time: new Date(),
    };

    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selectedIdea.id ? { ...i, chat: [...i.chat, newMsg] } : i
      )
    );

    setChatText("");
  };

  const updateStatus = (newStatus: StatusType, note?: string) => {
    if (!selectedIdea) return;
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selectedIdea.id
          ? {
              ...i,
              status: newStatus,
              history: [
                ...i.history,
                {
                  time: new Date(),
                  by: "Supervisor / Manager",
                  action: newStatus,
                  note,
                },
              ],
            }
          : i
      )
    );
  };

  /* =======================================================
     UI RENDER
  ======================================================= */

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* LEFT LIST */}
      <aside className="w-[360px] bg-white dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto">
        <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
          <Layers className="text-rose-600" />
          <h1 className="font-bold text-xl">Hòm thư trắng (Public Ideas)</h1>
        </div>

        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => setSelectedId(idea.id)}
            className={`p-4 border-b dark:border-gray-700 cursor-pointer ${
              selectedId === idea.id
                ? "bg-gray-100 dark:bg-gray-700"
                : "hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <p className="text-sm font-semibold">{idea.title}</p>
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-300">
              {idea.senderName} • {idea.group}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {idea.timestamp.toLocaleString("vi-VN")}
            </p>
          </div>
        ))}
      </aside>

      {/* RIGHT PANEL */}
      <main className="flex-1 flex flex-col">
        {/* HEADER INFO */}
        {selectedIdea && (
          <>
            <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedIdea.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Người gửi: {selectedIdea.senderName} • {selectedIdea.senderId}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Nhóm: {selectedIdea.group} • Dây chuyền: {selectedIdea.line}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus("Đã duyệt")}
                  className="px-4 py-2 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
                >
                  <Check size={16} /> Duyệt
                </button>

                <button
                  onClick={() => updateStatus("Đã từ chối", "Không phù hợp")}
                  className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
                >
                  <X size={16} /> Từ chối
                </button>

                <button
                  onClick={() => updateStatus("Đã chuyển Manager")}
                  className="px-4 py-2 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <ArrowUpRight size={16} />
                  Chuyển tiếp
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {selectedIdea.content}
              </p>

              {selectedIdea.imageUrl && (
                <img
                  src={selectedIdea.imageUrl}
                  className="max-w-lg mt-4 rounded-lg shadow-md border dark:border-gray-700"
                />
              )}

              {/* HISTORY */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Lịch sử xử lý</h3>
                <div className="space-y-2">
                  {selectedIdea.history.map((h, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-semibold">{h.by}</span> – {h.action}{" "}
                      ({h.time.toLocaleString("vi-VN")})
                      {h.note && (
                        <p className="text-gray-500 dark:text-gray-400">
                          Ghi chú: {h.note}
                        </p>
                      )}
                    </div>
                  ))}
                  {selectedIdea.history.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400">
                      Chưa có lịch sử.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CHAT BOX */}
            <div className="border-t dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-800">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare size={16} /> Phản hồi qua lại
              </h3>

              <div className="h-52 overflow-y-auto bg-white dark:bg-gray-900 rounded-lg p-3 border dark:border-gray-700">
                {selectedIdea.chat.map((msg) => (
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

              <div className="flex mt-3 gap-2">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-gray-900 border dark:border-gray-700"
                />
                <button
                  onClick={handleChatSend}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
                >
                  <Send size={16} /> Gửi
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
