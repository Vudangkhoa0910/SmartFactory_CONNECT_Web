/* =======================================================
   dummyData.ts
   - Dữ liệu mẫu cho Hòm thư Hồng / Public Ideas
======================================================= */

import { PublicIdea } from "./types";

export const IDEAS_DATA: PublicIdea[] = [
  {
    id: "KAIZEN-001",
    senderId: "NV-1032",
    senderName: "Phan Văn Nam",
    group: "Tổ Hàn",
    line: "Line 04",
    title: "Cải tiến khu vực cấp phôi",
    content:
      "Đề xuất thay đổi vị trí để giảm thao tác thừa, giúp tăng năng suất.",
    timestamp: new Date(),
    status: "Mới",
    history: [],
    chat: [],
  },
  {
    id: "KAIZEN-002",
    senderId: "NV-1102",
    senderName: "Nguyễn Thị B",
    group: "Tổ Đột Dập",
    line: "Line 02",
    title: "Góp ý về việc bố trí dụng cụ",
    content:
      "Kệ dụng cụ hiện tại quá cao, gây bất tiện khi thao tác nhiều lần.",
    timestamp: new Date(Date.now() - 3600000),
    status: "Đang xem xét",
    history: [{ time: new Date(), by: "Supervisor A", action: "Tiếp nhận" }],
    chat: [],
  },
  {
    id: "KAIZEN-003",
    senderId: "NV-1077",
    senderName: "Lê Thị C",
    group: "Tổ Sơn",
    line: "Line 01",
    title: "Cải tiến khu vực kiểm tra chất lượng",
    content:
      "Thêm khay đựng mẫu để giảm thời gian di chuyển và tăng hiệu quả kiểm tra.",
    timestamp: new Date(Date.now() - 7200000),
    status: "Mới",
    history: [],
    chat: [],
  },
];
