import { ChangeEvent, KeyboardEvent } from "react";
import { Loader2, Plus, Send } from "lucide-react";
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

  const isSendDisabled = disabled || !value.trim() || isSending;

  return (
    <div className="w-full rounded-full border border-white/10 bg-[#282828] p-2 shadow-[0_18px_48px_rgba(12,17,28,0.4)] backdrop-blur">
      <div className="flex items-center gap-3 px-2">
        <label
          className="flex size-11 cursor-pointer items-center justify-center rounded-full text-white/70 transition hover:border-white/20 hover:bg-white/10 focus-within:border-white/30 focus-within:bg-white/15 focus-within:text-white"
          aria-label="Attach file"
        >
          <Plus className="size-7 bg-white/40 rounded-full" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>

        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Type Message"
          className="flex-1 min-h-0 resize-none border-0 bg-transparent px-0 py-2 text-sm text-white placeholder:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={disabled}
        />

        <Button
          size="icon"
          className="size-12 shrink-0 rounded-full bg-gradient-to-r from-[#55a0ff] to-[#64d5ff] text-white shadow-[0_16px_36px_rgba(92,182,255,0.45)] transition hover:shadow-[0_18px_40px_rgba(92,182,255,0.6)] disabled:opacity-60 disabled:shadow-none"
          onClick={onSend}
          disabled={isSendDisabled}
        >
          {isSending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatComposer;
