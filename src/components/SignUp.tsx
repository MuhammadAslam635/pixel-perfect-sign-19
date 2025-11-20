import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { AuthInput } from "@/components/ui/auth-input";
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
    e: React.ChangeEvent<HTMLInputElement>,
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
        <p className="font-[Poppins] text-lg font-light text-white/65 underline underline-offset-[6px]">
          Sign up to continue
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-[Poppins]">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-base font-light text-white">
            Company Name
          </Label>
          <AuthInput
            id="companyName"
            type="text"
            name="companyName"
            placeholder="Enter Your Company Name"
            value={companyName}
            onChange={(e) => handleChange(e, "companyName")}
            className="text-base font-normal text-white/70"
            disabled={loading}
          />
          {errors.companyName && (
            <p className="text-sm text-red-400">{errors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className="text-base font-light text-white">
            Industry (Optional)
          </Label>
          <AuthInput
            id="industry"
            type="text"
            name="industry"
            placeholder="Enter Your Industry Name"
            value={industry}
            onChange={(e) => handleChange(e, "industry")}
            className="text-base font-normal text-white/70"
            disabled={loading}
          />
        </div>

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
            onChange={(e) => handleChange(e, "email")}
            className="text-base font-normal text-white/70"
            disabled={loading}
          />
          {errors.email && <p className="text-sm text-red-400">{errors.email}</p>}
        </div>

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
          {errors.password && <p className="text-sm text-red-400">{errors.password}</p>}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-base font-light text-white"
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
          {errors.confirmPassword && (
            <p className="text-sm text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <Button
          type="submit"
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </Button>

        <p className="text-center text-base text-white/70">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-semibold text-transparent transition-opacity hover:opacity-80 bg-[linear-gradient(120deg,#8B36E9_0%,#5B79FF_60%,#3F64FF_100%)] bg-clip-text"
          >
            Login here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
