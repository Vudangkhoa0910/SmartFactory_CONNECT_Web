// src/features/incident-workspace/data/index.ts

import { Incident } from "./index";

export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-7845",
    title: "Mất kết nối máy chủ Database chính",
    priority: "Critical",
    timestamp: new Date(Date.now() - 1 * 60000), // 1 phút trước
    source: "Hệ thống giám sát",
    description:
      "Hệ thống giám sát Prometheus phát hiện latency tăng đột biến trên service `db-primary-1`.\nKiểm tra logs cho thấy có nhiều query bị timeout. Cần điều tra gấp, có khả năng ảnh hưởng toàn bộ hệ thống.",
  },
  {
    id: "INC-7849",
    title: "Cảnh báo đăng nhập bất thường từ IP lạ",
    priority: "Critical",
    timestamp: new Date(Date.now() - 3 * 60000), // 3 phút trước
    source: "An ninh mạng",
    description:
      "Hệ thống SIEM phát hiện nhiều lần đăng nhập thất bại vào tài khoản admin từ địa chỉ IP 123.45.67.89 (Nga).\nCần khóa tài khoản và rà soát hệ thống ngay lập tức.",
  },
  {
    id: "INC-7846",
    title: "Lỗi API thanh toán của đối tác VNPAY",
    priority: "High",
    timestamp: new Date(Date.now() - 5 * 60000), // 5 phút trước
    source: "Báo cáo người dùng",
    description:
      "Nhiều người dùng báo cáo không thể hoàn tất thanh toán qua VNPAY, nhận mã lỗi `GW_TIMEOUT`.\nĐã xác nhận với VNPAY, họ đang kiểm tra hạ tầng. Cần theo dõi và cập nhật trạng thái cho khách hàng.",
  },
  {
    id: "INC-7848",
    title: "Website chạy chậm bất thường sau khi deploy",
    priority: "High",
    timestamp: new Date(Date.now() - 10 * 60000), // 10 phút trước
    source: "Tổ Vận hành (MA)",
    description:
      "Tốc độ tải trang chủ (/) và trang sản phẩm (/products) tăng từ 200ms lên 3500ms sau bản deploy lúc 14:00. Yêu cầu team Dev kiểm tra gấp.",
  },
  {
    id: "INC-7847",
    title: "Máy in tầng 3 không hoạt động",
    priority: "Normal",
    timestamp: new Date(Date.now() - 15 * 60000), // 15 phút trước
    source: "IT Helpdesk",
    description:
      "Phòng Kế toán báo máy in `HP LaserJet Pro M404dn` tại tầng 3 không in được, báo lỗi 'Paper Jam' dù không có giấy kẹt. Cần IT Helpdesk kiểm tra vật lý.",
  },
  {
    id: "INC-7850",
    title: "Yêu cầu cấp quyền truy cập vào file share",
    priority: "Low",
    timestamp: new Date(Date.now() - 30 * 60000), // 30 phút trước
    source: "IT Helpdesk",
    description:
      "Nhân viên mới Nguyễn Văn A (Phòng Marketing) yêu cầu cấp quyền đọc/ghi vào thư mục `//server/shares/marketing`. Cần quản lý xác nhận trước khi thực hiện.",
  },
];

export const DEPARTMENTS = [
  "Tổ Vận hành (MA)",
  "Phòng Kỹ thuật (Dev)",
  "IT Helpdesk",
  "An ninh mạng",
];
