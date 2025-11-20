import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import { Link } from "react-router-dom";

const VerifyEmail = () => {
  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle={
        <span className="font-[Poppins] text-base font-light text-white/65">
          We sent a verification link to your email.
        </span>
      }
    >
      <div className="space-y-5 font-[Poppins]">
        <p className="text-center text-base text-white/70">
          Click the link in your inbox to verify your account.
        </p>
        <Button className="h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110">
          Open Email App
        </Button>
        <div className="text-center text-base text-white/60">
          Didn’t get it?{" "}
          <Link
            to="/resend-email"
            className="font-semibold text-transparent transition-opacity hover:opacity-80 bg-[linear-gradient(120deg,#8B36E9_0%,#5B79FF_60%,#3F64FF_100%)] bg-clip-text"
          >
            Resend email
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
