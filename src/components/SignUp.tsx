import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { AuthInput } from "@/components/ui/auth-input";
import {
  authService,
  InvitationDetails,
} from "@/services/auth.service";
import { getBrowserTimezone } from "@/utils/timezone";

const SignUp = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Detect browser timezone on component mount using Luxon
  const [browserTimezone, setBrowserTimezone] = useState<string | null>(null);
  
  useEffect(() => {
    // Get browser timezone using utility function
    const timezone = getBrowserTimezone();
    setBrowserTimezone(timezone);
  }, []);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null);
  const [invitationError, setInvitationError] = useState("");
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const isInviteFlow = Boolean(inviteToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (!inviteToken) {
      setInvitationDetails(null);
      setInvitationError("");
      return;
    }

    let isMounted = true;
    const fetchInvitationDetails = async () => {
      try {
        setInvitationLoading(true);
        setInvitationError("");
        const response = await authService.getInvitationDetails(inviteToken);
        if (!isMounted) return;
        setInvitationDetails(response.data);
        setEmail(response.data.email);
      } catch (error: any) {
        if (!isMounted) return;
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.errors?.[0]?.msg ||
          "Unable to load invitation details. Please contact your admin.";
        setInvitationDetails(null);
        setInvitationError(errorMessage);
      } finally {
        if (isMounted) {
          setInvitationLoading(false);
        }
      }
    };

    fetchInvitationDetails();
    return () => {
      isMounted = false;
    };
  }, [inviteToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const value = e.target.value;

    // Update field value
    switch (field) {
      case "firstName":
        setFirstName(value);
        break;
      case "lastName":
        setLastName(value);
        break;
      case "companyName":
        setCompanyName(value);
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
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    // Validate all fields
    const newErrors = {
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let hasError = false;

    if (isInviteFlow) {
      if (!firstName.trim()) {
        newErrors.firstName = "First name is required";
        hasError = true;
      }
      if (!lastName.trim()) {
        newErrors.lastName = "Last name is required";
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

      if (!inviteToken) {
        toast.error("Invitation token is missing. Please use the original link.");
        return;
      }

      if (invitationError || !invitationDetails) {
        toast.error(invitationError || "This invitation is no longer available.");
        return;
      }

      setLoading(true);
      try {
        const response = await authService.acceptInvitation({
          token: inviteToken,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
          confirm_password: confirmPassword,
          timezone: browserTimezone,
        });

        if (response.success) {
          toast.success(
            response.message || "Invitation accepted successfully. You can now log in."
          );
          setFirstName("");
          setLastName("");
          setPassword("");
          setConfirmPassword("");
          setTimeout(() => {
            navigate("/");
          }, 2000);
        } else {
          toast.error(response.message || "Unable to accept invitation.");
        }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Failed to accept invitation. Please try again.";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
      hasError = true;
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
      hasError = true;
    }

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
        firstName,
        lastName,
        name: companyName,
        email,
        password,
        confirm_password: confirmPassword,
        timezone: browserTimezone,
      });

      if (response.success) {
        toast.success(
          response.message ||
            "Verification email sent! Please check your inbox."
        );
        setFirstName("");
        setLastName("");
        setCompanyName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

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

  const disableInviteSubmission =
    isInviteFlow && (invitationLoading || !!invitationError || !invitationDetails);
  const isFormDisabled = loading || disableInviteSubmission;
  const submitLabel = loading
    ? isInviteFlow
      ? "Submitting..."
      : "Registering..."
    : isInviteFlow
    ? "Accept Invitation"
    : "Register";
  const invitationExpiryDisplay = invitationDetails
    ? new Date(invitationDetails.expiresAt).toLocaleString()
    : "";

  return (
    <AuthLayout
      title={isInviteFlow ? "Join Your Workspace" : "Register"}
      subtitle={
        <p className="font-[Poppins] text-lg font-light text-white/65 underline underline-offset-[6px]">
          {isInviteFlow
            ? "Complete the details below to activate your account."
            : "Sign up to continue"}
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-[Poppins]">
        {isInviteFlow ? (
          <>
            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-2">
              {invitationLoading ? (
                <p className="text-sm text-white/70">
                  Validating your invitation...
                </p>
              ) : invitationError ? (
                <p className="text-sm text-red-300">{invitationError}</p>
              ) : (
                <>
                  <p className="text-base text-white/80">
                    You were invited to{" "}
                    <span className="text-white font-semibold">
                      {invitationDetails?.companyName}
                    </span>
                  </p>
                  {invitationDetails?.role && (
                    <p className="text-sm text-white/70">
                      Role:&nbsp;
                      <span className="text-white font-semibold">
                        {invitationDetails.role}
                      </span>
                    </p>
                  )}
                  <p className="text-sm text-white/70">
                    Invited by{" "}
                    <span className="text-white">
                      {invitationDetails?.invitedBy}
                    </span>
                  </p>
                  <p className="text-xs text-white/60">
                    Expires {invitationExpiryDisplay}
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 w-1/2">
                <Label
                  htmlFor="firstName"
                  className="text-base font-light text-white"
                >
                  First Name
                </Label>
                <AuthInput
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => handleChange(e, "firstName")}
                  className="text-base font-normal text-white/70"
                  disabled={isFormDisabled}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2 w-1/2">
                <Label
                  htmlFor="lastName"
                  className="text-base font-light text-white"
                >
                  Last Name
                </Label>
                <AuthInput
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => handleChange(e, "lastName")}
                  className="text-base font-normal text-white/70"
                  disabled={isFormDisabled}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteEmail" className="text-base font-light text-white">
                Email
              </Label>
              <AuthInput
                id="inviteEmail"
                type="email"
                name="inviteEmail"
                value={email}
                readOnly
                disabled
                className="text-base font-normal text-white/70 opacity-70"
              />
              <p className="text-xs text-white/55">
                Invitations are tied to this email address.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-4">
              <div className="space-y-2 w-1/2">
                <Label
                  htmlFor="firstName"
                  className="text-base font-light text-white"
                >
                  First Name
                </Label>
                <AuthInput
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => handleChange(e, "firstName")}
                  className="text-base font-normal text-white/70"
                  disabled={isFormDisabled}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-400">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2 w-1/2">
                <Label
                  htmlFor="lastName"
                  className="text-base font-light text-white"
                >
                  Last Name
                </Label>
                <AuthInput
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => handleChange(e, "lastName")}
                  className="text-base font-normal text-white/70"
                  disabled={isFormDisabled}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="companyName"
                className="text-base font-light text-white"
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
                className="text-base font-normal text-white/70"
                disabled={isFormDisabled}
              />
              {errors.companyName && (
                <p className="text-sm text-red-400">{errors.companyName}</p>
              )}
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
                disabled={isFormDisabled}
              />
              {errors.email && (
                <p className="text-sm text-red-400">{errors.email}</p>
              )}
            </div>
          </>
        )}

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
              disabled={isFormDisabled}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white z-20 cursor-pointer"
              aria-label="Toggle password visibility"
              disabled={isFormDisabled}
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
              disabled={isFormDisabled}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-white z-20 cursor-pointer"
              aria-label="Toggle confirm password visibility"
              disabled={isFormDisabled}
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
          className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
          disabled={isFormDisabled}
        >
          {submitLabel}
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
