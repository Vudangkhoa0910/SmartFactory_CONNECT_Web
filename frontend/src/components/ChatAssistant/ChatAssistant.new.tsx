/**
 * ChatAssistant Component - SmartFactory CONNECT
 * Refactored to use modular handlers
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, X } from 'lucide-react';

// Import các phần đã được tách
import { UIMessage } from './types';
import { useNotificationPolling } from './useNotificationPolling';
import { handleCommand } from './commandHandler';
import { sendMessageToGemini } from '../../services/gemini';
import { 
  handleNotificationClick, 
  handleIncidentClick, 
  buildIdeaDetailText,
  fetchIdeaResponses,
  fetchIdeaHistory 
} from './messageHandlers';

// Import các component con
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([
    { 
      role: 'model', 
      text: 'Xin chào! Tôi là trợ lý ảo SmartFactory. Tôi có thể giúp gì cho bạn hôm nay?',
      actions: [
        {
          label: '📖 Hướng dẫn sử dụng',
          onClick: () => {
            setInput('hướng dẫn');
            handleSend();
          },
          className: 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100'
        }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if current user is admin
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isAdmin = currentUser?.role === 'admin';

  // Hook kiểm tra thông báo mới
  const { hasUnreadNotifications, cachedNotifications } = useNotificationPolling(
    isOpen,
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

  // Idea click handler with actions
  const onIdeaClick = (idea: Parameters<typeof buildIdeaDetailText>[0]) => {
    const detailText = buildIdeaDetailText(idea);
    
    setMessages(prev => [...prev, {
      role: 'model',
      text: detailText,
      actions: [
        {
          label: 'Xem chi tiết đầy đủ',
          onClick: () => navigate(`/ideas/${idea.id}`)
        },
        // Response history button - only for admin
        ...(isAdmin ? [{
          label: 'Lịch sử phản hồi',
          onClick: () => fetchIdeaResponses(idea.id, idea.title, idea.ideabox_type, setMessages),
          className: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-pink-100'
        }] : []),
        // Action history button for white box - only for admin
        ...(isAdmin && idea.ideabox_type === 'white' ? [{
          label: '📋 Lịch sử xử lý',
          onClick: () => fetchIdeaHistory(idea.id, idea.title, setMessages),
          className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100'
        }] : [])
      ]
    }]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">

      {/* --- CỬA SỔ CHAT (Trắng – Hồng) --- */}
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-pink-300 
        w-[850px] max-w-[calc(100vw-48px)] overflow-hidden transition-all duration-300 
        ease-in-out origin-bottom-right 
        ${isOpen ? 'scale-100 opacity-100 mb-4' : 'scale-0 opacity-0 mb-0 h-0'}`}
      >
        <ChatHeader onClose={() => setIsOpen(false)} />
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
          onNotificationClick={(notification) => handleNotificationClick(notification, setMessages)}
          onIncidentClick={(incident) => handleIncidentClick(incident, setMessages, navigate)}
          onIdeaClick={onIdeaClick}
        />
        <ChatInput input={input} setInput={setInput} onSend={handleSend} isLoading={isLoading} />
      </div>

      {/* --- NÚT FLOATING CHAT (Đỏ – Hồng) --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center justify-center w-16 h-16 rounded-full 
        shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none 
        focus:ring-4 focus:ring-pink-300 
        ${
          isOpen
            ? 'bg-white text-pink-500 rotate-90'
            : 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-500 text-white hover:shadow-pink-500/50'
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={32} strokeWidth={2.5} />}

        {/* Badge thông báo đỏ–hồng */}
        {!isOpen && hasUnreadNotifications && (
          <span className="absolute top-0 right-0 flex h-5 w-5 -mt-1 -mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-500 border-2 border-white"></span>
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;
