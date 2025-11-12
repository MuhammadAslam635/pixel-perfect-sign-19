import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import orbImage from "@/assets/orb-cyan.jpg";
import iconCyan from "@/assets/icon-cyan.png";
import gridPattern from "@/assets/grid-pattern.png";
import cardIcon from "@/assets/card-icon.png";
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
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
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
    <div className="min-h-[850px] w-full relative overflow-hidden bg-[#1A1A1A]">
      {/* Grid Pattern Background with teal glow overlay (keep PNG) */}
      <div className="absolute inset-0">
        {/* Base grid image */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[400px] opacity-100"
          style={{
            backgroundImage: `url(${gridPattern})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Teal glow overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(800px 180px at 50% 90%, rgba(105,179,183,0.20), transparent 80%),\n" +
              "radial-gradient(600px 160px at 40% 90%, rgba(105,179,183,0.12), transparent 80%)",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-8 left-8 z-20">
        <Logo />
      </div>

      {/* Content */}
      <div className="min-h-screen flex items-center justify-center py-6 relative z-10">
        {/* Register Card */}
        <div className="w-full max-w-[500px] relative">
          {/* Gradient Circle at top-right corner behind card */}
          <div className="absolute -top-20 -right-20 w-[260px] h-[260px] -z-10">
            <div className="mt-16 w-full h-full rounded-full bg-gradient-to-br from-[#66B0B7] to-[#3E64B3]" />
          </div>

          {/* Under-card teal glow (appears behind form, on grid) */}
          <div
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[85%] h-36 pointer-events-none -z-10"
            style={{
              background:
                "radial-gradient(60% 90% at 50% 0%, rgba(105,179,183,0.35), rgba(105,179,183,0.15) 35%, transparent 70%)",
              filter: "blur(18px)",
              opacity: 0.6,
              mixBlendMode: "screen",
            }}
          />

          {/* Glassmorphism Card with tighter spacing */}
          <div className="mt-24 relative rounded-3xl p-7 border border-white/15 bg-white/1 backdrop-blur-[200px] shadow-card ring-1 ring-white/10 back">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/10 to-transparent" />
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <img src={cardIcon} alt="Logo" className="w-6 h-6" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-center text-foreground mb-1">
              Register
            </h2>
            <p className="text-center text-muted-foreground/60 text-xs mb-4">
              <Link to="/" className="hover:text-primary transition-colors">
                Sign in to continue
              </Link>
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Company Name */}
              <div className="space-y-1">
                <Label
                  htmlFor="companyName"
                  className="text-foreground/80 text-sm font-normal"
                >
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Enter Your Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="text-foreground placeholder:text-muted-foreground/60 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Industry */}
              <div className="space-y-1">
                <Label
                  htmlFor="industry"
                  className="text-foreground/80 text-sm font-normal"
                >
                  Industry
                </Label>
                <Input
                  id="industry"
                  type="text"
                  placeholder="Enter Your Industry Name"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="text-foreground placeholder:text-muted-foreground/60 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className="text-foreground/80 text-sm font-normal"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-foreground placeholder:text-muted-foreground/60 transition-all"
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label
                  htmlFor="password"
                  className="text-foreground/80 text-sm font-normal"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Your Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-foreground placeholder:text-muted-foreground/60 transition-all pr-10"
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
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <Label
                  htmlFor="confirmPassword"
                  className="text-foreground/80 text-sm font-normal"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter Your Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-foreground placeholder:text-muted-foreground/60 transition-all pr-10"
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
              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-primary hover:text-primary-glow font-medium transition-colors"
                >
                  Login here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
