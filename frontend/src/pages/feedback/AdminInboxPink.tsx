// src/pages/SensitiveInbox/index.tsx
import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import api from "../../services/api";
import { useDepartments } from "../../hooks/useDepartments";
import { toast } from "react-toastify";
import {
  CURRENT_USER,
  SensitiveMessage,
  MessageStatus,
} from "../../components/feedback/types";
import { MessageList } from "../../components/feedback/MessageList";
import { MessageDetailView } from "../../components/feedback/MessageDetailView";
import { useTranslation } from "../../contexts/LanguageContext";


// Helper to map API status to UI status
const mapStatus = (apiStatus: string): MessageStatus => {
  switch (apiStatus) {
    case 'pending': return 'new';
    case 'under_review': return 'under_review';
    case 'approved': 
    case 'rejected':
    case 'implemented':
      return 'processed';
    default: return 'new';
  }
};

// Helper to map API response to SensitiveMessage
const mapIdeaToMessage = (idea: any): SensitiveMessage => {
  return {
    id: idea.id,
    isAnonymous: idea.is_anonymous,
    senderName: idea.submitter_name || (idea.is_anonymous ? "Ẩn danh" : "Unknown"),
    senderId: idea.submitter_code,
    title: idea.title,
    fullContent: idea.description,
    imageUrl: (() => {
      if (!idea.attachments) return undefined;
      try {
        const att = typeof idea.attachments === 'string' ? JSON.parse(idea.attachments) : idea.attachments;
        if (Array.isArray(att) && att.length > 0 && att[0].path) {
           return `${import.meta.env.VITE_API_URL?.replace('/api', '')}/${att[0].path}`;
        }
      } catch (e) {
        console.error("Error parsing attachments", e);
      }
      return undefined;
    })(),
    timestamp: new Date(idea.created_at),
    status: mapStatus(idea.status),
    history: (idea.history || []).map((h: any) => ({
      action: h.action === 'submitted' ? 'CREATED' : 
              h.action === 'assigned' ? 'FORWARDED' : 
              h.action === 'responded' ? 'REPLIED' : 'CREATED',
      timestamp: new Date(h.created_at),
      details: h.details ? (typeof h.details === 'string' ? h.details : JSON.stringify(h.details)) : '',
      actor: h.performed_by_name || 'System'
    })),
    replies: (idea.responses || []).map((r: any) => ({
      id: r.id,
      author: r.responder_name || 'Admin',
      content: r.response,
      timestamp: new Date(r.created_at)
    }))
  };
};

export default function SensitiveInboxPage() {
  const [messages, setMessages] = useState<SensitiveMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { departments, loading: deptLoading } = useDepartments();
  const { t } = useTranslation();

  // Fetch list of ideas
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        setLoading(true);
        const res = await api.get('/ideas?ideabox_type=pink');
        const ideasData = res.data.data || [];
        const mappedIdeas = ideasData.map(mapIdeaToMessage);
        setMessages(mappedIdeas);
        if (mappedIdeas.length > 0 && !selectedMessageId) {
          setSelectedMessageId(mappedIdeas[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch ideas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  // Fetch full details when a message is selected
  useEffect(() => {
    if (!selectedMessageId) return;

    const fetchDetail = async () => {
      try {
        const res = await api.get(`/ideas/${selectedMessageId}`);
        const fullIdea = res.data.data;
        const mappedIdea = mapIdeaToMessage(fullIdea);
        
        setMessages(prev => prev.map(m => 
          m.id === selectedMessageId ? { ...m, ...mappedIdea } : m
        ));
      } catch (error) {
        console.error("Failed to fetch idea details:", error);
      }
    };

    fetchDetail();
  }, [selectedMessageId]);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);

  const handleForward = async (
    messageId: string,
    departmentId: string,
    note: string
  ) => {
    try {
      setLoading(true);
      
      // Use assign endpoint
      await api.put(`/ideas/${messageId}/assign`, {
        department_id: departmentId,
        review_notes: note
      });
      
      // Then add a review note if needed, or just rely on the assign
      // Ideally we should have a single endpoint or call both
      
      // We need to refetch to get the full mapped object or manually update
      // Let's just update the status locally for now
      
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { 
          ...m, 
          status: 'under_review',
          history: [...m.history, {
            action: 'FORWARDED',
            timestamp: new Date(),
            details: `${t('feedback.forward_to')} ${departments.find(d => d.id === departmentId)?.name}`,
            actor: CURRENT_USER
          }]
        } : m
      ));
      
      // Show success message (could be a toast)
      toast.success(t('feedback.messages.forward_success'));
    } catch (error: any) {
      console.error("Forward failed:", error);
      toast.error(`${t('feedback.messages.forward_fail')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (messageId: string, content: string) => {
    try {
      setLoading(true);
      // Note: If we need to support file uploads later, we should use FormData
      // For now, the UI only sends text content
      const payload = { response: content };
      
      const res = await api.post(`/ideas/${messageId}/responses`, payload);
      
      // The backend returns the created response object
      const newResponse = res.data.data;
      
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            status: 'processed', // Assume replying marks it as handled/processed
            replies: [...m.replies, {
              id: newResponse.id,
              author: newResponse.responder_name || CURRENT_USER,
              content: newResponse.response,
              timestamp: new Date(newResponse.created_at)
            }],
            history: [...m.history, {
              action: 'REPLIED',
              timestamp: new Date(),
              details: t('feedback.replied'),
              actor: CURRENT_USER
            }]
          };
        }
        return m;
      }));
      
      toast.success(t('feedback.messages.reply_success'));
    } catch (error: any) {
      console.error("Reply failed:", error);
      toast.error(`${t('feedback.messages.reply_fail')}: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Hộp thư nhạy cảm | SmartFactory CONNECT"
        description="Quản lý các phản hồi nhạy cảm và ý kiến đóng góp"
      />
      <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-white text-gray-900">
        <MessageList
          messages={messages}
          selectedMessageId={selectedMessageId}
          onSelectMessage={setSelectedMessageId}
        />
        <MessageDetailView
          message={selectedMessage}
          departments={departments}
          loading={deptLoading}
          onForward={handleForward}
          onReply={handleReply}
        />
      </div>
    </>
  );
}