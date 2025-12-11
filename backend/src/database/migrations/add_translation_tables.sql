-- ===============================================
-- TRANSLATION SYSTEM TABLES
-- Migration: Add i18n support for Vietnamese-Japanese
-- Date: 2025-11-25
-- ===============================================

-- ===============================================
-- 1. STATIC TRANSLATIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  vi TEXT NOT NULL,
  ja TEXT NOT NULL,
  category VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON translations(key);
CREATE INDEX IF NOT EXISTS idx_translations_category ON translations(category);

-- ===============================================
-- 2. TRANSLATION CACHE TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  source_lang VARCHAR(2) NOT NULL DEFAULT 'vi',
  target_lang VARCHAR(2) NOT NULL DEFAULT 'ja',
  translated_text TEXT NOT NULL,
  translation_method VARCHAR(50) DEFAULT 'google_free',
  translation_quality INTEGER CHECK (translation_quality BETWEEN 1 AND 5),
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(original_text, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup 
  ON translation_cache(original_text, source_lang, target_lang);

CREATE INDEX IF NOT EXISTS idx_translation_cache_method 
  ON translation_cache(translation_method);

CREATE INDEX IF NOT EXISTS idx_translation_cache_verified 
  ON translation_cache(is_verified);

-- ===============================================
-- 3. ADD LANGUAGE COLUMNS TO EXISTING TABLES
-- ===============================================

-- INCIDENTS TABLE
ALTER TABLE incidents 
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS description_ja TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi';

-- IDEAS TABLE
ALTER TABLE ideas 
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS description_ja TEXT,
  ADD COLUMN IF NOT EXISTS expected_benefit_ja TEXT,
  ADD COLUMN IF NOT EXISTS actual_benefit_ja TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi';

-- NEWS TABLE
ALTER TABLE news 
  ADD COLUMN IF NOT EXISTS title_ja TEXT,
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS summary_ja TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi';

-- DEPARTMENTS TABLE
ALTER TABLE departments 
  ADD COLUMN IF NOT EXISTS name_ja TEXT,
  ADD COLUMN IF NOT EXISTS description_ja TEXT;

-- INCIDENT COMMENTS
ALTER TABLE incident_comments
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi';

-- IDEA RESPONSES
ALTER TABLE idea_responses
  ADD COLUMN IF NOT EXISTS content_ja TEXT,
  ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'vi';

-- ===============================================
-- 4. ADD LANGUAGE PREFERENCE TO USERS
-- ===============================================
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'vi';

CREATE INDEX IF NOT EXISTS idx_users_language ON users(preferred_language);

-- ===============================================
-- 5. SEED STATIC TRANSLATIONS
-- ===============================================
INSERT INTO translations (key, vi, ja, category) VALUES
  -- Menu
  ('menu.dashboard', 'Bảng điều khiển', 'ダッシュボード', 'ui'),
  ('menu.incidents', 'Báo cáo sự cố', 'インシデント報告', 'ui'),
  ('menu.incident_queue', 'Hàng đợi sự cố', 'インシデントキュー', 'ui'),
  ('menu.all_incidents', 'Tất cả sự cố', 'すべてのインシデント', 'ui'),
  ('menu.ideas', 'Góp ý', '提案', 'ui'),
  ('menu.news', 'Tin tức', 'ニュース', 'ui'),
  ('menu.users', 'Quản lý người dùng', 'ユーザー管理', 'ui'),
  ('menu.departments', 'Quản lý phòng ban', '部門管理', 'ui'),
  
  -- Buttons
  ('button.submit', 'Gửi', '送信', 'ui'),
  ('button.cancel', 'Hủy', 'キャンセル', 'ui'),
  ('button.save', 'Lưu', '保存', 'ui'),
  ('button.edit', 'Sửa', '編集', 'ui'),
  ('button.delete', 'Xóa', '削除', 'ui'),
  ('button.search', 'Tìm kiếm', '検索', 'ui'),
  ('button.filter', 'Lọc', 'フィルター', 'ui'),
  ('button.export', 'Xuất', 'エクスポート', 'ui'),
  ('button.close', 'Đóng', '閉じる', 'ui'),
  ('button.back', 'Quay lại', '戻る', 'ui'),
  
  -- Status
  ('status.pending', 'Chờ xử lý', '保留中', 'enum'),
  ('status.assigned', 'Đã phân công', '割り当て済み', 'enum'),
  ('status.in_progress', 'Đang xử lý', '処理中', 'enum'),
  ('status.resolved', 'Đã xử lý', '解決済み', 'enum'),
  ('status.closed', 'Đã đóng', '終了', 'enum'),
  ('status.cancelled', 'Đã hủy', 'キャンセル済み', 'enum'),
  
  -- Priority
  ('priority.low', 'Thấp', '低', 'enum'),
  ('priority.medium', 'Trung bình', '中', 'enum'),
  ('priority.normal', 'Bình thường', '通常', 'enum'),
  ('priority.high', 'Cao', '高', 'enum'),
  ('priority.critical', 'Khẩn cấp', '緊急', 'enum'),
  
  -- Incident Types
  ('incident.type.safety', 'An toàn', '安全', 'enum'),
  ('incident.type.quality', 'Chất lượng', '品質', 'enum'),
  ('incident.type.equipment', 'Thiết bị', '設備', 'enum'),
  ('incident.type.other', 'Khác', 'その他', 'enum'),
  
  -- Labels
  ('label.title', 'Tiêu đề', 'タイトル', 'ui'),
  ('label.description', 'Mô tả', '説明', 'ui'),
  ('label.location', 'Vị trí', '場所', 'ui'),
  ('label.department', 'Phòng ban', '部門', 'ui'),
  ('label.reporter', 'Người báo cáo', '報告者', 'ui'),
  ('label.assigned_to', 'Phân công cho', '担当者', 'ui'),
  ('label.priority', 'Độ ưu tiên', '優先度', 'ui'),
  ('label.status', 'Trạng thái', 'ステータス', 'ui'),
  ('label.created_at', 'Ngày tạo', '作成日', 'ui'),
  ('label.updated_at', 'Ngày cập nhật', '更新日', 'ui'),
  
  -- Messages
  ('message.success', 'Thành công', '成功', 'message'),
  ('message.error', 'Lỗi', 'エラー', 'message'),
  ('message.loading', 'Đang tải...', '読み込み中...', 'message'),
  ('message.no_data', 'Không có dữ liệu', 'データなし', 'message'),
  ('message.confirm_delete', 'Bạn có chắc muốn xóa?', '削除してもよろしいですか？', 'message')
  
ON CONFLICT (key) DO UPDATE SET
  vi = EXCLUDED.vi,
  ja = EXCLUDED.ja,
  updated_at = NOW();

-- ===============================================
-- COMMENTS
-- ===============================================
COMMENT ON TABLE translations IS 'Static UI translations for Vietnamese-Japanese';
COMMENT ON TABLE translation_cache IS 'Cache for dynamic content translations';
COMMENT ON COLUMN incidents.title_ja IS 'Japanese translation of incident title';
COMMENT ON COLUMN ideas.title_ja IS 'Japanese translation of idea title';
COMMENT ON COLUMN news.title_ja IS 'Japanese translation of news title';
