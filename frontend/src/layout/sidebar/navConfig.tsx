/**
 * AppSidebar - Navigation Configuration
 */
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
} from '../../icons';

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badgeKey?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; badgeKey?: string }[];
  requiredPermission?: string;
};

export interface BadgeCounts {
  pendingIncidents: number;
  pendingIdeas: number;
  pendingBookings: number;
  unreadNews: number;
}

export const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    subItems: [
      { name: 'Tổng quan', path: '/', pro: false },
      { name: 'Báo cáo sự cố', path: '/incident-report-page', pro: false },
      { name: 'Góp ý', path: '/feadback-dashboard', pro: false },
    ],
  },
  {
    icon: <TaskIcon />,
    name: 'Tin tức',
    path: '/news',
  },
  {
    icon: <CalenderIcon />,
    name: 'Lịch',
    path: '/calendar',
  },
  {
    icon: <CalenderIcon />,
    name: 'Đặt phòng họp',
    subItems: [
      { name: 'Đặt phòng', path: '/room-booking', pro: false },
      { name: 'Lịch của tôi', path: '/my-bookings', pro: false },
      { name: 'Duyệt đặt phòng', path: '/admin/booking-approval', pro: false, new: true },
    ],
  },
];

export const othersItems1: NavItem[] = [
  {
    name: 'Danh sách sự cố',
    icon: <ListIcon />,
    path: '/all-incidents-page',
    badgeKey: 'pendingIncidents',
  },
  {
    name: 'Hàng đợi',
    icon: <TableIcon />,
    path: '/incident-queue',
    badgeKey: 'pendingIncidents',
  },
];

export const othersItems2: NavItem[] = [
  {
    icon: <BoxIcon />,
    name: 'Hòm trắng',
    path: '/public-ideas-page',
    badgeKey: 'pendingIdeas',
  },
  {
    icon: <BoxCubeIcon />,
    name: 'Hòm hồng',
    path: '/admin-inbox-pink',
    requiredPermission: 'pink_box',
    badgeKey: 'pendingIdeas',
  },
  {
    icon: <FolderIcon />,
    name: 'Lưu trữ',
    path: '/kaizen-bank-page',
  },
  {
    icon: <PlugInIcon />,
    name: 'Quản lý',
    requiredPermission: 'manage_users',
    subItems: [
      { name: 'Người dùng', path: '/users', pro: false },
      { name: 'Phòng ban', path: '/departments', pro: false },
    ],
  },
];
