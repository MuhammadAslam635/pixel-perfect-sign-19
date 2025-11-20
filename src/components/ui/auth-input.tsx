import * as React from "react";
import { cn } from "@/lib/utils";

const AuthInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <div className="input-gradient-border">
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full h-[56px] rounded-[16px] px-5 text-base text-white placeholder:text-white/40",
            "bg-white/5",
            "focus:outline-none focus:ring-0",
            "border-none",
            className
          )}
          style={style}
          {...props}
        />
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export { AuthInput };

