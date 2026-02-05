import React from 'react';
import { StreamEvent } from '@/services/chat.service';
import { Loader2 } from 'lucide-react';

interface StreamingProgressProps {
  events: StreamEvent[];
  isVisible: boolean;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({ events, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  const currentEvent = events[events.length - 1];

  // Helper to get the main title
  // Helper to get the display text
  const getDisplayText = () => {
    if (!currentEvent) return 'Thinking...';
    
    // Prioritize the detailed description
    if (currentEvent.description) {
      return currentEvent.description;
    }

    if (currentEvent.type === 'complete') return 'Response ready';
    if (currentEvent.type === 'error') return 'Error occurred';
    
    // Fallback to step name
    return currentEvent.step?.replace(/^[^\w\s]+/, '').trim() || 'Processing...';
  };

  const displayText = getDisplayText();

  return (
    <div
      className="text-xs text-white flex flex-col gap-1"
    >
      <div className="flex items-center gap-2 font-medium mt-1">
        <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
        <span className="text-[11px] text-white/90 max-w-[300px] break-words leading-tight inline-block text-left">{displayText}</span>
      </div>
    </div>
  );
};

export default StreamingProgress;
