import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
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
            name: response.user.company || response.user.email,
            ...response.user,
          })
        );
        dispatch(fetchUserPermissions());
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
        <div className="font-[poppins] font-normal text-lg text-[#FFFFFF4D] underline">
          Sign in to continue
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email */}
        <div className="space-y-1">
          <Label
            htmlFor="email"
            className="text-white text-base font-light font-[poppins]"
          >
            Email
          </Label>
          <AuthInput
            id="email"
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={email}
            onChange={handleChange}
            className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
            disabled={loading}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label
            htmlFor="password"
            className="text-white text-base font-light font-poppins"
          >
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
              className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-20 cursor-pointer"
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
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="font-[Poppins] font-medium text-base  text-white hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] hover:from-[#76C0C7] hover:to-[#4E74C3] text-white font-normal text-lg rounded-xl shadow-lg transition-all duration-300 mt-4"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        {/* Sign Up Link */}
        <p className="text-center text-lg text-[#FFFFFF66] mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="hover:opacity-80 font-normal transition-opacity bg-[linear-gradient(180deg,#8B36E9_0%,#6586FF_50%,#2C5FEC_100%)] bg-clip-text text-transparent"
          >
            Sign Up here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignIn;
