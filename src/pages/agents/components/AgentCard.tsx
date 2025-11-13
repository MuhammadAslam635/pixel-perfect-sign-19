import { Card, CardContent } from "@/components/ui/card";

type AgentCardProps = {
  image: string;
  name: string;
  description: string;
};

const AgentCard = ({ image, name, description }: AgentCardProps) => {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] backdrop-blur-xl transition hover:border-white/20 hover:shadow-[0_10px_35px_-15px_rgba(124,58,237,0.65)]">
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-70"></div>
      </div>
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <p className="text-sm leading-relaxed text-white/70">{description}</p>
      </CardContent>
    </Card>
  );
};

export default AgentCard;


