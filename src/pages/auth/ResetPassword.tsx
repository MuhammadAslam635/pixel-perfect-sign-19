import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { authService } from "@/services/auth.service";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirm: "",
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;
    if (field === "password") {
      setPassword(value);
    } else {
      setConfirm(value);
    }
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ password: "", confirm: "" });

    // Validate fields
    const newErrors = { password: "", confirm: "" };
    let hasError = false;

    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }

    if (!confirm) {
      newErrors.confirm = "Confirm password is required";
      hasError = true;
    } else if (password !== confirm) {
      newErrors.confirm = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword({
        token,
        password,
        confirm_password: confirm,
      });

      if (response.success) {
        toast.success(response.message || "Password reset successfully");
        setPassword("");
        setConfirm("");

        // Redirect to login after 1.5 seconds
        setTimeout(() => {
          navigate("/");
        }, 1500);
      } else {
        toast.error(response.message || "Failed to reset password");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Network error. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={
        <Link
          to="/"
          className="text-sm font-medium text-white hover:text-white/80 transition-colors"
        >
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-[Poppins]">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-light text-white">
            New Password
          </Label>
          <div className="relative">
            <AuthInput
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter New Password"
              value={password}
              onChange={(e) => handleChange(e, "password")}
              className="text-base font-normal text-white/70"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white z-20 cursor-pointer"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-400">{errors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="text-base font-light text-white">
            Confirm Password
          </Label>
          <div className="relative">
            <AuthInput
              id="confirm"
              type={showConfirmPassword ? "text" : "password"}
              name="confirm"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => handleChange(e, "confirm")}
              className="text-base font-normal text-white/70"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white z-20 cursor-pointer"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirm && (
            <p className="text-sm text-red-400">{errors.confirm}</p>
          )}
        </div>
        <Button
          type="submit"
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
