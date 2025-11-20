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
  maxWidthClass = "max-w-[360px] md:max-w-none md:w-[620px]",
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#050F1D]">
      {/* Mobile layout */}
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-12 md:hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A1B2D] via-[#071421] to-[#111F25]" />
          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#6CB4B91C] blur-[90px]" />
          <div className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-[#37507A1F] blur-[110px]" />
        </div>

        <div className="relative z-10 flex w-full justify-center">
          <div className={`w-full ${maxWidthClass}`}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center">
                <img src={cardIcon} alt="Empatech logo" className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h2 className="font-[Poppins] text-3xl font-semibold tracking-[0.01em] text-white">
                  {title}
                </h2>
                {subtitle && (
                  <div className="font-[Poppins] text-base font-light leading-relaxed text-white/55">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-10">{children}</div>
          </div>
        </div>
      </div>

      {/* Desktop layout (original) */}
      <div className="hidden min-h-screen w-full items-center justify-center overflow-hidden bg-[#1A1A1A] md:flex">
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

            <div className="auth-form-box relative rounded-[34px] p-7 bg-gradient-to-r from-white/30 to-transparent backdrop-blur-[40px] shadow-card overflow-hidden">
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
    </div>
  );
}
