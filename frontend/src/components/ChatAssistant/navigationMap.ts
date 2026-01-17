/**
 * Navigation Map - Generated from chatbot-api-registry.json
 * Maps keywords to routes for navigation commands
 */

import { getRegistry } from './intentMatcher';

// Build navMap from registry
function buildNavMap(): Record<string, string> {
    const registry = getRegistry();
    const navMap: Record<string, string> = {};

    for (const intent of registry.intents) {
        if (intent.category === 'navigation' && intent.route) {
            for (const keyword of intent.keywords) {
                navMap[keyword] = intent.route;
            }
        }
    }

    return navMap;
}

export const navMap = buildNavMap();

// Export for backward compatibility
export default navMap;