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
  isAwaitingResponse?: boolean;
};

const ChatComposer = ({
  value,
  onChange,
  onSend,
  isSending,
  disabled = false,
  onUploadFile,
  isAwaitingResponse = false,
}: ChatComposerProps) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && !isAwaitingResponse && value.trim()) {
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

  const isSendDisabled =
    disabled || !value.trim() || isSending || isAwaitingResponse;

  const handleSend = () => {
    // Validate that message is not empty before sending
    if (!disabled && !isAwaitingResponse && !isSending && value.trim()) {
      onSend();
    }
  };

  return (
    <div
      className="w-full rounded-full border border-white/10 p-2 shadow-[0_18px_48px_rgba(12,17,28,0.4)] backdrop-blur"
      style={{
        background: "rgba(255, 255, 255, 0.1)",
        boxShadow:
          "rgba(255, 255, 255, 0.16) 0px 3.43px 3.43px 0px inset, rgba(255, 255, 255, 0.16) 0px -3.43px 3.43px 0px inset",
      }}
    >
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
            disabled={disabled || isAwaitingResponse}
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
          className="size-12 shrink-0 rounded-full text-white transition disabled:opacity-60"
          style={{
            background: "linear-gradient(226.23deg, #3F68B4 0%, #66B0B7 100%)",
            boxShadow:
              "0px 3.47px 3.47px 0px #FFFFFF40 inset, 0px -3.47px 3.47px 0px #FFFFFF40 inset",
          }}
          onClick={handleSend}
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
