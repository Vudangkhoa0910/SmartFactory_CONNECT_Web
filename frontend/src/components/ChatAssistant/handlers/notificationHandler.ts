/**
 * Notification Command Handlers
 */
import api from '../../../services/api';
import { CommandHandlerParams } from '../command.types';
import { Notification } from '../types';

export async function handleNotificationCommands(params: CommandHandlerParams): Promise<boolean> {
  const { lowerInput, setMessages, cachedNotifications } = params;
  
  // 1. Mark ALL as read
  if (handleMarkAllRead(params)) return true;
  
  // 2. Mark SPECIFIC as read
  if (await handleMarkSpecificRead(params)) return true;
  
  // 3. View Specific Notification Detail
  if (handleViewNotificationDetail(params)) return true;
  
  // 4. View Notifications List
  if (await handleViewNotificationList(params)) return true;
  
  return false;
}

function handleMarkAllRead(params: CommandHandlerParams): boolean {
  const { lowerInput, setMessages } = params;
  
  if (!lowerInput.includes('đọc hết') && 
      !lowerInput.includes('đã xem hết') && 
      !lowerInput.includes('đánh dấu tất cả đã đọc') && 
      !lowerInput.includes('đã xem các thông báo')) {
    return false;
  }
  
  (async () => {
    try {
      await api.put('/notifications/read-all');
      setMessages(prev => [...prev, { role: 'model', text: '✅ Đã đánh dấu tất cả thông báo là đã đọc.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: '❌ Có lỗi khi cập nhật trạng thái thông báo.' }]);
    }
  })();
  
  return true;
}

async function handleMarkSpecificRead(params: CommandHandlerParams): Promise<boolean> {
  const { lowerInput, setMessages, cachedNotifications } = params;
  
  const markReadMatch = lowerInput.match(/(?:đã đọc|xem xong|đánh dấu|đã xem|ã xem|da xem|dã xem|đã xen|da xen|xen xong)\s*(?:thông báo|tin)?\s*(?:số|thứ)?\s*(\d+)/i);
  
  if (!markReadMatch) return false;
  
  const index = parseInt(markReadMatch[1]) - 1;
  
  if (cachedNotifications.length > 0 && index >= 0 && index < cachedNotifications.length) {
    const notification = cachedNotifications[index];
    try {
      await api.put(`/notifications/${notification.id}/read`);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `✅ Đã đánh dấu thông báo **"${notification.title}"** là đã đọc.` 
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: '❌ Có lỗi khi cập nhật trạng thái thông báo.' }]);
    }
  } else {
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: `❌ Không tìm thấy thông báo số ${index + 1} trong danh sách hiện tại. Vui lòng gõ "Xem thông báo" để cập nhật danh sách.` 
    }]);
  }
  
  return true;
}

function handleViewNotificationDetail(params: CommandHandlerParams): boolean {
  const { lowerInput, setMessages, cachedNotifications } = params;
  
  const viewDetailMatch = lowerInput.match(/(?:xem|chi tiết|về|nội dung)\s*(?:thông báo|tin)?\s*(?:số|thứ)?\s*(\d+)/i);
  
  if (!viewDetailMatch) return false;
  
  const index = parseInt(viewDetailMatch[1]) - 1;
  
  if (cachedNotifications.length > 0 && index >= 0 && index < cachedNotifications.length) {
    const n = cachedNotifications[index];
    setMessages(prev => [...prev, {
      role: 'model',
      text: `📄 **Chi tiết thông báo:**\n\n**${n.title}**\n${n.message || n.content || ''}`
    }]);
  } else {
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: `❌ Không tìm thấy thông báo số ${index + 1} trong danh sách hiện tại.` 
    }]);
  }
  
  return true;
}

async function handleViewNotificationList(params: CommandHandlerParams): Promise<boolean> {
  const { lowerInput, setMessages } = params;
  
  if (!lowerInput.includes('xem thông báo') && 
      !lowerInput.includes('kiểm tra thông báo') && 
      !(lowerInput.includes('thông báo') && lowerInput.includes('mới'))) {
    return false;
  }
  
  setMessages(prev => [...prev, { role: 'model', text: 'Đang tải danh sách thông báo chưa đọc...' }]);
  
  try {
    const response = await api.get('/notifications?limit=10&unread=true');
    const unread: Notification[] = Array.isArray(response.data) ? response.data : (response.data.data || []);
    
    if (unread.length === 0) {
      setMessages(prev => [...prev, { role: 'model', text: '🎉 Bạn không có thông báo mới nào.' }]);
    } else {
      const actions = unread.map((n) => ({
        label: `Xem: ${n.title.length > 15 ? n.title.substring(0, 15) + '...' : n.title}`,
        onClick: () => {
          setMessages(prev => [...prev, {
            role: 'model',
            text: `📄 **Chi tiết thông báo:**\n\n**${n.title}**\n${n.message || n.content || ''}`
          }]);
        }
      }));

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `📬 **Bạn có ${unread.length} thông báo mới:**\n\n${unread.map((n, i) => `${i+1}. ${n.title}`).join('\n')}\n\n💡 Gõ **"đã xem [số]"** để đánh dấu đã xem (ví dụ: "đã xem 1").\n(Hoặc chọn nút bên dưới để xem chi tiết)`,
        actions: actions
      }]);
    }
  } catch {
    setMessages(prev => [...prev, { role: 'model', text: '❌ Không thể tải thông báo lúc này.' }]);
  }
  
  return true;
}
