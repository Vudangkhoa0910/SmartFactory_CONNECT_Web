import { useState, useMemo, useEffect } from "react";
import { Search, Tag, BookOpen, Award, Lightbulb, Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { getKaizenBank, Idea, getDifficultyLabel } from "../../services/idea.service";

// Default category tags
const DEFAULT_TAGS = [
  "Chất lượng",
  "Hiệu suất",
  "An toàn",
  "Tiết kiệm NL",
  "5S",
  "Lean",
];

export default function KaizenBankPage() {
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [kaizenItems, setKaizenItems] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>(DEFAULT_TAGS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch implemented ideas (Kaizen bank)
        const data = await getKaizenBank({ search: "" });
        setKaizenItems(data);
        
        // Extract unique categories from data
        const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
        if (categories.length > 0) {
          setAllTags(categories as string[]);
        }
      } catch (error) {
        console.error("Failed to fetch Kaizen bank:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return kaizenItems.filter((item) => {
      const matchKeyword =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (item.expected_benefit?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchTags =
        selectedTags.length === 0 ||
        (item.category && selectedTags.includes(item.category));

      return matchKeyword && matchTags;
    });
  }, [search, selectedTags, kaizenItems]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Kaizen Bank | SmartFactory CONNECT"
        description="Kho lưu trữ các ý tưởng cải tiến đã được phê duyệt"
      />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={28} className="text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Kaizen Bank – Kho Cải Tiến
            </h1>
            <p className="text-gray-500 mt-0.5">
              Thư viện các ý tưởng cải tiến đã triển khai thành công. Tra cứu – học hỏi – áp dụng cho công việc.
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo từ khóa..."
              className="w-full outline-none bg-transparent text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full border text-sm flex items-center gap-1 transition-colors duration-200
                  ${
                    selectedTags.includes(tag)
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <Tag
                  size={14}
                  className={selectedTags.includes(tag) ? "text-white" : "text-red-600"}
                />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb size={18} className="text-red-500" />
                {item.title}
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                ID: {item.idea_code || item.id} •{" "}
                {new Date(item.created_at).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                {item.difficulty_level && ` • Độ khó: ${getDifficultyLabel(item.difficulty_level)}`}
              </p>

              <div className="mt-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">• Mô tả:</span>{" "}
                  {item.description}
                </p>
                {item.expected_benefit && (
                  <p className="mt-1">
                    <span className="font-semibold">• Lợi ích dự kiến:</span>{" "}
                    {item.expected_benefit}
                  </p>
                )}
                {item.actual_savings && item.actual_savings > 0 && (
                  <p className="mt-1">
                    <span className="font-semibold">• Tiết kiệm thực tế:</span>{" "}
                    {item.actual_savings.toLocaleString('vi-VN')} VNĐ
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Award size={16} className="text-red-500" />
                <span>
                  Đóng góp bởi:{" "}
                  <span className="font-medium">{item.submitter_name || 'Ẩn danh'}</span>
                </span>
              </div>

              {item.category && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="px-3 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                    {item.category}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Lightbulb size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {kaizenItems.length === 0 
                ? "Chưa có ý tưởng nào được triển khai."
                : "Không tìm thấy kết quả phù hợp."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
