import type React from "react";
import type { FC } from "react";
import { useSpeechToText } from "../../../hooks/useSpeechToText";
import { MicrophoneIcon } from "../../../icons";

interface InputProps {
  type?: "text" | "number" | "email" | "password" | "date" | "time" | string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  min?: string;
  max?: string;
  step?: number;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  enableSpeech?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const Input: FC<InputProps> = ({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  enableSpeech = false,
  onKeyDown,
}) => {
  const { isListening, startListening, isSupported } = useSpeechToText({
    onResult: (text) => {
      if (onChange) {
        const newValue = value ? `${value} ${text}` : text;
        const syntheticEvent = {
          target: { value: newValue, name: name || id, type },
          currentTarget: { value: newValue, name: name || id, type },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    },
  });

  let inputClasses = ` h-11 w-full rounded-lg border appearance-none py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3  dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${className}`;
  
  // Adjust padding for microphone icon
  if (enableSpeech && isSupported) {
    inputClasses += " pl-4 pr-10";
  } else {
    inputClasses += " px-4";
  }

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-40`;
  } else if (error) {
    inputClasses += `  border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:text-error-400 dark:border-error-500 dark:focus:border-error-800`;
  } else if (success) {
    inputClasses += `  border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:text-success-400 dark:border-success-500 dark:focus:border-success-800`;
  } else {
    inputClasses += ` bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90  dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
        onKeyDown={onKeyDown}
      />

      {enableSpeech && isSupported && (
        <button
          type="button"
          onClick={startListening}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-500 transition-colors ${
            isListening ? "text-brand-500 animate-pulse" : ""
          }`}
          title="Click to speak"
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
      )}

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
