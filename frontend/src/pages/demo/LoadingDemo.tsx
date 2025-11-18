// Demo page to test the loading spinner
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export default function LoadingDemo() {
  return (
    <div className="h-screen w-full">
      <LoadingSpinner size="lg" message="Đang tải dữ liệu..." />
    </div>
  );
}
