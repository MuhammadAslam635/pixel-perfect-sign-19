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
        }
      } catch (error) {
        console.error("Failed to load preferences:", error);
      } finally {
        setIsLoadingTimezone(false);
      }
    };
    fetchPreferences();
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
          description:
            (error.response.data as { message?: string })?.message ||
            "An error occurred while updating your profile.",
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
    </form>
  );
};

export default ProfileTab;
