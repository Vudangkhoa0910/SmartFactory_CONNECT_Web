import { NavigateFunction } from 'react-router';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { generateNewsContent } from '../../services/gemini';
import { navMap } from './navigationMap';
import { UIMessage, Notification, Incident } from './types';

interface CommandHandlerParams {
  input: string;
  lowerInput: string;
  pendingAction: string | null;
  cachedNotifications: Notification[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  setPendingAction: (action: string | null) => void;
  navigate: NavigateFunction;
}

// Trả về true nếu một lệnh được xử lý, ngược lại trả về false.
export async function handleCommand({
  input,
  lowerInput,
  pendingAction,
  setMessages,
  setPendingAction,
  navigate,
  cachedNotifications,
}: CommandHandlerParams): Promise<boolean> {
    
  // --- HANDLE PENDING ACTIONS ---
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
  
  // --- HANDLE HELP COMMAND ---
  if (lowerInput.includes('hướng dẫn') || lowerInput.includes('trợ giúp') || lowerInput.includes('help') || lowerInput === 'h' || lowerInput === '?' || lowerInput.includes('từ khóa') || lowerInput.includes('lệnh')) {
    const helpMessage = {
      role: 'model' as const,
      text: `📖 **HƯỚNG DẪN SỬ DỤNG CHATBOT**\n\n💡 Gõ các từ khóa sau để sử dụng:\n\n**🔔 QUẢN LÝ THÔNG BÁO:**\n• "xem thông báo" - Xem danh sách thông báo chưa đọc\n• "xem thông báo [số]" - Xem chi tiết thông báo\n• "đã xem [số]" - Đánh dấu đã đọc 1 thông báo\n• "đã xem hết" - Đánh dấu tất cả đã đọc\n\n**🔍 TÌM KIẾM SỰ CỐ:**\n• "tìm sự cố" - Hiển thị tất cả sự cố\n• "tìm sự cố [từ khóa]" - Tìm theo tiêu đề/mô tả\n• "tìm sự cố tháng [số]" - Tìm theo tháng\n• "tìm sự cố năm [số]" - Tìm theo năm\n• "tìm sự cố ngày [DD/MM/YYYY]" - Tìm theo ngày\n• "tìm sự cố [từ khóa] tháng 11 năm 2025"\n\n**🎯 LỌC THEO TRẠNG THÁI:**\n• Thêm: "đang xử lý", "chờ xử lý", "đã giải quyết", "đã đóng"\n\n**⚡ LỌC THEO ƯU TIÊN:**\n• Thêm: "khẩn cấp", "cao", "trung bình", "thấp"\n\n**📰 TẠO TIN TỨC:**\n• "tạo tin [chủ đề]" - Tạo tin tức mới bằng AI\n\n**🧭 ĐIỀU HƯỚNG:**\n• "dashboard" - Trang tổng quan\n• "sự cố" / "incidents" - Quản lý sự cố\n• "ý tưởng" / "ideas" - Quản lý ý tưởng\n• "tin tức" / "news" - Quản lý tin tức\n• "người dùng" / "users" - Quản lý người dùng\n• "phòng ban" / "departments" - Quản lý phòng ban\n• "thông báo" / "notifications" - Trang thông báo\n• "profile" / "hồ sơ" - Trang cá nhân\n\n**💬 TRÒ CHUYỆN:**\n• Gõ bất kỳ câu hỏi nào khác để trò chuyện với AI`,
      actions: [
        {
          label: '📋 Ví dụ: Tìm sự cố',
          onClick: () => {
            const exampleInput = 'tìm sự cố máy CNC tháng 11';
            setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
            // Trigger the command
            handleCommand({
              input: exampleInput,
              lowerInput: exampleInput.toLowerCase(),
              pendingAction,
              cachedNotifications,
              setMessages,
              setPendingAction,
              navigate
            });
          },
          className: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
        },
        {
          label: '🔔 Ví dụ: Xem thông báo',
          onClick: () => {
            const exampleInput = 'xem thông báo';
            setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
            handleCommand({
              input: exampleInput,
              lowerInput: exampleInput.toLowerCase(),
              pendingAction,
              cachedNotifications,
              setMessages,
              setPendingAction,
              navigate
            });
          },
          className: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
        },
        {
          label: '🧭 Ví dụ: Đi đến Dashboard',
          onClick: () => {
            const exampleInput = 'dashboard';
            setMessages(prev => [...prev, { role: 'user', text: exampleInput }]);
            handleCommand({
              input: exampleInput,
              lowerInput: exampleInput.toLowerCase(),
              pendingAction,
              cachedNotifications,
              setMessages,
              setPendingAction,
              navigate
            });
          },
          className: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
        }
      ]
    };
    
    setMessages(prev => [...prev, helpMessage]);
    return true;
  }
  
  // --- HANDLE NAVIGATION ---
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

  // --- HANDLE NOTIFICATION READ STATUS ---
  
  // 1. Mark ALL as read
  if (lowerInput.includes('đọc hết') || lowerInput.includes('đã xem hết') || lowerInput.includes('đánh dấu tất cả đã đọc') || lowerInput.includes('đã xem các thông báo')) {
    try {
      await api.put('/notifications/read-all');
      setMessages(prev => [...prev, { role: 'model', text: '✅ Đã đánh dấu tất cả thông báo là đã đọc.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: '❌ Có lỗi khi cập nhật trạng thái thông báo.' }]);
    }
    return true;
  }

  // 2. Mark SPECIFIC as read (e.g. "đã đọc số 1", "đánh dấu số 2")
  // Expanded regex to catch more variations and typos
  const markReadMatch = lowerInput.match(/(?:đã đọc|xem xong|đánh dấu|đã xem|ã xem|da xem|dã xem|đã xen|da xen|xen xong)\s*(?:thông báo|tin)?\s*(?:số|thứ)?\s*(\d+)/i);
  if (markReadMatch) {
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

  // 3. View Specific Notification Detail (e.g. "xem thông báo 1", "chi tiết số 2")
  // Must come BEFORE the general "View List" command
  const viewDetailMatch = lowerInput.match(/(?:xem|chi tiết|về|nội dung)\s*(?:thông báo|tin)?\s*(?:số|thứ)?\s*(\d+)/i);
  if (viewDetailMatch) {
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

  // 4. View Notifications (List)
  if (lowerInput.includes('xem thông báo') || lowerInput.includes('kiểm tra thông báo') || (lowerInput.includes('thông báo') && lowerInput.includes('mới'))) {
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

  // --- HANDLE INCIDENT SEARCH ---
  if (lowerInput.includes('tìm sự cố') || lowerInput.includes('tìm kiếm sự cố') || lowerInput.includes('tìm báo cáo') || lowerInput.includes('tìm incident')) {
    setMessages(prev => [...prev, { role: 'model', text: '🔍 Đang tìm kiếm sự cố...' }]);
    
    try {
      // Extract search parameters from user input
      const searchParams = new URLSearchParams();
      
      // Search by keyword
      let keywords = input.replace(/(tìm|kiếm|sự cố|báo cáo|incident|trong|tháng|năm|ngày)/gi, '').trim();
      
      // Extract date filters
      const currentYear = new Date().getFullYear();
      
      // Check for year (e.g., "năm 2025", "2025")
      const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : null;
      
      // Check for month (e.g., "tháng 11", "tháng 1", "T11")
      const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})/i);
      let month = monthMatch ? parseInt(monthMatch[1]) : null;
      
      // Check for specific date (e.g., "ngày 15/11/2025", "15-11-2025", "15/11")
      const fullDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
      
      if (fullDateMatch) {
        const day = parseInt(fullDateMatch[1]);
        month = parseInt(fullDateMatch[2]);
        year = fullDateMatch[3] ? (fullDateMatch[3].length === 2 ? 2000 + parseInt(fullDateMatch[3]) : parseInt(fullDateMatch[3])) : currentYear;
        
        // Set date range for specific day
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (month && year) {
        // Set date range for specific month and year
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (month && !year) {
        // Current year, specific month
        const startDate = new Date(currentYear, month - 1, 1);
        const endDate = new Date(currentYear, month, 0, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (year && !month) {
        // Entire year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      }
      
      // Remove date strings from keywords
      keywords = keywords.replace(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/g, '').trim();
      keywords = keywords.replace(/\d{4}/g, '').trim();
      keywords = keywords.replace(/\d{1,2}/g, '').trim();
      
      if (keywords) {
        searchParams.append('search', keywords);
      }
      
      // Check for status keywords
      if (lowerInput.includes('đang xử lý') || lowerInput.includes('in_progress')) {
        searchParams.append('status', 'in_progress');
      } else if (lowerInput.includes('chờ xử lý') || lowerInput.includes('pending')) {
        searchParams.append('status', 'pending');
      } else if (lowerInput.includes('đã giải quyết') || lowerInput.includes('resolved')) {
        searchParams.append('status', 'resolved');
      } else if (lowerInput.includes('đã đóng') || lowerInput.includes('closed')) {
        searchParams.append('status', 'closed');
      }
      
      // Check for priority keywords
      if (lowerInput.includes('khẩn cấp') || lowerInput.includes('critical')) {
        searchParams.append('priority', 'critical');
      } else if (lowerInput.includes('cao') || lowerInput.includes('high')) {
        searchParams.append('priority', 'high');
      } else if (lowerInput.includes('trung bình') || lowerInput.includes('medium')) {
        searchParams.append('priority', 'medium');
      } else if (lowerInput.includes('thấp') || lowerInput.includes('low')) {
        searchParams.append('priority', 'low');
      }
      
      searchParams.append('limit', '20');
      searchParams.append('page', '1');
      
      const response = await api.get(`/incidents?${searchParams.toString()}`);
      const incidents: Incident[] = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      if (incidents.length === 0) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: '❌ Không tìm thấy sự cố nào phù hợp với tiêu chí tìm kiếm.' 
        }]);
      } else {
        let resultText = `🔍 **Tìm thấy ${incidents.length} sự cố:**`;
        
        // Add date range info if applicable
        if (searchParams.has('date_from') && searchParams.has('date_to')) {
          const dateFrom = new Date(searchParams.get('date_from')!);
          if (fullDateMatch) {
            resultText += `\n📅 Ngày: ${dateFrom.toLocaleDateString('vi-VN')}`;
          } else if (month && year) {
            resultText += `\n📅 Tháng ${month}/${year}`;
          } else if (month) {
            resultText += `\n📅 Tháng ${month}/${currentYear}`;
          } else if (year) {
            resultText += `\n📅 Năm ${year}`;
          }
        }
        
        resultText += '\n\n💡 Click vào card để xem chi tiết';
        
        setMessages(prev => [...prev, {
          role: 'model',
          text: resultText,
          incidentCards: incidents
        }]);
      }
    } catch (error) {
      console.error('Search incidents error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '❌ Có lỗi khi tìm kiếm sự cố. Vui lòng thử lại.' 
      }]);
    }
    return true;
  }

  // --- HANDLE NEWS CREATION ---
  if (lowerInput.includes('tạo tin')) {
     // Check if the user just typed "tạo tin" or "tạo tin tức" without content
     const cleanInput = lowerInput.replace('tạo tin', '').replace('tức', '').trim();
     
     if (cleanInput.length < 5) {
        setMessages(prev => [...prev, { 
           role: 'model', 
           text: `📝 **Hướng dẫn tạo tin tức nhanh:**\n\nHãy gõ lệnh theo cú pháp:\n\`tạo tin [nội dung chính] [tính chất]\`\n\n**Ví dụ:**\n- "Tạo tin cảnh báo cháy tại khu vực A quan trọng"\n- "Tạo tin thông báo bảo trì máy CNC ngày mai"\n- "Tạo tin chúc mừng sinh nhật tháng 11"\n\nTôi sẽ tự động phân tích nội dung, tiêu đề và mức độ ưu tiên để tạo tin tức cho bạn.` 
        }]);
        return true;
     }

     setMessages(prev => [...prev, { role: 'model', text: '🤖 Đang phân tích yêu cầu và soạn thảo tin tức...' }]);
     
     try {
        const generatedNews = await generateNewsContent(input);
        
        if (generatedNews) {
            // Default values for required fields if missing
            const newsData = {
                category: 'company_announcement',
                target_audience: 'all',
                status: 'published', // Auto-publish
                ...generatedNews
            };

            const response = await api.post('/news', newsData);
            
            if (response.data && response.data.success) {
                const createdNews = response.data.data;
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    text: `✅ **Đã tạo tin tức thành công!**\n\n**Tiêu đề:** ${createdNews.title}\n**Danh mục:** ${createdNews.category}\n**Ưu tiên:** ${createdNews.is_priority ? 'Cao 🔴' : 'Bình thường 🔵'}\n\n*Tin tức đã được xuất bản lên hệ thống.*` 
                }]);
            } else {
                 setMessages(prev => [...prev, { role: 'model', text: '❌ Có lỗi khi lưu tin tức. Vui lòng kiểm tra quyền hạn của bạn.' }]);
            }
        } else {
            setMessages(prev => [...prev, { role: 'model', text: '❌ Xin lỗi, tôi không thể tạo nội dung từ yêu cầu này. Vui lòng thử lại chi tiết hơn.' }]);
        }
     } catch (error) {
         console.error('Create news error:', error);
         setMessages(prev => [...prev, { role: 'model', text: '❌ Có lỗi xảy ra. Bạn cần quyền Supervisor để tạo tin tức.' }]);
     }
     return true;
  }

  // Nếu không có lệnh nào khớp, trả về false để component gọi Gemini
  return false;
}