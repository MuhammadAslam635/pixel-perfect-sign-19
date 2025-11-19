import { Card, CardContent } from "@/components/ui/card";

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
    <Card className="group relative flex h-[280px] w-[320px] flex-col overflow-hidden border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] backdrop-blur-xl transition hover:border-white/20 hover:shadow-[0_10px_35px_-15px_rgba(124,58,237,0.65)]">
      <div
        className="flex flex-col h-full"
        style={{
          background: "#222B2C",
          boxShadow:
            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
        }}
      >
        {/* Profile Image Section */}
        <div className="relative flex justify-center items-center h-28 overflow-hidden pt-4">
          <img
            src={image}
            alt={agentName}
            className="h-full w-[25%] object-cover rounded-full transition duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content Section */}
        <CardContent className="flex flex-1 flex-col justify-between items-end gap-2 p-4 pb-4">
          <div className="flex flex-col gap-1 text-center">
            {/* Name */}
            <h3 className="text-lg font-semibold text-white">{agentName}</h3>

            {/* Title */}
            {title && (
              <p className="text-sm font-normal text-white/80">{title}</p>
            )}

            {/* Description */}
            <p className="text-xs leading-relaxed text-white/70 mt-1">
              {description}
            </p>
          </div>

          {/* View Details Button */}
          <button
            className="mt-auto w-1/2 rounded-lg py-2.5 px-4 transition-all duration-200 flex justify-end gap-2 font-poppins hover:bg-[#FFFFFF26]"
            style={{
              background: "#FFFFFF1A",
              border: "0.76px solid #FFFFFF1F",
              fontFamily: "Poppins, sans-serif",
              fontWeight: 400,
              fontSize: "10px",
              color: "#FFFFFF",
            }}
          >
            <span>View Details</span>
            <span>→</span>
          </button>
        </CardContent>
      </div>
    </Card>
  );
};

export default AgentCard;
