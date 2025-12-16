import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { useTranslation } from "../../contexts/LanguageContext";

// Import types and services
import { UIMessage } from '../../components/ChatAssistant/types';
import { useNotificationPolling } from '../../components/ChatAssistant/useNotificationPolling';
import { handleCommand } from '../../components/ChatAssistant/commandHandler';
import { sendMessageToGemini } from '../../services/gemini';

// Import components
import MessageList from '../../components/ChatAssistant/MessageList';
import ChatInput from '../../components/ChatAssistant/ChatInput';

const LargeChatPage: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<UIMessage[]>([
    { 
      role: 'model', 
      text: t('chat.welcome_message'),
      actions: [
        {
          label: t('chat.guide_button'),
          onClick: () => {
            setInput('hướng dẫn');
            handleSend();
          },
          className: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:from-red-100 hover:to-red-200'
        }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const navigate = useNavigate();

  // Hook kiểm tra thông báo mới (always active here since page is open)
  const { cachedNotifications } = useNotificationPolling(
    true,
    setMessages
  );

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: UIMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const commandHandled = await handleCommand({
        input: currentInput,
        lowerInput: currentInput.toLowerCase(),
        pendingAction,
        cachedNotifications,
        setMessages,
        setPendingAction,
        navigate,
        t
      });

      if (!commandHandled) {
        const responseText = await sendMessageToGemini(messages, currentInput);
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, tôi đang gặp sự cố kết nối.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to handle sending from input component
  const onSend = () => {
    handleSend();
  };

  // Check if we have only the initial message to determine layout
  const isInitialState = messages.length <= 1;

  return (
    <div className="flex flex-col h-[calc(100vh-75px)] bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden relative">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex items-center gap-3 bg-white dark:bg-neutral-900">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
          <MessageCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">{t('chat.title')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('chat.subtitle')}</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        
        {/* Messages - Hide if initial state to show centered input view */}
        {!isInitialState && (
          <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-neutral-900">
             <MessageList 
              messages={messages} 
              isLoading={isLoading}
              className="h-full"
              onNotificationClick={(notification) => {
                setMessages(prev => [...prev, {
                  role: 'model',
                  text: `Chi tiết thông báo:\n\n${notification.title}\n\n${notification.message || notification.content || 'Không có nội dung chi tiết.'}`
                }]);
              }}
              onIncidentClick={(incident) => {
                 // Reuse logic from ChatAssistant or simplify
                 navigate(`/incidents/${incident.id}`);
              }}
              onIdeaClick={(idea) => {
                 // Reuse logic
                 navigate(`/ideas/${idea.id}`); // Assuming route
              }}
            />
          </div>
        )}

        {/* Initial State View - Centered */}
        {isInitialState && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-neutral-900">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <MessageCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              {t('chat.help_title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
              {t('chat.help_subtitle')}
            </p>
            
            {/* Centered Input for Initial State */}
            <div className="w-full max-w-2xl">
               <ChatInput 
                input={input} 
                setInput={setInput} 
                onSend={onSend} 
                isLoading={isLoading} 
              />
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => { setInput('hướng dẫn'); handleSend(); }}
                className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {t('chat.quick_guide')}
              </button>
              <button 
                onClick={() => { setInput('xem thông báo'); handleSend(); }}
                className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {t('chat.quick_news')}
              </button>
              <button 
                onClick={() => { setInput('đặt phòng họp'); handleSend(); }}
                className="px-4 py-2 bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors"
              >
                {t('chat.quick_booking')}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Input - Show only if NOT initial state */}
        {!isInitialState && (
          <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700">
            <div className="max-w-4xl mx-auto">
              <ChatInput 
                input={input} 
                setInput={setInput} 
                onSend={onSend} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LargeChatPage;
