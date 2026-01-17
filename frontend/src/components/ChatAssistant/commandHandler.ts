/**
 * Command Handler v2 - Sử dụng JSON Registry để xử lý các lệnh
 * Thay thế việc hardcode từ khóa bằng file cấu hình JSON
 * 
 * HYBRID MODE: Sử dụng keyword matching + LLM semantic fallback
 */

import { NavigateFunction } from 'react-router';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { generateNewsFromExtracted } from '../../services/gemini';
import { UIMessage, Notification, Incident, Idea } from './types';
import { handleRoomBooking } from './roomBookingHandler';
import { handleHelpCommand } from './handlers/helpHandler';
import { matchIntent, matchIntentHybrid, MatchedIntent, getRegistry } from './intentMatcher';

// Cấu hình: bật/tắt hybrid mode (LLM semantic matching)
const USE_HYBRID_MATCHING = true;

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
  const userRole = currentUser?.role || null;
  const isAdmin = userRole === 'admin';

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

  // --- USE INTENT MATCHER (HYBRID MODE) ---
  // Sử dụng hybrid matching: keyword + LLM fallback khi cấu hình bật
  let matchedIntent: MatchedIntent | null = null;

  if (USE_HYBRID_MATCHING) {
    // Hybrid mode: keyword matching + LLM semantic fallback
    matchedIntent = await matchIntentHybrid(input, userRole, true);

    // Log để debug
    if (matchedIntent) {
      console.log(`[CommandHandler] Hybrid matched: ${matchedIntent.id} (confidence: ${matchedIntent.confidence.toFixed(2)}, method: ${matchedIntent.matchMethod})`);
      if (matchedIntent.matchMethod === 'semantic_llm') {
        console.log(`[CommandHandler] Intent identified by LLM semantic matching`);
      }
    }
  } else {
    // Fallback: chỉ dùng keyword matching (nhanh, không cần API)
    matchedIntent = matchIntent(input, userRole);
  }

  if (matchedIntent) {
    return await executeIntent(matchedIntent, {
      input,
      lowerInput,
      pendingAction,
      cachedNotifications,
      setMessages,
      setPendingAction,
      navigate,
      t
    }, isAdmin);
  }

  // Nếu không có intent nào khớp, trả về false để component gọi Gemini
  return false;
}

/**
 * Thực thi intent đã match
 */
async function executeIntent(
  intent: MatchedIntent,
  params: CommandHandlerParams,
  isAdmin: boolean
): Promise<boolean> {
  const { input, lowerInput, setMessages, navigate } = params;

  switch (intent.category) {
    case 'navigation':
      return handleNavigation(intent, setMessages, navigate);

    case 'room_booking':
      return await handleRoomBooking(input, lowerInput, setMessages);

    case 'notification':
      return await handleNotificationIntent(intent, params);

    case 'incident':
      return await handleIncidentSearch(intent, setMessages, isAdmin);

    case 'idea':
      return await handleIdeaSearch(intent, setMessages, isAdmin);

    case 'news':
      return await handleNewsCreate(intent, input, lowerInput, setMessages);

    case 'help':
      return handleHelpCommand(params, isAdmin);

    default:
      return false;
  }
}

/**
 * Xử lý điều hướng
 */
function handleNavigation(
  intent: MatchedIntent,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>,
  navigate: NavigateFunction
): boolean {
  if (!intent.route) return false;

  setTimeout(() => {
    setMessages(prev => [...prev, {
      role: 'model',
      text: `Đang chuyển bạn đến ${intent.name}...`
    }]);
    navigate(intent.route!);
  }, 500);

  return true;
}

/**
 * Xử lý các intent liên quan đến thông báo
 */
async function handleNotificationIntent(
  intent: MatchedIntent,
  params: CommandHandlerParams
): Promise<boolean> {
  const { lowerInput, setMessages, cachedNotifications } = params;

  switch (intent.id) {
    case 'notification_mark_all_read':
      return await markAllNotificationsRead(setMessages);

    case 'notification_mark_specific_read':
      return await markSpecificNotificationRead(intent, lowerInput, setMessages, cachedNotifications);

    case 'notification_view_detail':
      return viewNotificationDetail(intent, lowerInput, setMessages, cachedNotifications);

    case 'notification_view_list':
      return await viewNotificationList(setMessages);

    default:
      return false;
  }
}

async function markAllNotificationsRead(
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
): Promise<boolean> {
  try {
    await api.put('/notifications/read-all');
    setMessages(prev => [...prev, { role: 'model', text: 'Đã đánh dấu tất cả thông báo là đã đọc.' }]);
  } catch {
    setMessages(prev => [...prev, { role: 'model', text: 'Có lỗi khi cập nhật trạng thái thông báo.' }]);
  }
  return true;
}

async function markSpecificNotificationRead(
  intent: MatchedIntent,
  _lowerInput: string,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>,
  cachedNotifications: Notification[]
): Promise<boolean> {
  const match = intent.extractedParams.regexMatch;
  if (!match) return false;

  const index = parseInt(match[1]) - 1;

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

function viewNotificationDetail(
  intent: MatchedIntent,
  _lowerInput: string,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>,
  cachedNotifications: Notification[]
): boolean {
  const match = intent.extractedParams.regexMatch;
  if (!match) return false;

  const index = parseInt(match[1]) - 1;

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

async function viewNotificationList(
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
): Promise<boolean> {
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
        text: `Bạn có ${unread.length} thông báo mới:\n\n${unread.map((n, i) => `${i + 1}. ${n.title}`).join('\n')}\n\nGõ "đã xem [số]" để đánh dấu đã xem (ví dụ: "đã xem 1").\n(Hoặc chọn nút bên dưới để xem chi tiết)`,
        actions: actions
      }]);
    }
  } catch {
    setMessages(prev => [...prev, { role: 'model', text: 'Không thể tải thông báo lúc này.' }]);
  }
  return true;
}

/**
 * Xử lý tìm kiếm sự cố
 */
async function handleIncidentSearch(
  intent: MatchedIntent,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>,
  isAdmin: boolean
): Promise<boolean> {
  // Check admin permission
  if (!isAdmin) {
    setMessages(prev => [...prev, {
      role: 'model',
      text: 'Quyền truy cập bị từ chối\n\nBạn không có quyền tìm kiếm sự cố. Chỉ Administrator mới có quyền này.'
    }]);
    return true;
  }

  setMessages(prev => [...prev, { role: 'model', text: 'Đang tìm kiếm sự cố...' }]);

  try {
    const searchParams = new URLSearchParams();
    const extracted = intent.extractedParams;

    // Apply extracted parameters
    if (extracted.status) {
      searchParams.append('status', extracted.status);
    }
    if (extracted.priority) {
      searchParams.append('priority', extracted.priority);
    }
    if (extracted.dateInfo?.dateFrom) {
      searchParams.append('date_from', extracted.dateInfo.dateFrom);
    }
    if (extracted.dateInfo?.dateTo) {
      searchParams.append('date_to', extracted.dateInfo.dateTo);
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
      if (extracted.dateInfo) {
        if (extracted.dateInfo.date) {
          resultText += `\nNgày: ${formatDate(extracted.dateInfo.date)}`;
        } else if (extracted.dateInfo.month && extracted.dateInfo.year) {
          resultText += `\nTháng ${extracted.dateInfo.month}/${extracted.dateInfo.year}`;
        } else if (extracted.dateInfo.year) {
          resultText += `\nNăm ${extracted.dateInfo.year}`;
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

/**
 * Xử lý tìm kiếm ý tưởng
 */
async function handleIdeaSearch(
  intent: MatchedIntent,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>,
  isAdmin: boolean
): Promise<boolean> {
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
    const extracted = intent.extractedParams;

    // Important: Mark this as a chat search so backend applies special Admin rules
    searchParams.append('from_chat', 'true');

    // Apply extracted parameters
    if (extracted.ideabox_type) {
      searchParams.append('ideabox_type', extracted.ideabox_type);
    }
    if (extracted.status) {
      searchParams.append('status', extracted.status);
    }
    if (extracted.dateInfo?.dateFrom) {
      searchParams.append('date_from', extracted.dateInfo.dateFrom);
    }
    if (extracted.dateInfo?.dateTo) {
      searchParams.append('date_to', extracted.dateInfo.dateTo);
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
      let resultText = `Tìm thấy ${ideas.length} ý tưởng:`;

      // Add ideabox type info
      if (extracted.ideabox_type === 'white') {
        resultText += ' (Hòm Trắng)';
      } else if (extracted.ideabox_type === 'pink') {
        resultText += ' (Hòm Hồng)';
      }

      // Add date range info
      if (extracted.dateInfo) {
        if (extracted.dateInfo.date) {
          resultText += `\nNgày: ${formatDate(extracted.dateInfo.date)}`;
        } else if (extracted.dateInfo.month && extracted.dateInfo.year) {
          resultText += `\nTháng ${extracted.dateInfo.month}/${extracted.dateInfo.year}`;
        } else if (extracted.dateInfo.year) {
          resultText += `\nNăm ${extracted.dateInfo.year}`;
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

/**
 * Xử lý tạo tin tức - Sử dụng AI để trích xuất nội dung
 */
async function handleNewsCreate(
  _intent: MatchedIntent,
  input: string,
  lowerInput: string,
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>
): Promise<boolean> {

  // Kiểm tra nếu input quá ngắn (chỉ có command, không có nội dung)
  const minContentWords = ['tạo', 'tin', 'tức', 'thông', 'báo', 'viết', 'đăng', 'soạn', 'muốn', 'cần', 'tôi', 'mình'];
  const inputWords = lowerInput.split(/\s+/);
  const contentWords = inputWords.filter(word => !minContentWords.includes(word));

  if (contentWords.length < 2) {
    setMessages(prev => [...prev, {
      role: 'model',
      text: `Hướng dẫn tạo tin tức nhanh:\n\nHãy mô tả nội dung tin tức bạn muốn tạo, ví dụ:\n- "Tạo tin về sự kiện sinh nhật nhân viên tầng 2 chiều nay"\n- "Tạo thông báo bảo trì máy CNC ngày mai lúc 9h"\n- "Viết tin cảnh báo an toàn khu vực A quan trọng"\n\nTôi sẽ tự động phân tích và tạo tin tức phù hợp cho bạn.`
    }]);
    return true;
  }

  setMessages(prev => [...prev, { role: 'model', text: 'Đang phân tích yêu cầu và soạn thảo tin tức...' }]);

  try {
    // BƯỚC 1: Sử dụng AI để trích xuất nội dung từ input
    // AI sẽ phân biệt phần command với phần nội dung thực sự
    let extractedContent = {
      content: '',
      title: '',
      category: 'company_announcement',
      isPriority: false
    };

    try {
      const extractResponse = await api.post('/chat/extract-content', {
        input,
        intentId: 'news_create'
      });

      // Kiểm tra success VÀ không có cờ error (AI thực sự thành công)
      if (extractResponse.data.success && extractResponse.data.data && !extractResponse.data.error) {
        extractedContent = {
          content: extractResponse.data.data.content || '',
          title: extractResponse.data.data.title || '',
          category: extractResponse.data.data.category || 'company_announcement',
          isPriority: extractResponse.data.data.isPriority || false
        };
        console.log('[NewsCreate] AI extracted content successfully:', extractedContent);
      } else {
        // Nếu backend trả về error: true (dùng fallback thô), frontend sẽ dùng fallback xịn hơn
        throw new Error('Backend returned AI error flag');
      }
    } catch (extractError) {
      console.error('[NewsCreate] AI extraction failed or returned error, using frontend fallback:', extractError);
      // Fallback: sử dụng regex để loại bỏ phần command
      const removePatterns = [
        /^(?:tôi\s*)?(?:muốn|cần|xin|hãy|giúp\s*tôi)?\s*(?:tạo|viết|đăng|soạn)\s*(?:tin(?:\s*tức)?|thông\s*báo)\s*(?:về|với\s*nội\s*dung|là|rằng|như\s*sau)?\s*:?\s*/i,
        /^(?:tạo|viết|đăng|soạn)\s*(?:tin(?:\s*tức)?|thông\s*báo)\s*(?:về|với\s*nội\s*dung|là)?\s*/i,
        /^(?:về\s*việc|về|là|rằng)\s+/i
      ];

      let cleanedContent = input;
      for (const pattern of removePatterns) {
        const match = cleanedContent.match(pattern);
        if (match) {
          cleanedContent = cleanedContent.replace(pattern, '').trim();
        }
      }

      // Viết hoa chữ cái đầu
      if (cleanedContent.length > 0) {
        cleanedContent = cleanedContent.charAt(0).toUpperCase() + cleanedContent.slice(1);
      }

      extractedContent.content = cleanedContent;
      extractedContent.title = cleanedContent;

      // Auto-detect category
      if (lowerInput.includes('cảnh báo') || lowerInput.includes('an toàn')) {
        extractedContent.category = 'safety_alert';
      } else if (lowerInput.includes('sự kiện') || lowerInput.includes('sinh nhật') || lowerInput.includes('tiệc')) {
        extractedContent.category = 'event';
      } else if (lowerInput.includes('bảo trì') || lowerInput.includes('sửa chữa')) {
        extractedContent.category = 'maintenance';
      }

      extractedContent.isPriority = lowerInput.includes('khẩn') || lowerInput.includes('quan trọng');
    }

    // Kiểm tra nếu vẫn không có nội dung
    if (!extractedContent.content || extractedContent.content.length < 5) {
      extractedContent.content = input;
      extractedContent.title = input;
    }

    console.log('[NewsCreate] Final extracted content:', extractedContent);

    // BƯỚC 2: Tạo tin tức đầy đủ từ nội dung đã trích xuất
    // Nếu nội dung trích xuất quá ngắn, bỏ qua bước generate AI để tránh 500
    let generatedNews = null;

    if (extractedContent.content && extractedContent.content.length > 5) {
      try {
        generatedNews = await generateNewsFromExtracted({
          title: extractedContent.title || extractedContent.content,
          category: extractedContent.category,
          is_priority: extractedContent.isPriority,
          content: extractedContent.content
        });
      } catch (genError) {
        console.error('[NewsCreate] generateNewsFromExtracted failed:', genError);
      }
    }

    let newsData = {
      category: extractedContent.category || 'company_announcement',
      target_audience: 'all',
      status: 'published',
      title: (generatedNews?.title) || extractedContent.title || input,
      content: (generatedNews?.content) || extractedContent.content || input,
      excerpt: (generatedNews?.excerpt) || extractedContent.content?.substring(0, 150) || input.substring(0, 150),
      is_priority: generatedNews?.is_priority ?? extractedContent.isPriority
    };

    console.log('[NewsCreate] Final news data prepared for API:', newsData);

    if (newsData.title && newsData.content) {
      try {
        const response = await api.post('/news', newsData);

        if (response.data && response.data.success) {
          const createdNews = response.data.data;
          const categoryLabels: Record<string, string> = {
            'company_announcement': 'Thông báo công ty',
            'safety_alert': 'Cảnh báo an toàn',
            'event': 'Sự kiện',
            'production_update': 'Cập nhật sản xuất',
            'maintenance': 'Bảo trì',
            'policy_update': 'Cập nhật chính sách'
          };
          const categoryLabel = categoryLabels[createdNews.category] || createdNews.category;

          setMessages(prev => [...prev, {
            role: 'model',
            text: `Đã tạo tin tức thành công!\n\nTiêu đề: ${createdNews.title}\nDanh mục: ${categoryLabel}\nƯu tiên: ${createdNews.is_priority ? 'Cao' : 'Bình thường'}\n\nTin tức đã được xuất bản lên hệ thống.`
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: 'model',
            text: 'Có lỗi khi lưu tin tức vào cơ sở dữ liệu. Vui lòng kiểm tra lại quyền hạn (Supervisor/Admin).'
          }]);
        }
      } catch (apiError) {
        console.error('[NewsCreate] Server API Error:', apiError);
        setMessages(prev => [...prev, {
          role: 'model',
          text: 'Máy chủ phản hồi lỗi khi lưu tin tức. Vui lòng thử lại sau hoặc liên hệ admin.'
        }]);
      }
    } else {
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, tôi không thể trích xuất nội dung từ yêu cầu này. Vui lòng thử lại với nội dung chi tiết hơn.' }]);
    }
  } catch (error) {
    console.error('General news create error:', error);
    setMessages(prev => [...prev, { role: 'model', text: 'Đã xảy ra lỗi hệ thống khi tạo tin tức. Kiểm tra kết nối hoặc cấu hình AI của máy chủ.' }]);
  }
  return true;
}

/**
 * Format date string from YYYY-MM-DD to DD/MM/YYYY
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Export để có thể test
 */
export { executeIntent, getRegistry };
