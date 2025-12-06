import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { userService, CreateUserData } from "@/services/user.service";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { toast } from "sonner";
import { getUserData } from "@/utils/authHelpers";
import { mailgunService } from "@/services/mailgun.service";
import API from "@/utils/api";

const TWILIO_CAPABILITIES = ["voice", "sms"] as const;
type TwilioCapability = (typeof TWILIO_CAPABILITIES)[number];

const UserCreate = () => {
  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
    roleId: "",
    status: "",
    mailgunEmail: "",
  });

  const [user, setUser] = useState<
    CreateUserData & { mailgunEmail?: string; roleId?: string }
  >({
    name: "",
    email: "",
    password: "",
    status: "",
    mailgunEmail: "",
    roleId: "",
  });

  const [twilioAreaCode, setTwilioAreaCode] = useState("");
  const [twilioCapabilities, setTwilioCapabilities] = useState<
    TwilioCapability[]
  >([...TWILIO_CAPABILITIES]);
  const [twilioStatusLoading, setTwilioStatusLoading] = useState(true);
  const [shouldProvisionTwilio, setShouldProvisionTwilio] = useState(true);
  const [twilioCredentialStatus, setTwilioCredentialStatus] = useState<{
    hasAllCredentials: boolean;
    missingFields: string[];
  }>({ hasAllCredentials: false, missingFields: [] });

  const [loading, setLoading] = useState(false);
  const [mailgunDomain, setMailgunDomain] = useState<string>("");
  const [suggestedEmail, setSuggestedEmail] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailUnique, setEmailUnique] = useState<boolean | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch available roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const response = await rbacService.getAllRoles();
        if (response.success && response.data) {
          setAvailableRoles(response.data);
        }
      } catch (error: any) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);
  const selectedRole = availableRoles.find((role) => role._id === user.roleId);
  const isTwilioRequired = selectedRole
    ? ["CompanyAdmin", "CompanyUser"].includes(selectedRole.type)
    : false;
  useEffect(() => {
    if (!selectedRole) return;
    const requiresTwilio = ["CompanyAdmin", "CompanyUser"].includes(
      selectedRole.type
    );
    setShouldProvisionTwilio(requiresTwilio);
  }, [selectedRole]);
  const isTwilioBlocked =
    shouldProvisionTwilio &&
    !twilioStatusLoading &&
    !twilioCredentialStatus.hasAllCredentials;

  // Fetch Mailgun domain from integration
  useEffect(() => {
    const fetchMailgunDomain = async () => {
      const user = getUserData();
      if (!user?.token) return;

      try {
        const response = await mailgunService.getIntegrationStatus();
        const domain =
          response.integration?.connectionData?.metadata?.domain || "";
        if (domain) {
          setMailgunDomain(domain);
        }
      } catch (error: any) {
        console.log("Mailgun not configured or not accessible");
      }
    };

    fetchMailgunDomain();
  }, []);

  useEffect(() => {
    const fetchTwilioStatus = async () => {
      try {
        setTwilioStatusLoading(true);
        const response = await API.get("/twilio/connection-check");
        if (response.data?.success) {
          const hasAllCredentials = Boolean(
            response.data.data?.hasAllCredentials
          );
          setTwilioCredentialStatus({
            hasAllCredentials,
            missingFields: response.data.data?.missingFields || [],
          });
        } else {
          setTwilioCredentialStatus({
            hasAllCredentials: false,
            missingFields: [],
          });
        }
      } catch (error) {
        setTwilioCredentialStatus({
          hasAllCredentials: false,
          missingFields: [],
        });
      } finally {
        setTwilioStatusLoading(false);
      }
    };

    fetchTwilioStatus();
  }, []);

  // Generate suggested email when name or email changes
  useEffect(() => {
    if (!mailgunDomain) return;

    const generateSuggestedEmail = () => {
      if (!user.name && !user.email) {
        setSuggestedEmail("");
        return;
      }

      // Create a username from name or email
      let username = "";
      if (user.name) {
        // Convert name to lowercase, replace spaces with dots, remove special chars
        username = user.name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, ".")
          .replace(/[^a-z0-9.]/g, "");
      } else if (user.email) {
        // Extract username from email (part before @)
        username = user.email.split("@")[0].toLowerCase();
      }

      if (username) {
        const suggested = `${username}@${mailgunDomain}`;
        setSuggestedEmail(suggested);

        // Auto-fill if mailgunEmail is empty
        if (!user.mailgunEmail) {
          setUser((prev) => ({ ...prev, mailgunEmail: suggested }));
        }
      }
    };

    generateSuggestedEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.name, user.email, mailgunDomain]);

  // Check email uniqueness when mailgunEmail changes
  useEffect(() => {
    const checkEmailUniqueness = async () => {
      if (!user.mailgunEmail || !mailgunDomain) {
        setEmailUnique(null);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.mailgunEmail)) {
        setEmailUnique(null);
        return;
      }

      // Don't check if it's the suggested email (we'll check on backend)
      if (user.mailgunEmail === suggestedEmail) {
        setEmailUnique(true);
        return;
      }

      setIsCheckingEmail(true);
      try {
        // Check if email is unique by trying to get users with this email
        // We'll validate on backend, but we can show a loading state
        setEmailUnique(null);
      } catch (error) {
        console.error("Error checking email uniqueness:", error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmailUniqueness, 500);
    return () => clearTimeout(timeoutId);
  }, [user.mailgunEmail, mailgunDomain, suggestedEmail]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleUseSuggestedEmail = () => {
    if (suggestedEmail) {
      setUser((prev) => ({ ...prev, mailgunEmail: suggestedEmail }));
      setEmailUnique(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({
      email: "",
      name: "",
      password: "",
      roleId: "",
      status: "",
      mailgunEmail: "",
    });

    // Validate RBAC role is selected
    if (!user.roleId || user.roleId === "none") {
      setErrors((prev) => ({
        ...prev,
        roleId: "Please select an RBAC role",
      }));
      setLoading(false);
      return;
    }

    // Validate mailgunEmail format if provided
    if (user.mailgunEmail && mailgunDomain) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.mailgunEmail)) {
        setErrors((prev) => ({
          ...prev,
          mailgunEmail: "Please enter a valid email address",
        }));
        setLoading(false);
        return;
      }

      // Ensure email uses the correct domain
      if (!user.mailgunEmail.endsWith(`@${mailgunDomain}`)) {
        setErrors((prev) => ({
          ...prev,
          mailgunEmail: `Email must use the domain @${mailgunDomain}`,
        }));
        setLoading(false);
        return;
      }
    }

    if (isTwilioBlocked) {
      toast.error(
        "Connect your Twilio account in Settings → Integrations before creating team members."
      );
      setLoading(false);
      return;
    }

    try {
      const payload: CreateUserData = { ...user };

      if (shouldProvisionTwilio) {
        payload.twilio = {
          shouldProvision: true,
          areaCode: twilioAreaCode || undefined,
          capabilities: twilioCapabilities,
        };
      } else {
        payload.twilio = { shouldProvision: false };
      }

      const response = await userService.createUser(payload);

      if (response.success) {
        toast.success("User created successfully");
        navigate("/users");
      } else {
        toast.error("User creation failed");
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/");
        } else if (
          error.response.status === 422 &&
          Array.isArray(error.response.data.errors)
        ) {
          const newErrors = {
            name: "",
            email: "",
            password: "",
            roleId: "",
            status: "",
            mailgunEmail: "",
          };
          error.response.data.errors.forEach((err: any) => {
            if (newErrors[err.path as keyof typeof newErrors] === "") {
              newErrors[err.path as keyof typeof newErrors] = err.msg;
            }
          });
          setErrors(newErrors);
        } else {
          toast.error(error.response?.data?.message || "An error occurred");
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl md:text-[36px] font-semibold tracking-tight">
              Create Team Member
            </h1>
            <p className="text-white/60 text-sm mt-2">
              Add a new team member to your organization
            </p>
          </div>

          {/* Form Card */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            onSubmit={handleSaveProfile}
          >
            <Card className="relative pt-3 sm:pt-4 px-3 sm:px-6 pb-4 sm:pb-6 rounded-xl sm:rounded-[30px] border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]">
              <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-0">
                {/* Row 1: Name and Email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
                >
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-white/90 text-sm font-medium"
                    >
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={user.name}
                      onChange={handleInputChange}
                      className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-white/90 text-sm font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={user.email}
                      onChange={handleInputChange}
                      className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Row 2: Password and Role */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
                >
                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-white/90 text-sm font-medium"
                    >
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      value={user.password}
                      onChange={handleInputChange}
                      className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                      placeholder="Enter password"
                    />
                    {errors.password && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* RBAC Role Selection */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="roleId"
                      className="text-white/90 text-sm font-medium"
                    >
                      Role <span className="text-red-400">*</span>
                    </Label>
                    <Select
                      value={user.roleId || ""}
                      onValueChange={(value) => {
                        setUser((prev) => ({ ...prev, roleId: value }));
                        setErrors((prev) => ({ ...prev, roleId: "" }));
                      }}
                      disabled={loadingRoles}
                    >
                      <SelectTrigger className="rounded-full !bg-black/35 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40 h-[41px] [&>span]:text-white">
                        <SelectValue
                          placeholder={
                            loadingRoles ? "Loading roles..." : "Select Role"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B1B1B] border border-white/10 backdrop-blur max-h-[300px]">
                        {availableRoles.map((role) => (
                          <SelectItem
                            key={role._id}
                            value={role._id}
                            className="text-white hover:bg-white/10 focus:bg-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <span>{role.displayName}</span>
                              <span className="text-xs text-white/50">
                                ({role.type})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.roleId && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.roleId}
                      </p>
                    )}
                    <p className="text-white/50 text-xs">
                      Select a role with specific permissions for this user
                    </p>
                  </div>
                </motion.div>

                {/* Status and Mailgun Email Row */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
                >
                  {/* Status Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="status"
                      className="text-white/90 text-sm font-medium"
                    >
                      Status
                    </Label>
                    <Select
                      value={user.status}
                      onValueChange={(value) => {
                        setUser((prev) => ({ ...prev, status: value }));
                        setErrors((prev) => ({ ...prev, status: "" }));
                      }}
                    >
                      <SelectTrigger className="rounded-full !bg-black/35 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40 h-[41px] [&>span]:text-white">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B1B1B] border border-white/10 backdrop-blur">
                        <SelectItem
                          value="active"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          Active
                        </SelectItem>
                        <SelectItem
                          value="inactive"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.status}
                      </p>
                    )}
                  </div>

                  {/* Mailgun Email Field */}
                  {mailgunDomain && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="mailgunEmail"
                        className="text-white/90 text-sm font-medium"
                      >
                        Mailgun Email
                      </Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="mailgunEmail"
                            type="email"
                            name="mailgunEmail"
                            value={user.mailgunEmail || ""}
                            onChange={(e) => {
                              setUser((prev) => ({
                                ...prev,
                                mailgunEmail: e.target.value,
                              }));
                              setErrors((prev) => ({
                                ...prev,
                                mailgunEmail: "",
                              }));
                              setEmailUnique(null);
                            }}
                            className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                            placeholder={`Enter email (e.g., ${
                              suggestedEmail || `user@${mailgunDomain}`
                            })`}
                          />
                          {suggestedEmail &&
                            suggestedEmail !== user.mailgunEmail && (
                              <Button
                                type="button"
                                onClick={handleUseSuggestedEmail}
                                className="rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs px-3 whitespace-nowrap"
                              >
                                Use Suggested
                              </Button>
                            )}
                        </div>
                        {suggestedEmail && (
                          <p className="text-xs text-white/60">
                            Suggested:{" "}
                            <button
                              type="button"
                              onClick={handleUseSuggestedEmail}
                              className="text-cyan-400 hover:text-cyan-300 underline"
                            >
                              {suggestedEmail}
                            </button>
                          </p>
                        )}
                        {isCheckingEmail && (
                          <p className="text-xs text-white/60">
                            Checking availability...
                          </p>
                        )}
                        {user.mailgunEmail && emailUnique === false && (
                          <p className="text-xs text-red-400">
                            This email is already in use
                          </p>
                        )}
                      </div>
                      {errors.mailgunEmail && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.mailgunEmail}
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Twilio Provisioning */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                  className="space-y-3 border border-white/10 rounded-2xl p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white text-base font-semibold">
                        Twilio provisioning
                      </h3>
                      <span
                        className={`text-xs font-medium ${
                          twilioStatusLoading
                            ? "text-white/60"
                            : twilioCredentialStatus.hasAllCredentials
                            ? "text-emerald-400"
                            : "text-amber-300"
                        }`}
                      >
                        {twilioStatusLoading
                          ? "Checking..."
                          : twilioCredentialStatus.hasAllCredentials
                          ? "Ready"
                          : "Missing credentials"}
                      </span>
                    </div>
                    <p className="text-white/60 text-xs">
                      Dedicated TwiML app & phone number per member
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Switch
                      id="twilioProvisionToggle"
                      checked={shouldProvisionTwilio}
                      onCheckedChange={(value) =>
                        setShouldProvisionTwilio(Boolean(value))
                      }
                      disabled={twilioStatusLoading}
                    />
                    <Label
                      htmlFor="twilioProvisionToggle"
                      className="text-white/80 text-sm font-medium"
                    >
                      Provision Twilio assets for this team member
                    </Label>
                  </div>

                  {isTwilioBlocked && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-2 text-amber-100 text-xs">
                      {twilioCredentialStatus.missingFields.length > 0
                        ? `Missing: ${twilioCredentialStatus.missingFields.join(
                            ", "
                          )}`
                        : "Add Twilio credentials in Settings → Integrations"}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="twilioAreaCode"
                      className="text-white/90 text-sm font-medium"
                    >
                      Preferred area code
                    </Label>
                    <Input
                      id="twilioAreaCode"
                      name="twilioAreaCode"
                      placeholder="e.g. 415"
                      value={twilioAreaCode}
                      maxLength={3}
                      onChange={(event) => {
                        const digitsOnly = event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 3);
                        setTwilioAreaCode(digitsOnly);
                      }}
                      disabled={!shouldProvisionTwilio}
                      className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                    />
                    <p className="text-white/50 text-xs">
                      Blank uses global default
                    </p>
                  </div>

                  {/* <div className="space-y-2">
                    <p className="text-white/90 text-sm font-medium">
                      Capabilities
                    </p>
                    <div className="flex flex-wrap gap-6">
                      {TWILIO_CAPABILITIES.map((capability) => {
                        const checked = twilioCapabilities.includes(capability);
                        return (
                          <label
                            key={capability}
                            className="flex items-center gap-2 text-white/80 text-sm cursor-pointer select-none"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                setTwilioCapabilities((prev) => {
                                  const currentlySelected = prev.includes(
                                    capability as "voice" | "sms"
                                  );
                                  if (value && !currentlySelected) {
                                    return [...prev, capability];
                                  }
                                  if (!value && currentlySelected) {
                                    if (prev.length === 1) {
                                      return prev;
                                    }
                                    return prev.filter(
                                      (item) => item !== capability
                                    );
                                  }
                                  return prev;
                                });
                              }}
                              disabled={
                                !shouldProvisionTwilio || isTwilioBlocked
                              }
                            />
                            {capability.toUpperCase()}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-white/50 text-xs">
                      At least one required
                    </p>
                  </div> */}
                </motion.div>
              </CardContent>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
              >
                <CardFooter className="flex flex-col sm:flex-row justify-end border-t border-white/10 pt-4 sm:pt-6 gap-3 px-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-colors"
                    onClick={() => navigate("/users")}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || isTwilioBlocked}
                    className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-white hover:brightness-110 transition-all"
                  >
                    {loading ? "Creating..." : "Create Team Member"}
                  </Button>
                  {isTwilioBlocked && (
                    <p className="text-xs text-amber-300 text-center sm:text-right w-full">
                      Add the required Twilio credentials in Settings →
                      Integrations or disable Twilio provisioning for this team
                      member.
                    </p>
                  )}
                </CardFooter>
              </motion.div>
            </Card>
          </motion.form>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default UserCreate;
