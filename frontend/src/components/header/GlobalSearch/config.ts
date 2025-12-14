/**
 * GlobalSearch Types and Config - SmartFactory CONNECT
 */
import { 
  AlertIcon, 
  BoxIcon, 
  CalenderIcon, 
  FileIcon,
  UserIcon 
} from '../../icons';

export interface SearchResult {
  id: string | number;
  type: 'incident' | 'idea' | 'booking' | 'news' | 'user';
  title: string;
  subtitle?: string;
  status?: string;
  url: string;
}

export interface GlobalSearchProps {
  className?: string;
}

export interface TypeConfigItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export const TYPE_CONFIG: Record<SearchResult['type'], TypeConfigItem> = {
  incident: { 
    label: 'Sự cố', 
    icon: AlertIcon, 
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20'
  },
  idea: { 
    label: 'Góp ý', 
    icon: BoxIcon, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20'
  },
  booking: { 
    label: 'Đặt phòng', 
    icon: CalenderIcon, 
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20'
  },
  news: { 
    label: 'Tin tức', 
    icon: FileIcon, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20'
  },
  user: { 
    label: 'Nhân viên', 
    icon: UserIcon, 
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-800'
  }
};
