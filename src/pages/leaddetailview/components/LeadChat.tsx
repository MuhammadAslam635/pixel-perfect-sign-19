
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
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
        timestamp: "09:40 AM",
    },
    {
        id: 2,
        from: "user",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.",
        timestamp: "09:42 AM",
        delivered: true,
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },
    {
        id: 3,
        from: "lead",
        text: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        timestamp: "09:45 AM",
    },

];

const LeadChat = () => {
    const [activeTab, setActiveTab] = useState<string>("WhatsApp");

    const activeIndex = tabs.findIndex((tab) => tab.label === activeTab);

    return (
        <section
            className="flex flex-col font-poppins items-center justify-center lg:p-10 p-5 max-w-full border-[1px] border-white/10 rounded-3xl lg:m-10 m-3"
            style={{
                backgroundImage:
                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
        >
            {/* Header Tabs */}
            <div className="w-full">
                <div className="flex w-full justify-center lg:justify-start">
                    <div className="flex w-full flex-wrap items-center gap-2 sm:gap-4 lg:w-[55%]">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.label;

                            return (
                                <button
                                    key={tab.label}
                                    type="button"
                                    onClick={() => setActiveTab(tab.label)}
                                    className="flex flex-1 flex-col items-center pt-5 text-left"
                                >
                                    <span
                                        className={`text-sm font-medium sm:text-base lg:text-[16px] ${isActive ? "text-white" : "text-white/50"
                                            }`}
                                    >
                                        {tab.label}
                                    </span>
                                    {!isActive && tab.status && (
                                        <span className="text-[12px] font-normal text-white/40">
                                            {tab.status}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="relative mt-2 h-[1px] bg-white/30">
                    <div className="absolute inset-0 flex justify-center lg:justify-start">
                        <div className="relative h-full w-full lg:w-[55%]">
                            <div
                                className="absolute top-[-1px] h-[3px] bg-white transition-all duration-300 ease-out"
                                style={{
                                    width: `${100 / tabs.length}%`,
                                    transform: `translateX(${activeIndex * 100}%)`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lead Info */}
            <div className="flex w-full flex-col gap-6 py-8 sm:flex-row items-center sm:justify-between">
                <div className="flex items-center gap-4 text-left flex-wrap sm:flex-nowrap">
                    <div className="flex justify-center">
                        <img
                            src="https://i.pravatar.cc/150?img=58"
                            alt="Lead avatar"
                            className="h-10 w-10 rounded-full object-cover sm:h-12 sm:w-12"
                        />
                    </div>
                    <div className="flex flex-col px-0 sm:px-5 sm:pt-0">
                        <p className="text-lg font-bold sm:text-xl lg:text-[20px]">Saad Naeem</p>
                        <p className="text-xs font-normal text-white/60 sm:text-sm lg:text-[14px]">Chief Executive Officer</p>
                    </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm font-normal sm:text-base lg:text-[14px]">
                    +92 256 369 325 36
                    <svg
                        width="18"
                        height="12"
                        viewBox="0 0 12 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-4"
                    >
                        <path
                            d="M1 1.5L6 6.5L11 1.5"
                            stroke="gray"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
            <div className="h-px w-full bg-white/30" />
            {/* Content */}
            <div className="flex flex-col w-full">
                {activeTab === "WhatsApp" ? (
                    <>
                        <div className="flex flex-1 flex-col overflow-y-auto lg:max-h-[calc(100vh-420px)] max-h-[calc(100vh-350px)] scrollbar-hide">
                            <div className="flex flex-col">
                                {mockMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex w-full ${message.from === "user" ? "justify-end" : "justify-start"
                                            } py-5 items-center`}
                                    >
                                        {message.from === "lead" && (
                                            <img
                                                src="https://i.pravatar.cc/40?img=58"
                                                alt="Lead avatar"
                                                className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11"
                                            />
                                        )}
                                        <div className="flex max-w-[90%] flex-col sm:max-w-[80%]">
                                            <p
                                                className={`text-xs font-normal leading-6 p-5 sm:text-sm sm:leading-7 sm:p-6 lg:text-[13px] lg:leading-[30px] lg:p-8 ${message.from === "user"
                                                        ? "bg-[linear-gradient(135deg,#68B3B7_0%,#3E65B4_100%)] text-white rounded-3xl mr-5"
                                                        : "bg-gray-100/5 rounded-3xl ml-5"
                                                    }`}
                                            >
                                                {message.text}
                                            </p>
                                            {/* <div className="flex items-center justify-end text-xs py-2">
                    <span>{message.timestamp}</span>
                    {message.delivered && <CheckCheck size={14} />}
                  </div> */}
                                        </div>
                                        {message.from === "user" && (
                                            <div className="flex">
                                                <img
                                                    src="https://i.pravatar.cc/40?img=12"
                                                    alt="User avatar"
                                                    className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Composer */}
                        <div className="lg:mx-10 mt-5 flex items-center lg:gap-4 gap-2 rounded-full bg-white/10 lg:px-6 px-4 py-4">
                            <button className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                                <Plus size={12} />
                            </button>
                            <input
                                className="flex-1 lg:text-[18px] text-[14px] font-normal bg-transparent outline-none border-none"
                                placeholder="Type Message"
                                style={{ fontFamily: "Figtree, sans-serif" }}
                            />
                            <button className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-bl from-[#3F68B4] to-[#66B0B7]">
                                <Send size={12} />
                            </button>
                            {/* <div className="lg:hidden flex gap-2">
                                <button className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                                    <Plus size={12} />
                                </button>
                                <button className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-bl from-[#3F68B4] to-[#66B0B7]">
                                    <Send size={12} />
                                </button>
                            </div> */}
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

