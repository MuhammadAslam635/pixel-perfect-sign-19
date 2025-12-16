import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Button } from "@/components/ui/button";
import { Lead } from "@/services/leads.service";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import { twilioService, LeadSmsMessage } from "@/services/twilio.service";
import API from "@/utils/api";
import { CallView } from "./CallView";
import MeetingBotTab from "./MeetingBotTab";
import {
  whatsappService,
  WhatsAppMessage as WhatsAppChatMessage,
} from "@/services/whatsapp.service";
import { connectionMessagesService } from "@/services/connectionMessages.service";
import { SelectedCallLogView } from "../index";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";

type LeadChatProps = {
  lead?: Lead;
  selectedCallLogView: SelectedCallLogView;

  setSelectedCallLogView: (view: SelectedCallLogView) => void;
  initialTab?: string;
  autoStartCall?: boolean;
  onMessageUpdate?: () => void;
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
const EMPTY_ARRAY = [] as const;

const LeadChat = ({
  lead,
  selectedCallLogView,
  setSelectedCallLogView,
  initialTab,
  autoStartCall = false,
  onMessageUpdate,
}: LeadChatProps) => {
  const displayName = lead?.name || fallbackLeadInfo.name;
  const position = lead?.position || fallbackLeadInfo.position;
  const phoneNumber = lead?.phone;
  const whatsappNumber = lead?.whatsapp;
  const emailAddress = lead?.email;
  const avatarSrc = lead?.pictureUrl;
  const avatarLetter = displayName?.charAt(0).toUpperCase() || "?";
  const leadEmailLower = emailAddress?.toLowerCase() || null;
  const leadId = lead?._id;
  const normalizedLeadPhone = useMemo(
    () => normalizePhoneNumber(phoneNumber),
    [phoneNumber]
  );
  const normalizedLeadWhatsapp = useMemo(
    () => normalizePhoneNumber(whatsappNumber),
    [whatsappNumber]
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
  const [isGeneratingSmsMessage, setIsGeneratingSmsMessage] = useState(false);
  const [isEmailEditorExpanded, setIsEmailEditorExpanded] = useState(false);
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

  // Refs for auto-expanding textareas
  const whatsappTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);
  const smsTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emailComposerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (ref: RefObject<HTMLDivElement>) => {
    const container = ref.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  // Auto-resize textarea to fit content (max 3 lines)
  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;

    // Reset height to calculate new height
    textarea.style.height = "auto";

    // Calculate max height for 3 lines (approximately 20px per line + padding)
    const lineHeight = 20;
    const maxLines = 3;
    const maxHeight = lineHeight * maxLines;

    // Set height based on content, capped at max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
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

  const whatsappConnections = whatsappConnectionsData?.credentials || EMPTY_ARRAY;
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

  const whatsappUnavailableMessage = !whatsappNumber
    ? "Add a WhatsApp number for this lead to start WhatsApp chats."
    : whatsappConnectionErrorMessage
    ? whatsappConnectionErrorMessage
    : !whatsappReady
    ? "Connect a WhatsApp number in Settings → Integrations."
    : !normalizedLeadWhatsapp
    ? "Lead WhatsApp number must include the country code."
    : null;

  const whatsappInputsDisabled =
    whatsappStatusLoading ||
    Boolean(whatsappUnavailableMessage) ||
    !whatsappReady ||
    !normalizedLeadWhatsapp ||
    !whatsappPhoneNumberId;
  const canGenerateWhatsAppMessage = Boolean(lead?.companyId && lead?._id);

  const channelTabs = useMemo(() => {
    const hasPhone = Boolean(phoneNumber);
    const hasWhatsapp = Boolean(whatsappNumber);
    const hasEmail = Boolean(emailAddress);

    const whatsappStatus = !hasWhatsapp
      ? "Add WhatsApp number"
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
      hasWhatsapp && (whatsappReady || isWhatsAppConnectionLoading);
    const smsAvailable = hasPhone && (twilioReady || twilioStatusLoading);
    const aiCallAvailable = hasPhone;
    const meetingBotAvailable = true; // Always available as it depends on meetings, not phone/email

    return [
      {
        label: "WhatsApp",
        status: whatsappStatus,
        isAvailable: whatsappAvailable,
      },
      { label: "Email", status: emailStatus, isAvailable: hasEmail },
      { label: "SMS", status: smsStatus, isAvailable: smsAvailable },
      { label: "Call", status: smsStatus, isAvailable: smsAvailable },
      {
        label: "AI Call",
        status: aiCallAvailable ? "Ready" : "Add phone",
        isAvailable: aiCallAvailable,
      },
      {
        label: "Meeting Bot",
        status: "Ready",
        isAvailable: meetingBotAvailable,
      },
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

  // Determine the preferred initial tab (e.g. force "Call" when coming from Companies -> Call Now)
  const preferredInitialTab = useMemo(() => {
    if (initialTab) {
      const matching = channelTabs.find(
        (tab) => tab.label.toLowerCase() === initialTab.toLowerCase()
      );
      if (matching && matching.isAvailable) {
        return matching.label;
      }
    }
    return firstAvailableTab;
  }, [initialTab, channelTabs, firstAvailableTab]);

  const [activeTab, setActiveTab] = useState<string>(preferredInitialTab);

  useEffect(() => {
    if (!preferredInitialTab) return;
    setActiveTab((prev) =>
      prev === preferredInitialTab ? prev : preferredInitialTab
    );
  }, [preferredInitialTab]);

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
    normalizedLeadWhatsapp,
    whatsappPhoneNumberId,
  ];

  const whatsappConversationEnabled =
    activeTab === "WhatsApp" &&
    Boolean(
      leadId && normalizedLeadWhatsapp && whatsappReady && whatsappPhoneNumberId
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
        contact: normalizedLeadWhatsapp as string,
        phoneNumberId: whatsappPhoneNumberId || undefined,
        limit: 100,
      }),
    enabled: whatsappConversationEnabled,
    refetchOnWindowFocus: shouldPollWhatsApp,
    refetchInterval: shouldPollWhatsApp ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const whatsappMessages =
    (whatsappConversationResponse?.data as WhatsAppChatMessage[]) || EMPTY_ARRAY;

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

  const emailConversationQueryKey = ["lead-email-conversation", leadId];

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
      if (!leadId) {
        console.log('📧 [LeadChat] No lead ID provided');
        return [];
      }

      console.log(`📧 [LeadChat] Fetching emails for lead: ${leadId}`);
      
      try {
        const response = await emailService.getLeadEmails(leadId, {
          limit: 100,
        });
        
        const emails = response.data.emails || [];
        console.log(`📧 [LeadChat] Found ${emails.length} emails linked to lead`);

        // Sort chronologically
        return emails.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } catch (error) {
        console.error("Failed to fetch lead emails:", error);
        return [];
      }
    },
  });

  const isEmailLoading =
    isEmailConversationLoading ||
    (isEmailConversationFetching && !emailConversationData);
  const emailMessages = emailConversationData || EMPTY_ARRAY;
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

  const smsMessages: LeadSmsMessage[] = leadSmsResponse?.data || (EMPTY_ARRAY as unknown as LeadSmsMessage[]);
  const smsUnavailableMessage =
    !twilioReady && !twilioStatusLoading
      ? twilioConnection.message ||
        "Twilio is not configured. Please contact your administrator."
      : null;
  const smsInputsDisabled = Boolean(smsUnavailableMessage) || !phoneNumber;



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

  // Notify parent component when messages update (to refresh lead stage)
  useEffect(() => {
    if (onMessageUpdate) {
      onMessageUpdate();
    }
  }, [whatsappMessages, emailMessages, smsMessages, onMessageUpdate]);

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
      toast.error(fallbackMessage);
    },
  });

  const whatsappMutation = useMutation({
    mutationFn: (payload: { body: string }) =>
      whatsappService.sendTextMessage({
        phoneNumberId: whatsappPhoneNumberId as string,
        to: normalizedLeadWhatsapp as string,
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
        contact: normalizedLeadWhatsapp as string,
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
      !normalizedLeadWhatsapp ||
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
    setIsEmailEditorExpanded(true); // Expand editor when generating
    setEmailSendError(null);
    try {
      const response = await connectionMessagesService.generateEmailMessage({
        companyId: lead.companyId,
        personId: lead._id,
        tone: "professional",
      });

      const generatedSubject =
        response.data?.email?.subject?.trim() || DEFAULT_EMAIL_SUBJECT;

      // Prefer HTML body, fallback to plain text converted to HTML
      let generatedBody = response.data?.email?.bodyHtml?.trim();

      if (!generatedBody && response.data?.email?.body?.trim()) {
        // Convert plain text to HTML paragraphs
        const plainText = response.data.email.body.trim();
        generatedBody = plainText
          .split("\n\n")
          .map((paragraph) => paragraph.trim())
          .filter((paragraph) => paragraph.length > 0)
          .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
          .join("");
      }

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

  const handleGenerateSmsMessage = async () => {
    if (!lead?.companyId || !lead?._id) {
      setSmsSendError(
        "Lead information is incomplete for generating suggestions."
      );
      return;
    }

    setIsGeneratingSmsMessage(true);
    setSmsSendError(null);
    try {
      const response =
        await connectionMessagesService.generateConnectionMessage({
          companyId: lead.companyId,
          personId: lead._id,
          tone: "neutral",
        });
      const generated =
        response.data?.connectionMessage?.trim() ||
        response.data?.connectionMessage;

      if (generated) {
        setSmsInput((prev) => (prev ? `${prev}\n\n${generated}` : generated));
      } else {
        setSmsSendError("No message suggestion was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate a connection message.";
      setSmsSendError(friendlyMessage);
    } finally {
      setIsGeneratingSmsMessage(false);
    }
  };

  const handleDeleteWhatsAppConversation = () => {
    if (
      deleteConversationMutation.isPending ||
      !whatsappConversationEnabled ||
      !normalizedLeadWhatsapp
    ) {
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteWhatsAppConversation = () => {
    if (
      deleteConversationMutation.isPending ||
      !whatsappConversationEnabled ||
      !normalizedLeadWhatsapp
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
    // Check if text field contains HTML
    if (email.body?.text?.trim()) {
      const textContent = email.body.text.trim();
      // If text contains HTML tags, strip them
      if (/<[^>]+>/.test(textContent)) {
        // Replace closing p tags with double newlines to preserve paragraphs
        let stripped = textContent.replace(/<\/p>/gi, "\n\n");
        // Replace br tags with newlines
        stripped = stripped.replace(/<br\s*\/?>/gi, "\n");
        // Remove all other HTML tags
        stripped = stripped.replace(/<[^>]+>/g, "");
        // Clean up excessive whitespace but preserve newlines
        stripped = stripped.replace(/ +/g, " ").trim();
        return stripQuotedEmailContent(stripped);
      }
      // Otherwise, return as plain text
      return stripQuotedEmailContent(textContent);
    }
    // Fallback to html field
    if (email.body?.html) {
      // Replace closing p tags with double newlines to preserve paragraphs
      let stripped = email.body.html.replace(/<\/p>/gi, "\n\n");
      // Replace br tags with newlines
      stripped = stripped.replace(/<br\s*\/?>/gi, "\n");
      // Remove all other HTML tags
      stripped = stripped.replace(/<[^>]+>/g, "");
      // Clean up excessive whitespace but preserve newlines
      stripped = stripped.replace(/ +/g, " ").trim();
      return stripQuotedEmailContent(stripped);
    }
    return "";
  };

  // Get email body as HTML (preserving formatting like bold, italic, etc.)
  const getEmailBodyHtml = (email: Email) => {
    // Check if text field contains HTML
    if (email.body?.text?.trim()) {
      const textContent = email.body.text.trim();
      // If text contains HTML tags, sanitize and return HTML
      if (/<[^>]+>/.test(textContent)) {
        // Remove dangerous tags but keep formatting tags
        let sanitized = textContent;
        // Remove script tags and their content
        sanitized = sanitized.replace(
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          ""
        );
        // Remove style tags and their content
        sanitized = sanitized.replace(
          /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
          ""
        );
        // Remove event handlers
        sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
        sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, "");
        return sanitized;
      }
      // Otherwise, return as plain text wrapped in paragraph
      return `<p>${stripQuotedEmailContent(textContent).replace(
        /\n/g,
        "<br>"
      )}</p>`;
    }
    // Fallback to html field
    if (email.body?.html) {
      let sanitized = email.body.html;
      // Remove script tags and their content
      sanitized = sanitized.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        ""
      );
      // Remove style tags and their content
      sanitized = sanitized.replace(
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        ""
      );
      // Remove event handlers
      sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "");
      sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, "");
      return sanitized;
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
    activeTab === "Email"
      ? emailAddress || ""
      : activeTab === "WhatsApp"
      ? whatsappNumber || ""
      : phoneNumber || "";

  // Auto-resize textareas when content changes
  useEffect(() => {
    autoResizeTextarea(whatsappTextareaRef.current);
  }, [whatsappInput]);

  useEffect(() => {
    autoResizeTextarea(emailTextareaRef.current);
  }, [emailInput]);

  useEffect(() => {
    autoResizeTextarea(smsTextareaRef.current);
  }, [smsInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emailComposerRef.current &&
        !emailComposerRef.current.contains(event.target as Node)
      ) {
        if (isEmailEditorExpanded) {
          setIsEmailEditorExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmailEditorExpanded]);

  const handleComposeEmail = () => {
    window.location.href = `${import.meta.env.VITE_APP_API_URL}/emails/compose`;
  };

  return (
    <section
      className="flex flex-col font-poppins h-[calc(100vh-200px)] lg:p-7 p-6 max-w-full rounded-3xl"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        border: "1px solid #FFFFFF0D",
      }}
    >
      {/* Header Tabs */}
      <div className="w-full mb-3">
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
                {/* <span
                  className={`block text-[9px] transition-colors ${
                    isActive ? "text-white" : "text-white/50"
                  }`}
                >
                  {tab.status}
                </span> */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lead Info */}
      {/* <div className="flex w-full flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`${displayName} avatar`}
                className="h-full w-ful rounded-full object-cover"
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
      </div> */}
      <div className="h-px w-full bg-white/30 mb-3" />
      {/* Content */}
      <div className="flex flex-col w-full flex-1 min-h-0 px-1">
        {activeTab === "WhatsApp" ? (
          <div className="flex flex-1 flex-col min-h-0 relative">
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
                className="flex flex-col overflow-y-auto scrollbar-hide gap-2 flex-1 min-h-0 pb-16"
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
                          className={`w-full rounded-2xl px-3 py-2 ${
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
                            <p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed">
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
                  <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">
                    Delete Message
                  </h3>
                  <p className="text-xs text-white/70 mb-6">
                    Are you sure you want to delete this message? This action
                    cannot be undone.
                  </p>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={cancelDeleteMessage}
                      disabled={deleteMessageMutation.isPending}
                      className="rounded-lg border border-white/30 px-4 py-2 text-xs text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteMessage}
                      disabled={deleteMessageMutation.isPending}
                      className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
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

            {/* Fixed input at bottom */}
            <div className="sticky bottom-0 left-0 right-0 pt-4">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 mx-1 mb-1">
                <textarea
                  ref={whatsappTextareaRef}
                  value={whatsappInput}
                  onChange={(event) => setWhatsappInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendWhatsappMessage();
                    }
                  }}
                  onFocus={() => {
                    // Auto-expand on focus if content is longer than 1 line
                    if (whatsappTextareaRef.current) {
                      autoResizeTextarea(whatsappTextareaRef.current);
                    }
                  }}
                  onBlur={() => {
                    // Shrink back to 1 line when clicking outside
                    if (whatsappTextareaRef.current) {
                      whatsappTextareaRef.current.style.height = '24px';
                    }
                  }}
                  disabled={whatsappInputsDisabled}
                  className="lead-chat-input flex-1 bg-transparent outline-none border-none text-xs text-white disabled:opacity-50 resize-none overflow-y-auto scrollbar-hide leading-5"
                  placeholder={
                    whatsappUnavailableMessage
                      ? whatsappUnavailableMessage
                      : "Type WhatsApp message"
                  }
                  rows={1}
                  style={{ minHeight: "24px", maxHeight: "60px", paddingTop: "2px", paddingBottom: "2px" }}
                />
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleGenerateWhatsAppMessage}
                  disabled={
                    isGeneratingWhatsAppMessage ||
                    !lead?.companyId ||
                    !lead?._id
                  }
                  title={
                    !lead?.companyId || !lead?._id
                      ? "Lead information is required to generate suggestions"
                      : "Generate with AI"
                  }
                >
                  {isGeneratingWhatsAppMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </button>
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
                <p className="mt-2 text-xs text-red-300 mx-1 mb-1">
                  {whatsappSendError}
                </p>
              )}
            </div>
          </div>
        ) : activeTab === "Email" ? (
          <div className="flex flex-1 flex-col min-h-0 relative">
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
                className="flex flex-col overflow-y-auto scrollbar-hide gap-2 flex-1 min-h-0 pb-20"
              >
                {emailMessages.map((email) => {
                  const isOutbound = email.direction === "outbound";
                  const authorName = isOutbound
                    ? "You"
                    : email.from?.name || email.from?.email || displayName;
                  const emailBodyHtml = getEmailBodyHtml(email);

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
                          className={`w-full rounded-2xl px-3 py-2 ${
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
                          <p className="text-xs font-semibold mt-1">
                            {email.subject || "No subject"}
                          </p>
                          {emailBodyHtml && (
                            <div
                              className="text-xs mt-1 leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
                              dangerouslySetInnerHTML={{
                                __html: emailBodyHtml,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fixed input at bottom */}
            <div
              className="sticky bottom-0 left-0 right-0 pt-4"
              ref={emailComposerRef}
            >
              <div
                className={`flex gap-2 bg-white/10 px-4 py-3 mx-1 mb-1 transition-all duration-200 ${
                  isEmailEditorExpanded
                    ? "rounded-2xl items-end"
                    : "rounded-2xl items-center"
                }`}
              >
                {/* Rich Text Editor */}
                <div className="flex-1 relative">
                  <RichTextEditor
                    value={emailInput}
                    onChange={setEmailInput}
                    placeholder={
                      !emailAddress
                        ? "Add an email address to send emails"
                        : "Write your email message..."
                    }
                    height={isEmailEditorExpanded ? "80px" : "20px"}
                    toolbar={true}
                    onFocus={() => setIsEmailEditorExpanded(true)}
                    className={`text-xs w-full transition-all duration-200 ${
                      !isEmailEditorExpanded
                        ? "[&_.ql-toolbar]:hidden [&_.ql-container]:border-none [&_.ql-editor]:!p-0 [&_.ql-editor]:!min-h-0 [&_.ql-editor]:!pb-0"
                        : ""
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 relative z-10">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                    onClick={handleGenerateEmailMessage}
                    disabled={
                      isGeneratingEmailMessage || !lead?.companyId || !lead?._id
                    }
                    title={
                      !lead?.companyId || !lead?._id
                        ? "Lead information is required to generate suggestions"
                        : "Generate with AI"
                    }
                  >
                    {isGeneratingEmailMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-white" />
                    )}
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                    onClick={handleSendEmail}
                    disabled={
                      !emailAddress ||
                      !emailInput.trim() ||
                      emailMutation.isPending
                    }
                  >
                    {emailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <Send size={14} className="text-white" />
                    )}
                  </button>
                </div>
              </div>
              {emailSendError && (
                <p className="mt-2 text-xs text-red-300 mx-1 mb-1">
                  {emailSendError}
                </p>
              )}
            </div>
          </div>
        ) : activeTab === "SMS" ? (
          <div className="flex flex-1 flex-col min-h-0 relative">
            {!phoneNumber ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white placeholder:text-white/50">
                Add a phone number for this lead to start SMS conversations.
              </div>
            ) : smsUnavailableMessage ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/50">
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
                className="flex flex-col overflow-y-auto scrollbar-hide gap-2 flex-1 min-h-0 pb-16"
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
                          className={`w-full rounded-2xl px-3 py-2 ${
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
                          <p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed">
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

            {/* Fixed input at bottom */}
            <div className="sticky bottom-0 left-0 right-0 pt-4">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-3 mx-1 mb-1">
                <textarea
                  ref={smsTextareaRef}
                  value={smsInput}
                  onChange={(event) => setSmsInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendSms();
                    }
                  }}
                  onFocus={() => {
                    // Auto-expand on focus if content is longer than 1 line
                    if (smsTextareaRef.current) {
                      autoResizeTextarea(smsTextareaRef.current);
                    }
                  }}
                  onBlur={() => {
                    // Shrink back to 1 line when clicking outside
                    if (smsTextareaRef.current) {
                      smsTextareaRef.current.style.height = '24px';
                    }
                  }}
                  disabled={smsInputsDisabled}
                  className="lead-chat-input flex-1 bg-transparent outline-none border-none text-xs text-white disabled:opacity-50 resize-none overflow-y-auto scrollbar-hide leading-5"
                  placeholder={
                    smsUnavailableMessage
                      ? smsUnavailableMessage
                      : phoneNumber
                      ? "Type SMS message"
                      : "Add a phone number to send SMS"
                  }
                  rows={1}
                  style={{ minHeight: "24px", maxHeight: "60px", paddingTop: "2px", paddingBottom: "2px" }}
                />
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleGenerateSmsMessage}
                  disabled={
                    isGeneratingSmsMessage || !lead?.companyId || !lead?._id
                  }
                  title={
                    !lead?.companyId || !lead?._id
                      ? "Lead information is required to generate suggestions"
                      : "Generate with AI"
                  }
                >
                  {isGeneratingSmsMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-white" />
                  )}
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handleSendSms}
                  disabled={
                    smsInputsDisabled ||
                    !smsInput.trim() ||
                    smsMutation.isPending
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
                <p className="mt-2 text-xs text-red-300 mx-1 mb-1">
                  {smsSendError}
                </p>
              )}
            </div>
          </div>
        ) : activeTab === "Call" ? (
          <div className="flex w-full flex-1 min-h-0 flex-col items-center text-xs sm:text-sm font-medium text-white/70">
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
              autoStart={autoStartCall}
              selectedCallLogView={selectedCallLogView}
              setSelectedCallLogView={setSelectedCallLogView}
            />
          </div>
        ) : activeTab === "AI Call" ? (
          <div className="flex w-full flex-1 min-h-0 flex-col items-center text-xs sm:text-sm font-medium text-white/70">
            <CallView
              lead={lead}
              twilioReady={twilioReady}
              twilioStatusMessage={
                twilioStatusLoading
                  ? "Checking AI calling availability..."
                  : twilioConnection.message ||
                    "Company Twilio credentials aren't added yet."
              }
              twilioStatusLoading={twilioStatusLoading}
              autoStart={false}
              selectedCallLogView={selectedCallLogView}
              setSelectedCallLogView={setSelectedCallLogView}
              mode="ai"
            />
          </div>
        ) : activeTab === "Meeting Bot" ? (
          <div className="flex w-full flex-1 min-h-0 flex-col text-xs sm:text-sm font-medium text-white/70">
            <MeetingBotTab lead={lead} />
          </div>
        ) : (
          <div className="flex w-full flex-1 items-center justify-center py-20 text-xs sm:text-sm font-medium text-white/70">
            In work
          </div>
        )}
      </div>
    </section>
  );
};

export default LeadChat;
