// src/data/mockData.ts
import { Incident } from "../types/index";

export const ALL_INCIDENTS_DATA: Incident[] = [
  {
    id: "INC-101",
    title: "Hỏng cảm biến nhiệt lò hơi số 2",
    priority: "Critical",
    status: "Đang xử lý",
    assignedTo: "Tổ MA",
    location: "Xưởng A, Line 3",
    createdAt: new Date(Date.now() - 1 * 3600000), // 1 giờ trước
  },
  {
    id: "INC-102",
    title: "Cần thay thế vòng bi máy dập A",
    priority: "High",
    status: "Tạm dừng", // Tạm dừng do chờ vật tư
    assignedTo: "Tổ MA",
    location: "Xưởng B, Line 1",
    createdAt: new Date(Date.now() - 5 * 3600000), // 5 giờ trước
  },
  {
    id: "INC-103",
    title: "Lỗi phần mềm điều khiển PLC",
    priority: "High",
    status: "Đã tiếp nhận",
    assignedTo: "", // Chưa phân công
    location: "Xưởng A, Line 2",
    createdAt: new Date(Date.now() - 10 * 3600000), // 10 giờ trước
  },
  {
    id: "INC-104",
    title: "Yêu cầu bảo trì định kỳ máy cắt",
    priority: "Normal",
    status: "Mới",
    assignedTo: "",
    location: "Xưởng C",
    createdAt: new Date(Date.now() - 24 * 3600000), // 1 ngày trước
  },
  {
    id: "INC-105",
    title: "Sửa chữa hệ thống băng tải",
    priority: "High",
    status: "Hoàn thành",
    assignedTo: "Tổ Cơ điện",
    location: "Kho vận",
    createdAt: new Date(Date.now() - 48 * 3600000), // 2 ngày trước
  },
  {
    id: "INC-106",
    title: "Rò rỉ dầu thủy lực máy nén",
    priority: "Critical",
    status: "Đang xử lý",
    assignedTo: "Tổ MA",
    location: "Xưởng B, Line 2",
    createdAt: new Date(Date.now() - 2 * 3600000), // 2 giờ trước
  },
  {
    id: "INC-107",
    title: "Kiểm tra hệ thống PCCC",
    priority: "Normal",
    status: "Đã đóng",
    assignedTo: "Đội An toàn",
    location: "Toàn nhà máy",
    createdAt: new Date(Date.now() - 120 * 3600000), // 5 ngày trước
  },

  // ===================================
  // === DỮ LIỆU MỚI BỔ SUNG
  // ===================================

  // --- Cột "Mới" ---
  {
    id: "INC-108",
    title: "Màn hình HMI máy đóng gói bị treo",
    priority: "High",
    status: "Mới",
    assignedTo: "",
    location: "Khu vực đóng gói",
    createdAt: new Date(Date.now() - 0.5 * 3600000), // 30 phút trước
  },
  {
    id: "INC-109",
    title: "Hiệu chuẩn lại máy đo laser D-5",
    priority: "Normal",
    status: "Mới",
    assignedTo: "",
    location: "Phòng QC",
    createdAt: new Date(Date.now() - 12 * 3600000), // 12 giờ trước
  },
  {
    id: "INC-110",
    title: "Đèn chiếu sáng khu C bị nhấp nháy",
    priority: "Low",
    status: "Mới",
    assignedTo: "",
    location: "Xưởng C",
    createdAt: new Date(Date.now() - 30 * 3600000), // 30 giờ trước
  },

  // --- Cột "Đã tiếp nhận" ---
  {
    id: "INC-111",
    title: "Lỗi động cơ servo trục X máy CNC-05",
    priority: "High",
    status: "Đã tiếp nhận",
    assignedTo: "",
    location: "Xưởng C, Line 1",
    createdAt: new Date(Date.now() - 8 * 3600000), // 8 giờ trước
  },
  {
    id: "INC-112",
    title: "Yêu cầu lắp đặt thêm ổ cắm điện",
    priority: "Low",
    status: "Đã tiếp nhận",
    assignedTo: "Tổ Cơ điện",
    location: "Văn phòng xưởng A",
    createdAt: new Date(Date.now() - 50 * 3600000), // ~2 ngày trước
  },

  // --- Cột "Đang xử lý" ---
  {
    id: "INC-113",
    title: "Chập điện tủ điều khiển chính",
    priority: "Critical",
    status: "Đang xử lý",
    assignedTo: "Tổ Cơ điện",
    location: "Phòng kỹ thuật",
    createdAt: new Date(Date.now() - 0.2 * 3600000), // 12 phút trước
  },
  {
    id: "INC-114",
    title: "Thay dầu bôi trơn cho robot hàn",
    priority: "Normal",
    status: "Đang xử lý",
    assignedTo: "Tổ Tự động hóa",
    location: "Line 1, Xưởng A",
    createdAt: new Date(Date.now() - 20 * 3600000), // 20 giờ trước
  },

  // --- Cột "Tạm dừng" ---
  {
    id: "INC-115",
    title: "Thay thế bo mạch điều khiển robot gắp hàng",
    priority: "High",
    status: "Tạm dừng", // Tạm dừng do chờ chuyên gia hãng
    assignedTo: "Tổ Tự động hóa",
    location: "Line 2, Xưởng B",
    createdAt: new Date(Date.now() - 30 * 3600000), // 30 giờ trước
  },
  {
    id: "INC-116",
    title: "Nâng cấp firmware cho hệ thống an ninh",
    priority: "Normal",
    status: "Tạm dừng", // Tạm dừng chờ phê duyệt
    assignedTo: "Đội An toàn",
    location: "Phòng Server",
    createdAt: new Date(Date.now() - 72 * 3600000), // 3 ngày trước
  },

  // --- Cột "Hoàn thành" ---
  {
    id: "INC-117",
    title: "Sửa chữa van khí nén bị kẹt",
    priority: "High",
    status: "Hoàn thành",
    assignedTo: "Tổ Cơ khí",
    location: "Máy ép B2",
    createdAt: new Date(Date.now() - 55 * 3600000), // ~2 ngày trước
  },
  {
    id: "INC-118",
    title: "Vệ sinh công nghiệp khu vực lò hơi",
    priority: "Normal",
    status: "Hoàn thành",
    assignedTo: "Đội Vệ sinh",
    location: "Xưởng A",
    createdAt: new Date(Date.now() - 96 * 3600000), // 4 ngày trước
  },

  // --- Cột "Đã đóng" ---
  {
    id: "INC-119",
    title: "Đào tạo an toàn vận hành máy phay",
    priority: "Normal",
    status: "Đã đóng",
    assignedTo: "Đội An toàn",
    location: "Phòng họp",
    createdAt: new Date(Date.now() - 150 * 3600000), // ~6 ngày trước
  },
  {
    id: "INC-120",
    title: "Khắc phục lỗi mất mạng nội bộ",
    priority: "High",
    status: "Đã đóng",
    assignedTo: "Tổ IT",
    location: "Toàn nhà máy",
    createdAt: new Date(Date.now() - 168 * 3600000), // 1 tuần trước
  },
  {
    id: "INC-121",
    title: "Gãy trục máy khuấy sơn",
    priority: "Critical",
    status: "Đã đóng",
    assignedTo: "Tổ Cơ khí",
    location: "Xưởng C",
    createdAt: new Date(Date.now() - 200 * 3600000), // ~8 ngày trước
  },
];
