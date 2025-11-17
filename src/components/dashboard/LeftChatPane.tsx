import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Sparkles, List, Edit } from "lucide-react";
import { RefObject } from "react";

type Props = {
  leftCardRef: RefObject<HTMLDivElement>;
  isMobile: boolean;
  leftPos: { top: number; left: number };
  recording: boolean;
  setRecording: (r: boolean) => void;
  editMode: boolean;
  setEditMode: (m: boolean) => void;
};

export default function LeftChatPane({
  leftCardRef,
  isMobile,
  leftPos,
  recording,
  setRecording,
  editMode,
  setEditMode,
}: Props) {
  const cardStyle = isMobile
    ? {
        position: "fixed" as const,
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        width: 340,
      }
    : {
        position: "fixed" as const,
        top: leftPos.top,
        left: leftPos.left,
        width: 560,
      };

  return (
    <Card
      ref={leftCardRef}
      style={cardStyle}
      className={`z-50 p-4 md:p-8 bg-[#3A3A3A]/60 backdrop-blur-sm border-[#4A4A4A]/40 h-full flex flex-col justify-center relative overflow-hidden shadow-lg`}
    >
      {/* Decorative icons as a single pill */}
      <div className="absolute top-6 left-6">
        <div className="chat-tools">
          <Button
            size="icon"
            variant="ghost"
            className="chat-tool-btn"
            aria-label="List"
          >
            <List className="w-[14px] h-[14px] text-foreground/70" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`chat-tool-btn ${editMode ? "chat-tool-active" : ""}`}
            onClick={() => setEditMode(!editMode)}
            aria-pressed={editMode}
            aria-label={editMode ? "Disable edit mode" : "Enable edit mode"}
          >
            <Edit className="w-[14px] h-[14px] text-foreground/80" />
          </Button>
        </div>
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-[2.5rem] font-semibold mb-2 text-foreground leading-tight">
          Good Morning, Zubair!
        </h1>
        <p className="text-xl text-muted-foreground/80 font-normal">
          How can I assist You?
        </p>
      </div>

      {/* AI Assistant Input */}
      <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6">
        <div className="chat-input-bar flex items-center gap-4 bg-[#2F2F2F]/70 backdrop-blur-sm border border-[#5A5A5A]/50">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <Input
            placeholder="Ask Skylar"
            className="chat-input-field border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 flex-1"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setRecording(!recording)}
            className={`chat-icon-btn w-9 h-9 rounded-full flex-shrink-0 ${
              recording
                ? "mic-recording"
                : "bg-[#464646]/60 hover:bg-[#5A5A5A]/60"
            }`}
            aria-pressed={recording}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            <Mic className="w-4 h-4 text-foreground/90" />
          </Button>
          <Button
            size="icon"
            className="chat-send-btn w-9 h-9 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
          >
            {/* send icon is in TopNav imports in page; keep simple here */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 11L21 3L13 21L11 13L3 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </div>
    </Card>
  );
}
