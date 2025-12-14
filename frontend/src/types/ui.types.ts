/**
 * Common UI Types - SmartFactory CONNECT
 * Shared types for UI components
 */

// Badge Types
export interface BadgeProps {
  count?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  max?: number;
  showZero?: boolean;
  pulse?: boolean;
}

// Button Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Card Types
export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Filter Types
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'daterange';
  options?: FilterOption[];
  value?: string | string[] | { start: string; end: string };
  onChange?: (value: unknown) => void;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  fixed?: 'left' | 'right';
  hidden?: boolean;
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showTotal?: boolean;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: TablePagination;
  rowSelection?: {
    selectedRowKeys: string[];
    onChange: (keys: string[]) => void;
  };
  onRow?: (record: T, index: number) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  emptyText?: string;
  stickyHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

// Modal Types
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

// Dropdown Types
export interface DropdownItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

// Status Types
export type StatusType = 'pending' | 'in_progress' | 'resolved' | 'closed' | 'cancelled' | 'rejected' | 'approved';
export type PriorityType = 'critical' | 'high' | 'medium' | 'low';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon?: React.ReactNode;
}

// Toast/Notification Types
export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Empty State Types
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Loading State Types
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

// Avatar Types
export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  badge?: number;
  className?: string;
}

// Breadcrumb Types
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

// Tab Types
export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  disabled?: boolean;
  content?: React.ReactNode;
}

// Search Types
export interface SearchResult {
  id: string;
  type: 'incident' | 'idea' | 'user' | 'booking' | 'news' | 'department';
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  link: string;
}
