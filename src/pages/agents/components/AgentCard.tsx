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
    <div className="h-full">
      <Card className="group relative flex flex-col overflow-hidden border backdrop-blur-xl h-full transition-all duration-300 hover:shadow-2xl hover:shadow-white/10">
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-120px] w-[248px] h-[248px] opacity-90 blur-[24px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(34,43,44,0)_70%)]"
        />
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
            className="relative flex justify-center items-center h-48 overflow-hidden mb-4 elementor-element elementor-element-7608a29 elementor-widget elementor-widget-image"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="elementor-widget-container">
              <img
                src={image}
                alt={agentName}
                className="h-full object-cover transition-all duration-500 hover:grayscale-0 grayscale elementor-animation-float"
              />
            </div>
          </motion.div>

          {/* Content Section */}
          <CardContent className="flex flex-1 flex-col justify-between items-end gap-2 px-8 pb-4">
            <div className="flex flex-col gap-1 text-center">
              {/* Name */}
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

              {/* Title */}
              {title && (
                <p className="text-sm font-normal text-white/80 transition-colors duration-300 group-hover:text-white/90">
                  {title}
                </p>
              )}

              {/* Description */}
              <div className="elementor-widget-container">
                <p className="text-xs text-left leading-relaxed text-white/70 mt-2 transition-colors duration-300 group-hover:text-white/80">
                  {description}
                </p>
              </div>
            </div>

            {/* Learn More Button */}
            <div className="elementor-element elementor-element-d85f658 neuros-button-border-style-gradient neuros-button-bakground-style-solid elementor-widget elementor-widget-neuros_button">
              <div className="elementor-widget-container">
                <div className="button-widget">
                  <div className="button-container">
                    <ActiveNavButton
                      className="neuros-button mt-auto h-6 text-[9px] px-2 transition-all duration-300 group-hover:bg-white/20 group-hover:border-white/40"
                      icon={ArrowRightIcon}
                      text={`Learn more about ${agentName}`}
                    />
                    <span className="button-inner"></span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default AgentCard;
