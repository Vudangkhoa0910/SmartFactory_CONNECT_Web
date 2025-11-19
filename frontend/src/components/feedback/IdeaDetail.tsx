// src/components/feedback/IdeaDetail.tsx

import React, { useState } from "react";
import { PublicIdea } from "./types";
import { IdeaHistory } from "./IdeaHistory";
import { IdeaChat } from "./IdeaChat";
import { Check, X, ArrowUpRight, Send } from "lucide-react";

interface IdeaDetailProps {
  idea: PublicIdea;
  onUpdateStatus: (
    status: string,
    note?: string,
    solutionStatus?: string
  ) => void;
  onSendChat: (text: string) => void;
  showForwardButton?: boolean;
}

export const IdeaDetail: React.FC<IdeaDetailProps> = ({
  idea,
  onUpdateStatus,
  onSendChat,
  showForwardButton = true,
}) => {
  const [solutionInput, setSolutionInput] = useState("");
  const [solution, setSolution] = useState<{
    note: string;
    status: string;
  } | null>(null);

  const handleSendSolution = () => {
    if (!solutionInput.trim()) return;
    const newSolution = {
      note: solutionInput.trim(),
      status: "Đang chờ xử lý",
    };
    setSolution(newSolution);
    setSolutionInput("");
    onUpdateStatus("Hướng giải quyết", newSolution.note, newSolution.status);
  };

  const handleApprove = () => {
    const note = solution?.note || solutionInput || "Đã duyệt";
    const updatedSolution = { note, status: "Đã duyệt" };
    setSolution(updatedSolution);
    onUpdateStatus("Đã duyệt", note, "Đã duyệt");
  };

  const handleReject = () => {
    const note = solution?.note || solutionInput || "Đã từ chối";
    setSolution(null);
    setSolutionInput("");
    onUpdateStatus("Đã từ chối", note, "Từ chối");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* HEADER + ACTIONS (Không cuộn) */}
      <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center flex-shrink-0 bg-white dark:bg-gray-800">
        <div>
          <h2 className="text-xl font-bold">{idea.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Người gửi: {idea.senderName} • {idea.senderId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
          >
            <Check size={16} /> Duyệt
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <X size={16} /> Từ chối
          </button>
          {showForwardButton && (
            <button
              onClick={() => onUpdateStatus("Escalate")}
              className="px-4 py-2 text-sm border dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <ArrowUpRight size={16} /> Chuyển tiếp
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG (Khu vực có thể cuộn) */}
      <div key={idea.id} className="overflow-y-auto flex-1">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {/* Nội dung chính */}
          <div>
            <p className="leading-relaxed">{idea.content}</p>
            {idea.imageUrl && (
              <img
                src={idea.imageUrl}
                alt="Hình ảnh đính kèm"
                className="max-w-lg mt-4 rounded-lg shadow-md border dark:border-gray-700"
              />
            )}
          </div>

          {/* ĐỀ XUẤT HƯỚNG GIẢI QUYẾT */}
          <div className="mt-4">
            <label className="block mb-1 font-medium">
              Đề xuất hướng giải quyết:
            </label>
            {!solution ? (
              <div className="flex gap-2">
                <textarea
                  value={solutionInput}
                  onChange={(e) => setSolutionInput(e.target.value)}
                  rows={3}
                  className="flex-1 border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700"
                  placeholder="Nhập phương án giải quyết..."
                />
                <button
                  onClick={handleSendSolution}
                  className="px-4 py-2 bg-rose-600 text-white rounded-md hover:bg-rose-700 flex items-center gap-2"
                >
                  <Send size={16} /> Gửi
                </button>
              </div>
            ) : (
              <div className="p-3 border-l-4 border-blue-600 dark:border-blue-500 flex justify-between items-start bg-transparent">
                <p className="text-gray-700 dark:text-gray-300">
                  {solution.note}
                </p>
                <span
                  className={`ml-4 font-semibold ${
                    solution.status === "Đang chờ xử lý"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : solution.status === "Đã duyệt"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {solution.status}
                </span>
              </div>
            )}
          </div>

          {/* Lịch sử hành động */}
          <IdeaHistory history={idea.history} />

          {/* Chat trao đổi */}
          <div>
            <h3 className="font-semibold mb-2">Trao đổi</h3>
            <IdeaChat chat={idea.chat} onSend={onSendChat} />
          </div>
        </div>
      </div>
    </div>
  );
};
