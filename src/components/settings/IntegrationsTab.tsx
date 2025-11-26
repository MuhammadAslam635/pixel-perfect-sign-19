import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import {
  WhatsAppCredential,
  whatsappService,
} from "@/services/whatsapp.service";
import { mailgunService } from "@/services/mailgun.service";
import {
  useFacebookConnect,
  useFacebookDisconnect,
  useFacebookRefreshPages,
  useFacebookSelectPage,
  useFacebookStatus,
} from "@/components/settings/services/facebook.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
      };
      providerUserEmail?: string;
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
  const [whatsappConnections, setWhatsAppConnections] = useState<
    WhatsAppCredential[]
  >([]);
  const [isLoadingWhatsApp, setIsLoadingWhatsApp] = useState(false);
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [whatsappForm, setWhatsAppForm] = useState({
    businessAccountId: "",
    phoneNumberId: "",
    phoneNumber: "",
    accessToken: "",
    verifyToken: "",
    appSecret: "",
    webhookUrl: "",
  });
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    phoneNumberId: string | null;
  }>({ open: false, phoneNumberId: null });
  const [isDisconnectingWhatsApp, setIsDisconnectingWhatsApp] = useState(false);
  const [isTwilioStatusLoading, setIsTwilioStatusLoading] = useState(false);
  const [isTwilioActionLoading, setIsTwilioActionLoading] = useState(false);
  const [twilioConnected, setTwilioConnected] = useState(false);
  const [twilioDetails, setTwilioDetails] = useState<{
    accountSid?: string | null;
    apiKeySid?: string | null;
    apiKeySecret?: string | null;
    authToken?: string | null;
    lastConnectedAt?: string;
    hasAllCredentials?: boolean;
    missingFields?: string[];
    ownerApplicationSid?: string | null;
    ownerPhoneNumber?: string | null;
    ownerCallerReady?: boolean;
  } | null>(null);
  const [isTwilioModalOpen, setIsTwilioModalOpen] = useState(false);
  const [twilioForm, setTwilioForm] = useState({
    accountSid: "",
    apiKeySid: "",
    apiKeySecret: "",
    authToken: "",
    ownerApplicationSid: "",
    ownerPhoneNumber: "",
  });
  const [isSavingTwilioCredentials, setIsSavingTwilioCredentials] =
    useState(false);
  const [twilioFormError, setTwilioFormError] = useState<string | null>(null);
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
  const [isMicrosoftStatusLoading, setIsMicrosoftStatusLoading] =
    useState(false);
  const [isMicrosoftActionLoading, setIsMicrosoftActionLoading] =
    useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState(false);
  const [microsoftIntegration, setMicrosoftIntegration] = useState<
    IntegrationResponse["integration"] | null
  >(null);

  const {
    mutateAsync: fetchFacebookRedirectUrl,
    isPending: isFacebookLoading,
  } = useFacebookConnect();

  const {
    data: facebookStatus,
    isLoading: isFacebookStatusLoading,
    refetch: refetchFacebookStatus,
  } = useFacebookStatus();

  const {
    mutateAsync: disconnectFacebook,
    isPending: isDisconnectingFacebook,
  } = useFacebookDisconnect();

  const { mutateAsync: selectPage, isPending: isSelectingPage } =
    useFacebookSelectPage();

  const { mutateAsync: refreshPages, isPending: isRefreshingPages } =
    useFacebookRefreshPages();

  const user = getUserData();
  const canManageWhatsApp =
    user?.role === "Company" || user?.role === "CompanyAdmin";
  const canManageMailgun = user?.role === "Company";
  const canManageMicrosoft =
    user?.role === "Company" || user?.role === "CompanyAdmin";

  const facebookConnected = facebookStatus?.connected ?? false;
  const facebookIntegration = facebookStatus?.integration;

  const resetWhatsAppForm = () => {
    setWhatsAppForm({
      businessAccountId: "",
      phoneNumberId: "",
      phoneNumber: "",
      accessToken: "",
      verifyToken: "",
      appSecret: "",
      webhookUrl: "",
    });
  };

  const resetTwilioForm = () => {
    setTwilioForm({
      accountSid: "",
      apiKeySid: "",
      apiKeySecret: "",
      authToken: "",
      ownerApplicationSid: "",
      ownerPhoneNumber: "",
    });
    setTwilioFormError(null);
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

const fetchTwilioStatus = async () => {
  if (!user?.token) {
    setTwilioConnected(false);
    setTwilioDetails(null);
    return;
  }

  setIsTwilioStatusLoading(true);
  try {
    const response = await axios.get(
      `${APP_BACKEND_URL}/twilio/connection-check`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );

    if (response.data?.success) {
      const statusData = response.data.data || null;
      const ready =
        Boolean(response.data.connected) &&
        Boolean(statusData?.hasAllCredentials);
      setTwilioConnected(ready);
      setTwilioDetails(statusData);
    } else {
      setTwilioConnected(false);
      setTwilioDetails(null);
    }
  } catch (error) {
    setTwilioConnected(false);
    setTwilioDetails(null);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      toast({
        title: "Twilio not configured",
        description: "Company credentials aren’t added yet. Please add them.",
      });
    }
  } finally {
    setIsTwilioStatusLoading(false);
  }
};

  useEffect(() => {
    fetchWhatsAppConnections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

useEffect(() => {
  fetchTwilioStatus();
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

    const requiredFields: Array<keyof typeof whatsappForm> = [
      "businessAccountId",
      "phoneNumberId",
      "phoneNumber",
      "accessToken",
      "verifyToken",
    ];

    for (const field of requiredFields) {
      if (!whatsappForm[field]) {
        toast({
          title: "Missing information",
          description: "Please fill in all required WhatsApp fields.",
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

    setIsSavingWhatsApp(true);
    try {
      const payload = {
        businessAccountId: whatsappForm.businessAccountId.trim(),
        phoneNumberId: whatsappForm.phoneNumberId.trim(),
        phoneNumber: whatsappForm.phoneNumber.trim(),
        accessToken: whatsappForm.accessToken.trim(),
        verifyToken: whatsappForm.verifyToken.trim(),
        appSecret: whatsappForm.appSecret.trim() || undefined,
        webhookUrl: whatsappForm.webhookUrl.trim() || undefined,
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
          businessAccountId: primaryWhatsAppConnection.businessAccountId || "",
          phoneNumberId: primaryWhatsAppConnection.phoneNumberId || "",
          phoneNumber: primaryWhatsAppConnection.phoneNumber || "",
          accessToken: "",
          verifyToken: "",
          appSecret: "",
          webhookUrl: primaryWhatsAppConnection.webhookUrl || "",
        });
      } else {
        resetWhatsAppForm();
      }
    }

    setShowWhatsAppForm((prev) => !prev);
  };

  const requestWhatsAppDisconnect = (phoneNumberId: string) => {
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

    setDisconnectDialog({ open: true, phoneNumberId });
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
      await whatsappService.disconnect(disconnectDialog.phoneNumberId);

      toast({
        title: "Disconnected",
        description: "WhatsApp number disconnected successfully.",
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
    enabled: !!user,
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
  }, [facebookIntegration]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const error = params.get("error");
    const twilioParam = params.get("twilio");
    const twilioReason = params.get("reason");
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

    if (twilioParam === "connected") {
      toast({
        title: "Twilio connected",
        description: "Your Twilio account is now linked.",
      });
      fetchTwilioStatus();
      shouldClear = true;
    }

    if (twilioParam === "error") {
      toast({
        title: "Twilio connection failed",
        description:
          twilioReason ||
          "We could not connect to Twilio. Please try again.",
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

  const handleTwilioModalOpen = () => {
    resetTwilioForm();
    setIsTwilioModalOpen(true);
  };

  const handleTwilioDisconnect = async () => {
    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    setIsTwilioActionLoading(true);
    try {
      await axios.delete(`${APP_BACKEND_URL}/twilio/disconnect`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      toast({
        title: "Twilio disconnected",
        description: "Your Twilio account has been disconnected.",
      });
      fetchTwilioStatus();
    } catch (error: unknown) {
      console.error("Error disconnecting Twilio:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Twilio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTwilioActionLoading(false);
    }
  };

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

  const handleTwilioCredentialsSave = async () => {
    if (!user?.token) {
      toast({
        title: "Error",
        description: "User not authenticated. Please login again.",
        variant: "destructive",
      });
      return;
    }

    const requiredFields: Array<keyof typeof twilioForm> = [
      "accountSid",
      "apiKeySid",
      "apiKeySecret",
      "authToken",
    ];
    const missingRequired = requiredFields.some(
      (field) => !twilioForm[field].trim()
    );
    if (missingRequired) {
      setTwilioFormError(
        "All required Twilio credential fields must be filled."
      );
      return;
    }
    setTwilioFormError(null);

    const payload: Record<string, string> = {};
    requiredFields.forEach((field) => {
      payload[field] = twilioForm[field].trim();
    });
    if (twilioForm.ownerApplicationSid.trim()) {
      payload.ownerApplicationSid = twilioForm.ownerApplicationSid.trim();
    }
    if (twilioForm.ownerPhoneNumber.trim()) {
      payload.ownerPhoneNumber = twilioForm.ownerPhoneNumber.trim();
    }

    setIsSavingTwilioCredentials(true);
    try {
      await axios.post(`${APP_BACKEND_URL}/twilio/credentials`, payload, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      toast({
        title: "Twilio credentials saved",
        description: "Employees can now be provisioned with Twilio assets.",
      });

      setIsTwilioModalOpen(false);
      resetTwilioForm();
      fetchTwilioStatus();
    } catch (error: unknown) {
      console.error("Error saving Twilio credentials:", error);
      let errorMessage = "Failed to save Twilio credentials. Please verify the values.";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = "Company credentials aren’t added yet. Please add them.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSavingTwilioCredentials(false);
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
        console.log("Google OAuth Mode:", response.data.mode);
        console.log("Google OAuth Scopes:", response.data.scopes);
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
      fetchMailgunConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, canManageMailgun]);

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
        description:
          error?.response?.data?.message ||
          "Failed to validate Mailgun configuration. Please check your credentials.",
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
        description:
          error?.response?.data?.message ||
          "Failed to save Mailgun configuration. Please verify your details.",
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

  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
      <CardHeader className="border-b border-white/10 bg-white/[0.02] px-4 sm:px-6">
        <CardTitle className="text-white text-base sm:text-lg font-semibold">
          Integrations
        </CardTitle>
        <CardDescription className="text-white/60 text-sm">
          Connect with your favourite tools and platforms.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6">
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
            <div className="space-y-3 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-4 text-xs sm:text-sm text-white/80">
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
            <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-4">
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
                <div className="w-[30px] h-[30px] rounded-full bg-rose-500/30 border border-rose-400/40 text-rose-200 text-xs font-semibold flex items-center justify-center">
                  TW
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Twilio
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {isTwilioStatusLoading
                    ? "Checking credentials..."
                    : twilioConnected
                    ? "Twilio credentials ready for provisioning."
                    : "Store your Twilio credentials to provision employee phone numbers."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {twilioConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
              {twilioConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTwilioDisconnect}
                  disabled={isTwilioActionLoading}
                  className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 text-xs sm:text-sm"
                >
                  {isTwilioActionLoading ? "Disconnecting..." : "Disconnect"}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={handleTwilioModalOpen}
                disabled={isTwilioStatusLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-xs sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {twilioConnected ? "Update credentials" : "Set credentials"}
              </Button>
            </div>
          </div>

          {twilioDetails && (
            <div className="space-y-3 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-4 text-xs sm:text-sm text-white/80">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-white">Account SID</p>
                <p>{twilioDetails.accountSid || "Hidden"}</p>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-white">API Key SID</p>
                <p>{twilioDetails.apiKeySid || "Hidden"}</p>
              </div>
              {twilioDetails.apiKeySecret && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-white">API Key Secret</p>
                  <p>{twilioDetails.apiKeySecret}</p>
                </div>
              )}
              {twilioDetails.authToken && (
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-semibold text-white">Auth Token</p>
                  <p>{twilioDetails.authToken}</p>
                </div>
              )}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-white">Owner TwiML App SID</p>
                <p>{twilioDetails.ownerApplicationSid || "Not set"}</p>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-semibold text-white">Owner Caller ID</p>
                <p>{twilioDetails.ownerPhoneNumber || "Not set"}</p>
              </div>
              {twilioDetails.lastConnectedAt && (
                <p className="text-white/60">
                  Last updated:{" "}
                  {new Date(twilioDetails.lastConnectedAt).toLocaleString()}
                </p>
              )}
              {!twilioDetails.ownerCallerReady && (
                <p className="text-amber-200">
                  Add the owner TwiML App SID and caller ID to let company
                  owners place calls or send SMS without provisioning an
                  employee number.
                </p>
              )}
              {/* {!twilioConnected && twilioDetails.missingFields?.length ? (
                <p className="text-amber-200">
                  Missing fields: {twilioDetails.missingFields.join(", ")}
                </p>
              ) : null} */}
            </div>
          )}

          {!twilioConnected && !isTwilioStatusLoading && (
            <p className="text-xs sm:text-sm text-amber-300">
              Add your Twilio credentials to automatically create TwiML apps
              and numbers for your employees.
            </p>
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
              <div className="space-y-3 rounded-2xl sm:rounded-3xl border border-white/5 bg-white/[0.03] p-4">
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
            <div className="space-y-3">
              {whatsappConnections.map((connection) => (
                <div
                  key={connection.phoneNumberId}
                  className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 text-xs sm:text-sm text-white/80 min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-white break-words">
                        {connection.phoneNumber}
                      </p>
                      <p className="break-all">
                        Phone Number ID: {connection.phoneNumberId}
                      </p>
                      <p className="break-all">
                        Business Account ID: {connection.businessAccountId}
                      </p>
                      {connection.webhookUrl && (
                        <p className="break-all">
                          Webhook: {connection.webhookUrl}
                        </p>
                      )}
                      {connection.tokens?.accessToken && (
                        <p className="break-all">
                          Access Token: {connection.tokens.accessToken}
                        </p>
                      )}
                      {connection.tokens?.verifyToken && (
                        <p className="break-all">
                          Verify Token: {connection.tokens.verifyToken}
                        </p>
                      )}
                      {connection.tokens?.appSecret && (
                        <p className="break-all">
                          App Secret: {connection.tokens.appSecret}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto border-rose-400/50 text-rose-300 hover:bg-rose-500/10 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm flex-shrink-0"
                      onClick={() =>
                        requestWhatsAppDisconnect(connection.phoneNumberId)
                      }
                      disabled={!canManageWhatsApp}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showWhatsAppForm && (
            <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">
                    Business Account ID
                  </Label>
                  <Input
                    value={whatsappForm.businessAccountId}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "businessAccountId",
                        event.target.value
                      )
                    }
                    placeholder="Enter business account ID"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">
                    Phone Number ID
                  </Label>
                  <Input
                    value={whatsappForm.phoneNumberId}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "phoneNumberId",
                        event.target.value
                      )
                    }
                    placeholder="Enter phone number ID"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">
                    WhatsApp Number
                  </Label>
                  <Input
                    value={whatsappForm.phoneNumber}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "phoneNumber",
                        event.target.value
                      )
                    }
                    placeholder="Enter WhatsApp number in E.164 format"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">Access Token</Label>
                  <Input
                    type="password"
                    value={whatsappForm.accessToken}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "accessToken",
                        event.target.value
                      )
                    }
                    placeholder="Enter permanent access token"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">Verify Token</Label>
                  <Input
                    value={whatsappForm.verifyToken}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "verifyToken",
                        event.target.value
                      )
                    }
                    placeholder="Token used in webhook verification"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label className="text-white/80 text-sm">
                    App Secret (optional)
                  </Label>
                  <Input
                    type="password"
                    value={whatsappForm.appSecret}
                    onChange={(event) =>
                      handleWhatsAppInputChange("appSecret", event.target.value)
                    }
                    placeholder="Used for webhook signature validation"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80 text-sm">
                    Webhook URL (optional)
                  </Label>
                  <Input
                    value={whatsappForm.webhookUrl}
                    onChange={(event) =>
                      handleWhatsAppInputChange(
                        "webhookUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com/api/whatsapp/webhook"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetWhatsAppForm();
                    setShowWhatsAppForm(false);
                  }}
                  className="w-full sm:w-auto border-white/20 text-white/70 hover:bg-white/10 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleWhatsAppConnect}
                  disabled={isSavingWhatsApp}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {isSavingWhatsApp ? "Saving..." : "Save Connection"}
                </Button>
              </div>
            </div>
          )}
        </div>

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

          {showMailgunForm && (
            <div className="space-y-4 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4">
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
                      <span className="text-white/50 text-xs">(optional)</span>
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
                        ✓ Unique email address suggested. You can modify it if
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

      </CardContent>

      <Dialog
        open={isTwilioModalOpen}
        onOpenChange={(open) => {
          setIsTwilioModalOpen(open);
          if (!open) {
            resetTwilioForm();
          }
        }}
      >
        <DialogContent className="max-w-lg bg-[#0d0f17] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle>Twilio credentials</DialogTitle>
            <DialogDescription className="text-white/70">
              Enter the Twilio credentials for your account. All four fields are
              required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twilioAccountSid" className="text-white/80 text-sm">
                Account SID
              </Label>
              <Input
                id="twilioAccountSid"
                value={twilioForm.accountSid}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    accountSid: event.target.value,
                  }))
                }
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilioApiKeySid" className="text-white/80 text-sm">
                API Key SID
              </Label>
              <Input
                id="twilioApiKeySid"
                value={twilioForm.apiKeySid}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    apiKeySid: event.target.value,
                  }))
                }
                placeholder="SKXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="twilioApiKeySecret"
                className="text-white/80 text-sm"
              >
                API Key Secret
              </Label>
              <Input
                id="twilioApiKeySecret"
                type="password"
                value={twilioForm.apiKeySecret}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    apiKeySecret: event.target.value,
                  }))
                }
                placeholder="Your API key secret"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twilioAuthToken" className="text-white/80 text-sm">
                Auth Token
              </Label>
              <Input
                id="twilioAuthToken"
                type="password"
                value={twilioForm.authToken}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    authToken: event.target.value,
                  }))
                }
                placeholder="Your auth token"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2 pt-2 border-t border-white/10">
              <Label
                htmlFor="ownerApplicationSid"
                className="text-white/80 text-sm"
              >
                Owner TwiML App SID (optional)
              </Label>
              <Input
                id="ownerApplicationSid"
                value={twilioForm.ownerApplicationSid}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    ownerApplicationSid: event.target.value,
                  }))
                }
                placeholder="APXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">
                Used when the company owner makes calls or sends SMS without an
                employee-specific TwiML app.
              </p>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="ownerPhoneNumber"
                className="text-white/80 text-sm"
              >
                Owner Caller ID (optional)
              </Label>
              <Input
                id="ownerPhoneNumber"
                value={twilioForm.ownerPhoneNumber}
                onChange={(event) =>
                  setTwilioForm((prev) => ({
                    ...prev,
                    ownerPhoneNumber: event.target.value,
                  }))
                }
                placeholder="+14155552671"
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">
                Enter the E.164 phone number that should be used for the company
                owner when placing calls or sending SMS.
              </p>
            </div>
            {twilioFormError && (
              <p className="text-xs text-amber-300">{twilioFormError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsTwilioModalOpen(false);
                resetTwilioForm();
              }}
              className="border-white/20 text-white/80 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleTwilioCredentialsSave}
              disabled={isSavingTwilioCredentials}
              className="bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              {isSavingTwilioCredentials ? "Saving..." : "Save credentials"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
