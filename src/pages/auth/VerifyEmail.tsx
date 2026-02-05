import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import AuthLayout from "./AuthLayout";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    success: boolean;
    message: string;
    isApproved?: boolean;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await authService.verifyEmail(token);
      setVerificationStatus({
        success: response.success,
        message: response.message,
        isApproved: response.isApproved,
      });

      if (response.success) {
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to verify email. Please try again.";
      setVerificationStatus({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // If there's no token, show the initial verification prompt
  if (!token) {
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
            Didn't get it?{" "}
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
  }

  // Show loading state
  if (loading) {
    return (
      <AuthLayout
        title="Verifying Email"
        subtitle={
          <span className="font-[Poppins] text-base font-light text-white/65">
            Please wait while we verify your email...
          </span>
        }
      >
        <div className="space-y-5 font-[Poppins]">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
          <p className="text-center text-base text-white/70">
            Verifying your email address...
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Show verification result
  if (verificationStatus) {
    const isSuccess = verificationStatus.success;
    const isApproved = verificationStatus.isApproved === true;

    return (
      <AuthLayout
        title={
          isSuccess
            ? isApproved
              ? "Account Verified & Approved"
              : "Email Verified"
            : "Verification Failed"
        }
        subtitle={
          <span className="font-[Poppins] text-base font-light text-white/65">
            {verificationStatus.message}
          </span>
        }
      >
        <div className="space-y-5 font-[Poppins]">
          <div className="flex justify-center">
            {isSuccess ? (
              isApproved ? (
                <CheckCircle2 className="h-16 w-16 text-green-400" />
              ) : (
                <Clock className="h-16 w-16 text-yellow-400" />
              )
            ) : (
              <AlertCircle className="h-16 w-16 text-red-400" />
            )}
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-3">
            <p className="text-center text-base text-white/90 font-medium">
              {verificationStatus.message}
            </p>

            {isSuccess && !isApproved && (
              <p className="text-center text-sm text-white/60">
                Your account has been verified. You'll receive a welcome email
                once the admin approves your account.
              </p>
            )}

            {isSuccess && isApproved && (
              <p className="text-center text-sm text-white/60">
                You can now log in to access your EmpaTech account.
              </p>
            )}
          </div>

          {isSuccess && isApproved && (
            <Button
              onClick={() => navigate("/")}
              className="h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
            >
              Go to Login
            </Button>
          )}

          {isSuccess && !isApproved && (
            <Link to="/">
              <Button
                variant="outline"
                className="h-[56px] w-full rounded-[18px] border-white/20 text-lg font-semibold text-white transition-all hover:bg-white/10"
              >
                Back to Home
              </Button>
            </Link>
          )}

          {!isSuccess && (
            <div className="space-y-3">
              <Link to="/signup">
                <Button className="h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110">
                  Try Registering Again
                </Button>
              </Link>
              <Link to="/">
                <Button
                  variant="outline"
                  className="h-[56px] w-full rounded-[18px] border-white/20 text-lg font-semibold text-white transition-all hover:bg-white/10"
                >
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }

  return null;
};

export default VerifyEmail;
