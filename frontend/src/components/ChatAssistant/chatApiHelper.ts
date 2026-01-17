/**
 * Chat API Helper - Cung cấp các utility functions để làm việc với API registry
 * Có thể được sử dụng bởi các component khác để hiển thị suggestions, help menu, v.v.
 */

import {
    getRegistry,
    getAvailableIntents,
    getAllCategories,
    getAllMeetingTypes,
    IntentDefinition,
    CategoryDefinition
} from './intentMatcher';

/**
 * Lấy danh sách các intent có thể sử dụng cho người dùng hiện tại
 */
export function getAvailableActions(userRole: string | null): IntentDefinition[] {
    return getAvailableIntents(userRole);
}

/**
 * Lấy các ví dụ sử dụng cho một category cụ thể
 */
export function getExamplesForCategory(categoryId: string): string[] {
    const registry = getRegistry();
    const examples: string[] = [];

    for (const intent of registry.intents) {
        if (intent.category === categoryId) {
            examples.push(...intent.examples);
        }
    }

    return examples;
}

/**
 * Lấy tất cả keywords cho một category
 */
export function getKeywordsForCategory(categoryId: string): string[] {
    const registry = getRegistry();
    const keywords: string[] = [];

    for (const intent of registry.intents) {
        if (intent.category === categoryId) {
            keywords.push(...intent.keywords);
        }
    }

    return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Tạo nội dung help cho một category
 */
export function generateHelpContent(categoryId: string, userRole: string | null): string {
    const categories = getAllCategories();
    const category = categories[categoryId];

    if (!category) return '';

    const registry = getRegistry();
    const intents = registry.intents.filter(i => {
        if (i.category !== categoryId) return false;
        if (i.requiredRole && i.requiredRole !== userRole && userRole !== 'admin') return false;
        return true;
    });

    let content = `**${category.name}**\n`;
    content += `${category.description}\n\n`;
    content += `**Các lệnh có sẵn:**\n`;

    for (const intent of intents) {
        content += `\n• **${intent.name}**\n`;
        content += `  ${intent.description}\n`;
        if (intent.examples.length > 0) {
            content += `  Ví dụ: "${intent.examples[0]}"\n`;
        }
    }

    return content;
}

/**
 * Lấy danh sách tất cả các routes có thể điều hướng
 */
export function getAllNavigationRoutes(): Array<{ keyword: string; route: string; name: string }> {
    const registry = getRegistry();
    const routes: Array<{ keyword: string; route: string; name: string }> = [];

    for (const intent of registry.intents) {
        if (intent.category === 'navigation' && intent.route) {
            for (const keyword of intent.keywords) {
                routes.push({
                    keyword,
                    route: intent.route,
                    name: intent.name
                });
            }
        }
    }

    return routes;
}

/**
 * Lấy danh sách các loại cuộc họp
 */
export function getMeetingTypeOptions(): Array<{ value: string; label: string; keywords: string[] }> {
    const meetingTypes = getAllMeetingTypes();
    const options: Array<{ value: string; label: string; keywords: string[] }> = [];

    for (const [value, definition] of Object.entries(meetingTypes)) {
        options.push({
            value,
            label: definition.label,
            keywords: definition.keywords
        });
    }

    return options;
}

/**
 * Lấy thông tin API endpoint cho một intent
 */
export function getApiInfoForIntent(intentId: string): {
    method: string;
    endpoint: string;
    params: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
} | null {
    const registry = getRegistry();
    const intent = registry.intents.find(i => i.id === intentId);

    if (!intent || !intent.api) return null;

    return {
        method: intent.api.method,
        endpoint: intent.api.endpoint,
        params: intent.api.params || {}
    };
}

/**
 * Tạo suggestions dựa trên input hiện tại
 */
export function getSuggestions(partialInput: string, userRole: string | null, limit: number = 5): string[] {
    const lowerInput = partialInput.toLowerCase().trim();
    if (lowerInput.length < 2) return [];

    const availableIntents = getAvailableIntents(userRole);
    const suggestions: Array<{ text: string; score: number }> = [];

    for (const intent of availableIntents) {
        // Check keywords
        for (const keyword of intent.keywords) {
            if (keyword.toLowerCase().includes(lowerInput)) {
                suggestions.push({
                    text: keyword,
                    score: keyword.toLowerCase().startsWith(lowerInput) ? 1.0 : 0.5
                });
            }
        }

        // Check examples
        for (const example of intent.examples) {
            if (example.toLowerCase().includes(lowerInput)) {
                suggestions.push({
                    text: example,
                    score: example.toLowerCase().startsWith(lowerInput) ? 0.9 : 0.4
                });
            }
        }
    }

    // Sort by score and remove duplicates
    const uniqueSuggestions = [...new Map(suggestions.map(s => [s.text, s])).values()];
    uniqueSuggestions.sort((a, b) => b.score - a.score);

    return uniqueSuggestions.slice(0, limit).map(s => s.text);
}

/**
 * Export tất cả categories với số lượng intents
 */
export function getCategorySummary(userRole: string | null): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    intentCount: number;
}> {
    const categories = getAllCategories();
    const registry = getRegistry();
    const summary: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        intentCount: number;
    }> = [];

    for (const [id, category] of Object.entries(categories)) {
        const intentCount = registry.intents.filter(i => {
            if (i.category !== id) return false;
            if (i.requiredRole && i.requiredRole !== userRole && userRole !== 'admin') return false;
            return true;
        }).length;

        if (intentCount > 0) {
            summary.push({
                id,
                name: category.name,
                description: category.description,
                icon: category.icon,
                intentCount
            });
        }
    }

    return summary;
}

export default {
    getAvailableActions,
    getExamplesForCategory,
    getKeywordsForCategory,
    generateHelpContent,
    getAllNavigationRoutes,
    getMeetingTypeOptions,
    getApiInfoForIntent,
    getSuggestions,
    getCategorySummary
};
