import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "@/store/slices/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { authService } from "@/services/auth.service";
import { leadsService } from "@/services/leads.service";
import { fetchUserPermissions } from "@/store/slices/permissionsSlice";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });

    // Validate fields
    const newErrors = { email: "", password: "" };
    let hasError = false;

    if (!email) {
      newErrors.email = "Email is required";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    dispatch(loginStart());

    try {
      const response = await authService.login({
        email,
        password,
      });

      if (response.success && response.user) {
        dispatch(
          loginSuccess({
            email: response.user.email,
            name: response.user.name || response.user.email,
            ...response.user,
          })
        );
        dispatch(fetchUserPermissions());

        // Check if user needs to change password
        if (response.user.requiresPasswordChange) {
          toast.info("Please change your temporary password to continue.");
          navigate("/change-password");
          return;
        }

        // After successful login, immediately fetch leads once
        // and log the response so we can inspect it during development.
        try {
          const leadsResponse = await leadsService.getLeads({
            page: 1,
            limit: 10,
          });
          // This will appear in the browser devtools console.
          // It will NOT show in the backend terminal.
          // For server-side logging, see backend `listLeads` logs.
          console.log("[Post-login] /leads/list response:", leadsResponse);
        } catch (leadsError) {
          console.error("[Post-login] Error fetching leads:", leadsError);
        }

        toast.success("Login successful!");
        navigate("/dashboard");
      } else {
        dispatch(loginFailure(response.message || "Login failed"));
        toast.error(response.message || "Login failed");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        "Network error. Please try again.";
      dispatch(loginFailure(errorMessage));
      toast.error(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
      setErrors((prev) => ({ ...prev, email: "" }));
    } else if (name === "password") {
      setPassword(value);
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <AuthLayout
      title="Login"
      subtitle={
        <p className="font-[Poppins] text-lg font-light text-white/65 underline underline-offset-[6px]">
          Sign In to continue
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 font-[Poppins]">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-light text-white">
            Email
          </Label>
          <AuthInput
            id="email"
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={handleChange}
            className="text-base font-normal text-white/70"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-light text-white">
            Password
          </Label>
          <div className="relative">
            <AuthInput
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Your Password"
              value={password}
              onChange={handleChange}
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
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-white hover:text-white/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </Button>

        {/* Sign Up Link */}
        <p className="mt-4 text-center text-base text-white/55">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-transparent transition-opacity hover:opacity-80 bg-[linear-gradient(120deg,#8B36E9_0%,#5B79FF_60%,#3F64FF_100%)] bg-clip-text"
          >
            Sign Up here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
