import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => (
  <div className="bg-red-600 p-4 flex justify-between items-center">
    <div className="flex items-center gap-2 text-white">
      <div>
        <h3 className="font-bold text-sm">Trợ lý ảo AI</h3>
        <p className="text-xs text-red-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
          Online
        </p>
      </div>
    </div>
    <button
      onClick={onClose}
      className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
    >
      <X size={20} />
    </button>
  </div>
);

export default ChatHeader;