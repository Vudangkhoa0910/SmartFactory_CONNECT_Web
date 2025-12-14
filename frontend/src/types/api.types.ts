/**
 * API Types - SmartFactory CONNECT
 * Common types for API communication
 */

// Base Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Request Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, unknown>;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
    refresh_token?: string;
    expires_at: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  permissions: string[];
  department_id?: string;
  department_name?: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    token: string;
    expires_at: string;
  };
}

// Upload Types
export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    size: number;
    type: string;
  };
}

export interface MultiUploadResponse {
  success: boolean;
  data: {
    files: {
      url: string;
      filename: string;
      size: number;
      type: string;
    }[];
    failed?: {
      filename: string;
      error: string;
    }[];
  };
}

// Error Codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// HTTP Status
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request Config
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  retry?: {
    attempts: number;
    delay: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

// WebSocket Types
export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

// Export/Import Types
export interface ExportRequest {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: Record<string, unknown>;
  columns?: string[];
  filename?: string;
}

export interface ExportResponse {
  success: boolean;
  data: {
    download_url: string;
    filename: string;
    expires_at: string;
  };
}

export interface ImportResult {
  success: boolean;
  data: {
    total: number;
    imported: number;
    skipped: number;
    errors: {
      row: number;
      field: string;
      error: string;
    }[];
  };
}

// Health Check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
    queue: 'up' | 'down';
  };
  timestamp: string;
}
