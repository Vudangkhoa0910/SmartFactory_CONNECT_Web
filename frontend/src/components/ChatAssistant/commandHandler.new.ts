/**
 * Command Handler - Modularized
 * Main entry point for all chat commands
 */
import { NavigateFunction } from 'react-router';
import { toast } from 'react-toastify';
import { UIMessage, Notification } from './types';
import { handleRoomBooking } from './roomBookingHandler';
import { handleHelpCommand } from './handlers/helpHandler';
import { handleNotificationCommands } from './handlers/notificationHandler';
import { handleIncidentSearch, handleIdeaSearch } from './handlers/searchHandler';
import { handleNewsCreation } from './handlers/newsHandler';
import { handleNavigationCommands } from './handlers/navigationHandler';
import { CommandHandlerParams } from './command.types';

// Re-export types for convenience
export type { CommandHandlerParams } from './command.types';

// Get current user info
function getCurrentUser(): { isAdmin: boolean; user: any } {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';
  return { isAdmin, user: currentUser };
}

// Main command handler - delegates to specialized handlers
export async function handleCommand(params: CommandHandlerParams): Promise<boolean> {
  const { input, lowerInput, pendingAction, setMessages, setPendingAction, navigate, cachedNotifications } = params;
  const { isAdmin } = getCurrentUser();
  
  // Handle pending actions first
  if (pendingAction === 'DELETE_ALL_INCIDENTS') {
    if (lowerInput.includes('đồng ý')) {
      setMessages(prev => [...prev, { role: 'model', text: '✅ Đã xoá toàn bộ danh sách sự cố thành công.' }]);
      toast.success('Đã xoá dữ liệu sự cố');
    } else {
      setMessages(prev => [...prev, { role: 'model', text: 'Đã huỷ thao tác xoá.' }]);
    }
    setPendingAction(null);
    return true;
  }
  
  // 1. Room booking navigation (before booking handler)
  if (handleNavigationCommands(params)) return true;
  
  // 2. Room booking creation
  if (lowerInput.includes('đặt phòng') || lowerInput.includes('book') || lowerInput.includes('đặt lịch')) {
    return await handleRoomBooking(input, lowerInput, setMessages);
  }
  
  // 3. Help command
  if (handleHelpCommand(params, isAdmin)) return true;
  
  // 4. Idea search (before navigation to avoid conflicts)
  if (await handleIdeaSearch(params, isAdmin)) return true;
  
  // 5. Notification commands
  if (await handleNotificationCommands(params)) return true;
  
  // 6. Incident search
  if (await handleIncidentSearch(params, isAdmin)) return true;
  
  // 7. News creation
  if (await handleNewsCreation(params)) return true;
  
  // No command matched - return false to let Gemini handle it
  return false;
}
