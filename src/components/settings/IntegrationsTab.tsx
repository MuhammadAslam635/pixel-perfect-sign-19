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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import { WhatsAppCredential } from "@/api/whatsapp";
import {
  useFacebookConnect,
  useFacebookDisconnect,
  useFacebookRefreshPages,
  useFacebookSelectPage,
  useFacebookStatus,
} from "@/components/settings/services/facebook.api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

  const fetchWhatsAppConnections = async () => {
    if (!user?.token) return;

    setIsLoadingWhatsApp(true);
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/whatsapp/connection`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        const credentials: WhatsAppCredential[] =
          response.data.credentials || [];
        setWhatsAppConnections(credentials);
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

      const response = await axios.post(
        `${APP_BACKEND_URL}/whatsapp/connection`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        toast({
          title: "WhatsApp connected",
          description: response.data.message,
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
      await axios.delete(
        `${APP_BACKEND_URL}/whatsapp/connection/${disconnectDialog.phoneNumberId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

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

    if (success) {
      toast({
        title: "Success",
        description: success,
      });
      window.history.replaceState({}, "", window.location.pathname);
      refetchFacebookStatus();
    }

    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refetchFacebookStatus]);

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
              <img
                src="/assets/google-logo.svg"
                width={30}
                height={30}
                alt="Google logo"
                className="flex-shrink-0"
              />
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-sm font-semibold text-white flex-shrink-0">
                f
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
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white flex-shrink-0">
                WA
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
