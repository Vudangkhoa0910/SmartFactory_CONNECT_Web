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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* HEADER + ACTIONS (Không cuộn) */}
      <div className="p-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-white">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{idea.title}</h2>
          <p className="text-sm text-gray-500">
            Người gửi: {idea.senderName} • {idea.senderId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
          >
            <Check size={16} /> Duyệt
          </button>
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <X size={16} /> Từ chối
          </button>
          {showForwardButton && (
            <button
              onClick={() => onUpdateStatus("Escalate")}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <ArrowUpRight size={16} /> Chuyển tiếp
            </button>
          )}
        </div>
      </div>

      {/* NỘI DUNG (Khu vực có thể cuộn) */}
      <div key={idea.id} className="overflow-y-auto flex-1 bg-gray-50">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          {/* Nội dung chính */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="leading-relaxed text-gray-700">{idea.content}</p>
            {idea.imageUrl && (
              <img
                src={idea.imageUrl}
                alt="Hình ảnh đính kèm"
                className="max-w-lg mt-4 rounded-lg shadow-md border border-gray-200"
              />
            )}
          </div>

          {/* ĐỀ XUẤT HƯỚNG GIẢI QUYẾT */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <label className="block mb-3 font-semibold text-gray-900">
              Đề xuất hướng giải quyết:
            </label>
            {!solution ? (
              <div className="flex gap-2">
                <textarea
                  value={solutionInput}
                  onChange={(e) => setSolutionInput(e.target.value)}
                  rows={3}
                  className="flex-1 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nhập phương án giải quyết..."
                />
                <button
                  onClick={handleSendSolution}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors h-fit"
                >
                  <Send size={16} /> Gửi
                </button>
              </div>
            ) : (
              <div className="p-4 border-l-4 border-red-600 bg-red-50 rounded-r-lg flex justify-between items-start">
                <p className="text-gray-700">
                  {solution.note}
                </p>
                <span
                  className={`ml-4 font-semibold text-sm px-3 py-1 rounded-full ${
                    solution.status === "Đang chờ xử lý"
                      ? "text-yellow-700 bg-yellow-100"
                      : solution.status === "Đã duyệt"
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100"
                  }`}
                >
                  {solution.status}
                </span>
              </div>
            )}
          </div>

          {/* Lịch sử hành động */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <IdeaHistory history={idea.history} />
          </div>

          {/* Chat trao đổi */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold mb-3 text-gray-900">Trao đổi</h3>
            <IdeaChat chat={idea.chat} onSend={onSendChat} />
          </div>
        </div>
      </div>
    </div>
  );
};
