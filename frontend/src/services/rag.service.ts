/**
 * RAG Service
 * API client cho RAG Incident Router Service
 */
import axios from 'axios';

// RAG Service URL (Python FastAPI on port 8001)
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8001';

const ragApi = axios.create({
  baseURL: RAG_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Types
export interface DepartmentSuggestion {
  department_id: string | null;
  department_name: string | null;
  confidence: number;
  auto_assign: boolean;
}

export interface SimilarIncident {
  id: string;
  description: string;
  department_id: string;
  department_name: string;
  similarity: number;
}

export interface AutoAssignInfo {
  auto_assign: boolean;
  confidence: number;
  threshold: number;
  enabled: boolean;
  current_samples: number;
  min_samples: number;
  reasons: string[];
}

export interface SuggestResponse {
  success: boolean;
  suggestion: DepartmentSuggestion | null;
  similar_incidents: SimilarIncident[];
  message: string;
  auto_assign_info?: AutoAssignInfo;
}

export interface RAGSettings {
  enabled: boolean;
  threshold: number;
  min_samples: number;
  current_samples?: number;
  recommendation?: string;
}

export interface EmbeddingStats {
  total: number;
  with_embedding: number;
  without_embedding: number;
  percentage: number;
}

// Multi-field request for better accuracy
export interface SuggestRequest {
  description: string;
  location?: string;
  incident_type?: string;
  priority?: string;
}

// Service functions
const ragService = {
  /**
   * Goi y department cho incident dua tren multi-field
   * Always use multi-field for better accuracy
   */
  async suggestDepartment(request: SuggestRequest | string): Promise<SuggestResponse> {
    // Support both string (backward compatible) and object
    const payload = typeof request === 'string' 
      ? { description: request }
      : request;
    const response = await ragApi.post<SuggestResponse>('/suggest', payload);
    return response.data;
  },

  /**
   * Tim cac incidents tuong tu
   */
  async findSimilar(description: string, limit: number = 5): Promise<SimilarIncident[]> {
    const response = await ragApi.get('/similar', {
      params: { description, limit }
    });
    return response.data.incidents;
  },

  /**
   * Tao embedding sau khi incident duoc duyet
   */
  async createEmbedding(incidentId: string): Promise<{ success: boolean; message: string }> {
    const response = await ragApi.post(`/create-embedding/${incidentId}`);
    return response.data;
  },

  /**
   * Lay thong ke embeddings
   */
  async getStats(): Promise<EmbeddingStats> {
    const response = await ragApi.get<EmbeddingStats>('/stats');
    return response.data;
  },

  /**
   * Lay cau hinh RAG auto-assign
   */
  async getSettings(): Promise<RAGSettings> {
    const response = await ragApi.get<RAGSettings>('/settings/rag');
    return response.data;
  },

  /**
   * Cap nhat cau hinh RAG auto-assign
   */
  async updateSettings(settings: Omit<RAGSettings, 'current_samples' | 'recommendation'>): Promise<RAGSettings> {
    const response = await ragApi.put<RAGSettings>('/settings/rag', settings);
    return response.data;
  },

  /**
   * Kiem tra trang thai service
   */
  async healthCheck(): Promise<{ status: string; model: string; embeddings: EmbeddingStats }> {
    const response = await ragApi.get('/health');
    return response.data;
  }
};

export default ragService;
