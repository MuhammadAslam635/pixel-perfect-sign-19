import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { getUserData } from "@/utils/authHelpers";
import {
  WhatsAppCredential,
  whatsappService,
} from "@/services/whatsapp.service";
import { mailgunService } from "@/services/mailgun.service";
import {
  facebookService,
  type FacebookStatusResponse,
  type FacebookRedirectResponse,
  type RefreshPagesResponse,
  type BusinessAccountsResponse,
  type SelectPagePayload,
  type SelectBusinessAccountPayload,
  type FacebookAdAccount,
  type FacebookIntegration,
} from "@/services/facebook.service";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminGlobalIntegrationsTab } from "@/components/admin/integrations/AdminGlobalIntegrationsTab";
import facebookLogo from "@/assets/facebook-icon.svg";
import whatsappLogo from "@/assets/whatsappIcon.png";
import mailgunLogo from "@/assets/mailgun-icon.png";

interface IntegrationResponse {
  success: boolean;
  integration: {
    _id: string | null;
    userId: string;
    providerName: string;
    isConnected: boolean;
    connectionData?: {
      metadata?: {
        developerToken?: string;
        googleCustomerId?: string;
        tenantId?: string;
      };
      providerUserEmail?: string;
      providerUserName?: string;
      expiryDate?: string;
    };
  };
}

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export const IntegrationsTab = () => {
  const [googleAdsToken, setGoogleAdsToken] = useState("");
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [googleCustomers, setGoogleCustomers] = useState<
    { id: string; resourceName: string }[]
  >([]);
  const [selectedGoogleCustomerId, setSelectedGoogleCustomerId] =
    useState<string>("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [selectedBusinessAccountId, setSelectedBusinessAccountId] =
    useState<string>("");
  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([]);
  const [isLoadingAdAccounts, setIsLoadingAdAccounts] = useState(false);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>("");
  const [whatsappConnections, setWhatsAppConnections] = useState<
    WhatsAppCredential[]
  >([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [whatsappForm, setWhatsAppForm] = useState({
    apiKey: "",
    phoneNumber: "",
    webhookSecret: "",
  });
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    phoneNumberId: string | null;
  }>({ open: false, phoneNumberId: null });
  const [isDisconnectingWhatsApp, setIsDisconnectingWhatsApp] = useState(false);
  const [mailgunConfig, setMailgunConfig] = useState({
    apiKey: "",
    domain: "",
    apiUrl: "",
    webhookSigningKey: "",
  });
  const [isLoadingMailgun, setIsLoadingMailgun] = useState(false);
  const [isSavingMailgun, setIsSavingMailgun] = useState(false);
  const [isValidatingMailgun, setIsValidatingMailgun] = useState(false);
  const [showMailgunForm, setShowMailgunForm] = useState(false);
  const [mailgunValidated, setMailgunValidated] = useState(false);
  const [suggestedEmail, setSuggestedEmail] = useState<string>("");
  const [isSuggestingEmail, setIsSuggestingEmail] = useState(false);
  const [existingEmail, setExistingEmail] = useState<string>("");
  const [emailPrefix, setEmailPrefix] = useState<string>("");
  const [isValidatingWhatsApp, setIsValidatingWhatsApp] = useState(false);
  const [whatsappValidated, setWhatsappValidated] = useState(false);
  const [isMicrosoftStatusLoading, setIsMicrosoftStatusLoading] =
    useState(false);
  const [isMicrosoftActionLoading, setIsMicrosoftActionLoading] =
    useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftIntegration, setMicrosoftIntegration] = useState<
    IntegrationResponse["integration"] | null
  >(null);
  const [mailgunEnvCredentials, setMailgunEnvCredentials] = useState<any>(null);
  const [mailgunEnvValidation, setMailgunEnvValidation] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [isValidatingMailgunEnv, setIsValidatingMailgunEnv] = useState(false);

  const queryClient = useQueryClient();
  const user = getUserData();

  // Facebook status query
  const {
    data: facebookStatus,
    isLoading: isFacebookStatusLoading,
    refetch: refetchFacebookStatus,
  } = useQuery<FacebookStatusResponse>({
    queryKey: ["facebook-integration", user?._id],
    queryFn: () => facebookService.getStatus(),
    enabled: !!user,
    staleTime: 30000,
    retry: 1,
  });

  // Facebook connect mutation
  const {
    mutateAsync: fetchFacebookRedirectUrl,
    isPending: isFacebookLoading,
  } = useMutation<FacebookRedirectResponse, Error>({
    mutationFn: () => facebookService.getRedirectUrl(),
    onError: (error: unknown) => {
      console.error("Facebook connect error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to initiate Facebook connection.");
    },
  });

  // Facebook disconnect mutation
  const {
    mutateAsync: disconnectFacebook,
    isPending: isDisconnectingFacebook,
  } = useMutation<unknown, Error>({
    mutationFn: () => facebookService.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
    },
  });

  // Facebook select page mutation
  const { mutateAsync: selectPage, isPending: isSelectingPage } = useMutation<
    unknown,
    Error,
    SelectPagePayload
  >({
    mutationFn: (payload: SelectPagePayload) =>
      facebookService.selectPage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
    },
  });

  // Facebook refresh pages mutation
  const { mutateAsync: refreshPages, isPending: isRefreshingPages } =
    useMutation<RefreshPagesResponse, Error>({
      mutationFn: () => facebookService.refreshPages(),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["facebook-integration", user?._id],
        });
      },
    });

  // Facebook business accounts query
  const {
    data: businessAccountsData,
    isLoading: isBusinessAccountsLoading,
    refetch: refetchBusinessAccounts,
  } = useQuery<BusinessAccountsResponse>({
    queryKey: ["facebook-business-accounts", user?._id],
    queryFn: () => facebookService.getBusinessAccounts(),
    enabled: !!user,
    staleTime: 30000,
    retry: 1,
  });

  // Facebook select business account mutation
  const {
    mutateAsync: selectBusinessAccount,
    isPending: isSelectingBusinessAccount,
  } = useMutation<unknown, Error, SelectBusinessAccountPayload>({
    mutationFn: (payload: SelectBusinessAccountPayload) =>
      facebookService.selectBusinessAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facebook-integration", user?._id],
      });
      queryClient.invalidateQueries({
        queryKey: ["facebook-business-accounts", user?._id],
      });
    },
  });

  // Facebook select ad account mutation
  const { mutateAsync: selectAdAccount, isPending: isSelectingAdAccount } =
    useMutation<unknown, Error, { adAccountId: string }>({
      mutationFn: (payload: { adAccountId: string }) =>
        facebookService.selectAdAccount(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["facebook-integration", user?._id],
        });
      },
    });

  const isAdmin = user?.role === "Admin";
  const canManageWhatsApp =
    user?.role === "Company" || user?.role === "CompanyAdmin";
  const canManageMailgun = user?.role === "Company";
  const canManageMicrosoft =
    user?.role === "Company" || user?.role === "CompanyAdmin";

  // Global integrations that are managed separately for admins
  const globalIntegrations = ["deepgram", "openai", "twilio", "elevenlabs"];
  const canManageGlobalIntegrations = user?.role === "Admin";

  const facebookConnected = facebookStatus?.connected ?? false;
  const facebookIntegration = facebookStatus?.integration;

  const resetWhatsAppForm = () => {
    setWhatsAppForm({
      apiKey: "",
      phoneNumber: "",
      webhookSecret: "",
    });
    setWhatsappValidated(false);
  };

  const fetchWhatsAppConnections = async () => {
    if (!user?.token) return;

    setIsLoadingWhatsApp(true);
    try {
      const response = await whatsappService.getConnections();
      if (response?.success) {
        setWhatsAppConnections(response.credentials || []);
      }
    } catch (error: unknown) {
      console.error("Error loading WhatsApp connections:", error);
      toast({
        title: "Error",
        description: "Failed to load WhatsApp connections.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingWhatsApp(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const fetchMicrosoftStatus = async () => {
    if (!user?.token) {
      setMicrosoftConnected(false);
      setMicrosoftIntegration(null);
      return;
    }

    setIsMicrosoftStatusLoading(true);
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/microsoft/connection-check`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        setMicrosoftConnected(Boolean(response.data.connected));
        setMicrosoftIntegration(response.data.integration || null);
      } else {
        setMicrosoftConnected(false);
        setMicrosoftIntegration(null);
      }
    } catch (error) {
      setMicrosoftConnected(false);
      setMicrosoftIntegration(null);
    } finally {
      setIsMicrosoftStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchMicrosoftStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const primaryWhatsAppConnection = whatsappConnections[0] || null;

  const handleWhatsAppInputChange = (
    field: keyof typeof whatsappForm,
    value: string
  ) => {
    setWhatsAppForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWhatsAppConnect = async () => {
    if (!canManageWhatsApp) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or company admins can manage WhatsApp settings.",
        variant: "destructive",
      });
      return;
    }

    // Validate required field
    if (!whatsappForm.apiKey) {
      toast({
        title: "Missing information",
        description: "Please enter your Wasender API key.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingWhatsApp(true);
    try {
      const payload = {
        apiKey: whatsappForm.apiKey.trim(),
        phoneNumber: whatsappForm.phoneNumber.trim() || undefined,
        webhookSecret: whatsappForm.webhookSecret.trim() || undefined,
      };

      const response = await whatsappService.connect(payload);

      if (response.success) {
        toast({
          title: "WhatsApp connected",
          description: response.message,
        });
        resetWhatsAppForm();
        setShowWhatsAppForm(false);
        fetchWhatsAppConnections();
      }
    } catch (error: unknown) {
      console.error("Error connecting WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to connect WhatsApp. Please verify your details.",
        variant: "destructive",
      });
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleToggleWhatsAppForm = () => {
    if (!canManageWhatsApp) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or company admins can manage WhatsApp settings.",
        variant: "destructive",
      });
      return;
    }

    if (!showWhatsAppForm) {
      if (primaryWhatsAppConnection) {
        setWhatsAppForm({
          apiKey: "", // Don't populate sensitive API key
          phoneNumber: primaryWhatsAppConnection.phoneNumber || "",
          webhookSecret: "", // Don't populate sensitive webhook secret
        });
      } else {
        resetWhatsAppForm();
      }
    }

    setShowWhatsAppForm((prev) => !prev);
  };

  const requestWhatsAppDisconnect = () => {
    if (!canManageWhatsApp) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or company admins can manage WhatsApp settings.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setDisconnectDialog({ open: true, phoneNumberId: "wasender" });
  };

  const handleWhatsAppDisconnect = async () => {
    if (!disconnectDialog.phoneNumberId) {
      return;
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      setDisconnectDialog({ open: false, phoneNumberId: null });
      return;
    }

    try {
      setIsDisconnectingWhatsApp(true);
      await whatsappService.disconnect();

      toast({
        title: "Disconnected",
        description: "WhatsApp disconnected successfully.",
      });
      fetchWhatsAppConnections();
    } catch (error: unknown) {
      console.error("Error disconnecting WhatsApp:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp number.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnectingWhatsApp(false);
      setDisconnectDialog({ open: false, phoneNumberId: null });
    }
  };

  const {
    data: integrationData,
    isLoading: isIntegrationLoading,
    refetch,
  } = useQuery<IntegrationResponse>({
    queryKey: ["google-integration", user?._id],
    queryFn: async () => {
      const response = await axios.get(
        `${APP_BACKEND_URL}/integration/google`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      return response.data;
    },
    enabled: !!user && !globalIntegrations.includes("google"),
    staleTime: 0,
  });

  const googleConnected = integrationData?.integration?.isConnected ?? false;

  useEffect(() => {
    if (
      integrationData?.integration?.connectionData?.metadata?.developerToken
    ) {
      setGoogleAdsToken(
        integrationData.integration.connectionData.metadata.developerToken
      );
    }
    if (
      integrationData?.integration?.connectionData?.metadata?.googleCustomerId
    ) {
      setSelectedGoogleCustomerId(
        integrationData.integration.connectionData.metadata.googleCustomerId
      );
    }
  }, [integrationData]);

  useEffect(() => {
    if (facebookIntegration?.pageId) {
      setSelectedPageId(facebookIntegration.pageId);
    }
    if (facebookIntegration?.businessAccountId) {
      setSelectedBusinessAccountId(facebookIntegration.businessAccountId);
      // Fetch ad accounts when business account is loaded
      fetchAdAccounts(facebookIntegration.businessAccountId);
    } else if (facebookIntegration) {
      // Even if no business account, try to fetch ad accounts directly
      // Ad accounts can be accessed via /me/adaccounts without business account
      fetchAdAccounts();
    }
    // Load saved ad account ID from integration
    if (facebookIntegration?.adAccountId) {
      setSelectedAdAccountId(facebookIntegration.adAccountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facebookIntegration]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    let shouldClear = false;

    if (success) {
      toast({
        title: "Success",
        description: success,
      });
      refetchFacebookStatus();
      shouldClear = true;
    }

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      shouldClear = true;
    }

    const microsoftParam = params.get("microsoft");
    const microsoftReason = params.get("reason");

    if (microsoftParam === "connected") {
      toast({
        title: "Microsoft connected",
        description: "Your Microsoft account is now linked.",
      });
      fetchMicrosoftStatus();
      shouldClear = true;
    }

    if (microsoftParam === "error") {
      toast({
        title: "Microsoft connection failed",
        description:
          microsoftReason ||
          "We could not connect to Microsoft. Please try again.",
        variant: "destructive",
      });
      shouldClear = true;
    }

    if (shouldClear) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchFacebookStatus]);

  const handleMicrosoftConnect = async () => {
    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    if (!canManageMicrosoft) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or admins can manage Microsoft settings.",
        variant: "destructive",
      });
      return;
    }

    setIsMicrosoftActionLoading(true);
    try {
      const response = await axios.get(`${APP_BACKEND_URL}/microsoft/auth`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (response.data?.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("No Microsoft auth URL returned from server");
      }
    } catch (error: unknown) {
      console.error("Error getting Microsoft auth URL:", error);
      toast({
        title: "Error",
        description:
          "Failed to initiate Microsoft connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMicrosoftActionLoading(false);
    }
  };

  const handleMicrosoftDisconnect = async () => {
    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    if (!canManageMicrosoft) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or admins can manage Microsoft settings.",
        variant: "destructive",
      });
      return;
    }

    setIsMicrosoftActionLoading(true);
    try {
      await axios.delete(`${APP_BACKEND_URL}/microsoft/disconnect`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      toast({
        title: "Microsoft disconnected",
        description: "Your Microsoft account has been disconnected.",
      });
      fetchMicrosoftStatus();
    } catch (error: unknown) {
      console.error("Error disconnecting Microsoft:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Microsoft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMicrosoftActionLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    if (!user?._id || !user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/callbacks/google/auth-url`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success && response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        throw new Error("No auth URL returned from server");
      }
    } catch (error: unknown) {
      console.error("Error getting Google auth URL:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Google connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.delete(
        `${APP_BACKEND_URL}/google/disconnect`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Google disconnected",
          description:
            "Your Google account has been successfully disconnected.",
        });
        refetch();
      }
    } catch (error: unknown) {
      console.error("Error disconnecting Google:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Google account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGoogleAdsToken = async () => {
    if (!user?._id || !user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingToken(true);

      const response = await axios.patch(
        `${APP_BACKEND_URL}/integration/google/metadata`,
        {
          userId: user._id,
          metadata: {
            developerToken: googleAdsToken,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data.success) {
        toast({
          title: "Token saved",
          description: "Your Google Ads token has been updated successfully.",
        });
        refetch();
      } else {
        throw new Error("Failed to save token");
      }
    } catch (error: unknown) {
      console.error("Error saving Google Ads token:", error);
      toast({
        title: "Error",
        description: "Failed to save Google Ads token. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToken(false);
    }
  };

  const fetchGoogleCustomers = async () => {
    if (!user?.token) return;
    setIsLoadingCustomers(true);
    try {
      const resp = await axios.get(
        `${APP_BACKEND_URL}/integration/google/customers`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (resp.data?.success && Array.isArray(resp.data.customers)) {
        setGoogleCustomers(resp.data.customers);
      } else {
        setGoogleCustomers([]);
      }
    } catch (e: unknown) {
      setGoogleCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (googleConnected && googleAdsToken) {
      fetchGoogleCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleConnected, googleAdsToken]);

  const handleSaveSelectedCustomer = async (customerId: string) => {
    if (!user?._id || !user?.token) return;
    try {
      await axios.patch(
        `${APP_BACKEND_URL}/integration/google/metadata`,
        { userId: user._id, metadata: { googleCustomerId: customerId } },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      toast({ title: "Saved", description: "Google customer selected." });
      refetch();
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: "Failed to save Google customer.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookConnect = async () => {
    try {
      const data = await fetchFacebookRedirectUrl();
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Error",
          description: "No redirect URL returned from server.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error initiating Facebook login:", error);
      toast({
        title: "Error",
        description: "Failed to initiate Facebook login. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFacebookDisconnect = async () => {
    try {
      await disconnectFacebook();
      toast({
        title: "Facebook disconnected",
        description:
          "Your Facebook account has been successfully disconnected.",
      });
      setSelectedPageId("");
    } catch (error: unknown) {
      console.error("Error disconnecting Facebook:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Facebook account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePageSelect = async (pageId: string) => {
    try {
      setSelectedPageId(pageId);
      await selectPage({ pageId });
      toast({
        title: "Page selected",
        description: "Facebook page has been selected successfully.",
      });
    } catch (error: unknown) {
      console.error("Error selecting page:", error);
      toast({
        title: "Error",
        description: "Failed to select page. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchAdAccounts = useCallback(
    async (businessAccountId?: string) => {
      if (!user?.token) return;
      setIsLoadingAdAccounts(true);
      try {
        const response = await facebookService.getAdAccounts(businessAccountId);
        if (response?.success) {
          setAdAccounts(response.data || []);
          // Auto-select first ad account if available
          if (response.data && response.data.length > 0) {
            setSelectedAdAccountId((prev) => prev || response.data[0].id);
          }
          // Show message if no ad accounts found
        }
      } catch (error: unknown) {
        console.error("Error loading ad accounts:", error);
        setAdAccounts([]);
        // Show error toast to inform user
        toast({
          title: "Unable to fetch ad accounts",
          description:
            error instanceof Error
              ? error.message
              : "Please ensure you have granted ads_read permission and reconnected your Facebook account.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAdAccounts(false);
      }
    },
    [user?.token]
  );

  const handleRefreshPages = async () => {
    try {
      await refreshPages();
      toast({
        title: "Pages refreshed",
        description: "Facebook pages list has been refreshed.",
      });
    } catch (error: unknown) {
      console.error("Error refreshing pages:", error);
      toast({
        title: "Error",
        description: "Failed to refresh pages. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBusinessAccountSelect = async (businessAccountId: string) => {
    try {
      setSelectedBusinessAccountId(businessAccountId);
      await selectBusinessAccount({ businessAccountId });
      toast({
        title: "Business account selected",
        description:
          "Facebook business account has been selected successfully.",
      });
      // Fetch ad accounts for the selected business account
      fetchAdAccounts(businessAccountId);
    } catch (error: unknown) {
      console.error("Error selecting business account:", error);
      toast({
        title: "Error",
        description: "Failed to select business account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshBusinessAccounts = async () => {
    try {
      await refetchBusinessAccounts();
      toast({
        title: "Business accounts refreshed",
        description: "Facebook business accounts list has been refreshed.",
      });
    } catch (error: unknown) {
      console.error("Error refreshing business accounts:", error);
      toast({
        title: "Error",
        description: "Failed to refresh business accounts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdAccountSelect = async (adAccountId: string) => {
    try {
      setSelectedAdAccountId(adAccountId);
      await selectAdAccount({ adAccountId });
      toast({
        title: "Ad account selected",
        description: "Facebook ad account has been selected successfully.",
      });
    } catch (error: unknown) {
      console.error("Error selecting ad account:", error);
      toast({
        title: "Error",
        description: "Failed to select ad account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mailgun configuration functions
  const fetchMailgunConfig = async () => {
    if (!user?.token || !canManageMailgun) return;

    setIsLoadingMailgun(true);
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/integration/mailgun`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (
        response.data?.success &&
        response.data?.integration?.connectionData?.metadata
      ) {
        const config = response.data.integration.connectionData.metadata;
        setMailgunConfig({
          apiKey: config.apiKey || "",
          domain: config.domain || "",
          apiUrl: config.apiUrl || "",
          webhookSigningKey: config.webhookSigningKey || "",
        });
        setMailgunValidated(response.data.integration.isConnected || false);

        // Set existing email if available
        if (response.data?.existingEmail) {
          setExistingEmail(response.data.existingEmail);
          // Extract prefix from existing email if domain matches
          if (
            config.domain &&
            response.data.existingEmail.includes(`@${config.domain}`)
          ) {
            const prefix = response.data.existingEmail.split(
              `@${config.domain}`
            )[0];
            setEmailPrefix(prefix);
          }
        }
      }
    } catch (error: any) {
      // If 404, integration doesn't exist yet - that's okay
      if (error?.response?.status !== 404) {
        console.error("Error loading Mailgun config:", error);
        toast({
          title: "Error",
          description: "Failed to load Mailgun configuration.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoadingMailgun(false);
    }
  };

  useEffect(() => {
    if (canManageMailgun) {
      checkMailgunEnvCredentials();
      fetchMailgunConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, canManageMailgun]);

  const checkMailgunEnvCredentials = async () => {
    if (!user?.token || !canManageMailgun) return;

    try {
      const response = await mailgunService.checkEnvCredentials();
      if (response.success && response.envCredentials?.mailgun) {
        setMailgunEnvCredentials(response.envCredentials.mailgun);

        // If env credentials are configured, validate them
        if (response.envCredentials.mailgun.configured) {
          try {
            const validationResponse =
              await mailgunService.validateEnvCredentials();
            if (validationResponse.success) {
              setMailgunEnvValidation(validationResponse.validation);
              // If valid, don't show form initially
              if (validationResponse.validation.valid) {
                setShowMailgunForm(false);
              }
            }
          } catch (error) {
            console.error("Error validating Mailgun env credentials:", error);
          }
        }
      }
    } catch (error: any) {
      console.error("Error checking Mailgun env credentials:", error);
      // If check fails, show form as fallback
    }
  };

  const handleValidateMailgunEnvCredentials = async () => {
    if (!user?.token || !canManageMailgun) return;

    try {
      setIsValidatingMailgunEnv(true);
      const response = await mailgunService.validateEnvCredentials();

      if (response.success) {
        setMailgunEnvValidation(response.validation);

        if (response.validation.valid) {
          toast({
            title: "Success",
            description: response.validation.message,
          });
          setShowMailgunForm(false);
        } else {
          toast({
            title: "Validation Failed",
            description: response.validation.message,
            variant: "destructive",
          });
          setShowMailgunForm(true);
        }
      }
    } catch (error: any) {
      console.error("Error validating Mailgun env credentials:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to validate Mailgun env credentials.",
        variant: "destructive",
      });
    } finally {
      setIsValidatingMailgunEnv(false);
    }
  };

  const handleMailgunInputChange = (
    field: keyof typeof mailgunConfig,
    value: string
  ) => {
    setMailgunConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleValidateMailgunConfig = async () => {
    if (!canManageMailgun) {
      toast({
        title: "Access restricted",
        description: "Only company owners can manage Mailgun settings.",
        variant: "destructive",
      });
      return;
    }

    const requiredFields: Array<keyof typeof mailgunConfig> = [
      "apiKey",
      "domain",
      "apiUrl",
      "webhookSigningKey",
    ];

    for (const field of requiredFields) {
      if (!mailgunConfig[field]) {
        toast({
          title: "Missing information",
          description: "Please fill in all required Mailgun fields.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingMailgun(true);
    try {
      const response = await axios.post(
        `${APP_BACKEND_URL}/integration/mailgun/validate`,
        {
          apiKey: mailgunConfig.apiKey.trim(),
          domain: mailgunConfig.domain.trim(),
          apiUrl: mailgunConfig.apiUrl.trim(),
          webhookSigningKey: mailgunConfig.webhookSigningKey.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        setMailgunValidated(true);
        toast({
          title: "Configuration Validated",
          description:
            response.data.message ||
            "Mailgun configuration validated successfully!",
        });

        // Suggest unique email address after validation
        setIsSuggestingEmail(true);
        try {
          const suggestResponse = await mailgunService.suggestEmail(
            mailgunConfig.domain.trim(),
            emailPrefix.trim() || undefined
          );
          if (
            suggestResponse?.success &&
            suggestResponse?.data?.suggestedEmail
          ) {
            setSuggestedEmail(suggestResponse.data.suggestedEmail);
          }
        } catch (suggestError: any) {
          console.error("Error suggesting email:", suggestError);
          // Don't show error toast, just log it
        } finally {
          setIsSuggestingEmail(false);
        }
      }
    } catch (error: any) {
      console.error("Error validating Mailgun config:", error);
      setMailgunValidated(false);
      toast({
        title: "Validation Failed",
        description: sanitizeErrorMessage(
          error,
          "Failed to validate Mailgun configuration. Please check your credentials."
        ),
        variant: "destructive",
      });
    } finally {
      setIsValidatingMailgun(false);
    }
  };

  const handleSaveMailgunConfig = async () => {
    if (!canManageMailgun) {
      toast({
        title: "Access restricted",
        description: "Only company owners can manage Mailgun settings.",
        variant: "destructive",
      });
      return;
    }

    if (!mailgunValidated) {
      toast({
        title: "Validation Required",
        description: "Please validate your configuration before saving.",
        variant: "destructive",
      });
      return;
    }

    const requiredFields: Array<keyof typeof mailgunConfig> = [
      "apiKey",
      "domain",
      "apiUrl",
      "webhookSigningKey",
    ];

    for (const field of requiredFields) {
      if (!mailgunConfig[field]) {
        toast({
          title: "Missing information",
          description: "Please fill in all required Mailgun fields.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    if (!suggestedEmail) {
      toast({
        title: "Email Required",
        description:
          "Please wait for email suggestion or enter a Mailgun email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMailgun(true);
    try {
      const response = await axios.post(
        `${APP_BACKEND_URL}/integration/mailgun/save`,
        {
          apiKey: mailgunConfig.apiKey.trim(),
          domain: mailgunConfig.domain.trim(),
          apiUrl: mailgunConfig.apiUrl.trim(),
          webhookSigningKey: mailgunConfig.webhookSigningKey.trim(),
          mailgunEmail: suggestedEmail.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        toast({
          title: "Mailgun configured",
          description:
            response.data.message ||
            "Mailgun configuration saved successfully.",
        });
        setShowMailgunForm(false);
        setMailgunValidated(false);
        setSuggestedEmail("");
        fetchMailgunConfig();
      }
    } catch (error: any) {
      console.error("Error saving Mailgun config:", error);
      toast({
        title: "Error",
        description: sanitizeErrorMessage(
          error,
          "Failed to save Mailgun configuration. Please verify your details."
        ),
        variant: "destructive",
      });
    } finally {
      setIsSavingMailgun(false);
    }
  };

  const handleToggleMailgunForm = () => {
    if (!canManageMailgun) {
      toast({
        title: "Access restricted",
        description: "Only company owners can manage Mailgun settings.",
        variant: "destructive",
      });
      return;
    }
    setShowMailgunForm((prev) => !prev);
    if (showMailgunForm) {
      // Reset validation when closing form
      setMailgunValidated(false);
      setSuggestedEmail("");
      setEmailPrefix("");
    }
  };

  const handleValidateWhatsAppConfig = async () => {
    if (!canManageWhatsApp) {
      toast({
        title: "Access restricted",
        description:
          "Only company owners or company admins can manage WhatsApp settings.",
        variant: "destructive",
      });
      return;
    }

    // Validate required field
    if (!whatsappForm.apiKey) {
      toast({
        title: "Missing information",
        description: "Please enter your Wasender API key.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsValidatingWhatsApp(true);
    try {
      const response = await whatsappService.validateConfig({
        apiKey: whatsappForm.apiKey.trim(),
      });

      if (response?.success) {
        setWhatsappValidated(true);
        toast({
          title: "Configuration Validated",
          description:
            response.message ||
            "WhatsApp configuration validated successfully!",
        });
      }
    } catch (error: any) {
      console.error("Error validating WhatsApp config:", error);
      setWhatsappValidated(false);
      toast({
        title: "Validation Failed",
        description: sanitizeErrorMessage(
          error,
          "Failed to validate WhatsApp configuration. Please check your credentials."
        ),
        variant: "destructive",
      });
    } finally {
      setIsValidatingWhatsApp(false);
    }
  };

  // Handle prefix change and auto-suggest email
  const handleEmailPrefixChange = async (prefix: string) => {
    setEmailPrefix(prefix);

    // If domain is set and prefix is provided, suggest email
    if (mailgunConfig.domain && prefix.trim() && mailgunValidated) {
      setIsSuggestingEmail(true);
      try {
        const suggestResponse = await mailgunService.suggestEmail(
          mailgunConfig.domain.trim(),
          prefix.trim()
        );
        if (suggestResponse?.success && suggestResponse?.data?.suggestedEmail) {
          setSuggestedEmail(suggestResponse.data.suggestedEmail);
        }
      } catch (suggestError: any) {
        console.error("Error suggesting email:", suggestError);
      } finally {
        setIsSuggestingEmail(false);
      }
    }
  };

  const mailgunConfigured =
    mailgunConfig.apiKey &&
    mailgunConfig.domain &&
    mailgunConfig.apiUrl &&
    mailgunConfig.webhookSigningKey;

  // For admin users, show global integrations instead of regular integrations
  if (isAdmin) {
    return <AdminGlobalIntegrationsTab />;
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
      <CardHeader className="border-b border-white/10 bg-white/[0.02] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CardTitle className="text-white text-base sm:text-lg font-semibold">
            Integrations
          </CardTitle>
          <CardDescription className="text-white/60 text-sm">
            Connect with your favourite tools and platforms.
          </CardDescription>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 p-6">
        <div>
          <h3 className="font-medium text-white text-sm sm:text-base">
            Connected services
          </h3>
          <p className="text-xs sm:text-sm text-white/60">
            Manage services connected to your account.
          </p>
        </div>

        <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <div className="w-[30px] h-[30px] rounded-lg bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs font-semibold flex items-center justify-center">
                  MS
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Microsoft
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {isMicrosoftStatusLoading
                    ? "Checking connection..."
                    : microsoftConnected
                    ? "Connected"
                    : "Connect Microsoft to sync contacts and calendars."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {microsoftConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
              {microsoftConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMicrosoftDisconnect}
                  disabled={isMicrosoftActionLoading}
                  className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm"
                >
                  {isMicrosoftActionLoading ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleMicrosoftConnect}
                  disabled={
                    isMicrosoftActionLoading ||
                    isMicrosoftStatusLoading ||
                    !canManageMicrosoft
                  }
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {!canManageMicrosoft
                    ? "Restricted"
                    : isMicrosoftActionLoading
                    ? "Opening..."
                    : "Connect"}
                </Button>
              )}
            </div>
          </div>

          {microsoftConnected && microsoftIntegration?.connectionData && (
            <div className="space-y-3 pt-4 border-t border-white/10 text-xs sm:text-sm text-white/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-white">Account</p>
                <p>
                  {microsoftIntegration.connectionData.providerUserEmail ||
                    "Hidden"}
                </p>
              </div>
              {microsoftIntegration.connectionData.providerUserName && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-white">Display Name</p>
                  <p>{microsoftIntegration.connectionData.providerUserName}</p>
                </div>
              )}
              {microsoftIntegration.connectionData.metadata?.tenantId && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-white">Tenant ID</p>
                  <p>{microsoftIntegration.connectionData.metadata.tenantId}</p>
                </div>
              )}
              {microsoftIntegration.connectionData.expiryDate && (
                <p className="text-white/60">
                  Token expires:{" "}
                  {new Date(
                    microsoftIntegration.connectionData.expiryDate
                  ).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/google-logo.svg"
                  alt="Google logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Google
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {isIntegrationLoading
                    ? "Checking connection..."
                    : googleConnected
                    ? "Connected"
                    : "Connect Google account"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {googleConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
              {googleConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleDisconnect}
                  disabled={isLoading}
                  className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm"
                >
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGoogleConnect}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {isLoading ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
          </div>

          {googleConnected && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <Label
                  htmlFor="googleAdsToken"
                  className="text-white/80 text-sm"
                >
                  Google Ads Developer Token
                </Label>
                <Input
                  id="googleAdsToken"
                  type="text"
                  value={googleAdsToken}
                  onChange={(event) => setGoogleAdsToken(event.target.value)}
                  placeholder="Enter your Google Ads Developer Token"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                />
              </div>
              <Button
                type="button"
                onClick={handleSaveGoogleAdsToken}
                disabled={isSavingToken || !googleAdsToken}
                className="w-full sm:w-auto bg-emerald-500 text-white hover:bg-emerald-400 text-sm"
              >
                {isSavingToken ? "Saving..." : "Save Token"}
              </Button>

              {googleAdsToken && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-white/80 text-sm">
                      Select Google Customer
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={fetchGoogleCustomers}
                      disabled={isLoadingCustomers}
                      className="text-white/70 hover:text-white flex-shrink-0"
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${
                          isLoadingCustomers ? "animate-spin" : ""
                        }`}
                      />
                    </Button>
                  </div>
                  <Select
                    value={selectedGoogleCustomerId}
                    onValueChange={(value) => {
                      setSelectedGoogleCustomerId(value);
                      handleSaveSelectedCustomer(value);
                    }}
                    disabled={
                      isLoadingCustomers || googleCustomers.length === 0
                    }
                  >
                    <SelectTrigger className="bg-white/[0.06] border-white/10 text-white text-sm sm:text-base">
                      <SelectValue
                        placeholder={
                          isLoadingCustomers
                            ? "Loading..."
                            : "Select a customer"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {googleCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={facebookLogo}
                  alt="Facebook logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Facebook
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {isFacebookStatusLoading
                    ? "Checking connection..."
                    : facebookConnected
                    ? "Connected"
                    : "Connect Facebook account"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {facebookConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
              {facebookConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFacebookDisconnect}
                  disabled={isDisconnectingFacebook}
                  className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm"
                >
                  {isDisconnectingFacebook ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleFacebookConnect}
                  disabled={isFacebookLoading}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {isFacebookLoading ? "Connecting..." : "Connect"}
                </Button>
              )}
            </div>
          </div>

          {facebookConnected &&
            facebookIntegration?.pages &&
            facebookIntegration.pages.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-white/80 text-sm">
                    Select Facebook Page
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshPages}
                    disabled={isRefreshingPages}
                    className="text-white/70 hover:text-white flex-shrink-0"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isRefreshingPages ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
                <Select
                  value={selectedPageId}
                  onValueChange={handlePageSelect}
                  disabled={isSelectingPage}
                >
                  <SelectTrigger className="bg-white/[0.06] border-white/10 text-white text-sm sm:text-base">
                    <SelectValue placeholder="Select a Facebook page" />
                  </SelectTrigger>
                  <SelectContent>
                    {facebookIntegration.pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name}
                        {page.category ? ` (${page.category})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPageId && (
                  <p className="text-xs sm:text-sm text-emerald-400">
                    Selected page will be used for posting content.
                  </p>
                )}
              </div>
            )}

          {facebookConnected && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-white/80 text-sm">
                    Step 1: Select Business Account
                  </Label>
                  <p className="text-xs text-white/50 mt-1">
                    Required before selecting ad accounts
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshBusinessAccounts}
                  disabled={isBusinessAccountsLoading}
                  className="text-white/70 hover:text-white flex-shrink-0"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isBusinessAccountsLoading ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
              <Select
                value={selectedBusinessAccountId}
                onValueChange={handleBusinessAccountSelect}
                disabled={
                  isSelectingBusinessAccount || isBusinessAccountsLoading
                }
              >
                <SelectTrigger className="bg-white/[0.06] border-white/10 text-white text-sm sm:text-base">
                  <SelectValue
                    placeholder={
                      isBusinessAccountsLoading
                        ? "Loading business accounts..."
                        : "Select a business account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {businessAccountsData?.data &&
                  businessAccountsData.data.length > 0 ? (
                    businessAccountsData.data.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                        {account.primary_page?.name
                          ? ` (${account.primary_page.name})`
                          : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No business accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedBusinessAccountId && (
                <p className="text-xs sm:text-sm text-emerald-400">
                  Business account selected. Ad accounts are loading below...
                </p>
              )}
              {(!businessAccountsData?.data ||
                businessAccountsData.data.length === 0) &&
                !isBusinessAccountsLoading && (
                  <p className="text-xs text-amber-300">
                    No business accounts found. Make sure you have granted
                    business_management permission.
                  </p>
                )}
            </div>
          )}

          {facebookConnected && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-white/80 text-sm">
                    {selectedBusinessAccountId
                      ? "Step 2: Select Ad Account"
                      : "Select Ad Account"}
                  </Label>
                  <p className="text-xs text-white/50 mt-1">
                    {selectedBusinessAccountId
                      ? "Ad accounts from your selected business account"
                      : "Your ad accounts (can be accessed without business account)"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    fetchAdAccounts(selectedBusinessAccountId || undefined)
                  }
                  disabled={isLoadingAdAccounts}
                  className="text-white/70 hover:text-white flex-shrink-0"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      isLoadingAdAccounts ? "animate-spin" : ""
                    }`}
                  />
                </Button>
              </div>
              <Select
                value={selectedAdAccountId}
                onValueChange={handleAdAccountSelect}
                disabled={isLoadingAdAccounts || isSelectingAdAccount}
              >
                <SelectTrigger className="bg-white/[0.06] border-white/10 text-white text-sm sm:text-base">
                  <SelectValue
                    placeholder={
                      isLoadingAdAccounts
                        ? "Loading ad accounts..."
                        : "Select an ad account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {adAccounts.length > 0 ? (
                    adAccounts.map((account) => {
                      // Use account_id (numeric) for display, id (act_XXXXXXXXX) for value
                      const displayId = account.account_id || account.id;
                      const displayName =
                        account.name || displayId || account.id;
                      return (
                        <SelectItem key={account.id} value={account.id}>
                          {displayName}
                          {account.currency ? ` (${account.currency})` : ""}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No ad accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {selectedAdAccountId && (
                <p className="text-xs sm:text-sm text-emerald-400">
                  Ad account selected ({selectedAdAccountId}). Ready to create
                  ad campaigns!
                </p>
              )}
              {adAccounts.length === 0 && !isLoadingAdAccounts && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                  <p className="text-xs text-amber-300 font-medium mb-1">
                    No ad accounts available
                  </p>
                  <p className="text-xs text-amber-300/80">
                    {selectedBusinessAccountId
                      ? "This business account doesn't have ad accounts, or your token doesn't have Marketing API access. Please disconnect and reconnect your Facebook account with ads_read and ads_management permissions."
                      : "To use ad campaigns, you need to reconnect your Facebook account with ads_read and ads_management permissions. Click 'Disconnect' then 'Connect' again and grant the required permissions during the OAuth flow."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={whatsappLogo}
                  alt="WhatsApp logo"
                  className="w-[30px] h-[30px] object-cover scale-150"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  WhatsApp Business
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {isLoadingWhatsApp
                    ? "Checking connection..."
                    : whatsappConnections.length > 0
                    ? `${whatsappConnections.length} connected number${
                        whatsappConnections.length > 1 ? "s" : ""
                      }`
                    : "Connect a WhatsApp Business account to send messages."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {whatsappConnections.length > 0 && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleToggleWhatsAppForm}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
                disabled={!canManageWhatsApp}
              >
                {!canManageWhatsApp
                  ? "Restricted"
                  : showWhatsAppForm
                  ? "Close"
                  : primaryWhatsAppConnection
                  ? "Edit Number"
                  : "Connect"}
              </Button>
            </div>
          </div>

          {!canManageWhatsApp && (
            <p className="text-xs text-amber-300 break-words">
              Contact your company admin to update WhatsApp configuration.
            </p>
          )}

          {whatsappConnections.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              {whatsappConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-xs sm:text-sm text-white/80 min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-semibold text-white break-words">
                      {connection.phoneNumber || "WhatsApp Connected"}
                    </p>
                    <p className="text-xs text-white/60">
                      Status: <span className="text-emerald-400 capitalize">{connection.status}</span>
                    </p>
                    {connection.apiKey && (
                      <p className="text-xs text-white/60">
                        API Key: {connection.apiKey}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm flex-shrink-0"
                    onClick={() => requestWhatsAppDisconnect()}
                    disabled={!canManageWhatsApp}
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showWhatsAppForm && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80 text-sm">
                    Wasender API Key <span className="text-rose-400">*</span>
                  </Label>
                  <Input
                    type="password"
                    value={whatsappForm.apiKey}
                    onChange={(event) =>
                      handleWhatsAppInputChange("apiKey", event.target.value)
                    }
                    placeholder="Enter your Wasender API key"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                  <p className="text-xs text-white/50">
                    Get your API key from{" "}
                    <a
                      href="https://wasenderapi.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      wasenderapi.com
                    </a>
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80 text-sm">
                    Phone Number <span className="text-white/40">(Optional)</span>
                  </Label>
                  <Input
                    value={whatsappForm.phoneNumber}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "phoneNumber",
                        event.target.value
                      )
                    }
                    placeholder="Enter WhatsApp number in E.164 format (e.g., +1234567890)"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                  <p className="text-xs text-white/50">
                    Optional: For reference only
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80 text-sm">
                    Webhook Secret <span className="text-white/40">(Optional)</span>
                  </Label>
                  <Input
                    type="password"
                    value={whatsappForm.webhookSecret}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "webhookSecret",
                        event.target.value
                      )
                    }
                    placeholder="Enter webhook secret for signature verification"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                  <p className="text-xs text-white/50">
                    Optional: For webhook signature verification (get from Wasender dashboard)
                  </p>
                </div>
              </div>

              {whatsappValidated && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Configuration validated successfully
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetWhatsAppForm();
                    setShowWhatsAppForm(false);
                    setWhatsappValidated(false);
                  }}
                  className="w-full sm:w-auto border-white/20 text-white/70 hover:bg-white/10 text-sm"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleValidateWhatsAppConfig}
                    disabled={isValidatingWhatsApp || isSavingWhatsApp}
                    variant="outline"
                    className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-sm"
                  >
                    {isValidatingWhatsApp
                      ? "Validating..."
                      : "Check Configuration"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleWhatsAppConnect}
                    disabled={isSavingWhatsApp}
                    className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                    }}
                  >
                    {isSavingWhatsApp ? "Saving..." : "Save Connection"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mailgun Integration - Hidden: Now managed by Admin in Members & Permissions */}
        {false && (
          <div className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                  <img
                    src={mailgunLogo}
                    alt="Mailgun logo"
                    className="w-[30px] h-[30px] object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white text-sm sm:text-base">
                    Mailgun
                  </p>
                  <p className="text-xs sm:text-sm text-white/60 break-words">
                    {isLoadingMailgun
                      ? "Checking configuration..."
                      : mailgunConfigured
                      ? "Configured"
                      : "Configure Mailgun API settings for email functionality."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {mailgunConfigured && (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="hidden sm:inline">Configured</span>
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleToggleMailgunForm}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                  disabled={!canManageMailgun}
                >
                  {!canManageMailgun
                    ? "Restricted"
                    : showMailgunForm
                    ? "Close"
                    : mailgunConfigured
                    ? "Edit Configuration"
                    : "Configure"}
                </Button>
              </div>
            </div>

            {!canManageMailgun && (
              <p className="text-xs text-amber-300 break-words">
                Only company owners can configure Mailgun settings.
              </p>
            )}

            {/* Environment Credentials Status */}
            {mailgunEnvCredentials?.configured && (
              <div className="rounded-lg border border-white/10 p-3 bg-white/[0.03] mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-white/80 font-medium">
                    Environment Credentials
                  </span>
                  {mailgunEnvValidation?.valid ? (
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Valid
                    </span>
                  ) : mailgunEnvValidation ? (
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      Invalid
                    </span>
                  ) : null}
                </div>
                {mailgunEnvValidation?.message && (
                  <p className="text-xs text-white/60 mb-2">
                    {mailgunEnvValidation.message}
                  </p>
                )}
                <Button
                  onClick={handleValidateMailgunEnvCredentials}
                  disabled={isValidatingMailgunEnv}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                >
                  {isValidatingMailgunEnv ? (
                    <>
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                      Validating...
                    </>
                  ) : (
                    "Validate Env Credentials"
                  )}
                </Button>
              </div>
            )}

            {showMailgunForm && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-white/80 text-sm">
                      MAILGUN_API_KEY <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="password"
                      value={mailgunConfig.apiKey}
                      onChange={(event) =>
                        handleMailgunInputChange("apiKey", event.target.value)
                      }
                      placeholder="Enter your Mailgun API key"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-white/80 text-sm">
                      MAILGUN_DOMAIN <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={mailgunConfig.domain}
                      onChange={(event) =>
                        handleMailgunInputChange("domain", event.target.value)
                      }
                      placeholder="e.g., mg.yourdomain.com"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-white/80 text-sm">
                      MAILGUN_API_URL <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={mailgunConfig.apiUrl}
                      onChange={(event) =>
                        handleMailgunInputChange("apiUrl", event.target.value)
                      }
                      placeholder="e.g., https://api.mailgun.net"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label className="text-white/80 text-sm">
                      MAILGUN_WEBHOOK_SIGNING_KEY{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      type="password"
                      value={mailgunConfig.webhookSigningKey}
                      onChange={(event) =>
                        handleMailgunInputChange(
                          "webhookSigningKey",
                          event.target.value
                        )
                      }
                      placeholder="Enter webhook signing key"
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                    />
                  </div>
                </div>
                {existingEmail && !mailgunValidated && (
                  <div className="space-y-2">
                    <Label className="text-white/80 text-sm">
                      Current Mailgun Email
                    </Label>
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                      <p className="text-blue-400 text-sm font-medium">
                        {existingEmail}
                      </p>
                      <p className="text-xs text-blue-300/70 mt-1">
                        Enter a new prefix below to generate a new email address
                      </p>
                    </div>
                  </div>
                )}

                {mailgunValidated && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                      <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Configuration validated successfully
                      </p>
                    </div>

                    {existingEmail && (
                      <div className="space-y-2">
                        <Label className="text-white/80 text-sm">
                          Current Mailgun Email
                        </Label>
                        <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                          <p className="text-blue-400 text-sm font-medium">
                            {existingEmail}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-white/80 text-sm">
                        Email Prefix{" "}
                        <span className="text-white/50 text-xs">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        value={emailPrefix}
                        onChange={(event) =>
                          handleEmailPrefixChange(event.target.value)
                        }
                        placeholder="e.g., support, sales, info"
                        className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                      />
                      <p className="text-xs text-white/50">
                        Enter a prefix (word) to generate a new unique email
                        address. Leave empty to use your company email as base.
                      </p>
                    </div>

                    {isSuggestingEmail ? (
                      <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                        <p className="text-blue-400 text-sm flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Generating unique email address...
                        </p>
                      </div>
                    ) : suggestedEmail ? (
                      <div className="space-y-2">
                        <Label className="text-white/80 text-sm">
                          Mailgun Email Address{" "}
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          value={suggestedEmail}
                          onChange={(event) =>
                            setSuggestedEmail(event.target.value)
                          }
                          placeholder="e.g., company@mg.yourdomain.com"
                          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                        />
                        <p className="text-xs text-emerald-400">
                          Unique email address suggested. You can modify it if
                          needed.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowMailgunForm(false);
                      setMailgunValidated(false);
                      fetchMailgunConfig();
                    }}
                    className="w-full sm:w-auto border-white/20 text-white/70 hover:bg-white/10 text-sm"
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleValidateMailgunConfig}
                      disabled={isValidatingMailgun || isSavingMailgun}
                      variant="outline"
                      className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-sm"
                    >
                      {isValidatingMailgun
                        ? "Validating..."
                        : "Check Configuration"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveMailgunConfig}
                      disabled={
                        isSavingMailgun || !mailgunValidated || !suggestedEmail
                      }
                      className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow:
                          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      }}
                    >
                      {isSavingMailgun ? "Saving..." : "Save Configuration"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={disconnectDialog.open}
        title="Disconnect WhatsApp number?"
        description="Messages will no longer be sent from this number after disconnecting."
        confirmText="Disconnect"
        cancelText="Cancel"
        confirmVariant="destructive"
        isPending={isDisconnectingWhatsApp}
        onConfirm={handleWhatsAppDisconnect}
        onCancel={() =>
          setDisconnectDialog({ open: false, phoneNumberId: null })
        }
      />
    </Card>
  );
};

export default IntegrationsTab;
