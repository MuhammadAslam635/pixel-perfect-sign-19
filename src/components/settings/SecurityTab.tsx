import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import API from "@/utils/api";
import { RootState } from "@/store/store";
import { logout } from "@/store/slices/authSlice";
import { TwoFactorSettings } from "./TwoFactorSettings";

interface PasswordFormState {
  id: string;
  old_password: string;
  new_password: string;
  confirm_password: string;
}

type PasswordErrors = Record<
  "old_password" | "new_password" | "confirm_password",
  string
>;

export const SecurityTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [formState, setFormState] = useState<PasswordFormState>({
    id: "",
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<PasswordErrors>({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user?._id) {
      setFormState((prev) => ({
        ...prev,
        id: user._id ?? "",
      }));
    }
  }, [user?._id]);

  const handleUnauthorized = () => {
    dispatch(logout());
    toast({
      title: "Session expired. Please log in again.",
      description: "Your session has expired. Please log in again to continue.",
      variant: "destructive",
    });
    navigate(user?.role === "Admin" ? "/admin/login" : "/login");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const validationErrors: PasswordErrors = {
      old_password: "",
      new_password: "",
      confirm_password: "",
    };

    if (!formState.old_password) {
      validationErrors.old_password = "Old password is required";
    }

    if (!formState.new_password) {
      validationErrors.new_password = "New password is required";
    } else if (formState.new_password.length < 8) {
      validationErrors.new_password = "Password must be at least 8 characters";
    } else if (formState.new_password === formState.old_password) {
      validationErrors.new_password =
        "New password cannot match the old password";
    }

    if (!formState.confirm_password) {
      validationErrors.confirm_password = "Confirm password is required";
    } else if (formState.confirm_password.length < 8) {
      validationErrors.confirm_password =
        "Confirm password must be at least 8 characters";
    } else if (formState.confirm_password !== formState.new_password) {
      validationErrors.confirm_password = "Passwords do not match";
    }

    return validationErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.values(validationErrors).some((val) => val)) {
      toast({
        title: "Fix validation errors",
        description: "Please review the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.token) {
      handleUnauthorized();
      return;
    }

    try {
      const endpoint =
        user.role === "Admin" ? "/admin/password-update" : "/password-update";

      const response = await API.post(endpoint, formState);

      if (response.status === 200 && response.data.success) {
        toast({
          title: "Password updated",
          description:
            response.data.message ||
            "Password updated successfully. You will need to log in again.",
        });

        setTimeout(() => {
          dispatch(logout());
          navigate(user?.role === "Admin" ? "/admin/login" : "/login");
        }, 1500);
      } else {
        toast({
          title: "Update failed",
          description:
            response.data.message ||
            "Password update failed. Please try again.",
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
          const serverErrors: PasswordErrors = {
            old_password: "",
            new_password: "",
            confirm_password: "",
          };

          (
            (
              error.response.data as {
                errors?: Array<{ path: keyof PasswordErrors; msg: string }>;
              }
            ).errors ?? []
          ).forEach((err) => {
            if (err.path in serverErrors && !serverErrors[err.path]) {
              serverErrors[err.path] = err.msg;
            }
          });
          setErrors(serverErrors);
          return;
        }

        toast({
          title: "Error",
          description:
            (error.response.data as { message?: string })?.message ||
            "An error occurred while updating your password.",
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

  const renderPasswordField = (
    field: keyof PasswordFormState,
    label: string,
    placeholder: string,
    show: boolean,
    toggle: () => void
  ) => {
    const value = formState[field];
    const error = errors[field];
    return (
      <div className="space-y-2">
        <Label htmlFor={field} className="text-white/70 font-medium">
          {label}
        </Label>
        <div className="relative">
          <Input
            id={field}
            name={field}
            type={show ? "text" : "password"}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="rounded-full border-white/10 bg-white/[0.06] pr-12 text-white placeholder:text-white/40"
          />
          <button
            type="button"
            onClick={toggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label={`Toggle ${label.toLowerCase()} visibility`}
          >
            {show ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
          <CardHeader className="border-b border-white/10 bg-white/[0.02]">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CardTitle className="text-white text-lg font-semibold">
                Password
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {renderPasswordField(
              "old_password",
              "Current Password",
              "Enter current password",
              showOld,
              () => setShowOld((prev) => !prev)
            )}
            {renderPasswordField(
              "new_password",
              "New Password",
              "Enter new password",
              showNew,
              () => setShowNew((prev) => !prev)
            )}
            {renderPasswordField(
              "confirm_password",
              "Confirm Password",
              "Confirm new password",
              showConfirm,
              () => setShowConfirm((prev) => !prev)
            )}
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
              Update Password
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <CardTitle className="text-white text-lg font-semibold">
              Two-Factor Authentication
            </CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent className="p-6">
           <TwoFactorSettings />
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
