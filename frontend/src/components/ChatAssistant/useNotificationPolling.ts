import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { UIMessage, Notification } from './types';

export const useNotificationPolling = (
  isOpen: boolean,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
) => {
  const [lastCheckedNotificationId, setLastCheckedNotificationId] = useState<string | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [cachedNotifications, setCachedNotifications] = useState<Notification[]>([]);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await api.get('/notifications?limit=10&unread=true');
        const unreadNotifications: Notification[] = Array.isArray(response.data) ? response.data : (response.data.data || []);

        console.log('Polling Unread Notifications:', unreadNotifications);

        setCachedNotifications(unreadNotifications);
        setHasUnreadNotifications(unreadNotifications.length > 0);

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          // Hiển thị thông báo trong tháng qua ở lần tải đầu (chỉ unread)
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          
          const recentNotifications = unreadNotifications.filter(n => {
             const created = n.created_at ? new Date(n.created_at) : new Date();
             return created > oneMonthAgo;
          });

          if (recentNotifications.length > 0) {
            setMessages(prev => [...prev, {
              role: 'model',
              text: `Thông báo chưa đọc trong tháng qua (${recentNotifications.length})`,
              notificationCards: recentNotifications,
            }]);
          }

          if (unreadNotifications.length > 0) {
            setLastCheckedNotificationId(unreadNotifications[0].id);
          }
        } else if (unreadNotifications.length > 0) {
          const latest = unreadNotifications[0];
          
          if (lastCheckedNotificationId && latest.id !== lastCheckedNotificationId) {
            const newNotificationMessage: UIMessage = {
              role: 'model',
              text: `Thông báo mới:${latest.title}`,
              actions: [{
                label: 'Xem chi tiết',
                onClick: () => setMessages(prev => [...prev, { role: 'model', text: `Chi tiết thông báo:\n\n${latest.title}**\n${latest.message || latest.content || ''}` }]),
              }],
            };
            setMessages(prev => [...prev, newNotificationMessage]);

            if (!isOpen) {
              toast.info(`Thông báo mới: ${latest.title}`);
            }
          }
          setLastCheckedNotificationId(latest.id);
        }
      } catch (error) {
        console.error("Failed to poll notifications:", error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [lastCheckedNotificationId, isOpen, setMessages]);

  return { hasUnreadNotifications, cachedNotifications, setHasUnreadNotifications };
};