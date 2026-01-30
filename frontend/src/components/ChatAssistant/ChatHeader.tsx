import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-4 flex justify-between items-center shadow-lg">
    <div className="flex items-center gap-3 text-white">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm ring-2 ring-white/30">
        <Sparkles size={20} className="text-white" />
      </div>
      <div>
        <h3 className="font-bold text-base">Trợ lý ảo AI</h3>
        <p className="text-xs text-red-100 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></span>
          Đang hoạt động
        </p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all duration-200 hover:scale-110 hover:rotate-90"
      title="Đóng"
    >
      <X size={20} />
    </button>
  </div>
);

export default ChatHeader;