import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MessageCircle, X } from 'lucide-react';

// Import các phần đã được tách
import { UIMessage, IdeaResponse, IdeaHistory } from './types';
import { useNotificationPolling } from './useNotificationPolling';
import { handleCommand } from './commandHandler';
import { sendMessageToGemini } from '../../services/gemini';

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
          onNotificationClick={(notification) => {
            setMessages(prev => [...prev, {
              role: 'model',
              text: `**Chi tiết thông báo:**\n\n**${notification.title}**\n\n${notification.message || notification.content || 'Không có nội dung chi tiết.'}`
            }]);
          }}
          onIncidentClick={(incident) => {
            const statusLabels: {[key: string]: string} = {
              pending: 'Chờ xử lý',
              in_progress: 'Đang xử lý',
              resolved: 'Đã giải quyết',
              closed: 'Đã đóng'
            };
            
            const priorityLabels: {[key: string]: string} = {
              critical: 'Khẩn cấp',
              high: 'Cao',
              medium: 'Trung bình',
              low: 'Thấp'
            };
            
            const typeLabels: {[key: string]: string} = {
              safety: 'An toàn',
              quality: 'Chất lượng',
              equipment: 'Thiết bị',
              other: 'Khác'
            };
            
            let detailText = `**Chi tiết sự cố #${incident.id}**\n\n`;
            detailText += `**${incident.title}**\n\n`;
            
            if (incident.description) {
              detailText += `**Mô tả:** ${incident.description}\n\n`;
            }
            
            detailText += `**Trạng thái:** ${statusLabels[incident.status] || incident.status}\n`;
            detailText += `**Mức độ ưu tiên:** ${priorityLabels[incident.priority] || incident.priority}\n`;
            detailText += `**Loại:** ${typeLabels[incident.incident_type] || incident.incident_type}\n`;
            
            if (incident.location) {
              detailText += `**Vị trí:** ${incident.location}\n`;
            }
            
            if (incident.reporter_name) {
              detailText += `**Người báo cáo:** ${incident.reporter_name}${incident.reporter_code ? ` (${incident.reporter_code})` : ''}\n`;
            }
            
            if (incident.assigned_to_name) {
              detailText += `**Người phụ trách:** ${incident.assigned_to_name}\n`;
            }
            
            if (incident.department_name) {
              detailText += `**Phòng ban:** ${incident.department_name}\n`;
            }
            
            if (incident.created_at) {
              detailText += `**Thời gian tạo:** ${new Date(incident.created_at).toLocaleString('vi-VN')}\n`;
            }
            
            if (incident.resolved_at) {
              detailText += `**Thời gian giải quyết:** ${new Date(incident.resolved_at).toLocaleString('vi-VN')}\n`;
            }
            
            setMessages(prev => [...prev, {
              role: 'model',
              text: detailText,
              actions: [
                {
                  label: 'Xem chi tiết đầy đủ',
                  onClick: () => navigate(`/incidents/${incident.id}`)
                }
              ]
            }]);
          }}
          onIdeaClick={(idea) => {
            const statusLabels: {[key: string]: string} = {
              pending: 'Chờ xử lý',
              under_review: 'Đang xem xét',
              approved: 'Đã phê duyệt',
              rejected: 'Từ chối',
              implemented: 'Đã triển khai'
            };
            
            const categoryLabels: {[key: string]: string} = {
              cost_reduction: 'Giảm chi phí',
              quality_improvement: 'Cải thiện chất lượng',
              safety: 'An toàn',
              efficiency: 'Hiệu quả',
              environment: 'Môi trường',
              employee_welfare: 'Phúc lợi nhân viên',
              innovation: 'Đổi mới',
              other: 'Khác'
            };
            
            let detailText = `**Chi tiết ý tưởng #${idea.id}**\n\n`;
            
            // Ideabox type
            detailText += idea.ideabox_type === 'white' 
              ? `**Loại:** Hòm Trắng (White Box)\n` 
              : `**Loại:** Hòm Hồng (Pink Box)\n`;
            
            // Title
            detailText += `\n**${idea.title}**\n\n`;
            
            // Status and Category
            detailText += `**Trạng thái:** ${statusLabels[idea.status] || idea.status}\n`;
            detailText += `**Danh mục:** ${categoryLabels[idea.category] || idea.category}\n\n`;
            
            // Description
            if (idea.description) {
              detailText += `**Mô tả:**\n${idea.description}\n\n`;
            }
            
            // Expected benefit
            if (idea.expected_benefit) {
              detailText += `**Lợi ích kỳ vọng:**\n${idea.expected_benefit}\n\n`;
            }
            
            // Scores
            if (idea.feasibility_score !== null && idea.feasibility_score !== undefined) {
              detailText += `**Điểm khả thi:** ${idea.feasibility_score}/10\n`;
            }
            if (idea.impact_score !== null && idea.impact_score !== undefined) {
              detailText += `**Điểm tác động:** ${idea.impact_score}/10\n`;
            }
            
            // Cost and Time
            if (idea.implementation_cost) {
              detailText += `**Chi phí triển khai:** ${idea.implementation_cost.toLocaleString('vi-VN')} VNĐ\n`;
            }
            if (idea.implementation_time) {
              detailText += `**Thời gian triển khai:** ${idea.implementation_time} ngày\n`;
            }
            
            // Submitter
            detailText += `\n`;
            if (idea.is_anonymous) {
              detailText += `**Người đề xuất:** Ẩn danh\n`;
            } else if (idea.submitter_name) {
              detailText += `**Người đề xuất:** ${idea.submitter_name}\n`;
            }
            
            // Department
            if (idea.department_name) {
              detailText += `**Phòng ban:** ${idea.department_name}\n`;
            }
            
            // Handler info
            if (idea.handler_level) {
              const levelLabels: {[key: string]: string} = {
                supervisor: 'Cấp giám sát',
                manager: 'Cấp quản lý',
                general_manager: 'Tổng giám đốc'
              };
              detailText += `**Cấp xử lý:** ${levelLabels[idea.handler_level] || idea.handler_level}\n`;
            }
            
            if (idea.assigned_to_name) {
              detailText += `**Người phụ trách:** ${idea.assigned_to_name}\n`;
            }
            
            // Review info
            if (idea.reviewed_by_name) {
              detailText += `\n**Người đánh giá:** ${idea.reviewed_by_name}\n`;
              if (idea.review_notes) {
                detailText += `**Nhận xét:** ${idea.review_notes}\n`;
              }
              if (idea.reviewed_at) {
                detailText += `**Ngày đánh giá:** ${new Date(idea.reviewed_at).toLocaleString('vi-VN')}\n`;
              }
            }
            
            // Dates
            detailText += `\n`;
            if (idea.created_at) {
              detailText += `**Thời gian tạo:** ${new Date(idea.created_at).toLocaleString('vi-VN')}\n`;
            }
            if (idea.updated_at) {
              detailText += `**Cập nhật lần cuối:** ${new Date(idea.updated_at).toLocaleString('vi-VN')}\n`;
            }
            if (idea.implemented_at) {
              detailText += `**Thời gian triển khai:** ${new Date(idea.implemented_at).toLocaleString('vi-VN')}\n`;
            }
            
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
                  onClick: async () => {
                    try {
                      setMessages(prev => [...prev, {
                        role: 'model',
                        text: '⏳ Đang tải lịch sử phản hồi...'
                      }]);
                      
                      const token = localStorage.getItem('token');
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                      const response = await fetch(`${API_URL}/ideas/${idea.id}/responses`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to fetch responses');
                      }
                      
                      const result = await response.json();
                      const responses = result.data || [];
                      
                      // Remove loading message
                      setMessages(prev => prev.slice(0, -1));
                      
                      if (responses.length === 0) {
                        setMessages(prev => [...prev, {
                          role: 'model',
                          text: '📭 **Lịch sử phản hồi**\n\nChưa có phản hồi nào cho ý tưởng này.'
                        }]);
                      } else {
                        const boxType = idea.ideabox_type === 'white' ? '⚪ Hòm Trắng' : '💖 Hòm Hồng';
                        let responseText = `📜 **Lịch sử phản hồi - ${idea.title}**\n\n`;
                        responseText += `${boxType}\n\n`;
                        responseText += `📊 Tổng số phản hồi: ${responses.length}\n\n`;
                        responseText += `---\n\n`;
                        
                        responses.forEach((resp: IdeaResponse, index: number) => {
                          responseText += `**Phản hồi #${index + 1}**\n`;
                          responseText += `👤 **Người phản hồi:** ${resp.user_name || 'N/A'}\n`;
                          responseText += `🏷️ **Vai trò:** ${resp.user_role || 'N/A'}\n`;
                          if (resp.department_name) {
                            responseText += `🏢 **Phòng ban:** ${resp.department_name}\n`;
                          }
                          responseText += `📅 **Thời gian:** ${new Date(resp.created_at).toLocaleString('vi-VN')}\n`;
                          responseText += `\n💬 **Nội dung:**\n${resp.response}\n`;
                          
                          if (resp.attachments && resp.attachments.length > 0) {
                            responseText += `\n📎 **Tệp đính kèm:** ${resp.attachments.length} file\n`;
                          }
                          
                          responseText += `\n---\n\n`;
                        });
                        
                        setMessages(prev => [...prev, {
                          role: 'model',
                          text: responseText
                        }]);
                      }
                    } catch (error) {
                      console.error('Error fetching responses:', error);
                      setMessages(prev => [...prev, {
                        role: 'model',
                        text: '❌ Không thể tải lịch sử phản hồi. Vui lòng thử lại sau.'
                      }]);
                    }
                  },
                  className: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-pink-100'
                }] : []),
                // Action history button for white box - only for admin
                ...(isAdmin && idea.ideabox_type === 'white' ? [{
                  label: '📋 Lịch sử xử lý',
                  onClick: async () => {
                    try {
                      setMessages(prev => [...prev, {
                        role: 'model',
                        text: '⏳ Đang tải lịch sử xử lý...'
                      }]);
                      
                      const token = localStorage.getItem('token');
                      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                      const response = await fetch(`${API_URL}/ideas/${idea.id}/history`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to fetch history');
                      }
                      
                      const result = await response.json();
                      const history = result.data || [];
                      
                      // Remove loading message
                      setMessages(prev => prev.slice(0, -1));
                      
                      if (history.length === 0) {
                        setMessages(prev => [...prev, {
                          role: 'model',
                          text: '📭 **Lịch sử xử lý**\n\nChưa có lịch sử xử lý nào cho ý tưởng này.'
                        }]);
                      } else {
                        const actionLabels: {[key: string]: string} = {
                          created: '📝 Tạo mới',
                          assigned: '👤 Chỉ định',
                          reviewed: '🔍 Đánh giá',
                          approved: '✅ Phê duyệt',
                          rejected: '❌ Từ chối',
                          implemented: '🎉 Triển khai',
                          commented: '💬 Nhận xét'
                        };
                        
                        let historyText = `📋 **Lịch sử xử lý - ${idea.title}**\n\n`;
                        historyText += `⚪ Hòm Trắng\n\n`;
                        historyText += `📊 Tổng số hoạt động: ${history.length}\n\n`;
                        historyText += `---\n\n`;
                        
                        history.forEach((entry: IdeaHistory, index: number) => {
                          const actionLabel = actionLabels[entry.action] || entry.action;
                          historyText += `**${actionLabel}** (#${index + 1})\n`;
                          historyText += `👤 **Thực hiện bởi:** ${entry.user_name || 'N/A'}\n`;
                          historyText += `🏷️ **Vai trò:** ${entry.user_role || 'N/A'}\n`;
                          if (entry.department_name) {
                            historyText += `🏢 **Phòng ban:** ${entry.department_name}\n`;
                          }
                          historyText += `📅 **Thời gian:** ${new Date(entry.created_at).toLocaleString('vi-VN')}\n`;
                          
                          // Display details based on action type
                          if (entry.action === 'reviewed' && entry.details) {
                            // For review actions, show status change and review notes
                            historyText += `\n`;
                            
                            if (entry.details.old_status && entry.details.new_status) {
                              const statusLabels: {[key: string]: string} = {
                                pending: '⏳ Chờ xử lý',
                                under_review: '🔍 Đang xem xét',
                                approved: '✅ Đã phê duyệt',
                                rejected: '❌ Từ chối',
                                implemented: '🎉 Đã triển khai',
                                on_hold: '⏸️ Tạm dừng'
                              };
                              
                              const oldStatus = statusLabels[entry.details.old_status as string] || entry.details.old_status;
                              const newStatus = statusLabels[entry.details.new_status as string] || entry.details.new_status;
                              
                              historyText += `🔄 **Thay đổi trạng thái:**\n`;
                              historyText += `   Từ: ${oldStatus}\n`;
                              historyText += `   Sang: ${newStatus}\n`;
                            }
                            
                            if (entry.details.review_notes) {
                              historyText += `\n📝 **Nhận xét đánh giá:**\n${entry.details.review_notes}\n`;
                            }
                          } else if (entry.details?.note) {
                            // For other actions, show note
                            historyText += `\n📌 **Ghi chú:** ${entry.details.note}\n`;
                          }
                          
                          // Display other details if available
                          if (entry.details) {
                            const otherDetails = Object.entries(entry.details).filter(
                              ([key]) => !['note', 'old_status', 'new_status', 'review_notes'].includes(key)
                            );
                            
                            if (otherDetails.length > 0) {
                              historyText += `\n📋 **Thông tin bổ sung:**\n`;
                              otherDetails.forEach(([key, value]) => {
                                historyText += `   • ${key}: ${JSON.stringify(value)}\n`;
                              });
                            }
                          }
                          
                          historyText += `\n---\n\n`;
                        });
                        
                        setMessages(prev => [...prev, {
                          role: 'model',
                          text: historyText
                        }]);
                      }
                    } catch (error) {
                      console.error('Error fetching history:', error);
                      setMessages(prev => [...prev, {
                        role: 'model',
                        text: '❌ Không thể tải lịch sử xử lý. Vui lòng thử lại sau.'
                      }]);
                    }
                  },
                  className: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-indigo-100'
                }] : [])
              ]
            }]);
          }}
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
