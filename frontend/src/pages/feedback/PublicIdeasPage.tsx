import { useState } from "react";
import { PublicIdea, StatusType } from "../../components/feedback/types";
import { IDEAS_DATA } from "../../components/feedback/dummyData";
import { IdeaList } from "../../components/feedback/IdeaList";
import { IdeaDetail } from "../../components/feedback/IdeaDetail";

export default function PublicIdeasPage() {
  const [ideas, setIdeas] = useState<PublicIdea[]>(IDEAS_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(
    ideas[0]?.id || null
  );

  const selectedIdea = ideas.find((idea) => idea.id === selectedId) || null;

  // Cập nhật trạng thái và ghi chú (note)
  const handleUpdateStatus = (status: string, note?: string) => {
    if (!selectedIdea) return;
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
                  by: "Admin",
                  action: status,
                  note,
                },
              ],
            }
          : idea
      )
    );
  };

  // Thêm phản hồi chat
  const handleSendChat = (text: string) => {
    if (!selectedIdea || !text.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: "manager" as const,
      text: text.trim(),
      time: new Date(),
    };
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === selectedIdea.id
          ? { ...idea, chat: [...idea.chat, msg] }
          : idea
      )
    );
  };

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
          idea={selectedIdea}
          onUpdateStatus={handleUpdateStatus}
          onSendChat={handleSendChat}
        />
      )}
    </div>
  );
}
