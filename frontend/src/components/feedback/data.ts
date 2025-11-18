// src/pages/SensitiveInbox/data.ts

// 1. TYPES
export type MessageStatus = "Mới" | "Đang xem xét" | "Đã xử lý";
export type HistoryAction = "CREATED" | "FORWARDED" | "REPLIED";

export interface HistoryEntry {
  action: HistoryAction;
  timestamp: Date;
  details: string;
  actor: string;
}

export interface Reply {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

export interface SensitiveMessage {
  id: string;
  isAnonymous: boolean;
  senderName?: string;
  senderId?: string;
  title: string;
  fullContent: string;
  imageUrl?: string;
  timestamp: Date;
  status: MessageStatus;
  history: HistoryEntry[];
  replies: Reply[];
}

// 2. CONSTANTS
export const DEPARTMENTS_TO_FORWARD = [
  "Phòng Nhân sự (HR)",
  "Quản lý Nhà máy",
  "Ban Giám đốc",
  "Công đoàn",
  "Phòng An toàn Lao động",
];
export const CURRENT_USER = "Admin"; // Giả định người dùng hiện tại

// 3. MOCK DATA
export const SENSITIVE_MESSAGES_DATA: SensitiveMessage[] = [
  {
    id: "MSG-SEC-01",
    isAnonymous: true,
    title: "Vấn đề an toàn thực phẩm ở canteen",
    fullContent:
      "Gửi ban quản lý, tôi nhận thấy gần đây chất lượng thực phẩm ở canteen đi xuống rõ rệt. Cụ thể là món canh thường bị nguội và rau có vẻ không được tươi. Mong ban quản lý xem xét và cải thiện để đảm bảo sức khỏe cho nhân viên.",
    imageUrl:
      "https://storage.googleapis.com/gemini-prod/images/4d2a33f4-00d3-4652-901d-616335f458cf.png",
    timestamp: new Date(Date.now() - 3600000), // 1 giờ trước
    status: "Mới",
    history: [
      {
        action: "CREATED",
        timestamp: new Date(Date.now() - 3600000),
        details: "Góp ý đã được tạo.",
        actor: "Ẩn danh",
      },
    ],
    replies: [],
  },
  {
    id: "MSG-SEC-02",
    isAnonymous: false,
    senderName: "Trần Văn Long",
    senderId: "NV-1024",
    title: "Góp ý về chính sách nghỉ phép năm",
    fullContent:
      "Tôi đề xuất công ty có thể cho phép nhân viên gối một phần ngày nghỉ phép chưa sử dụng của năm nay sang quý 1 của năm sau. Điều này sẽ giúp nhân viên linh hoạt hơn trong việc sắp xếp kế hoạch cá nhân và giảm tải công việc cuối năm.",
    imageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop",
    timestamp: new Date(Date.now() - 8 * 3600000), // 8 giờ trước
    status: "Đang xem xét",
    history: [
      {
        action: "CREATED",
        timestamp: new Date(Date.now() - 8 * 3600000),
        details: "Góp ý đã được tạo.",
        actor: "Trần Văn Long",
      },
      {
        action: "FORWARDED",
        timestamp: new Date(Date.now() - 7 * 3600000),
        details: "Chuyển tiếp đến Phòng Nhân sự (HR)",
        actor: "Admin",
      },
    ],
    replies: [],
  },
  {
    id: "MSG-SEC-03",
    isAnonymous: false,
    senderName: "Nguyễn Thị Hoa",
    senderId: "NV-2051",
    title: "Đề xuất tổ chức hoạt động team building",
    fullContent:
      "Chào phòng Nhân sự, em nghĩ công ty mình nên có một buổi team building ngoài trời trong quý tới để tăng cường sự gắn kết giữa các phòng ban sau thời gian dài làm việc căng thẳng.",
    imageUrl:
      "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
    timestamp: new Date(Date.now() - 48 * 3600000), // 2 ngày trước
    status: "Đã xử lý",
    history: [
      {
        action: "CREATED",
        timestamp: new Date(Date.now() - 48 * 3600000),
        details: "Góp ý đã được tạo.",
        actor: "Nguyễn Thị Hoa",
      },
      {
        action: "FORWARDED",
        timestamp: new Date(Date.now() - 47 * 3600000),
        details: "Chuyển tiếp đến Phòng Nhân sự (HR)",
        actor: "Admin",
      },
      {
        action: "REPLIED",
        timestamp: new Date(Date.now() - 24 * 3600000),
        details: "Đã phản hồi góp ý.",
        actor: "Admin",
      },
    ],
    replies: [
      {
        id: "REP-01",
        author: "Admin",
        content:
          "Chào Hoa, cảm ơn góp ý rất hay của bạn. Phòng Nhân sự sẽ ghi nhận và đưa vào kế hoạch cho quý tới. Chúng tôi sẽ thông báo chi tiết khi có lịch trình cụ thể.",
        timestamp: new Date(Date.now() - 24 * 3600000),
      },
    ],
  },
  {
    id: "MSG-SEC-04",
    isAnonymous: true,
    title: "Thiếu trang bị bảo hộ lao động ở xưởng B",
    fullContent:
      "Khu vực máy dập ở xưởng B đang thiếu găng tay chống cắt. Nhiều công nhân mới phải dùng găng tay vải thông thường, rất nguy hiểm. Đề nghị công ty trang bị gấp để đảm bảo an toàn.",
    timestamp: new Date(Date.now() - 72 * 3600000), // 3 ngày trước
    status: "Đang xem xét",
    history: [
      {
        action: "CREATED",
        timestamp: new Date(Date.now() - 72 * 3600000),
        details: "Góp ý đã được tạo.",
        actor: "Ẩn danh",
      },
      {
        action: "FORWARDED",
        timestamp: new Date(Date.now() - 71 * 3600000),
        details: "Chuyển tiếp đến Phòng An toàn Lao động",
        actor: "Admin",
      },
    ],
    replies: [],
  },
  {
    id: "MSG-SEC-05",
    isAnonymous: false,
    senderName: "Lê Minh Tuấn",
    senderId: "NV-3011",
    title: "Hệ thống điều hòa văn phòng hoạt động kém",
    fullContent:
      "Điều hòa ở khu vực làm việc của phòng Marketing (tầng 2) mấy hôm nay không đủ mát, ảnh hưởng đến hiệu suất làm việc của mọi người. Mong Quản lý Nhà máy cho người kiểm tra sớm.",
    timestamp: new Date(Date.now() - 120 * 3600000), // 5 ngày trước
    status: "Đã xử lý",
    history: [
      {
        action: "CREATED",
        timestamp: new Date(Date.now() - 120 * 3600000),
        details: "Góp ý đã được tạo.",
        actor: "Lê Minh Tuấn",
      },
      {
        action: "FORWARDED",
        timestamp: new Date(Date.now() - 119 * 3600000),
        details: "Chuyển tiếp đến Quản lý Nhà máy",
        actor: "Admin",
      },
      {
        action: "REPLIED",
        timestamp: new Date(Date.now() - 96 * 3600000),
        details: "Đã phản hồi góp ý.",
        actor: "Admin",
      },
    ],
    replies: [
      {
        id: "REP-02",
        author: "Admin",
        content:
          "Chào Tuấn, Quản lý Nhà máy đã tiếp nhận và sẽ cử đội kỹ thuật đến kiểm tra, bảo trì hệ thống điều hòa trong hôm nay. Cảm ơn bạn đã phản ánh.",
        timestamp: new Date(Date.now() - 96 * 3600000),
      },
    ],
  },
];
