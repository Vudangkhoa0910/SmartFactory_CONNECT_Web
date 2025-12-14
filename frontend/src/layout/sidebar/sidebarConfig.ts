// layout/sidebar/sidebarConfig.ts - Sidebar navigation configuration with i18n
import {
  BoxCubeIcon,
  CalenderIcon,
  GridIcon,
  ListIcon,
  PlugInIcon,
  TableIcon,
  TaskIcon,
  BoxIcon,
  FolderIcon,
} from "../../icons";

// Translation keys for sidebar items
export const SIDEBAR_I18N = {
  // Main menu
  dashboard: 'menu.dashboard',
  overview: 'menu.overview',
  incidents: 'menu.incidents',
  ideas: 'menu.ideas',
  news: 'menu.news',
  calendar: 'menu.calendar',
  booking: 'menu.booking',
  bookRoom: 'menu.booking',
  myBookings: 'menu.my_bookings',
  approveBooking: 'menu.admin_approval',
  
  // Error report section
  incidentList: 'menu.all_incidents',
  incidentQueue: 'menu.incident_queue',
  
  // Feedback section
  whiteBox: 'menu.public_ideas',
  pinkBox: 'menu.admin_inbox',
  kaizenBank: 'menu.kaizen_bank',
  
  // Management section
  management: 'user.title',
  users: 'menu.user_list',
  departments: 'menu.departments',
};

export type NavItem = {
  nameKey: string; // i18n key
  name?: string; // Fallback name
  icon: React.ReactNode;
  path?: string;
  badgeKey?: string;
  subItems?: {
    nameKey: string; // i18n key
    name?: string; // Fallback name
    path: string;
    pro?: boolean;
    new?: boolean;
    badgeKey?: string;
  }[];
  requiredPermission?: string;
};

export const navItems: NavItem[] = [
  {
    icon: GridIcon,
    nameKey: 'menu.dashboard',
    name: 'Dashboard',
    subItems: [
      { nameKey: 'menu.overview', name: 'Tổng quan', path: '/', pro: false },
      { nameKey: 'menu.incidents', name: 'Báo cáo sự cố', path: '/incident-report-page', pro: false },
      { nameKey: 'menu.ideas', name: 'Góp ý', path: '/feadback-dashboard', pro: false },
    ],
  },
  {
    icon: TaskIcon,
    nameKey: 'menu.news',
    name: 'Tin tức',
    path: '/news',
  },
  {
    icon: CalenderIcon,
    nameKey: 'menu.calendar',
    name: 'Lịch',
    path: '/calendar',
  },
  {
    icon: CalenderIcon,
    nameKey: 'menu.booking',
    name: 'Đặt phòng họp',
    subItems: [
      { nameKey: 'booking.create', name: 'Đặt phòng', path: '/room-booking', pro: false },
      { nameKey: 'menu.my_bookings', name: 'Lịch của tôi', path: '/my-bookings', pro: false },
      { nameKey: 'menu.admin_approval', name: 'Duyệt đặt phòng', path: '/admin/booking-approval', pro: false, new: true },
    ],
  },
];

export const othersItems1: NavItem[] = [
  {
    nameKey: 'menu.all_incidents',
    name: 'Danh sách sự cố',
    icon: ListIcon,
    path: '/all-incidents-page',
    badgeKey: 'pendingIncidents',
  },
  {
    nameKey: 'menu.incident_queue',
    name: 'Hàng đợi',
    icon: TableIcon,
    path: '/incident-queue',
    badgeKey: 'pendingIncidents',
  },
];

export const othersItems2: NavItem[] = [
  {
    icon: BoxIcon,
    nameKey: 'menu.public_ideas',
    name: 'Hòm trắng',
    path: '/public-ideas-page',
    badgeKey: 'pendingIdeas',
  },
  {
    icon: BoxCubeIcon,
    nameKey: 'menu.admin_inbox',
    name: 'Hòm hồng',
    path: '/admin-inbox-pink',
    requiredPermission: 'pink_box',
    badgeKey: 'pendingIdeas',
  },
  {
    icon: FolderIcon,
    nameKey: 'menu.kaizen_bank',
    name: 'Lưu trữ',
    path: '/kaizen-bank-page',
  },
  {
    icon: PlugInIcon,
    nameKey: 'user.title',
    name: 'Quản lý',
    requiredPermission: 'manage_users',
    subItems: [
      { nameKey: 'menu.user_list', name: 'Người dùng', path: '/users', pro: false },
      { nameKey: 'menu.departments', name: 'Phòng ban', path: '/departments', pro: false },
    ],
  },
];

// Badge counts interface
export interface BadgeCounts {
  pendingIncidents: number;
  pendingIdeas: number;
  pendingBookings: number;
  unreadNews: number;
}
