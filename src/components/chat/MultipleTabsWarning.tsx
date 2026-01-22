import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MultipleTabsWarningProps = {
  show: boolean;
};

/**
 * Warning banner displayed when multiple chat tabs are detected
 *
 * This helps users understand that having multiple tabs open may cause
 * issues with message synchronization
 */
const MultipleTabsWarning = ({ show }: MultipleTabsWarningProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 shadow-lg backdrop-blur-sm">
          <AlertTriangle className="size-5 text-yellow-500 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-yellow-200">Multiple tabs detected</p>
            <p className="text-yellow-300/80 text-xs mt-1">
              For the best experience, use one tab at a time
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-yellow-400 hover:text-yellow-300 transition"
            aria-label="Dismiss warning"
          >
            <X className="size-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MultipleTabsWarning;
