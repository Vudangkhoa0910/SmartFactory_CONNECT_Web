/**
 * Text Matching Utilities - Xử lý typo và normalize tiếng Việt
 * Giúp chatbot linh hoạt hơn khi nhận diện intent
 */

/**
 * Bảng chuyển đổi ký tự tiếng Việt có dấu sang không dấu
 */
const VIETNAMESE_MAP: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D'
};

/**
 * Chuyển đổi chuỗi tiếng Việt có dấu sang không dấu
 * @example normalizeVietnamese("tạo tin") → "tao tin"
 */
export function normalizeVietnamese(str: string): string {
    return str.split('').map(char => VIETNAMESE_MAP[char] || char).join('');
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 * Khoảng cách = số thao tác tối thiểu để biến đổi str1 thành str2
 * (thêm, xóa, thay thế ký tự)
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Tạo ma trận DP
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    // Khởi tạo hàng đầu và cột đầu
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Tính toán
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],     // Xóa
                    dp[i][j - 1],     // Thêm
                    dp[i - 1][j - 1]  // Thay thế
                );
            }
        }
    }

    return dp[m][n];
}

/**
 * Tính độ tương đồng giữa 2 chuỗi (0-1)
 * 1 = giống hoàn toàn, 0 = khác hoàn toàn
 */
export function similarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1.0;

    const distance = levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
}

/**
 * Kiểm tra 2 chuỗi có "gần giống" nhau không
 * Sử dụng cả normalize tiếng Việt và fuzzy matching
 * 
 * @param input - Chuỗi người dùng nhập
 * @param keyword - Từ khóa cần so sánh
 * @param threshold - Ngưỡng tương đồng tối thiểu (0-1), mặc định 0.6
 * @returns { isMatch: boolean, score: number, method: string }
 */
export function fuzzyMatch(
    input: string,
    keyword: string,
    threshold: number = 0.6  // Giảm từ 0.7 xuống 0.6
): { isMatch: boolean; score: number; method: string } {
    const lowerInput = input.toLowerCase().trim();
    const lowerKeyword = keyword.toLowerCase().trim();

    // 1. Exact match - điểm cao nhất
    if (lowerInput.includes(lowerKeyword)) {
        return { isMatch: true, score: 1.0, method: 'exact' };
    }

    // 2. Normalize match (bỏ dấu tiếng Việt)
    const normalizedInput = normalizeVietnamese(lowerInput);
    const normalizedKeyword = normalizeVietnamese(lowerKeyword);

    if (normalizedInput.includes(normalizedKeyword)) {
        return { isMatch: true, score: 0.95, method: 'normalized' };
    }

    // 3. Fuzzy match - tìm từng từ trong input có giống keyword không
    const inputWords = lowerInput.split(/\s+/);
    const keywordWords = lowerKeyword.split(/\s+/);

    // So sánh từng cụm từ
    for (let i = 0; i <= inputWords.length - keywordWords.length; i++) {
        const inputPhrase = inputWords.slice(i, i + keywordWords.length).join(' ');
        const normalizedInputPhrase = normalizeVietnamese(inputPhrase);

        // So sánh fuzzy với cả có dấu và không dấu
        const similarityWithAccent = similarity(inputPhrase, lowerKeyword);
        const similarityWithoutAccent = similarity(normalizedInputPhrase, normalizedKeyword);
        const maxSimilarity = Math.max(similarityWithAccent, similarityWithoutAccent);

        // Debug log
        if (process.env.NODE_ENV === 'development') {
            console.log(`[FuzzyMatch] "${inputPhrase}" vs "${lowerKeyword}" → accented: ${similarityWithAccent.toFixed(2)}, normalized: ${similarityWithoutAccent.toFixed(2)}`);
        }

        if (maxSimilarity >= threshold) {
            return {
                isMatch: true,
                score: maxSimilarity * 0.9, // Giảm điểm so với exact match
                method: 'fuzzy'
            };
        }
    }

    // 4. Partial fuzzy - kiểm tra từng từ riêng lẻ của keyword
    // Giảm threshold cho partial match
    const partialThreshold = threshold * 0.85;

    if (keywordWords.length > 1) {
        let matchedWords = 0;
        let totalScore = 0;

        for (const kw of keywordWords) {
            const normalizedKw = normalizeVietnamese(kw);
            let bestWordScore = 0;

            for (const iw of inputWords) {
                const normalizedIw = normalizeVietnamese(iw);
                const wordSim = Math.max(
                    similarity(iw, kw),
                    similarity(normalizedIw, normalizedKw)
                );

                // Debug log for word-level matching
                if (process.env.NODE_ENV === 'development' && wordSim > 0.5) {
                    console.log(`[FuzzyMatch Word] "${iw}" vs "${kw}" → ${wordSim.toFixed(2)}`);
                }

                bestWordScore = Math.max(bestWordScore, wordSim);
            }

            if (bestWordScore >= partialThreshold) {
                matchedWords++;
                totalScore += bestWordScore;
            }
        }

        // Nếu hầu hết các từ trong keyword đều match
        const matchRatio = matchedWords / keywordWords.length;
        if (matchRatio >= 0.6) {  // Giảm từ 0.7 xuống 0.6
            const avgScore = totalScore / keywordWords.length;
            return {
                isMatch: true,
                score: avgScore * 0.8 * matchRatio, // Điểm thấp hơn fuzzy match đầy đủ
                method: 'partial_fuzzy'
            };
        }
    }

    // 5. Single word fuzzy - cho keyword chỉ có 1 từ
    if (keywordWords.length === 1) {
        for (const iw of inputWords) {
            const normalizedIw = normalizeVietnamese(iw);
            const wordSim = Math.max(
                similarity(iw, lowerKeyword),
                similarity(normalizedIw, normalizedKeyword)
            );

            if (wordSim >= threshold) {
                return {
                    isMatch: true,
                    score: wordSim * 0.85,
                    method: 'single_word_fuzzy'
                };
            }
        }
    }

    return { isMatch: false, score: 0, method: 'none' };
}

/**
 * Tìm keyword phù hợp nhất trong danh sách
 */
export function findBestMatch(
    input: string,
    keywords: string[],
    threshold: number = 0.7
): { keyword: string | null; score: number; method: string } {
    let bestMatch: { keyword: string | null; score: number; method: string } = {
        keyword: null,
        score: 0,
        method: 'none'
    };

    for (const keyword of keywords) {
        const result = fuzzyMatch(input, keyword, threshold);
        if (result.isMatch && result.score > bestMatch.score) {
            bestMatch = {
                keyword,
                score: result.score,
                method: result.method
            };
        }
    }

    return bestMatch;
}

/**
 * Map các typo phổ biến trong tiếng Việt (bàn phím QWERTY)
 * Các phím gần nhau thường bị gõ nhầm
 */
export const COMMON_TYPOS: Record<string, string[]> = {
    // Typo phổ biến khi gõ nhanh
    'nguoi': ['nguwoif', 'nguoif', 'nguơi', 'ngưoi', 'nguoij'],
    'gio': ['gioi', 'gior', 'giờ', 'giừo', 'gior'],
    'phong': ['phòng', 'phomng', 'phongg'],
    'tin': ['tinb', 'tinn', 'tinj'],
    'tao': ['taoj', 'taonj', 'taoo'],
    'dat': ['datt', 'datj', 'datr'],
    'su': ['suw', 'suu', 'súc'],
    'co': ['coo', 'coj', 'có'],
    // Thêm các typo khác ở đây...
};

/**
 * Kiểm tra nếu một từ là typo của từ khác
 */
export function isTypoOf(input: string, target: string): boolean {
    const normalizedInput = normalizeVietnamese(input.toLowerCase());
    const normalizedTarget = normalizeVietnamese(target.toLowerCase());

    // Kiểm tra trong danh sách typo đã biết
    const knownTypos = COMMON_TYPOS[normalizedTarget];
    if (knownTypos && knownTypos.includes(normalizedInput)) {
        return true;
    }

    // Kiểm tra bằng Levenshtein distance
    // Cho phép tối đa 2 ký tự khác biệt cho từ ngắn, 3 cho từ dài
    const maxDistance = normalizedTarget.length <= 4 ? 1 : 2;
    const distance = levenshteinDistance(normalizedInput, normalizedTarget);

    return distance <= maxDistance;
}

export default {
    normalizeVietnamese,
    levenshteinDistance,
    similarity,
    fuzzyMatch,
    findBestMatch,
    isTypoOf,
    COMMON_TYPOS
};
