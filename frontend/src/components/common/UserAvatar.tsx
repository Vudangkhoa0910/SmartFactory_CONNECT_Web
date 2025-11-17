interface UserAvatarProps {
  fullName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

// Generate avatar with user initials
const getInitials = (fullName: string): string => {
  if (!fullName) return "U";
  const names = fullName.trim().split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Generate background color based on name
const getAvatarColor = (fullName: string): string => {
  const colors = [
    "bg-red-600",
    "bg-blue-600",
    "bg-green-600",
    "bg-yellow-600",
    "bg-purple-600",
    "bg-pink-600",
    "bg-indigo-600",
    "bg-orange-600",
    "bg-teal-600",
  ];
  const index = fullName.charCodeAt(0) % colors.length;
  return colors[index];
};

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-11 w-11 text-lg",
  lg: "h-16 w-16 text-2xl",
  xl: "h-24 w-24 text-4xl",
};

export default function UserAvatar({ fullName, size = "md", className = "" }: UserAvatarProps) {
  const initials = getInitials(fullName);
  const avatarColor = getAvatarColor(fullName);
  const sizeClass = sizeClasses[size];

  return (
    <div 
      className={`${sizeClass} ${avatarColor} rounded-full flex items-center justify-center text-white font-bold ${className}`}
      title={fullName}
    >
      {initials}
    </div>
  );
}
