import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Lead } from "@/services/leads.service";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import { twilioService, LeadSmsMessage } from "@/services/twilio.service";
import API from "@/utils/api";
import { CallView } from "./CallView";
import {
  whatsappService,
  WhatsAppMessage as WhatsAppChatMessage,
} from "@/services/whatsapp.service";
import { connectionMessagesService } from "@/services/connectionMessages.service";
import { SelectedCallLogView } from "../index";

type LeadChatProps = {
  lead?: Lead;
  selectedCallLogView: SelectedCallLogView;
  setSelectedCallLogView: (view: SelectedCallLogView) => void;
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

const normalizePhoneNumber = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let formatted = trimmed.replace(/[^+\d]/g, "");
  if (formatted.startsWith("00")) {
    formatted = "+" + formatted.slice(2);
  }

  if (!formatted.startsWith("+")) {
    if (/^\d{10}$/.test(formatted)) {
      formatted = "+1" + formatted;
    } else {
      return null;
    }
  }

  return /^\+[1-9]\d{7,14}$/.test(formatted) ? formatted : null;
};

const DEFAULT_EMAIL_SUBJECT = "Message from Lead Chat";

const LeadChat = ({
  lead,
  selectedCallLogView,
  setSelectedCallLogView,
}: LeadChatProps) => {
  const displayName = lead?.name || fallbackLeadInfo.name;
  const position = lead?.position || fallbackLeadInfo.position;
  const phoneNumber = lead?.phone;
  const emailAddress = lead?.email;
  const avatarSrc = lead?.pictureUrl;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || "?";
  const leadEmailLower = emailAddress?.toLowerCase() || null;
  const leadId = lead?._id;
  const normalizedLeadPhone = useMemo(
    () => normalizePhoneNumber(phoneNumber),
    [phoneNumber]
  );

  const [smsInput, setSmsInput] = useState("");
  const [smsSendError, setSmsSendError] = useState<string | null>(null);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [whatsappSendError, setWhatsappSendError] = useState<string | null>(
    null
  );
  const [emailInput, setEmailInput] = useState("");
  const [emailSubject, setEmailSubject] = useState<string>(
    DEFAULT_EMAIL_SUBJECT
  );
  const [emailSendError, setEmailSendError] = useState<string | null>(null);
  const [isGeneratingWhatsAppMessage, setIsGeneratingWhatsAppMessage] =
    useState(false);
  const [isGeneratingEmailMessage, setIsGeneratingEmailMessage] =
    useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [openMessageMenu, setOpenMessageMenu] = useState<string | null>(null);
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
  const markedReadCacheRef = useRef<Set<string>>(new Set());

  const scrollToBottom = (ref: RefObject<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  const {
    data: whatsappConnectionsData,
    isLoading: isWhatsAppConnectionLoading,
    isError: isWhatsAppConnectionError,
    error: whatsappConnectionsError,
  } = useQuery({
    queryKey: ["whatsapp-connections"],
    queryFn: whatsappService.getConnections,
    staleTime: 120000,
  });

  const whatsappConnections = whatsappConnectionsData?.credentials || [];
  const primaryWhatsAppConnection = whatsappConnections[0] || null;
  const whatsappReady = whatsappConnections.length > 0;
  const whatsappPhoneNumberId =
    primaryWhatsAppConnection?.phoneNumberId || null;

  const whatsappConnectionErrorMessage = isWhatsAppConnectionError
    ? (whatsappConnectionsError as any)?.response?.data?.message ||
      (whatsappConnectionsError as Error)?.message ||
      "Failed to load WhatsApp connection."
    : null;

  const twilioReady = twilioConnection.ready;
  const twilioStatusLoading = twilioConnection.loading;
  const whatsappStatusLoading = isWhatsAppConnectionLoading;

  const whatsappUnavailableMessage = !phoneNumber
    ? "Add a phone number for this lead to start WhatsApp chats."
    : whatsappConnectionErrorMessage
    ? whatsappConnectionErrorMessage
    : !whatsappReady
    ? "Connect a WhatsApp number in Settings → Integrations."
    : !normalizedLeadPhone
    ? "Lead phone number must include the country code."
    : null;

  const whatsappInputsDisabled =
    whatsappStatusLoading ||
    Boolean(whatsappUnavailableMessage) ||
    !whatsappReady ||
    !normalizedLeadPhone ||
    !whatsappPhoneNumberId;
  const canGenerateWhatsAppMessage = Boolean(lead?.companyId && lead?._id);

  const channelTabs = useMemo(() => {
    const hasPhone = Boolean(phoneNumber);
    const hasEmail = Boolean(emailAddress);

    const whatsappStatus = !hasPhone
      ? "Add phone"
      : isWhatsAppConnectionLoading
      ? "Checking..."
      : whatsappConnectionErrorMessage
      ? "Error"
      : whatsappReady
      ? "Connected"
      : "Not connected";

    const smsStatus = !hasPhone
      ? "Add phone"
      : twilioStatusLoading
      ? "Checking..."
      : twilioReady
      ? "Connected"
      : "Not configured";

    const emailStatus = hasEmail ? "Connected" : "Unavailable";

    const whatsappAvailable =
      hasPhone && (whatsappReady || isWhatsAppConnectionLoading);
    const smsAvailable = hasPhone && (twilioReady || twilioStatusLoading);

    return [
      {
        label: "WhatsApp",
        status: whatsappStatus,
        isAvailable: whatsappAvailable,
      },
      { label: "Email", status: emailStatus, isAvailable: hasEmail },
      { label: "SMS", status: smsStatus, isAvailable: smsAvailable },
      { label: "Call", status: smsStatus, isAvailable: smsAvailable },
    ];
  }, [
    emailAddress,
    phoneNumber,
    isWhatsAppConnectionLoading,
    whatsappConnectionErrorMessage,
    whatsappReady,
    twilioReady,
    twilioStatusLoading,
  ]);

  const firstAvailableTab =
    channelTabs.find((tab) => tab.isAvailable)?.label ||
    channelTabs[0]?.label ||
    "WhatsApp";

  const [activeTab, setActiveTab] = useState<string>(firstAvailableTab);

  useEffect(() => {
    if (!firstAvailableTab) return;
    setActiveTab((prev) =>
      prev === firstAvailableTab ? prev : firstAvailableTab
    );
  }, [firstAvailableTab]);

  useEffect(() => {
    setWhatsappInput("");
    setWhatsappSendError(null);
  }, [lead?._id]);

  useEffect(() => {
    setEmailInput("");
    setEmailSubject(DEFAULT_EMAIL_SUBJECT);
    setEmailSendError(null);
  }, [lead?._id]);

  const whatsappConversationQueryKey = [
    "whatsapp-conversation",
    leadId,
    normalizedLeadPhone,
    whatsappPhoneNumberId,
  ];

  const whatsappConversationEnabled =
    activeTab === "WhatsApp" &&
    Boolean(
      leadId && normalizedLeadPhone && whatsappReady && whatsappPhoneNumberId
    );

  const shouldPollWhatsApp =
    whatsappConversationEnabled && Boolean(whatsappPhoneNumberId);

  const {
    data: whatsappConversationResponse,
    isLoading: isWhatsAppConversationLoading,
    isFetching: isWhatsAppConversationFetching,
    isError: isWhatsAppConversationError,
    error: whatsappConversationError,
    refetch: refetchWhatsAppConversation,
  } = useQuery({
    queryKey: whatsappConversationQueryKey,
    queryFn: () =>
      whatsappService.getConversation({
        contact: normalizedLeadPhone as string,
        phoneNumberId: whatsappPhoneNumberId || undefined,
        limit: 100,
      }),
    enabled: whatsappConversationEnabled,
    refetchOnWindowFocus: shouldPollWhatsApp,
    refetchInterval: shouldPollWhatsApp ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const whatsappMessages =
    (whatsappConversationResponse?.data as WhatsAppChatMessage[]) || [];

  const unreadInboundMessageIds = useMemo(() => {
    if (!whatsappConversationEnabled) return [];
    return whatsappMessages
      .filter(
        (message) =>
          message.direction === "inbound" &&
          message.messageStatus !== "read" &&
          Boolean(message.messageId)
      )
      .map((message) => message.messageId as string);
  }, [whatsappMessages, whatsappConversationEnabled]);

  const isWhatsAppMessagesLoading =
    isWhatsAppConversationLoading ||
    (isWhatsAppConversationFetching && !whatsappConversationResponse);

  const whatsappConversationErrorMessage = isWhatsAppConversationError
    ? (whatsappConversationError as any)?.response?.data?.message ||
      (whatsappConversationError as Error)?.message ||
      "Failed to load WhatsApp conversation."
    : null;

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
            statusData?.hasAllEnvVars
        );
        const missingFields = statusData?.missingFields || [];
        const message = ready
          ? "Twilio calling and SMS are ready."
          : missingFields.length
          ? "Twilio is not fully configured. Please contact your administrator."
          : "Twilio is not configured. Please contact your administrator.";
        if (isMounted) {
          setTwilioConnection({
            loading: false,
            ready,
            message,
            missingFields,
          });
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          "Unable to verify Twilio configuration.";
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

  const emailConversationQueryKey = ["lead-email-conversation", leadEmailLower];

  const emailQueryEnabled = activeTab === "Email" && Boolean(leadEmailLower);

  const shouldPollEmail = emailQueryEnabled;

  const {
    data: emailConversationData,
    isLoading: isEmailConversationLoading,
    isFetching: isEmailConversationFetching,
    isError: isEmailConversationError,
    error: emailConversationError,
  } = useQuery({
    queryKey: emailConversationQueryKey,
    enabled: emailQueryEnabled,
    staleTime: 30_000,
    refetchOnWindowFocus: emailQueryEnabled,
    refetchInterval: shouldPollEmail ? 5000 : false,
    refetchIntervalInBackground: true,
    queryFn: async () => {
      if (!leadEmailLower) {
        return [];
      }

      const threadsResponse = await emailService.getEmailThreads({
        limit: 100,
      });
      const threads = threadsResponse.data?.threads || [];
      const matchingThread = threads.find(
        (thread) =>
          Array.isArray(thread.participants) &&
          thread.participants.some(
            (participant) => participant.email?.toLowerCase() === leadEmailLower
          )
      );

      if (!matchingThread) {
        return [];
      }

      const threadResponse = await emailService.getThread(matchingThread._id);
      const emails = threadResponse.data?.emails || [];
      return [...emails].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },
  });

  const isEmailLoading =
    isEmailConversationLoading ||
    (isEmailConversationFetching && !emailConversationData);
  const emailMessages = emailConversationData || [];
  const emailError = isEmailConversationError
    ? (emailConversationError as any)?.response?.data?.message ||
      (emailConversationError as Error)?.message ||
      "Failed to load email conversation. Please try again later."
    : null;

  const smsQueryEnabled =
    activeTab === "SMS" && Boolean(leadId && phoneNumber) && twilioReady;

  const shouldPollSms = smsQueryEnabled;

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
    enabled: smsQueryEnabled,
    refetchOnWindowFocus: smsQueryEnabled,
    staleTime: 30_000,
    // Periodically poll for new SMS messages while the SMS tab is active
    refetchInterval: shouldPollSms ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const isSmsLoading =
    twilioStatusLoading ||
    isSmsInitialLoading ||
    (isSmsFetching && !leadSmsResponse);

  const smsMessages: LeadSmsMessage[] = leadSmsResponse?.data || [];
  const smsUnavailableMessage =
    !twilioReady && !twilioStatusLoading
      ? twilioConnection.message ||
        "Twilio is not configured. Please contact your administrator."
      : null;
  const smsInputsDisabled = Boolean(smsUnavailableMessage) || !phoneNumber;

  useEffect(() => {
    if (!smsUnavailableMessage && smsSendError) {
      setSmsSendError(null);
    }
  }, [smsUnavailableMessage, smsSendError]);

  useEffect(() => {
    if (!whatsappUnavailableMessage && whatsappSendError) {
      setWhatsappSendError(null);
    }
  }, [whatsappUnavailableMessage, whatsappSendError]);

  const orderedSmsMessages = useMemo(() => {
    return [...smsMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [smsMessages]);

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

  const whatsappMutation = useMutation({
    mutationFn: (payload: { body: string }) =>
      whatsappService.sendTextMessage({
        phoneNumberId: whatsappPhoneNumberId as string,
        to: normalizedLeadPhone as string,
        body: payload.body,
      }),
    onSuccess: () => {
      setWhatsappInput("");
      setWhatsappSendError(null);
      queryClient.invalidateQueries({
        queryKey: whatsappConversationQueryKey,
      });
    },
    onError: (mutationError: any) => {
      const fallbackMessage =
        mutationError?.response?.data?.message ||
        mutationError?.response?.data?.error ||
        mutationError?.message ||
        "Failed to send WhatsApp message";
      setWhatsappSendError(fallbackMessage);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (messageIds: string[]) =>
      whatsappService.markMessagesRead({
        phoneNumberId: whatsappPhoneNumberId as string,
        messageIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: whatsappConversationQueryKey,
      });
    },
    onError: (_error, messageIds) => {
      messageIds.forEach((id) => markedReadCacheRef.current.delete(id));
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: () =>
      whatsappService.deleteConversation({
        contact: normalizedLeadPhone as string,
        phoneNumberId: whatsappPhoneNumberId || undefined,
      }),
    onSuccess: () => {
      markedReadCacheRef.current.clear();
      setShowDeleteConfirm(false);
      queryClient.invalidateQueries({
        queryKey: whatsappConversationQueryKey,
      });
    },
    onError: (mutationError: any) => {
      setWhatsappSendError(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to clear WhatsApp conversation"
      );
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => whatsappService.deleteMessage(messageId),
    onSuccess: () => {
      setMessageToDelete(null);
      queryClient.invalidateQueries({
        queryKey: whatsappConversationQueryKey,
      });
    },
    onError: (mutationError: any) => {
      setWhatsappSendError(
        mutationError?.response?.data?.message ||
          mutationError?.message ||
          "Failed to delete message"
      );
      setMessageToDelete(null);
    },
  });

  const emailMutation = useMutation({
    mutationFn: (payload: { to: string[]; subject: string; text: string }) =>
      emailService.sendEmail(payload),
    onSuccess: () => {
      setEmailInput("");
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailSendError(null);
      queryClient.invalidateQueries({ queryKey: emailConversationQueryKey });
    },
    onError: (mutationError: any) => {
      const fallbackMessage =
        mutationError?.response?.data?.message ||
        mutationError?.response?.data?.error ||
        mutationError?.message ||
        "Failed to send email";
      setEmailSendError(fallbackMessage);
    },
  });

  useEffect(() => {
    if (activeTab === "WhatsApp") {
      scrollToBottom(whatsappScrollRef);
      if (whatsappConversationEnabled) {
        refetchWhatsAppConversation();
      }
    }
  }, [
    activeTab,
    whatsappMessages,
    whatsappConversationEnabled,
    refetchWhatsAppConversation,
  ]);

  useEffect(() => {
    if (activeTab !== "WhatsApp" || !whatsappConversationEnabled) {
      setShowDeleteConfirm(false);
      setOpenMessageMenu(null);
    }
  }, [activeTab, whatsappConversationEnabled]);

  useEffect(() => {
    if (!openMessageMenu) return;
    const handleClickOutside = () => {
      setOpenMessageMenu(null);
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMessageMenu]);

  useEffect(() => {
    if (
      !whatsappConversationEnabled ||
      !whatsappPhoneNumberId ||
      unreadInboundMessageIds.length === 0
    ) {
      return;
    }

    const pending = unreadInboundMessageIds.filter(
      (id) => !markedReadCacheRef.current.has(id)
    );

    if (!pending.length) {
      return;
    }

    pending.forEach((id) => markedReadCacheRef.current.add(id));
    markReadMutation.mutate(pending);
  }, [
    unreadInboundMessageIds,
    whatsappConversationEnabled,
    whatsappPhoneNumberId,
    markReadMutation,
  ]);

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

  const handleSendWhatsappMessage = () => {
    if (
      !leadId ||
      !normalizedLeadPhone ||
      !whatsappPhoneNumberId ||
      !whatsappInput.trim() ||
      whatsappMutation.isPending ||
      whatsappInputsDisabled
    ) {
      if (whatsappInputsDisabled && whatsappUnavailableMessage) {
        setWhatsappSendError(whatsappUnavailableMessage);
      }
      return;
    }

    whatsappMutation.mutate({ body: whatsappInput.trim() });
  };

  const handleGenerateWhatsAppMessage = async () => {
    if (!lead?.companyId || !lead?._id) {
      setWhatsappSendError(
        "Lead information is incomplete for generating suggestions."
      );
      return;
    }

    setIsGeneratingWhatsAppMessage(true);
    setWhatsappSendError(null);
    try {
      const response =
        await connectionMessagesService.generateConnectionMessage({
          companyId: lead.companyId,
          personId: lead._id,
          tone: "friendly",
        });
      const generated =
        response.data?.connectionMessage?.trim() ||
        response.data?.connectionMessage;

      if (generated) {
        setWhatsappInput((prev) =>
          prev ? `${prev}\n\n${generated}` : generated
        );
      } else {
        setWhatsappSendError("No message suggestion was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate a connection message.";
      setWhatsappSendError(friendlyMessage);
    } finally {
      setIsGeneratingWhatsAppMessage(false);
    }
  };

  const handleSendEmail = () => {
    if (
      !leadId ||
      !emailAddress ||
      !emailInput.trim() ||
      emailMutation.isPending
    ) {
      return;
    }
    emailMutation.mutate({
      to: [emailAddress],
      subject: emailSubject?.trim() || DEFAULT_EMAIL_SUBJECT,
      text: emailInput.trim(),
    });
  };

  const handleGenerateEmailMessage = async () => {
    if (!lead?.companyId || !lead?._id) {
      setEmailSendError(
        "Lead information is incomplete for generating suggestions."
      );
      return;
    }

    setIsGeneratingEmailMessage(true);
    setEmailSendError(null);
    try {
      const response = await connectionMessagesService.generateEmailMessage({
        companyId: lead.companyId,
        personId: lead._id,
        tone: "professional",
      });

      const generatedSubject =
        response.data?.email?.subject?.trim() || DEFAULT_EMAIL_SUBJECT;
      const generatedBody =
        response.data?.email?.body?.trim() ||
        response.data?.email?.bodyHtml?.trim();

      if (generatedBody) {
        setEmailInput(generatedBody);
        setEmailSubject(generatedSubject);
      } else {
        setEmailSendError("No message suggestion was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate a connection message.";
      setEmailSendError(friendlyMessage);
    } finally {
      setIsGeneratingEmailMessage(false);
    }
  };

  const handleDeleteWhatsAppConversation = () => {
    if (
      deleteConversationMutation.isPending ||
      !whatsappConversationEnabled ||
      !normalizedLeadPhone
    ) {
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWhatsAppConversation = () => {
    if (
      deleteConversationMutation.isPending ||
      !whatsappConversationEnabled ||
      !normalizedLeadPhone
    ) {
      return;
    }
    deleteConversationMutation.mutate();
  };

  const cancelDeleteWhatsAppConversation = () => {
    if (deleteConversationMutation.isPending) {
      return;
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setOpenMessageMenu(null);
  };

  const confirmDeleteMessage = () => {
    if (messageToDelete) {
      deleteMessageMutation.mutate(messageToDelete);
    }
  };

  const cancelDeleteMessage = () => {
    setMessageToDelete(null);
  };

  const getWhatsAppMessageText = (message: WhatsAppChatMessage) => {
    if (message.textBody) {
      return message.textBody;
    }
    if (message.templateName) {
      return `Template: ${message.templateName}`;
    }
    if (message.mediaType) {
      return `${message.mediaType} attachment`;
    }
    if (message.interactive) {
      return "Interactive message";
    }
    if (message.errorMessage) {
      return `Error: ${message.errorMessage}`;
    }
    return "";
  };

  const stripQuotedEmailContent = (content: string) => {
    if (!content) {
      return "";
    }

    const normalized = content.replace(/\r\n/g, "\n");
    const quoteRegexes = [
      /\nOn\s[\w\s,.:@]+\sat\s[\d:]+\s?[APM]+\s.+?\s?wrote:\s*/i,
      /\nOn\s.+?\swrote:\s*/i,
      /\nFrom:\s.+/i,
      /\nSent:\s.+/i,
      /\nSubject:\s.+/i,
      /\nTo:\s.+/i,
      /\nDate:\s.+/i,
      /\n-{2,}\s*Original Message\s*-{2,}/i,
      /\n-{2,}\s*Forwarded message\s*-{2,}/i,
    ];

    let cutoffIndex = normalized.length;
    for (const regex of quoteRegexes) {
      const matchIndex = normalized.search(regex);
      if (matchIndex !== -1 && matchIndex < cutoffIndex) {
        cutoffIndex = matchIndex;
      }
    }

    const withoutMarkers = normalized.slice(0, cutoffIndex);
    const withoutQuotedLines = withoutMarkers
      .split("\n")
      .filter(
        (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
      )
      .join("\n")
      .trim();

    if (withoutQuotedLines) {
      return withoutQuotedLines;
    }

    const fallback = normalized
      .split("\n")
      .filter(
        (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
      )
      .join("\n")
      .trim();

    return fallback || content.trim();
  };

  const getEmailBodyText = (email: Email) => {
    if (email.body?.text?.trim()) {
      return stripQuotedEmailContent(email.body.text.trim());
    }
    if (email.body?.html) {
      const stripped = email.body.html.replace(/<[^>]+>/g, " ");
      return stripQuotedEmailContent(stripped.replace(/\s+/g, " ").trim());
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
    window.location.href = `${import.meta.env.VITE_APP_API_URL}/emails/compose`;
  };

  return (
    <section
      className="flex flex-col font-poppins items-center justify-center lg:p-7 p-6 max-w-full rounded-3xl"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        border: "1px solid #FFFFFF0D",
      }}
    >
      {/* Header Tabs */}
      <div className="w-full mb-6">
        <div className="flex w-full items-center gap-3 sm:gap-4">
          {channelTabs.map((tab) => {
            const isActive = activeTab === tab.label;

            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(tab.label)}
                className="relative pb-2 text-left"
              >
                <span
                  className={`text-xs font-medium sm:text-sm transition-colors ${
                    isActive ? "text-white font-semibold" : "text-white/50"
                  }`}
                >
                  {tab.label}
                </span>
                <span
                  className={`block text-[9px] transition-colors ${
                    isActive ? "text-white" : "text-white/50"
                  }`}
                >
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
      <div className="flex w-full flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${displayName} avatar`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#3d4f51] text-white text-base sm:text-lg">
                {avatarLetter}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-bold sm:text-base text-white">
              {displayName}
            </p>
            <p className="text-xs font-normal text-white/60">{position}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-normal text-white/70 sm:ml-auto">
          <div className="flex items-center gap-1.5">
            <span>{headerContactValue || "\u00A0"}</span>
            <ChevronDown className="h-2.5 w-2.5" />
          </div>
          {activeTab === "WhatsApp" && whatsappConversationEnabled && (
            <div className="flex items-center gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs text-white/80">
                  <span>Clear chat?</span>
                  <button
                    type="button"
                    onClick={confirmDeleteWhatsAppConversation}
                    className="rounded-full bg-red-500/70 px-2 py-0.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    disabled={deleteConversationMutation.isPending}
                  >
                    {deleteConversationMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Yes"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelDeleteWhatsAppConversation}
                    className="rounded-full border border-white/40 px-2 py-0.5 transition hover:bg-white/10 disabled:opacity-50"
                    disabled={deleteConversationMutation.isPending}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteWhatsAppConversation}
                  className="flex items-center gap-1 rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-wide text-white/80 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={deleteConversationMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="h-px w-full bg-white/30 mb-6" />
      {/* Content */}
      <div className="flex flex-col w-full">
        {activeTab === "WhatsApp" ? (
          <div className="flex flex-1 flex-col">
            {whatsappStatusLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p>Checking WhatsApp connection...</p>
              </div>
            ) : whatsappUnavailableMessage ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                {whatsappUnavailableMessage}
              </div>
            ) : isWhatsAppMessagesLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-white/70">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <p>Loading WhatsApp conversation...</p>
              </div>
            ) : whatsappConversationErrorMessage ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-red-300">
                {whatsappConversationErrorMessage}
              </div>
            ) : whatsappMessages.length === 0 ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                No WhatsApp conversation with this lead yet.
              </div>
            ) : (
              <div
                ref={whatsappScrollRef}
                className="flex flex-col overflow-y-auto scrollbar-hide mb-6 gap-4 h-[calc(100vh-350px)] lg:h-[calc(100vh-550px)]"
              >
                {whatsappMessages.map((message) => {
                  const isOutbound = message.direction === "outbound";
                  const canDelete = isOutbound;
                  const showMenu = openMessageMenu === message._id;
                  const statusDisplay = isOutbound
                    ? getSmsStatusDisplay(message.messageStatus)
                    : null;
                  const renderedText = getWhatsAppMessageText(message);
                  const timestamp =
                    message.sentAt ||
                    message.createdAt ||
                    new Date().toISOString();

                  return (
                    <div
                      key={message._id || message.messageId || timestamp}
                      className={`group relative flex w-full gap-3 ${
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
                          className={`relative w-full rounded-2xl px-4 py-3 ${
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
                          {canDelete && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMessageMenu(
                                    showMenu ? null : message._id
                                  );
                                }}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 opacity-0 transition-opacity hover:bg-white/30 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-3.5 w-3.5 text-white" />
                              </button>
                              {showMenu && (
                                <div
                                  className="absolute -right-2 top-6 z-10 rounded-lg border border-white/20 bg-[#1a1a1a] shadow-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMessage(message._id)
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-300 transition hover:bg-white/10 rounded-lg"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                            <span className="font-semibold text-white">
                              {isOutbound ? "You" : displayName}
                            </span>
                            <span className="text-white/60">
                              {formatEmailTimestamp(timestamp)}
                            </span>
                          </div>

                          {renderedText && (
                            <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                              {renderedText}
                            </p>
                          )}
                          {message.mediaUrl && (
                            <a
                              href={message.mediaUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex text-xs underline text-white/80"
                            >
                              View {message.mediaType || "media"}
                            </a>
                          )}
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

            {messageToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-[#1a1a1a] border border-white/20 p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Delete Message
                  </h3>
                  <p className="text-sm text-white/70 mb-6">
                    Are you sure you want to delete this message? This action
                    cannot be undone.
                  </p>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={cancelDeleteMessage}
                      disabled={deleteMessageMutation.isPending}
                      className="rounded-lg border border-white/30 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteMessage}
                      disabled={deleteMessageMutation.isPending}
                      className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {deleteMessageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-3">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleGenerateWhatsAppMessage}
                disabled={
                  isGeneratingWhatsAppMessage || !canGenerateWhatsAppMessage
                }
                title={
                  !canGenerateWhatsAppMessage
                    ? "Lead information is required to generate suggestions"
                    : undefined
                }
              >
                {isGeneratingWhatsAppMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Plus size={14} className="text-white" />
                )}
              </button>
              <input
                type="text"
                value={whatsappInput}
                onChange={(event) => setWhatsappInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSendWhatsappMessage();
                  }
                }}
                disabled={whatsappInputsDisabled}
                className="flex-1 bg-transparent outline-none border-none text-sm text-white placeholder:text-white/50 disabled:opacity-50"
                placeholder={
                  whatsappUnavailableMessage
                    ? whatsappUnavailableMessage
                    : "Type WhatsApp message"
                }
              />
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={handleSendWhatsappMessage}
                disabled={
                  whatsappInputsDisabled ||
                  !whatsappInput.trim() ||
                  whatsappMutation.isPending
                }
              >
                {whatsappMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Send size={14} className="text-white" />
                )}
              </button>
            </div>
            {whatsappSendError && (
              <p className="mt-2 text-xs text-red-300">{whatsappSendError}</p>
            )}
          </div>
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
            <div className="flex flex-col gap-3 mt-[1px]">
              <div className="flex flex-col gap-1 rounded-full bg-white/10 px-3 sm:flex-row sm:items-center sm:flex-nowrap sm:gap-2">
                <textarea
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.ctrlKey) {
                      event.preventDefault();
                      handleSendEmail();
                    }
                  }}
                  disabled={!emailAddress}
                  className="flex-1 w-full bg-transparent outline-none border-none text-sm text-white placeholder:text-white/50 resize-none h-[45px] py-3"
                  placeholder={
                    !emailAddress
                      ? "Add an email address to send emails"
                      : "Write your email message (Ctrl+Enter to send)"
                  }
                  rows={1}
                />
                <button
                  className="flex h-8 w-full sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  onClick={handleSendEmail}
                  disabled={
                    !emailAddress ||
                    !emailInput.trim() ||
                    emailMutation.isPending
                  }
                >
                  {emailMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin text-white" />
                  ) : (
                    <Send size={12} className="text-white" />
                  )}
                </button>
                <button
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4E8ED1] via-[#3E65B4] to-[#1F2937] px-3 py-1 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(62,101,180,0.35)] ring-1 ring-white/20 transition-all w-full sm:w-auto sm:ml-auto disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  onClick={handleGenerateEmailMessage}
                  disabled={
                    isGeneratingEmailMessage || !lead?.companyId || !lead?._id
                  }
                  title={
                    !lead?.companyId || !lead?._id
                      ? "Lead information is required to generate suggestions"
                      : "Generate AI email suggestion"
                  }
                >
                  {isGeneratingEmailMessage ? (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      </span>
                      <span className="hidden sm:inline">Generating…</span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                        <Sparkles size={10} className="text-white" />
                      </span>
                      <span className="hidden sm:inline">AI</span>
                    </>
                  )}
                </button>
              </div>
              {emailSendError && (
                <p className="text-xs text-red-300">{emailSendError}</p>
              )}
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
            selectedCallLogView={selectedCallLogView}
            setSelectedCallLogView={setSelectedCallLogView}
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
