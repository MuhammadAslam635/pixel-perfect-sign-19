import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, type ButtonProps } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  confirmVariant?: ButtonProps["variant"];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending,
  confirmVariant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <AlertDialogContent 
        className="max-w-md p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
        style={{
          background: "#0a0a0a"
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}
        />
        
        <div className="relative z-10">
          <AlertDialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <AlertDialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">{title}</AlertDialogTitle>
            {description ? (
              <AlertDialogDescription className="text-xs text-white/70">
                {description}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter className="px-6 py-4 gap-2">
            <AlertDialogCancel asChild>
              <Button
                type="button"
                variant="ghost"
                className="text-white/70 hover:text-white"
                onClick={onCancel}
              >
                {cancelText}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={confirmVariant}
                className="bg-white text-[#0b0f20] hover:bg-white/90 min-w-[96px]"
                onClick={onConfirm}
                disabled={isPending}
              >
                {isPending ? "Processing..." : confirmText}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;

