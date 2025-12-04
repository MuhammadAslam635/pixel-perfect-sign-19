import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import API from "@/utils/api";
import { RootState } from "@/store/store";
import { logout, updateUser } from "@/store/slices/authSlice";

interface ProfileErrors {
  name: string;
  email: string;
  company: string;
}

interface ProfileFormState {
  id: string;
  name: string;
  email: string;
  company: string;
  bio: string;
  token: string;
}

export const ProfileTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [errors, setErrors] = useState<ProfileErrors>({
    name: "",
    email: "",
    company: "",
  });

  const [formState, setFormState] = useState<ProfileFormState>({
    id: "",
    name: "",
    email: "",
    company: "",
    bio: "",
    token: "",
  });

  useEffect(() => {
    if (user) {
      setFormState({
        id: user._id ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        company: user.company ?? "",
        bio: user.bio ?? "",
        token: user.token ?? "",
      });
    }
  }, [user]);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleUnauthorized = () => {
    dispatch(logout());
    toast({
      title: "Session expired. Please log in again.",
      description: "Your session has expired. Please log in again to continue.",
      variant: "destructive",
    });
    navigate("/login");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({ name: "", email: "", company: "" });

    if (!user?.token) {
      handleUnauthorized();
      return;
    }

    try {
      const response = await API.post("/company-profile-update", formState);

      if (response.status === 200 && response.data.success) {
        const updatedUser = {
          ...response.data.user,
          token: user.token,
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
            name: "",
            email: "",
            company: "",
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

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl text-white">
        <CardHeader className="border-b border-white/10 bg-white/[0.02]">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <CardTitle className="text-white text-lg font-semibold">
              Profile Information
            </CardTitle>
            <CardDescription className="text-white/60">
              Update your account details and company profile.
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="company" className="text-white/80">
              Company Name
            </Label>
            <Input
              id="company"
              name="company"
              value={formState.company}
              onChange={handleInputChange}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
            />
            {errors.company ? (
              <p className="text-sm text-rose-400">{errors.company}</p>
            ) : null}
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

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white/80">
              Bio
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={formState.bio}
              onChange={handleInputChange}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
          <Button
            type="submit"
            className="mt-4 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
            style={{
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
          >
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ProfileTab;
