const express = require('express');
const router = express.Router();
const { Mistral } = require('@mistralai/mistralai');
const { authenticate } = require('../middlewares/auth.middleware');
const axios = require('axios');

// Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

// =============================================================
// CLIENT TYPE CONSTANTS
// =============================================================
const CLIENT_TYPE = {
  MOBILE_APP: 'mobile_app',
  WEB_DASHBOARD: 'web_dashboard',
  UNKNOWN: 'unknown'
};

/**
 * Get client type from request headers
 * Header: X-Client-Type: mobile_app | web_dashboard
 */
const getClientType = (req) => {
  const clientType = req.headers['x-client-type'] || req.headers['x-client'];
  if (clientType === 'mobile_app' || clientType === 'app') return CLIENT_TYPE.MOBILE_APP;
  if (clientType === 'web_dashboard' || clientType === 'web') return CLIENT_TYPE.WEB_DASHBOARD;

  // Auto-detect from User-Agent if header not provided
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('Dart') || userAgent.includes('Flutter') || userAgent.includes('okhttp')) {
    return CLIENT_TYPE.MOBILE_APP;
  }
  if (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari')) {
    return CLIENT_TYPE.WEB_DASHBOARD;
  }

  return CLIENT_TYPE.UNKNOWN;
};

let mistralClient = null;

const getMistralClient = () => {
  if (!mistralClient) {
    if (MISTRAL_API_KEY) {
      mistralClient = new Mistral({ apiKey: MISTRAL_API_KEY });
      console.log('✅ [Mistral] Client initialized successfully');
    } else {
      console.warn('⚠️ [Mistral] API Key is missing! AI features will be limited.');
    }
  }
  return mistralClient;
};

// ====================================
// SYSTEM PROMPTS - Different for App vs Web
// ====================================

// Mobile App: Concise, direct, easy to read on small screen
const SYSTEM_PROMPT_APP = `Bạn là trợ lý AI của SmartFactory CONNECT trên ứng dụng di động.

Quy tắc trả lời:
- Ngắn gọn, súc tích (tối đa 3-4 câu)
- KHÔNG dùng emoji, icon, markdown
- KHÔNG bullet points, chỉ văn xuôi ngắn
- Ưu tiên thông tin quan trọng nhất
- Phù hợp đọc trên màn hình nhỏ

Bạn hỗ trợ:
- Hướng dẫn báo cáo sự cố
- Tìm sự cố/ý tưởng tương tự
- Trả lời câu hỏi nhanh`;

// Web Dashboard: More detailed, can show statistics and tables
const SYSTEM_PROMPT_WEB = `Bạn là trợ lý AI của SmartFactory CONNECT trên Web Dashboard.

Quy tắc trả lời:
- Trả lời chi tiết, đầy đủ thông tin
- Có thể dùng bullet points khi liệt kê
- KHÔNG dùng emoji hay markdown formatting
- Tổng hợp dữ liệu thành báo cáo rõ ràng
- Phù hợp cho quản lý, supervisor xem trên máy tính

Bạn có thể:
- Tìm kiếm sự cố, ý tưởng trong hệ thống
- Xem thống kê chi tiết về sự cố, phòng ban
- Phân tích xu hướng, so sánh dữ liệu
- Trả lời câu hỏi quản lý nhà máy`;

// Default/fallback prompt
const SYSTEM_PROMPT = SYSTEM_PROMPT_WEB;

/**
 * Get appropriate system prompt based on client type
 */
const getSystemPrompt = (clientType) => {
  switch (clientType) {
    case CLIENT_TYPE.MOBILE_APP:
      return SYSTEM_PROMPT_APP;
    case CLIENT_TYPE.WEB_DASHBOARD:
      return SYSTEM_PROMPT_WEB;
    default:
      return SYSTEM_PROMPT;
  }
};

// ====================================
// TOOLS DEFINITION for Mistral Function Calling
// ====================================
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_incidents",
      description: "Tìm kiếm các sự cố tương tự trong hệ thống dựa trên mô tả. Dùng khi người dùng hỏi về cách xử lý sự cố, lỗi máy, hoặc muốn tìm kinh nghiệm xử lý trước đây.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Mô tả sự cố hoặc từ khóa tìm kiếm"
          },
          limit: {
            type: "integer",
            description: "Số kết quả tối đa (mặc định 5)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_ideas",
      description: "Tìm kiếm ý tưởng, góp ý trong hệ thống. Dùng khi người dùng hỏi về các đề xuất cải tiến hoặc ý tưởng đã có.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Từ khóa tìm kiếm ý tưởng"
          },
          limit: {
            type: "integer",
            description: "Số kết quả tối đa (mặc định 5)"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_incident_stats",
      description: "Lấy thống kê về sự cố. Dùng khi người dùng hỏi về số lượng sự cố, tình hình sự cố.",
      parameters: {
        type: "object",
        properties: {
          time_range: {
            type: "string",
            enum: ["today", "week", "month", "year", "all"],
            description: "Khoảng thời gian thống kê"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_department_stats",
      description: "Lấy thống kê theo phòng ban. Dùng khi người dùng hỏi về performance của các phòng ban.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_overview",
      description: "Lấy thống kê tổng quan hệ thống. Dùng khi người dùng hỏi về tình hình chung.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  }
];

// ====================================
// TOOL IMPLEMENTATIONS
// ====================================
async function executeFunction(name, args) {
  try {
    switch (name) {
      case 'search_incidents': {
        const response = await axios.post(`${RAG_SERVICE_URL}/search/incidents`, null, {
          params: { query: args.query, limit: args.limit || 5 }
        });
        return response.data;
      }

      case 'search_ideas': {
        const response = await axios.post(`${RAG_SERVICE_URL}/search/ideas`, null, {
          params: { query: args.query, limit: args.limit || 5 }
        });
        return response.data;
      }

      case 'get_incident_stats': {
        const response = await axios.get(`${RAG_SERVICE_URL}/stats/incidents`, {
          params: { time_range: args.time_range || 'week' }
        });
        return response.data;
      }

      case 'get_department_stats': {
        const response = await axios.get(`${RAG_SERVICE_URL}/stats/departments`);
        return response.data;
      }

      case 'get_overview': {
        const response = await axios.get(`${RAG_SERVICE_URL}/stats/overview`);
        return response.data;
      }

      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error) {
    console.error(`[AI Agent] Function ${name} error:`, error.message);
    return { error: error.message };
  }
}

// ====================================
// MAIN CHAT ENDPOINT with Function Calling
// ====================================
/**
 * @route POST /api/chat/message
 * @desc Send message to AI Agent with RAG integration
 * @access Private
 */
router.post('/message', authenticate, async (req, res) => {
  try {
    const { contents } = req.body;

    if (!contents) {
      return res.status(400).json({ success: false, message: 'Contents are required' });
    }

    const client = getMistralClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'Mistral API not configured. Please set MISTRAL_API_KEY in .env'
      });
    }

    // Detect client type from header
    const clientType = getClientType(req);
    const systemPrompt = getSystemPrompt(clientType);

    console.log(`[AI Agent] Client type: ${clientType}`);

    // Build messages with appropriate system prompt
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Convert Gemini-style contents to Mistral format
    for (const item of contents) {
      messages.push({
        role: item.role === 'model' ? 'assistant' : item.role,
        content: item.parts?.map(p => p.text).join('') || ''
      });
    }

    console.log('[AI Agent] Processing message with function calling...');

    // First call - let AI decide if it needs tools
    let response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: messages,
      tools: TOOLS,
      toolChoice: 'auto'
    });

    let assistantMessage = response.choices[0].message;

    // Check if AI wants to call a function
    if (assistantMessage.toolCalls && assistantMessage.toolCalls.length > 0) {
      console.log('[AI Agent] AI requested tool calls:', assistantMessage.toolCalls.length);

      // Add assistant message with tool calls
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.toolCalls) {
        const funcName = toolCall.function.name;
        const funcArgs = JSON.parse(toolCall.function.arguments);

        console.log(`[AI Agent] Executing: ${funcName}`, funcArgs);

        const result = await executeFunction(funcName, funcArgs);

        // Add tool result to messages
        messages.push({
          role: 'tool',
          name: funcName,
          content: JSON.stringify(result, null, 2),
          toolCallId: toolCall.id
        });
      }

      // Second call - let AI generate final response with tool results
      response = await client.chat.complete({
        model: MISTRAL_MODEL,
        messages: messages
      });

      assistantMessage = response.choices[0].message;
    }

    // Clean up any markdown formatting that might slip through
    let finalText = assistantMessage.content || '';
    finalText = finalText.replace(/\*\*/g, '');
    finalText = finalText.replace(/\*/g, '');
    finalText = finalText.replace(/#{1,6}\s/g, '');
    finalText = finalText.replace(/```[\s\S]*?```/g, '');

    console.log('[AI Agent] Response generated successfully');

    return res.json({
      success: true,
      text: finalText.trim()
    });

  } catch (error) {
    console.error('[AI Agent] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý yêu cầu',
      error: error.message
    });
  }
});

// ====================================
// NEWS GENERATION
// ====================================
/**
 * @route POST /api/chat/generate-news
 * @desc Generate news content using Mistral AI
 * @access Private
 */
router.post('/generate-news', authenticate, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const client = getMistralClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'Mistral API not configured. Please set MISTRAL_API_KEY in .env'
      });
    }

    const response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });

    if (response.choices && response.choices.length > 0) {
      const text = response.choices[0].message.content;

      // Clean up markdown code blocks if present
      let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const firstOpen = jsonStr.indexOf('{');
      const lastClose = jsonStr.lastIndexOf('}');

      if (firstOpen !== -1 && lastClose !== -1) {
        jsonStr = jsonStr.substring(firstOpen, lastClose + 1);
      }

      try {
        const json = JSON.parse(jsonStr);
        return res.json({ success: true, data: json });
      } catch (e) {
        console.error('JSON Parse Error:', e);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response as JSON'
        });
      }
    }

    return res.status(500).json({ success: false, message: 'No response from AI' });
  } catch (error) {
    console.error('Mistral API Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to AI service',
      error: error.message
    });
  }
});

/**
 * @route POST /api/chat/semantic-match
 * @desc Match user input to available intents using Mistral AI
 * @access Private
 */
router.post('/semantic-match', authenticate, async (req, res) => {
  try {
    const { input, intents, userRole } = req.body;

    if (!input || !intents) {
      return res.status(400).json({ success: false, message: 'Input and intents are required' });
    }

    const client = getMistralClient();
    if (!client) {
      // Fallback if Mistral not configured
      return res.json({ success: false, message: 'Mistral not configured' });
    }

    const prompt = `
      Bạn là một trợ lý ảo nhận diện ý định của người dùng (Intent Recognizer).
      Nhiệm vụ của bạn là phân tích câu lệnh của người dùng và chọn ra "id" của ý định (intent) phù hợp nhất từ danh sách được cung cấp.

      INPUT CỦA NGƯỜI DÙNG: "${input}"
      VAI TRÒ NGƯỜI DÙNG: "${userRole || 'user'}"

      DANH SÁCH Ý ĐỊNH:
      ${JSON.stringify(intents, null, 2)}

      YÊU CẦU:
      1. Tìm intent phù hợp nhất dựa trên ngữ nghĩa câu lệnh.
      2. Trả về kết quả dưới dạng JSON object duy nhất.
      3. Nếu không có intent nào thực sự phù hợp (confidence < 0.5), trả về intentId là null.
      4. Extracted parameters: Trích xuất các thông tin cần thiết như ngày tháng, số lượng, trạng thái, loại hòm ý tưởng (white/pink).

      CẤU TRÚC JSON TRẢ VỀ:
      {
        "intentId": "id_của_intent_phù_hợp_hoặc_null",
        "confidence": 0.0_đến_1.0,
        "reason": "giải thích ngắn gọn tại sao chọn intent này",
        "params": {}
      }

      Trả về DUY NHẤT một JSON object, không có văn bản nào khác.
    `;

    const response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });

    if (response.choices && response.choices.length > 0) {
      const text = response.choices[0].message.content;
      try {
        const result = JSON.parse(text);
        return res.json({ success: true, data: result });
      } catch (e) {
        console.error('[SemanticMatch] JSON Parse Error:', e);
        return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
      }
    }

    return res.status(500).json({ success: false, message: 'No response from AI' });
  } catch (error) {
    console.error('[SemanticMatch] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route POST /api/chat/extract-content
 * @desc Extract structured content for news/notifications from raw input
 * @access Private
 */
router.post('/extract-content', authenticate, async (req, res) => {
  try {
    const { input, intentId } = req.body;

    if (!input) {
      return res.status(400).json({ success: false, message: 'Input is required' });
    }

    const client = getMistralClient();
    if (!client) {
      return res.json({
        success: true,
        data: { content: input, title: input, error: true }
      });
    }

    const prompt = `
      Bạn là chuyên gia trích xuất nội dung từ yêu cầu của người dùng để tạo tin tức hoặc thông báo.
      Nhiệm vụ QUAN TRỌNG NHẤT: Tách phần "lệnh" (command) ra khỏi phần "nội dung thực tế" (raw content).

      INPUT CỦA NGƯỜI DÙNG: "${input}"
      INTENT: "${intentId || 'news_create'}"

      YÊU CẦU CHI TIẾT:
      1. Loại bỏ hoàn toàn các từ khóa mang tính chất ra lệnh như: "tạo tin", "tạo tin tức", "hãy viết tin", "thông báo là", "đăng bài", "viết hộ tôi", v.v.
      2. Tiêu đề (title): Phải là một câu tiêu đề chuyên nghiệp, KHÔNG được chứa từ "tạo tin" hay "tạo thông báo". Ví dụ: Thay vì "Tạo tin phòng A có khách" hãy dùng "Phòng A đang có khách - Thông báo hạn chế ra vào".
      3. Nội dung (content): Trích xuất phần thông tin cốt lõi. Nếu người dùng chỉ nói ngắn gọn, hãy mở rộng thêm 1-2 câu để bản tin trông chuyên nghiệp và lịch sự hơn (Ví dụ: "Xin thông báo phòng A đang có khách, quý anh chị vui lòng không vào khu vực này cho đến khi có thông báo mới").
      4. Phân loại (category): Chọn 1 trong: company_announcement, safety_alert, event, production_update, maintenance, policy_update.
      5. isPriority: true nếu tin mang tính khẩn cấp hoặc quan trọng.

      CẤU TRÚC JSON TRẢ VỀ:
      {
        "title": "Tiêu đề sạch (không chứa từ 'tạo tin')",
        "content": "Nội dung đầy đủ và chuyên nghiệp",
        "category": "danh_mục_phù_hợp",
        "isPriority": boolean
      }

      Trả về DUY NHẤT một JSON object.
    `;

    const response = await client.chat.complete({
      model: MISTRAL_MODEL,
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });

    if (response.choices && response.choices.length > 0) {
      const text = response.choices[0].message.content;
      try {
        const result = JSON.parse(text);
        return res.json({ success: true, data: result });
      } catch (e) {
        console.error('[ExtractContent] JSON Parse Error:', e);
        return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
      }
    }

    return res.status(500).json({ success: false, message: 'No response from AI' });
  } catch (error) {
    console.error('[ExtractContent] Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ====================================
// STATUS ENDPOINT
// ====================================
/**
 * @route GET /api/chat/status
 * @desc Check AI service status
 * @access Public
 */
router.get('/status', async (req, res) => {
  const client = getMistralClient();
  const clientType = getClientType(req);

  // Check RAG service
  let ragStatus = 'unknown';
  try {
    const ragResponse = await axios.get(`${RAG_SERVICE_URL}/health`, { timeout: 2000 });
    ragStatus = ragResponse.data.status || 'connected';
  } catch (e) {
    ragStatus = 'disconnected';
  }

  res.json({
    success: true,
    provider: 'mistral',
    model: MISTRAL_MODEL,
    configured: !!client,
    rag_service: ragStatus,
    client_type: clientType,
    features: clientType === CLIENT_TYPE.MOBILE_APP
      ? ['quick_search', 'incident_help', 'concise_responses']
      : ['function_calling', 'rag_search', 'statistics', 'detailed_analysis'],
    message: client ? 'AI Agent is ready with RAG integration' : 'Mistral API key not configured'
  });
});

module.exports = router;
