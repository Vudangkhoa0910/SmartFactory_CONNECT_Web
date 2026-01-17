import api from './api';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToGemini = async (history: ChatMessage[], newMessage: string) => {
  try {
    // Format history for Gemini API
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add the new message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    // System instruction to guide the AI
    const currentTime = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const systemInstruction = `You are a helpful assistant for the SmartFactory CONNECT application. 
      You help users navigate the app and understand its features.
      
      Current time: ${currentTime}
      
      Here are the main features and their routes:
      - Dashboard/Home: /
      - Incident Reporting (Báo cáo sự cố): /incident-report-page
      - Incident Queue (Hàng đợi sự cố): /incident-queue
      - All Incidents (Tất cả sự cố): /all-incidents-page
      - News (Tin tức): /news
      - Calendar (Lịch): /calendar
      - Feedback/Ideas (Ý tưởng/Sáng kiến): /public-ideas-page
      - Admin Feedback (Hòm hồng): /admin-inbox-pink
      - Kaizen Bank: /kaizen-bank-page
      - User Management (Quản lý người dùng): /users
      - Departments (Phòng ban): /departments
      - Profile (Hồ sơ): /profile
      
      If a user asks to "add news" or "create news", suggest they go to the News page (/news).
      If a user asks to "delete news" or "delete incidents", warn them about data loss and ask for confirmation.
      If a user asks to go to a specific page (e.g., "calendar", "dashboard"), tell them you are taking them there.
      
      Keep your answers concise and helpful. Use formatting like bullet points if needed.`;

    const finalContents = [
      {
        role: 'user',
        parts: [{ text: systemInstruction }]
      },
      {
        role: 'model',
        parts: [{ text: 'Understood. I am ready to assist users with SmartFactory CONNECT.' }]
      },
      ...contents
    ];

    // Call backend proxy instead of direct Google API
    const response = await api.post('/chat/message', { contents: finalContents });

    if (response.data.success) {
      return response.data.text;
    }

    return "Sorry, I couldn't understand that.";
  } catch (error) {
    console.error("Error calling Chat API:", error);
    return "Sorry, I'm having trouble connecting to the AI service right now.";
  }
};

export const generateNewsContent = async (userInput: string) => {
  try {
    const prompt = `
      User wants to create a news article based on this input: "${userInput}".
      
      Please generate a JSON object with the following fields:
      - title: A suitable title in Vietnamese.
      - content: A detailed, professional news content in Vietnamese (at least 3 paragraphs).
      - excerpt: A short summary (1-2 sentences) of the news.
      - category: One of the following values based on the input: 
        'company_announcement', 'policy_update', 'event', 'achievement', 'safety_alert', 
        'maintenance', 'training', 'welfare', 'newsletter', 'emergency', 'other'.
      - is_priority: boolean (true if the input contains words like "quan trọng", "khẩn cấp", "ưu tiên", "important", "urgent", otherwise false).
      
      Map 'cảnh báo an toàn' to 'safety_alert'.
      Map 'thông báo' to 'company_announcement'.
      Map 'sự kiện' to 'event'.
      Map 'bảo trì' to 'maintenance'.
      Map 'đào tạo' to 'training'.
      Map 'thành tích' to 'achievement'.
      Map 'chính sách' to 'policy_update'.
      Map 'phúc lợi' to 'welfare'.
      Map 'khẩn cấp' to 'emergency'.
      Map 'cập nhật sản xuất' to 'company_announcement'.
      
      Return ONLY the JSON object, no markdown formatting.
    `;

    // Call backend proxy
    const response = await api.post('/chat/generate-news', { prompt });

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("Error generating news content:", error);
    return null;
  }
};

/**
 * Tạo tin tức từ nội dung đã được trích xuất sơ bộ
 */
export const generateNewsFromExtracted = async (data: {
  title: string;
  category: string;
  is_priority: boolean;
  content: string;
}) => {
  try {
    const prompt = `
      Bạn là chuyên gia soạn thảo bản tin nhà máy chuyên nghiệp.
      Dựa trên thông tin thô sau đây, hãy viết một bản tin hoàn chỉnh, chuyên nghiệp và hấp dẫn.

      THÔNG TIN THÔ:
      - Tiêu đề gốc: ${data.title}
      - Danh mục: ${data.category}
      - Ưu tiên: ${data.is_priority ? 'Cao' : 'Bình thường'}
      - Nội dung chính: ${data.content}

      YÊU CẦU:
      1. Viết lại tiêu đề cho chuyên nghiệp hơn.
      2. Mở rộng nội dung thành một bản tin đầy đủ (2-3 đoạn văn), ngôn ngữ trang trọng và rõ ràng.
      3. Tạo một đoạn tóm tắt ngắn (excerpt) 150-200 ký tự.
      4. Giữ nguyên độ ưu tiên.

      CẤU TRÚC JSON TRẢ VỀ:
      {
        "title": "Tiêu đề đã cải thiện",
        "content": "Nội dung bản tin chi tiết",
        "excerpt": "Đo đoạn tóm tắt ngắn",
        "is_priority": ${data.is_priority}
      }

      Chỉ trả về DUY NHẤT một JSON object, không có markdown formatting hay văn bản giải thích.
    `;

    const response = await api.post('/chat/generate-news', { prompt });

    if (response.data.success) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("Error generating news from extracted:", error);
    return null;
  }
};
