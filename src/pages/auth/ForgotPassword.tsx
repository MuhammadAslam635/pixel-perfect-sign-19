import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthAuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { authService } from "@/services/auth.service";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLAuthInputElement>) => {
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
        <Link to="/" className="hover:text-primary transition-colors">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
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
            className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
            onChange={handleChange}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full h-[46px] bg-gradient-to-r from-[#66B0B7] to-[#3E64B3] text-white rounded-xl mt-4"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
        <p className="text-center text-lg text-[#FFFFFF66] mt-6">
          Didn’t receive it?{" "}
          <Link
            to="/resend-email"
            className="hover:opacity-80 font-normal transition-opacity bg-[linear-gradient(180deg,#8B36E9_0%,#6586FF_50%,#2C5FEC_100%)] bg-clip-text text-transparent"
          >
            Resend email
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
