/**
 * Content Extractor - Sử dụng LLM để trích xuất nội dung từ input
 * Phân biệt phần command/intent với phần nội dung thực sự
 */

import api from '../../services/api';

export interface ExtractedContent {
    success: boolean;
    intent: string;
    content: string;
    title?: string;
    category?: string;
    isPriority?: boolean;
    params?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Sử dụng AI để phân tích và trích xuất nội dung từ input
 * AI sẽ phân biệt phần command (tạo tin, đặt phòng, etc.) với phần nội dung
 * 
 * @param input - Câu nhập từ người dùng
 * @param intentId - ID của intent đã được xác định
 */
export async function extractContentWithAI(
    input: string,
    intentId: string
): Promise<ExtractedContent> {
    try {
        console.log(`[ContentExtractor] Extracting content for intent "${intentId}" from: "${input}"`);

        const response = await api.post('/chat/extract-content', {
            input,
            intentId
        });

        if (response.data.success && response.data.data) {
            const result: ExtractedContent = {
                success: true,
                intent: intentId,
                content: response.data.data.content || '',
                title: response.data.data.title,
                category: response.data.data.category,
                isPriority: response.data.data.isPriority || false,
                params: response.data.data.params || {}
            };

            console.log(`[ContentExtractor] AI extracted content:`, result);
            return result;
        }

        return {
            success: false,
            intent: intentId,
            content: input
        };
    } catch (error) {
        console.error('[ContentExtractor] Error calling extract API:', error);
        // Fallback: trả về input gốc
        return {
            success: false,
            intent: intentId,
            content: input
        };
    }
}

/**
 * Fallback extraction khi AI không khả dụng
 * Sử dụng logic đơn giản để tách nội dung
 */
export function extractContentFallback(
    input: string,
    intentId: string
): ExtractedContent {
    let content = input;

    // Các pattern để loại bỏ phần command
    const commandPatterns: Record<string, RegExp[]> = {
        'news_create': [
            /^.*?(?:tạo|viết|đăng|soạn)\s*(?:tin\s*tức?|thông\s*báo)\s*(?:với\s*nội\s*dung|về|là|rằng|như\s*sau|nội\s*dung)?:?\s*/i,
            /^(?:tôi\s*)?(?:muốn|cần|xin|hãy|giúp\s*tôi)?\s*(?:tạo|viết|đăng|soạn)\s*(?:tin\s*tức?|thông\s*báo)\s*/i,
        ],
        'room_booking_create': [
            /^.*?(?:đặt|book)\s*(?:phòng|lịch)\s*(?:họp)?\s*(?:cho|để)?\s*/i,
        ]
    };

    const patterns = commandPatterns[intentId] || [];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[0].length < input.length * 0.7) {
            content = input.substring(match[0].length).trim();
            break;
        }
    }

    // Detect category và priority cho news
    let category = 'company_announcement';
    let isPriority = false;

    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('cảnh báo') || lowerContent.includes('nguy hiểm') || lowerContent.includes('an toàn')) {
        category = 'safety_alert';
    } else if (lowerContent.includes('sự kiện') || lowerContent.includes('sinh nhật') || lowerContent.includes('tiệc') || lowerContent.includes('tổ chức')) {
        category = 'event';
    } else if (lowerContent.includes('bảo trì') || lowerContent.includes('sửa chữa')) {
        category = 'maintenance';
    } else if (lowerContent.includes('sản xuất') || lowerContent.includes('tiến độ')) {
        category = 'production_update';
    }

    if (lowerContent.includes('khẩn') || lowerContent.includes('quan trọng') || lowerContent.includes('gấp')) {
        isPriority = true;
    }

    return {
        success: true,
        intent: intentId,
        content,
        category,
        isPriority
    };
}

export default {
    extractContentWithAI,
    extractContentFallback
};
