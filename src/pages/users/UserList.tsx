import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { RootState } from "@/store/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  LayoutDashboard,
  LineChart,
  Users2,
  CalendarDays,
  Building2,
  Briefcase,
  BookOpen,
  Sparkles,
  Bell,
  Settings,
  LucideIcon,
  Download,
  MailPlus,
  Shield,
} from "lucide-react";
import { userService, User } from "@/services/user.service";
import { toast } from "sonner";
import { rbacService } from "@/services/rbac.service";
import { Role } from "@/types/rbac.types";

const UserList = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);

  // Get user's role name - prioritize roleId over legacy role
  const getUserRoleName = (): string | null => {
    const user = authState.user;
    if (!user) return null;

    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as Role).name;
    }

    // PRIORITY 2: Fallback to legacy role string
    if (user.role && typeof user.role === "string") {
      return user.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [trashed, setTrashed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const defaultInviteForm = {
    email: "",
    roleId: "",
    expiresInDays: "7",
    message: "",
  };
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState(defaultInviteForm);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteErrors, setInviteErrors] = useState<{
    email?: string;
    expiresInDays?: string;
  }>({});
  const quickActions = useMemo<
    {
      icon: LucideIcon;
      label: string;
      path?: string;
    }[]
  >(
    () => [
      { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
      { icon: LineChart, label: "Analytics" },
      { icon: Users2, label: "Employees" },
      { icon: CalendarDays, label: "Calendar" },
      { icon: Building2, label: "Companies" },
      { icon: Briefcase, label: "Projects" },
      { icon: BookOpen, label: "Knowledge" },
      { icon: Sparkles, label: "Automation" },
      { icon: Bell, label: "Notifications" },
      { icon: Settings, label: "Settings" },
    ],
    []
  );
  const limit = 10;

  const fetchUsers = useCallback(
    async (resetPage = false) => {
      // Don't fetch if user is CompanyUser
      if (userRoleName === "CompanyUser") {
        return;
      }
      setLoading(true);
      try {
        const currentPage = resetPage ? 1 : page;
        const response = await userService.getUsers({
          page: currentPage,
          limit,
          search: searchTerm,
          trashed,
        });

        if (response.success && response.data) {
          setUsers(response.data.users);
          setPage(response.data.page);
          setTotalPages(response.data.totalPages);
        } else {
          setUsers([]);
        }
      } catch (error: any) {
        console.error("Error fetching users:", error);
        setUsers([]);
        toast.error(error?.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, trashed, limit, userRoleName]
  );

  // Redirect CompanyUser away from this page
  useEffect(() => {
    if (userRoleName === "CompanyUser") {
      navigate("/dashboard", { replace: true });
    }
  }, [userRoleName, navigate]);

  useEffect(() => {
    // Only fetch users if user is not CompanyUser
    if (userRoleName !== "CompanyUser") {
      fetchUsers();
    }
  }, [fetchUsers, userRoleName]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await rbacService.getAllRoles();
        if (response.success && response.data) {
          setAvailableRoles(response.data);
        }
      } catch (error: any) {
        console.error("Error fetching roles:", error);
        toast.error("Failed to load roles");
      }
    };

    fetchRoles();
  }, []);

  const roleMap = useMemo(() => {
    const map: Record<string, Role> = {};
    availableRoles.forEach((role) => {
      map[role._id] = role;
    });
    return map;
  }, [availableRoles]);

  const resetInviteForm = () => {
    setInviteForm(defaultInviteForm);
    setInviteErrors({});
  };

  const handleInviteFieldChange = (
    field: keyof typeof defaultInviteForm,
    value: string
  ) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
    if (field === "email" && inviteErrors.email) {
      setInviteErrors((prev) => ({ ...prev, email: undefined }));
    }
    if (field === "expiresInDays" && inviteErrors.expiresInDays) {
      setInviteErrors((prev) => ({ ...prev, expiresInDays: undefined }));
    }
  };

  const handleInviteSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    const errors: typeof inviteErrors = {};
    const trimmedEmail = inviteForm.email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Enter a valid email address";
    }

    let expiresInDays: number | undefined;
    const trimmedExpiry = inviteForm.expiresInDays.trim();
    if (trimmedExpiry) {
      const parsed = Number(trimmedExpiry);
      if (Number.isNaN(parsed)) {
        errors.expiresInDays = "Expires in days must be a valid number";
      } else if (parsed < 1 || parsed > 30) {
        errors.expiresInDays = "Expires must be between 1 and 30 days";
      } else {
        expiresInDays = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      setInviteErrors(errors);
      return;
    }

    try {
      setInviteSubmitting(true);
      await userService.inviteUser({
        email: trimmedEmail,
        roleId: inviteForm.roleId || undefined,
        message: inviteForm.message.trim()
          ? inviteForm.message.trim()
          : undefined,
        expiresInDays,
      });
      toast.success("Invitation sent successfully");
      resetInviteForm();
      setInviteDialogOpen(false);
      fetchUsers(true);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.errors?.[0]?.msg ||
          "Failed to send invitation"
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  const renderRoleBadge = (userData: User) => {
    // Prefer RBAC roleId when available
    const roleObject =
      typeof userData.roleId === "object"
        ? (userData.roleId as Role)
        : userData.roleId
        ? roleMap[userData.roleId as string]
        : null;

    if (roleObject) {
      return (
        <Badge className="bg-[#66AFB74D] text-[#66AFB7] border border-emerald-500/30 rounded-full px-3 py-1 text-xs">
          {roleObject.displayName}
        </Badge>
      );
    }

    // Fallback to legacy roles
    if (userData.role === "CompanyAdmin") {
      return (
        <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 rounded-full px-3 py-1 text-xs">
          Company Admin
        </Badge>
      );
    }

    if (userData.role === "CompanyUser") {
      return (
        <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1 text-xs">
          Company User
        </Badge>
      );
    }

    if (userData.role) {
      return (
        <Badge className="bg-white/15 text-white border border-white/20 rounded-full px-3 py-1 text-xs">
          {userData.role}
        </Badge>
      );
    }

    return (
      <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-full px-3 py-1 text-xs">
        N/A
      </Badge>
    );
  };

  const paginationPages = useMemo(() => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return { pages, startPage, endPage };
  }, [page, totalPages]);

  // Don't render the page if user is CompanyUser
  if (userRoleName === "CompanyUser") {
    return null;
  }

  const resolveUserDisplayName = (userData: User) =>
    userData.name ||
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
    userData.email.split("@")[0];

  const currentUser = authState.user;
  const currentUserName =
    currentUser?.name ||
    `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
    currentUser?.email ||
    "User";

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user '${userName}'? This action cannot be undone!`
      )
    ) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast.success("User deleted successfully");
      const response = await userService.getUsers({
        page: 1,
        limit,
        search: searchTerm,
        trashed,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleRestore = async (userId: string) => {
    try {
      await userService.restoreUser(userId);
      toast.success("User restored successfully");
      const response = await userService.getUsers({
        page,
        limit,
        search: searchTerm,
        trashed,
      });
      if (response.success && response.data) {
        setUsers(response.data.users);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to restore user");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePrevious = () => {
    if (page > 1) {
      handlePageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      handlePageChange(page + 1);
    }
  };

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-4 sm:px-6 md:px-10 lg:px-14 xl:px-16 2xl:px-[96px] mt-20 lg:mt-24 xl:mt-28 mb-10 flex flex-col gap-8 text-white flex-1 overflow-y-auto"
      >
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="p-5 sm:p-8 lg:p-2 space-y-6 flex justify-between"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 mt-2">
              <div>
                <h1 className="text-3xl md:text-[36px] font-semibold tracking-tight">
                  Employees
                </h1>
                <p className="text-white/60 text-sm mt-2">
                  Manage your employees.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end xl:flex-row xl:items-center gap-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 z-20" />
              <Input
                placeholder="Search employees"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              <Button
                type="button"
                onClick={() => navigate("/users/create")}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  }}
                />
                <Plus className="h-5 w-5 relative z-10" />
                <span className="hidden sm:block relative z-10">
                  Create Employees
                </span>
                <span className="sm:hidden relative z-10">Create</span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  resetInviteForm();
                  setInviteDialogOpen(true);
                }}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  }}
                />
                <MailPlus className="h-5 w-5 relative z-10" />
                <span className="hidden sm:block relative z-10">
                  Invite via Email
                </span>
                <span className="sm:hidden relative z-10">Invite</span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  navigate("/roles");
                }}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full pointer-events-none opacity-60 blur-[26px]"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  }}
                />
                <Shield className="h-5 w-5 relative z-10" />
                <span className="hidden sm:block relative z-10">Roles</span>
              </Button>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]"
        >
          <div className="hidden lg:grid grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_1fr_140px] items-center gap-4 p-6 bg-transparent border-b border-white/10 text-white/75 text-sm font-medium relative z-10">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Status</span>
            <span>Created at</span>
            <span className="text-center">Actions</span>
          </div>

          <div className="min-h-[420px] relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-4" />
                <p className="text-white/60 text-sm">Loading employees...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-white/30" />
                </div>
                <p className="text-white/70 text-base font-medium mb-1">
                  {searchTerm ? "No employees found" : "No employees available"}
                </p>
                <p className="text-white/50 text-sm text-center max-w-md">
                  {searchTerm
                    ? "Try adjusting your search terms or clear the filter to see all employees."
                    : "Employees you add will appear here."}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  {users.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                      className={`grid grid-cols-[1.2fr_1.5fr_0.8fr_0.8fr_1fr_140px] items-center gap-4 px-6 py-4 text-sm border-b border-white/5 ${
                        index % 2 === 0 ? "bg-[#222B2C]" : "bg-[#1B1B1B]"
                      }`}
                    >
                      <div className="font-medium text-white truncate">
                        {resolveUserDisplayName(user)}
                      </div>
                      <div className="text-white/70 truncate">{user.email}</div>
                      <div>{renderRoleBadge(user)}</div>
                      <div>
                        {user.status === "active" && (
                          <Badge className="rounded-full bg-[#3AC143D6] text-[#FFFFFF99] border border-emerald-400/40 px-4 py-1 text-xs">
                            Active
                          </Badge>
                        )}
                        {user.status === "inactive" && (
                          <Badge className="rounded-full bg-[#F72E2E80] text-[#FFFFFF99] border border-[#FF6B6B]/40 px-4 py-1 text-xs">
                            Inactive
                          </Badge>
                        )}
                        {!user.status && (
                          <Badge className="rounded-full bg-white/15 text-white/60 border border-white/25 px-4 py-1 text-xs">
                            N/A
                          </Badge>
                        )}
                      </div>
                      <div className="text-white/60">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="flex justify-center items-center gap-3">
                        {!trashed ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/users/${user._id}/edit`)
                              }
                              className="text-[#3AC143D6] p-2 hover:bg-emerald-500/20 transition"
                              title="Download profile"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/users/${user._id}/edit`)
                              }
                              className="text-white p-2 hover:bg-white/10 transition"
                              title="View employee"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  user._id,
                                  resolveUserDisplayName(user)
                                )
                              }
                              className=" text-[#F72E2E80] p-2 hover:bg-red-500/20 transition"
                              title="Delete employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(user._id)}
                            className="rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 p-2 hover:bg-cyan-500/20 transition"
                            title="Restore employee"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="lg:hidden space-y-3 p-2">
                  {users.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        ease: "easeOut",
                      }}
                      className="rounded-[16px] sm:rounded-[20px] border border-white/10 bg-[#222B2C]/40 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold truncate">
                            {resolveUserDisplayName(user)}
                          </p>
                          <p className="text-white/60 text-sm truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!trashed ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/users/${user._id}/edit`)
                                }
                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 p-2"
                                title="Download profile"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/users/${user._id}/edit`)
                                }
                                className="rounded-full border border-white/25 bg-white/5 text-white/80 p-2"
                                title="View employee"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    user._id,
                                    resolveUserDisplayName(user)
                                  )
                                }
                                className="rounded-full border border-red-500/40 bg-red-500/10 text-red-400 p-2"
                                title="Delete employee"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(user._id)}
                              className="rounded-full border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 p-2"
                              title="Restore employee"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {renderRoleBadge(user)}
                        {user.status === "active" && (
                          <Badge className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-1 text-xs">
                            Active
                          </Badge>
                        )}
                        {user.status === "inactive" && (
                          <Badge className="rounded-full bg-[#5A1212]/80 text-[#FF6B6B] border border-[#FF6B6B]/40 px-4 py-1 text-xs">
                            Inactive
                          </Badge>
                        )}
                        {!user.status && (
                          <Badge className="rounded-full bg-white/15 text-white/60 border border-white/25 px-4 py-1 text-xs">
                            N/A
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/60 border-t border-white/10 pt-3">
                        Created at:{" "}
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.section>

        {totalPages > 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="bg-[#222B2C]/40 py-3 px-4 sm:px-6 border border-white/10 rounded-2xl"
          >
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevious}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-white/10 transition-colors"
                    }
                  />
                </PaginationItem>
                <div className="hidden sm:flex gap-2">
                  {paginationPages?.pages.map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                </div>
                <div className="sm:hidden">
                  <PaginationItem>
                    <PaginationLink isActive className="cursor-default">
                      {page} / {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </div>
                {paginationPages &&
                  page < paginationPages.endPage - 1 &&
                  totalPages > paginationPages.endPage && (
                    <PaginationItem className="hidden sm:block">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNext}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-white/10 transition-colors"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}
      </motion.main>
      <Dialog
        open={inviteDialogOpen}
        onOpenChange={(open) => {
          setInviteDialogOpen(open);
          if (!open) {
            resetInviteForm();
          }
        }}
      >
        <DialogContent className="w-[92vw] max-w-xl sm:max-w-lg bg-[#121826] text-white border border-white/10 rounded-2xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-5">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-white">
              Invite a teammate
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Send an email invitation that links directly to the registration
              flow for your workspace.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleInviteSubmit}>
            <div className="space-y-2">
              <Label htmlFor="invite-email" className="text-sm text-white/80">
                Email address
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  handleInviteFieldChange("email", e.target.value)
                }
                placeholder="teammate@example.com"
                className="bg-[#0b0f1c] border-white/10 text-white placeholder:text-white/40"
              />
              {inviteErrors.email && (
                <p className="text-xs text-red-400">{inviteErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-white/80">Role (optional)</Label>
              <Select
                value={inviteForm.roleId || "none"}
                onValueChange={(value) =>
                  handleInviteFieldChange(
                    "roleId",
                    value === "none" ? "" : value
                  )
                }
              >
                <SelectTrigger className="bg-[#0b0f1c] border-white/10 text-white">
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-[#0b0f1c] text-white border-white/10">
                  <SelectItem value="none">No role specified</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-expiry" className="text-sm text-white/80">
                Expires in (days)
              </Label>
              <Input
                id="invite-expiry"
                type="number"
                min={1}
                max={30}
                value={inviteForm.expiresInDays}
                onChange={(e) =>
                  handleInviteFieldChange("expiresInDays", e.target.value)
                }
                className="bg-[#0b0f1c] border-white/10 text-white"
              />
              {inviteErrors.expiresInDays && (
                <p className="text-xs text-red-400">
                  {inviteErrors.expiresInDays}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-message" className="text-sm text-white/80">
                Personal message (optional)
              </Label>
              <Textarea
                id="invite-message"
                value={inviteForm.message}
                onChange={(e) =>
                  handleInviteFieldChange("message", e.target.value)
                }
                placeholder="Add context for your teammate..."
                className="bg-[#0b0f1c] border-white/10 text-white placeholder:text-white/40 min-h-[90px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetInviteForm();
                  setInviteDialogOpen(false);
                }}
                className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
                disabled={inviteSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-white hover:brightness-110 w-full sm:w-auto"
                disabled={inviteSubmitting}
              >
                {inviteSubmitting ? "Sending..." : "Send invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default UserList;
