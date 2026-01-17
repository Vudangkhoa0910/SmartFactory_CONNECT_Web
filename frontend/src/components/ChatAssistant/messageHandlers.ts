/**
 * Chat Message Handlers - SmartFactory CONNECT
 * Click handlers for different item types in chat
 */
import { NavigateFunction } from 'react-router';
import { UIMessage, IdeaResponse, IdeaHistory } from './types';

// Labels for status, priority, type
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  under_review: 'Đang xem xét',
  approved: 'Đã phê duyệt',
  rejected: 'Từ chối',
  implemented: 'Đã triển khai'
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Khẩn cấp',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp'
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  safety: 'An toàn',
  quality: 'Chất lượng',
  equipment: 'Thiết bị',
  other: 'Khác'
};

const CATEGORY_LABELS: Record<string, string> = {
  cost_reduction: 'Giảm chi phí',
  quality_improvement: 'Cải thiện chất lượng',
  safety: 'An toàn',
  efficiency: 'Hiệu quả',
  environment: 'Môi trường',
  employee_welfare: 'Phúc lợi nhân viên',
  innovation: 'Đổi mới',
  other: 'Khác'
};

const LEVEL_LABELS: Record<string, string> = {
  supervisor: 'Cấp giám sát',
  manager: 'Cấp quản lý',
  general_manager: 'Tổng giám đốc'
};

const ACTION_LABELS: Record<string, string> = {
  created: '📝 Tạo mới',
  assigned: '👤 Chỉ định',
  reviewed: '🔍 Đánh giá',
  approved: '✅ Phê duyệt',
  rejected: '❌ Từ chối',
  implemented: '🎉 Triển khai',
  commented: '💬 Nhận xét'
};

const REVIEWED_STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Chờ xử lý',
  under_review: '🔍 Đang xem xét',
  approved: '✅ Đã phê duyệt',
  rejected: '❌ Từ chối',
  implemented: '🎉 Đã triển khai',
  on_hold: '⏸️ Tạm dừng'
};

type SetMessages = React.Dispatch<React.SetStateAction<UIMessage[]>>;

/**
 * Handle notification click
 */
export function handleNotificationClick(
  notification: { title: string; message?: string; content?: string },
  setMessages: SetMessages
): void {
  setMessages(prev => [...prev, {
    role: 'model',
    text: `**Chi tiết thông báo:**\n\n**${notification.title}**\n\n${notification.message || notification.content || 'Không có nội dung chi tiết.'}`
  }]);
}

/**
 * Handle incident click
 */
export function handleIncidentClick(
  incident: {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    incident_type: string;
    location?: string;
    reporter_name?: string;
    reporter_code?: string;
    assigned_to_name?: string;
    department_name?: string;
    created_at?: string;
    resolved_at?: string;
  },
  setMessages: SetMessages,
  navigate: NavigateFunction
): void {
  let detailText = `**Chi tiết sự cố #${incident.id}**\n\n`;
  detailText += `**${incident.title}**\n\n`;

  if (incident.description) {
    detailText += `**Mô tả:** ${incident.description}\n\n`;
  }

  detailText += `**Trạng thái:** ${STATUS_LABELS[incident.status] || incident.status}\n`;
  detailText += `**Mức độ ưu tiên:** ${PRIORITY_LABELS[incident.priority] || incident.priority}\n`;
  detailText += `**Loại:** ${INCIDENT_TYPE_LABELS[incident.incident_type] || incident.incident_type}\n`;

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
}

/**
 * Build idea detail text
 */
export function buildIdeaDetailText(idea: {
  id: number;
  ideabox_type: string;
  title: string;
  status: string;
  category: string;
  description?: string;
  expected_benefit?: string;
  feasibility_score?: number | null;
  impact_score?: number | null;
  implementation_cost?: number | null;
  implementation_time?: number | null;
  is_anonymous?: boolean;
  submitter_name?: string;
  department_name?: string;
  handler_level?: string;
  assigned_to_name?: string;
  reviewed_by_name?: string;
  review_notes?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
  implemented_at?: string;
}): string {
  let detailText = `**Chi tiết ý tưởng #${idea.id}**\n\n`;

  detailText += idea.ideabox_type === 'white'
    ? `**Loại:** Hòm Trắng (White Box)\n`
    : `**Loại:** Hòm Hồng (Pink Box)\n`;

  detailText += `\n**${idea.title}**\n\n`;
  detailText += `**Trạng thái:** ${STATUS_LABELS[idea.status] || idea.status}\n`;
  detailText += `**Danh mục:** ${CATEGORY_LABELS[idea.category] || idea.category}\n\n`;

  if (idea.description) {
    detailText += `**Mô tả:**\n${idea.description}\n\n`;
  }

  if (idea.expected_benefit) {
    detailText += `**Lợi ích kỳ vọng:**\n${idea.expected_benefit}\n\n`;
  }

  if (idea.feasibility_score !== null && idea.feasibility_score !== undefined) {
    detailText += `**Điểm khả thi:** ${idea.feasibility_score}/10\n`;
  }
  if (idea.impact_score !== null && idea.impact_score !== undefined) {
    detailText += `**Điểm tác động:** ${idea.impact_score}/10\n`;
  }

  if (idea.implementation_cost) {
    detailText += `**Chi phí triển khai:** ${idea.implementation_cost.toLocaleString('vi-VN')} VNĐ\n`;
  }
  if (idea.implementation_time) {
    detailText += `**Thời gian triển khai:** ${idea.implementation_time} ngày\n`;
  }

  detailText += `\n`;
  if (idea.is_anonymous) {
    detailText += `**Người đề xuất:** Ẩn danh\n`;
  } else if (idea.submitter_name) {
    detailText += `**Người đề xuất:** ${idea.submitter_name}\n`;
  }

  if (idea.department_name) {
    detailText += `**Phòng ban:** ${idea.department_name}\n`;
  }

  if (idea.handler_level) {
    detailText += `**Cấp xử lý:** ${LEVEL_LABELS[idea.handler_level] || idea.handler_level}\n`;
  }

  if (idea.assigned_to_name) {
    detailText += `**Người phụ trách:** ${idea.assigned_to_name}\n`;
  }

  if (idea.reviewed_by_name) {
    detailText += `\n**Người đánh giá:** ${idea.reviewed_by_name}\n`;
    if (idea.review_notes) {
      detailText += `**Nhận xét:** ${idea.review_notes}\n`;
    }
    if (idea.reviewed_at) {
      detailText += `**Ngày đánh giá:** ${new Date(idea.reviewed_at).toLocaleString('vi-VN')}\n`;
    }
  }

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

  return detailText;
}

/**
 * Fetch and display idea responses
 */
export async function fetchIdeaResponses(
  ideaId: number,
  ideaTitle: string,
  ideaboxType: string,
  setMessages: SetMessages
): Promise<void> {
  try {
    setMessages(prev => [...prev, {
      role: 'model',
      text: '⏳ Đang tải lịch sử phản hồi...'
    }]);

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/ideas/${ideaId}/responses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch responses');
    }

    const result = await response.json();
    const responses: IdeaResponse[] = result.data || [];

    // Remove loading message
    setMessages(prev => prev.slice(0, -1));

    if (responses.length === 0) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: '📭 **Lịch sử phản hồi**\n\nChưa có phản hồi nào cho ý tưởng này.'
      }]);
    } else {
      const boxType = ideaboxType === 'white' ? '⚪ Hòm Trắng' : '💖 Hòm Hồng';
      let responseText = `📜 **Lịch sử phản hồi - ${ideaTitle}**\n\n`;
      responseText += `${boxType}\n\n`;
      responseText += `📊 Tổng số phản hồi: ${responses.length}\n\n`;
      responseText += `---\n\n`;

      responses.forEach((resp, index) => {
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
}

/**
 * Fetch and display idea history
 */
export async function fetchIdeaHistory(
  ideaId: number,
  ideaTitle: string,
  setMessages: SetMessages
): Promise<void> {
  try {
    setMessages(prev => [...prev, {
      role: 'model',
      text: '⏳ Đang tải lịch sử xử lý...'
    }]);

    const token = localStorage.getItem('token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_URL}/ideas/${ideaId}/history`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    const result = await response.json();
    const history: IdeaHistory[] = result.data || [];

    // Remove loading message
    setMessages(prev => prev.slice(0, -1));

    if (history.length === 0) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: '📭 **Lịch sử xử lý**\n\nChưa có lịch sử xử lý nào cho ý tưởng này.'
      }]);
    } else {
      let historyText = `📋 **Lịch sử xử lý - ${ideaTitle}**\n\n`;
      historyText += `⚪ Hòm Trắng\n\n`;
      historyText += `📊 Tổng số hoạt động: ${history.length}\n\n`;
      historyText += `---\n\n`;

      history.forEach((entry, index) => {
        const actionLabel = ACTION_LABELS[entry.action] || entry.action;
        historyText += `**${actionLabel}** (#${index + 1})\n`;
        historyText += `👤 **Thực hiện bởi:** ${entry.user_name || 'N/A'}\n`;
        historyText += `🏷️ **Vai trò:** ${entry.user_role || 'N/A'}\n`;
        if (entry.department_name) {
          historyText += `🏢 **Phòng ban:** ${entry.department_name}\n`;
        }
        historyText += `📅 **Thời gian:** ${new Date(entry.created_at).toLocaleString('vi-VN')}\n`;

        // Display details based on action type
        if (entry.action === 'reviewed' && entry.details) {
          historyText += `\n`;

          if (entry.details.old_status && entry.details.new_status) {
            const oldStatus = REVIEWED_STATUS_LABELS[entry.details.old_status as string] || entry.details.old_status;
            const newStatus = REVIEWED_STATUS_LABELS[entry.details.new_status as string] || entry.details.new_status;

            historyText += `🔄 **Thay đổi trạng thái:**\n`;
            historyText += `   Từ: ${oldStatus}\n`;
            historyText += `   Sang: ${newStatus}\n`;
          }

          if (entry.details.review_notes) {
            historyText += `\n📝 **Nhận xét đánh giá:**\n${entry.details.review_notes}\n`;
          }
        } else if (entry.details?.note) {
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
}
