import { ChangeEvent, KeyboardEvent } from "react";
import { Mic, Paperclip, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  onUploadFile?: (file: File) => void;
};

const ChatComposer = ({
  value,
  onChange,
  onSend,
  isSending,
  disabled = false,
  onUploadFile,
}: ChatComposerProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      event.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/40 p-4 shadow-[0_24px_80px_rgba(14,23,43,0.45)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
      <div className="relative w-full flex-1">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type your message to the CSOA assistant…"
          className="min-h-[48px] resize-none rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/60"
          disabled={disabled}
        />
        <span className="pointer-events-none absolute right-4 top-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">
          Shift + Enter for new line
        </span>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <label className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-primary/40 hover:text-primary">
          <Paperclip className="size-4" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full border border-white/10 bg-white/5 text-white transition hover:border-primary/40 hover:bg-primary/15 hover:text-white"
          disabled
          title="Voice input coming soon"
        >
          <Mic className="size-4" />
        </Button>

        <Button
          size="icon"
          className="size-12 rounded-full bg-gradient-to-r from-[#5ba7ff] to-[#6be5f5] text-gray-900 shadow-[0_16px_40px_rgba(104,196,255,0.45)] transition hover:shadow-[0_20px_40px_rgba(104,196,255,0.6)]"
          onClick={onSend}
          disabled={disabled || !value.trim() || isSending}
        >
          <Send className="size-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatComposer;
