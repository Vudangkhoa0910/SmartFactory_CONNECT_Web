/**
 * Idea Service
 * Provides API calls for idea/kaizen management
 */
import api from './api';

// ============================================
// Types
// ============================================

export interface Idea {
  id: string;
  idea_code: string;
  title: string;
  description: string;
  category: string;
  box_type: 'white' | 'pink';
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'implementing' | 'implemented';
  priority: 'low' | 'medium' | 'high';
  difficulty_level?: 'A' | 'B' | 'C' | 'D';
  expected_benefit?: string;
  estimated_savings?: number;
  actual_savings?: number;
  department_id?: string;
  department_name?: string;
  submitter_id: string;
  submitter_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  reviewed_by?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  implemented_at?: string;
  attachments?: string[];
  vote_count?: number;
  rating_avg?: number;
}

export interface IdeaFilters {
  status?: string;
  box_type?: string;
  category?: string;
  department_id?: string;
  difficulty_level?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IdeaStats {
  total: number;
  by_status: Record<string, number>;
  by_category: { category: string; count: number }[];
  by_difficulty: Record<string, number>;
  total_estimated_savings: number;
  total_actual_savings: number;
  implementation_rate: number;
}

export interface CreateIdeaData {
  title: string;
  description: string;
  category: string;
  box_type: 'white' | 'pink';
  expected_benefit?: string;
  estimated_savings?: number;
  department_id?: string;
  attachments?: File[];
}

// ============================================
// Idea API Functions
// ============================================

/**
 * Get ideas with filters
 */
export const getIdeas = async (filters?: IdeaFilters): Promise<{
  data: Idea[];
  pagination: { page: number; limit: number; totalItems: number; totalPages: number };
}> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.box_type) params.append('box_type', filters.box_type);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.department_id) params.append('department_id', filters.department_id);
  if (filters?.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const response = await api.get(`/ideas?${params.toString()}`);
  return response.data;
};

/**
 * Get single idea by ID
 */
export const getIdeaById = async (id: string): Promise<Idea> => {
  const response = await api.get(`/ideas/${id}`);
  return response.data.data;
};

/**
 * Create new idea
 */
export const createIdea = async (data: CreateIdeaData): Promise<Idea> => {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('category', data.category);
  formData.append('box_type', data.box_type);
  if (data.expected_benefit) formData.append('expected_benefit', data.expected_benefit);
  if (data.estimated_savings) formData.append('estimated_savings', data.estimated_savings.toString());
  if (data.department_id) formData.append('department_id', data.department_id);
  if (data.attachments) {
    data.attachments.forEach(file => formData.append('attachments', file));
  }

  const response = await api.post('/ideas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

/**
 * Update idea
 */
export const updateIdea = async (id: string, data: Partial<Idea>): Promise<Idea> => {
  const response = await api.put(`/ideas/${id}`, data);
  return response.data.data;
};

/**
 * Review idea (approve/reject)
 */
export const reviewIdea = async (id: string, status: 'approved' | 'rejected', notes?: string): Promise<Idea> => {
  const response = await api.put(`/ideas/${id}/review`, { status, review_notes: notes });
  return response.data.data;
};

/**
 * Assign idea to user
 */
export const assignIdea = async (id: string, assigneeId: string): Promise<Idea> => {
  const response = await api.put(`/ideas/${id}/assign`, { assigned_to: assigneeId });
  return response.data.data;
};

/**
 * Mark idea as implemented
 */
export const implementIdea = async (id: string, actualSavings?: number): Promise<Idea> => {
  const response = await api.put(`/ideas/${id}/implement`, { actual_savings: actualSavings });
  return response.data.data;
};

/**
 * Vote for idea (Kaizen bank)
 */
export const voteIdea = async (id: string): Promise<void> => {
  await api.post(`/ideas/${id}/vote`);
};

/**
 * Rate idea
 */
export const rateIdea = async (id: string, rating: number, feedback?: string): Promise<void> => {
  await api.post(`/ideas/${id}/rate`, { rating, feedback });
};

/**
 * Get idea statistics
 */
export const getIdeaStats = async (): Promise<IdeaStats> => {
  const response = await api.get('/ideas/stats');
  return response.data.data;
};

/**
 * Get Kaizen bank (implemented ideas)
 */
export const getKaizenBank = async (filters?: { category?: string; search?: string }): Promise<Idea[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);

  const response = await api.get(`/ideas/kaizen-bank?${params.toString()}`);
  return response.data.data;
};

/**
 * Get idea difficulty distribution
 */
export const getDifficultyDistribution = async (): Promise<{ category: string; count: number }[]> => {
  const response = await api.get('/ideas/difficulty-distribution');
  return response.data.data;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get status label in Vietnamese
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    submitted: 'Đã gửi',
    reviewing: 'Đang xem xét',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    implementing: 'Đang triển khai',
    implemented: 'Đã triển khai',
  };
  return labels[status] || status;
};

/**
 * Get box type label in Vietnamese
 */
export const getBoxTypeLabel = (boxType: string): string => {
  const labels: Record<string, string> = {
    white: 'Hộp trắng (Ý tưởng cải tiến)',
    pink: 'Hộp hồng (Góp ý nhạy cảm)',
  };
  return labels[boxType] || boxType;
};

/**
 * Get difficulty label in Vietnamese
 */
export const getDifficultyLabel = (level: string): string => {
  const labels: Record<string, string> = {
    A: 'Dễ',
    B: 'Trung bình',
    C: 'Khó',
    D: 'Rất khó',
  };
  return labels[level] || level;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800',
    reviewing: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    implementing: 'bg-purple-100 text-purple-800',
    implemented: 'bg-teal-100 text-teal-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Get difficulty color class
 */
export const getDifficultyColor = (level: string): string => {
  const colors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-yellow-500',
    C: 'bg-orange-500',
    D: 'bg-red-500',
  };
  return colors[level] || 'bg-gray-500';
};

export default {
  getIdeas,
  getIdeaById,
  createIdea,
  updateIdea,
  reviewIdea,
  assignIdea,
  implementIdea,
  voteIdea,
  rateIdea,
  getIdeaStats,
  getKaizenBank,
  getDifficultyDistribution,
  getStatusLabel,
  getBoxTypeLabel,
  getDifficultyLabel,
  getStatusColor,
  getDifficultyColor,
};
