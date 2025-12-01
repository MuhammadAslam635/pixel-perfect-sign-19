import { Card, CardContent } from "@/components/ui/card";
import { ArrowRightIcon } from "lucide-react";
import { ActiveNavButton } from "@/components/ui/primary-btn";

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
    <Card className="group relative flex flex-col overflow-hidden border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] backdrop-blur-xl">
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[-120px] w-[248px] h-[248px] rounded-full opacity-90 blur-[24px] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.35)_0%,rgba(34,43,44,0)_70%)]" />
      <div
        className="flex flex-col h-full pt-6 pb-3"
        style={{
          background: "#222B2C",
          boxShadow:
            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
        }}
      >
        {/* Profile Image Section */}
        <div className="relative flex justify-center items-center h-28 overflow-hidden mb-4">
          <img
            src={image}
            alt={agentName}
            className="h-full object-cover rounded-full"
          />
        </div>

        {/* Content Section */}
        <CardContent className="flex flex-1 flex-col justify-between items-end gap-2 px-8 pb-4">
          <div className="flex flex-col gap-1 text-center">
            {/* Name */}
            <h3 className="text-lg font-semibold text-white">{agentName}</h3>

            {/* Title */}
            {title && (
              <p className="text-sm font-normal text-white/80">{title}</p>
            )}

            {/* Description */}
            <p className="text-xs text-left leading-relaxed text-white/70 mt-2">
              {description}
            </p>
          </div>

          {/* View Details Button */}
          <ActiveNavButton
            className="mt-auto"
            icon={ArrowRightIcon}
            text="View Details"
          />
        </CardContent>
      </div>
    </Card>
  );
};

export default AgentCard;
