/**
 * Intent Matcher - Sử dụng file JSON registry để match intent từ input người dùng
 * Hỗ trợ: exact match, normalized match (bỏ dấu), fuzzy match (xử lý typo)
 * 
 * HYBRID MODE: Kết hợp keyword matching + LLM semantic fallback
 * - Bước 1: Keyword matching nhanh (local)
 * - Bước 2: Nếu confidence thấp, gọi LLM để xác nhận/tìm intent phù hợp
 */

import apiRegistry from './chatbot-api-registry.json';
import { fuzzyMatch, normalizeVietnamese } from './utils/textMatcher';
import { matchIntentSemantic, semanticResultToMatchedIntent } from './semanticMatcher';

// Ngưỡng confidence để quyết định có cần gọi LLM không
const SEMANTIC_FALLBACK_THRESHOLD = 0.7;
// Ngưỡng tối thiểu để accept keyword match mà không cần LLM
const HIGH_CONFIDENCE_THRESHOLD = 0.85;

export interface MatchedIntent {
    id: string;
    name: string;
    description: string;
    category: string;
    route: string | null;
    api: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    handler: string | null;
    confidence: number;
    extractedParams: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    pattern?: string;
    usesAI?: boolean;
    requiredRole: string | null;
    matchMethod?: string; // 'exact' | 'normalized' | 'fuzzy' | 'partial_fuzzy'
}

export interface IntentRegistry {
    version: string;
    description: string;
    lastUpdated: string;
    intents: IntentDefinition[];
    categories: Record<string, CategoryDefinition>;
    meetingTypes: Record<string, MeetingTypeDefinition>;
    datePatterns: Record<string, PatternDefinition>;
    timePatterns: Record<string, PatternDefinition>;
}

export interface IntentDefinition {
    id: string;
    name: string;
    description: string;
    category: string;
    route: string | null;
    keywords: string[];
    shortcut?: string[];
    examples: string[];
    requiredRole: string | null;
    api: any | null; // eslint-disable-line @typescript-eslint/no-explicit-any
    pattern?: string;
    handler?: string;
    usesAI?: boolean;
}

export interface CategoryDefinition {
    name: string;
    description: string;
    icon: string;
}

export interface MeetingTypeDefinition {
    label: string;
    keywords: string[];
}

export interface PatternDefinition {
    pattern: string;
    description: string;
}

// Cache registry
const registry: IntentRegistry = apiRegistry as IntentRegistry;

/**
 * Tìm intent phù hợp nhất từ input người dùng (đồng bộ - chỉ keyword matching)
 * Sử dụng 3 phương pháp: exact match → normalized match → fuzzy match
 */
export function matchIntent(input: string, userRole: string | null): MatchedIntent | null {
    return matchIntentByKeyword(input, userRole);
}

/**
 * HYBRID MATCHING: Kết hợp keyword matching + LLM semantic fallback
 * - Nếu keyword match có confidence >= HIGH_CONFIDENCE_THRESHOLD: return ngay
 * - Nếu keyword match có confidence < SEMANTIC_FALLBACK_THRESHOLD: gọi LLM
 * - Nếu không match keyword: gọi LLM
 * 
 * @param input - Input từ người dùng
 * @param userRole - Role của user để filter intents
 * @param useSemantic - Có sử dụng LLM fallback không (default: true)
 */
export async function matchIntentHybrid(
    input: string,
    userRole: string | null,
    useSemantic: boolean = true
): Promise<MatchedIntent | null> {
    // Bước 1: Thử keyword matching trước (nhanh, miễn phí)
    const keywordMatch = matchIntentByKeyword(input, userRole);

    // Nếu có high confidence match, return ngay
    if (keywordMatch && keywordMatch.confidence >= HIGH_CONFIDENCE_THRESHOLD) {
        console.log(`[HybridMatcher] High confidence keyword match: ${keywordMatch.id} (${keywordMatch.confidence.toFixed(2)})`);
        return keywordMatch;
    }

    // Bước 2: Nếu không chắc chắn và useSemantic = true, gọi LLM
    if (useSemantic) {
        // Kiểm tra các điều kiện cần gọi LLM
        const needsSemanticMatch =
            !keywordMatch || // Không có keyword match
            keywordMatch.confidence < SEMANTIC_FALLBACK_THRESHOLD || // Confidence thấp
            keywordMatch.matchMethod === 'fuzzy' || // Fuzzy match (có thể không chính xác)
            keywordMatch.matchMethod === 'partial_fuzzy';

        if (needsSemanticMatch) {
            console.log(`[HybridMatcher] Low confidence or no keyword match, calling LLM semantic matcher...`);
            console.log(`[HybridMatcher] Keyword match: ${keywordMatch?.id || 'none'} (${keywordMatch?.confidence?.toFixed(2) || 'N/A'})`);

            try {
                const semanticResult = await matchIntentSemantic(input, userRole);

                // Nếu LLM tìm được intent với confidence cao hơn
                if (semanticResult.intentId && semanticResult.confidence > (keywordMatch?.confidence || 0)) {
                    const semanticMatch = semanticResultToMatchedIntent(
                        semanticResult,
                        getAvailableIntents(userRole)
                    );

                    if (semanticMatch) {
                        console.log(`[HybridMatcher] LLM found better match: ${semanticMatch.id} (${semanticMatch.confidence.toFixed(2)})`);
                        // Merge extracted params từ keyword match nếu có
                        if (keywordMatch?.extractedParams) {
                            semanticMatch.extractedParams = {
                                ...keywordMatch.extractedParams,
                                ...semanticMatch.extractedParams,
                                semanticReason: semanticResult.reason
                            };
                        }
                        return semanticMatch;
                    }
                }

                // Nếu LLM xác nhận keyword match
                if (semanticResult.intentId === keywordMatch?.id) {
                    console.log(`[HybridMatcher] LLM confirmed keyword match: ${keywordMatch.id}`);
                    // Boost confidence vì được LLM xác nhận
                    const confirmedMatch = {
                        ...keywordMatch,
                        confidence: Math.min(keywordMatch.confidence + 0.1, 0.95),
                        extractedParams: {
                            ...keywordMatch.extractedParams,
                            llmConfirmed: true,
                            semanticReason: semanticResult.reason
                        }
                    };
                    return confirmedMatch;
                }
            } catch (error) {
                console.error('[HybridMatcher] Error calling semantic matcher:', error);
                // Fallback to keyword match nếu LLM fail
            }
        }
    }

    // Return keyword match (hoặc null nếu không có)
    return keywordMatch;
}

/**
 * Keyword-based intent matching (internal function)
 */
function matchIntentByKeyword(input: string, userRole: string | null): MatchedIntent | null {
    const lowerInput = input.toLowerCase().trim();
    const normalizedInput = normalizeVietnamese(lowerInput);

    // Kiểm tra shortcuts trước (h, ?)
    for (const intent of registry.intents) {
        if (intent.shortcut) {
            for (const shortcut of intent.shortcut) {
                if (lowerInput === shortcut || normalizedInput === shortcut) {
                    return createMatchedIntent(intent, 1.0, {}, 'exact');
                }
            }
        }
    }

    // Danh sách action verbs để phát hiện action intents
    const actionVerbs = ['tạo', 'tao', 'thêm', 'them', 'đăng', 'dang', 'viết', 'viet', 'soạn', 'soan', 'tìm', 'tim', 'tra', 'đặt', 'dat', 'book', 'hủy', 'huy', 'xóa', 'xoa', 'sửa', 'sua', 'cập nhật', 'cap nhat'];
    const hasActionVerb = actionVerbs.some(verb => lowerInput.includes(verb) || normalizedInput.includes(verb));

    // Tìm tất cả các intent có thể match
    const matches: Array<{
        intent: IntentDefinition;
        confidence: number;
        extractedParams: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        matchMethod: string;
    }> = [];

    for (const intent of registry.intents) {
        // Kiểm tra quyền
        if (intent.requiredRole && intent.requiredRole !== userRole && userRole !== 'admin') {
            continue;
        }

        // QUAN TRỌNG: Nếu có action verb, giảm priority của navigation intents
        // Trừ khi đây là navigation cụ thể như "đến lịch đặt phòng"
        if (hasActionVerb && intent.category === 'navigation') {
            // Kiểm tra xem input có chứa từ khóa điều hướng rõ ràng không
            const navKeywords = ['đến', 'den', 'đi đến', 'di den', 'mở trang', 'mo trang', 'xem trang', 'chuyển đến', 'chuyen den'];
            const hasNavKeyword = navKeywords.some(kw => lowerInput.includes(kw) || normalizedInput.includes(kw));

            // Nếu không có từ khóa điều hướng rõ ràng, skip navigation intents
            if (!hasNavKeyword) {
                continue;
            }
        }

        // Kiểm tra pattern regex nếu có
        if (intent.pattern) {
            const regex = new RegExp(intent.pattern, 'i');
            const match = lowerInput.match(regex);
            if (match) {
                matches.push({
                    intent,
                    confidence: 0.95,
                    extractedParams: { regexMatch: match },
                    matchMethod: 'regex'
                });
                continue;
            }
        }

        // Kiểm tra keywords với fuzzy matching
        let bestMatch = { score: 0, keyword: '', method: 'none' };

        for (const keyword of intent.keywords) {
            // Sử dụng fuzzy matching (bao gồm exact, normalized, và fuzzy)
            // Threshold 0.6 để cho phép typo (ví dụ: "taoj tin" → "tạo tin")
            const result = fuzzyMatch(lowerInput, keyword, 0.6);

            if (result.isMatch && result.score > bestMatch.score) {
                bestMatch = {
                    score: result.score,
                    keyword: keyword,
                    method: result.method
                };
            }
        }

        if (bestMatch.score > 0) {
            // Debug log
            console.log(`[IntentMatcher] Matched "${lowerInput}" → intent "${intent.id}" via keyword "${bestMatch.keyword}" (${bestMatch.method}, score: ${bestMatch.score.toFixed(2)})`);

            // Tính confidence dựa trên tỉ lệ keyword chiếm trong input
            const keywordScore = bestMatch.keyword.length / lowerInput.length;
            const positionBonus = lowerInput.startsWith(bestMatch.keyword.toLowerCase()) ? 0.05 : 0;

            // BONUS: Ưu tiên keywords dài hơn (dài hơn = cụ thể hơn)
            // Keywords cực ngắn (<= 2 ký tự) bị phạt nặng nếu không phải exact match nguyên từ
            let shortKeywordPenalty = 0;
            if (bestMatch.keyword.length <= 2) {
                // Kiểm tra xem có phải match nguyên từ không
                const wordRegex = new RegExp(`\\b${bestMatch.keyword}\\b`, 'i');
                if (!wordRegex.test(lowerInput)) {
                    shortKeywordPenalty = 0.3;
                } else if (lowerInput.length > 20) {
                    // Nếu là từ ngắn trong câu dài, vẫn giảm confidence
                    shortKeywordPenalty = 0.15;
                }
            }

            const lengthBonus = Math.min(bestMatch.keyword.length / 30, 0.15);

            // Điều chỉnh confidence theo method
            let methodMultiplier = 1.0;
            if (bestMatch.method === 'normalized') methodMultiplier = 0.95;
            if (bestMatch.method === 'fuzzy') methodMultiplier = 0.85;
            if (bestMatch.method === 'partial_fuzzy') methodMultiplier = 0.7;
            if (bestMatch.method === 'single_word_fuzzy') methodMultiplier = 0.75;

            // BONUS: Boost mạnh hơn cho action categories khi có action verb
            let categoryBonus = 0;
            if (hasActionVerb && intent.category !== 'navigation' && intent.category !== 'help') {
                categoryBonus = 0.15;

                // EXTRA BONUS: Nếu keyword chứa action verb đang match
                const matchedActionVerb = actionVerbs.find(verb => bestMatch.keyword.toLowerCase().includes(verb));
                if (matchedActionVerb) {
                    categoryBonus += 0.05;
                }
            }

            const confidence = Math.max(0.1, Math.min(
                (0.42 + keywordScore * 0.4 + bestMatch.score * 0.2 + positionBonus + lengthBonus + categoryBonus - shortKeywordPenalty) * methodMultiplier,
                0.98
            ));

            matches.push({
                intent,
                confidence,
                extractedParams: {
                    matchedKeyword: bestMatch.keyword,
                    matchMethod: bestMatch.method,
                    matchScore: bestMatch.score
                },
                matchMethod: bestMatch.method
            });
        }
    }

    // Sắp xếp theo confidence giảm dần
    matches.sort((a, b) => b.confidence - a.confidence);

    // Debug: Log all matches
    if (matches.length > 0) {
        console.log(`[IntentMatcher] Top matches for "${lowerInput}":`, matches.slice(0, 3).map(m => `${m.intent.id} (${m.confidence.toFixed(2)})`));
    } else {
        console.log(`[IntentMatcher] No match found for "${lowerInput}"`);
    }

    // Trả về intent có confidence cao nhất
    if (matches.length > 0) {
        const best = matches[0];
        const extractedParams = extractParameters(input, best.intent, best.extractedParams);
        return createMatchedIntent(best.intent, best.confidence, extractedParams, best.matchMethod);
    }

    return null;
}

/**
 * Trích xuất parameters từ input dựa trên định nghĩa API
 */
function extractParameters(
    input: string,
    intent: IntentDefinition,
    baseParams: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
): Record<string, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    const params = { ...baseParams };
    const lowerInput = input.toLowerCase();

    // Trích xuất ngày tháng
    const dateInfo = extractDateFromInput(input);
    if (dateInfo) {
        params.dateInfo = dateInfo;
    }

    // Trích xuất khoảng thời gian
    const timeInfo = extractTimeFromInput(input);
    if (timeInfo) {
        params.timeInfo = timeInfo;
    }

    // Trích xuất số người (cho room booking)
    const attendeesMatch = input.match(/(\d+)\s*(người|nguoi|ngưở|person|people)/i);
    if (attendeesMatch) {
        params.attendees = parseInt(attendeesMatch[1]);
    }

    // Trích xuất loại cuộc họp
    const meetingType = extractMeetingType(lowerInput);
    if (meetingType) {
        params.meetingType = meetingType;
    }

    // Trích xuất status từ API definition nếu có
    if (intent.api?.params?.status?.keywords) {
        for (const [statusValue, keywords] of Object.entries(intent.api.params.status.keywords as Record<string, string[]>)) {
            for (const keyword of keywords) {
                if (lowerInput.includes(keyword)) {
                    params.status = statusValue;
                    break;
                }
            }
            if (params.status) break;
        }
    }

    // Trích xuất priority từ API definition nếu có
    if (intent.api?.params?.priority?.keywords) {
        for (const [priorityValue, keywords] of Object.entries(intent.api.params.priority.keywords as Record<string, string[]>)) {
            for (const keyword of keywords) {
                if (lowerInput.includes(keyword)) {
                    params.priority = priorityValue;
                    break;
                }
            }
            if (params.priority) break;
        }
    }

    // Trích xuất ideabox_type từ API definition nếu có
    if (intent.api?.params?.ideabox_type?.keywords) {
        for (const [typeValue, keywords] of Object.entries(intent.api.params.ideabox_type.keywords as Record<string, string[]>)) {
            for (const keyword of keywords) {
                if (lowerInput.includes(keyword)) {
                    params.ideabox_type = typeValue;
                    break;
                }
            }
            if (params.ideabox_type) break;
        }
    }

    // Trích xuất news category từ API definition nếu có (cho tạo tin tức)
    if (intent.api?.params?.category?.keywords) {
        for (const [categoryValue, keywords] of Object.entries(intent.api.params.category.keywords as Record<string, string[]>)) {
            for (const keyword of keywords) {
                if (lowerInput.includes(keyword)) {
                    params.newsCategory = categoryValue;
                    break;
                }
            }
            if (params.newsCategory) break;
        }
    }

    return params;
}

/**
 * Trích xuất thông tin ngày tháng từ input
 */
function extractDateFromInput(input: string): { date?: string; month?: number; year?: number; dateFrom?: string; dateTo?: string } | null {
    const lowerInput = input.toLowerCase();
    const currentYear = new Date().getFullYear();
    const result: { date?: string; month?: number; year?: number; dateFrom?: string; dateTo?: string } = {};

    // Pattern: ngày DD tháng MM năm YYYY
    const fullDateMatch = input.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i);
    if (fullDateMatch) {
        const day = parseInt(fullDateMatch[1]);
        const month = parseInt(fullDateMatch[2]);
        const year = fullDateMatch[3] ? parseInt(fullDateMatch[3]) : currentYear;
        result.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return result;
    }

    // Pattern: DD/MM/YYYY hoặc DD-MM-YYYY
    const slashDateMatch = lowerInput.match(/(?:ngày\s+)?(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/);
    if (slashDateMatch) {
        const day = parseInt(slashDateMatch[1]);
        const month = parseInt(slashDateMatch[2]);
        let year = currentYear;
        if (slashDateMatch[3]) {
            year = slashDateMatch[3].length === 2 ? 2000 + parseInt(slashDateMatch[3]) : parseInt(slashDateMatch[3]);
        }

        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const startDate = new Date(year, month - 1, day);
        const endDate = new Date(year, month - 1, day, 23, 59, 59);

        result.date = dateStr;
        result.dateFrom = startDate.toISOString();
        result.dateTo = endDate.toISOString();
        return result;
    }

    // Pattern: tháng MM (năm YYYY)
    const monthMatch = lowerInput.match(/(?:tháng|t)\s*(\d{1,2})(?:\s*[/-]?\s*(\d{4}))?/i);
    if (monthMatch) {
        result.month = parseInt(monthMatch[1]);
        result.year = monthMatch[2] ? parseInt(monthMatch[2]) : currentYear;

        const startDate = new Date(result.year, result.month - 1, 1);
        const endDate = new Date(result.year, result.month, 0, 23, 59, 59);
        result.dateFrom = startDate.toISOString();
        result.dateTo = endDate.toISOString();
        return result;
    }

    // Pattern: năm YYYY
    const yearMatch = lowerInput.match(/(?:năm\s+)?(\d{4})/);
    if (yearMatch) {
        result.year = parseInt(yearMatch[1]);
        const startDate = new Date(result.year, 0, 1);
        const endDate = new Date(result.year, 11, 31, 23, 59, 59);
        result.dateFrom = startDate.toISOString();
        result.dateTo = endDate.toISOString();
        return result;
    }

    return null;
}

/**
 * Trích xuất thông tin thời gian từ input
 */
function extractTimeFromInput(input: string): { startTime?: string; endTime?: string } | null {
    const timeMatch = input.match(/từ\s+(\d{1,2})(?::(\d{2}))?\s*(?:giờ|h)?\s*đến\s+(\d{1,2})(?::(\d{2}))?\s*(?:giờ|h)?/i);
    if (timeMatch) {
        const startHour = parseInt(timeMatch[1]);
        const startMin = timeMatch[2] || '00';
        const endHour = parseInt(timeMatch[3]);
        const endMin = timeMatch[4] || '00';

        return {
            startTime: `${startHour.toString().padStart(2, '0')}:${startMin}`,
            endTime: `${endHour.toString().padStart(2, '0')}:${endMin}`
        };
    }
    return null;
}

/**
 * Trích xuất loại cuộc họp từ input
 */
function extractMeetingType(lowerInput: string): string | null {
    for (const [type, definition] of Object.entries(registry.meetingTypes)) {
        for (const keyword of definition.keywords) {
            if (lowerInput.includes(keyword)) {
                return type;
            }
        }
    }
    return null;
}

/**
 * Tạo MatchedIntent từ IntentDefinition
 */
function createMatchedIntent(
    intent: IntentDefinition,
    confidence: number,
    extractedParams: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    matchMethod: string = 'exact'
): MatchedIntent {
    return {
        id: intent.id,
        name: intent.name,
        description: intent.description,
        category: intent.category,
        route: intent.route,
        api: intent.api,
        handler: intent.handler || null,
        confidence,
        extractedParams,
        pattern: intent.pattern,
        usesAI: intent.usesAI,
        requiredRole: intent.requiredRole,
        matchMethod
    };
}

/**
 * Lấy tất cả các intent có thể theo category
 */
export function getIntentsByCategory(category: string): IntentDefinition[] {
    return registry.intents.filter(intent => intent.category === category);
}

/**
 * Lấy thông tin category
 */
export function getCategory(categoryId: string): CategoryDefinition | null {
    return registry.categories[categoryId] || null;
}

/**
 * Lấy tất cả categories
 */
export function getAllCategories(): Record<string, CategoryDefinition> {
    return registry.categories;
}

/**
 * Lấy thông tin meeting type
 */
export function getMeetingType(typeId: string): MeetingTypeDefinition | null {
    return registry.meetingTypes[typeId] || null;
}

/**
 * Lấy tất cả meeting types
 */
export function getAllMeetingTypes(): Record<string, MeetingTypeDefinition> {
    return registry.meetingTypes;
}

/**
 * Lấy tất cả intents cho một role cụ thể
 */
export function getAvailableIntents(userRole: string | null): IntentDefinition[] {
    return registry.intents.filter(intent => {
        if (!intent.requiredRole) return true;
        if (userRole === 'admin') return true;
        return intent.requiredRole === userRole;
    });
}

/**
 * Lấy registry để sử dụng trực tiếp
 */
export function getRegistry(): IntentRegistry {
    return registry;
}

export default {
    matchIntent,
    matchIntentHybrid,
    getIntentsByCategory,
    getCategory,
    getAllCategories,
    getMeetingType,
    getAllMeetingTypes,
    getAvailableIntents,
    getRegistry
};
