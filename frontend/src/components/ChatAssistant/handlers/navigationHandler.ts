/**
 * Navigation Command Handler
 */
import { CommandHandlerParams } from '../command.types';
import { navMap } from '../navigationMap';

export function handleNavigationCommands(params: CommandHandlerParams): boolean {
  const { lowerInput, setMessages, navigate } = params;
  
  // Room booking specific navigation
  if (lowerInput === 'lịch đặt phòng' || lowerInput === 'đến lịch đặt phòng') {
    navigate('/room-booking');
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: 'Đã chuyển đến trang Đặt phòng họp' 
    }]);
    return true;
  }

  if (lowerInput === 'lịch của tôi' || lowerInput === 'đến lịch của tôi' || lowerInput === 'lịch cá nhân') {
    navigate('/my-bookings');
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: 'Đã chuyển đến trang Lịch của tôi' 
    }]);
    return true;
  }

  if (lowerInput === 'duyệt đặt phòng' || lowerInput === 'đến duyệt đặt phòng' || lowerInput === 'duyệt phòng') {
    navigate('/admin/booking-approval');
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: 'Đã chuyển đến trang Duyệt đặt phòng' 
    }]);
    return true;
  }
  
  // General navigation from navMap
  const sortedKeys = Object.keys(navMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerInput.includes(key)) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: `🚀 Đang chuyển bạn đến **${key}**...` }]);
        navigate(navMap[key]);
      }, 500);
      return true;
    }
  }
  
  return false;
}
