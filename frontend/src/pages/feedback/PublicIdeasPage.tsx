import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { PublicIdea, StatusType } from "../../components/feedback/types";
import { IdeaList } from "../../components/feedback/IdeaList";
import { IdeaDetail } from "../../components/feedback/IdeaDetail";

interface BackendHistory {
  created_at: string;
  performed_by_name: string;
  action: string;
  details: string;
}

interface BackendResponse {
  id: string;
  role: string;
  response: string;
  created_at: string;
}

interface BackendIdea {
  id: string;
  submitter_id: string;
  submitter_name: string;
  department_name: string;
  category: string;
  title: string;
  description: string;
  attachments: string | null;
  created_at: string;
  status: string;
  history: BackendHistory[];
  responses: BackendResponse[];
}

export default function PublicIdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isNotAdmin = user?.level !== 1;

  // Helper to map backend status to frontend StatusType
  const mapStatus = useCallback((backendStatus: string): StatusType => {
    const map: Record<string, StatusType> = {
      'pending': 'Mới',
      'under_review': 'Đang xem xét',
      'approved': 'Đã duyệt',
      'rejected': 'Đã từ chối',
      'implemented': 'Đã triển khai',
      'on_hold': 'Đang xem xét' // Map on_hold to closest match
    };
    return map[backendStatus] || 'Mới';
  }, []);

  // Helper to map frontend status to backend status
  const mapToBackendStatus = useCallback((status: string): string => {
    const map: Record<string, string> = {
      'Mới': 'pending',
      'Đang xem xét': 'under_review',
      'Đã duyệt': 'approved',
      'Đã từ chối': 'rejected',
      'Đã triển khai': 'implemented',
      'Đã hoàn tất': 'implemented'
    };
    return map[status] || 'under_review';
  }, []);

  // Fetch ideas from API
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ideas?ideabox_type=white');
        // Map API response to PublicIdea type
        const mappedIdeas: PublicIdea[] = (res.data.data || []).map((item: BackendIdea) => ({
          id: item.id,
          senderId: item.submitter_id || 'unknown',
          senderName: item.submitter_name || 'Anonymous',
          group: item.department_name || 'General',
          line: item.category || 'General',
          title: item.title,
          content: item.description,
          imageUrl: item.attachments && JSON.parse(item.attachments)[0]?.path 
            ? `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${JSON.parse(item.attachments)[0].path}`
            : undefined,
          timestamp: new Date(item.created_at),
          status: mapStatus(item.status),
          history: (item.history || []).map((h: BackendHistory) => ({
            time: new Date(h.created_at),
            by: h.performed_by_name || 'System',
            action: h.action,
            note: h.details
          })),
          chat: (item.responses || []).map((r: BackendResponse) => ({
            id: r.id,
            sender: r.role === 'admin' || r.role === 'manager' ? 'manager' : 'user',
            text: r.response,
            time: new Date(r.created_at)
          })),
          isRead: true
        }));
        
        setIdeas(mappedIdeas);
        if (mappedIdeas.length > 0 && !selectedId) {
          setSelectedId(mappedIdeas[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch public ideas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Keep empty dependency array to run only once

  const selectedIdea = ideas.find((idea) => idea.id === selectedId) || null;

  // Cập nhật trạng thái và ghi chú (note)
  const handleUpdateStatus = async (status: string, note?: string) => {
    if (!selectedIdea) return;
    
    try {
      // Handle Escalation
      if (status === 'Escalate') {
        await api.post(`/ideas/${selectedIdea.id}/escalate`, { reason: note || 'Forwarded' });
        // Remove from list as it moves to next level (and out of current user's view scope)
        setIdeas((prev) => prev.filter((idea) => idea.id !== selectedIdea.id));
        setSelectedId(null);
        alert("Đã chuyển tiếp thành công!");
        return;
      }

      const backendStatus = mapToBackendStatus(status);
      const payload = {
        status: backendStatus,
        review_notes: note || `Updated status to ${status}`
      };
      
      // Call review API
      await api.put(`/ideas/${selectedIdea.id}/review`, payload);
      
      // Update local state
      if (backendStatus === 'rejected') {
        // If rejected, remove from list as per requirement
        setIdeas((prev) => prev.filter((idea) => idea.id !== selectedIdea.id));
        setSelectedId(null);
      } else {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === selectedIdea.id
              ? {
                  ...idea,
                  status: status as StatusType,
                  history: [
                    ...idea.history,
                    {
                      time: new Date(),
                      by: "Me", // Should be current user name
                      action: status,
                      note,
                    },
                  ],
                }
              : idea
          )
        );
      }
      alert("Cập nhật trạng thái thành công!");
    } catch (error: any) {
      console.error("Update status failed:", error);
      alert(`Cập nhật thất bại: ${error.response?.data?.message || error.message}`);
    }
  };

  // Thêm phản hồi chat
  const handleSendChat = async (text: string) => {
    if (!selectedIdea || !text.trim()) return;
    
    try {
      const payload = { response: text.trim() };
      const res = await api.post(`/ideas/${selectedIdea.id}/responses`, payload);
      
      const newMsg = {
        id: res.data.data.id || Date.now().toString(),
        sender: "manager" as const,
        text: text.trim(),
        time: new Date(),
      };
      
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === selectedIdea.id
            ? { ...idea, chat: [...idea.chat, newMsg] }
            : idea
        )
      );
    } catch (error: any) {
      console.error("Send chat failed:", error);
      alert(`Gửi tin nhắn thất bại: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading && ideas.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-rose-600">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Danh sách ý tưởng */}
      <IdeaList
        ideas={ideas}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Chi tiết ý tưởng */}
      {selectedIdea && (
        <IdeaDetail
          key={selectedIdea.id}
          idea={selectedIdea}
          onUpdateStatus={handleUpdateStatus}
          onSendChat={handleSendChat}
          showForwardButton={isNotAdmin}
        />
      )}
    </div>
  );
}
