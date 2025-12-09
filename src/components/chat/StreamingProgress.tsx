import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamEvent } from '@/services/chat.service';
import { Loader2 } from 'lucide-react';

interface StreamingProgressProps {
  events: StreamEvent[];
  isVisible: boolean;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({ events, isVisible }) => {
  if (!isVisible || events.length === 0) {
    return null;
  }

  const currentEvent = events[events.length - 1];

  const getCurrentStepText = () => {
    if (!currentEvent) return 'Thinking...';

    if (currentEvent.type === 'complete') {
      return 'Response ready';
    }

    if (currentEvent.type === 'error') {
      return 'Error occurred';
    }

    // Show the step name without emoji for cleaner text
    const stepText = currentEvent.step?.replace(/^[^\w\s]+/, '').trim() || currentEvent.type;
    return stepText;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-xs text-gray-500 italic mt-1 flex items-center gap-2"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>{getCurrentStepText()}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default StreamingProgress;
