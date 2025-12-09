import axios from "axios";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getUserData } from "@/utils/authHelpers";
import { RootState } from "@/store/store";
import { logout, updateUser } from "@/store/slices/authSlice";
import { userService } from "@/services/user.service";

interface AdminProfileForm {
  id: string;
  name: string;
  email: string;
  token: string;
}

interface AdminProfileErrors {
  name: string;
  email: string;
}

export const AdminProfileTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const [formState, setFormState] = useState<AdminProfileForm>({
    id: "",
    name: "",
    email: "",
    token: "",
  });

  const [errors, setErrors] = useState<AdminProfileErrors>({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setFormState({
        id: user._id ?? "",
        name: user.name ?? "",
        email: user.email ?? "",
        token: user.token ?? "",
      });
    }
  }, [user]);

  const handleUnauthorized = () => {
    dispatch(logout());
    toast({
      title: "Session expired. Please log in again.",
      description: "Your session has expired. Please log in again to continue.",
      variant: "destructive",
    });
    navigate("/admin/login");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({ name: "", email: "" });

    try {
      const response = await userService.updateAdminProfile({
        id: formState.id,
        name: formState.name,
        email: formState.email,
      });

      if (response.success) {
        const existing = getUserData();
        const token = user?.token || existing?.token;
        const updatedUser = {
          ...response.user,
          token,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch(updateUser(updatedUser));

        toast({
          title: "Profile updated",
          description: response.message ?? "Changes saved successfully.",
        });
      } else {
        toast({
          title: "Update failed",
          description:
            response.message ??
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
          const validationErrors: AdminProfileErrors = {
            name: "",
            email: "",
          };
          (
            (
              error.response.data as {
                errors?: Array<{ path: keyof AdminProfileErrors; msg: string }>;
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
          <CardTitle className="text-white text-lg font-semibold">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white/80">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
            />
            {errors.name ? (
              <p className="text-sm text-rose-400">{errors.name}</p>
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
              onChange={handleInputChange}
              className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40"
            />
            {errors.email ? (
              <p className="text-sm text-rose-400">{errors.email}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t border-white/10 bg-white/[0.02]">
          <Button
            type="submit"
            className="mt-4 bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white hover:from-cyan-400 hover:to-indigo-400"
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

export default AdminProfileTab;
