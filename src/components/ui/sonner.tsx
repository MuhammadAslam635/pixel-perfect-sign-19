import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      closeButton
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            // Just transparent + blur, no gradient / glow
            "group-[.toaster]:bg-white/[0.03]",
            "group-[.toaster]:backdrop-blur-[12px]",
            "group-[.toaster]:border group-[.toaster]:border-white/20",
            // Text + layout
            "group-[.toaster]:text-white",
            "group-[.toaster]:rounded-2xl",
            "group-[.toaster]:px-5 group-[.toaster]:py-4 sm:group-[.toaster]:px-6",
            // Simple neutral depth
            "group-[.toaster]:shadow-[0_18px_45px_rgba(0,0,0,0.45)]",
          ].join(" "),
          error: [
            "group toast",
            // Darker cyan background for error notifications
            "group-[.toaster]:bg-[#0891B2]",
            "group-[.toaster]:backdrop-blur-[12px]",
            "group-[.toaster]:border group-[.toaster]:border-cyan-400/30",
            // Text + layout - white text for contrast
            "group-[.toaster]:text-white",
            "group-[.toaster]:rounded-2xl",
            "group-[.toaster]:px-5 group-[.toaster]:py-4 sm:group-[.toaster]:px-6",
            // Simple neutral depth
            "group-[.toaster]:shadow-[0_18px_45px_rgba(8,145,178,0.45)]",
          ].join(" "),
          title: "group-[.toast]:text-sm group-[.toast]:font-bold group-[.toast]:text-white",
          description: "group-[.toast]:text-sm group-[.toast]:text-white group-[.toast]:font-medium",
          errorTitle: "group-[.toast]:text-white",
          errorDescription: "group-[.toast]:text-white",


          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",

          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:text-white/50 group-[.toast]:bg-transparent absolute left-auto right-2 top-2 translate-x-0 translate-y-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white",
        },

      }}
      {...props}
    />
  );
};

export { Toaster, toast };
