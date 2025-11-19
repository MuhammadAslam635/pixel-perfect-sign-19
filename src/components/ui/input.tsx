import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "w-full h-[41px] rounded-[12px] px-4 text-[14px] text-white placeholder:text-gray-400",
          "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] border border-transparent",
          "focus:outline-none focus:ring-[2px] focus:ring-transparent",
          "shadow-[inset_0_0_10px_rgba(0,0,0,0.4)]",
          "relative z-10",
          className
        )}
        style={{
          background: "transparent",
          border: "1px solid rgba(0, 255, 255, 0.1)",
          borderRadius: "8px",
          boxShadow: "0 0 1px ",
          ...style,
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
