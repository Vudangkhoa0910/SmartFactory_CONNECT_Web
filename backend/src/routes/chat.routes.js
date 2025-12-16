const express = require('express');
const router = express.Router();
const { Mistral } = require('@mistralai/mistralai');
const { authenticate } = require('../middlewares/auth.middleware');
const axios = require('axios');

// Configuration
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-large-latest';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001';

let mistralClient = null;

const getMistralClient = () => {
  if (!mistralClient && MISTRAL_API_KEY) {
    mistralClient = new Mistral({ apiKey: MISTRAL_API_KEY });
    console.log('[Mistral] Client initialized');
  }
  return mistralClient;
};

// ====================================
// SYSTEM PROMPT - Vietnamese Factory Assistant
// ====================================
const SYSTEM_PROMPT = `Bạn là trợ lý AI của SmartFactory CONNECT - hệ thống quản lý nhà máy thông minh.

Hướng dẫn trả lời:
- Trả lời bằng tiếng Việt tự nhiên, thân thiện như đang nói chuyện
- KHÔNG dùng emoji, icon, hay ký tự đặc biệt
- KHÔNG dùng markdown formatting như ** hoặc *** 
- KHÔNG liệt kê dạng bullet points trừ khi thật sự cần thiết
- Nếu có dữ liệu từ hệ thống, hãy tổng hợp thành câu văn mạch lạc
- Khi không có thông tin, hãy nói rõ ràng

Bạn có thể:
- Tìm kiếm sự cố, ý tưởng đã có trong hệ thống
- Xem thống kê về sự cố, phòng ban
- Trả lời các câu hỏi chung về nhà máy`;

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

    // Build messages with system prompt
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
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
// NEWS GENERATION (unchanged)
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
    features: ['function_calling', 'rag_search', 'statistics'],
    message: client ? 'AI Agent is ready with RAG integration' : 'Mistral API key not configured'
  });
});

module.exports = router;
