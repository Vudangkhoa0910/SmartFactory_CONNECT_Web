import PageMeta from "../../components/common/PageMeta";
import NewsForm from "../../components/news/NewsForm";
import NewsList from "../../components/news/NewsList";
import NewsHistory from "../../components/news/NewsHistory";

export default function NewsPage() {
  return (
    <>
      <PageMeta
        title="Quản lý Tin tức | Admin"
        description="Trang quản lý tin tức gồm thêm, sửa, xoá và xem lịch sử tin."
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Form tạo tin tức */}
        <div className="col-span-12 xl:col-span-5">
          <NewsForm />
        </div>

        {/* Danh sách tin hiện tại */}
        <div className="col-span-12 xl:col-span-7">
          <NewsList />
        </div>

        {/* Lịch sử tin đã đăng */}
        <div className="col-span-12">
          <NewsHistory />
        </div>
      </div>
    </>
  );
}
