import { List, Pencil, Sparkles, Mic, Send } from "lucide-react";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

type AssistantPanelProps = {
  isDesktop: boolean;
};

const AssistantPanel: FC<AssistantPanelProps> = ({ isDesktop }) => {
  const panelStyle = undefined;
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSendMessage = () => {
    if (message.trim()) {
      // Navigate to chat with the message as a query parameter
      navigate(`/chat?message=${encodeURIComponent(message.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <section
      className="assistant-panel mx-auto w-full h-full"
      style={panelStyle}
    >
      <div className="assistant-tools">
        <div className="assistant-tool">
          <List size={12} />
        </div>
        <div className="assistant-tool">
          <Pencil size={12} />
        </div>
      </div>

      <div className="assistant-greeting">
        <h1 className="assistant-greeting__headline font-poppins">
          Good Morning, Zubair!
        </h1>
        <p className="assistant-greeting__subtitle font-poppins">
          How can I assist You?
        </p>
      </div>

      <div className="assistant-composer">
        <div className="assistant-composer__chip font-poppins">
          <Sparkles size={20} />
          AI
        </div>
        <div className="assistant-composer__entry">
          <input
            className="assistant-composer__input font-poppins"
            type="text"
            placeholder="Ask CSOA Assistant"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="assistant-composer__actions">
          <div className="round-icon-btn--outline">
            <Mic size={14} />
          </div>
          <div
            className="round-icon-btn cursor-pointer"
            onClick={handleSendMessage}
          >
            <Send size={17} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AssistantPanel;
