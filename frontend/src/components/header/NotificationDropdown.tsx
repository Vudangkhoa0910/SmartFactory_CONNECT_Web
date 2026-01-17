import { useState, useEffect, useCallback } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { AlertTriangle, Wrench, Shield, Factory, CheckCircle, Users, Settings } from "lucide-react";
import { 
  getRecentNotifications,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  formatNotificationTime,
  getTypeLabel,
  getPriorityColor,
  Notification
} from "../../services/notification.service";

// Type labels for display
const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  incident: 'Sự cố',
  idea: 'Ý tưởng',
  safety: 'An toàn',
  maintenance: 'Bảo trì',
  production: 'Sản xuất',
  quality: 'Chất lượng',
  system: 'Hệ thống',
  booking: 'Đặt phòng',
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRecentNotifications(10);
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status === 'unread').length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
  };

  // Đánh dấu thông báo là đã đọc
  const markAsRead = async (notificationId: string) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: 'read' as const }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Lấy màu badge theo priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Lấy màu badge theo loại
  const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      incident: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
      maintenance: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
      safety: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400',
      production: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
      quality: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
      hr: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400',
      system: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[type] || colors.system;
  };
  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {unreadCount > 0 && (
          <>
            <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
              <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
            </span>
            <span className="absolute -top-1 -right-1 z-20 flex items-center justify-center h-5 min-w-5 px-1 text-xs font-semibold text-white bg-red-500 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="!right-0 w-[90vw] sm:w-[380px] md:w-[400px] max-w-[400px] flex flex-col h-[520px] max-h-[80vh]"
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-start justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <div className="flex-1 min-w-0">
              <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Thông báo
              </h5>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bạn có {unreadCount} thông báo chưa đọc
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition whitespace-nowrap"
                >
                  Đánh dấu đã đọc
                </button>
              )}
              <button
                onClick={toggleDropdown}
                className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            <ul className="flex flex-col space-y-1">
              {notifications.length === 0 ? (
                <li className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="w-16 h-16 mb-3 text-gray-300 dark:text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Không có thông báo mới
                  </p>
                </li>
              ) : (
                notifications.map((notif) => (
                  <li key={notif.id}>
                    <button
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.actionUrl) {
                          window.location.href = notif.actionUrl;
                        }
                        closeDropdown();
                      }}
                      className={`w-full flex gap-3 rounded-lg p-3 text-left transition-colors ${
                        notif.status === 'unread' 
                          ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getPriorityColor(notif.priority)}`}>
                          <span className="text-base">
                            {notif.type === 'incident' && <AlertTriangle className="w-5 h-5" />}
                            {notif.type === 'maintenance' && <Wrench className="w-5 h-5" />}
                            {notif.type === 'safety' && <Shield className="w-5 h-5" />}
                            {notif.type === 'production' && <Factory className="w-5 h-5" />}
                            {notif.type === 'quality' && <CheckCircle className="w-5 h-5" />}
                            {notif.type === 'hr' && <Users className="w-5 h-5" />}
                            {notif.type === 'system' && <Settings className="w-5 h-5" />}
                          </span>
                        </div>
                        {notif.status === 'unread' && (
                          <span className="absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-blue-500 dark:border-gray-900"></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h6 className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1 flex-1">
                            {notif.title}
                          </h6>
                          <span className={`flex-shrink-0 px-2 py-0.5 text-[10px] font-medium rounded ${getTypeColor(notif.type)}`}>
                            {NOTIFICATION_TYPE_LABELS[notif.type]}
                          </span>
                        </div>
                        
                        <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-gray-500 dark:text-gray-500">
                          {notif.sender && (
                            <>
                              <span className="font-medium">{notif.sender.name}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            </>
                          )}
                          {notif.department && (
                            <>
                              <span>{notif.department}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            </>
                          )}
                          <span>{formatNotificationTime(notif.timestamp)}</span>
                        </div>

                        {notif.location && (
                          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-500 dark:text-gray-500">
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-1">{notif.location}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
            <Link
              to="/notifications"
              onClick={closeDropdown}
              className="block px-4 py-2.5 text-sm font-medium text-center text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      </Dropdown>
    </div>
  );
}
