import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { userService, CreateUserData } from "@/services/user.service";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import API from "@/utils/api";
import { getUserData } from "@/utils/authHelpers";

const UserCreate = () => {
  const navigate = useNavigate();
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

  const [user, setUser] = useState<CreateUserData & { mailgunEmail?: string }>({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
    mailgunEmail: "",
  });

  const [loading, setLoading] = useState(false);
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
      const response = await userService.createUser(user);

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

  return (
    <DashboardLayout>
      <div className="min-h-screen mt-20 px-4 sm:px-6 py-4 sm:py-8 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              Create Employee
            </h1>
            <p className="text-white/60 text-xs sm:text-sm">
              Add a new employee to your organization
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
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleInputChange}
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter password"
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
                  {loading ? "Creating..." : "Create Employee"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserCreate;
