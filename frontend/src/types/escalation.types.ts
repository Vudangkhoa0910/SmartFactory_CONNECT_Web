/**
 * Escalation Types
 */
import { UUID, Priority, Severity } from './common.types';

export interface EscalationHistory {
  id: UUID;
  reference_type: 'incident' | 'idea';
  reference_id: UUID;
  from_level: number;
  to_level: number;
  from_handler_id?: UUID;
  from_handler_name?: string;
  to_handler_id?: UUID;
  to_handler_name?: string;
  reason: string;
  is_automatic: boolean;
  escalated_by: UUID;
  escalated_by_name?: string;
  created_at: string;
}

export interface SLAConfiguration {
  id: UUID;
  entity_type: 'incident' | 'idea';
  priority: Priority;
  severity?: Severity;
  first_response_time: number; // minutes
  resolution_time: number; // minutes
  escalation_time?: number; // minutes
  is_active: boolean;
}
