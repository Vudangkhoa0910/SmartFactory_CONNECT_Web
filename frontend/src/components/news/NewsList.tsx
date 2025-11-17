import React, { useState } from "react";
import { Pencil, Trash2, FileText } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  publish_at?: string;
  attachments?: string[];
}

export default function NewsList() {
  const [list, setList] = useState<NewsItem[]>([
    {
      id: "1",
      title: "Thông báo bảo trì hệ thống",
      excerpt: "Hệ thống sẽ bảo trì lúc 22:00...",
      publish_at: "2025-11-20",
      attachments: ["BaoTri.pdf"],
    },
    {
      id: "2",
      title: "Cải tiến quy trình lắp ráp",
      excerpt: "Công đoạn XYZ sẽ được tối ưu...",
      publish_at: "2025-11-19",
    },
  ]);

  const handleDelete = (id: string) => {
    setList(list.filter((item) => item.id !== id));
  };

  const handleEdit = (id: string) => {
    alert(`Chức năng SỬA tin (ID: ${id}) đang chờ kết nối API.`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Danh sách Tin tức</h2>

      <div className="space-y-4">
        {list.map((item) => (
          <div
            key={item.id}
            className="p-4 border rounded-xl dark:border-gray-700 flex justify-between items-start"
          >
            {/* Left */}
            <div>
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm opacity-75 mt-1">{item.excerpt}</p>

              {item.attachments?.length ? (
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 dark:text-blue-400">
                  <FileText size={16} />
                  {item.attachments.join(", ")}
                </div>
              ) : null}

              <div className="text-xs mt-2 opacity-60">
                Ngày đăng: {item.publish_at}
              </div>
            </div>

            {/* Right buttons */}
            <div className="flex gap-3">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => handleEdit(item.id)}
              >
                <Pencil size={20} />
              </button>

              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
