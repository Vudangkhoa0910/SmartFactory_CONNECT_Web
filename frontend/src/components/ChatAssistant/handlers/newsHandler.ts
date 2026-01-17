
import api from '../../../services/api';
import { generateNewsContent } from '../../../services/gemini';
import { CommandHandlerParams } from '../command.types';

export async function handleNewsCreation(params: CommandHandlerParams): Promise<boolean> {
  const { input, lowerInput, setMessages } = params;
  
  if (!lowerInput.includes('tạo tin')) return false;
  
  const cleanInput = lowerInput.replace('tạo tin', '').replace('tức', '').trim();
  
  if (cleanInput.length < 5) {
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: `Hướng dẫn tạo tin tức nhanh:\n\nHãy gõ lệnh theo cú pháp:\n\`tạo tin [nội dung chính] [tính chất]\`\n\nVí dụ:\n- "Tạo tin cảnh báo cháy tại khu vực A quan trọng"\n- "Tạo tin thông báo bảo trì máy CNC ngày mai"\n- "Tạo tin chúc mừng sinh nhật tháng 11"\n\nTôi sẽ tự động phân tích nội dung, tiêu đề và mức độ ưu tiên để tạo tin tức cho bạn.` 
    }]);
    return true;
  }

  setMessages(prev => [...prev, { role: 'model', text: 'Đang phân tích yêu cầu và soạn thảo tin tức...' }]);
  
  try {
    const generatedNews = await generateNewsContent(input);
    
    if (generatedNews) {
      const newsData = {
        category: 'company_announcement',
        target_audience: 'all',
        status: 'published',
        ...generatedNews
      };

      const response = await api.post('/news', newsData);
      
      if (response.data?.success) {
        const createdNews = response.data.data;
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: `Đã tạo tin tức thành công!\n\nTiêu đề: ${createdNews.title}\nDanh mục: ${createdNews.category}\nƯu tiên: ${createdNews.is_priority ? 'Cao 🔴' : 'Bình thường 🔵'}\n\n*Tin tức đã được xuất bản lên hệ thống.*` 
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
