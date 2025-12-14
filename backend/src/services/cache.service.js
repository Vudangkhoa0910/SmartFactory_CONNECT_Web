/**
 * =============================================================
 * CACHE SERVICE - In-Memory Caching for SmartFactory CONNECT
 * =============================================================
 * 
 * This service provides caching capabilities to reduce database load
 * and improve response times for frequently accessed data.
 * 
 * For production with 2000-3000 users, consider using Redis.
 * This in-memory implementation works for single-instance deployments.
 */

const NodeCache = require('node-cache');

// Cache configurations for different data types
const cacheConfigs = {
  // User data - cached for 5 minutes
  users: {
    ttl: 300,
    checkperiod: 60,
    maxKeys: 5000,
  },
  // Department data - cached for 15 minutes (rarely changes)
  departments: {
    ttl: 900,
    checkperiod: 120,
    maxKeys: 100,
  },
  // Sessions - cached for 30 minutes
  sessions: {
    ttl: 1800,
    checkperiod: 300,
    maxKeys: 10000,
  },
  // Statistics/Dashboard - cached for 1 minute
  stats: {
    ttl: 60,
    checkperiod: 30,
    maxKeys: 100,
  },
  // News articles - cached for 5 minutes
  news: {
    ttl: 300,
    checkperiod: 60,
    maxKeys: 500,
  },
  // General purpose cache
  general: {
    ttl: 120,
    checkperiod: 60,
    maxKeys: 1000,
  },
};

// Create cache instances
const caches = {};
for (const [name, config] of Object.entries(cacheConfigs)) {
  caches[name] = new NodeCache({
    stdTTL: config.ttl,
    checkperiod: config.checkperiod,
    maxKeys: config.maxKeys,
    useClones: false, // Better performance, but be careful with object mutations
  });
}

/**
 * Generate a consistent cache key
 */
const generateKey = (prefix, ...parts) => {
  return `${prefix}:${parts.join(':')}`;
};

/**
 * Get value from cache
 * @param {string} cacheName - Name of the cache (users, departments, etc.)
 * @param {string} key - Cache key
 * @returns {*} Cached value or undefined
 */
const get = (cacheName, key) => {
  const cache = caches[cacheName] || caches.general;
  return cache.get(key);
};

/**
 * Set value in cache
 * @param {string} cacheName - Name of the cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Optional custom TTL in seconds
 */
const set = (cacheName, key, value, ttl = undefined) => {
  const cache = caches[cacheName] || caches.general;
  if (ttl) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
};

/**
 * Delete a key from cache
 */
const del = (cacheName, key) => {
  const cache = caches[cacheName] || caches.general;
  cache.del(key);
};

/**
 * Delete multiple keys matching a pattern
 * @param {string} cacheName - Name of the cache
 * @param {string} pattern - Pattern to match (prefix)
 */
const delPattern = (cacheName, pattern) => {
  const cache = caches[cacheName] || caches.general;
  const keys = cache.keys().filter(key => key.startsWith(pattern));
  cache.del(keys);
};

/**
 * Flush entire cache
 */
const flush = (cacheName) => {
  if (cacheName) {
    const cache = caches[cacheName];
    if (cache) cache.flushAll();
  } else {
    // Flush all caches
    for (const cache of Object.values(caches)) {
      cache.flushAll();
    }
  }
};

/**
 * Get or set pattern - fetches from cache or executes callback
 * @param {string} cacheName - Name of the cache
 * @param {string} key - Cache key
 * @param {Function} callback - Async function to fetch data if not cached
 * @param {number} ttl - Optional custom TTL
 * @returns {*} Cached or freshly fetched value
 */
const getOrSet = async (cacheName, key, callback, ttl = undefined) => {
  const cached = get(cacheName, key);
  if (cached !== undefined) {
    return cached;
  }
  
  const value = await callback();
  if (value !== undefined && value !== null) {
    set(cacheName, key, value, ttl);
  }
  return value;
};

/**
 * Get cache statistics
 */
const getStats = () => {
  const stats = {};
  for (const [name, cache] of Object.entries(caches)) {
    const cacheStats = cache.getStats();
    stats[name] = {
      keys: cache.keys().length,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.hits + cacheStats.misses > 0
        ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
        : '0%',
    };
  }
  return stats;
};

// ============================================================
// USER CACHE HELPERS
// ============================================================

const userCache = {
  getById: (userId) => get('users', generateKey('user', userId)),
  
  setById: (userId, userData) => set('users', generateKey('user', userId), userData),
  
  invalidate: (userId) => del('users', generateKey('user', userId)),
  
  getOrFetch: async (userId, fetchFn) => {
    return getOrSet('users', generateKey('user', userId), fetchFn);
  },
};

// ============================================================
// DEPARTMENT CACHE HELPERS
// ============================================================

const departmentCache = {
  getAll: () => get('departments', 'all'),
  
  setAll: (departments) => set('departments', 'all', departments),
  
  getById: (deptId) => get('departments', generateKey('dept', deptId)),
  
  setById: (deptId, deptData) => set('departments', generateKey('dept', deptId), deptData),
  
  invalidateAll: () => flush('departments'),
  
  getOrFetchAll: async (fetchFn) => {
    return getOrSet('departments', 'all', fetchFn);
  },
};

// ============================================================
// SESSION CACHE HELPERS
// ============================================================

const sessionCache = {
  get: (token) => get('sessions', generateKey('session', token)),
  
  set: (token, sessionData, ttl = 1800) => set('sessions', generateKey('session', token), sessionData, ttl),
  
  invalidate: (token) => del('sessions', generateKey('session', token)),
  
  invalidateUser: (userId) => delPattern('sessions', `session:user:${userId}`),
};

// ============================================================
// STATS/DASHBOARD CACHE HELPERS
// ============================================================

const statsCache = {
  get: (key) => get('stats', key),
  
  set: (key, data, ttl = 60) => set('stats', key, data, ttl),
  
  getDashboard: () => get('stats', 'dashboard'),
  
  setDashboard: (data) => set('stats', 'dashboard', data, 60),
  
  getIncidentStats: () => get('stats', 'incidents'),
  
  setIncidentStats: (data) => set('stats', 'incidents', data, 60),
  
  getIdeaStats: () => get('stats', 'ideas'),
  
  setIdeaStats: (data) => set('stats', 'ideas', data, 60),
  
  invalidateAll: () => flush('stats'),
};

// ============================================================
// NEWS CACHE HELPERS
// ============================================================

const newsCache = {
  getList: (page = 1, limit = 10) => get('news', generateKey('list', page, limit)),
  
  setList: (page, limit, data) => set('news', generateKey('list', page, limit), data),
  
  getById: (newsId) => get('news', generateKey('item', newsId)),
  
  setById: (newsId, data) => set('news', generateKey('item', newsId), data),
  
  invalidate: (newsId) => {
    del('news', generateKey('item', newsId));
    delPattern('news', 'list:'); // Invalidate all lists
  },
  
  invalidateAll: () => flush('news'),
};

// ============================================================
// RATE LIMITING HELPERS
// ============================================================

const rateLimitCache = {
  /**
   * Check and increment rate limit counter
   * @param {string} key - Unique identifier (e.g., IP, userId)
   * @param {number} limit - Max requests allowed
   * @param {number} windowSeconds - Time window in seconds
   * @returns {object} { allowed: boolean, remaining: number, resetIn: number }
   */
  check: (key, limit = 100, windowSeconds = 60) => {
    const cacheKey = generateKey('ratelimit', key);
    const cache = caches.general;
    
    let data = cache.get(cacheKey);
    const now = Date.now();
    
    if (!data || now > data.resetAt) {
      data = {
        count: 1,
        resetAt: now + (windowSeconds * 1000),
      };
      cache.set(cacheKey, data, windowSeconds);
      return {
        allowed: true,
        remaining: limit - 1,
        resetIn: windowSeconds,
      };
    }
    
    data.count++;
    cache.set(cacheKey, data, Math.ceil((data.resetAt - now) / 1000));
    
    return {
      allowed: data.count <= limit,
      remaining: Math.max(0, limit - data.count),
      resetIn: Math.ceil((data.resetAt - now) / 1000),
    };
  },
};

module.exports = {
  get,
  set,
  del,
  delPattern,
  flush,
  getOrSet,
  getStats,
  generateKey,
  userCache,
  departmentCache,
  sessionCache,
  statsCache,
  newsCache,
  rateLimitCache,
  caches,
};
