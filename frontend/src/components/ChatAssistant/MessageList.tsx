import React, { useEffect, useRef } from 'react';
import { UIMessage, Notification, Incident } from './types';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onIncidentClick?: (incident: Incident) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onNotificationClick, onIncidentClick }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  return (
    <div className="h-[650px] overflow-y-auto p-5 bg-slate-50 dark:bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-1' : ''}>
                  {line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line}
                </p>
              ))}
              
              {/* Hiển thị Notification Cards */}
             {msg.notificationCards && msg.notificationCards.length > 0 && (
  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
    {msg.notificationCards.map((notif, cardIdx) => (
      <div
        key={notif.id}
        className="bg-gradient-to-r from-pink-50 to-red-50 
                   dark:from-pink-700 dark:to-red-700 
                   border border-pink-200 dark:border-pink-600 
                   rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNotificationClick && onNotificationClick(notif)}
      >
        <div className="flex items-start gap-3">

          {/* Số thứ tự */}
          <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full 
                          flex items-center justify-center font-bold text-sm">
            {cardIdx + 1}
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-red-700 dark:text-red-100 line-clamp-2">
              {notif.title}
            </h4>

            {notif.created_at && (
              <p className="text-xs text-red-500 dark:text-red-300 mt-1">
                {new Date(notif.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2 text-xs text-red-600 dark:text-red-200 font-medium">
          💡 Gõ "đã xem {cardIdx + 1}" để đánh dấu đã đọc
        </div>
      </div>
    ))}
  </div>
)}

              {/* Hiển thị Incident Cards */}
              {msg.incidentCards && msg.incidentCards.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {msg.incidentCards.map((incident, cardIdx) => {
                    // Priority color mapping
                    const priorityColors = {
                      critical: 'bg-red-100 dark:bg-red-900 border-red-400 dark:border-red-700',
                      high: 'bg-orange-100 dark:bg-orange-900 border-orange-400 dark:border-orange-700',
                      medium: 'bg-yellow-100 dark:bg-yellow-900 border-yellow-400 dark:border-yellow-700',
                      low: 'bg-blue-100 dark:bg-blue-900 border-blue-400 dark:border-blue-700'
                    };
                    
                    // Status labels
                    const statusLabels: {[key: string]: string} = {
                      pending: '⏳ Chờ xử lý',
                      in_progress: '⏳ Đang xử lý',
                      resolved: '✅ Đã giải quyết',
                      closed: '🔒 Đã đóng'
                    };
                    
                    // Priority labels
                    const priorityLabels: {[key: string]: string} = {
                      critical: '🔴 Khẩn cấp',
                      high: '🟠 Cao',
                      medium: '🟡 Trung bình',
                      low: '🔵 Thấp'
                    };
                    
                    return (
                      <div
                        key={incident.id}
                        className={`border rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer ${
                          priorityColors[incident.priority as keyof typeof priorityColors] || priorityColors.medium
                        }`}
                        onClick={() => onIncidentClick && onIncidentClick(incident)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Số thứ tự */}
                          <div className="flex-shrink-0 w-8 h-8 bg-slate-700 text-white rounded-full 
                                          flex items-center justify-center font-bold text-sm">
                            {cardIdx + 1}
                          </div>

                          {/* Nội dung */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                              {incident.title}
                            </h4>
                            
                            {/* Status & Priority */}
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <span className="text-xs px-2 py-0.5 bg-white/60 dark:bg-slate-800/60 rounded-full">
                                {statusLabels[incident.status] || incident.status}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-white/60 dark:bg-slate-800/60 rounded-full">
                                {priorityLabels[incident.priority] || incident.priority}
                              </span>
                            </div>
                            
                            {/* Assignee & Department */}
                            {(incident.assigned_to_name || incident.department_name) && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                                {incident.assigned_to_name && `👤 ${incident.assigned_to_name}`}
                                {incident.assigned_to_name && incident.department_name && ' • '}
                                {incident.department_name && `🏢 ${incident.department_name}`}
                              </p>
                            )}

                            {/* Created date */}
                            {incident.created_at && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                📅 {new Date(incident.created_at).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          💡 Click để xem chi tiết
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              
              {msg.actions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.actions.map((action, actIdx) => (
                    <button key={actIdx} onClick={action.onClick} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${action.className || 'bg-white dark:bg-slate-700 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'}`}>
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;