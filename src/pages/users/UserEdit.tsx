import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { userService, UpdateUserData } from "@/services/user.service";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { toast } from "sonner";
import { getUserData } from "@/utils/authHelpers";
import { mailgunService } from "@/services/mailgun.service";

const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
    roleId: "",
    status: "",
    mailgunEmail: "",
  });

  const [user, setUser] = useState<UpdateUserData & { password: string }>({
    name: "",
    email: "",
    password: "",
    status: "",
    mailgunEmail: "",
    roleId: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mailgunDomain, setMailgunDomain] = useState<string>("");
  const [suggestedEmail, setSuggestedEmail] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailUnique, setEmailUnique] = useState<boolean | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch available RBAC roles
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
        toast.error("Failed to load available roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

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
    const fetchUser = async () => {
      if (!id) {
        toast.error("User ID is missing");
        navigate("/users");
        return;
      }

      setFetching(true);
      try {
        const response = await userService.getUserById(id);

        if (response.success && response.data) {
          const userData = response.data;
          setUser({
            name: userData.name || "",
            email: userData.email || "",
            password: "",
            status: userData.status || "",
            mailgunEmail: userData.mailgunEmail || "",
            roleId: userData.roleId || "",
          });
        } else {
          toast.error(response.message || "Failed to fetch user");
          navigate("/users");
        }
      } catch (error: any) {
        console.error("Error fetching user:", error);
        if (error.response?.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/");
        } else {
          toast.error(error.response?.data?.message || "Failed to fetch user");
          navigate("/users");
        }
      } finally {
        setFetching(false);
      }
    };

    fetchUser();
  }, [id, navigate]);

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
      }
    };

    generateSuggestedEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.name, user.email, mailgunDomain]);

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

    try {
      // Validate RBAC role is selected
      if (!user.roleId || user.roleId === "none") {
        setErrors((prev) => ({
          ...prev,
          roleId: "Please select an RBAC role",
        }));
        setLoading(false);
        return;
      }

      // Prepare update data - exclude password if empty
      const updateData: UpdateUserData = {
        name: user.name,
        email: user.email,
        status: user.status,
        mailgunEmail: user.mailgunEmail,
        roleId: user.roleId,
      };

      // Only include password if it's provided
      if (user.password && user.password.trim() !== "") {
        updateData.password = user.password;
      }

      const response = await userService.updateUser(id!, updateData);

      if (response.success) {
        toast.success("User updated successfully");
        navigate("/users");
      } else {
        toast.error("User update failed");
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

  if (fetching) {
    return (
      <DashboardLayout>
        <div className="min-h-screen w-full px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-white/60 text-xs sm:text-sm">
              Loading user data...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              Edit Employee
            </h1>
            <p className="text-white/60 text-sm mt-2">
              Update employee information
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
                {/* Name Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                  className="space-y-2"
                >
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
                </motion.div>

                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                  className="space-y-2"
                >
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
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="password"
                    className="text-white/90 text-sm font-medium"
                  >
                    Password{" "}
                    <span className="text-white/50 text-xs">
                      (leave blank to keep current)
                    </span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleInputChange}
                    className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40"
                    placeholder="Enter new password (optional)"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </motion.div>

                {/* RBAC Role Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="rbacRole"
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
                    <SelectTrigger className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 [&>span]:text-white">
                      <SelectValue
                        placeholder={
                          loadingRoles ? "Loading roles..." : "Select Role"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B1B1B] border border-white/10 backdrop-blur">
                      {availableRoles.map((role) => (
                        <SelectItem
                          key={role._id}
                          value={role._id}
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          {role.displayName}{" "}
                          <span className="text-white/50 text-xs">
                            ({role.type})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.roleId && (
                    <p className="text-red-400 text-sm mt-1">{errors.roleId}</p>
                  )}
                  <p className="text-xs text-white/50">
                    Select a role with specific permissions for this user
                  </p>
                </motion.div>

                {/* Status Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                  className="space-y-2"
                >
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
                    <SelectTrigger className="h-10 rounded-lg bg-[#222B2C]/40 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40 focus:border-cyan-400/40 [&>span]:text-white">
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
                    <p className="text-red-400 text-sm mt-1">{errors.status}</p>
                  )}
                </motion.div>

                {/* Mailgun Email Field */}
                {mailgunDomain && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                    className="space-y-2"
                  >
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
                  </motion.div>
                )}
              </CardContent>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
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
                    disabled={loading}
                    className="w-full sm:w-auto rounded-lg bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-white hover:brightness-110 transition-all"
                  >
                    {loading ? "Updating..." : "Update Employee"}
                  </Button>
                </CardFooter>
              </motion.div>
            </Card>
          </motion.form>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default UserEdit;
