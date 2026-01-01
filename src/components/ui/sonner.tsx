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
            "group-[.toaster]:bg-transparent",
            "group-[.toaster]:backdrop-blur-[6px]",
            "group-[.toaster]:border group-[.toaster]:border-white/14",
            // Text + layout
            "group-[.toaster]:text-white",
            "group-[.toaster]:rounded-2xl",
            "group-[.toaster]:px-5 group-[.toaster]:py-4 sm:group-[.toaster]:px-6",
            // Simple neutral depth
            "group-[.toaster]:shadow-[0_18px_45px_rgba(0,0,0,0.45)]",
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:text-muted-foreground group-[.toast]:bg-muted absolute left-auto right-4 top-4 translate-x-0 translate-y-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
