import { useState } from "react";
import { CheckCheck, Plus, Send } from "lucide-react";

type Message = {
  id: number;
  from: "lead" | "user";
  text: string;
  timestamp: string;
  delivered?: boolean;
};

const tabs = [
  { label: "WhatsApp", status: "" },
  { label: "Email", status: "" },
  { label: "SMS", status: "" },
  { label: "Call", status: "" },
];

const mockMessages: Message[] = [
  {
    id: 1,
    from: "user",
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.",
    timestamp: "09:42 AM",
    delivered: true,
  },
  {
    id: 2,
    from: "lead",
    text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
    timestamp: "09:45 AM",
  },
];

const LeadChat = () => {
  const [activeTab, setActiveTab] = useState<string>("WhatsApp");

  return (
    <section
      className="flex flex-col font-poppins items-center justify-center lg:p-10 p-5 max-w-full rounded-3xl"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        border: "1px solid #FFFFFF0D",
      }}
    >
      {/* Header Tabs */}
      <div className="w-full mb-6">
        <div className="flex w-full items-center gap-6 sm:gap-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className="relative pb-3 text-left"
              >
                <span
                  className={`text-sm font-medium sm:text-base lg:text-[16px] transition-colors ${
                    isActive ? "text-white font-semibold" : "text-white/50"
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lead Info */}
      <div className="flex w-full flex-col gap-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src="https://i.pravatar.cc/150?img=58"
            alt="Lead avatar"
            className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14"
          />
          <div className="flex flex-col">
            <p className="text-lg font-bold sm:text-xl text-white">
              Saad Naeem
            </p>
            <p className="text-sm font-normal text-white/60">
              Chief Executive Officer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-normal text-white/70 sm:ml-auto">
          <span>+92 256 369 325 36</span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-1"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="h-px w-full bg-white/30 mb-6" />
      {/* Content */}
      <div className="flex flex-col w-full">
        {activeTab === "WhatsApp" ? (
          <>
            <div className="flex flex-1 flex-col overflow-y-auto lg:max-h-[calc(100vh-510px)] max-h-[calc(100vh-350px)] scrollbar-hide mb-6">
              <div className="flex flex-col gap-4">
                {mockMessages.map((message, index) => (
                  <div
                    key={`${message.id}-${index}`}
                    className={`flex w-full items-start gap-3 ${
                      message.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.from === "lead" && (
                      <img
                        src="https://i.pravatar.cc/40?img=58"
                        alt="Lead avatar"
                        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                      />
                    )}
                    <div
                      className={`flex max-w-[75%] sm:max-w-[65%] ${
                        message.from === "user"
                          ? "flex-row-reverse items-end"
                          : "flex-row items-start"
                      } gap-3`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.from === "user"
                            ? "bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] text-white"
                            : "bg-white/10 text-white/90"
                        }`}
                        style={
                          message.from === "user"
                            ? {
                                background:
                                  "linear-gradient(135deg, #3E65B4 0%, #68B3B7 100%)",
                              }
                            : {}
                        }
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.text}
                        </p>
                      </div>
                      {message.from === "user" && (
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] flex items-center justify-center text-white font-semibold text-xs">
                            E
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                <Plus size={14} className="text-white" />
              </button>
              <input
                type="text"
                className="flex-1 bg-transparent outline-none border-none text-sm text-white placeholder:text-white/50"
                placeholder="Type Message"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity">
                <Send size={14} className="text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-1 items-center justify-center py-20 text-lg font-medium text-white/70">
            In work
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadChat;
