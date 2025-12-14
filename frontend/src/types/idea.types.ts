/**
 * Idea/Feedback Types - SmartFactory CONNECT
 * Types for Feedback/Suggestion Box System (Hòm thư góp ý)
 */

// Status & Priority
export type IdeaStatus = 'submitted' | 'reviewing' | 'approved' | 'implementing' | 'implemented' | 'rejected' | 'archived';
export type IdeaCategory = 'process' | 'quality' | 'safety' | 'cost' | 'innovation' | 'environment' | 'other';
export type IdeaImpact = 'high' | 'medium' | 'low';

// Labels
export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  submitted: 'Đã gửi',
  reviewing: 'Đang xem xét',
  approved: 'Đã duyệt',
  implementing: 'Đang triển khai',
  implemented: 'Đã triển khai',
  rejected: 'Từ chối',
  archived: 'Lưu trữ',
};

export const IDEA_CATEGORY_LABELS: Record<IdeaCategory, string> = {
  process: 'Quy trình',
  quality: 'Chất lượng',
  safety: 'An toàn',
  cost: 'Chi phí',
  innovation: 'Đổi mới',
  environment: 'Môi trường',
  other: 'Khác',
};

export const IDEA_IMPACT_LABELS: Record<IdeaImpact, string> = {
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

// Colors
export const IDEA_STATUS_COLORS: Record<IdeaStatus, { text: string; bg: string; border: string }> = {
  submitted: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-500' },
  reviewing: { text: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-500' },
  approved: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
  implementing: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  implemented: { text: 'text-teal-700', bg: 'bg-teal-100', border: 'border-teal-500' },
  rejected: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
  archived: { text: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-500' },
};

export const IDEA_IMPACT_COLORS: Record<IdeaImpact, { text: string; bg: string; border: string }> = {
  high: { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-500' },
  medium: { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-500' },
  low: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-500' },
};

// Main Idea Type
export interface Idea {
  id: string;
  idea_number: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  
  // Submitter (can be anonymous)
  is_anonymous: boolean;
  submitter_id?: string;
  submitter_name?: string;
  submitter_department?: string;
  submitter_avatar?: string;
  
  // Impact Assessment
  expected_impact?: IdeaImpact;
  expected_benefit?: string;
  estimated_cost_saving?: number;
  implementation_effort?: 'low' | 'medium' | 'high';
  
  // Attachment
  images?: string[];
  attachments?: IdeaAttachment[];
  
  // Voting & Engagement
  upvotes: number;
  downvotes: number;
  comments_count: number;
  views_count: number;
  has_voted?: 'up' | 'down' | null;
  
  // Review Process
  reviewer_id?: string;
  reviewer_name?: string;
  review_date?: string;
  review_notes?: string;
  rejection_reason?: string;
  
  // Implementation
  implementer_id?: string;
  implementer_name?: string;
  implementation_start_date?: string;
  implementation_end_date?: string;
  implementation_notes?: string;
  actual_cost_saving?: number;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  
  // Rewards
  reward_points?: number;
  reward_status?: 'pending' | 'awarded' | 'none';
}

export interface IdeaAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  is_official_response?: boolean;
  created_at: string;
  updated_at?: string;
  replies?: IdeaComment[];
  likes_count: number;
  has_liked?: boolean;
}

export interface IdeaHistory {
  id: string;
  idea_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  user_id: string;
  user_name: string;
  created_at: string;
  details?: string;
}

// Similar Ideas (to avoid duplicates)
export interface SimilarIdea {
  id: string;
  idea_number: string;
  title: string;
  similarity_score: number;
  status: IdeaStatus;
  created_at: string;
}

// Filters
export interface IdeaFilters {
  search?: string;
  status?: IdeaStatus | IdeaStatus[];
  category?: IdeaCategory | IdeaCategory[];
  impact?: IdeaImpact | IdeaImpact[];
  department_id?: string;
  submitter_id?: string;
  is_anonymous?: boolean;
  has_reward?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'newest' | 'oldest' | 'most_voted' | 'most_viewed' | 'most_commented';
  page?: number;
  limit?: number;
}

// Statistics
export interface IdeaStats {
  total: number;
  by_status: Record<IdeaStatus, number>;
  by_category: Record<IdeaCategory, number>;
  total_cost_saved: number;
  implementation_rate: number;
  avg_review_time_days: number;
  avg_implementation_time_days: number;
  top_contributors: {
    user_id: string;
    user_name: string;
    user_avatar?: string;
    ideas_count: number;
    implemented_count: number;
    total_reward_points: number;
  }[];
  monthly_trends: {
    month: string;
    submitted: number;
    implemented: number;
    cost_saved: number;
  }[];
}

// Leaderboard
export interface IdeaLeaderboard {
  period: 'week' | 'month' | 'quarter' | 'year' | 'all';
  entries: {
    rank: number;
    user_id: string;
    user_name: string;
    user_avatar?: string;
    department_name?: string;
    ideas_submitted: number;
    ideas_implemented: number;
    total_votes: number;
    reward_points: number;
  }[];
}

// Department Ranking
export interface DepartmentIdeaRanking {
  department_id: string;
  department_name: string;
  total_ideas: number;
  implemented_ideas: number;
  implementation_rate: number;
  total_cost_saved: number;
  participation_rate: number;
}

// API Responses
export interface IdeasResponse {
  success: boolean;
  data: Idea[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IdeaDetailResponse {
  success: boolean;
  data: Idea & {
    comments: IdeaComment[];
    history: IdeaHistory[];
    similar: SimilarIdea[];
  };
}

// Actions
export interface CreateIdeaData {
  title: string;
  description: string;
  category: IdeaCategory;
  is_anonymous?: boolean;
  expected_benefit?: string;
  estimated_cost_saving?: number;
  images?: File[];
}

export interface ReviewIdeaData {
  status: 'approved' | 'rejected';
  review_notes: string;
  rejection_reason?: string;
  expected_impact?: IdeaImpact;
  implementation_effort?: 'low' | 'medium' | 'high';
}

export interface ImplementIdeaData {
  implementer_id: string;
  implementation_notes?: string;
  implementation_start_date: string;
  estimated_end_date?: string;
}

export interface CompleteImplementationData {
  implementation_end_date: string;
  implementation_notes: string;
  actual_cost_saving?: number;
  reward_points?: number;
}

// Vote
export interface VoteData {
  idea_id: string;
  vote_type: 'up' | 'down';
}
