import React, { useEffect, useRef } from 'react';
import { UIMessage, Notification, Incident, Idea } from './types';
import { User, Calendar, Building2, Tag, Target, Settings2, Circle } from 'lucide-react';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  onNotificationClick?: (notification: Notification) => void;
  onIncidentClick?: (incident: Incident) => void;
  onIdeaClick?: (idea: Idea) => void;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onNotificationClick, onIncidentClick, onIdeaClick, className }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  return (
    <div className={`overflow-y-auto p-5 bg-gray-50 dark:bg-neutral-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-neutral-600 ${className || 'h-[450px]'}`}>
      <div className="space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-neutral-700'}`}>
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
        className="bg-gradient-to-r from-red-50 to-red-100 
                   dark:from-red-800 dark:to-red-700 
                   border border-red-200 dark:border-red-600 
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

        <div className="mt-2 text-xs text-red-600 dark:text-red-200 font-medium flex items-center gap-1">
           Gõ "đã xem {cardIdx + 1}" để đánh dấu đã đọc
        </div>
      </div>
    ))}
  </div>
)}

              {/* Hiển thị Incident Cards */}
              {msg.incidentCards && msg.incidentCards.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {msg.incidentCards.map((incident, cardIdx) => {
                    // Priority color mapping (All Red Theme)
                    const priorityColors = {
                      critical: 'bg-red-100 dark:bg-red-900 border-red-500 dark:border-red-600',
                      high: 'bg-red-50 dark:bg-red-900/50 border-red-400 dark:border-red-700',
                      medium: 'bg-white dark:bg-slate-800 border-red-300 dark:border-red-800',
                      low: 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-900'
                    };
                    
                    // Status labels
                    const statusLabels: {[key: string]: string} = {
                      pending: 'Chờ xử lý',
                      in_progress: 'Đang xử lý',
                      resolved: 'Đã giải quyết',
                      closed: 'Đã đóng'
                    };
                    
                    // Priority labels
                    const priorityLabels: {[key: string]: string} = {
                      critical: 'Khẩn cấp',
                      high: 'Cao',
                      medium: 'Trung bình',
                      low: 'Thấp'
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
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                                {incident.assigned_to_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {incident.assigned_to_name}</span>}
                                {incident.assigned_to_name && incident.department_name && ' • '}
                                {incident.department_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {incident.department_name}</span>}
                              </p>
                            )}

                            {/* Created date */}
                            {incident.created_at && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {new Date(incident.created_at).toLocaleDateString('vi-VN', {
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

                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                           Click để xem chi tiết
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Hiển thị Idea Cards */}
              {msg.ideaCards && msg.ideaCards.length > 0 && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {msg.ideaCards.map((idea, cardIdx) => {
                    // Determine card color based on ideabox_type (Red Theme)
                    const isWhite = idea.ideabox_type === 'white';
                    const bgColor = 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30';
                    const borderColor = 'border-red-200 dark:border-red-700';
                    const badgeColor = 'bg-red-600';
                    
                    // Status badge (Red Theme)
                    const statusColors: Record<string, string> = {
                      'pending': 'bg-red-400',
                      'under_review': 'bg-red-500',
                      'approved': 'bg-red-600',
                      'rejected': 'bg-red-700',
                      'implemented': 'bg-red-800'
                    };
                    const statusLabels: Record<string, string> = {
                      'pending': 'Chờ xử lý',
                      'under_review': 'Đang xem xét',
                      'approved': 'Đã phê duyệt',
                      'rejected': 'Từ chối',
                      'implemented': 'Đã triển khai'
                    };

                    return (
                      <div
                        key={idea.id}
                        className={`${bgColor} border ${borderColor} rounded-lg p-3 hover:shadow-lg transition-shadow cursor-pointer`}
                        onClick={() => onIdeaClick && onIdeaClick(idea)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Số thứ tự */}
                          <div className={`flex-shrink-0 w-8 h-8 ${badgeColor} text-white rounded-full 
                                          flex items-center justify-center font-bold text-sm`}>
                            {cardIdx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Ideabox Type Badge */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 ${badgeColor} text-white rounded-full font-medium flex items-center gap-1`}>
                                <Circle className="w-2 h-2" fill={isWhite ? 'white' : 'currentColor'} /> {isWhite ? 'Hòm Trắng' : 'Hòm Hồng'}
                              </span>
                              <span className={`text-xs px-2 py-0.5 ${statusColors[idea.status] || 'bg-gray-500'} text-white rounded-full`}>
                                {statusLabels[idea.status] || idea.status}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">
                              {idea.title}
                            </h4>

                            {/* Category */}
                            {idea.category && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {idea.category}
                              </p>
                            )}

                            {/* Description snippet */}
                            {idea.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2">
                                {idea.description.substring(0, 100)}
                                {idea.description.length > 100 ? '...' : ''}
                              </p>
                            )}

                            {/* Scores (if available) */}
                            <div className="flex gap-3 text-xs mb-1">
                              {idea.feasibility_score !== null && idea.feasibility_score !== undefined && (
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <Settings2 className="w-3 h-3" /> Khả thi: <strong>{idea.feasibility_score}/10</strong>
                                </span>
                              )}
                              {idea.impact_score !== null && idea.impact_score !== undefined && (
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <Target className="w-3 h-3" /> Tác động: <strong>{idea.impact_score}/10</strong>
                                </span>
                              )}
                            </div>

                            {/* Submitter & Date */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {idea.is_anonymous ? (
                                <span className="flex items-center gap-1"><User className="w-3 h-3" /> Ẩn danh</span>
                              ) : (
                                idea.submitter_name && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {idea.submitter_name}</span>
                              )}
                              {idea.created_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> {new Date(idea.created_at).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                           Click để xem chi tiết
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