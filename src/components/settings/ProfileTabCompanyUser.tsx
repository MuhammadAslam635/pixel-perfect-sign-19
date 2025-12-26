import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import API from "@/utils/api";
import { getUserData } from "@/utils/authHelpers";
import { RootState } from "@/store/store";
import { logout, updateUser } from "@/store/slices/authSlice";

interface CompanyInfo {
  name?: string;
}

interface UserFormState {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
}

interface ProfileErrors {
  firstName: string;
  lastName: string;
  email: string;
}

export const ProfileTabCompanyUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "",
  });

  const [errors, setErrors] = useState<ProfileErrors>({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [formState, setFormState] = useState<UserFormState>({
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    token: "",
  });

  useEffect(() => {
    if (user) {
      setFormState({
        id: user._id ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        token: user.token ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!user?.token) return;
      try {
        const response = await API.get("/company-info");
        if (response.data?.success) {
          setCompanyInfo({ name: response.data.data?.name || "" });
        } else {
          setCompanyInfo({ name: "" });
        }
      } catch (error: unknown) {
        // console.error("Failed to fetch company info", error);
        setCompanyInfo({ name: "" });
        if (
          axios.isAxiosError(error) &&
          (error.response?.status === 401 || error.response?.status === 404)
        ) {
          handleUnauthorized();
        }
      }
    };

    fetchCompanyInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const handleUnauthorized = () => {
    dispatch(logout());
    toast({
      title: "Session expired. Please log in again.",
      description: "Your session has expired. Please log in again to continue.",
      variant: "destructive",
    });
    navigate("/login");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({ firstName: "", lastName: "", email: "" });

    if (!user?.token) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await API.post(
        "/company-user-profile-update",
        formState
      );

      if (response.status === 200 && response.data.success) {
        const existing = getUserData();
        const token = user?.token || existing?.token;
        const updatedUser = {
          ...existing,
          ...response.data.user,
          token,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch(updateUser(updatedUser));

        toast({
          title: "Profile updated",
          description: response.data.message ?? "Changes saved successfully.",
        });
      } else {
        toast({
          title: "Update failed",
          description:
            response.data.message ??
            "Profile settings update failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          handleUnauthorized();
          return;
        }
        if (
          error.response.status === 422 &&
          Array.isArray((error.response.data as { errors?: unknown }).errors)
        ) {
          const validationErrors: ProfileErrors = {
            firstName: "",
            lastName: "",
            email: "",
          };
          (
            (
              error.response.data as {
                errors?: Array<{ path: keyof ProfileErrors; msg: string }>;
              }
            ).errors ?? []
          ).forEach((err) => {
            if (err.path in validationErrors && !validationErrors[err.path]) {
              validationErrors[err.path] = err.msg;
            }
          });
          setErrors(validationErrors);
          return;
        }
        toast({
          title: "Error",
          description:
            (error.response.data as { message?: string })?.message ||
            "An error occurred while updating your profile.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Network error",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    }
  };

  const isViewer = user?.role === "CompanyViewer";

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6 border-white/10 bg-white/[0.035] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <CardTitle className="text-white text-lg font-semibold">
            Company Information
          </CardTitle>
          <CardDescription className="text-white/60">
            Details provided by your organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-6 pb-6">
          <div>
            <Label className="text-white/70">Company Name</Label>
            <div className="mt-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-white/90">
              {companyInfo.name || user?.name || "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <CardTitle className="text-white text-lg font-semibold">
            Profile Information
          </CardTitle>
          <CardDescription className="text-white/60">
            Update your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 pb-6">
          <div className="flex gap-4">
            <div className="space-y-2 w-1/2">
              <Label htmlFor="firstName" className="text-white/80">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formState.firstName}
                onChange={handleInputChange}
                disabled={isViewer}
                className={`bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 ${isViewer ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.firstName ? (
                <p className="text-sm text-rose-400">{errors.firstName}</p>
              ) : null}
            </div>
            <div className="space-y-2 w-1/2">
              <Label htmlFor="lastName" className="text-white/80">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formState.lastName}
                onChange={handleInputChange}
                disabled={isViewer}
                className={`bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 ${isViewer ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.lastName ? (
                <p className="text-sm text-rose-400">{errors.lastName}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formState.email}
              disabled
              className="bg-white/[0.04] border-white/10 text-white/60 cursor-not-allowed"
            />
            {errors.email ? (
              <p className="text-sm text-rose-400">{errors.email}</p>
            ) : null}
          </div>
        </CardContent>
        {!isViewer && (
          <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02] p-6">
            <Button
              type="submit"
              className="bg-gradient-to-r from-cyan-500/70 via-sky-500 to-indigo-500 text-white hover:from-cyan-400 hover:to-indigo-400"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              Save Changes
            </Button>
          </CardFooter>
        )}
      </Card>
    </form>
  );
};

export default ProfileTabCompanyUser;
