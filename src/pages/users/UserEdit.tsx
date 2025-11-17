import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import API from "@/utils/api";
import { getUserData } from "@/utils/authHelpers";

const UserEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const authState = useSelector((state: RootState) => state.auth);
  const userRole = authState.user?.role;

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
    role: "",
    status: "",
    mailgunEmail: "",
  });

  const [user, setUser] = useState<UpdateUserData & { password: string }>({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
    mailgunEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [mailgunDomain, setMailgunDomain] = useState<string>("");
  const [suggestedEmail, setSuggestedEmail] = useState<string>("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailUnique, setEmailUnique] = useState<boolean | null>(null);

  // Fetch Mailgun domain from integration
  useEffect(() => {
    const fetchMailgunDomain = async () => {
      const user = getUserData();
      if (!user?.token) return;

      try {
        const response = await API.get("/integration/mailgun");
        if (
          response.data?.success &&
          response.data?.integration?.connectionData?.metadata?.domain
        ) {
          const domain =
            response.data.integration.connectionData.metadata.domain;
          setMailgunDomain(domain);
        }
      } catch (error: any) {
        // If Mailgun is not configured, that's okay - field will be optional
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
            role: userData.role || "",
            status: userData.status || "",
            mailgunEmail: userData.mailgunEmail || "",
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
      role: "",
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
      // Prepare update data - exclude password if empty
      const updateData: UpdateUserData = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        mailgunEmail: user.mailgunEmail,
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
            role: "",
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
      <div className="min-h-screen w-full mt-20 px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              Edit Employee
            </h1>
            <p className="text-white/60 text-xs sm:text-sm">
              Update employee information
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSaveProfile}>
            <Card className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
              <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 px-4 sm:px-6">
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
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
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
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
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
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter new password (optional)"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-white/90 text-sm font-medium"
                  >
                    Role
                  </Label>
                  <Select
                    value={user.role}
                    onValueChange={(value) => {
                      setUser((prev) => ({ ...prev, role: value }));
                      setErrors((prev) => ({ ...prev, role: "" }));
                    }}
                  >
                    <SelectTrigger className="rounded-full !bg-black/35 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40 h-[41px] [&>span]:text-white">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgba(30,30,30,0.95)] border border-white/10 backdrop-blur">
                      {userRole === "Company" && (
                        <SelectItem
                          value="CompanyAdmin"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          Company Admin
                        </SelectItem>
                      )}
                      <SelectItem
                        value="CompanyUser"
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        Company User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-red-400 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

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
                    <SelectContent className="bg-[rgba(30,30,30,0.95)] border border-white/10 backdrop-blur">
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
                          className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
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
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row justify-end border-t border-white/10 pt-4 sm:pt-6 gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto rounded-full border border-white/10 bg-black/35 hover:bg-black/75 text-white"
                  onClick={() => navigate("/users")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {loading ? "Updating..." : "Update Employee"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserEdit;
