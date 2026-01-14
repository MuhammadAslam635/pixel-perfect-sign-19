import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Loader2,
  MoreVertical,
  Send,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Download,
  MessageCircle,
  MapPin,
  X,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { IoLogoWhatsapp, IoLocationSharp } from "react-icons/io5";
import jsPDF from "jspdf";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Button } from "@/components/ui/button";
import { Lead, leadsService } from "@/services/leads.service";
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
import ReactMarkdown from "react-markdown";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { proposalService, Proposal } from "@/services/proposal.service";
import { proposalExampleService } from "@/services/proposalExample.service";
import { useProposalExamplesData } from "@/pages/companyKnowledgeBase/hooks";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Import Tamimi logos
import tamimiLogoLight from "@/assets/tamimi-logo-light.png";
import tamimiLogoDark from "@/assets/tamimi-logo-dark.png";

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

const getSenderName = (userId: any) => {
  if (!userId) return "Team Member";
  if (typeof userId === "string") return "Team Member";
  if (userId.firstName && userId.lastName)
    return `${userId.firstName} ${userId.lastName}`;
  if (userId.name) return userId.name;
  return "Team Member";
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
  const [proposalContent, setProposalContent] = useState<string>("");
  const [proposalHtmlContent, setProposalHtmlContent] = useState<string>("");
  const [selectedExampleId, setSelectedExampleId] = useState<string>("");
  const [openExampleSelector, setOpenExampleSelector] = useState(false);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [proposalCopied, setProposalCopied] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isProposalEditable, setIsProposalEditable] = useState(false);
  const [selectedText, setSelectedText] = useState<string>("");
  const [lockedSelectedText, setLockedSelectedText] = useState<string>(""); // Locked version for modal
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showEditWithAI, setShowEditWithAI] = useState(false);
  const [editWithAIPosition, setEditWithAIPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showEditAIModal, setShowEditAIModal] = useState(false);
  const [editAIQuery, setEditAIQuery] = useState<string>("");
  const [isEditingWithAI, setIsEditingWithAI] = useState(false);
  const proposalContentRef = useRef<HTMLDivElement>(null);

  // Proposal list view states
  const [showProposalList, setShowProposalList] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );

  // Email Edit with AI states
  const [emailSelectedText, setEmailSelectedText] = useState<string>("");
  const [emailLockedSelectedText, setEmailLockedSelectedText] =
    useState<string>("");
  const [emailSelectionRange, setEmailSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [showEmailEditWithAI, setShowEmailEditWithAI] = useState(false);
  const [emailEditWithAIPosition, setEmailEditWithAIPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [showEmailEditAIModal, setShowEmailEditAIModal] = useState(false);
  const [emailEditAIQuery, setEmailEditAIQuery] = useState<string>("");
  const [isEditingEmailWithAI, setIsEditingEmailWithAI] = useState(false);
  const emailEditorRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proposalFileInputRef = useRef<HTMLInputElement>(null);
  const [proposalAttachment, setProposalAttachment] = useState<File | null>(
    null
  );
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalPdfText, setProposalPdfText] = useState<string>("");
  const [isGeneratingProposalMessage, setIsGeneratingProposalMessage] =
    useState(false);
  const [pendingAttachmentTrigger, setPendingAttachmentTrigger] =
    useState(false);

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

  const whatsappConnections =
    whatsappConnectionsData?.credentials || EMPTY_ARRAY;
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
      { label: "Email", status: emailStatus, isAvailable: hasEmail },
      {
        label: "WhatsApp",
        status: whatsappStatus,
        isAvailable: whatsappAvailable,
      },

      { label: "SMS", status: smsStatus, isAvailable: smsAvailable },
      { label: "Call", status: smsStatus, isAvailable: smsAvailable },
      {
        label: "AI Call",
        status: aiCallAvailable ? "Ready" : "Add phone",
        isAvailable: aiCallAvailable,
      },
      {
        label: "Meetings",
        status: "Ready",
        isAvailable: meetingBotAvailable,
      },
      {
        label: "Proposal",
        status: "Ready",
        isAvailable: true,
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

  const firstAvailableTab = "Email";

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

  useEffect(() => {
    setProposalContent("");
    setProposalHtmlContent("");
    setProposalCopied(false);
    setIsProposalEditable(false);
    setSelectedExampleId("");
    setSelectedText("");
    setSelectionRange(null);
    setShowEditWithAI(false);
    setShowEditAIModal(false);
    setEditAIQuery("");
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
        leadId: leadId || undefined,
        limit: 100,
      }),
    enabled: whatsappConversationEnabled,
    refetchOnWindowFocus: shouldPollWhatsApp,
    refetchInterval: shouldPollWhatsApp ? 5000 : false,
    refetchIntervalInBackground: true,
  });

  const whatsappMessages =
    (whatsappConversationResponse?.data as WhatsAppChatMessage[]) ||
    EMPTY_ARRAY;

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
        return [];
      }

      try {
        const response = await emailService.getLeadEmails(leadId, {
          limit: 100,
        });

        const emails = response.data.emails || [];

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

  const { examples: proposalExamples, query: proposalExamplesQuery } =
    useProposalExamplesData({ limit: 100 });

  const isProposalExamplesLoading = proposalExamplesQuery.isLoading;

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

  const smsMessages: LeadSmsMessage[] =
    leadSmsResponse?.data || (EMPTY_ARRAY as unknown as LeadSmsMessage[]);
  const smsUnavailableMessage =
    !twilioReady && !twilioStatusLoading
      ? twilioConnection.message ||
        "Twilio is not configured. Please contact your administrator."
      : null;
  const smsInputsDisabled = Boolean(smsUnavailableMessage) || !phoneNumber;

  // Fetch proposals for this lead
  const {
    data: proposalsResponse,
    isLoading: isProposalsLoading,
    refetch: refetchProposals,
    error: proposalsError,
  } = useQuery({
    queryKey: ["proposals", leadId],
    queryFn: () => proposalService.getProposalsByLead(leadId as string),
    enabled: Boolean(leadId) && activeTab === "Proposal",
    staleTime: 30_000,
  });

  const sentProposals: Proposal[] = proposalsResponse?.data?.proposals || [];

  // Log proposals error if any
  useEffect(() => {
    if (proposalsError) {
      console.error("Error fetching proposals:", proposalsError);
    }
  }, [proposalsError]);

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
        // Also invalidate lead query for stage updates
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
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
      // Also invalidate lead query for stage updates
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      }
    },
    onError: (mutationError: any) => {
      const errorData = mutationError?.response?.data;
      const fallbackMessage =
        errorData?.message ||
        errorData?.error?.error?.message ||
        errorData?.error?.message ||
        mutationError?.message ||
        "Failed to send WhatsApp message";

      setWhatsappSendError(fallbackMessage);
      toast.error(fallbackMessage);
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
    mutationFn: (payload: any) => emailService.sendEmail(payload),
    onSuccess: () => {
      setEmailInput("");
      setAttachments([]);
      setEmailSubject(DEFAULT_EMAIL_SUBJECT);
      setEmailSendError(null);
      queryClient.invalidateQueries({ queryKey: emailConversationQueryKey });
      // Also invalidate lead query for stage updates
      if (leadId) {
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
      }
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
    if (activeTab === "Email" && pendingAttachmentTrigger) {
      // Use a small timeout to ensure the tab content is fully rendered and the input is available
      const timer = setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.click();
          setPendingAttachmentTrigger(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, pendingAttachmentTrigger]);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset input value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProposalFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setProposalAttachment(file);
      setProposalContent(""); // Remove previously written proposal text
      setProposalHtmlContent("");
      setProposalMessage("Please find the attached business proposal.");
    }
    if (proposalFileInputRef.current) {
      proposalFileInputRef.current.value = "";
    }
  };

  const handleSendProposalViaAttachment = () => {
    if (
      !leadId ||
      !emailAddress ||
      !proposalAttachment ||
      emailMutation.isPending
    ) {
      return;
    }

    emailMutation.mutate(
      {
        to: [emailAddress],
        subject: `Business Proposal - ${lead?.name || "Your Proposal"}`,
        text: proposalMessage,
        html: `<p>${proposalMessage.replace(/\n/g, "<br>")}</p>`,
        attachments: [proposalAttachment],
      },
      {
        onSuccess: async () => {
          // Update lead stage to 'Proposal Sent'
          if (leadId) {
            try {
              await leadsService.markProposalSent(leadId);
              queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
              if (onMessageUpdate) onMessageUpdate();
              // Clear proposal specific states
              setProposalAttachment(null);
              setProposalMessage("");
              setShowProposalList(true);
              toast.success("Proposal sent successfully!");
            } catch (error) {
              console.error(
                "Failed to update lead stage after sending proposal:",
                error
              );
            }
          }
        },
      }
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = () => {
    if (
      !leadId ||
      !emailAddress ||
      (!emailInput.trim() && attachments.length === 0) ||
      emailMutation.isPending
    ) {
      return;
    }

    emailMutation.mutate(
      {
        to: [emailAddress],
        subject: emailSubject?.trim() || DEFAULT_EMAIL_SUBJECT,
        text: emailInput.replace(/<[^>]*>/g, "").trim(),
        html: emailInput.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
      },
      {
        onSuccess: async () => {
          // If attachments were sent, update lead stage to 'Proposal Sent'
          if (attachments.length > 0 && leadId) {
            try {
              await leadsService.markProposalSent(leadId);
              queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
              if (onMessageUpdate) onMessageUpdate();
            } catch (error) {
              console.error(
                "Failed to update lead stage after sending proposal email:",
                error
              );
            }
          }
        },
      }
    );
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

  const handleGenerateProposal = async () => {
    if (!lead?.companyId || !lead?._id) {
      toast.error("Lead information is incomplete for generating proposals.");
      return;
    }

    setIsGeneratingProposal(true);
    try {
      const response = await connectionMessagesService.generateProposal({
        companyId: lead.companyId,
        personId: lead._id,
        regenerate: proposalContent ? true : false,
        proposalExampleId: selectedExampleId || undefined,
      });

      const generated =
        response.data?.proposal?.trim() || response.data?.proposal;

      if (generated) {
        setProposalContent(generated);
        toast.success("Proposal generated successfully!");
      } else {
        toast.error("No proposal was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate proposal.";
      toast.error(friendlyMessage);
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleCopyProposal = async () => {
    if (!proposalContent) {
      toast.error("No proposal to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(proposalContent);
      setProposalCopied(true);
      toast.success("Proposal copied to clipboard!");
      setTimeout(() => setProposalCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy proposal.");
    }
  };

  // Extract text from PDF file
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Use pdf.js library to extract text
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = (window as any).pdfjsLib.getDocument({
        data: arrayBuffer,
      });
      const pdf = await loadingTask.promise;

      let fullText = "";

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      return fullText.trim();
    } catch (error) {
      console.error("Error extracting text from PDF:", error);

      // Fallback: use simple file name and metadata
      return `PDF File: ${file.name}\nSize: ${(file.size / 1024 / 1024).toFixed(
        2
      )} MB\nType: ${file.type}`;
    }
  };

  // Generate message based on attached PDF
  const handleGenerateProposalMessage = async () => {
    if (!proposalAttachment || !lead) {
      toast.error("No proposal attachment found");
      return;
    }

    setIsGeneratingProposalMessage(true);
    try {
      // Extract text from PDF if not already extracted
      let pdfText = proposalPdfText;
      if (!pdfText) {
        toast.info("Analyzing PDF content...");
        pdfText = await extractTextFromPDF(proposalAttachment);
        setProposalPdfText(pdfText);
      }

      // Prepare context for AI
      const context = {
        leadName: lead.name || displayName,
        leadPosition: lead.position,
        leadCompany: lead.companyName,
        pdfFileName: proposalAttachment.name,
        pdfContent: pdfText.substring(0, 8000), // Limit to avoid token limits
      };

      // Call API to generate message
      const response = await API.post(
        "/connection-messages/proposal-email-message",
        {
          personId: lead._id,
          companyId: lead.companyId,
          context: context,
        }
      );

      const generated =
        response.data?.data?.message?.trim() || response.data?.message?.trim();

      if (generated) {
        setProposalMessage(generated);
        toast.success("Email message generated successfully!");
      } else {
        toast.error("No message was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate message.";
      toast.error(friendlyMessage);
    } finally {
      setIsGeneratingProposalMessage(false);
    }
  };

  // Helper function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return "";

    let html = markdown
      // Code blocks (preserve as-is)
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```/g, "").trim();
        return `<pre><code>${code}</code></pre>`;
      })
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Headers
      .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      // Bold (must be done before italic to avoid conflicts)
      .replace(/\*\*(.+?)\*\*/gim, "<strong>$1</strong>")
      // Italic (single asterisks, processed after bold)
      .replace(/\*([^*\n]+?)\*/gim, "<em>$1</em>")
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/gim,
        '<a href="$2" style="color: #68B3B7; text-decoration: underline;">$1</a>'
      )
      // Horizontal rule
      .replace(/^---$/gim, "<hr>")
      .replace(/^\*\*\*$/gim, "<hr>")
      // Blockquotes
      .replace(/^> (.+)$/gim, "<blockquote>$1</blockquote>");

    // Handle lists - wrap consecutive list items
    const lines = html.split("\n");
    const processedLines: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem =
        /^[\*\-\+] (.+)$/.test(line) || /^\d+\. (.+)$/.test(line);

      if (isListItem) {
        const content = line
          .replace(/^[\*\-\+] (.+)$/, "$1")
          .replace(/^\d+\. (.+)$/, "$1");
        listItems.push(`<li>${content}</li>`);
        inList = true;
      } else {
        if (inList && listItems.length > 0) {
          processedLines.push(`<ul>${listItems.join("")}</ul>`);
          listItems = [];
          inList = false;
        }
        processedLines.push(line);
      }
    }

    if (inList && listItems.length > 0) {
      processedLines.push(`<ul>${listItems.join("")}</ul>`);
    }

    html = processedLines.join("\n");

    // Convert double newlines to paragraphs
    html = html
      .split(/\n\n+/)
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return "";
        // Don't wrap if it's already a block element
        if (
          trimmed.startsWith("<h") ||
          trimmed.startsWith("<ul") ||
          trimmed.startsWith("<ol") ||
          trimmed.startsWith("<pre") ||
          trimmed.startsWith("<blockquote") ||
          trimmed.startsWith("<hr")
        ) {
          return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
      })
      .filter((block) => block)
      .join("");

    return html;
  };

  // Helper function to convert HTML back to markdown
  const htmlToMarkdown = (html: string): string => {
    if (!html) return "";

    let markdown = html
      // Headers
      .replace(/<h1>(.*?)<\/h1>/gi, "# $1\n\n")
      .replace(/<h2>(.*?)<\/h2>/gi, "## $1\n\n")
      .replace(/<h3>(.*?)<\/h3>/gi, "### $1\n\n")
      .replace(/<h4>(.*?)<\/h4>/gi, "#### $1\n\n")
      // Bold and italic
      .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i>(.*?)<\/i>/gi, "*$1*")
      // Lists
      .replace(/<ul>(.*?)<\/ul>/gis, (match, content) => {
        return content.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
      })
      .replace(/<ol>(.*?)<\/ol>/gis, (match, content) => {
        let counter = 1;
        return content.replace(/<li>(.*?)<\/li>/gi, () => `${counter++}. $1\n`);
      })
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
      // Code
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<pre><code>(.*?)<\/code><\/pre>/gis, "\n```\n$1\n```\n")
      // Blockquotes
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, "> $1\n")
      // Horizontal rules
      .replace(/<hr\s*\/?>/gi, "\n---\n")
      // Paragraphs and line breaks
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      // Remove remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Clean up multiple newlines
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return markdown;
  };

  // Helper function to convert markdown to plain text
  const markdownToText = (markdown: string): string => {
    if (!markdown) return "";
    return markdown
      .replace(/#{1,6}\s+/g, "") // Remove headers
      .replace(/\*\*(.+?)\*\*/gim, "$1") // Remove bold
      .replace(/\*(.+?)\*/gim, "$1") // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/gim, "$1") // Remove links, keep text
      .replace(/`([^`]+)`/gim, "$1") // Remove inline code
      .trim();
  };

  const handleUpdateStage = async () => {
    if (!lead?._id) {
      toast.error("Lead information is incomplete.");
      return;
    }

    setIsUpdatingStage(true);
    try {
      let emailSentSuccessfully = false;

      // Send proposal via email if email address exists and proposal content is available
      if (emailAddress && proposalContent) {
        try {
          const proposalHtml = markdownToHtml(proposalContent);
          const proposalText = markdownToText(proposalContent);

          await emailService.sendEmail({
            to: [emailAddress],
            subject: `Proposal - ${lead.name || "Your Proposal"}`,
            html: proposalHtml,
            text: proposalText,
          });

          emailSentSuccessfully = true;

          // Invalidate email queries to refresh the conversation
          queryClient.invalidateQueries({
            queryKey: emailConversationQueryKey,
          });
        } catch (emailError: any) {
          const emailErrorMessage =
            emailError?.response?.data?.message ||
            emailError?.message ||
            "Failed to send proposal email, but stage will still be updated.";
          toast.error(emailErrorMessage);
          // Continue with stage update even if email fails
        }
      } else if (!emailAddress) {
        toast.warning(
          "No email address found. Stage will be updated, but proposal cannot be sent via email."
        );
      }

      // Save proposal to database
      if (proposalContent) {
        try {
          const saveResult = await proposalService.saveProposal({
            leadId: lead._id,
            content: proposalContent,
            htmlContent: proposalHtmlContent,
            emailSent: emailSentSuccessfully,
            emailAddress: emailAddress || undefined,
          });

          // Refresh proposals list immediately
          await refetchProposals();

          // Also invalidate the query to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["proposals", lead._id] });
        } catch (proposalError: any) {
          console.error("Failed to save proposal:", proposalError);
          console.error("Error details:", {
            message: proposalError?.message,
            response: proposalError?.response?.data,
            status: proposalError?.response?.status,
          });
          // Show error to user so they know the proposal wasn't saved
          toast.error(
            `Proposal not saved: ${
              proposalError?.response?.data?.message ||
              proposalError?.message ||
              "Unknown error"
            }`
          );
        }
      }

      // Update lead stage
      await leadsService.markProposalSent(lead._id);
      toast.success(
        emailAddress && proposalContent
          ? "Proposal sent via email and lead stage updated to 'Proposal Sent'!"
          : "Lead stage updated to 'Proposal Sent'!"
      );

      // Refresh lead data to update the UI
      if (onMessageUpdate) {
        onMessageUpdate();
      }

      // Invalidate queries to refresh lead data
      queryClient.invalidateQueries({ queryKey: ["lead", lead._id] });

      // Clear proposal content and show the list
      setProposalContent("");
      setProposalHtmlContent("");
      setShowProposalList(true);
      setSelectedProposal(null);
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update lead stage.";
      toast.error(friendlyMessage);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleProposalClick = () => {
    // Only allow editing for new proposals, not for previously sent ones
    if (proposalContent && !isProposalEditable && !selectedProposal) {
      setIsProposalEditable(true);
    }
  };

  const handleTextareaSelection = (textarea: HTMLTextAreaElement) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = proposalContent.substring(start, end).trim();

    if (selected.length > 0) {
      const textareaRect = textarea.getBoundingClientRect();
      const containerRect = proposalContentRef.current?.getBoundingClientRect();

      if (containerRect && textareaRect) {
        // Get computed styles for accurate measurements
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;

        // Count lines before selection start and end
        const textBeforeStart = proposalContent.substring(0, start);
        const textBeforeEnd = proposalContent.substring(0, end);
        const linesBeforeStart = textBeforeStart.split("\n").length - 1;
        const linesBeforeEnd = textBeforeEnd.split("\n").length - 1;

        // Calculate the pixel position of the selection start
        const selectionStartY = linesBeforeStart * lineHeight + paddingTop;
        const selectionEndY = linesBeforeEnd * lineHeight + paddingTop;

        // Use the middle of the selection for positioning
        const selectionMiddleY = (selectionStartY + selectionEndY) / 2;

        // Account for scroll position - get position relative to visible area
        const relativeY = selectionMiddleY - textarea.scrollTop;

        // Get the position relative to the container
        const textareaOffsetTop = textareaRect.top - containerRect.top;
        const absoluteY = textareaOffsetTop + relativeY;

        // Calculate horizontal center of container
        const containerWidth = containerRect.width;
        const left = containerWidth / 2;

        // Position button above or below based on available space
        const buttonHeight = 45;
        const margin = 10;
        let top = absoluteY - buttonHeight - margin;

        // If button would be above visible area, position it below
        if (top < 10) {
          top = absoluteY + lineHeight + margin;
        }

        // Ensure button stays within container bounds
        const maxTop = containerRect.height - buttonHeight - 10;
        if (top > maxTop) {
          top = maxTop;
        }

        setSelectedText(selected);
        setSelectionRange({ start, end });
        setEditWithAIPosition({ top, left });
        setShowEditWithAI(true);
      }
    } else {
      setShowEditWithAI(false);
      setSelectedText("");
      setSelectionRange(null);
    }
  };

  const findTextInMarkdown = (
    selectedText: string,
    markdownContent: string
  ): { start: number; end: number } | null => {
    // Remove markdown formatting from both strings for comparison
    const cleanSelected = selectedText
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/\[|\]/g, "")
      .replace(/\(|\)/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    // Try to find the text in markdown by searching for patterns
    const lines = markdownContent.split("\n");
    let currentPos = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const cleanLine = line
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#/g, "")
        .replace(/\[|\]/g, "")
        .replace(/\(|\)/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      if (cleanLine.includes(cleanSelected)) {
        const indexInLine = cleanLine.indexOf(cleanSelected);
        // Find the actual position accounting for markdown syntax
        let actualStart = currentPos;

        // Count markdown characters before the match
        const beforeMatch = line.substring(0, indexInLine);
        const markdownChars = (beforeMatch.match(/[*_#\[\]()]/g) || []).length;

        // Find the position in original line
        let charCount = 0;
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (!/[*_#\[\]()]/.test(char)) {
            if (charCount === indexInLine) {
              actualStart = currentPos + j - markdownChars;
              break;
            }
            charCount++;
          }
        }

        const actualEnd = actualStart + selectedText.length;
        return { start: actualStart, end: actualEnd };
      }

      currentPos += line.length + 1; // +1 for newline
    }

    // Fallback: try direct search with normalization
    const normalizedSelected = selectedText.replace(/\s+/g, " ").trim();
    const normalizedMarkdown = markdownContent.replace(/\s+/g, " ");
    const markdownStart = normalizedMarkdown
      .toLowerCase()
      .indexOf(normalizedSelected.toLowerCase());

    if (markdownStart !== -1) {
      return {
        start: markdownStart,
        end: markdownStart + normalizedSelected.length,
      };
    }

    return null;
  };

  const handleProposalSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Don't immediately hide button, selection might still be valid
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      setShowEditWithAI(false);
      setSelectedText("");
      setSelectionRange(null);
      return;
    }

    // Check if selection is within the proposal container
    const anchorNode = selection.anchorNode;
    const isWithinProposal = proposalContentRef.current?.contains(anchorNode);

    if (!isWithinProposal) {
      setShowEditWithAI(false);
      setSelectedText("");
      setSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = proposalContentRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    // Calculate position for the "Edit with AI" button
    // Position it above the selection if there's space, otherwise below
    const spaceAbove = rect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - rect.bottom;
    const buttonHeight = 40;

    let top: number;
    if (spaceAbove > buttonHeight + 10) {
      // Position above selection
      top = rect.top - containerRect.top - buttonHeight - 10;
    } else {
      // Position below selection
      top = rect.top - containerRect.top + rect.height + 10;
    }

    const left = rect.left - containerRect.left + rect.width / 2;

    setSelectedText(selectedText);
    setEditWithAIPosition({ top, left });
    setShowEditWithAI(true);

    // Store selection range for later replacement
    if (isProposalEditable) {
      // In edit mode with RichTextEditor (Quill), find the position in HTML content
      const htmlContent = proposalHtmlContent;

      // Try to find the selected text in the HTML content
      // Strip HTML tags to get text content for matching
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      const textStart = textContent
        .toLowerCase()
        .indexOf(selectedText.toLowerCase());

      if (textStart !== -1) {
        setSelectionRange({
          start: textStart,
          end: textStart + selectedText.length,
        });
      } else {
        // Fallback: approximate position
        setSelectionRange({
          start: 0,
          end: selectedText.length,
        });
      }
    } else {
      // For markdown view, find the text in the original markdown
      const markdownContent = proposalContent;
      const foundRange = findTextInMarkdown(selectedText, markdownContent);

      if (foundRange) {
        setSelectionRange(foundRange);
      } else {
        // Fallback: use the selected text to find approximate position
        const textContent = proposalContentRef.current?.textContent || "";
        const textStart = textContent
          .toLowerCase()
          .indexOf(selectedText.toLowerCase());
        if (textStart !== -1) {
          // Try to map back to markdown - this is approximate
          const markdownStart = Math.max(0, textStart - 100);
          setSelectionRange({
            start: markdownStart,
            end: markdownStart + selectedText.length,
          });
        }
      }
    }
  };

  const handleEditWithAI = () => {
    if (selectedText && selectionRange) {
      // Lock the selected text so it won't be cleared
      setLockedSelectedText(selectedText);
      setShowEditAIModal(true);
      setShowEditWithAI(false);
    }
  };

  const handleEditAI = async () => {
    if (!lead?.companyId || !lead?._id) {
      toast.error("Lead information is missing.");
      return;
    }

    if (!lockedSelectedText) {
      toast.error("No text selected. Please select text first.");
      return;
    }

    if (!editAIQuery.trim()) {
      toast.error("Please provide instructions for editing.");
      return;
    }

    setIsEditingWithAI(true);
    try {
      // Find the text in the content to get accurate position
      const selectedTextLower = lockedSelectedText.toLowerCase().trim();
      const contentLower = proposalContent.toLowerCase();
      const foundIndex = contentLower.indexOf(selectedTextLower);

      let actualStart = 0;
      let actualEnd = lockedSelectedText.length;

      if (foundIndex !== -1) {
        actualStart = foundIndex;
        actualEnd = foundIndex + lockedSelectedText.length;
      } else if (selectionRange) {
        actualStart = selectionRange.start;
        actualEnd = selectionRange.end;
      }

      // Call API to edit the selected part
      const response = await connectionMessagesService.editProposalPart({
        companyId: lead.companyId,
        personId: lead._id,
        originalProposal: proposalContent,
        selectedText: lockedSelectedText,
        selectionStart: actualStart,
        selectionEnd: actualEnd,
        instructions: editAIQuery.trim(),
      });

      const editedPart = response.data?.editedPart || response.data?.proposal;
      if (editedPart) {
        // Replace the selected part with the edited version
        // Try to find the exact selected text in the content
        let beforeSelection = "";
        let afterSelection = "";

        if (foundIndex !== -1) {
          // Use the found position
          beforeSelection = proposalContent.substring(0, foundIndex);
          afterSelection = proposalContent.substring(
            foundIndex + lockedSelectedText.length
          );
        } else if (selectionRange) {
          // Fallback to using the range if we have it
          beforeSelection = proposalContent.substring(0, selectionRange.start);
          afterSelection = proposalContent.substring(selectionRange.end);
        } else {
          // Last resort: just append
          beforeSelection = proposalContent;
          afterSelection = "";
        }

        const newContent = beforeSelection + editedPart + afterSelection;
        setProposalContent(newContent);

        // If in edit mode, also update the HTML content
        if (isProposalEditable) {
          setProposalHtmlContent(markdownToHtml(newContent));
        }

        toast.success("Proposal section updated successfully!");
        setShowEditAIModal(false);
        setEditAIQuery("");
        setSelectedText("");
        setLockedSelectedText("");
        setSelectionRange(null);
      } else {
        toast.error("No edited content was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to edit proposal section.";
      toast.error(friendlyMessage);
    } finally {
      setIsEditingWithAI(false);
    }
  };

  // Sync HTML content when entering edit mode
  useEffect(() => {
    if (isProposalEditable && proposalContent && !proposalHtmlContent) {
      setProposalHtmlContent(markdownToHtml(proposalContent));
    }
  }, [isProposalEditable, proposalContent, proposalHtmlContent]);

  // Listen for selection changes in both view and edit modes
  useEffect(() => {
    if (proposalContent && proposalContentRef.current) {
      const handleSelection = () => {
        // Small delay to ensure selection is complete
        setTimeout(() => {
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          if (selectedText && selectedText.length > 0) {
            handleProposalSelection();
          } else {
            // Only clear selection state if modal is not open
            if (!showEditAIModal) {
              setShowEditWithAI(false);
              setSelectedText("");
              setSelectionRange(null);
            }
          }
        }, 10);
      };

      const container = proposalContentRef.current;
      container.addEventListener("mouseup", handleSelection);
      container.addEventListener("keyup", handleSelection);

      return () => {
        container.removeEventListener("mouseup", handleSelection);
        container.removeEventListener("keyup", handleSelection);
      };
    }
  }, [isProposalEditable, proposalContent, showEditAIModal]);

  // Close edit menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        proposalContentRef.current &&
        !proposalContentRef.current.contains(event.target as Node)
      ) {
        setShowEditWithAI(false);
      }
    };

    if (showEditWithAI) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEditWithAI]);

  // Email Edit with AI handlers
  const handleEmailSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      setShowEmailEditWithAI(false);
      setEmailSelectedText("");
      setEmailSelectionRange(null);
      return;
    }

    // Check if selection is within the email editor container
    const anchorNode = selection.anchorNode;
    const isWithinEmailEditor = emailEditorRef.current?.contains(anchorNode);

    if (!isWithinEmailEditor) {
      setShowEmailEditWithAI(false);
      setEmailSelectedText("");
      setEmailSelectionRange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = emailEditorRef.current?.getBoundingClientRect();

    if (!containerRect) {
      return;
    }

    // Calculate position for the "Edit with AI" button
    const spaceAbove = rect.top - containerRect.top;
    const spaceBelow = containerRect.bottom - rect.bottom;
    const buttonHeight = 40;

    let top: number;
    if (spaceAbove > buttonHeight + 10) {
      top = rect.top - containerRect.top - buttonHeight - 10;
    } else {
      top = rect.top - containerRect.top + rect.height + 10;
    }

    const left = rect.left - containerRect.left + rect.width / 2;

    setEmailSelectedText(selectedText);
    setEmailEditWithAIPosition({ top, left });
    setShowEmailEditWithAI(true);

    // Store selection range
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = emailInput;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    const textStart = textContent
      .toLowerCase()
      .indexOf(selectedText.toLowerCase());

    if (textStart !== -1) {
      setEmailSelectionRange({
        start: textStart,
        end: textStart + selectedText.length,
      });
    } else {
      setEmailSelectionRange({
        start: 0,
        end: selectedText.length,
      });
    }
  };

  const handleEditEmailWithAI = () => {
    if (emailSelectedText && emailSelectionRange) {
      setEmailLockedSelectedText(emailSelectedText);
      setShowEmailEditAIModal(true);
      setShowEmailEditWithAI(false);
    }
  };

  const handleEmailEditAI = async () => {
    if (!lead?.companyId || !lead?._id) {
      toast.error("Lead information is missing.");
      return;
    }

    if (!emailLockedSelectedText) {
      toast.error("No text selected. Please select text first.");
      return;
    }

    if (!emailEditAIQuery.trim()) {
      toast.error("Please provide instructions for editing.");
      return;
    }

    setIsEditingEmailWithAI(true);
    try {
      // Find the text in the content
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = emailInput;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      const selectedTextLower = emailLockedSelectedText.toLowerCase().trim();
      const contentLower = textContent.toLowerCase();
      const foundIndex = contentLower.indexOf(selectedTextLower);

      let actualStart = 0;
      let actualEnd = emailLockedSelectedText.length;

      if (foundIndex !== -1) {
        actualStart = foundIndex;
        actualEnd = foundIndex + emailLockedSelectedText.length;
      } else if (emailSelectionRange) {
        actualStart = emailSelectionRange.start;
        actualEnd = emailSelectionRange.end;
      }

      // Call API to edit the selected part
      const response = await connectionMessagesService.editProposalPart({
        companyId: lead.companyId,
        personId: lead._id,
        originalProposal: textContent,
        selectedText: emailLockedSelectedText,
        selectionStart: actualStart,
        selectionEnd: actualEnd,
        instructions: emailEditAIQuery.trim(),
      });

      const editedPart = response.data?.editedPart || response.data?.proposal;
      if (editedPart) {
        // Replace the selected part with the edited version
        let beforeSelection = "";
        let afterSelection = "";

        if (foundIndex !== -1) {
          beforeSelection = textContent.substring(0, foundIndex);
          afterSelection = textContent.substring(
            foundIndex + emailLockedSelectedText.length
          );
        } else if (emailSelectionRange) {
          beforeSelection = textContent.substring(0, emailSelectionRange.start);
          afterSelection = textContent.substring(emailSelectionRange.end);
        } else {
          beforeSelection = textContent;
          afterSelection = "";
        }

        const newContent = beforeSelection + editedPart + afterSelection;

        // Convert back to HTML (simple text to HTML)
        const newHtml = newContent
          .split("\n")
          .map((line) => `<p>${line}</p>`)
          .join("");
        setEmailInput(newHtml);

        toast.success("Email content updated successfully!");
        setShowEmailEditAIModal(false);
        setEmailEditAIQuery("");
        setEmailSelectedText("");
        setEmailLockedSelectedText("");
        setEmailSelectionRange(null);
      } else {
        toast.error("No edited content was generated. Try again.");
      }
    } catch (error: any) {
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to edit email content.";
      toast.error(friendlyMessage);
    } finally {
      setIsEditingEmailWithAI(false);
    }
  };

  // Listen for selection changes in email editor
  useEffect(() => {
    if (emailInput && emailEditorRef.current) {
      const handleSelection = () => {
        setTimeout(() => {
          const selection = window.getSelection();
          const selectedText = selection?.toString().trim();
          if (selectedText && selectedText.length > 0) {
            handleEmailSelection();
          } else {
            if (!showEmailEditAIModal) {
              setShowEmailEditWithAI(false);
              setEmailSelectedText("");
              setEmailSelectionRange(null);
            }
          }
        }, 10);
      };

      const container = emailEditorRef.current;
      container.addEventListener("mouseup", handleSelection);
      container.addEventListener("keyup", handleSelection);

      return () => {
        container.removeEventListener("mouseup", handleSelection);
        container.removeEventListener("keyup", handleSelection);
      };
    }
  }, [emailInput, showEmailEditAIModal]);

  // Close email edit menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emailEditorRef.current &&
        !emailEditorRef.current.contains(event.target as Node)
      ) {
        setShowEmailEditWithAI(false);
      }
    };

    if (showEmailEditWithAI) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showEmailEditWithAI]);

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

  // Function to convert React icon to base64 image
  const convertIconToBase64 = (
    IconComponent: any,
    size: number = 16,
    color: string = "#000000"
  ): string => {
    try {
      const svgString = ReactDOMServer.renderToString(
        <IconComponent size={size} color={color} />
      );

      // Properly encode the SVG string to handle Unicode characters
      const base64 = btoa(unescape(encodeURIComponent(svgString)));
      const svgDataUrl = `data:image/svg+xml;base64,${base64}`;
      return svgDataUrl;
    } catch (error) {
      console.error("Error converting icon to base64:", error);
      // Return a simple placeholder icon as fallback
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 3;
      const fallbackSvg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}"/></svg>`;
      return `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
    }
  };

  const handleDownloadPDF = async (isDarkMode: boolean) => {
    if (!proposalContent) {
      toast.error("No proposal content to download");
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const footerHeight = 20;

      // ====================================================================
      // TAMIMI GROUP BRANDING - Consistent across all PDF downloads
      // ====================================================================
      // Company information is hardcoded to ensure consistent branding
      // Only the DATE field changes for each proposal download
      const companyName = "TAMIMI PRE ENGINEERED BUILDINGS CO.";
      const companyWebsite = "www.tamimi-peb.com";
      const companyLocation = "Saudi Arabia";
      const companyWhatsApp = "+966 50 123 4567";

      // Tamimi logo - Use the appropriate logo based on dark/light mode
      const companyLogoUrl = isDarkMode ? tamimiLogoDark : tamimiLogoLight;
      // ====================================================================

      // Function to load image as base64
      const loadImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
          // Create a promise to load the image
          return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous"; // Handle CORS

            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const dataURL = canvas.toDataURL("image/png");
                  resolve(dataURL);
                } else {
                  resolve(null);
                }
              } catch (error) {
                console.error("Canvas error:", error);
                resolve(null);
              }
            };

            img.onerror = () => {
              console.error("Image load error");
              resolve(null);
            };

            // Add timestamp to avoid cache issues
            img.src = url.includes("?")
              ? `${url}&t=${Date.now()}`
              : `${url}?t=${Date.now()}`;
          });
        } catch (error) {
          console.error("Failed to load image:", error);
          return null;
        }
      };

      // Load company logo if available
      let logoBase64: string | null = null;
      if (companyLogoUrl) {
        try {
          logoBase64 = await loadImageAsBase64(companyLogoUrl);
          console.log("Logo loaded:", logoBase64 ? "success" : "failed");
        } catch (error) {
          console.error("Error loading logo:", error);
        }
      }

      // Color scheme for consistent design across light and dark modes
      const textColor = isDarkMode ? [255, 255, 255] : [0, 0, 0];
      const secondaryTextColor = isDarkMode ? [180, 180, 180] : [80, 80, 80];
      const iconColor = isDarkMode ? [218, 165, 32] : [218, 165, 32]; // Gold color for icons
      const dividerColor = isDarkMode ? [80, 80, 80] : [200, 200, 200];

      console.log(
        "Colors configured for",
        isDarkMode ? "dark" : "light",
        "mode"
      );

      // Header height for content calculation
      const headerHeight = 30;
      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Function to add header to current page
      const addHeader = () => {
        const logoHeight = 12; // Height in mm for the rectangular logo
        const logoWidth = 60; // Width in mm to maintain aspect ratio of the logo
        const logoX = margin;
        const logoY = margin;

        // Company Logo - display actual logo if available, otherwise show placeholder
        if (logoBase64) {
          try {
            pdf.addImage(
              logoBase64,
              "PNG",
              logoX,
              logoY,
              logoWidth,
              logoHeight,
              undefined,
              "FAST"
            );
          } catch (error) {
            // Fallback to placeholder if image fails
            console.error("Failed to add logo to PDF:", error);
            pdf.setFillColor(
              isDarkMode ? 60 : 200,
              isDarkMode ? 60 : 200,
              isDarkMode ? 60 : 200
            );
            pdf.rect(logoX, logoY, logoWidth, logoHeight, "F");
          }
        } else {
          // Text-based logo when image is not available
          // Draw a border rectangle
          pdf.setDrawColor(218, 165, 32); // Gold color
          pdf.setLineWidth(0.5);
          pdf.rect(logoX, logoY, logoWidth, logoHeight);

          // Add company name as text logo
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(218, 165, 32); // Gold color
          const logoText = "TAMIMI";
          const textWidth = pdf.getTextWidth(logoText);
          const textX = logoX + (logoWidth - textWidth) / 2;
          const textY = logoY + logoHeight / 2 - 2;
          pdf.text(logoText, textX, textY);

          // Add "PRE ENGINEERED BUILDINGS" below in smaller text
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          const subText = "PRE ENGINEERED BUILDINGS CO.";
          const subTextWidth = pdf.getTextWidth(subText);
          const subTextX = logoX + (logoWidth - subTextWidth) / 2;
          const subTextY = logoY + logoHeight / 2 + 4;
          pdf.text(subText, subTextX, subTextY);
        }

        // Date - positioned on the right
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...(textColor as [number, number, number]));
        pdf.text(`DATE: ${today}`, pageWidth - margin - 40, logoY + 6);

        // Divider line with gold accent (matching Tamimi design)
        const dividerY = logoY + logoHeight + 3;
        // Gold/yellow accent line
        pdf.setDrawColor(218, 165, 32); // Gold color
        pdf.setLineWidth(1);
        pdf.line(margin, dividerY, pageWidth - margin, dividerY);
        // Secondary darker line below
        pdf.setDrawColor(...(dividerColor as [number, number, number]));
        pdf.setLineWidth(0.3);
        pdf.line(margin, dividerY + 1, pageWidth - margin, dividerY + 1);
      };

      // Function to add footer to current page
      const addFooter = () => {
        const footerY = pageHeight - footerHeight;
        const footerBarHeight = 12;
        const footerBarY = pageHeight - footerBarHeight;
        const iconSize = 4;
        const sectionWidth = contentWidth / 3;
        const iconY = footerBarY + 4;
        const textY = footerBarY + 9;

        // Footer background bar with consistent styling
        if (isDarkMode) {
          // Dark mode: darker footer background
          pdf.setFillColor(35, 35, 35);
        } else {
          // Light mode: light footer background
          pdf.setFillColor(245, 245, 245);
        }
        pdf.roundedRect(
          margin,
          footerBarY,
          contentWidth,
          footerBarHeight,
          3,
          3,
          "F"
        );

        // Add border to footer bar for better definition
        if (isDarkMode) {
          pdf.setDrawColor(80, 80, 80);
        } else {
          pdf.setDrawColor(200, 200, 200);
        }
        pdf.setLineWidth(0.5);
        pdf.roundedRect(
          margin,
          footerBarY,
          contentWidth,
          footerBarHeight,
          3,
          3,
          "S"
        );

        // WhatsApp icon - modern filled design
        const whatsappX = margin + sectionWidth * 0.5;
        pdf.setDrawColor(...(iconColor as [number, number, number]));
        pdf.setFillColor(...(iconColor as [number, number, number]));
        pdf.setLineWidth(0.5);

        // Draw filled circle
        pdf.circle(whatsappX, iconY, iconSize / 2.5, "F");

        // Draw white chat bubble/phone icon inside
        pdf.setFillColor(
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255
        );
        const bubbleSize = iconSize / 5;
        // Simple phone receiver representation
        pdf.circle(
          whatsappX - bubbleSize * 0.6,
          iconY + bubbleSize * 0.4,
          bubbleSize * 0.35,
          "F"
        );
        pdf.circle(
          whatsappX + bubbleSize * 0.6,
          iconY - bubbleSize * 0.4,
          bubbleSize * 0.35,
          "F"
        );

        // Connection line
        pdf.setLineWidth(bubbleSize * 0.4);
        pdf.setDrawColor(
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255
        );
        pdf.line(
          whatsappX - bubbleSize * 0.3,
          iconY + bubbleSize * 0.2,
          whatsappX + bubbleSize * 0.3,
          iconY - bubbleSize * 0.2
        );

        pdf.setFontSize(7);
        pdf.setTextColor(...(secondaryTextColor as [number, number, number]));
        const whatsappLines = pdf.splitTextToSize(
          companyWhatsApp,
          sectionWidth - 4
        );
        whatsappLines.forEach((line: string, idx: number) => {
          pdf.text(line, whatsappX, textY + idx * 3, { align: "center" });
        });

        // Vertical divider 1
        pdf.setDrawColor(...(dividerColor as [number, number, number]));
        pdf.setLineWidth(0.3);
        pdf.line(
          margin + sectionWidth,
          footerBarY + 2,
          margin + sectionWidth,
          footerBarY + footerBarHeight - 2
        );

        // Website icon (globe) - modern filled design
        const websiteX = margin + sectionWidth * 1.5;
        pdf.setDrawColor(...(iconColor as [number, number, number]));
        pdf.setFillColor(...(iconColor as [number, number, number]));
        pdf.setLineWidth(0.5);

        // Draw filled circle
        pdf.circle(websiteX, iconY, iconSize / 2.5, "F");

        // Draw white globe lines inside
        pdf.setDrawColor(
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255
        );
        pdf.setLineWidth(0.4);

        // Outline circle
        pdf.circle(websiteX, iconY, iconSize / 3.2, "S");

        // Horizontal latitude line
        pdf.line(
          websiteX - iconSize / 3.2,
          iconY,
          websiteX + iconSize / 3.2,
          iconY
        );

        // Vertical meridian (ellipse)
        pdf.ellipse(websiteX, iconY, iconSize / 7, iconSize / 3.2, "S");

        const websiteLines = pdf.splitTextToSize(
          companyWebsite,
          sectionWidth - 4
        );
        websiteLines.forEach((line: string, idx: number) => {
          pdf.text(line, websiteX, textY + idx * 3, { align: "center" });
        });

        // Vertical divider 2
        pdf.line(
          margin + sectionWidth * 2,
          footerBarY + 2,
          margin + sectionWidth * 2,
          footerBarY + footerBarHeight - 2
        );

        // Location icon - modern filled pin design
        const locationX = margin + sectionWidth * 2.5;
        pdf.setDrawColor(...(iconColor as [number, number, number]));
        pdf.setFillColor(...(iconColor as [number, number, number]));
        pdf.setLineWidth(0.5);

        // Draw location pin - teardrop shape
        const pinRadius = iconSize / 3.5;

        // Top circle part of pin (filled)
        pdf.circle(locationX, iconY - pinRadius * 0.5, pinRadius, "F");

        // Bottom pointed part of pin (triangle)
        pdf.triangle(
          locationX - pinRadius * 0.5,
          iconY + pinRadius * 0.3,
          locationX + pinRadius * 0.5,
          iconY + pinRadius * 0.3,
          locationX,
          iconY + pinRadius * 1.8,
          "F"
        );

        // Inner circle (white dot in pin)
        pdf.setFillColor(
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255,
          isDarkMode ? 35 : 255
        );
        pdf.circle(locationX, iconY - pinRadius * 0.5, pinRadius * 0.45, "F");

        const locationLines = pdf.splitTextToSize(
          companyLocation,
          sectionWidth - 4
        );
        locationLines.forEach((line: string, idx: number) => {
          pdf.text(line, locationX, textY + idx * 3, { align: "center" });
        });
      };

      // Function to add background to page
      const addBackground = () => {
        if (isDarkMode) {
          // Dark mode: charcoal/near-black background
          pdf.setFillColor(15, 15, 15); // #0F0F0F similar to design
        } else {
          // Light mode: white/light gray background
          pdf.setFillColor(250, 250, 250);
        }
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
      };

      // Add background to first page
      addBackground();

      // Add header to first page
      addHeader();

      // Start content after header
      let currentY = margin + headerHeight;

      // Add footer to first page
      addFooter();

      // Parse markdown content into structured elements
      const markdownLines = proposalContent.split("\n");
      const lineHeight = 6;
      const maxContentY = pageHeight - footerHeight - 10;
      const maxWidth = contentWidth;

      for (let i = 0; i < markdownLines.length; i++) {
        const line = markdownLines[i];
        const trimmedLine = line.trim();

        // Skip completely empty lines but add minimal spacing
        if (!trimmedLine) {
          currentY += lineHeight * 0.3;
          continue;
        }

        // Check if we need a new page
        if (currentY + lineHeight > maxContentY) {
          pdf.addPage();
          addBackground();
          addHeader();
          addFooter();
          currentY = margin + headerHeight;
        }

        // Handle different markdown elements
        if (trimmedLine.startsWith("# ")) {
          // H1
          pdf.setFontSize(16);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...(textColor as [number, number, number]));
          const text = trimmedLine.substring(2);
          const textLines = pdf.splitTextToSize(text, maxWidth);
          textLines.forEach((textLine: string) => {
            if (currentY + lineHeight > maxContentY) {
              pdf.addPage();
              addBackground();
              addHeader();
              addFooter();
              currentY = margin + headerHeight;
            }
            pdf.text(textLine, margin, currentY);
            currentY += lineHeight + 2;
          });
          currentY += 2;
        } else if (trimmedLine.startsWith("## ")) {
          // H2
          pdf.setFontSize(14);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...(textColor as [number, number, number]));
          const text = trimmedLine.substring(3);
          const textLines = pdf.splitTextToSize(text, maxWidth);
          textLines.forEach((textLine: string) => {
            if (currentY + lineHeight > maxContentY) {
              pdf.addPage();
              addBackground();
              addHeader();
              addFooter();
              currentY = margin + headerHeight;
            }
            pdf.text(textLine, margin, currentY);
            currentY += lineHeight + 1;
          });
          currentY += 2;
        } else if (trimmedLine.startsWith("### ")) {
          // H3
          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...(textColor as [number, number, number]));
          const text = trimmedLine.substring(4);
          const textLines = pdf.splitTextToSize(text, maxWidth);
          textLines.forEach((textLine: string) => {
            if (currentY + lineHeight > maxContentY) {
              pdf.addPage();
              addBackground();
              addHeader();
              addFooter();
              currentY = margin + headerHeight;
            }
            pdf.text(textLine, margin, currentY);
            currentY += lineHeight + 1;
          });
          currentY += 1;
        } else if (
          trimmedLine.startsWith("- ") ||
          trimmedLine.startsWith("* ")
        ) {
          // Bullet list - handle bold text in bullets
          pdf.setFontSize(11);
          pdf.setTextColor(...(textColor as [number, number, number]));
          const text = trimmedLine.substring(2);

          // Parse bold text
          const segments = [];
          let currentText = text;
          const boldRegex = /\*\*(.+?)\*\*/;
          let match;

          while ((match = boldRegex.exec(currentText)) !== null) {
            if (match.index > 0) {
              segments.push({
                text: currentText.substring(0, match.index),
                bold: false,
              });
            }
            segments.push({ text: match[1], bold: true });
            currentText = currentText.substring(match.index + match[0].length);
          }
          if (currentText.length > 0) {
            segments.push({ text: currentText, bold: false });
          }

          // Render the line with bold handling and proper wrapping
          if (currentY + lineHeight > maxContentY) {
            pdf.addPage();
            addBackground();
            addHeader();
            addFooter();
            currentY = margin + headerHeight;
          }

          const bulletIndent = margin + 5;
          let xOffset = margin + 2;
          pdf.setFont("helvetica", "normal");
          pdf.text("• ", xOffset, currentY);
          xOffset = bulletIndent;

          segments.forEach((segment) => {
            pdf.setFont("helvetica", segment.bold ? "bold" : "normal");
            const words = segment.text.split(" ");

            words.forEach((word, idx) => {
              const wordWithSpace = idx < words.length - 1 ? word + " " : word;
              const wordWidth = pdf.getTextWidth(wordWithSpace);

              // Check if we need to wrap to next line
              if (
                xOffset + wordWidth > pageWidth - margin &&
                xOffset > bulletIndent
              ) {
                currentY += lineHeight;
                if (currentY + lineHeight > maxContentY) {
                  pdf.addPage();
                  addBackground();
                  addHeader();
                  addFooter();
                  currentY = margin + headerHeight;
                }
                xOffset = bulletIndent; // Indent continuation
              }

              pdf.text(wordWithSpace, xOffset, currentY);
              xOffset += wordWidth;
            });
          });

          currentY += lineHeight;
        } else if (trimmedLine.match(/^\d+\.\s/)) {
          // Numbered list - handle bold text
          pdf.setFontSize(11);
          pdf.setTextColor(...(textColor as [number, number, number]));
          const match = trimmedLine.match(/^(\d+\.)\s(.+)/);
          if (match) {
            const number = match[1];
            const text = match[2];

            // Parse bold text
            const segments = [];
            let currentText = text;
            const boldRegex = /\*\*(.+?)\*\*/;
            let boldMatch;

            while ((boldMatch = boldRegex.exec(currentText)) !== null) {
              if (boldMatch.index > 0) {
                segments.push({
                  text: currentText.substring(0, boldMatch.index),
                  bold: false,
                });
              }
              segments.push({ text: boldMatch[1], bold: true });
              currentText = currentText.substring(
                boldMatch.index + boldMatch[0].length
              );
            }
            if (currentText.length > 0) {
              segments.push({ text: currentText, bold: false });
            }

            // Render the line with bold handling and proper wrapping
            if (currentY + lineHeight > maxContentY) {
              pdf.addPage();
              addBackground();
              addHeader();
              addFooter();
              currentY = margin + headerHeight;
            }

            let xOffset = margin;
            pdf.setFont("helvetica", "normal");
            pdf.text(number + " ", xOffset, currentY);
            const numberWidth = pdf.getTextWidth(number + " ");
            xOffset += numberWidth;
            const numberIndent = margin + numberWidth;

            segments.forEach((segment) => {
              pdf.setFont("helvetica", segment.bold ? "bold" : "normal");
              const words = segment.text.split(" ");

              words.forEach((word, idx) => {
                const wordWithSpace =
                  idx < words.length - 1 ? word + " " : word;
                const wordWidth = pdf.getTextWidth(wordWithSpace);

                // Check if we need to wrap to next line
                if (
                  xOffset + wordWidth > pageWidth - margin &&
                  xOffset > numberIndent
                ) {
                  currentY += lineHeight;
                  if (currentY + lineHeight > maxContentY) {
                    pdf.addPage();
                    addBackground();
                    addHeader();
                    addFooter();
                    currentY = margin + headerHeight;
                  }
                  xOffset = numberIndent; // Indent continuation to align with text
                }

                pdf.text(wordWithSpace, xOffset, currentY);
                xOffset += wordWidth;
              });
            });

            currentY += lineHeight;
          }
        } else if (trimmedLine.startsWith("|")) {
          // Table row handling
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...(textColor as [number, number, number]));

          // Split by pipe and clean up
          const cells = trimmedLine
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell);

          // Check if it's a separator row (contains only dashes and pipes)
          const isSeparator = trimmedLine.match(/^\|[\s\-:]+\|/);

          if (!isSeparator && cells.length > 0) {
            // Calculate column widths (equal distribution)
            const cellWidth = maxWidth / cells.length;

            if (currentY + lineHeight > maxContentY) {
              pdf.addPage();
              addBackground();
              addHeader();
              addFooter();
              currentY = margin + headerHeight;
            }

            // Render each cell
            cells.forEach((cell, idx) => {
              const cellX = margin + idx * cellWidth;
              // Truncate long cell content to fit
              const cellText = pdf.splitTextToSize(cell, cellWidth - 2);
              pdf.text(cellText[0] || cell, cellX + 1, currentY);
            });

            // Draw border for table row
            pdf.setDrawColor(...(dividerColor as [number, number, number]));
            pdf.setLineWidth(0.2);
            pdf.rect(margin, currentY - 4, maxWidth, lineHeight - 1);

            currentY += lineHeight;
          } else if (isSeparator) {
            // Draw thicker line for header separator
            pdf.setDrawColor(...(dividerColor as [number, number, number]));
            pdf.setLineWidth(0.5);
            pdf.line(margin, currentY, pageWidth - margin, currentY);
            currentY += lineHeight * 0.5;
          }
        } else if (trimmedLine.startsWith("")) {
          // Empty line - add spacing
          currentY += lineHeight / 2;
        } else if (
          trimmedLine.startsWith("---") ||
          trimmedLine.startsWith("***")
        ) {
          // Horizontal rule
          pdf.setDrawColor(...(textColor as [number, number, number]));
          pdf.setLineWidth(0.5);
          pdf.line(margin, currentY, pageWidth - margin, currentY);
          currentY += lineHeight;
        } else if (trimmedLine) {
          // Regular paragraph - handle bold text and preserve all content
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...(textColor as [number, number, number]));

          // Parse and handle bold/italic markdown
          let processedText = trimmedLine;

          // Track if this line has any bold text
          const hasBold = /\*\*(.+?)\*\*/g.test(processedText);

          if (hasBold) {
            // Handle bold text by splitting and rendering each part
            const segments: { text: string; bold: boolean }[] = [];
            let remaining = processedText;
            const boldRegex = /\*\*(.+?)\*\*/g;
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(processedText)) !== null) {
              // Add text before bold
              if (match.index > lastIndex) {
                segments.push({
                  text: processedText.substring(lastIndex, match.index),
                  bold: false,
                });
              }
              // Add bold text
              segments.push({
                text: match[1],
                bold: true,
              });
              lastIndex = match.index + match[0].length;
            }
            // Add remaining text
            if (lastIndex < processedText.length) {
              segments.push({
                text: processedText.substring(lastIndex),
                bold: false,
              });
            }

            // Render with proper wrapping
            let xOffset = margin;
            segments.forEach((segment) => {
              pdf.setFont("helvetica", segment.bold ? "bold" : "normal");
              const words = segment.text.split(" ");

              words.forEach((word, idx) => {
                const wordWithSpace =
                  idx < words.length - 1 ? word + " " : word;
                const wordWidth = pdf.getTextWidth(wordWithSpace);

                // Check if we need to wrap
                if (
                  xOffset + wordWidth > pageWidth - margin &&
                  xOffset > margin
                ) {
                  currentY += lineHeight;
                  if (currentY + lineHeight > maxContentY) {
                    pdf.addPage();
                    addBackground();
                    addHeader();
                    addFooter();
                    currentY = margin + headerHeight;
                  }
                  xOffset = margin;
                }

                pdf.text(wordWithSpace, xOffset, currentY);
                xOffset += wordWidth;
              });
            });
            currentY += lineHeight;
          } else {
            // No bold text - simple rendering
            processedText = processedText.replace(/\*\*(.+?)\*\*/g, "$1");
            processedText = processedText.replace(/\*(.+?)\*/g, "$1");

            const textLines = pdf.splitTextToSize(processedText, maxWidth);
            textLines.forEach((textLine: string) => {
              if (currentY + lineHeight > maxContentY) {
                pdf.addPage();
                addBackground();
                addHeader();
                addFooter();
                currentY = margin + headerHeight;
              }
              pdf.text(textLine, margin, currentY);
              currentY += lineHeight;
            });
          }
        }
      }

      const fileName = `Proposal_${(displayName || "Lead").replace(
        /\s+/g,
        "_"
      )}_${isDarkMode ? "Dark" : "Light"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;

      pdf.save(fileName);

      toast.success(
        `PDF downloaded successfully (${isDarkMode ? "Dark" : "Light"} mode)`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      console.error(
        "Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
      toast.error(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
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
                          <AvatarFallback
                            name={displayName}
                            pictureUrl={avatarSrc}
                            size="sm"
                          />
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
                          {/* {canDelete && (
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
                          )} */}
                          <div className="flex items-center justify-between gap-4 text-xs text-white/70">
                            <span className="font-semibold text-white">
                              {isOutbound
                                ? getSenderName(message.userId)
                                : displayName}
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
                      whatsappTextareaRef.current.style.height = "24px";
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
                  style={{
                    minHeight: "24px",
                    maxHeight: "60px",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                  }}
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
        ) : activeTab === "Proposal" ? (
          <div className="flex flex-1 flex-col min-h-0 relative">
            {!lead?.companyId || !lead?._id ? (
              <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                Lead information is incomplete for generating proposals.
              </div>
            ) : (
              <div className="flex flex-1 flex-col min-h-0">
                {/* Header with Generate and Copy buttons */}
                <div className="flex items-center justify-between gap-3 mb-4 px-1">
                  <div className="flex items-center gap-2 flex-wrap flex-1">
                    {/* Show back button if viewing a previously sent proposal */}
                    {selectedProposal && (
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
                        onClick={() => {
                          setProposalContent("");
                          setProposalHtmlContent("");
                          setShowProposalList(true);
                          setSelectedProposal(null);
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to List
                      </button>
                    )}

                    {/* Proposal Template Selector */}
                    {!selectedProposal && (
                      <Popover
                        open={openExampleSelector}
                        onOpenChange={setOpenExampleSelector}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex h-[34px] w-[200px] items-center justify-between rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-40"
                            disabled={isGeneratingProposal}
                          >
                            <span className="truncate">
                              {selectedExampleId
                                ? proposalExamples.find(
                                    (ex: any) => ex._id === selectedExampleId
                                  )?.fileName
                                : "Select Template..."}
                            </span>
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[200px] p-0 bg-[#1a1a1a] border-white/20 shadow-2xl z-[60]"
                          align="start"
                        >
                          <Command className="bg-transparent">
                            <CommandInput
                              placeholder="Search templates..."
                              className="h-8 text-xs text-white"
                            />
                            <CommandList className="max-h-[200px] overflow-y-auto scrollbar-hide">
                              {isProposalExamplesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                  <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                                </div>
                              ) : (
                                <>
                                  <CommandEmpty className="py-2 text-center text-xs text-white/50">
                                    No template found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {proposalExamples.map((example: any) => (
                                      <CommandItem
                                        key={example._id}
                                        value={example.fileName}
                                        onSelect={() => {
                                          // Clear existing proposal when changing template
                                          if (
                                            selectedExampleId !== example._id
                                          ) {
                                            setProposalContent("");
                                            setProposalHtmlContent("");
                                          }
                                          setSelectedExampleId(example._id);
                                          setOpenExampleSelector(false);
                                        }}
                                        className="text-xs text-white hover:bg-white/10 cursor-pointer flex items-center px-2 py-1.5"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-3 w-3",
                                            selectedExampleId === example._id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {example.fileName}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}

                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed h-[34px]"
                      onClick={handleGenerateProposal}
                      disabled={
                        isGeneratingProposal ||
                        !!selectedProposal ||
                        !selectedExampleId
                      }
                      title={
                        selectedProposal
                          ? "Cannot regenerate a sent proposal"
                          : !selectedExampleId
                          ? "Please select a template first"
                          : ""
                      }
                    >
                      {isGeneratingProposal ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          {proposalContent
                            ? "Regenerate with AI"
                            : "Generate with AI"}
                        </>
                      )}
                    </button>
                    {proposalContent && (
                      <>
                        {/* Show View-Only indicator for sent proposals, or Edit/View button for new proposals */}
                        {selectedProposal ? (
                          <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-400">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View-Only Mode
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-40"
                            onClick={() =>
                              setIsProposalEditable(!isProposalEditable)
                            }
                          >
                            {isProposalEditable ? "View" : "Edit"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-40"
                          onClick={handleCopyProposal}
                          disabled={!proposalContent}
                        >
                          {proposalCopied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-40"
                          onClick={() => handleDownloadPDF(false)}
                          disabled={!proposalContent}
                          title="Download PDF (Light Mode)"
                        >
                          <Download className="h-4 w-4" />
                          Light PDF
                        </button>
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:opacity-40"
                          onClick={() => handleDownloadPDF(true)}
                          disabled={!proposalContent}
                          title="Download PDF (Dark Mode)"
                        >
                          <Download className="h-4 w-4" />
                          Dark PDF
                        </button>
                        <button
                          type="button"
                          className="flex h-8.5 w-8.5 items-center justify-center rounded-lg border border-white/30 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40 h-[34px] w-[34px]"
                          onClick={() => {
                            proposalFileInputRef.current?.click();
                          }}
                          disabled={!proposalContent || !!selectedProposal}
                          title="Attach this proposal"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                        <input
                          type="file"
                          ref={proposalFileInputRef}
                          className="hidden"
                          onChange={handleProposalFileSelect}
                          accept=".pdf,.doc,.docx"
                        />
                      </>
                    )}
                  </div>

                  {/* Close button on the right - more prominent */}
                  {proposalContent && !selectedProposal && (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50 flex-shrink-0"
                      onClick={() => {
                        setProposalContent("");
                        setProposalHtmlContent("");
                        setShowProposalList(true);
                        setSelectedProposal(null);
                      }}
                      title="Close and view all proposals"
                    >
                      <X className="h-4 w-4" />
                      Close
                    </button>
                  )}
                </div>

                {/* Show proposal info if it's a previously sent proposal */}
                {selectedProposal && proposalContent && (
                  <div className="mb-4 px-1">
                    <div className="rounded-lg border border-white/20 bg-white/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/90">
                            Sent by {selectedProposal.sentBy.name}
                          </p>
                          <p className="text-xs text-white/60 mt-0.5">
                            {new Date(
                              selectedProposal.sentAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {selectedProposal.emailSent && (
                          <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                            ✓ Email Sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Proposal Content */}
                {proposalContent || proposalAttachment ? (
                  <div className="flex-1 overflow-y-auto scrollbar-hide pb-4 relative">
                    {/* View-Only Banner for sent proposals */}
                    {selectedProposal && (
                      <div className="mb-4 px-1">
                        <div className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 text-xs text-blue-300">
                          <svg
                            className="h-5 w-5 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <p className="font-semibold">
                              This is a previously sent proposal in view-only
                              mode.
                            </p>
                            <p className="text-blue-200/80 mt-0.5">
                              You cannot edit or resend this proposal. Create a
                              new proposal to make changes.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Proposal Attachment Flow */}
                    {proposalAttachment && (
                      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/10">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400">
                              <span className="text-xl">📄</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {proposalAttachment.name}
                              </p>
                              <p className="text-xs text-white/50">
                                {(
                                  proposalAttachment.size /
                                  1024 /
                                  1024
                                ).toFixed(2)}{" "}
                                MB • Ready to send
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setProposalAttachment(null);
                              // Maybe we should NOT restore proposalContent automatically as user might have wanted to clear it
                              // But if they clicked 'X' they might want to go back.
                              // For now, just clear it.
                            }}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-white/70">
                            Message to Lead
                          </label>
                          <div className="relative">
                            <textarea
                              value={proposalMessage}
                              onChange={(e) =>
                                setProposalMessage(e.target.value)
                              }
                              placeholder="Write a message to accompany your proposal..."
                              className="w-full min-h-[120px] rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-all resize-none"
                            />
                            <button
                              onClick={handleGenerateProposalMessage}
                              disabled={
                                isGeneratingProposalMessage ||
                                !proposalAttachment
                              }
                              className="absolute bottom-3 right-3 p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 text-purple-300 hover:text-purple-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                              title="Generate message with AI"
                            >
                              {isGeneratingProposalMessage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={handleSendProposalViaAttachment}
                          disabled={
                            emailMutation.isPending || !proposalMessage.trim()
                          }
                          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] text-sm font-semibold text-white shadow-xl hover:opacity-90 transition-all disabled:opacity-40"
                        >
                          {emailMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send size={16} />
                              Send Proposal via Email
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <style>{`
                      .proposal-content ::selection {
                        background-color: rgba(34, 197, 94, 0.4) !important;
                        color: inherit;
                      }
                      .proposal-content ::-moz-selection {
                        background-color: rgba(34, 197, 94, 0.4) !important;
                        color: inherit;
                      }
                      @keyframes fadeIn {
                        from {
                          opacity: 0;
                          transform: translateX(-50%) translateY(-5px);
                        }
                        to {
                          opacity: 1;
                          transform: translateX(-50%) translateY(0);
                        }
                      }
                    `}</style>
                    {proposalContent && (
                      <div
                        ref={proposalContentRef}
                        className="proposal-content rounded-2xl bg-white/10 p-6 text-white/90 relative"
                        onClick={handleProposalClick}
                      >
                        {isProposalEditable ? (
                          <div className="w-full min-h-[400px] [&_.ql-toolbar]:!bg-white/10 [&_.ql-toolbar]:!border-white/20 [&_.ql-toolbar_.ql-stroke]:!stroke-white/80 [&_.ql-toolbar_.ql-fill]:!fill-white/80 [&_.ql-toolbar_.ql-picker-label]:!text-white/80 [&_.ql-toolbar_button:hover]:!bg-white/20 [&_.ql-container]:!bg-white/5 [&_.ql-container]:!border-white/20 [&_.ql-editor]:!text-white/90 [&_.ql-editor]:!min-h-[400px] [&_.ql-editor_p]:!text-white/90 [&_.ql-editor_h1]:!text-white [&_.ql-editor_h2]:!text-white [&_.ql-editor_h3]:!text-white [&_.ql-editor_strong]:!text-white [&_.ql-snow_.ql-picker]:!text-white/80">
                            <RichTextEditor
                              value={proposalHtmlContent}
                              onChange={(html) => {
                                setProposalHtmlContent(html);
                                setProposalContent(htmlToMarkdown(html));
                              }}
                              placeholder="Edit your proposal here..."
                              height="400px"
                              toolbar={true}
                            />
                          </div>
                        ) : (
                          <div
                            className="prose prose-invert prose-sm max-w-none cursor-text select-text"
                            onMouseUp={handleProposalSelection}
                            onKeyUp={handleProposalSelection}
                          >
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => (
                                  <h1
                                    className="text-2xl font-bold text-white mt-6 mb-4 first:mt-0"
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className="text-xl font-bold text-white mt-5 mb-3"
                                    {...props}
                                  />
                                ),
                                h3: ({ node, ...props }) => (
                                  <h3
                                    className="text-lg font-semibold text-white mt-4 mb-2"
                                    {...props}
                                  />
                                ),
                                h4: ({ node, ...props }) => (
                                  <h4
                                    className="text-base font-semibold text-white/90 mt-3 mb-2"
                                    {...props}
                                  />
                                ),
                                p: ({ node, ...props }) => (
                                  <p
                                    className="text-white/80 mb-3 leading-relaxed"
                                    {...props}
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong
                                    className="text-white font-semibold"
                                    {...props}
                                  />
                                ),
                                em: ({ node, ...props }) => (
                                  <em
                                    className="text-white/90 italic"
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className="list-disc list-inside ml-4 mb-3 space-y-1.5"
                                    {...props}
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    className="list-decimal list-inside ml-4 mb-3 space-y-1.5"
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="text-white/80" {...props} />
                                ),
                                hr: ({ node, ...props }) => (
                                  <hr
                                    className="border-white/20 my-4"
                                    {...props}
                                  />
                                ),
                                blockquote: ({ node, ...props }) => (
                                  <blockquote
                                    className="border-l-4 border-white/30 pl-4 my-3 italic text-white/70"
                                    {...props}
                                  />
                                ),
                                code: ({ node, ...props }: any) => {
                                  const codeProps = props as any;
                                  const isInline = props.inline !== false;
                                  return isInline ? (
                                    <code
                                      className="bg-white/20 px-1.5 py-0.5 rounded text-white/90 text-xs font-mono"
                                      {...codeProps}
                                    />
                                  ) : (
                                    <code
                                      className="block bg-white/10 p-3 rounded text-white/90 text-xs font-mono overflow-x-auto mb-3"
                                      {...codeProps}
                                    />
                                  );
                                },
                                pre: ({ node, ...props }) => (
                                  <pre
                                    className="bg-white/10 p-3 rounded text-white/90 text-xs font-mono overflow-x-auto mb-3"
                                    {...props}
                                  />
                                ),
                              }}
                            >
                              {proposalContent}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Edit with AI Button - appears when text is selected */}
                        {showEditWithAI &&
                          editWithAIPosition &&
                          selectedText &&
                          !selectedProposal && (
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                // Prevent the mousedown from clearing the selection
                                e.preventDefault();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleEditWithAI();
                              }}
                              className="absolute flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-semibold text-white shadow-xl transition-all hover:opacity-90 hover:scale-105 border border-white/20"
                              style={{
                                top: `${editWithAIPosition.top}px`,
                                left: `${editWithAIPosition.left}px`,
                                transform: "translateX(-50%)",
                                animation: "fadeIn 0.2s ease-in",
                                zIndex: 9999,
                                pointerEvents: "auto",
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                              Edit with AI
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                ) : showProposalList ||
                  (!proposalContent && sentProposals.length > 0) ? (
                  <div className="flex w-full flex-1 flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <h3 className="text-sm font-semibold text-white">
                        Previously Sent Proposals ({sentProposals.length})
                      </h3>
                    </div>

                    {isProposalsLoading ? (
                      <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
                      </div>
                    ) : sentProposals.length === 0 ? (
                      <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                        <div className="flex flex-col items-center gap-3">
                          <Sparkles className="h-12 w-12 text-white/30" />
                          <p>No proposals sent yet</p>
                          <p className="text-xs text-white/50">
                            Click "Generate with AI" to create your first
                            proposal
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 px-1">
                        {sentProposals.map((proposal) => (
                          <div
                            key={proposal._id}
                            onClick={() => {
                              // Set proposal content
                              setProposalContent(proposal.content);
                              setProposalHtmlContent(
                                proposal.htmlContent || ""
                              );
                              setShowProposalList(false);
                              setSelectedProposal(proposal);
                              // Enforce view-only mode for sent proposals
                              setIsProposalEditable(false);
                            }}
                            className="group cursor-pointer rounded-lg border border-white/20 bg-white/5 p-4 transition hover:bg-white/10 hover:border-white/30"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white truncate">
                                  Proposal sent by {proposal.sentBy.name}
                                </p>
                                <p className="text-xs text-white/60 mt-0.5">
                                  {new Date(proposal.sentAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                              {proposal.emailSent && (
                                <span className="flex-shrink-0 text-[10px] px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
                                  Email Sent
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/70 line-clamp-2">
                              {proposal.content.substring(0, 150)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex w-full flex-1 items-center justify-center py-20 text-center text-white/70">
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="h-12 w-12 text-white/30" />
                      <p>Click "Generate with AI" to create a proposal</p>
                      <p className="text-xs text-white/50">
                        The proposal will be generated based on all
                        communication history
                        <br />
                        (SMS, emails, WhatsApp, phone calls, meeting notes) and
                        knowledge base
                      </p>
                    </div>
                  </div>
                )}

                {/* Edit with AI Modal */}
                {showEditAIModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-lg bg-[#1a1a1a] border border-white/20 p-6 max-w-2xl w-full mx-4">
                      <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
                        Edit with AI
                      </h3>
                      <p className="text-xs text-white/70 mb-4">
                        Selected text:{" "}
                        <span className="text-white/90 italic">
                          "{lockedSelectedText.substring(0, 100)}
                          {lockedSelectedText.length > 100 ? "..." : ""}"
                        </span>
                      </p>
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-white/90 mb-2">
                          How would you like AI to rewrite this section?
                        </label>
                        <textarea
                          value={editAIQuery}
                          onChange={(e) => setEditAIQuery(e.target.value)}
                          placeholder="e.g., Make it more professional, add more technical details, simplify the language..."
                          className="w-full min-h-[120px] rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors resize-none"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditAIModal(false);
                            setEditAIQuery("");
                            setLockedSelectedText("");
                          }}
                          disabled={isEditingWithAI}
                          className="rounded-lg border border-white/30 px-4 py-2 text-xs text-white transition hover:bg-white/10 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleEditAI}
                          disabled={isEditingWithAI || !editAIQuery.trim()}
                          className="rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                        >
                          {isEditingWithAI ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Editing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Edit with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
                    ? getSenderName(email.userId)
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
              {/* Attachments Display */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 mb-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] text-white/90 border border-white/20"
                    >
                      <span className="truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                multiple
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />

              <div
                className={`flex gap-2 bg-white/10 px-4 py-3 mx-1 mb-1 transition-all duration-200 relative ${
                  isEmailEditorExpanded
                    ? "rounded-2xl items-end"
                    : "rounded-2xl items-center"
                }`}
              >
                {/* Rich Text Editor */}
                <div className="flex-1 relative" ref={emailEditorRef}>
                  <style>{`
                    .email-editor-content ::selection {
                      background-color: rgba(34, 197, 94, 0.4) !important;
                      color: inherit;
                    }
                    .email-editor-content ::-moz-selection {
                      background-color: rgba(34, 197, 94, 0.4) !important;
                      color: inherit;
                    }
                  `}</style>
                  <div className="email-editor-content">
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

                  {/* Edit with AI Button for Email - appears when text is selected */}
                  {showEmailEditWithAI &&
                    emailEditWithAIPosition &&
                    emailSelectedText && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleEditEmailWithAI();
                        }}
                        className="absolute flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-semibold text-white shadow-xl transition-all hover:opacity-90 hover:scale-105 border border-white/20"
                        style={{
                          top: `${emailEditWithAIPosition.top}px`,
                          left: `${emailEditWithAIPosition.left}px`,
                          transform: "translateX(-50%)",
                          animation: "fadeIn 0.2s ease-in",
                          zIndex: 9999,
                          pointerEvents: "auto",
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                        Edit with AI
                      </button>
                    )}
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
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files"
                  >
                    <Paperclip className="h-4 w-4 text-white" />
                  </button>
                  {attachments.length > 0 ? (
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer shadow-lg"
                      onClick={handleSendEmail}
                      disabled={
                        !emailAddress ||
                        (!emailInput.trim() && attachments.length === 0) ||
                        emailMutation.isPending
                      }
                    >
                      {emailMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send size={14} />
                          Send Proposal
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer shadow-lg"
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
                  )}
                </div>
              </div>

              {emailSendError && (
                <p className="mt-2 text-xs text-red-300 mx-1 mb-1">
                  {emailSendError}
                </p>
              )}
            </div>

            {/* Email Edit with AI Modal */}
            {showEmailEditAIModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="rounded-lg bg-[#1a1a1a] border border-white/20 p-6 max-w-2xl w-full mx-4">
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-2">
                    Edit with AI
                  </h3>
                  <p className="text-xs text-white/70 mb-4">
                    Selected text:{" "}
                    <span className="text-white/90 italic">
                      "{emailLockedSelectedText.substring(0, 100)}
                      {emailLockedSelectedText.length > 100 ? "..." : ""}"
                    </span>
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-white/90 mb-2">
                      How would you like AI to rewrite this section?
                    </label>
                    <textarea
                      value={emailEditAIQuery}
                      onChange={(e) => setEmailEditAIQuery(e.target.value)}
                      placeholder="e.g., Make it more professional, add more technical details, simplify the language..."
                      className="w-full min-h-[120px] rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/40 transition-colors resize-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmailEditAIModal(false);
                        setEmailEditAIQuery("");
                        setEmailLockedSelectedText("");
                      }}
                      disabled={isEditingEmailWithAI}
                      className="rounded-lg border border-white/30 px-4 py-2 text-xs text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleEmailEditAI}
                      disabled={
                        isEditingEmailWithAI || !emailEditAIQuery.trim()
                      }
                      className="rounded-lg bg-gradient-to-br from-[#3E65B4] to-[#68B3B7] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isEditingEmailWithAI ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Editing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Edit with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                              {isOutbound
                                ? getSenderName(message.userId)
                                : displayName}
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
                      smsTextareaRef.current.style.height = "24px";
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
                  style={{
                    minHeight: "24px",
                    maxHeight: "60px",
                    paddingTop: "2px",
                    paddingBottom: "2px",
                  }}
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
        ) : activeTab === "Meetings" ? (
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
