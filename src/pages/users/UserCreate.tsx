import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { userService, CreateUserData } from "@/services/user.service";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

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
  });

  const [user, setUser] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
  });

  const [twilioAreaCode, setTwilioAreaCode] = useState("");
  const [twilioCapabilities, setTwilioCapabilities] = useState<
    Array<"voice" | "sms">
  >([
    "voice",
    "sms",
  ]);

  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ email: "", name: "", password: "", role: "", status: "" });

    try {
      const payload: CreateUserData = { ...user };

      if (twilioAreaCode || twilioCapabilities.length > 0) {
        payload.twilio = {
          areaCode: twilioAreaCode || undefined,
          capabilities: twilioCapabilities,
        };
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
            role: "",
            status: "",
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

                {/* Twilio Provisioning */}
                <div className="space-y-3 border border-white/10 rounded-2xl p-4">
                  <div>
                    <h3 className="text-white text-base font-semibold">
                      Twilio provisioning
                    </h3>
                    <p className="text-white/60 text-sm">
                      Each employee gets a dedicated TwiML app and phone number.
                      You can customize the preferred area code and capabilities.
                    </p>
                  </div>

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
                      className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    />
                    <p className="text-white/50 text-xs">
                      Leave blank to use the global default area code.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-white/90 text-sm font-medium">
                      Capabilities
                    </p>
                    <div className="flex flex-wrap gap-6">
                      {["voice", "sms"].map((capability) => {
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
                                    capability
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
                            />
                            {capability.toUpperCase()}
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-white/50 text-xs">
                      At least one capability must remain selected.
                    </p>
                  </div>
                </div>
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
