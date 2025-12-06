import { useNavigate, useLocation } from "react-router-dom";
import { Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const SkylarFloatingWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide widget on dashboard and chat pages
  const isHiddenPage = location.pathname === "/dashboard" || location.pathname === "/chat" || location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/forgot-password" || location.pathname === "/reset-password" || location.pathname === "/verify-email" || location.pathname === "/resend-email" || location.pathname === "/";

  if (isHiddenPage) {
    return null;
  }

  const handleClick = () => {
    navigate("/chat");
  };

  // Animation variants
  const buttonHoverVariants = {
    idle: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.95,
      transition: { duration: 0.1 }
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: 0.5 }}
      className="fixed bottom-6 z-50"
      style={{ left: '45%', transform: 'translateX(-50%)' }}
    >
      <motion.div
        variants={buttonHoverVariants}
        initial="idle"
        whileHover="hover"
        whileTap="tap"
        className="rounded-full border border-white/10 shadow-[0_18px_48px_rgba(12,17,28,0.4)] backdrop-blur cursor-pointer"
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          boxShadow:
            "rgba(255, 255, 255, 0.16) 0px 3.43px 3.43px 0px inset, rgba(255, 255, 255, 0.16) 0px -3.43px 3.43px 0px inset",
        }}
        onClick={handleClick}
        aria-label="Open Skylar Chat"
      >
        <div className="flex items-center justify-center gap-3 px-6 py-3">
          <span className="text-sm text-white font-medium whitespace-nowrap">Ask Skylar</span>
          <Button
            size="icon"
            className="size-8 shrink-0 rounded-full text-white transition"
            style={{
              background: "linear-gradient(226.23deg, #3F68B4 0%, #66B0B7 100%)",
              boxShadow:
                "0px 3.47px 3.47px 0px #FFFFFF40 inset, 0px -3.47px 3.47px 0px #FFFFFF40 inset",
            }}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SkylarFloatingWidget;
