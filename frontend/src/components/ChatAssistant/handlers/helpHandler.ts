import { NavigateFunction } from 'react-router';
import { UIMessage, Notification } from '../types';

interface CommandHandlerParams {
  input: string;
  lowerInput: string;
  pendingAction: string | null;
  cachedNotifications: Notification[];
  setMessages: React.Dispatch<React.SetStateAction<UIMessage[]>>;
  setPendingAction: (action: string | null) => void;
  navigate: NavigateFunction;
  t: (key: string) => string;
}

export function handleHelpCommand(
  params: CommandHandlerParams,
  isAdmin: boolean
): boolean {
  const { lowerInput, setMessages, t } = params;
  
  // Check for specific help topics first
  if (lowerInput.includes('hướng dẫn đặt phòng')) {
    showRoomBookingHelp(setMessages, t);
    return true;
  }
  if (lowerInput.includes('hướng dẫn thông báo')) {
    showNotificationHelp(setMessages, t);
    return true;
  }
  if (lowerInput.includes('hướng dẫn điều hướng')) {
    showNavigationHelp(setMessages, t);
    return true;
  }
  if (isAdmin && lowerInput.includes('hướng dẫn sự cố')) {
    showIncidentHelp(setMessages, t);
    return true;
  }
  if (isAdmin && lowerInput.includes('hướng dẫn ý tưởng')) {
    showIdeaHelp(setMessages, t);
    return true;
  }
  if (isAdmin && lowerInput.includes('hướng dẫn tin tức')) {
    showNewsHelp(setMessages, t);
    return true;
  }

  // General help command
  if (!lowerInput.includes('hướng dẫn') && 
      !lowerInput.includes('trợ giúp') && 
      !lowerInput.includes('help') && 
      lowerInput !== 'h' && 
      lowerInput !== '?' && 
      !lowerInput.includes('từ khóa') && 
      !lowerInput.includes('lệnh')) {
    return false;
  }

  // Show topic selection menu
  const actions = buildTopicActions(params, isAdmin);
  setMessages(prev => [...prev, { 
    role: 'model', 
    text: t('help.menu_title'), 
    actions 
  }]);
  return true;
}

function showRoomBookingHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.booking_title')}\n\n${t('help.booking_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function showNotificationHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.notification_title')}\n\n${t('help.notification_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function showNavigationHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.navigation_title')}\n\n${t('help.navigation_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function showIncidentHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.incident_title')}\n\n${t('help.incident_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function showIdeaHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.idea_title')}\n\n${t('help.idea_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function showNewsHelp(setMessages: any, t: (key: string) => string) {
  const text = `${t('help.news_title')}\n\n${t('help.news_content')}`;
  setMessages((prev: any) => [...prev, { role: 'model', text }]);
}

function buildTopicActions(
  params: CommandHandlerParams,
  isAdmin: boolean
): Array<{ label: string; onClick: () => void; className: string }> {
  const { setMessages, t } = params;
  
  // Helper to simulate sending a message
  const sendHiddenCommand = (text: string) => {
    // We don't show the user message to keep it clean, or we can show it.
    // Let's show it so the user knows what happened.
    // setMessages(prev => [...prev, { role: 'user', text }]);
    
    if (text.includes('đặt phòng')) showRoomBookingHelp(setMessages, t);
    else if (text.includes('thông báo')) showNotificationHelp(setMessages, t);
    else if (text.includes('điều hướng')) showNavigationHelp(setMessages, t);
    else if (text.includes('sự cố')) showIncidentHelp(setMessages, t);
    else if (text.includes('ý tưởng')) showIdeaHelp(setMessages, t);
    else if (text.includes('tin tức')) showNewsHelp(setMessages, t);
  };

  const actions = [
    {
      label: t('help.btn_booking'),
      onClick: () => sendHiddenCommand('hướng dẫn đặt phòng'),
      className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
    },
    {
      label: t('help.btn_notification'),
      onClick: () => sendHiddenCommand('hướng dẫn thông báo'),
      className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
    },
    {
      label: t('help.btn_navigation'),
      onClick: () => sendHiddenCommand('hướng dẫn điều hướng'),
      className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
    }
  ];

  if (isAdmin) {
    actions.push(
      {
        label: t('help.btn_incident'),
        onClick: () => sendHiddenCommand('hướng dẫn sự cố'),
        className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
      },
      {
        label: t('help.btn_idea'),
        onClick: () => sendHiddenCommand('hướng dẫn ý tưởng'),
        className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
      },
      {
        label: t('help.btn_news'),
        onClick: () => sendHiddenCommand('hướng dẫn tin tức'),
        className: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
      }
    );
  }

  return actions;
}
