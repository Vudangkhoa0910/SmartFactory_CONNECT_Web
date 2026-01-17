import { NavigateFunction } from 'react-router';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { sendSmartMessage, generateNewsFromExtracted } from '../../services/gemini';
import { navMap } from './navigationMap';
import { UIMessage, Notification, Incident, Idea } from './types';
import { handleRoomBooking } from './roomBookingHandler';
import { handleHelpCommand } from './handlers/helpHandler';

interface CommandHandlerParams {
  input: string;
  lowerInput: string;
  pendingAction: string | null;
  cachedNotifications: Notification[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  setPendingAction: (action: string | null) => void;
  navigate: NavigateFunction;
  t: (key: string) => string;
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
  t
}: CommandHandlerParams): Promise<boolean> {
  
  // Check if user is admin
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';
    
  // --- HANDLE PENDING ACTIONS ---
  if (pendingAction === 'DELETE_ALL_INCIDENTS') {
    if (lowerInput.includes('đồng ý')) {
      setMessages(prev => [...prev, { role: 'model', text: 'Đã xoá toàn bộ danh sách sự cố thành công.' }]);
      toast.success('Đã xoá dữ liệu sự cố');
    } else {
      setMessages(prev => [...prev, { role: 'model', text: 'Đã huỷ thao tác xoá.' }]);
    }
    setPendingAction(null);
    return true;
  }
  
  // --- HANDLE ROOM BOOKING NAVIGATION COMMANDS (CHECK BEFORE BOOKING HANDLER) ---
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
  
  // --- HANDLE ROOM BOOKING (AFTER NAVIGATION CHECKS) ---
  if (lowerInput.includes('đặt phòng') || lowerInput.includes('book') || lowerInput.includes('đặt lịch')) {
    return await handleRoomBooking(input, lowerInput, setMessages);
  }
  
  // --- HANDLE HELP COMMAND ---
  if (handleHelpCommand({
    input,
    lowerInput,
    pendingAction,
    cachedNotifications,
    setMessages,
    setPendingAction,
    navigate,
    t
  }, isAdmin)) {
    return true;
  }
  
  // --- HANDLE IDEA SEARCH (must be BEFORE navigation to avoid "ý tưởng" keyword conflict) ---
  if (lowerInput.includes('tìm ý tưởng') || lowerInput.includes('tìm kiếm ý tưởng') || 
      lowerInput.includes('tìm hòm trắng') || lowerInput.includes('tìm hòm hồng') || 
      lowerInput.includes('tìm white') || lowerInput.includes('tìm pink')) {
    
    // Check admin permission
    if (!isAdmin) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Quyền truy cập bị từ chối\n\nBạn không có quyền tìm kiếm ý tưởng. Chỉ Administrator mới có quyền này.' 
      }]);
      return true;
    }
    
    setMessages(prev => [...prev, { role: 'model', text: 'Đang tìm kiếm ý tưởng...' }]);
    
    try {
      const searchParams = new URLSearchParams();
      
      // Important: Mark this as a chat search so backend applies special Admin rules
      searchParams.append('from_chat', 'true');
      
      // Determine ideabox type
      if (lowerInput.includes('hòm trắng') || lowerInput.includes('white')) {
        searchParams.append('ideabox_type', 'white');
      } else if (lowerInput.includes('hòm hồng') || lowerInput.includes('pink')) {
        searchParams.append('ideabox_type', 'pink');
      }
      
      // Search by keyword - remove search-related words
      let keywords = input.replace(/(tìm|kiếm|ý tưởng|hòm trắng|hòm hồng|white|pink|trong|tháng|năm|ngày)/gi, '').trim();
      
      // Extract date filters
      const currentYear = new Date().getFullYear();
      
      const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
      let year = yearMatch ? parseInt(yearMatch[1]) : null;
      
      const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})/i);
      let month = monthMatch ? parseInt(monthMatch[1]) : null;
      
      const fullDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
      
      if (fullDateMatch) {
        const day = parseInt(fullDateMatch[1]);
        month = parseInt(fullDateMatch[2]);
        year = fullDateMatch[3] ? (fullDateMatch[3].length === 2 ? 2000 + parseInt(fullDateMatch[3]) : parseInt(fullDateMatch[3])) : currentYear;
        
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (month && year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (month && !year) {
        const startDate = new Date(currentYear, month - 1, 1);
        const endDate = new Date(currentYear, month, 0, 23, 59, 59);
        searchParams.append('date_from', startDate.toISOString());
        searchParams.append('date_to', endDate.toISOString());
      } else if (year && !month) {
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
      if (lowerInput.includes('đang xem xét') || lowerInput.includes('under_review')) {
        searchParams.append('status', 'under_review');
      } else if (lowerInput.includes('chờ xử lý') || lowerInput.includes('pending')) {
        searchParams.append('status', 'pending');
      } else if (lowerInput.includes('đã phê duyệt') || lowerInput.includes('approved')) {
        searchParams.append('status', 'approved');
      } else if (lowerInput.includes('từ chối') || lowerInput.includes('rejected')) {
        searchParams.append('status', 'rejected');
      } else if (lowerInput.includes('đã triển khai') || lowerInput.includes('implemented')) {
        searchParams.append('status', 'implemented');
      }
      
      searchParams.append('limit', '20');
      searchParams.append('page', '1');
      
      const response = await api.get(`/ideas?${searchParams.toString()}`);
      const ideas: Idea[] = Array.isArray(response.data) ? response.data : (response.data.data || []);
      
      if (ideas.length === 0) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: 'Không tìm thấy ý tưởng nào phù hợp với tiêu chí tìm kiếm.' 
        }]);
      } else {
        let resultText = `Tìm thấy ${ideas.length} ý tưởng:`
        
        const ideaboxType = searchParams.get('ideabox_type');
        if (ideaboxType === 'white') {
          resultText += ' (Hòm Trắng)';
        } else if (ideaboxType === 'pink') {
          resultText += ' (Hòm Hồng)';
        } else {
          resultText += '';
        }
        
        // Add date range info
        if (searchParams.has('date_from') && searchParams.has('date_to')) {
          const dateFrom = new Date(searchParams.get('date_from')!);
          if (fullDateMatch) {
            resultText += `\nNgày: ${dateFrom.toLocaleDateString('vi-VN')}`;
          } else if (month && year) {
            resultText += `\nTháng ${month}/${year}`;
          } else if (month) {
            resultText += `\nTháng ${month}/${currentYear}`;
          } else if (year) {
            resultText += `\nNăm ${year}`;
          }
        }
        
        resultText += '\n\nClick vào card để xem chi tiết';
        
        setMessages(prev => [...prev, {
          role: 'model',
          text: resultText,
          ideaCards: ideas
        }]);
      }
    } catch (error) {
      console.error('Search ideas error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Có lỗi khi tìm kiếm ý tưởng. Vui lòng thử lại.' 
      }]);
    }
    return true;
  }
  
  // --- HANDLE NAVIGATION ---
  // All users can navigate to any page
  const sortedKeys = Object.keys(navMap).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (lowerInput.includes(key)) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: `Đang chuyển bạn đến ${key}...` }]);
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
      setMessages(prev => [...prev, { role: 'model', text: 'Đã đánh dấu tất cả thông báo là đã đọc.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi khi cập nhật trạng thái thông báo.' }]);
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
          text: `Đã đánh dấu thông báo "${notification.title}" là đã đọc.` 
        }]);
      } catch {
        setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi khi cập nhật trạng thái thông báo.' }]);
      }
    } else {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Không tìm thấy thông báo số ${index + 1} trong danh sách hiện tại. Vui lòng gõ "Xem thông báo" để cập nhật danh sách.` 
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
        text: `Chi tiết thông báo:\n\n${n.title}\n${n.message || n.content || ''}`
      }]);
    } else {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: `Không tìm thấy thông báo số ${index + 1} trong danh sách hiện tại.` 
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
           setMessages(prev => [...prev, { role: 'model', text: 'Bạn không có thông báo mới nào.' }]);
      } else {
          const actions = unread.map((n) => ({
            label: `Xem: ${n.title.length > 15 ? n.title.substring(0, 15) + '...' : n.title}`,
            onClick: () => {
               setMessages(prev => [...prev, {
                  role: 'model',
                  text: `Chi tiết thông báo:\n\n${n.title}\n${n.message || n.content || ''}`
               }]);
            }
          }));

          setMessages(prev => [...prev, { 
              role: 'model', 
              text: `Bạn có ${unread.length} thông báo mới:\n\n${unread.map((n, i) => `${i+1}. ${n.title}`).join('\n')}\n\nGõ "đã xem [số]" để đánh dấu đã xem (ví dụ: "đã xem 1").\n(Hoặc chọn nút bên dưới để xem chi tiết)`,
              actions: actions
          }]);
      }
    } catch {
        setMessages(prev => [...prev, { role: 'model', text: 'Không thể tải thông báo lúc này.' }]);
    }
    return true;
  }

  // --- HANDLE INCIDENT SEARCH ---
  if (lowerInput.includes('tìm sự cố') || lowerInput.includes('tìm kiếm sự cố') || lowerInput.includes('tìm báo cáo') || lowerInput.includes('tìm incident')) {
    
    // Check admin permission
    if (!isAdmin) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Quyền truy cập bị từ chối\n\nBạn không có quyền tìm kiếm sự cố/báo cáo. Chỉ Administrator mới có quyền này.' 
      }]);
      return true;
    }
    
    setMessages(prev => [...prev, { role: 'model', text: 'Đang tìm kiếm sự cố...' }]);
    
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
          text: 'Không tìm thấy sự cố nào phù hợp với tiêu chí tìm kiếm.' 
        }]);
      } else {
        let resultText = `Tìm thấy ${incidents.length} sự cố:`;
        
        // Add date range info if applicable
        if (searchParams.has('date_from') && searchParams.has('date_to')) {
          const dateFrom = new Date(searchParams.get('date_from')!);
          if (fullDateMatch) {
            resultText += `\nNgày: ${dateFrom.toLocaleDateString('vi-VN')}`;
          } else if (month && year) {
            resultText += `\nTháng ${month}/${year}`;
          } else if (month) {
            resultText += `\nTháng ${month}/${currentYear}`;
          } else if (year) {
            resultText += `\nNăm ${year}`;
          }
        }
        
        resultText += '\n\nClick vào card để xem chi tiết';
        
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
        text: 'Có lỗi khi tìm kiếm sự cố. Vui lòng thử lại.' 
      }]);
    }
    return true;
  }

  // --- HANDLE NEWS CREATION ---
  if (lowerInput.includes('tạo tin')) {
     // Check if the user just typed "tạo tin" or "tạo tin tức" without content
     const cleanInput = lowerInput.replace('tạo tin', '').replace('tức', '').trim();
     
     if (cleanInput.length < 3) {
        setMessages(prev => [...prev, { 
           role: 'model', 
           text: `Hướng dẫn tạo tin tức nhanh:\n\nHãy gõ lệnh theo cú pháp:\n'tạo tin [nội dung chính] [tính chất]'\n\nVí dụ:\n- "Tạo tin cảnh báo cháy tại khu vực A quan trọng"\n- "Tạo tin thông báo bảo trì máy CNC ngày mai"\n- "Tạo tin chúc mừng sinh nhật tháng 11"\n- "Tạo tin thông báo tầng hầm hết chỗ gửi xe"\n\nTôi sẽ tự động phân tích nội dung, tiêu đề và mức độ ưu tiên để tạo tin tức cho bạn.` 
        }]);
        return true;
     }

     setMessages(prev => [...prev, { role: 'model', text: 'Đang phân tích yêu cầu và soạn thảo tin tức...' }]);
     
     try {
        // Step 1: Use smart message to extract info from user input
        const smartResponse = await sendSmartMessage(input, undefined, 'vi');
        
        console.log('Smart response for news:', smartResponse);
        
        let newsData: Record<string, unknown> | null = null;
        
        if (smartResponse.success && smartResponse.data) {
            const data = smartResponse.data;
            
            // Check if AI extracted some info
            if (data.extracted && Object.keys(data.extracted).length > 0) {
                // Generate full content from extracted info
                const generatedNews = await generateNewsFromExtracted({
                    title: data.extracted.title || cleanInput,
                    category: data.extracted.category || 'company_announcement',
                    is_priority: data.extracted.is_priority || false,
                    content: data.extracted.content
                });
                
                if (generatedNews) {
                    newsData = {
                        category: generatedNews.category || 'company_announcement',
                        target_audience: 'all',
                        status: 'published',
                        title: generatedNews.title,
                        content: generatedNews.content,
                        excerpt: generatedNews.excerpt,
                        is_priority: generatedNews.is_priority || false
                    };
                }
            }
        }
        
        // Fallback: Generate directly from input if smart extraction failed
        if (!newsData) {
            const generatedNews = await generateNewsFromExtracted({
                title: cleanInput,
                category: 'company_announcement',
                is_priority: lowerInput.includes('khẩn') || lowerInput.includes('quan trọng')
            });
            
            if (generatedNews) {
                newsData = {
                    category: generatedNews.category || 'company_announcement',
                    target_audience: 'all',
                    status: 'published',
                    ...generatedNews
                };
            }
        }
        
        if (newsData && newsData.title && newsData.content) {
            const response = await api.post('/news', newsData);
            
            if (response.data && response.data.success) {
                const createdNews = response.data.data;
                setMessages(prev => [...prev, { 
                    role: 'model', 
                    text: `Đã tạo tin tức thành công!\n\nTiêu đề: ${createdNews.title}\nDanh mục: ${createdNews.category}\nƯu tiên: ${createdNews.is_priority ? 'Cao' : 'Bình thường'}\n\nTin tức đã được xuất bản lên hệ thống.` 
                }]);
            } else {
                 setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi khi lưu tin tức. Vui lòng kiểm tra quyền hạn của bạn.' }]);
            }
        } else {
            setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, tôi không thể tạo nội dung từ yêu cầu này. Vui lòng thử lại chi tiết hơn.' }]);
        }
     } catch (error) {
         console.error('Create news error:', error);
         setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi xảy ra. Bạn cần quyền Supervisor để tạo tin tức.' }]);
     }
     return true;
  }

  // Nếu không có lệnh nào khớp, trả về false để component gọi Gemini
  return false;
}