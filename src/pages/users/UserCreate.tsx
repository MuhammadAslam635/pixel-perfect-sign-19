import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { userService, CreateUserData } from "@/services/user.service";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const UserCreate = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  const userRole = authState.user?.role;

  const [errors, setErrors] = useState({
    email: "",
    name: "",
    password: "",
    role: "",
    status: "",
  });

  const [user, setUser] = useState<CreateUserData>({
    name: "",
    email: "",
    password: "",
    role: "",
    status: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({ email: "", name: "", password: "", role: "", status: "" });

    try {
      const response = await userService.createUser(user);

      if (response.success) {
        toast.success("User created successfully");
        navigate("/users");
      } else {
        toast.error("User creation failed");
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Session expired. Please log in again.");
          navigate("/");
        } else if (
          error.response.status === 422 &&
          Array.isArray(error.response.data.errors)
        ) {
          const newErrors = {
            name: "",
            email: "",
            password: "",
            role: "",
            status: "",
          };
          error.response.data.errors.forEach((err: any) => {
            if (newErrors[err.path as keyof typeof newErrors] === "") {
              newErrors[err.path as keyof typeof newErrors] = err.msg;
            }
          });
          setErrors(newErrors);
        } else {
          toast.error(
            error.response?.data?.message || "An error occurred"
          );
        }
      } else {
        toast.error("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen w-full px-6 py-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-semibold text-white mb-2">
              Create Employee
            </h1>
            <p className="text-white/60 text-sm">
              Add a new employee to your organization
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSaveProfile}>
            <Card className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
              <CardContent className="space-y-6 pt-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90 text-sm font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={user.name}
                    onChange={handleInputChange}
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter full name"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleInputChange}
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleInputChange}
                    className="rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white/90 text-sm font-medium">
                    Role
                  </Label>
                  <Select
                    value={user.role}
                    onValueChange={(value) => {
                      setUser((prev) => ({ ...prev, role: value }));
                      setErrors((prev) => ({ ...prev, role: "" }));
                    }}
                  >
                    <SelectTrigger className="rounded-full bg-black/35 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgba(30,30,30,0.95)] border border-white/10 backdrop-blur">
                      {userRole === "Company" && (
                        <SelectItem
                          value="CompanyAdmin"
                          className="text-white hover:bg-white/10 focus:bg-white/10"
                        >
                          Company Admin
                        </SelectItem>
                      )}
                      <SelectItem
                        value="CompanyUser"
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        Company User
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-red-400 text-sm mt-1">{errors.role}</p>
                  )}
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white/90 text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={user.status}
                    onValueChange={(value) => {
                      setUser((prev) => ({ ...prev, status: value }));
                      setErrors((prev) => ({ ...prev, status: "" }));
                    }}
                  >
                    <SelectTrigger className="rounded-full bg-black/35 border border-white/10 text-white focus:ring-2 focus:ring-cyan-400/40">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[rgba(30,30,30,0.95)] border border-white/10 backdrop-blur">
                      <SelectItem
                        value="active"
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        Active
                      </SelectItem>
                      <SelectItem
                        value="inactive"
                        className="text-white hover:bg-white/10 focus:bg-white/10"
                      >
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.status}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="justify-end border-t border-white/10 pt-6 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border border-white/10 bg-black/35 hover:bg-black/45 text-white"
                  onClick={() => navigate("/users")}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500/40 to-indigo-400/40 hover:from-cyan-500/50 hover:to-indigo-400/50 text-white border border-white/10 rounded-full px-6 shadow-[0_8px_20px_rgba(62,100,180,0.35)] backdrop-blur transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Employee"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserCreate;

