import React from "react";
import { useSpeechToText } from "../../../hooks/useSpeechToText";
import { MicrophoneIcon } from "../../../icons";

interface TextareaProps {
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows
  value?: string; // Current value
  onChange?: (value: string) => void; // Change handler
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void; // Key down handler
  className?: string; // Additional CSS classes
  disabled?: boolean; // Disabled state
  error?: boolean; // Error state
  hint?: string; // Hint text to display
  enableSpeech?: boolean; // Enable speech-to-text
}

const TextArea: React.FC<TextareaProps> = ({
  placeholder = "Enter your message", // Default placeholder
  rows = 3, // Default number of rows
  value = "", // Default value
  onChange, // Callback for changes
  onKeyDown, // Key down handler
  className = "", // Additional custom styles
  disabled = false, // Disabled state
  error = false, // Error state
  hint = "", // Default hint text
  enableSpeech = false,
}) => {
  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      if (onChange) {
        const newValue = value ? `${value} ${text}` : text;
        onChange(newValue);
      }
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  let textareaClasses = `w-full rounded-lg border py-2.5 text-sm shadow-theme-xs focus:outline-hidden ${className} `;

  if (enableSpeech && isSupported) {
    textareaClasses += " pl-4 pr-10";
  } else {
    textareaClasses += " px-4";
  }

  if (disabled) {
    textareaClasses += ` bg-gray-100 opacity-50 text-gray-500 border-gray-300 cursor-not-allowed opacity40 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
  } else if (error) {
    textareaClasses += ` bg-transparent  border-gray-300 focus:border-error-300 focus:ring-3 focus:ring-error-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-error-800`;
  } else {
    textareaClasses += ` bg-transparent text-gray-900 dark:text-gray-300 text-gray-900 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className={textareaClasses}
      />

      {enableSpeech && isSupported && (
        <button
          type="button"
          onClick={startListening}
          className={`absolute right-3 top-3 text-gray-400 hover:text-brand-500 transition-colors ${isListening ? "text-brand-500 animate-pulse" : ""
            }`}
          title="Click to speak"
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
      )}

      {hint && (
        <p
          className={`mt-2 text-sm ${error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
            }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default TextArea;
