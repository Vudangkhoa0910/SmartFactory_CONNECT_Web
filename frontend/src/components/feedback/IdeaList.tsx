// src/components/IdeaList.tsx

import React from "react";
// CẢI TIẾN: Thêm icon từ thư viện lucide-react (hoặc thư viện icon bạn dùng)
import { Inbox, Mail } from "lucide-react";
import { PublicIdea } from "../types/index";

interface IdeaListProps {
  ideas: PublicIdea[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const IdeaList: React.FC<IdeaListProps> = ({
  ideas,
  selectedId,
  onSelect,
}) => {
  // CẢI TIẾN: Hiển thị trạng thái rỗng khi không có dữ liệu
  if (ideas.length === 0) {
    return (
      <aside className="w-[360px] bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col">
        <header className="p-4 border-b dark:border-slate-800 flex items-center gap-3 shrink-0">
          <Mail size={20} className="text-red-600" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Hòm thư Trắng
          </h2>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400">
          <Inbox size={48} className="mb-4 text-slate-400" />
          <h3 className="font-semibold text-slate-700 dark:text-slate-200">
            Hòm thư trống
          </h3>
          <p className="text-sm mt-1">Chưa có ý kiến đóng góp nào được gửi.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[360px] bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col">
      {/* CẢI TIẾN: Header được làm nổi bật hơn */}
      <header className="p-4 border-b dark:border-slate-800 flex items-center gap-3 shrink-0">
        <Mail size={20} className="text-red-500" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Hòm thư Trắng
        </h2>
      </header>

      {/* CẢI TIẾN: Thêm overflow-y-auto để cuộn danh sách */}
      <div className="overflow-y-auto">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => onSelect(idea.id)}
            // CẢI TIẾN: Class được cấu trúc lại để dễ đọc và đẹp hơn
            className={`
              px-4 py-3 border-b dark:border-slate-800 cursor-pointer transition-colors duration-150
              ${
                selectedId === idea.id
                  ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500"
                  : "border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
              }
            `}
          >
            <div className="flex justify-between items-start">
              {/* CẢI TIẾN: Tiêu đề in đậm nếu chưa đọc */}
              <p
                className={`text-sm pr-2 ${
                  !idea.isRead
                    ? "font-bold text-slate-800 dark:text-slate-100"
                    : "font-semibold text-slate-700 dark:text-slate-300"
                }`}
              >
                {idea.title}
              </p>
              {/* CẢI TIẾN: Thêm chấm đỏ cho thư chưa đọc */}
              {!idea.isRead && (
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-1.5"></div>
              )}
            </div>

            {/* CẢI TIẾN: Layout cho thông tin phụ */}
            <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-slate-400">
              <p className="truncate pr-2">
                {idea.senderName} • {idea.group}
              </p>
              <p className="shrink-0">
                {idea.timestamp.toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
