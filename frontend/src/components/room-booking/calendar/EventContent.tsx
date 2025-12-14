/**
 * Room Booking Calendar - Event Content Renderer
 */
import React from 'react';

interface EventContentProps {
  timeText: string;
  event: {
    title: string;
    extendedProps: {
      status: string;
    };
  };
}

const EventContent: React.FC<EventContentProps> = ({ timeText, event }) => {
  const status = event.extendedProps.status;
  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500',
    pending: 'bg-yellow-500',
    default: 'bg-gray-500'
  };
  const statusColor = statusColors[status] || statusColors.default;
  
  return (
    <div className="flex items-start gap-1 p-1 overflow-hidden">
      <div className={`w-1.5 h-1.5 rounded-full ${statusColor} mt-1 flex-shrink-0`}></div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{timeText}</div>
        <div className="text-xs truncate">{event.title}</div>
      </div>
    </div>
  );
};

export const renderEventContent = (eventInfo: EventContentProps) => (
  <EventContent {...eventInfo} />
);

export default EventContent;
