import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { motion } from "framer-motion";

type AgentCardProps = {
  image: string;
  name: string;
  description: string;
};

const AgentCard = ({ image, name, description }: AgentCardProps) => {
  // Parse name to extract actual name and title
  const nameParts = name.split("–").map((part) => part.trim());
  const agentName = nameParts[0];
  const title = nameParts[1] || "";

  return (
    <motion.div
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card className="group relative flex flex-col overflow-hidden border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] backdrop-blur-xl h-full transition-all duration-300 hover:shadow-2xl hover:shadow-white/10">
        <motion.div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-120px] w-[248px] h-[248px] rounded-full opacity-90 blur-[24px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(34,43,44,0)_70%)]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.9, 1, 0.9]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <div
          className="flex flex-col h-full pt-6 pb-3 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#2a4042] group-hover:via-[#344f52] group-hover:to-[#263839]"
          style={{
            background: "#222B2C",
            boxShadow:
              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
          }}
        >
          {/* Profile Image Section */}
          <motion.div
            className="relative flex justify-center items-center h-28 overflow-hidden mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={image}
              alt={agentName}
              className="h-full object-cover rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-white/30"
              whileHover={{
                scale: 1.1,
                rotate: [0, -2, 2, 0],
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </motion.div>

          {/* Content Section */}
          <CardContent className="flex flex-1 flex-col justify-between items-end gap-2 px-8 pb-4">
            <motion.div
              className="flex flex-col gap-1 text-center"
              initial={{ opacity: 0.8 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {/* Name */}
              <motion.h3
                className="text-lg font-semibold text-white transition-colors duration-300 group-hover:text-white"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {agentName}
              </motion.h3>

              {/* Title */}
              {title && (
                <motion.p
                  className="text-sm font-normal text-white/80 transition-colors duration-300 group-hover:text-white/90"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  {title}
                </motion.p>
              )}

              {/* Description */}
              <motion.p
                className="text-xs text-left leading-relaxed text-white/70 mt-2 transition-colors duration-300 group-hover:text-white/80"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.2 }}
              >
                {description}
              </motion.p>
            </motion.div>

            {/* View Details Button */}
            <motion.div
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveNavButton
                className="mt-auto h-6 text-[9px] px-2 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/40"
                icon={ArrowRightIcon}
                text="View Details"
              />
            </motion.div>
          </CardContent>
        </div>
      </Card>
    </motion.div>
  );
};

export default AgentCard;
