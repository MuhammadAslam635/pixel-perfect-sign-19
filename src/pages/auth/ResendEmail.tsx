import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const ResendEmail = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setErrors({ email: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "" });

    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Verification email resent");
    }, 1000);
  };

  return (
    <AuthLayout
      title="Resend Verification Email"
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
            className="text-base font-normal text-white/70"
            value={email}
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
          {loading ? "Resending..." : "Resend Email"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResendEmail;
