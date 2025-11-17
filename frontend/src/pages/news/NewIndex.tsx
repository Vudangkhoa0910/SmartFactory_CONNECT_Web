import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import NewsForm from "../../components/news/NewsForm";
import NewsList from "../../components/news/NewsList";
import { Plus, Minus } from "lucide-react";

export default function NewsPage() {
  const [isFormVisible, setIsFormVisible] = useState(true); // Mặc định hiển thị form

  return (
    <>
      <PageMeta
        title="Quản lý Tin tức | Admin"
        description="Trang quản lý tin tức gồm thêm, sửa, xoá và xem lịch sử tin."
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Cột chính hiển thị danh sách tin tức */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <NewsList />
        </div>

        {/* Cột phụ cho form tạo tin tức */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className="w-full flex justify-between items-center p-4 text-xl font-semibold"
            >
              <span>Tạo tin tức mới</span>
              {isFormVisible ? <Minus size={22} /> : <Plus size={22} />}
            </button>

            {/* Hiệu ứng trượt xuống */}
            <div
              className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isFormVisible ? "max-h-screen" : "max-h-0"
              }`}
            >
              <div className="p-4 border-t dark:border-gray-700">
                <NewsForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
