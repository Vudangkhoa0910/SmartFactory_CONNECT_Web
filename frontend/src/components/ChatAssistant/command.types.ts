/**
 * Command Handler Types
 */
import { NavigateFunction } from 'react-router';
import { UIMessage, Notification } from './types';

export interface CommandHandlerParams {
  input: string;
  lowerInput: string;
  pendingAction: string | null;
  cachedNotifications: Notification[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  setPendingAction: (action: string | null) => void;
  navigate: NavigateFunction;
}

export interface CommandResult {
  handled: boolean;
  message?: string;
}
