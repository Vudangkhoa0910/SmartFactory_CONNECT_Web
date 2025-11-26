const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCz6Dy7Gpsy1Zh8fcQfCFuqIRUJiMz26JY';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * @route POST /api/chat/message
 * @desc Send message to Gemini AI
 * @access Public (or Protected if needed)
 */
router.post('/message', async (req, res) => {
  try {
    const { contents } = req.body;

    if (!contents) {
      return res.status(400).json({ success: false, message: 'Contents are required' });
    }

    const payload = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    };

    const response = await axios.post(`${API_URL}?key=${API_KEY}`, payload);
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      return res.json({
        success: true,
        text: response.data.candidates[0].content.parts[0].text
      });
    }
    
    return res.status(500).json({ success: false, message: 'No response from AI' });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to AI service',
      error: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/chat/generate-news
 * @desc Generate news content
 * @access Public
 */
router.post('/generate-news', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const payload = {
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    };

    const response = await axios.post(`${API_URL}?key=${API_KEY}`, payload);
    
    if (response.data.candidates && response.data.candidates.length > 0) {
      const text = response.data.candidates[0].content.parts[0].text;
      console.log('Gemini Raw Response:', text);
      
      // Clean up markdown code blocks if present
      let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Find the first '{' and last '}' to ensure we only get the JSON object
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
        console.error('Failed JSON String:', jsonStr);
        return res.status(500).json({ success: false, message: 'Failed to parse AI response as JSON' });
      }
    }
    
    return res.status(500).json({ success: false, message: 'No response from AI' });
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to connect to AI service',
      error: error.response?.data || error.message 
    });
  }
});

module.exports = router;
