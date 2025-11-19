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
            "w-full h-[41px] rounded-[11px] px-4 text-[14px] text-white placeholder:text-gray-400",
            "bg-[#D9D9D91A]",
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

