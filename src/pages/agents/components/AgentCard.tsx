import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="h-full">
      <Card className="group relative flex flex-col overflow-hidden border backdrop-blur-xl h-full transition-all duration-300 hover:shadow-2xl hover:shadow-white/10">
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-120px] w-[248px] h-[248px] opacity-90 blur-[24px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(34,43,44,0)_70%)]" />
        <div
          className="flex flex-col h-full pb-3 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#2a4042] group-hover:via-[#344f52] group-hover:to-[#263839]"
          style={{
            background: "#222B2C",
            boxShadow:
              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
          }}
        >
          {/* Profile Image Section */}
          <motion.div
            className="relative flex justify-center items-center h-48 overflow-hidden mb-4 elementor-element elementor-element-7608a29 elementor-widget elementor-widget-image group"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="elementor-widget-container">
              <div className="relative h-full w-full">
                <img
                  src={image}
                  alt={agentName}
                  className="h-full w-full object-cover transition-all duration-500 elementor-animation-float"
                />
                <div className="absolute inset-0 bg-[#099946] opacity-0 transition-opacity duration-500 group-hover:opacity-60" />
              </div>
            </div>
          </motion.div>

          {/* Content Section */}
          <CardContent className="flex flex-1 flex-col gap-4 px-8 pb-4">
            <div className="flex flex-col gap-2 text-left">
              {/* Name and Title Combined */}
              <div className="elementor-element elementor-element-b21434a elementor-widget elementor-widget-neuros_heading">
                <div className="elementor-widget-container">
                  <div className="neuros-heading-widget">
                    <h2 className="neuros-heading">
                      <span className="neuros-heading-content has_gradient_color_text">
                        {name}
                      </span>
                    </h2>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="elementor-widget-container">
                <p className="text-xs text-left leading-relaxed text-white/70 transition-colors duration-300 group-hover:text-white/80">
                  {description}
                </p>
              </div>
            </div>

            {/* Learn More Button */}
            <div className="flex justify-start">
              <Button
                size="sm"
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {/* radial element 150px 150px */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                    backdropFilter: "blur(50px)",
                    WebkitBackdropFilter: "blur(50px)",
                    zIndex: -1,
                  }}
                ></div>
                <ArrowRightIcon className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">
                  Learn more about {agentName}
                </span>
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default AgentCard;
