import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Send } from "lucide-react";
import { Lead } from "@/services/leads.service";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import { twilioService, LeadSmsMessage } from "@/services/twilio.service";
import API from "@/utils/api";
import { CallView } from "./CallView";

type Message = {
  id: number;
  from: "lead" | "user";
  text: string;
  timestamp: string;
  delivered?: boolean;
};

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

type LeadChatProps = {
  lead?: Lead;
};

type SmsStatusDisplay = {
  label: string;
  className: string;
};

const getSmsStatusDisplay = (status?: string): SmsStatusDisplay | null => {
  if (!status) {
    return null;
  }

  const normalized = status.toLowerCase();

  const statusMap: Record<string, SmsStatusDisplay> = {
    queued: { label: "Sent", className: "text-white/70" },
    accepted: { label: "Sent", className: "text-white/70" },
    sending: { label: "Sent", className: "text-white/70" },
    sent: { label: "Sent", className: "text-white/70" },
    delivered: { label: "Delivered", className: "text-emerald-300" },
    received: { label: "Delivered", className: "text-emerald-300" },
    read: { label: "Read", className: "text-emerald-300" },
    failed: { label: "Failed", className: "text-red-300" },
    undelivered: { label: "Failed", className: "text-red-300" },
    canceled: { label: "Canceled", className: "text-red-300" },
    "no-answer": { label: "No answer", className: "text-white/60" },
  };

  if (statusMap[normalized]) {
    return statusMap[normalized];
  }

  return {
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    className: "text-white/60",
  };
};

const fallbackLeadInfo = {
  name: "Saad Naeem",
  position: "Chief Executive Officer",
};

const LeadChat = ({ lead }: LeadChatProps) => {
  const displayName = lead?.name || fallbackLeadInfo.name;
  const position = lead?.position || fallbackLeadInfo.position;
  const phoneNumber = lead?.phone;
  const emailAddress = lead?.email;
  const avatarSrc = lead?.pictureUrl;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || "?";
  const leadEmailLower = emailAddress?.toLowerCase() || null;
  const leadId = lead?._id;

  const [emailMessages, setEmailMessages] = useState<Email[]>([]);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fetchedEmailFor, setFetchedEmailFor] = useState<string | null>(null);
  const [smsInput, setSmsInput] = useState("");
  const [smsSendError, setSmsSendError] = useState<string | null>(null);
  const [twilioConnection, setTwilioConnection] = useState<{
    loading: boolean;
    ready: boolean;
    message: string;
    missingFields: string[];
  }>({
    loading: true,
    ready: false,
    message: "",
    missingFields: [],
  });
  const queryClient = useQueryClient();
  const whatsappScrollRef = useRef<HTMLDivElement | null>(null);
  const emailScrollRef = useRef<HTMLDivElement | null>(null);
  const smsScrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (ref: RefObject<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const channelTabs = useMemo(() => {
    const hasPhone = Boolean(lead?.phone);
    const hasEmail = Boolean(lead?.email);
    const statusText = (available: boolean) =>
      available ? "Connected" : "Unavailable";

    return [
      {
        label: "WhatsApp",
        status: statusText(hasPhone),
        isAvailable: hasPhone,
      },
      { label: "Email", status: statusText(hasEmail), isAvailable: hasEmail },
      { label: "SMS", status: statusText(hasPhone), isAvailable: hasPhone },
      { label: "Call", status: statusText(hasPhone), isAvailable: hasPhone },
    ];
  }, [lead?.phone, lead?.email]);

  const firstAvailableTab =
    channelTabs.find((tab) => tab.isAvailable)?.label ||
    channelTabs[0]?.label ||
    "WhatsApp";

  const [activeTab, setActiveTab] = useState<string>(firstAvailableTab);

  useEffect(() => {
    setActiveTab((prev) =>
      prev === firstAvailableTab ? prev : firstAvailableTab
    );
  }, [firstAvailableTab]);

  useEffect(() => {
    setEmailMessages([]);
    setFetchedEmailFor(null);
  }, [lead?._id]);

  useEffect(() => {
    let isMounted = true;
    const fetchTwilioStatus = async () => {
      setTwilioConnection((prev) => ({ ...prev, loading: true }));
      try {
        const response = await API.get("/twilio/connection-check");
        const statusData = response.data?.data;
        const ready = Boolean(
          response.data?.success &&
            response.data?.connected &&
            statusData?.hasAllCredentials
        );
        const missingFields = statusData?.missingFields || [];
        const message = ready
          ? "Twilio calling and SMS are ready."
          : missingFields.length
          ? `Twilio credentials aren't configured yet.`
          : "Twilio credentials aren't configured yet.";
        if (isMounted) {
          setTwilioConnection({
            loading: false,
            ready,
            message,
            missingFields,
          });
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          status === 404
            ? "Company Twilio credentials aren't added yet."
            : error?.response?.data?.message ||
              "Unable to verify Twilio credentials.";
        if (isMounted) {
          setTwilioConnection({
            loading: false,
            ready: false,
            message,
            missingFields: [],
          });
        }
      }
    };

    fetchTwilioStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const shouldFetchEmailConversation =
      activeTab === "Email" &&
      !!leadEmailLower &&
      fetchedEmailFor !== leadEmailLower;

    if (!shouldFetchEmailConversation) {
      return;
    }

    let isCancelled = false;

    const fetchEmailConversation = async () => {
      setIsEmailLoading(true);
      setEmailError(null);

      try {
        const threadsResponse = await emailService.getEmailThreads({
          limit: 100,
        });
        if (isCancelled) return;

        const threads = threadsResponse.data?.threads || [];
        const matchingThread = threads.find(
          (thread) =>
            Array.isArray(thread.participants) &&
            thread.participants.some(
              (participant) =>
                participant.email?.toLowerCase() === leadEmailLower
            )
        );

        if (!matchingThread) {
          setEmailMessages([]);
          setFetchedEmailFor(leadEmailLower);
          return;
        }

        const threadResponse = await emailService.getThread(matchingThread._id);
        if (isCancelled) return;

        const emails = threadResponse.data?.emails || [];
        const sortedEmails = [...emails].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setEmailMessages(sortedEmails);
        setFetchedEmailFor(leadEmailLower);
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load email conversation", error);
          setEmailError(
            "Failed to load email conversation. Please try again later."
          );
        }
      } finally {
        if (!isCancelled) {
          setIsEmailLoading(false);
        }
      }
    };

    fetchEmailConversation();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, leadEmailLower, fetchedEmailFor]);

  const twilioReady = twilioConnection.ready;
  const twilioStatusLoading = twilioConnection.loading;

  const {
    data: leadSmsResponse,
    isLoading: isSmsInitialLoading,
    isFetching: isSmsFetching,
    isError: isSmsError,
    error: smsQueryError,
  } = useQuery({
    queryKey: ["lead-sms", leadId],
    queryFn: () =>
      twilioService.getLeadMessages(leadId as string, { limit: 100 }),
    enabled:
      activeTab === "SMS" && Boolean(leadId && phoneNumber) && twilioReady,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const isSmsLoading =
    twilioStatusLoading ||
    isSmsInitialLoading ||
    (isSmsFetching && !leadSmsResponse);

  const smsMessages: LeadSmsMessage[] = leadSmsResponse?.data || [];
  const smsUnavailableMessage =
    !twilioReady && !twilioStatusLoading
      ? twilioConnection.message ||
        "Company Twilio credentials aren't added yet."
      : null;
  const smsInputsDisabled = Boolean(smsUnavailableMessage) || !phoneNumber;

  useEffect(() => {
    if (!smsUnavailableMessage && smsSendError) {
      setSmsSendError(null);
    }
  }, [smsUnavailableMessage, smsSendError]);

  const orderedSmsMessages = useMemo(() => {
    return [...smsMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [smsMessages]);

  useEffect(() => {
    if (activeTab === "WhatsApp") {
      scrollToBottom(whatsappScrollRef);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "Email") {
      scrollToBottom(emailScrollRef);
    }
  }, [emailMessages, activeTab]);

  useEffect(() => {
    if (activeTab === "SMS") {
      scrollToBottom(smsScrollRef);
    }
  }, [orderedSmsMessages, activeTab]);

  const smsQueryErrorMessage = isSmsError
    ? (smsQueryError as any)?.response?.data?.message ||
      (smsQueryError as Error)?.message ||
      "Failed to load SMS history"
    : null;

  const smsMutation = useMutation({
    mutationFn: (payload: { body: string }) =>
      twilioService.sendLeadMessage(leadId as string, payload),
    onSuccess: () => {
      setSmsInput("");
      setSmsSendError(null);
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["lead-sms", leadId] });
      }
    },
    onError: (mutationError: any) => {
      const fallbackMessage =
        mutationError?.response?.data?.error ||
        mutationError?.message ||
        "Failed to send SMS";
      setSmsSendError(fallbackMessage);
    },
  });

  const handleSendSms = () => {
    if (
      !leadId ||
      !smsInput.trim() ||
      smsMutation.isPending ||
      smsInputsDisabled
    ) {
      if (smsInputsDisabled && smsUnavailableMessage) {
        setSmsSendError(smsUnavailableMessage);
      }
      return;
    }
    smsMutation.mutate({ body: smsInput.trim() });
  };

  const getEmailBodyText = (email: Email) => {
    if (email.body?.text?.trim()) {
      return email.body.text.trim();
    }
    if (email.body?.html) {
      const stripped = email.body.html.replace(/<[^>]+>/g, " ");
      return stripped.replace(/\s+/g, " ").trim();
    }
    return "";
  };

  const formatEmailTimestamp = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const headerContactValue =
    activeTab === "Email" ? emailAddress || "" : phoneNumber || "";

  const handleComposeEmail = () => {
    window.location.href = "http://localhost:8080/emails/compose";
  };

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
          {channelTabs.map((tab) => {
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
                <span className="block text-[10px] text-white/40">
                  {tab.status}
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
          <div className="h-12 w-12 sm:h-14 sm:w-14">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${displayName} avatar`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#3d4f51] text-white text-2xl">
                {avatarLetter}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-lg font-bold sm:text-xl text-white">
              {displayName}
            </p>
            <p className="text-sm font-normal text-white/60">{position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-normal text-white/70 sm:ml-auto">
          <span>{headerContactValue || "\u00A0"}</span>
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
            <div
              ref={whatsappScrollRef}
              className="flex flex-col overflow-y-auto scrollbar-hide mb-6 h-[calc(100vh-350px)] lg:h-[calc(100vh-550px)]"
            >
              <div className="flex flex-col gap-4">
                {mockMessages.map((message, index) => (
                  <div
                    key={`${message.id}-${index}`}
                    className={`flex w-full items-start gap-3 ${
                      message.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.from === "lead" && (
                      <div className="h-10 w-10 flex-shrink-0">
                        {avatarSrc ? (
                          <img
                            src={avatarSrc}
                            alt={`${displayName} avatar`}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#3d4f51] text-white text-2xl">
                            {avatarLetter}
                          </span>
                        )}
                      </div>
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
        ) : activeTab === "Email" ? (
          <div className="flex flex-1 flex-col">
            {!emailAddress ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                Add an email address for this lead to view their conversation
                history.
              </div>
            ) : isEmailLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p>Loading email conversation...</p>
              </div>
            ) : emailError ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-red-300">
                {emailError}
              </div>
            ) : emailMessages.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                No email conversation with this lead yet.
              </div>
            ) : (
              <div
                ref={emailScrollRef}
                className="flex flex-col overflow-y-auto scrollbar-hide mb-6 gap-4 h-[calc(100vh-350px)] lg:h-[calc(100vh-510px)]"
              >
                {emailMessages.map((email) => {
                  const isOutbound = email.direction === "outbound";
                  const authorName = isOutbound
                    ? "You"
                    : email.from?.name || email.from?.email || displayName;
                  const emailBody = getEmailBodyText(email);

                  return (
                    <div
                      key={email._id}
                      className={`flex w-full gap-3 ${
                        isOutbound ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOutbound && (
                        <div className="h-10 w-10 flex-shrink-0">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={`${displayName} avatar`}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#3d4f51] text-white text-2xl">
                              {avatarLetter}
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        className={`flex max-w-[80%] sm:max-w-[65%] flex-col gap-2 ${
                          isOutbound ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`w-full rounded-2xl px-4 py-3 ${
                            isOutbound
                              ? "bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] text-white"
                              : "bg-white/10 text-white/90"
                          }`}
                          style={
                            isOutbound
                              ? {
                                  background:
                                    "linear-gradient(135deg, #3E65B4 0%, #68B3B7 100%)",
                                }
                              : {}
                          }
                        >
                          <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                            <span className="font-semibold text-white">
                              {authorName}
                            </span>
                            <span className="text-white/60">
                              {formatEmailTimestamp(email.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold mt-2">
                            {email.subject || "No subject"}
                          </p>
                          {emailBody && (
                            <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                              {emailBody}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleComposeEmail}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-6 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Send size={14} className="text-white" />
                Compose Email
              </button>
            </div>
          </div>
        ) : activeTab === "SMS" ? (
          <div className="flex flex-1 flex-col">
            {!phoneNumber ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                Add a phone number for this lead to start SMS conversations.
              </div>
            ) : smsUnavailableMessage ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-amber-200">
                {smsUnavailableMessage}
              </div>
            ) : isSmsLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p>Loading SMS conversation...</p>
              </div>
            ) : smsQueryErrorMessage ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-red-300">
                {smsQueryErrorMessage}
              </div>
            ) : orderedSmsMessages.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                No SMS conversation with this lead yet.
              </div>
            ) : (
              <div
                ref={smsScrollRef}
                className="flex flex-col overflow-y-auto scrollbar-hide mb-6 gap-4 h-[calc(100vh-350px)] lg:h-[calc(100vh-510px)]"
              >
                {orderedSmsMessages.map((message) => {
                  const isOutbound = message.direction === "outbound";
                  const statusDisplay = isOutbound
                    ? getSmsStatusDisplay(message.status)
                    : null;
                  return (
                    <div
                      key={message._id}
                      className={`flex w-full gap-3 ${
                        isOutbound ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isOutbound && (
                        <div className="h-10 w-10 flex-shrink-0">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt={`${displayName} avatar`}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#3d4f51] text-white text-2xl">
                              {avatarLetter}
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        className={`flex max-w-[80%] sm:max-w-[65%] flex-col gap-2 ${
                          isOutbound ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`w-full rounded-2xl px-4 py-3 ${
                            isOutbound
                              ? "bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] text-white"
                              : "bg-white/10 text-white/90"
                          }`}
                          style={
                            isOutbound
                              ? {
                                  background:
                                    "linear-gradient(135deg, #3E65B4 0%, #68B3B7 100%)",
                                }
                              : {}
                          }
                        >
                          <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                            <span className="font-semibold text-white">
                              {isOutbound ? "You" : displayName}
                            </span>
                            <span className="text-white/60">
                              {formatEmailTimestamp(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                            {message.body}
                          </p>
                          {statusDisplay && (
                            <span
                              className={`mt-2 text-[11px] font-medium tracking-wide ${statusDisplay.className}`}
                            >
                              {statusDisplay.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={smsInputsDisabled}
              >
                <Plus size={14} className="text-white" />
              </button>
              <input
                type="text"
                value={smsInput}
                onChange={(event) => setSmsInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendSms();
                  }
                }}
                disabled={smsInputsDisabled}
                className="flex-1 bg-transparent outline-none border-none text-sm text-white placeholder:text-white/50 disabled:opacity-50"
                placeholder={
                  smsUnavailableMessage
                    ? smsUnavailableMessage
                    : phoneNumber
                    ? "Type SMS message"
                    : "Add a phone number to send SMS"
                }
              />
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleSendSms}
                disabled={
                  smsInputsDisabled || !smsInput.trim() || smsMutation.isPending
                }
              >
                {smsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send size={14} className="text-white" />
                )}
              </button>
            </div>
            {smsSendError && (
              <p className="mt-2 text-xs text-red-300">{smsSendError}</p>
            )}
          </div>
        ) : activeTab === "Call" ? (
          <CallView
            lead={lead}
            twilioReady={twilioReady}
            twilioStatusMessage={
              twilioStatusLoading
                ? "Checking calling availability..."
                : twilioConnection.message ||
                  "Company Twilio credentials aren't added yet."
            }
            twilioStatusLoading={twilioStatusLoading}
          />
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
