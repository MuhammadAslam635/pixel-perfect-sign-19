import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { authService } from "@/services/auth.service";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors({ email: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "" });

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);

    try {
      const response = await authService.forgotPassword({ email });

      if (response.success) {
        toast.success(response.message || "Reset link sent to your email");
        setEmail("");
      } else {
        toast.error(response.message || "Failed to send reset link");
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
      title="Forgot Password"
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
          <Label htmlFor="email" className="text-base font-light text-white">
            Email
          </Label>
          <AuthInput
            id="email"
            type="email"
            name="email"
            placeholder="Enter Your Email"
            value={email}
            className="text-base font-normal text-white/70"
            onChange={handleChange}
            disabled={loading}
          />
          {errors.email && (
            <p className="text-sm text-red-400">{errors.email}</p>
          )}
        </div>
        <Button
          type="submit"
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="mt-4 text-center text-base text-white/55">
          Didn’t receive it?{" "}
          <Link
            to="/resend-email"
            className="font-semibold text-transparent transition-opacity hover:opacity-80 bg-[linear-gradient(120deg,#8B36E9_0%,#5B79FF_60%,#3F64FF_100%)] bg-clip-text"
          >
            Resend email
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
