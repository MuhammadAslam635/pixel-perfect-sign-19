import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
import { RefreshCw, Save, Settings } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import {
  adminGlobalIntegrationsService,
  GlobalIntegration,
} from "@/services/admin-global-integrations.service";
import deepgramLogo from "@/assets/deepgram-icon.png";
import twilioLogo from "@/assets/twilio-icon.png";
import openaiLogo from "@/assets/openai-icon.png";
import elevenlabsLogo from "@/assets/elevenlabs-icon.png";

// Import GlobalIntegration from service

export const AdminGlobalIntegrationsTab = () => {
  const [integrations, setIntegrations] = useState<GlobalIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [envCredentials, setEnvCredentials] = useState<Record<string, any>>({});
  const [envValidations, setEnvValidations] = useState<
    Record<string, { valid: boolean; message: string }>
  >({});
  const [showForms, setShowForms] = useState<Record<string, boolean>>({});
  const [envCheckLoading, setEnvCheckLoading] = useState(true);

  // Form states for each integration
  const [deepgramConfig, setDeepgramConfig] = useState({ apiKey: "" });
  const [openaiConfig, setOpenaiConfig] = useState({ apiKey: "" });
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    apiKeySid: "",
    apiKeySecret: "",
    authToken: "",
    callerId: "",
  });
  const [elevenlabsConfig, setElevenlabsConfig] = useState({ apiKey: "" });

  const user = getUserData();
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (isAdmin) {
      checkEnvCredentials();
      fetchGlobalIntegrations();
    }
  }, [isAdmin]);

  const checkEnvCredentials = async () => {
    if (!user?.token) {
      setEnvCheckLoading(false);
      return;
    }

    try {
      setEnvCheckLoading(true);
      const response =
        await adminGlobalIntegrationsService.checkEnvCredentials();
      if (response.success) {
        setEnvCredentials(response.envCredentials || {});

        // Validate each configured env credential
        const providers = ["deepgram", "openai", "twilio", "elevenlabs"];
        for (const provider of providers) {
          const envStatus = response.envCredentials[provider];
          if (envStatus?.configured) {
            try {
              const validationResponse =
                await adminGlobalIntegrationsService.validateEnvCredentials(
                  provider
                );
              if (validationResponse.success) {
                setEnvValidations((prev) => ({
                  ...prev,
                  [provider]: validationResponse.validation,
                }));
                // If env credentials are valid, don't show form
                if (validationResponse.validation.valid) {
                  setShowForms((prev) => ({ ...prev, [provider]: false }));
                } else {
                  // If invalid, show form
                  setShowForms((prev) => ({ ...prev, [provider]: true }));
                }
              }
            } catch (error) {
              console.error(
                `Error validating ${provider} env credentials:`,
                error
              );
              // On validation error, show form
              setShowForms((prev) => ({ ...prev, [provider]: true }));
            }
          } else {
            // If not configured, show form
            setShowForms((prev) => ({ ...prev, [provider]: true }));
          }
        }
      }
    } catch (error: any) {
      console.error("Error checking env credentials:", error);
      // If check fails, show forms as fallback
      setShowForms({
        deepgram: true,
        openai: true,
        twilio: true,
        elevenlabs: true,
      });
    } finally {
      setEnvCheckLoading(false);
    }
  };

  const fetchGlobalIntegrations = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const response =
        await adminGlobalIntegrationsService.fetchGlobalIntegrations();

      if (response.success) {
        setIntegrations(response.integrations || []);
        populateFormData(response.integrations || []);
      }
    } catch (error: any) {
      console.error("Error fetching global integrations:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load global integrations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (integrations: GlobalIntegration[]) => {
    integrations.forEach((integration) => {
      const metadata = integration.connectionData?.metadata || {};

      switch (integration.providerName) {
        case "deepgram":
          setDeepgramConfig({ apiKey: metadata.apiKey || "" });
          break;
        case "openai":
          setOpenaiConfig({ apiKey: metadata.apiKey || "" });
          break;
        case "twilio":
          setTwilioConfig({
            accountSid: metadata.accountSid || "",
            apiKeySid: metadata.apiKeySid || "",
            apiKeySecret: metadata.apiKeySecret || "",
            authToken: metadata.authToken || "",
            callerId: metadata.callerId || "",
          });
          break;
        case "elevenlabs":
          setElevenlabsConfig({ apiKey: metadata.apiKey || "" });
          break;
      }
    });
  };

  const validateFormData = async (
    provider: string,
    config: any
  ): Promise<boolean> => {
    // Basic validation based on provider
    switch (provider) {
      case "deepgram":
      case "openai":
      case "elevenlabs":
        if (!config.apiKey || config.apiKey.trim().length < 10) {
          toast({
            title: "Validation Error",
            description:
              "API key is required and must be at least 10 characters.",
            variant: "destructive",
          });
          return false;
        }
        break;
      case "twilio":
        if (
          !config.accountSid ||
          !config.apiKeySid ||
          !config.apiKeySecret ||
          !config.authToken
        ) {
          toast({
            title: "Validation Error",
            description: "All Twilio credentials are required.",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const saveIntegration = async (provider: string, config: any) => {
    if (!user?.token || !isAdmin) return;

    // Validate form data first
    const isValid = await validateFormData(provider, config);
    if (!isValid) {
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [provider]: true }));

      const response = await adminGlobalIntegrationsService.saveIntegration(
        provider,
        config
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `${provider} configuration saved successfully.`,
        });
        fetchGlobalIntegrations();
        // Re-check env credentials after saving
        checkEnvCredentials();
      }
    } catch (error: any) {
      console.error(`Error saving ${provider} integration:`, error);
      toast({
        title: "Error",
        description:
          error.message || `Failed to save ${provider} configuration.`,
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleValidateEnvCredentials = async (provider: string) => {
    if (!user?.token) return;

    try {
      setValidating((prev) => ({ ...prev, [provider]: true }));
      const response =
        await adminGlobalIntegrationsService.validateEnvCredentials(provider);

      if (response.success) {
        setEnvValidations((prev) => ({
          ...prev,
          [provider]: response.validation,
        }));

        if (response.validation.valid) {
          toast({
            title: "Success",
            description: response.validation.message,
          });
          setShowForms((prev) => ({ ...prev, [provider]: false }));
        } else {
          toast({
            title: "Validation Failed",
            description: response.validation.message,
            variant: "destructive",
          });
          setShowForms((prev) => ({ ...prev, [provider]: true }));
        }
      }
    } catch (error: any) {
      console.error(`Error validating ${provider} env credentials:`, error);
      toast({
        title: "Error",
        description:
          error.message || `Failed to validate ${provider} env credentials.`,
        variant: "destructive",
      });
    } finally {
      setValidating((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const getIntegrationStatus = (providerName: string) => {
    const integration = integrations.find(
      (i) => i.providerName === providerName
    );
    return {
      isConnected: integration?.isConnected || false,
      status: integration?.status || "inactive",
    };
  };

  if (loading || envCheckLoading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-white/60" />
        <p className="text-white/60">
          {loading
            ? "Loading global integrations..."
            : "Checking environment credentials..."}
        </p>
      </div>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
      <CardHeader className="border-b border-white/10 bg-white/[0.02] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CardTitle className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Global Integrations Management
          </CardTitle>
          <CardDescription className="text-white/60 text-sm">
            Configure system-wide integrations used across the entire
            application.
          </CardDescription>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 px-4 sm:px-6">
        {/* Deepgram Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={deepgramLogo}
                  alt="Deepgram logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Deepgram
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  Speech-to-text transcription
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getIntegrationStatus("deepgram").isConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
            </div>
          </div>

          {/* Environment Credentials Status */}
          {envCredentials.deepgram?.configured && (
            <div className="rounded-lg border p-3 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  Environment Credentials
                </span>
                {envValidations.deepgram?.valid ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                ) : envValidations.deepgram ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Invalid
                  </span>
                ) : null}
              </div>
              {envValidations.deepgram?.message && (
                <p className="text-xs text-white/60 mb-2">
                  {envValidations.deepgram.message}
                </p>
              )}
              <Button
                onClick={() => handleValidateEnvCredentials("deepgram")}
                disabled={validating.deepgram}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-xs"
              >
                {validating.deepgram ? (
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

          {/* Form - Show only if env credentials are not configured OR if configured but invalid */}
          {(showForms.deepgram ||
            !envCredentials.deepgram?.configured ||
            (envCredentials.deepgram?.configured &&
              envValidations.deepgram &&
              !envValidations.deepgram?.valid)) && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">API Key</Label>
                <Input
                  type="password"
                  value={deepgramConfig.apiKey}
                  onChange={(e) =>
                    setDeepgramConfig({ apiKey: e.target.value })
                  }
                  placeholder="Enter Deepgram API key"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <Button
                onClick={() => saveIntegration("deepgram", deepgramConfig)}
                disabled={saving.deepgram || !deepgramConfig.apiKey}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {saving.deepgram ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* OpenAI Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={openaiLogo}
                  alt="OpenAI logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  OpenAI
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  AI language models
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getIntegrationStatus("openai").isConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
            </div>
          </div>

          {/* Environment Credentials Status */}
          {envCredentials.openai?.configured && (
            <div className="rounded-lg border p-3 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  Environment Credentials
                </span>
                {envValidations.openai?.valid ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                ) : envValidations.openai ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Invalid
                  </span>
                ) : null}
              </div>
              {envValidations.openai?.message && (
                <p className="text-xs text-white/60 mb-2">
                  {envValidations.openai.message}
                </p>
              )}
              <Button
                onClick={() => handleValidateEnvCredentials("openai")}
                disabled={validating.openai}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-xs"
              >
                {validating.openai ? (
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

          {/* Form - Show only if env credentials are not configured OR if configured but invalid */}
          {(showForms.openai ||
            !envCredentials.openai?.configured ||
            (envCredentials.openai?.configured &&
              envValidations.openai &&
              !envValidations.openai?.valid)) && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">API Key</Label>
                <Input
                  type="password"
                  value={openaiConfig.apiKey}
                  onChange={(e) => setOpenaiConfig({ apiKey: e.target.value })}
                  placeholder="Enter OpenAI API key"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <Button
                onClick={() => saveIntegration("openai", openaiConfig)}
                disabled={saving.openai || !openaiConfig.apiKey}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {saving.openai ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Twilio Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={twilioLogo}
                  alt="Twilio logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  Twilio
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  Communication services
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getIntegrationStatus("twilio").isConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
            </div>
          </div>

          {/* Environment Credentials Status */}
          {envCredentials.twilio?.configured && (
            <div className="rounded-lg border p-3 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  Environment Credentials
                </span>
                {envValidations.twilio?.valid ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                ) : envValidations.twilio ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Invalid
                  </span>
                ) : null}
              </div>
              {envValidations.twilio?.message && (
                <p className="text-xs text-white/60 mb-2">
                  {envValidations.twilio.message}
                </p>
              )}
              <Button
                onClick={() => handleValidateEnvCredentials("twilio")}
                disabled={validating.twilio}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-xs"
              >
                {validating.twilio ? (
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

          {/* Form - Show only if env credentials are not configured OR if configured but invalid */}
          {(showForms.twilio ||
            !envCredentials.twilio?.configured ||
            (envCredentials.twilio?.configured &&
              envValidations.twilio &&
              !envValidations.twilio?.valid)) && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">Account SID</Label>
                  <Input
                    type="password"
                    value={twilioConfig.accountSid}
                    onChange={(e) =>
                      setTwilioConfig((prev) => ({
                        ...prev,
                        accountSid: e.target.value,
                      }))
                    }
                    placeholder="Enter Account SID"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">API Key SID</Label>
                  <Input
                    type="password"
                    value={twilioConfig.apiKeySid}
                    onChange={(e) =>
                      setTwilioConfig((prev) => ({
                        ...prev,
                        apiKeySid: e.target.value,
                      }))
                    }
                    placeholder="Enter API Key SID"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">
                    API Key Secret
                  </Label>
                  <Input
                    type="password"
                    value={twilioConfig.apiKeySecret}
                    onChange={(e) =>
                      setTwilioConfig((prev) => ({
                        ...prev,
                        apiKeySecret: e.target.value,
                      }))
                    }
                    placeholder="Enter API Key Secret"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80 text-sm">Auth Token</Label>
                  <Input
                    type="password"
                    value={twilioConfig.authToken}
                    onChange={(e) =>
                      setTwilioConfig((prev) => ({
                        ...prev,
                        authToken: e.target.value,
                      }))
                    }
                    placeholder="Enter Auth Token"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-white/80 text-sm">
                    Caller ID (Phone Number)
                  </Label>
                  <Input
                    value={twilioConfig.callerId}
                    onChange={(e) =>
                      setTwilioConfig((prev) => ({
                        ...prev,
                        callerId: e.target.value,
                      }))
                    }
                    placeholder="Enter caller ID phone number"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <Button
                onClick={() => saveIntegration("twilio", twilioConfig)}
                disabled={
                  saving.twilio ||
                  !twilioConfig.accountSid ||
                  !twilioConfig.apiKeySid
                }
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {saving.twilio ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>

        {/* ElevenLabs Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-[30px] h-[30px] flex items-center justify-center overflow-hidden">
                <img
                  src={elevenlabsLogo}
                  alt="ElevenLabs logo"
                  className="w-[30px] h-[30px] object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white text-sm sm:text-base">
                  ElevenLabs
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  AI voice synthesis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {getIntegrationStatus("elevenlabs").isConnected && (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="hidden sm:inline">Connected</span>
                </span>
              )}
            </div>
          </div>

          {/* Environment Credentials Status */}
          {envCredentials.elevenlabs?.configured && (
            <div className="rounded-lg border p-3 bg-white/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-white/80 font-medium">
                  Environment Credentials
                </span>
                {envValidations.elevenlabs?.valid ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Valid
                  </span>
                ) : envValidations.elevenlabs ? (
                  <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Invalid
                  </span>
                ) : null}
              </div>
              {envValidations.elevenlabs?.message && (
                <p className="text-xs text-white/60 mb-2">
                  {envValidations.elevenlabs.message}
                </p>
              )}
              <Button
                onClick={() => handleValidateEnvCredentials("elevenlabs")}
                disabled={validating.elevenlabs}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 text-xs"
              >
                {validating.elevenlabs ? (
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

          {/* Form - Show only if env credentials are not configured OR if configured but invalid */}
          {(showForms.elevenlabs ||
            !envCredentials.elevenlabs?.configured ||
            (envCredentials.elevenlabs?.configured &&
              envValidations.elevenlabs &&
              !envValidations.elevenlabs?.valid)) && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">API Key</Label>
                <Input
                  type="password"
                  value={elevenlabsConfig.apiKey}
                  onChange={(e) =>
                    setElevenlabsConfig({ apiKey: e.target.value })
                  }
                  placeholder="Enter ElevenLabs API key"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <Button
                onClick={() => saveIntegration("elevenlabs", elevenlabsConfig)}
                disabled={saving.elevenlabs || !elevenlabsConfig.apiKey}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {saving.elevenlabs ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};
