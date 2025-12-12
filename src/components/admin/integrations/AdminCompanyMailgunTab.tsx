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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Save, Settings, Mail } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import { adminService } from "@/services/admin.service";
import mailgunLogo from "@/assets/mailgun-icon.png";

interface Company {
  _id: string;
  company: string;
  name?: string;
  email: string;
}

export const AdminCompanyMailgunTab = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [suggestingEmail, setSuggestingEmail] = useState(false);

  const [mailgunConfig, setMailgunConfig] = useState({
    apiKey: "",
    domain: "",
    apiUrl: "",
    webhookSigningKey: "",
  });
  const [mailgunEmail, setMailgunEmail] = useState("");
  const [emailPrefix, setEmailPrefix] = useState("");
  const [suggestedEmail, setSuggestedEmail] = useState("");
  const [mailgunStatus, setMailgunStatus] = useState<{
    hasMailgun: boolean;
    isConnected: boolean;
    mailgunEmail: string | null;
  } | null>(null);

  const user = getUserData();
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (isAdmin) {
      fetchCompanies();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchMailgunStatus();
    } else {
      setMailgunStatus(null);
      setMailgunConfig({
        apiKey: "",
        domain: "",
        apiUrl: "",
        webhookSigningKey: "",
      });
      setMailgunEmail("");
      setSuggestedEmail("");
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    if (!user?.token) return;

    try {
      setLoadingCompanies(true);
      const response = await adminService.getCompanies({
        page: 1,
        limit: 1000,
        search: "",
        trashed: false,
      });

      if (response.success && response.data) {
        setCompanies(response.data.companies);
      }
    } catch (error: any) {
      console.error("Error fetching companies:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load companies.",
        variant: "destructive",
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const fetchMailgunStatus = async () => {
    if (!user?.token || !selectedCompanyId) return;

    try {
      setLoadingStatus(true);
      const response = await adminService.getCompanyMailgunStatus(
        selectedCompanyId
      );
      if (response.success && response.data) {
        setMailgunStatus({
          hasMailgun: response.data.hasMailgun,
          isConnected: response.data.isConnected,
          mailgunEmail: response.data.mailgunEmail,
        });

        // If Mailgun exists, load the configuration
        if (response.data.hasMailgun) {
          // Note: We don't expose the actual API key for security
          // Admin needs to re-enter credentials to update
          setMailgunEmail(response.data.mailgunEmail || "");
        }
      }
    } catch (error: any) {
      console.error("Error fetching Mailgun status:", error);
      setMailgunStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof mailgunConfig,
    value: string
  ) => {
    setMailgunConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleValidateConfig = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Error",
        description: "Please select a company first.",
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
          title: "Validation Error",
          description: "Please fill in all required Mailgun fields.",
          variant: "destructive",
        });
        return;
      }
    }

    setValidating(true);
    try {
      // Validate by attempting to save (backend will validate)
      const response = await adminService.saveCompanyMailgunConfig(
        selectedCompanyId,
        {
          ...mailgunConfig,
          mailgunEmail: mailgunEmail || undefined,
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Mailgun configuration validated successfully!",
        });
        await fetchMailgunStatus();
      }
    } catch (error: any) {
      console.error("Error validating Mailgun config:", error);
      toast({
        title: "Validation Failed",
        description:
          error?.response?.data?.message ||
          "Failed to validate Mailgun configuration. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSuggestEmail = async () => {
    if (!mailgunConfig.domain || !emailPrefix.trim()) {
      toast({
        title: "Error",
        description: "Please enter domain and prefix first.",
        variant: "destructive",
      });
      return;
    }

    setSuggestingEmail(true);
    try {
      // Generate suggested email
      const domain = mailgunConfig.domain.trim();
      const prefix = emailPrefix
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const suggested = `${prefix}@${domain}`;
      setSuggestedEmail(suggested);
      setMailgunEmail(suggested);
    } catch (error: any) {
      console.error("Error suggesting email:", error);
      toast({
        title: "Error",
        description: "Failed to suggest email address.",
        variant: "destructive",
      });
    } finally {
      setSuggestingEmail(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedCompanyId) {
      toast({
        title: "Error",
        description: "Please select a company first.",
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
          title: "Validation Error",
          description: "Please fill in all required Mailgun fields.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!mailgunEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Mailgun email address.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await adminService.saveCompanyMailgunConfig(
        selectedCompanyId,
        {
          ...mailgunConfig,
          mailgunEmail: mailgunEmail.trim(),
        }
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Mailgun configuration saved successfully.",
        });
        await fetchMailgunStatus();
        // Reset form
        setMailgunConfig({
          apiKey: "",
          domain: "",
          apiUrl: "",
          webhookSigningKey: "",
        });
        setMailgunEmail("");
        setEmailPrefix("");
        setSuggestedEmail("");
      }
    } catch (error: any) {
      console.error("Error saving Mailgun config:", error);
      toast({
        title: "Error",
        description:
          error?.response?.data?.message ||
          "Failed to save Mailgun configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCompany = companies.find((c) => c._id === selectedCompanyId);

  return (
    <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
      <CardHeader className="border-b border-white/10 bg-white/[0.02] px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CardTitle className="text-white text-base sm:text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Company Mailgun Configuration
          </CardTitle>
          <CardDescription className="text-white/60 text-sm">
            Configure Mailgun integration for company users
          </CardDescription>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {/* Company Selection */}
        <div className="space-y-2">
          <Label className="text-white/80 text-sm">Select Company</Label>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
            disabled={loadingCompanies}
          >
            <SelectTrigger className="bg-white/[0.06] border-white/10 text-white">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company._id} value={company._id}>
                  {company.company || company.name || company.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mailgun Status */}
        {selectedCompanyId && mailgunStatus && (
          <div className="rounded-lg border p-3 bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-white/80 font-medium">
                Mailgun Status
              </span>
              {mailgunStatus.isConnected ? (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs sm:text-sm text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Not Connected
                </span>
              )}
            </div>
            {mailgunStatus.mailgunEmail && (
              <p className="text-xs text-white/60 mt-2">
                Email: {mailgunStatus.mailgunEmail}
              </p>
            )}
          </div>
        )}

        {/* Mailgun Configuration Form */}
        {selectedCompanyId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4 sm:space-y-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
          >
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
                  Mailgun Configuration
                </p>
                <p className="text-xs sm:text-sm text-white/60 break-words">
                  {selectedCompany
                    ? `Configure Mailgun for ${
                        selectedCompany.company || selectedCompany.name
                      }`
                    : "Configure Mailgun API settings"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-white/10">
              <div className="space-y-2 sm:col-span-1">
                <Label className="text-white/80 text-sm">
                  MAILGUN_API_KEY <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="password"
                  value={mailgunConfig.apiKey}
                  onChange={(e) => handleInputChange("apiKey", e.target.value)}
                  placeholder="Enter Mailgun API key"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label className="text-white/80 text-sm">
                  MAILGUN_DOMAIN <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={mailgunConfig.domain}
                  onChange={(e) => handleInputChange("domain", e.target.value)}
                  placeholder="e.g., mg.yourdomain.com"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label className="text-white/80 text-sm">
                  MAILGUN_API_URL <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={mailgunConfig.apiUrl}
                  onChange={(e) => handleInputChange("apiUrl", e.target.value)}
                  placeholder="e.g., https://api.mailgun.net"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
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
                  onChange={(e) =>
                    handleInputChange("webhookSigningKey", e.target.value)
                  }
                  placeholder="Enter webhook signing key"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            {/* Email Configuration */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <Label className="text-white/80 text-sm">
                  Email Prefix{" "}
                  <span className="text-white/50 text-xs">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={emailPrefix}
                    onChange={(e) => setEmailPrefix(e.target.value)}
                    placeholder="e.g., support, sales, info"
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                  />
                  <Button
                    type="button"
                    onClick={handleSuggestEmail}
                    disabled={
                      !mailgunConfig.domain ||
                      !emailPrefix.trim() ||
                      suggestingEmail
                    }
                    variant="outline"
                    className="border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    {suggestingEmail ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      "Suggest Email"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white/50">
                  Enter a prefix to generate a unique email address
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80 text-sm">
                  Mailgun Email Address <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={mailgunEmail}
                  onChange={(e) => setMailgunEmail(e.target.value)}
                  placeholder="e.g., company@mg.yourdomain.com"
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
                />
                {suggestedEmail && (
                  <p className="text-xs text-emerald-400">
                    ✓ Suggested: {suggestedEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateConfig}
                disabled={validating || saving}
                className="w-full sm:w-auto border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10"
              >
                {validating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  "Validate Configuration"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSaveConfig}
                disabled={saving || !mailgunEmail.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {saving ? (
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
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
