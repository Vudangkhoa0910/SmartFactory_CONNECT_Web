/**
 * News Types - SmartFactory CONNECT
 * Types for News/Announcement System
 */

// Status & Types
export type NewsStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type NewsCategory = 'announcement' | 'company_news' | 'event' | 'policy' | 'training' | 'achievement' | 'other';
export type NewsPriority = 'urgent' | 'high' | 'normal' | 'low';
export type NewsTarget = 'all' | 'department' | 'role' | 'specific_users';

// Labels
export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: 'Bản nháp',
  scheduled: 'Đã lên lịch',
  published: 'Đã đăng',
  archived: 'Lưu trữ',
};

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  announcement: 'Thông báo',
  company_news: 'Tin công ty',
  event: 'Sự kiện',
  policy: 'Chính sách',
  training: 'Đào tạo',
  achievement: 'Thành tích',
  other: 'Khác',
};

export const NEWS_PRIORITY_LABELS: Record<NewsPriority, string> = {
  urgent: 'Khẩn cấp',
  high: 'Cao',
  normal: 'Bình thường',
  low: 'Thấp',
};

// Colors
export const NEWS_STATUS_COLORS: Record<NewsStatus, { text: string; bg: string; border: string }> = {
  draft: { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-500' },
  scheduled: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-500' },
  published: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
  archived: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
};

export const NEWS_PRIORITY_COLORS: Record<NewsPriority, { text: string; bg: string; border: string }> = {
  urgent: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
  high: { text: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-500' },
  normal: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-500' },
  low: { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-500' },
};

// Main News Type
export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  
  // Categorization
  category: NewsCategory;
  tags?: string[];
  priority: NewsPriority;
  
  // Media
  featured_image?: string;
  gallery?: string[];
  attachments?: NewsAttachment[];
  
  // Status
  status: NewsStatus;
  
  // Publishing
  author_id: string;
  author_name: string;
  author_avatar?: string;
  published_at?: string;
  scheduled_at?: string;
  
  // Target Audience
  target: NewsTarget;
  target_departments?: string[];
  target_roles?: string[];
  target_users?: string[];
  
  // Engagement
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  has_liked?: boolean;
  has_bookmarked?: boolean;
  
  // Read Receipt
  is_read_required?: boolean;
  read_by_count?: number;
  total_target_count?: number;
  
  // SEO
  meta_title?: string;
  meta_description?: string;
  
  // Pinning
  is_pinned: boolean;
  pinned_until?: string;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  archived_at?: string;
}

export interface NewsAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  has_liked?: boolean;
  replies?: NewsComment[];
}

export interface NewsReadReceipt {
  news_id: string;
  user_id: string;
  user_name: string;
  user_department?: string;
  read_at: string;
  acknowledged_at?: string;
}

// Related News
export interface RelatedNews {
  id: string;
  title: string;
  slug: string;
  featured_image?: string;
  category: NewsCategory;
  published_at: string;
}

// Filters
export interface NewsFilters {
  search?: string;
  status?: NewsStatus | NewsStatus[];
  category?: NewsCategory | NewsCategory[];
  priority?: NewsPriority | NewsPriority[];
  author_id?: string;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'oldest' | 'most_viewed' | 'most_liked';
}

// Statistics
export interface NewsStats {
  total: number;
  by_status: Record<NewsStatus, number>;
  by_category: Record<NewsCategory, number>;
  total_views: number;
  total_engagement: number;
  avg_read_rate: number;
  top_articles: {
    id: string;
    title: string;
    views_count: number;
    likes_count: number;
    comments_count: number;
  }[];
  monthly_trends: {
    month: string;
    published: number;
    views: number;
    engagement: number;
  }[];
}

// Carousel/Banner
export interface NewsBanner {
  id: string;
  news_id: string;
  title: string;
  excerpt?: string;
  featured_image: string;
  link?: string;
  order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

// API Responses
export interface NewsListResponse {
  success: boolean;
  data: NewsArticle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NewsDetailResponse {
  success: boolean;
  data: NewsArticle & {
    comments: NewsComment[];
    related: RelatedNews[];
  };
}

export interface ReadReceiptsResponse {
  success: boolean;
  data: {
    total_target: number;
    read_count: number;
    read_rate: number;
    receipts: NewsReadReceipt[];
  };
}

// Actions
export interface CreateNewsData {
  title: string;
  content: string;
  excerpt?: string;
  category: NewsCategory;
  priority?: NewsPriority;
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at?: string;
  featured_image?: File;
  attachments?: File[];
  tags?: string[];
  target?: NewsTarget;
  target_departments?: string[];
  target_roles?: string[];
  target_users?: string[];
  is_read_required?: boolean;
  is_pinned?: boolean;
  pinned_until?: string;
}

export interface UpdateNewsData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: NewsCategory;
  priority?: NewsPriority;
  status?: NewsStatus;
  scheduled_at?: string;
  featured_image?: File;
  tags?: string[];
  target?: NewsTarget;
  target_departments?: string[];
  target_roles?: string[];
  target_users?: string[];
  is_read_required?: boolean;
  is_pinned?: boolean;
  pinned_until?: string;
}
