import React, { useState, useMemo } from "react";
import { Search, Tag, BookOpen, Award, Lightbulb } from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface KaizenItem {
  id: string;
  title: string;
  problem: string;
  solution: string;
  result: string;
  contributor: string;
  tags: string[];
  createdAt: Date;
}

// ============================================================
// DEMO DATA
// ============================================================
const KAIZEN_DATA: KaizenItem[] = [
  {
    id: "KZ-001",
    title: "Tiết kiệm điện khu vực line 3",
    problem: "Đèn chiếu sáng không tự tắt khi không có người.",
    solution: "Lắp cảm biến chuyển động tự ngắt.",
    result: "Giảm 28% chi phí điện mỗi tháng.",
    contributor: "Nguyễn Văn Minh (MA-03)",
    tags: ["Tiết kiệm NL", "Hiệu suất"],
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "KZ-002",
    title: "Tăng an toàn cho công nhân line 5",
    problem: "Có nguy cơ kẹt tay khi thao tác ở vị trí máy ép.",
    solution: "Lắp thanh chắn an toàn + cảm biến dừng khẩn.",
    result: "Giảm rủi ro tai nạn nặng xuống còn 0%.",
    contributor: "Trần Thị Lan (QA-02)",
    tags: ["An toàn", "Chất lượng"],
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: "KZ-003",
    title: "Giảm lỗi in barcode",
    problem: "Barcode mờ do bụi bám, dẫn đến tỉ lệ NG cao.",
    solution: "Thiết kế ống thổi khí tự động làm sạch đầu in.",
    result: "Tỉ lệ NG giảm từ 3.2% xuống 0.5%.",
    contributor: "Lê Thành Đạt (ENG-07)",
    tags: ["Chất lượng", "Hiệu suất"],
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
];

const ALL_TAGS = [
  "Chất lượng",
  "Hiệu suất",
  "An toàn",
  "Tiết kiệm NL",
  "5S",
  "Lean",
];

// ============================================================
// COMPONENT
// ============================================================
export default function KaizenBankPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    return KAIZEN_DATA.filter((item) => {
      const matchKeyword =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.problem.toLowerCase().includes(search.toLowerCase()) ||
        item.solution.toLowerCase().includes(search.toLowerCase());

      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => item.tags.includes(tag));

      return matchKeyword && matchTags;
    });
  }, [search, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen  p-6 font-sans transition-colors duration-300">
      {/* ===== HEADER ===== */}
      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <BookOpen
            size={32}
            className="text-indigo-600 dark:text-indigo-400"
          />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 transition-colors duration-300">
            Kaizen Bank – Kho Cải Tiến
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-300">
          Thư viện các ý tưởng cải tiến đã triển khai thành công. Tra cứu – học
          hỏi – áp dụng cho công việc.
        </p>
      </header>

      <div className="max-w-5xl mx-auto">
        {/* ===== SEARCH ===== */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl shadow border dark:border-gray-700 transition-colors duration-300">
          <Search size={20} className="text-gray-500 dark:text-gray-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo từ khóa..."
            className="w-full outline-none bg-transparent text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors duration-300"
          />
        </div>

        {/* ===== TAG FILTERS ===== */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1 transition-colors duration-200
                ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              <Tag size={14} />
              {tag}
            </button>
          ))}
        </div>

        {/* ===== LIST ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md hover:shadow-xl border dark:border-gray-700 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 transition-colors duration-300">
                <Lightbulb size={18} className="text-yellow-500" />
                {item.title}
              </h3>

              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1 transition-colors duration-300">
                ID: {item.id} •{" "}
                {item.createdAt.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>

              <div className="mt-3 text-sm text-gray-700 dark:text-gray-200 transition-colors duration-300">
                <p>
                  <span className="font-semibold">• Vấn đề:</span>{" "}
                  {item.problem}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">• Giải pháp:</span>{" "}
                  {item.solution}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">• Kết quả:</span>{" "}
                  {item.result}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                <Award size={16} className="text-green-600" />
                <span>
                  Đóng góp bởi:{" "}
                  <span className="font-medium">{item.contributor}</span>
                </span>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs rounded-full transition-colors duration-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8 transition-colors duration-300">
            Không tìm thấy kết quả phù hợp.
          </p>
        )}
      </div>
    </div>
  );
}
