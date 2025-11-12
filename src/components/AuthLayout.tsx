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
          <div className="absolute -top-20 -right-20 w-[260px] h-[260px] -z-10">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#66B0B7] to-[#3E64B3]" />
          </div>

          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-36 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(60% 90% at 50% 0%, rgba(105,179,183,0.35), rgba(105,179,183,0.15) 35%, transparent 70%)",
              filter: "blur(18px)",
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          />

          <div className="relative rounded-3xl p-7 border-[2.5px] border-white/15 bg-white/10 backdrop-blur-3xl shadow-card ring-1 ring-white/10">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent" />
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
  );
}
