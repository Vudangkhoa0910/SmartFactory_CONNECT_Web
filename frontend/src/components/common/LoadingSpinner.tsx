// src/components/common/LoadingSpinner.tsx
import Lottie from "lottie-react";
import loadingInfinityAnimation from "../../../public/loading_infinity.json";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  message = "Đang tải...",
}) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className={`${sizeClasses[size]}`}>
        <Lottie
          animationData={loadingInfinityAnimation}
          loop={true}
          autoplay={true}
        />
      </div>
      {message && (
        <p className="mt-6 text-base font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

// Alias for consistency
export const InfinityLoader = LoadingSpinner;

