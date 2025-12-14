/**
 * Common Types - Shared across the application
 */

export type UUID = string;

export type UserRole = 
  | 'admin'
  | 'factory_manager'
  | 'production_manager'
  | 'safety_manager'
  | 'supervisor'
  | 'team_leader'
  | 'employee';

export type UserLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Attachment {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
}

// Display mappings
export const PriorityDisplay: Record<Priority, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  critical: 'Nghiêm trọng',
};
