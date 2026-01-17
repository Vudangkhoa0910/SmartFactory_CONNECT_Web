/**
 * Semantic Intent Matcher - Sử dụng LLM để nhận diện intent dựa trên ngữ nghĩa
 * Được sử dụng như fallback khi keyword matching không đủ tin cậy
 */

import api from '../../services/api';
import { IntentDefinition, MatchedIntent, getAvailableIntents } from './intentMatcher';

export interface SemanticMatchResult {
    intentId: string | null;
    confidence: number;
    reason: string;
    params?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Cache kết quả semantic matching để giảm API calls
const semanticCache = new Map<string, { result: SemanticMatchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

/**
 * Chuẩn bị danh sách intent để gửi cho LLM
 * Chỉ gửi thông tin cần thiết để tiết kiệm token
 */
function prepareIntentsForLLM(intents: IntentDefinition[]): Array<{
    id: string;
    name: string;
    description: string;
    examples: string[];
    category: string;
}> {
    return intents.map(intent => ({
        id: intent.id,
        name: intent.name,
        description: intent.description,
        examples: intent.examples.slice(0, 3), // Chỉ lấy 3 ví dụ đầu
        category: intent.category
    }));
}

/**
 * Gọi LLM để phân tích semantic và chọn intent phù hợp nhất
 */
export async function matchIntentSemantic(
    input: string,
    userRole: string | null
): Promise<SemanticMatchResult> {
    // Kiểm tra cache
    const cacheKey = `${input.toLowerCase().trim()}:${userRole}`;
    const cached = semanticCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[SemanticMatcher] Using cached result for:', input);
        return cached.result;
    }

    try {
        // Lấy danh sách intent có sẵn cho role hiện tại
        const availableIntents = getAvailableIntents(userRole);
        const intentList = prepareIntentsForLLM(availableIntents);

        console.log('[SemanticMatcher] Calling LLM for semantic matching:', input);
        console.log('[SemanticMatcher] Available intents:', intentList.length);

        // Gọi API backend để xử lý semantic matching
        const response = await api.post('/chat/semantic-match', {
            input,
            intents: intentList,
            userRole
        });

        if (response.data.success && response.data.data) {
            const result: SemanticMatchResult = {
                intentId: response.data.data.intentId || null,
                confidence: response.data.data.confidence || 0,
                reason: response.data.data.reason || '',
                params: response.data.data.params || {}
            };

            // Cache kết quả
            semanticCache.set(cacheKey, { result, timestamp: Date.now() });

            console.log('[SemanticMatcher] LLM result:', result);
            return result;
        }

        return {
            intentId: null,
            confidence: 0,
            reason: 'LLM không thể xác định intent'
        };
    } catch (error) {
        console.error('[SemanticMatcher] Error calling semantic match API:', error);
        return {
            intentId: null,
            confidence: 0,
            reason: 'Lỗi kết nối API'
        };
    }
}

/**
 * Chuyển đổi SemanticMatchResult thành MatchedIntent
 */
export function semanticResultToMatchedIntent(
    result: SemanticMatchResult,
    intents: IntentDefinition[]
): MatchedIntent | null {
    if (!result.intentId || result.confidence < 0.5) {
        return null;
    }

    const intent = intents.find(i => i.id === result.intentId);
    if (!intent) {
        return null;
    }

    return {
        id: intent.id,
        name: intent.name,
        description: intent.description,
        category: intent.category,
        route: intent.route,
        api: intent.api,
        handler: intent.handler || null,
        confidence: result.confidence,
        extractedParams: result.params || {},
        pattern: intent.pattern,
        usesAI: true,
        requiredRole: intent.requiredRole,
        matchMethod: 'semantic_llm'
    };
}

/**
 * Xóa cache (dùng khi cập nhật intent registry)
 */
export function clearSemanticCache(): void {
    semanticCache.clear();
    console.log('[SemanticMatcher] Cache cleared');
}

/**
 * Lấy thông tin cache (cho debugging)
 */
export function getSemanticCacheStats(): { size: number; keys: string[] } {
    return {
        size: semanticCache.size,
        keys: Array.from(semanticCache.keys())
    };
}

export default {
    matchIntentSemantic,
    semanticResultToMatchedIntent,
    clearSemanticCache,
    getSemanticCacheStats
};
