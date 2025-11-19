import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { authService } from "@/services/auth.service";

const SignUp = () => {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLAuthInputElement>,
    field: string
  ) => {
    const value = e.target.value;

    // Update field value
    switch (field) {
      case "companyName":
        setCompanyName(value);
        break;
      case "industry":
        setIndustry(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
    }

    // Clear error for this field
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Validate all fields
    const newErrors = {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let hasError = false;

    if (!companyName) {
      newErrors.companyName = "Company name is required";
      hasError = true;
    }
    if (!email) {
      newErrors.email = "Email is required";
      hasError = true;
    }
    if (!password) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      hasError = true;
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
      hasError = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        company: companyName,
        industry: industry || "",
        email,
        password,
        confirm_password: confirmPassword,
      });

      if (response.success) {
        toast.success(
          response.message ||
            "Verification email sent! Please check your inbox."
        );
        // Clear form
        setCompanyName("");
        setIndustry("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(response.message || "Registration failed");
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
      title="Register"
      subtitle={
        <div className="font-[poppins] font-normal text-lg text-[#FFFFFF4D] underline">
          Sign up to continue
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Company Name */}
        <div className="space-y-1">
          <Label
            htmlFor="companyName"
            className="text-white text-base font-light font-[poppins]"
          >
            Company Name
          </Label>
          <AuthInput
            id="companyName"
            type="text"
            name="companyName"
            placeholder="Enter Your Company Name"
            value={companyName}
            onChange={(e) => handleChange(e, "companyName")}
            className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
            disabled={loading}
          />
          {errors.companyName && (
            <p className="text-red-500 text-sm">{errors.companyName}</p>
          )}
        </div>

        {/* Industry */}
        <div className="space-y-1">
          <Label
            htmlFor="industry"
            className="text-white text-base font-light font-[poppins]"
          >
            Industry
          </Label>
          <AuthInput
            id="industry"
            type="text"
            name="industry"
            placeholder="Enter Your Industry Name"
            value={industry}
            onChange={(e) => handleChange(e, "industry")}
            className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
            disabled={loading}
          />
        </div>

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
            onChange={(e) => handleChange(e, "email")}
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
            className="text-white text-base font-light font-[poppins]"
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
              onChange={(e) => handleChange(e, "password")}
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
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label
            htmlFor="confirmPassword"
            className="text-white text-base font-light font-[poppins]"
          >
            Confirm Password
          </Label>
          <div className="relative">
            <AuthInput
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Enter Your Password"
              value={confirmPassword}
              onChange={(e) => handleChange(e, "confirmPassword")}
              className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-20 cursor-pointer"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] hover:from-[#76C0C7] hover:to-[#4E74C3] text-white font-medium text-base rounded-xl shadow-lg transition-all duration-300 mt-4"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>

        {/* Sign In Link */}
        <p className="text-center text-lg text-[#FFFFFF66] mt-6">
          Already have an account?{" "}
          <Link
            to="/"
            className="hover:opacity-80 font-normal transition-opacity bg-[linear-gradient(180deg,#8B36E9_0%,#6586FF_50%,#2C5FEC_100%)] bg-clip-text text-transparent"
          >
            Login here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
