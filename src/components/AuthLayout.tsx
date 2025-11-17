import { ReactNode } from "react";
import Logo from "./Logo";
import gridPattern from "@/assets/grid-pattern.png";
import cardIcon from "@/assets/card-icon.png";

type AuthLayoutProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-[500px]",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#1A1A1A]">
      {/* Grid Pattern Background with teal glow overlay (keep PNG) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute bottom-0 left-0 right-0 h-[400px] opacity-100"
          style={{
            backgroundImage: `url(${gridPattern})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(800px 180px at 50% 90%, rgba(105,179,183,0.20), transparent 80%),\n" +
              "radial-gradient(600px 160px at 40% 90%, rgba(105,179,183,0.12), transparent 80%)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      <div className="absolute top-8 left-8 z-20">
        <Logo />
      </div>

      <div className="min-h-screen flex items-center justify-center py-6 relative z-10">
        <div className={`w-full ${maxWidthClass} relative`}>
          <div className="absolute -top-24 -right-24 w-[320px] h-[320px] -z-10">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#66B0B7] via-[#4D7FDB] to-[#243B63] opacity-90"
              style={{
                filter: "",
                transform: "scale(1.05)",
              }}
            />
          </div>

          {/* <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-36 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(60% 90% at 50% 0%, rgba(105,179,183,0.35), rgba(105,179,183,0.15) 35%, transparent 70%)",
              filter: "blur(18px)",
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          /> */}

          <div className="relative rounded-[34px] p-7 border-[1px] border-cyan/50 bg-gradient-to-r from-white/30 to-transparent backdrop-blur-[40px] shadow-card ring-1 ring-white/15 overflow-hidden">
            {/* <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-br from-white/45 via-white/10 to-transparent opacity-90 mix-blend-screen" /> */}
            {/* <div className="pointer-events-none absolute inset-x-2 top-2 rounded-[30px] h-1/2 bg-white/40 opacity-80 blur-2xl" /> */}
            <div className="relative z-10">
              <div className="flex justify-center mb-4">
                <img src={cardIcon} alt="Logo" className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-semibold text-center text-foreground mb-1">
                {title}
              </h2>
              {subtitle && (
                <div className="text-center text-muted-foreground/60 text-xs mb-4">
                  {subtitle}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
