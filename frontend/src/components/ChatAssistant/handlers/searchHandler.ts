/**
 * Search Command Handlers - Incident & Idea Search
 */
import api from '../../../services/api';
import { CommandHandlerParams } from '../command.types';
import { Incident, Idea } from '../types';
import { extractDateFilters } from '../utils/dateParser';

export async function handleIncidentSearch(params: CommandHandlerParams, isAdmin: boolean): Promise<boolean> {
  const { input, lowerInput, setMessages } = params;
  
  if (!lowerInput.includes('tìm sự cố') && 
      !lowerInput.includes('tìm kiếm sự cố') && 
      !lowerInput.includes('tìm báo cáo') && 
      !lowerInput.includes('tìm incident')) {
    return false;
  }
  
  if (!isAdmin) {
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: '🚫 **Quyền truy cập bị từ chối**\n\nBạn không có quyền tìm kiếm sự cố/báo cáo. Chỉ Administrator mới có quyền này.' 
    }]);
    return true;
  }
  
  setMessages(prev => [...prev, { role: 'model', text: '🔍 Đang tìm kiếm sự cố...' }]);
  
  try {
    const searchParams = buildIncidentSearchParams(input, lowerInput);
    const response = await api.get(`/incidents?${searchParams.toString()}`);
    const incidents: Incident[] = Array.isArray(response.data) ? response.data : (response.data.data || []);
    
    if (incidents.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '❌ Không tìm thấy sự cố nào phù hợp với tiêu chí tìm kiếm.' 
      }]);
    } else {
      const resultText = buildIncidentResultText(incidents.length, searchParams, lowerInput);
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

export async function handleIdeaSearch(params: CommandHandlerParams, isAdmin: boolean): Promise<boolean> {
  const { input, lowerInput, setMessages } = params;
  
  if (!lowerInput.includes('tìm ý tưởng') && 
      !lowerInput.includes('tìm kiếm ý tưởng') && 
      !lowerInput.includes('tìm hòm trắng') && 
      !lowerInput.includes('tìm hòm hồng') && 
      !lowerInput.includes('tìm white') && 
      !lowerInput.includes('tìm pink')) {
    return false;
  }
  
  if (!isAdmin) {
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: '🚫 **Quyền truy cập bị từ chối**\n\nBạn không có quyền tìm kiếm ý tưởng. Chỉ Administrator mới có quyền này.' 
    }]);
    return true;
  }
  
  setMessages(prev => [...prev, { role: 'model', text: '🔍 Đang tìm kiếm ý tưởng...' }]);
  
  try {
    const searchParams = buildIdeaSearchParams(input, lowerInput);
    const response = await api.get(`/ideas?${searchParams.toString()}`);
    const ideas: Idea[] = Array.isArray(response.data) ? response.data : (response.data.data || []);
    
    if (ideas.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: '❌ Không tìm thấy ý tưởng nào phù hợp với tiêu chí tìm kiếm.' 
      }]);
    } else {
      const resultText = buildIdeaResultText(ideas.length, searchParams, lowerInput);
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
      text: '❌ Có lỗi khi tìm kiếm ý tưởng. Vui lòng thử lại.' 
    }]);
  }
  
  return true;
}

function buildIncidentSearchParams(input: string, lowerInput: string): URLSearchParams {
  const searchParams = new URLSearchParams();
  const { dateFrom, dateTo, keywords, fullDateMatch, month, year, currentYear } = extractDateFilters(input, lowerInput, [
    'tìm', 'kiếm', 'sự cố', 'báo cáo', 'incident', 'trong', 'tháng', 'năm', 'ngày'
  ]);
  
  if (dateFrom && dateTo) {
    searchParams.append('date_from', dateFrom);
    searchParams.append('date_to', dateTo);
  }
  
  if (keywords) {
    searchParams.append('search', keywords);
  }
  
  // Status filters
  if (lowerInput.includes('đang xử lý') || lowerInput.includes('in_progress')) {
    searchParams.append('status', 'in_progress');
  } else if (lowerInput.includes('chờ xử lý') || lowerInput.includes('pending')) {
    searchParams.append('status', 'pending');
  } else if (lowerInput.includes('đã giải quyết') || lowerInput.includes('resolved')) {
    searchParams.append('status', 'resolved');
  } else if (lowerInput.includes('đã đóng') || lowerInput.includes('closed')) {
    searchParams.append('status', 'closed');
  }
  
  // Priority filters
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
  
  return searchParams;
}

function buildIdeaSearchParams(input: string, lowerInput: string): URLSearchParams {
  const searchParams = new URLSearchParams();
  searchParams.append('from_chat', 'true');
  
  // Ideabox type
  if (lowerInput.includes('hòm trắng') || lowerInput.includes('white')) {
    searchParams.append('ideabox_type', 'white');
  } else if (lowerInput.includes('hòm hồng') || lowerInput.includes('pink')) {
    searchParams.append('ideabox_type', 'pink');
  }
  
  const { dateFrom, dateTo, keywords } = extractDateFilters(input, lowerInput, [
    'tìm', 'kiếm', 'ý tưởng', 'hòm trắng', 'hòm hồng', 'white', 'pink', 'trong', 'tháng', 'năm', 'ngày'
  ]);
  
  if (dateFrom && dateTo) {
    searchParams.append('date_from', dateFrom);
    searchParams.append('date_to', dateTo);
  }
  
  if (keywords) {
    searchParams.append('search', keywords);
  }
  
  // Status filters
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
  
  return searchParams;
}

function buildIncidentResultText(count: number, searchParams: URLSearchParams, lowerInput: string): string {
  let resultText = `🔍 **Tìm thấy ${count} sự cố:**`;
  
  if (searchParams.has('date_from') && searchParams.has('date_to')) {
    const dateFrom = new Date(searchParams.get('date_from')!);
    const currentYear = new Date().getFullYear();
    const month = dateFrom.getMonth() + 1;
    const year = dateFrom.getFullYear();
    
    const fullDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
    const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})/i);
    const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
    
    if (fullDateMatch) {
      resultText += `\n📅 Ngày: ${dateFrom.toLocaleDateString('vi-VN')}`;
    } else if (monthMatch && yearMatch) {
      resultText += `\n📅 Tháng ${month}/${year}`;
    } else if (monthMatch) {
      resultText += `\n📅 Tháng ${month}/${currentYear}`;
    } else if (yearMatch) {
      resultText += `\n📅 Năm ${year}`;
    }
  }
  
  resultText += '\n\n💡 Click vào card để xem chi tiết';
  return resultText;
}

function buildIdeaResultText(count: number, searchParams: URLSearchParams, lowerInput: string): string {
  let resultText = `💡 **Tìm thấy ${count} ý tưởng:`;
  
  const ideaboxType = searchParams.get('ideabox_type');
  if (ideaboxType === 'white') {
    resultText += ' (Hòm Trắng)**';
  } else if (ideaboxType === 'pink') {
    resultText += ' (Hòm Hồng)**';
  } else {
    resultText += '**';
  }
  
  if (searchParams.has('date_from') && searchParams.has('date_to')) {
    const dateFrom = new Date(searchParams.get('date_from')!);
    const currentYear = new Date().getFullYear();
    const month = dateFrom.getMonth() + 1;
    const year = dateFrom.getFullYear();
    
    const fullDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
    const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})/i);
    const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
    
    if (fullDateMatch) {
      resultText += `\n📅 Ngày: ${dateFrom.toLocaleDateString('vi-VN')}`;
    } else if (monthMatch && yearMatch) {
      resultText += `\n📅 Tháng ${month}/${year}`;
    } else if (monthMatch) {
      resultText += `\n📅 Tháng ${month}/${currentYear}`;
    } else if (yearMatch) {
      resultText += `\n📅 Năm ${year}`;
    }
  }
  
  resultText += '\n\n💡 Click vào card để xem chi tiết';
  return resultText;
}
