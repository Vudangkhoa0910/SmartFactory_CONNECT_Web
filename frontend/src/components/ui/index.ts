/**
 * UI Components Index - SmartFactory CONNECT
 * Central export for all reusable UI components
 */

// Badge Components
export { default as Badge } from './badge/Badge';
export { default as StatusBadge } from './status-badge/StatusBadge';
export { default as PriorityBadge } from './priority-badge/PriorityBadge';
export type { StatusType, StatusSize } from './status-badge/StatusBadge';
export type { PriorityType, PrioritySize } from './priority-badge/PriorityBadge';

// Button
export { default as Button } from './button/Button';

// Cards
export { default as Card, CardHeader, CardBody, CardFooter } from './card/Card';
export type { CardVariant, CardPadding } from './card/Card';
export { default as StatCard } from './stat-card/StatCard';
export type { TrendDirection, StatCardSize, StatCardVariant } from './stat-card/StatCard';

// Loading States
export { 
  LoadingSpinner, 
  LoadingOverlay, 
  LoadingSkeleton, 
  CardSkeleton, 
  TableRowSkeleton, 
  PageLoading, 
  ButtonLoading 
} from './loading/LoadingSpinner';
export type { SpinnerSize, SpinnerVariant } from './loading/LoadingSpinner';

// Empty State
export { default as EmptyState } from './empty-state/EmptyState';
export type { EmptyStateSize, EmptyStateVariant } from './empty-state/EmptyState';

// Form Components
export { default as SearchInput } from './search-input/SearchInput';

// Navigation
export { default as Tabs } from './tabs/Tabs';

// Table
export { default as DataTable } from './data-table/DataTable';
export type { Column } from './data-table/DataTable';

// Modal
export { Modal } from './modal';

// Avatar
export { default as Avatar } from './avatar/Avatar';

// Dropdown
export { Dropdown } from './dropdown/Dropdown';
export { DropdownItem } from './dropdown/DropdownItem';
