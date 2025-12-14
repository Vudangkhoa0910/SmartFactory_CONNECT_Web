/**
 * Help Command Handler
 */
import { CommandHandlerParams } from './command.types';

export function handleHelpCommand(
  params: CommandHandlerParams,
  isAdmin: boolean
): boolean {
  const { lowerInput, setMessages, pendingAction, cachedNotifications, setPendingAction, navigate } = params;
  
  if (!lowerInput.includes('hướng dẫn') && 
      !lowerInput.includes('trợ giúp') && 
      !lowerInput.includes('help') && 
      lowerInput !== 'h' && 
      lowerInput !== '?' && 
      !lowerInput.includes('từ khóa') && 
      !lowerInput.includes('lệnh')) {
    return false;
  }

  let helpMessage = buildHelpMessage(isAdmin);
  const actions = buildHelpActions(params, isAdmin, pendingAction, cachedNotifications, setPendingAction, navigate);
  
  setMessages(prev => [...prev, { role: 'model', text: helpMessage, actions }]);
  return true;
}

function buildHelpMessage(isAdmin: boolean): string {
  let helpMessage = `📖 **HƯỚNG DẪN SỬ DỤNG CHATBOT**\n\n💡 Gõ các từ khóa sau để sử dụng:\n\n**📅 ĐẶT PHÒNG HỌP NHANH:**\n• "Đặt phòng [số người] tổ chức [mục đích] từ [giờ] đến [giờ] ngày [ngày] tháng [tháng]"\n• VD: "Đặt phòng 10 người tổ chức sinh nhật từ 9 giờ đến 10 giờ ngày 28 tháng 11"\n• "xem lịch phòng" - Xem tất cả phòng và lịch đặt\n\n**📅 QUẢN LÝ LỊCH ĐẶT PHÒNG:**\n• "lịch đặt phòng" - Di chuyển đến trang đặt phòng\n• "lịch của tôi" - Di chuyển đến trang lịch của tôi\n• "duyệt đặt phòng" - Di chuyển đến trang duyệt đặt phòng\n\n**🔔 QUẢN LÝ THÔNG BÁO:**\n• "xem thông báo" - Xem danh sách thông báo chưa đọc\n• "xem thông báo [số]" - Xem chi tiết thông báo\n• "đã xem [số]" - Đánh dấu đã đọc 1 thông báo\n• "đã xem hết" - Đánh dấu tất cả đã đọc`;
  
  if (isAdmin) {
    helpMessage += `\n\n**🔍 TÌM KIẾM SỰ CỐ (ADMIN):**\n• "tìm sự cố" - Hiển thị tất cả sự cố\n• "tìm sự cố [từ khóa]" - Tìm theo tiêu đề/mô tả\n• "tìm sự cố tháng [số]" - Tìm theo tháng\n• "tìm sự cố năm [số]" - Tìm theo năm\n• "tìm sự cố ngày [DD/MM/YYYY]" - Tìm theo ngày\n• "tìm sự cố [từ khóa] tháng 11 năm 2025"\n\n**🎯 LỌC THEO TRẠNG THÁI:**\n• Thêm: "đang xử lý", "chờ xử lý", "đã giải quyết", "đã đóng"\n\n**⚡ LỌC THEO ƯU TIÊN:**\n• Thêm: "khẩn cấp", "cao", "trung bình", "thấp"\n\n**💡 TÌM KIẾM Ý TƯỞNG (ADMIN):**\n• "tìm ý tưởng" - Tìm tất cả ý tưởng\n• "tìm ý tưởng [từ khóa]" - Tìm theo tiêu đề/mô tả\n• "tìm hòm trắng [từ khóa]" - Tìm ý tưởng hòm trắng\n• "tìm hòm hồng [từ khóa]" - Tìm ý tưởng hòm hồng\n• "tìm ý tưởng tháng [số]" - Tìm theo tháng\n• "tìm hòm trắng cải tiến quy trình tháng 9"\n\n**🏷️ LỌC TRẠNG THÁI Ý TƯỞNG:**\n• Thêm: "chờ xử lý", "đang xem xét", "đã phê duyệt", "từ chối", "đã triển khai"\n\n**📰 TẠO TIN TỨC (ADMIN):**\n• "tạo tin [chủ đề]" - Tạo tin tức mới bằng AI`;
  }
  
  helpMessage += `\n\n**🧭 ĐIỀU HƯỚNG:**\n• "dashboard" - Trang tổng quan\n• "sự cố" / "incidents" - Quản lý sự cố\n• "ý tưởng" / "ideas" - Quản lý ý tưởng\n• "tin tức" / "news" - Quản lý tin tức\n• "người dùng" / "users" - Quản lý người dùng\n• "phòng ban" / "departments" - Quản lý phòng ban\n• "thông báo" / "notifications" - Trang thông báo\n• "profile" / "hồ sơ" - Trang cá nhân\n• "lịch đặt phòng" - Trang đặt phòng họp\n• "lịch của tôi" - Trang lịch cá nhân\n• "duyệt đặt phòng" - Trang duyệt đặt phòng\n\n**💬 TRÒ CHUYỆN:**\n• Gõ bất kỳ câu hỏi nào khác để trò chuyện với AI`;
  
  return helpMessage;
}

function buildHelpActions(
  params: CommandHandlerParams,
  isAdmin: boolean,
  pendingAction: string | null,
  cachedNotifications: any[],
  setPendingAction: (action: string | null) => void,
  navigate: any
): Array<{ label: string; onClick: () => void; className: string }> {
  const { setMessages } = params;
  // Import handleCommand dynamically to avoid circular dependency
  const handleCommandFn = async (input: string) => {
    const { handleCommand } = await import('./commandHandler');
    handleCommand({
      input,
      lowerInput: input.toLowerCase(),
      pendingAction,
      cachedNotifications,
      setMessages,
      setPendingAction,
      navigate
    });
  };

  const actions: Array<{ label: string; onClick: () => void; className: string }> = [
    {
      label: '📅 Ví dụ: Đặt phòng họp',
      onClick: () => {
        const exampleInput = 'Đặt phòng 10 người tổ chức sinh nhật từ 9 giờ đến 10 giờ ngày 28 tháng 11 năm 2025';
        setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
        handleCommandFn(exampleInput);
      },
      className: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
    },
    {
      label: '🔔 Ví dụ: Xem thông báo',
      onClick: () => {
        const exampleInput = 'xem thông báo';
        setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
        handleCommandFn(exampleInput);
      },
      className: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
    },
    {
      label: '🧭 Ví dụ: Đi đến Dashboard',
      onClick: () => {
        const exampleInput = 'dashboard';
        setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
        handleCommandFn(exampleInput);
      },
      className: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
    }
  ];
  
  if (isAdmin) {
    actions.unshift(
      {
        label: '📋 Ví dụ: Tìm sự cố',
        onClick: () => {
          const exampleInput = 'tìm sự cố máy CNC tháng 11';
          setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
          handleCommandFn(exampleInput);
        },
        className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
      },
      {
        label: '💡 Ví dụ: Tìm ý tưởng',
        onClick: () => {
          const exampleInput = 'tìm hòm trắng cải tiến tháng 9';
          setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
          handleCommandFn(exampleInput);
        },
        className: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
      }
    );
  }
  
  return actions;
}
