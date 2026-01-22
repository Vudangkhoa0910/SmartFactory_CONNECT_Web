/**
 * RAG Service
 * Service để gọi RAG API cho việc index và search ideas
 */

const axios = require('axios');

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://rag_service:8001';
const RAG_TIMEOUT = 10000; // 10 seconds

/**
 * Index một idea vào RAG database
 * Gọi khi idea được duyệt hoặc triển khai
 * @param {string} ideaId - ID của idea cần index
 * @returns {Promise<Object>} - Kết quả index
 */
async function indexIdea(ideaId) {
  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/ideas/index`,
      { idea_id: ideaId },
      { timeout: RAG_TIMEOUT }
    );
    
    console.log(`[RAG Service] Indexed idea ${ideaId}:`, response.data.message);
    return response.data;
  } catch (error) {
    console.error(`[RAG Service] Failed to index idea ${ideaId}:`, error.message);
    // Don't throw - RAG indexing failure shouldn't break main flow
    return {
      success: false,
      idea_id: ideaId,
      message: error.message,
      embedding_created: false
    };
  }
}

/**
 * Index nhiều ideas cùng lúc
 * @param {string[]} ideaIds - Array of idea IDs
 * @returns {Promise<Object>} - Kết quả index batch
 */
async function indexIdeasBatch(ideaIds) {
  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/ideas/index-batch`,
      ideaIds,
      { timeout: RAG_TIMEOUT * 2 }
    );
    
    console.log(`[RAG Service] Batch indexed ${ideaIds.length} ideas`);
    return response.data;
  } catch (error) {
    console.error(`[RAG Service] Failed to batch index ideas:`, error.message);
    return {
      success: false,
      total: ideaIds.length,
      processed: 0,
      failed: ideaIds.length,
      error: error.message
    };
  }
}

/**
 * Kiểm tra trùng lặp idea
 * @param {string} title - Tiêu đề
 * @param {string} description - Mô tả
 * @param {number} threshold - Ngưỡng similarity (default 0.85)
 * @returns {Promise<Object>} - Kết quả kiểm tra
 */
async function checkDuplicate(title, description, threshold = 0.85) {
  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/ideas/check-duplicate`,
      { title, description, threshold },
      { timeout: RAG_TIMEOUT }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[RAG Service] Failed to check duplicate:`, error.message);
    return {
      success: false,
      is_duplicate: false,
      message: error.message
    };
  }
}

/**
 * Tìm ideas tương tự
 * @param {string} title - Tiêu đề
 * @param {string} description - Mô tả
 * @param {number} limit - Số lượng kết quả
 * @returns {Promise<Object>} - Danh sách ideas tương tự
 */
async function findSimilarIdeas(title, description, limit = 5) {
  try {
    const response = await axios.post(
      `${RAG_SERVICE_URL}/ideas/similar`,
      { title, description, limit },
      { timeout: RAG_TIMEOUT }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[RAG Service] Failed to find similar ideas:`, error.message);
    return {
      success: false,
      similar_ideas: [],
      message: error.message
    };
  }
}

/**
 * Lấy thống kê embedding
 * @returns {Promise<Object>} - Stats
 */
async function getEmbeddingStats() {
  try {
    const response = await axios.get(
      `${RAG_SERVICE_URL}/ideas/embedding-stats`,
      { timeout: RAG_TIMEOUT }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[RAG Service] Failed to get stats:`, error.message);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Health check RAG service
 * @returns {Promise<boolean>} - Service healthy or not
 */
async function healthCheck() {
  try {
    const response = await axios.get(
      `${RAG_SERVICE_URL}/health`,
      { timeout: 5000 }
    );
    
    return response.data.status === 'healthy';
  } catch (error) {
    console.error(`[RAG Service] Health check failed:`, error.message);
    return false;
  }
}

module.exports = {
  indexIdea,
  indexIdeasBatch,
  checkDuplicate,
  findSimilarIdeas,
  getEmbeddingStats,
  healthCheck,
  RAG_SERVICE_URL
};
