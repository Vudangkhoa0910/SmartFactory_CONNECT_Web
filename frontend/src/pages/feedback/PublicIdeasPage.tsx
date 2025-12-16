import { useState, useEffect, useCallback } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import { PublicIdea, StatusType } from "../../components/feedback/types";
import { IdeaList } from "../../components/feedback/IdeaList";
import { IdeaDetail } from "../../components/feedback/IdeaDetail";
import { useTranslation } from "../../contexts/LanguageContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";
import { useSocketRefresh } from "../../hooks/useSocket";
import { useDepartments } from "../../hooks/useDepartments";

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
  difficulty?: string;
  attachments: string | null;
  created_at: string;
  status: string;
  history: BackendHistory[];
  responses: BackendResponse[];
}

export default function PublicIdeasPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState<PublicIdea[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { departments } = useDepartments();

  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      const cleanText = text.trim().replace(/\.$/, '');
      setSearchTerm((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
    },
  });

  const isNotAdmin = user?.level !== 1;

  // Helper to map backend status to frontend StatusType
  const mapStatus = useCallback((backendStatus: string): StatusType => {
    const map: Record<string, StatusType> = {
      'pending': 'new',
      'under_review': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'implemented': 'implemented',
      'on_hold': 'under_review' // Map on_hold to closest match
    };
    return map[backendStatus] || 'new';
  }, []);

  // Helper to map frontend status to backend status
  const mapToBackendStatus = useCallback((status: string): string => {
    const map: Record<string, string> = {
      'new': 'pending',
      'under_review': 'under_review',
      'approved': 'approved',
      'rejected': 'rejected',
      'implemented': 'implemented',
      'completed': 'implemented'
    };
    return map[status] || 'under_review';
  }, []);

  // Fetch ideas from API - extracted to useCallback for WebSocket refresh
  const fetchIdeas = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
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
        difficulty: item.difficulty,
        imageUrl: (() => {
          if (!item.attachments) return undefined;
          try {
            const att = typeof item.attachments === 'string' ? JSON.parse(item.attachments) : item.attachments;
            if (Array.isArray(att) && att.length > 0 && att[0].path) {
              return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${att[0].path}`;
            }
          } catch (e) {
            console.error("Error parsing attachments", e);
          }
          return undefined;
        })(),
        timestamp: new Date(item.created_at),
        status: mapStatus(item.status),
        history: (item.history || []).map((h: BackendHistory) => ({
          time: new Date(h.created_at),
          by: h.performed_by_name || 'System',
          action: h.action,
          note: typeof h.details === 'string' ? h.details : JSON.stringify(h.details)
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
      if (showLoading) setLoading(false);
    }
  }, [mapStatus, selectedId]);

  // Initial fetch on mount
  useEffect(() => {
    fetchIdeas(true);
  }, [fetchIdeas]);

  // WebSocket: Auto-refresh without loading indicator when ideas change
  const silentRefresh = useCallback(() => {
    fetchIdeas(false);
  }, [fetchIdeas]);

  useSocketRefresh(
    ['idea_created', 'idea_updated', 'idea_response'],
    silentRefresh,
    ['ideas']
  );

  const selectedIdea = ideas.find((idea) => idea.id === selectedId) || null;

  // Filter ideas based on search term
  const filteredIdeas = ideas.filter(idea =>
    idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    idea.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cập nhật trạng thái và ghi chú (note)
  const handleUpdateStatus = async (status: string, note?: string, solutionStatus?: string, difficulty?: string) => {
    if (!selectedIdea) return;

    try {
      // Handle Escalation
      if (status === 'Escalate') {
        await api.post(`/ideas/${selectedIdea.id}/escalate`, { reason: note || 'Forwarded' });
        // Remove from list as it moves to next level (and out of current user's view scope)
        setIdeas((prev) => prev.filter((idea) => idea.id !== selectedIdea.id));
        setSelectedId(null);
        toast.success(t('feedback.messages.forward_success'));
        return;
      }

      const backendStatus = mapToBackendStatus(status);
      const payload: any = {
        status: backendStatus,
        review_notes: note || `Updated status to ${status}`
      };

      // Add difficulty if provided and changed
      if (difficulty) {
        payload.difficulty = difficulty;
      }

      // Call review API
      const response = await api.put(`/ideas/${selectedIdea.id}/review`, payload);

      // Refresh to get updated data from server including history
      await fetchIdeas(false);
      
      toast.success(t('feedback.messages.update_status_success'));
    } catch (error: any) {
      console.error("Update status failed:", error);
      toast.error(`${t('feedback.messages.update_status_fail')}: ${error.response?.data?.message || error.message}`);
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
      toast.error(`${t('feedback.messages.send_chat_fail')}: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading && ideas.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`${t('menu.public_ideas')} | SmartFactory CONNECT`}
        description={t('idea.description')}
      />
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">
        {/* Danh sách ý tưởng */}
        <IdeaList
          ideas={filteredIdeas}
          selectedId={selectedId}
          onSelect={setSelectedId}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onVoiceClick={startListening}
          isListening={isListening}
          isVoiceSupported={isSupported}
        />

        {/* Chi tiết ý tưởng */}
        {selectedIdea && (
          <IdeaDetail
            key={selectedIdea.id}
            idea={selectedIdea}
            onUpdateStatus={handleUpdateStatus}
            onSendChat={handleSendChat}
            showForwardButton={isNotAdmin}
            departments={departments}
            onRefresh={() => fetchIdeas(false)}
          />
        )}
      </div>
    </>
  );
}
