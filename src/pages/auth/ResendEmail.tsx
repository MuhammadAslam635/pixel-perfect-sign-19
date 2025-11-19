import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthAuthInput } from "@/components/ui/auth-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";

const ResendEmail = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLAuthInputElement>) => {
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
            className="font-[poppins] font-normal text-[#FFFFFF4D] text-sm"
            value={email}
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
          {loading ? "Resending..." : "Resend Email"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResendEmail;
