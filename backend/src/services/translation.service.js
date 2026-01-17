const axios = require('axios');
const db = require('../config/database');
const { Mistral } = require('@mistralai/mistralai');

/**
 * Translation Service
 * Supports Mistral AI, Google Translate Free API with fallback to mock data
 */
class TranslationService {

  static mistralClient = null;

  // Mock translations for testing (will be replaced by real API)
  static mockTranslations = {
    // UI Labels
    'menu.dashboard': { vi: 'Bảng điều khiển', ja: 'ダッシュボード' },
    'menu.incidents': { vi: 'Báo cáo sự cố', ja: 'インシデント報告' },
    'menu.incident_queue': { vi: 'Hàng đợi sự cố', ja: 'インシデントキュー' },
    'menu.all_incidents': { vi: 'Tất cả sự cố', ja: 'すべてのインシデント' },
    'menu.ideas': { vi: 'Góp ý', ja: '提案' },
    'menu.news': { vi: 'Tin tức', ja: 'ニュース' },
    'menu.users': { vi: 'Quản lý người dùng', ja: 'ユーザー管理' },
    'menu.departments': { vi: 'Quản lý phòng ban', ja: '部門管理' },

    // Buttons
    'button.submit': { vi: 'Gửi', ja: '送信' },
    'button.cancel': { vi: 'Hủy', ja: 'キャンセル' },
    'button.save': { vi: 'Lưu', ja: '保存' },
    'button.edit': { vi: 'Sửa', ja: '編集' },
    'button.delete': { vi: 'Xóa', ja: '削除' },
    'button.search': { vi: 'Tìm kiếm', ja: '検索' },
    'button.filter': { vi: 'Lọc', ja: 'フィルター' },
    'button.export': { vi: 'Xuất', ja: 'エクスポート' },
    'button.close': { vi: 'Đóng', ja: '閉じる' },
    'button.back': { vi: 'Quay lại', ja: '戻る' },

    // Incident Status
    'status.pending': { vi: 'Chờ xử lý', ja: '保留中' },
    'status.assigned': { vi: 'Đã phân công', ja: '割り当て済み' },
    'status.in_progress': { vi: 'Đang xử lý', ja: '処理中' },
    'status.resolved': { vi: 'Đã xử lý', ja: '解決済み' },
    'status.closed': { vi: 'Đã đóng', ja: '終了' },
    'status.cancelled': { vi: 'Đã hủy', ja: 'キャンセル済み' },

    // Priority
    'priority.low': { vi: 'Thấp', ja: '低' },
    'priority.medium': { vi: 'Trung bình', ja: '中' },
    'priority.normal': { vi: 'Bình thường', ja: '通常' },
    'priority.high': { vi: 'Cao', ja: '高' },
    'priority.critical': { vi: 'Khẩn cấp', ja: '緊急' },

    // Incident Types
    'incident.type.safety': { vi: 'An toàn', ja: '安全' },
    'incident.type.quality': { vi: 'Chất lượng', ja: '品質' },
    'incident.type.equipment': { vi: 'Thiết bị', ja: '設備' },
    'incident.type.other': { vi: 'Khác', ja: 'その他' },

    // Common Labels
    'label.title': { vi: 'Tiêu đề', ja: 'タイトル' },
    'label.description': { vi: 'Mô tả', ja: '説明' },
    'label.location': { vi: 'Vị trí', ja: '場所' },
    'label.department': { vi: 'Phòng ban', ja: '部門' },
    'label.reporter': { vi: 'Người báo cáo', ja: '報告者' },
    'label.assigned_to': { vi: 'Phân công cho', ja: '担当者' },
    'label.priority': { vi: 'Độ ưu tiên', ja: '優先度' },
    'label.status': { vi: 'Trạng thái', ja: 'ステータス' },
    'label.created_at': { vi: 'Ngày tạo', ja: '作成日' },
    'label.updated_at': { vi: 'Ngày cập nhật', ja: '更新日' },

    // Messages
    'message.success': { vi: 'Thành công', ja: '成功' },
    'message.error': { vi: 'Lỗi', ja: 'エラー' },
    'message.loading': { vi: 'Đang tải...', ja: '読み込み中...' },
    'message.no_data': { vi: 'Không có dữ liệu', ja: 'データなし' },
    'message.confirm_delete': { vi: 'Bạn có chắc muốn xóa?', ja: '削除してもよろしいですか？' },

    // Incident Page
    'incident.title': { vi: 'Quản lý sự cố', ja: 'インシデント管理' },
    'incident.create': { vi: 'Tạo sự cố mới', ja: '新規インシデント作成' },
    'incident.list': { vi: 'Danh sách sự cố', ja: 'インシデント一覧' },
    'incident.details': { vi: 'Chi tiết sự cố', ja: 'インシデント詳細' },
    'incident.total': { vi: 'Tổng số sự cố', ja: '総インシデント数' },
  };

  /**
   * Get static translation by key
   */
  static getStaticTranslation(key, language = 'vi') {
    const translation = this.mockTranslations[key];
    if (!translation) return key;
    return translation[language] || translation.vi || key;
  }

  /**
   * Get all static translations for a language
   */
  static getAllStaticTranslations(language = 'vi') {
    const result = {};
    Object.keys(this.mockTranslations).forEach(key => {
      result[key] = this.getStaticTranslation(key, language);
    });
    return result;
  }

  /**
   * Initialize Mistral API
   */
  static initMistral() {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!this.mistralClient && apiKey) {
      try {
        this.mistralClient = new Mistral({ apiKey });
        console.log('[Mistral] API initialized successfully');
      } catch (error) {
        console.error('[Mistral] Initialization failed:', error.message);
      }
    }
  }

  /**
   * Translate using Mistral API
   * Best quality, context-aware, technical terminology support
   */
  static async translateViaMistral(text, sourceLang = 'vi', targetLang = 'ja') {
    this.initMistral();

    if (!this.mistralClient) {
      throw new Error('Mistral API not initialized');
    }

    try {
      const langMap = {
        'vi': 'Vietnamese',
        'ja': 'Japanese',
        'en': 'English'
      };

      const prompt = `You are a professional translator for a manufacturing/factory management system.
Translate the following text from ${langMap[sourceLang]} to ${langMap[targetLang]}.

Context: This is for SmartFactory CONNECT - a smart factory system that manages:
- Incident reports (safety, quality, equipment issues)
- Kaizen improvement ideas
- Internal news and announcements
- Technical documentation

Requirements:
- Use formal business language appropriate for Japanese manufacturing context
- Preserve technical terms appropriately (e.g., "Kaizen" 改善, "Line" ライン, "QC" 品質管理)
- Maintain professional and respectful tone
- Keep the meaning accurate and natural
- Return ONLY the translated text, no explanations or quotes

Text to translate:
"""
${text}
"""

Translation:`;

      const model = process.env.MISTRAL_MODEL;
      const response = await this.mistralClient.chat.complete({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      });

      let translated = response.choices[0].message.content.trim();

      // Remove quotes if present
      translated = translated.replace(/^["'「」『』]|["'「」『』]$/g, '');

      console.log(`[Mistral] Translated: "${text.substring(0, 30)}..." → "${translated.substring(0, 30)}..."`);

      return translated;

    } catch (error) {
      console.error('[Mistral] Translation error:', error.message);
      throw error;
    }
  }

  /**
   * Smart translate with multiple fallbacks
   * Priority: Cache → Mistral → Google Free → Mock
   */
  static async translateText(text, sourceLang = 'vi', targetLang = 'ja', useMock = false) {
    if (!text || text.trim() === '') return text;

    // Use mock translation during testing
    if (useMock) {
      return this.mockTranslate(text, sourceLang, targetLang);
    }

    try {
      // 1. Check cache first
      const cached = await this.getCachedTranslation(text, sourceLang, targetLang);
      if (cached) {
        console.log(`[Cache Hit] ${text.substring(0, 30)}...`);
        return cached;
      }

      // 2. Try Mistral first (best quality)
      try {
        const translated = await this.translateViaMistral(text, sourceLang, targetLang);
        if (translated && translated !== text) {
          await this.saveCachedTranslation(text, sourceLang, targetLang, translated, 'mistral');
          return translated;
        }
      } catch (mistralError) {
        console.warn('[Mistral] Failed, trying Google Translate...', mistralError.message);
      }

      // 3. Fallback to Google Translate Free
      const translated = await this.translateViaGoogleFree(text, sourceLang, targetLang);

      // Save to cache
      if (translated && translated !== text) {
        await this.saveCachedTranslation(text, sourceLang, targetLang, translated, 'google_free');
      }

      return translated;

    } catch (error) {
      console.error('[Translation] All methods failed:', error.message);
      // Fallback to mock translation
      return this.mockTranslate(text, sourceLang, targetLang);
    }
  }

  /**
   * Mock translation for testing (simple word swap)
   */
  static mockTranslate(text, sourceLang, targetLang) {
    if (targetLang !== 'ja') return text;

    // Simple mock: add [JA] prefix to indicate it's "translated"
    return `[JA] ${text}`;
  }

  /**
   * Google Translate Free API (unofficial endpoint)
   */
  static async translateViaGoogleFree(text, sourceLang = 'vi', targetLang = 'ja') {
    try {
      const url = 'https://translate.googleapis.com/translate_a/single';

      const params = {
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text
      };

      const response = await axios.get(url, {
        params,
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // Response format: [[[translated_text, original_text, ...]]]
      if (response.data && response.data[0]) {
        const translated = response.data[0]
          .map(item => item[0])
          .join('');
        return translated;
      }

      return text;

    } catch (error) {
      console.error('Google Translate API error:', error.message);
      throw error;
    }
  }

  /**
   * Batch translate multiple texts
   */
  static async batchTranslate(texts, sourceLang = 'vi', targetLang = 'ja', useMock = true) {
    const results = [];

    for (const text of texts) {
      const translated = await this.translateText(text, sourceLang, targetLang, useMock);
      results.push(translated);

      // Add small delay to avoid rate limiting
      if (!useMock) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get cached translation from database
   */
  static async getCachedTranslation(text, sourceLang, targetLang) {
    try {
      const query = `
        SELECT translated_text 
        FROM translation_cache 
        WHERE original_text = $1 
          AND source_lang = $2 
          AND target_lang = $3
        LIMIT 1
      `;

      const result = await db.query(query, [text, sourceLang, targetLang]);
      return result.rows[0]?.translated_text;
    } catch (error) {
      // Table might not exist yet
      console.warn('Translation cache query failed:', error.message);
      return null;
    }
  }

  /**
   * Save translation to cache
   */
  static async saveCachedTranslation(originalText, sourceLang, targetLang, translatedText, method = 'google_free') {
    try {
      const query = `
        INSERT INTO translation_cache (
          original_text, source_lang, target_lang, translated_text, 
          translation_method, usage_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 1, NOW(), NOW())
        ON CONFLICT (original_text, source_lang, target_lang) 
        DO UPDATE SET 
          translated_text = EXCLUDED.translated_text,
          usage_count = translation_cache.usage_count + 1,
          updated_at = NOW()
        RETURNING *
      `;

      await db.query(query, [
        originalText,
        sourceLang,
        targetLang,
        translatedText,
        method
      ]);

      console.log(`[Translation Cached] ${originalText.substring(0, 50)}... -> ${translatedText.substring(0, 50)}...`);

    } catch (error) {
      // Ignore cache errors during development
      console.warn('Failed to cache translation:', error.message);
    }
  }

  /**
   * Get translated field value from record
   * Returns ja version if available and requested, otherwise returns default
   */
  static getTranslatedField(record, fieldName, language = 'vi') {
    if (!record) return '';

    if (language === 'ja') {
      const jaField = `${fieldName}_ja`;
      if (record[jaField]) {
        return record[jaField];
      }
    }

    return record[fieldName] || '';
  }
}

module.exports = TranslationService;
