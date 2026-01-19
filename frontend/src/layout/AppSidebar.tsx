import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router";

import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  // PieChartIcon,
  PlugInIcon,
  TableIcon,
  TaskIcon,
  BoxIcon,
  FolderIcon,
  ChatIcon,
} from "../icons";
import { useSidebar } from "../contexts/SidebarContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { useSocket } from "../hooks/useSocket";
import dashboardService from "../services/dashboard.service";
// import SidebarWidget from "./SidebarWidget";


// Type với i18n key
type NavItem = {
  nameKey: string; // i18n key
  icon: React.ReactNode;
  path?: string;
  badgeKey?: string;
  subItems?: { nameKey: string; path: string; pro?: boolean; new?: boolean; badgeKey?: string }[];
  requiredPermission?: string;
};

// Badge counts interface
interface BadgeCounts {
  pendingIncidents: number;
  pendingIdeas: number;
  pendingWhiteIdeas: number;
  pendingPinkIdeas: number;
  pendingBookings: number;
  unreadNews: number;
}

// Navigation items with i18n keys
const navItemsConfig: NavItem[] = [

  {
    icon: <GridIcon />,
    nameKey: "menu.dashboard",
    path: "/",
  },
  {
    icon: <TaskIcon />,
    nameKey: "menu.news",
    path: "/news",
  },
  {
    icon: <ChatIcon />,
    nameKey: "menu.chat_assistant",
    path: "/chat-assistant",
  },
  // {
  //   icon: <CalenderIcon />,
  //   nameKey: "menu.calendar",
  //   path: "/calendar",
  // },
  {
    icon: <CalenderIcon />,
    nameKey: "menu.booking",
    subItems: [
      { nameKey: "menu.create_booking", path: "/room-booking", pro: false },
      { nameKey: "menu.my_bookings", path: "/my-bookings", pro: false },
      { nameKey: "menu.admin_approval", path: "/admin/booking-approval", pro: false, new: true },
    ],
  },
];

const othersItems1Config: NavItem[] = [
  {
    nameKey: "menu.incident_list",
    icon: <ListIcon />,
    path: "/all-incidents-page",
    badgeKey: "pendingIncidents",
  },
  {
    nameKey: "menu.queue",
    icon: <TableIcon />,
    path: "/incident-queue",
    badgeKey: "pendingIncidents",
  },
];

const othersItems2Config: NavItem[] = [
  {
    icon: <BoxIcon />,
    nameKey: "menu.public_ideas",
    path: "/public-ideas-page",
    badgeKey: "pendingWhiteIdeas",
  },
  {
    icon: <BoxCubeIcon />,
    nameKey: "menu.admin_inbox",
    path: "/admin-inbox-pink",
    requiredPermission: "pink_box",
    badgeKey: "pendingPinkIdeas",
  },
  {
    icon: <FolderIcon />,
    nameKey: "menu.kaizen_bank",
    path: "/kaizen-bank-page",
  },
  {
    icon: <PlugInIcon />,
    nameKey: "menu.management",
    requiredPermission: "manage_users",
    subItems: [
      { nameKey: "menu.user_list", path: "/users", pro: false },
      { nameKey: "menu.departments", path: "/departments", pro: false },
      { nameKey: "menu.email_management", path: "/settings/email", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { canManageUsers, canViewPinkBox } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Badge counts state
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({
    pendingIncidents: 0,
    pendingIdeas: 0,
    pendingWhiteIdeas: 0,
    pendingPinkIdeas: 0,
    pendingBookings: 0,
    unreadNews: 0,
  });

  const navItems = useMemo(() => navItemsConfig, []);
  const othersItems1 = useMemo(() => othersItems1Config, []);
  const othersItems2 = useMemo(() => othersItems2Config, []);

  // Notification animation state for idea box - track which type has new notification
  const [newIdeaType, setNewIdeaType] = useState<'white' | 'pink' | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for idea-related socket events
  useSocket({
    channels: ['ideas'],
    events: {
      idea_created: (data: { ideabox_type?: string }) => triggerNotificationAnimation(data?.ideabox_type),
      idea_updated: (data: { ideabox_type?: string }) => triggerNotificationAnimation(data?.ideabox_type),
    }
  });

  // Trigger animation for 5 seconds
  const triggerNotificationAnimation = useCallback((ideaboxType?: string) => {
    // Determine which type: 'pink' for pink box, 'white' for everything else
    const type = ideaboxType === 'pink' ? 'pink' : 'white';
    setNewIdeaType(type);
    // Also refresh badge counts
    fetchBadgeCountsRef.current?.();

    // Clear previous timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    // Auto-clear after 5 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNewIdeaType(null);
    }, 5000);
  }, []);

  // Clear animation when visiting idea pages
  useEffect(() => {
    // Clear white animation when visiting white box pages
    if (location.pathname.startsWith('/public-ideas-page')) {
      if (newIdeaType === 'white') setNewIdeaType(null);
    }
    // Clear pink animation when visiting pink box pages
    if (location.pathname.startsWith('/admin-inbox-pink')) {
      if (newIdeaType === 'pink') setNewIdeaType(null);
    }
    if (notificationTimeoutRef.current && newIdeaType === null) {
      clearTimeout(notificationTimeoutRef.current);
    }
  }, [location.pathname, newIdeaType]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // <<< THAY ĐỔI 1: Cập nhật kiểu (type) của state để chấp nhận các loại menu mới
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others1" | "others2";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Ref for fetchBadgeCounts to be called from triggerNotificationAnimation
  const fetchBadgeCountsRef = useRef<(() => void) | null>(null);

  // Fetch badge counts from API
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const summary = await dashboardService.getDashboardSummary();
        setBadgeCounts({
          pendingIncidents: summary.pending_incidents || 0,
          pendingIdeas: summary.pending_ideas || 0,
          pendingWhiteIdeas: summary.pending_white_ideas || 0,
          pendingPinkIdeas: summary.pending_pink_ideas || 0,
          pendingBookings: 0, // TODO: Add booking stats to API
          unreadNews: 0, // TODO: Add news stats to API
        });
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    };

    fetchBadgeCountsRef.current = fetchBadgeCounts;
    fetchBadgeCounts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchBadgeCounts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Get badge count for an item
  const getBadgeCount = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    return badgeCounts[badgeKey as keyof BadgeCounts] || 0;
  };

  // Check if item should have notification animation based on path
  const shouldAnimate = (path?: string): boolean => {
    if (!newIdeaType || !path) return false;
    // White box animation for public-ideas-page
    if (newIdeaType === 'white' && path === '/public-ideas-page') return true;
    // Pink box animation for admin-inbox-pink
    if (newIdeaType === 'pink' && path === '/admin-inbox-pink') return true;
    return false;
  };

  // <<< THAY ĐỔI 2: Cấu trúc lại useEffect để trở nên linh hoạt hơn
  useEffect(() => {
    let submenuMatched = false;

    // Tạo một đối tượng để ánh xạ tên loại menu với mảng dữ liệu tương ứng
    const menuMapping = {
      main: navItems,
      others1: othersItems1,
      others2: othersItems2,
    };

    // Lặp qua các key của đối tượng ánh xạ ('main', 'others1', 'others2')
    for (const menuType in menuMapping) {
      if (submenuMatched) break; // Thoát sớm nếu đã tìm thấy

      const items = menuMapping[menuType as keyof typeof menuMapping];
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others1" | "others2",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    }

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  // <<< THAY ĐỔI 3: Cập nhật kiểu của tham số menuType
  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "others1" | "others2"
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  // Filter menu items based on permissions
  const hasPermission = (item: NavItem): boolean => {
    if (!item.requiredPermission) return true;

    if (item.requiredPermission === "manage_users") {
      return canManageUsers();
    }

    if (item.requiredPermission === "pink_box") {
      return canViewPinkBox();
    }

    return true;
  };

  // <<< THAY ĐỔI 4: Cập nhật kiểu của tham số menuType (bạn đã làm đúng ở đây)
  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "others1" | "others2"
  ) => {
    // Filter items based on permissions
    const filteredItems = items.filter(hasPermission);

    return (
      <ul className="flex flex-col gap-4">
        {filteredItems.map((nav, index) => (
          <li key={nav.nameKey}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group ${openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  } cursor-pointer ${!isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                  }`}
              >
                <span
                  className={`menu-item-icon-size relative ${openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    } ${shouldAnimate(nav.path) ? "notification-animate" : ""}`}
                >
                  {nav.icon}
                  {/* Badge for collapsed state */}
                  {!isExpanded && !isHovered && !isMobileOpen && getBadgeCount(nav.badgeKey) > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ${shouldAnimate(nav.path) ? "notification-badge-pulse" : ""}`}>
                      {getBadgeCount(nav.badgeKey) > 9 ? '9+' : getBadgeCount(nav.badgeKey)}
                    </span>
                  )}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{t(nav.nameKey)}</span>
                )}
                {/* Badge for expanded state */}
                {(isExpanded || isHovered || isMobileOpen) && getBadgeCount(nav.badgeKey) > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full ${shouldAnimate(nav.path) ? "animate-pulse" : ""}`}>
                    {getBadgeCount(nav.badgeKey) > 99 ? '99+' : getBadgeCount(nav.badgeKey)}
                  </span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  to={nav.path}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`menu-item-icon-size relative ${isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      } ${shouldAnimate(nav.path) ? "notification-animate" : ""}`}
                  >
                    {nav.icon}
                    {/* Badge for collapsed state */}
                    {!isExpanded && !isHovered && !isMobileOpen && getBadgeCount(nav.badgeKey) > 0 && (
                      <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ${shouldAnimate(nav.path) ? "notification-badge-pulse" : ""}`}>
                        {getBadgeCount(nav.badgeKey) > 9 ? '9+' : getBadgeCount(nav.badgeKey)}
                      </span>
                    )}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{t(nav.nameKey)}</span>
                  )}
                  {/* Badge for expanded state */}
                  {(isExpanded || isHovered || isMobileOpen) && getBadgeCount(nav.badgeKey) > 0 && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {getBadgeCount(nav.badgeKey) > 99 ? '99+' : getBadgeCount(nav.badgeKey)}
                    </span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? `${subMenuHeight[`${menuType}-${index}`]}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.nameKey}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {t(subItem.nameKey)}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <aside
      // ... (phần JSX của aside không đổi)
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ... (phần logo không đổi) ... */}
      <div
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/" className="flex justify-center w-full">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              src="/images/logo/denso.svg"
              alt="DENSO Logo"
              className="h-10 w-auto"
            />
          ) : (
            <img
              src="/images/logo/denso.svg"
              alt="DENSO Logo"
              className="h-8 w-auto"
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* --- Phần Menu --- */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t('sidebart.menu')
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            {/* --- Phần Notifications (dùng othersItems1) --- */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t('sidebart.error_report')
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(othersItems1, "others1")}
            </div>
            {/* --- Phần Others (dùng othersItems2) --- */}
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  t('sidebart.feedback')
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems2, "others2")}
            </div>
          </div>
        </nav>
        {/* {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null} */}
      </div>
    </aside>
  );
};

export default AppSidebar;
