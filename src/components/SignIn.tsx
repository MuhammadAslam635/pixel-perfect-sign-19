import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  setMfaRequired,
} from "@/store/slices/authSlice";
import { AppDispatch, RootState } from "@/store/store";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { authService } from "@/services/auth.service";
import { leadsService } from "@/services/leads.service";
import { onboardingService } from "@/services/onboarding.service";
import { fetchUserPermissions } from "@/store/slices/permissionsSlice";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    mfaCode: "",
  });
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { loading, mfaRequired, mfaToken } = useSelector((state: RootState) => state.auth);

  const handleLoginSuccess = async (responseUser: any) => {
        dispatch(
          loginSuccess({
            email: responseUser.email,
            name: responseUser.name || responseUser.email,
            ...responseUser,
          })
        );
        dispatch(fetchUserPermissions());

        // Clear any onboarding skip flags on login to force status check
        // This ensures users who skipped onboarding are redirected back
        sessionStorage.removeItem("onboarding_skipped");

        // Check if user needs to change password
        if (responseUser.requiresPasswordChange) {
          toast.info("Please change your temporary password to continue.");
          navigate("/change-password");
          return;
        }

        // Check onboarding status before allowing dashboard access
        // Only check for Company and CompanyAdmin roles
        const userRole = responseUser.role;
        if (userRole === "Company" || userRole === "CompanyAdmin") {
          // Clear any previous session flags on new login
          sessionStorage.removeItem("has_redirected_to_onboarding");
          sessionStorage.removeItem("onboarding_skipped");
          sessionStorage.removeItem("onboarding_just_completed");
          
          setCheckingOnboarding(true);
          try {
            const onboardingResponse =
              await onboardingService.getOnboardingStatus();
            if (onboardingResponse.success) {
              const onboardingStatus = onboardingResponse.data.status;

              // If onboarding is not completed, redirect to onboarding
              if (
                onboardingStatus === "not_started" ||
                onboardingStatus === "draft" ||
                onboardingStatus === "in_progress"
              ) {
                setCheckingOnboarding(false);
                toast.info("Please complete your onboarding to continue.");
                navigate("/onboarding");
                return;
              }
            }
          } catch (onboardingError) {
            // If 404, onboarding doesn't exist - redirect to onboarding
            if (
              onboardingError instanceof AxiosError &&
              onboardingError.response?.status === 404
            ) {
              setCheckingOnboarding(false);
              toast.info("Please complete your onboarding to continue.");
              navigate("/onboarding");
              return;
            }
            // For other errors, log but don't block - allow dashboard access
            console.error("Error checking onboarding status:", onboardingError);
          } finally {
            setCheckingOnboarding(false);
          }
        }

        // After successful login, immediately fetch leads once
        try {
          await leadsService.getLeads({
            page: 1,
            limit: 10,
          });
        } catch (leadsError) {
          console.error("[Post-login] Error fetching leads:", leadsError);
        }

        toast.success("Login successful!");
        
        // Redirect to appropriate dashboard based on user role
        const dashboardPath = responseUser.role === "Admin" 
          ? "/admin/dashboard" 
          : "/dashboard";
        navigate(dashboardPath);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "", password: "", mfaCode: "" });

    // Validate fields
    const newErrors = { email: "", password: "", mfaCode: "" };
    let hasError = false;

    if (mfaRequired) {
      if (!mfaCode) {
        newErrors.mfaCode = "Code is required";
        hasError = true;
      }
    } else {
      if (!email) {
        newErrors.email = "Email is required";
        hasError = true;
      }
      if (!password) {
        newErrors.password = "Password is required";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    dispatch(loginStart());

    try {
      let response;
      
      if (mfaRequired && mfaToken) {
         response = await authService.verifyLogin2FA({
           mfaToken,
           token: mfaCode
         });
      } else {
         response = await authService.login({
          email,
          password,
        });
      }

      if (response.success) {
        if ((response as any).mfaRequired) {
          dispatch(setMfaRequired({ required: true, token: (response as any).mfaToken }));
          toast.info(response.message || "Please enter 2FA code");
          return;
        }

        if (response.user) {
          await handleLoginSuccess(response.user);
        }
      } else {
        dispatch(loginFailure(response.message || "Login failed"));
        toast.error(response.message || "Login failed");
      }
    } catch (error) {
      const errorMessage =
        (error instanceof AxiosError && error.response?.data?.message) ||
        (error instanceof AxiosError &&
          error.response?.data?.errors?.[0]?.msg) ||
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
    } else if (name === "mfaCode") {
      setMfaCode(value);
      setErrors((prev) => ({ ...prev, mfaCode: "" }));
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
      {/* Loading overlay for onboarding check */}
      {checkingOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
            <p className="font-[Poppins] text-lg font-medium text-white">
              Checking onboarding status...
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5 font-[Poppins]">
        {mfaRequired ? (
           <div className="space-y-2">
            <Label htmlFor="mfaCode" className="text-base font-light text-white">
              Two-Factor Authentication Code
            </Label>
            <AuthInput
              id="mfaCode"
              type="text"
              name="mfaCode"
              placeholder="Enter 6-digit code"
              value={mfaCode}
              onChange={handleChange}
              className="text-base font-normal text-white/70"
              disabled={loading}
              autoFocus
            />
            {errors.mfaCode && (
              <p className="text-sm text-red-400">{errors.mfaCode}</p>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => dispatch(setMfaRequired({ required: false, token: null }))}
                className="text-sm font-medium text-white hover:text-white/80 transition-colors"
              >
                Back to Login
              </button>
            </div>
           </div>
        ) : (
          <>
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
          </>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
          disabled={loading || checkingOnboarding}
        >
          {loading || checkingOnboarding ? "Logging in..." : "Log In"}
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
