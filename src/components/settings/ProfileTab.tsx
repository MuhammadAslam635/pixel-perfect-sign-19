import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import { RootState } from "@/store/store";
import { logout, updateUser } from "@/store/slices/authSlice";
import { userService } from "@/services/user.service";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";
import { TimezoneSelector } from "./TimezoneSelector";
import { TimePicker } from "@/components/ui/time-picker";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { AvailabilitySettings } from "./AvailabilitySettings";
import { Calendar, Copy, RefreshCw, ExternalLink } from "lucide-react";

interface ProfileErrors {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProfileFormState {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  token: string;
}

export const ProfileTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [timezone, setTimezone] = useState<string | null>(null);
  const [isLoadingTimezone, setIsLoadingTimezone] = useState(true);
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [activeHours, setActiveHours] = useState({
    start: "09:00",
    end: "17:00",
  });
  const [isSavingActiveHours, setIsSavingActiveHours] = useState(false);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [bookingLink, setBookingLink] = useState<string | null>(null);
  const [bookingSlug, setBookingSlug] = useState<string | null>(null);
  const [loadingBookingLink, setLoadingBookingLink] = useState(false);
  const [regeneratingLink, setRegeneratingLink] = useState(false);
  
  const [errors, setErrors] = useState<ProfileErrors>({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const [formState, setFormState] = useState<ProfileFormState>({
    id: "",
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    token: "",
  });

  // Fetch roles on mount to ensure we can resolve role IDs
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await rbacService.getAllRoles();
        if (response.success && response.data) {
          setAvailableRoles(response.data);
        }
      } catch (error) {
        console.error("Failed to load roles:", error);
      }
    };
    fetchRoles();
  }, []);

  // Fetch user preferences (timezone) on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoadingTimezone(true);
        const response = await userService.getUserPreferences();
        if (response.success && response.data?.preferences) {
          setTimezone(response.data.preferences.timezone || null);
          if (response.data.preferences.activeHours) {
            setActiveHours({
              start: response.data.preferences.activeHours.start || "09:00",
              end: response.data.preferences.activeHours.end || "17:00",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoadingTimezone(false);
      }
    };
    fetchPreferences();
  }, []);

  // Fetch booking link on mount
  useEffect(() => {
    const fetchBookingLink = async () => {
      try {
        setLoadingBookingLink(true);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const response = await axios.get(
          `${import.meta.env.VITE_APP_BACKEND_URL}/users/booking-link`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        if (response.data?.success) {
          setBookingLink(response.data.data.bookingUrl);
          setBookingSlug(response.data.data.slug);
        }
      } catch (error) {
        console.error("Failed to load booking link:", error);
      } finally {
        setLoadingBookingLink(false);
      }
    };
    fetchBookingLink();
  }, []);

  useEffect(() => {
    if (user) {
      setFormState({
        id: user._id ?? "",
        name: user.name ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        bio: user.bio ?? "",
        token: user.token ?? "",
      });
    }
  }, [user]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimezoneChange = async (newTimezone: string | null) => {
    setTimezone(newTimezone);
    
    try {
      setIsSavingTimezone(true);
      const response = await userService.updateUserPreferences({
        timezone: newTimezone,
      });
      
      if (response.success) {
        toast({
          title: "Timezone updated",
          description: "Your timezone preference has been saved.",
        });
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update timezone. Please try again.",
          variant: "destructive",
        });
        // Revert on failure
        const prefs = await userService.getUserPreferences();
        if (prefs.success && prefs.data?.preferences) {
          setTimezone(prefs.data.preferences.timezone || null);
        }
      }
    } catch (error: unknown) {
      console.error("Error updating timezone:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating your timezone.",
        variant: "destructive",
      });
      // Revert on error
      try {
        const prefs = await userService.getUserPreferences();
        if (prefs.success && prefs.data?.preferences) {
          setTimezone(prefs.data.preferences.timezone || null);
        }
      } catch (e) {
        // Ignore revert error
      }
    } finally {
      setIsSavingTimezone(false);
    }
  };

  const handleActiveHoursChange = async (
    type: "start" | "end",
    value: string
  ) => {
    const newActiveHours = {
      ...activeHours,
      [type]: value,
    };
    setActiveHours(newActiveHours);

    try {
      setIsSavingActiveHours(true);
      const response = await userService.updateUserPreferences({
        activeHours: newActiveHours,
      });

      if (response.success) {
        toast({
          title: "Active hours updated",
          description: "Your active hours have been saved.",
        });
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update active hours. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error updating active hours:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating active hours.",
        variant: "destructive",
      });
    } finally {
      setIsSavingActiveHours(false);
    }
  };

  const handleCopyBookingLink = () => {
    if (bookingLink) {
      navigator.clipboard.writeText(bookingLink);
      toast({
        title: "Copied!",
        description: "Booking link copied to clipboard",
      });
    }
  };

  const handleRegenerateLink = async () => {
    try {
      setRegeneratingLink(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/users/booking-link/regenerate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (response.data?.success) {
        setBookingLink(response.data.data.bookingUrl);
        setBookingSlug(response.data.data.slug);
        toast({
          title: "Link regenerated",
          description: "Your booking link has been updated",
        });
      }
    } catch (error: any) {
      console.error("Error regenerating link:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to regenerate link",
        variant: "destructive",
      });
    } finally {
      setRegeneratingLink(false);
    }
  };

  const handleUnauthorized = () => {
    dispatch(logout());
    toast({
      title: "Session expired. Please log in again.",
      description: "Your session has expired. Please log in again to continue.",
      variant: "destructive",
    });
    navigate("/login");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({ name: "", firstName: "", lastName: "", email: "" });

    try {
      const response = await userService.updateCompanyProfile({
        id: formState.id,
        name: formState.name,
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        bio: formState.bio,
      });

      if (response.success) {
        const existing = getUserData();
        const token = user?.token || existing?.token;
        const updatedUser = {
          ...response.user,
          token,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch(updateUser(updatedUser));

        toast({
          title: "Profile updated",
          description: response.message ?? "Changes saved successfully.",
        });
      } else {
        toast({
          title: "Update failed",
          description:
            response.message ??
            "Profile settings update failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (
          error.response.status === 422 &&
          Array.isArray((error.response.data as { errors?: unknown }).errors)
        ) {
          const validationErrors: ProfileErrors = {
            name: "",
            firstName: "",
            lastName: "",
            email: "",
          };
          (
            (
              error.response.data as {
                errors?: Array<{ path: keyof ProfileErrors; msg: string }>;
              }
            ).errors ?? []
          ).forEach((err) => {
            if (err.path in validationErrors && !validationErrors[err.path]) {
              validationErrors[err.path] = err.msg;
            }
          });
          setErrors(validationErrors);
          return;
        }
        toast({
          title: "Error",
          description: sanitizeErrorMessage(
            error,
            "An error occurred while updating your profile."
          ),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Network error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Get user's role name - prioritize roleId over legacy role
  // This logic must match UserList/AppRoutes to ensure consistency
  // CompanyAdmin MUST be allowed to edit Company Name
  const getUserRoleName = (): string | null => {
    if (!user) return null;
    
    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (user.roleId && typeof user.roleId === "object") {
      // @ts-ignore
      return (user.roleId as any).name;
    }
    
    // PRIORITY 2: Check string roleId against fetched roles
    if (user.roleId && typeof user.roleId === "string") {
      const foundRole = availableRoles.find(r => r._id === user.roleId);
      if (foundRole) return foundRole.name;
    }

    // PRIORITY 3: Fallback to legacy role string
    if (user.role && typeof user.role === "string") {
      return user.role;
    }
    return null;
  };

  const userRoleName = getUserRoleName();
  // Allow edit if Admin, Company, or CompanyAdmin
  // Deny if CompanyUser or CompanyViewer
  const canEditCompanyName = ["Company", "CompanyAdmin", "Admin"].includes(userRoleName || "");

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <CardTitle className="text-white text-lg font-semibold">
              Profile Information
            </CardTitle>
            <CardDescription className="text-white/60">
              Update your account details and company profile.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 pb-6 px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">
              Company Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              disabled={!canEditCompanyName}
              className={`bg-white/[0.04] border-white/10 text-white ${
                !canEditCompanyName
                  ? "opacity-60 cursor-not-allowed"
                  : ""
              } placeholder:text-white/40`}
            />
            {!canEditCompanyName && (
              <p className="text-xs text-white/50">
                Company name is protected and cannot be changed here.
              </p>
            )}
            {errors.name ? (
              <p className="text-sm text-rose-400">{errors.name}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white/80">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formState.firstName}
                onChange={handleInputChange}
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
              {errors.firstName ? (
                <p className="text-sm text-rose-400">{errors.firstName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white/80">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formState.lastName}
                onChange={handleInputChange}
                className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              />
              {errors.lastName ? (
                <p className="text-sm text-rose-400">{errors.lastName}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formState.email}
              disabled
              className="bg-white/[0.04] border-white/10 text-white/60 cursor-not-allowed"
            />
            {errors.email ? (
              <p className="text-sm text-rose-400">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white/80">
              Bio
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formState.bio}
              onChange={handleInputChange}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              rows={4}
            />
          </div>
 
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-white/80">
              Timezone
            </Label>
            <TimezoneSelector
              id="timezone"
              value={timezone}
              onValueChange={handleTimezoneChange}
              disabled={isLoadingTimezone || isSavingTimezone}
            />
            <p className="text-xs text-white/50">
              Your timezone is used by Skylar to provide accurate time information
              and scheduling assistance.
            </p>
          </div>

          {/* Availability Settings Section */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white/80 text-base">Availability Settings</Label>
                <p className="text-xs text-white/50 mt-1">
                  Manage your weekly working hours in Microsoft Calendar
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAvailabilityDialogOpen(true)}
                className="bg-white/[0.06] border-white/20 text-white hover:bg-white/[0.1]"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Set Availability
              </Button>
            </div>
          </div>

          {/* Booking Link Section */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div>
              <Label className="text-white/80 text-base">Meeting Booking Link</Label>
              <p className="text-xs text-white/50 mt-1">
                Share this link with leads to let them book meetings with you
              </p>
            </div>
            
            {loadingBookingLink ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
              </div>
            ) : bookingLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={bookingLink}
                    readOnly
                    className="bg-white/[0.04] border-white/10 text-white/80 cursor-default flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyBookingLink}
                    className="bg-white/[0.06] border-white/20 text-white hover:bg-white/[0.1] shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRegenerateLink}
                    disabled={regeneratingLink}
                    className="bg-white/[0.06] border-white/20 text-white hover:bg-white/[0.1] shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${regeneratingLink ? "animate-spin" : ""}`} />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <span>Slug: {bookingSlug}</span>
                  <span>•</span>
                  <a
                    href={bookingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white/90 transition-colors"
                  >
                    Preview page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/50">Failed to load booking link</p>
            )}
          </div>

{/* 
          <div className="space-y-2">
            <Label className="text-white/80">Active Hours (Legacy)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="startTime" className="text-xs text-white/60">
                  Start Time
                </Label>
                <TimePicker
                  value={activeHours.start}
                  onChange={(value) => handleActiveHoursChange("start", value)}
                  disabled={isSavingActiveHours}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endTime" className="text-xs text-white/60">
                  End Time
                </Label>
                <TimePicker
                  value={activeHours.end}
                  onChange={(value) => handleActiveHoursChange("end", value)}
                  disabled={isSavingActiveHours}
                />
              </div>
            </div>
            <p className="text-xs text-white/50">
              Note: Use "Set Availability" above to manage your Microsoft Calendar working hours.
            </p>
          </div>
          */}
        </CardContent>
        <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
          <Button
            type="submit"
            className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
            style={{
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>

      {/* Availability Settings Dialog */}
      <AvailabilitySettings
        open={availabilityDialogOpen}
        onOpenChange={setAvailabilityDialogOpen}
      />
    </form>
  );
};

export default ProfileTab;
