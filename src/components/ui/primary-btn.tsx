import React from "react";
import { Button } from "./button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveNavButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  text: string;
  showIndicator?: boolean;
  className?: string;
  iconClassName?: string;
}

export const ActiveNavButton = React.forwardRef<
  HTMLButtonElement,
  ActiveNavButtonProps
>(({ icon: Icon, text, showIndicator = false, className, iconClassName, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "relative overflow-hidden flex-none flex h-10 items-center justify-start rounded-full border border-white/40 px-0 text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-400 ease-elastic text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] w-auto pl-3.5 pr-3.5 gap-2 z-10 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86]",
        className
      )}
      style={{
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
      }}
      {...props}
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
        style={{
          background: "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
          filter: "blur(20px)",
          WebkitFilter: "blur(20px)",
        }}
      ></div>
      {Icon && (
        <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]", iconClassName)} />
      )}
      <span className="whitespace-nowrap ml-1.5 opacity-100 scale-100 translate-x-0 max-w-[200px]">
        {text}
      </span>
      {showIndicator && (
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}
    </Button>
  );
});

ActiveNavButton.displayName = "ActiveNavButton";
