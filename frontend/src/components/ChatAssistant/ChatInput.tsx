import React from 'react';
import { Send, Mic } from 'lucide-react';
import { useTranslation } from "../../contexts/LanguageContext";
import { useSpeechToText } from "../../hooks/useSpeechToText";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSend, isLoading }) => {
  const { t } = useTranslation();
  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      setInput(input ? `${input} ${text}` : text);
    }
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-3 bg-white dark:bg-neutral-800 border-t border-gray-100 dark:border-neutral-700">
      <div className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={t('chat.input_placeholder')}
          className="w-full pl-5 pr-24 py-3 bg-gray-100 dark:bg-neutral-900 border-none rounded-full text-base focus:ring-2 focus:ring-red-500/50 focus:outline-none dark:text-white placeholder-gray-400"
          disabled={isLoading}
        />
        <div className="absolute right-1.5 flex items-center gap-1">
          {isSupported && (
            <button
              type="button"
              onClick={startListening}
              className={`p-2 rounded-full transition-colors ${
                isListening 
                  ? 'text-red-600 bg-red-100 animate-pulse' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-neutral-800'
              }`}
              title="Speak"
            >
              <Mic size={18} />
            </button>
          )}
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 transition-colors shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
