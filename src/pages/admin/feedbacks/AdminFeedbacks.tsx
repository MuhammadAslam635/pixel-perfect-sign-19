import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  MessageSquareText,
  CheckCircle2,
  XCircle,
  Search,
  User,
  Mail,
  ChevronRight,
} from "lucide-react";
import { feedbackService } from "@/services/feedback.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";

interface UserFeedbackStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalFeedbacks: number;
  openFeedbacks: number;
  inProgressFeedbacks: number;
  closedFeedbacks: number;
}

interface GlobalStats {
  totalFeedbacks: number;
  openFeedbacks: number;
  inProgressFeedbacks: number;
  closedFeedbacks: number;
  totalUsers: number;
}

const AdminFeedbacks = () => {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);

  // Get user's role name
  const getUserRoleName = (): string | null => {
    const user = authState.user;
    if (!user) return null;

    if (user.roleId && typeof user.roleId === "object") {
      return (user.roleId as any).name;
    }

    if (user.role && typeof user.role === "string") {
      return user.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  const [userStats, setUserStats] = useState<UserFeedbackStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalFeedbacks: 0,
    openFeedbacks: 0,
    inProgressFeedbacks: 0,
    closedFeedbacks: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFeedbacks, setCompanyFeedbacks] = useState<any[]>([]);

  const isAdmin = userRoleName === "Admin";
  const isCompanyAdmin =
    userRoleName === "CompanyAdmin" || userRoleName === "Company";

  // Fetch feedback statistics (Admin only)
  const fetchFeedbackStats = useCallback(async () => {
    if (userRoleName !== "Admin") return;

    setLoading(true);
    try {
      const data = await feedbackService.getFeedbackStats();
      setGlobalStats(data.globalStats);
      setUserStats(data.userStats);
    } catch (error: any) {
      console.error("Error fetching feedback statistics:", error);
      toast.error(
        sanitizeErrorMessage(
          error,
          "Unable to load feedback statistics. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [userRoleName]);

  // Fetch company feedbacks (Company Admin)
  const fetchCompanyFeedbacks = useCallback(async () => {
    if (!isCompanyAdmin) return;

    setLoading(true);
    try {
      const data = await feedbackService.getAllFeedbacks({
        page: 1,
        limit: 500,
      });
      setCompanyFeedbacks(data?.feedbacks || []);
    } catch (error: any) {
      console.error("Error fetching company feedbacks:", error);
      toast.error(
        sanitizeErrorMessage(
          error,
          "Unable to load feedbacks. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [isCompanyAdmin]);

  useEffect(() => {
    if (isAdmin) fetchFeedbackStats();
    else if (isCompanyAdmin) fetchCompanyFeedbacks();
  }, [isAdmin, isCompanyAdmin, fetchFeedbackStats, fetchCompanyFeedbacks]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return userStats;

    const searchLower = searchTerm.toLowerCase();
    return userStats.filter(
      (user) =>
        user.userName?.toLowerCase().includes(searchLower) ||
        user.userEmail?.toLowerCase().includes(searchLower)
    );
  }, [userStats, searchTerm]);

  const handleUserClick = (userId: string) => {
    navigate(`/admin/feedbacks/user/${userId}`);
  };

  const handleFeedbackClick = (feedbackId: string) => {
    navigate(`/admin/feedbacks/${feedbackId}`);
  };

  const allowed = isAdmin || isCompanyAdmin;
  if (!allowed) {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-white/70 text-lg font-medium mb-2">
              Access Denied
            </p>
            <p className="text-white/50 text-sm">
              Admin or Company Admin access required.
            </p>
          </div>
        </main>
      </AdminLayout>
    );
  }

  // Company Admin view: list of company feedbacks
  if (isCompanyAdmin) {
    const filteredCompany = searchTerm
      ? companyFeedbacks.filter(
          (f) =>
            f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (typeof f.createdBy === "object" &&
              (f.createdBy?.name
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
                f.createdBy?.email
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())))
        )
      : companyFeedbacks;

    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white my-2">
                Company Feedbacks
              </h1>
              <p className="text-white/60">
                View and manage feedback from your company
              </p>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <Input
              placeholder="Search by title or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/35 border-white/10 text-white"
            />
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCompany.length === 0 ? (
                <p className="text-white/50 py-8">No feedbacks found.</p>
              ) : (
                filteredCompany.map((f) => (
                  <Card
                    key={f._id}
                    className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-cyan-400/50 cursor-pointer transition-all"
                    onClick={() => handleFeedbackClick(f._id)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{f.title}</p>
                        <p className="text-sm text-white/50">
                          {typeof f.createdBy === "object"
                            ? f.createdBy?.name || f.createdBy?.email
                            : "—"}{" "}
                          · {f.status}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </main>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white my-2">
              Feedback Management
            </h1>
            <p className="text-white/60">
              View and manage user feedback across the system
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <MessageSquare className="w-4 h-4" />
                Total Feedbacks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {loading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  globalStats.totalFeedbacks.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">All submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <MessageSquareText className="w-4 h-4" />
                Open Feedbacks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                {loading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  globalStats.openFeedbacks.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {globalStats.totalFeedbacks > 0
                  ? `${Math.round(
                      (globalStats.openFeedbacks / globalStats.totalFeedbacks) *
                        100
                    )}% pending`
                  : "No feedbacks"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {loading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  globalStats.inProgressFeedbacks.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {globalStats.totalFeedbacks > 0
                  ? `${Math.round(
                      (globalStats.inProgressFeedbacks /
                        globalStats.totalFeedbacks) *
                        100
                    )}% active`
                  : "No feedbacks"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Closed Feedbacks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {loading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  globalStats.closedFeedbacks.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {globalStats.totalFeedbacks > 0
                  ? `${Math.round(
                      (globalStats.closedFeedbacks /
                        globalStats.totalFeedbacks) *
                        100
                    )}% resolved`
                  : "No feedbacks"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {loading ? (
                  <div className="animate-pulse">...</div>
                ) : (
                  globalStats.totalUsers.toLocaleString()
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">Users with feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
          <CardContent className="p-4 sm:p-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                type="search"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 mb-12">
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <User className="w-5 h-5" />
              Users with Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-12 h-12 text-white/30 mb-3" />
                <p className="text-white/60 text-sm">
                  {searchTerm
                    ? "No users found matching your search"
                    : "No feedback submissions yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    onClick={() => handleUserClick(user.userId)}
                    className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 p-4">
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm mb-0.5 truncate group-hover:text-cyan-400 transition-colors">
                          {user.userName || "Unknown User"}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.userEmail}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center hidden sm:block">
                          <div className="text-base font-semibold text-white">
                            {user.totalFeedbacks}
                          </div>
                          <div className="text-xs text-white/50">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-semibold text-yellow-400">
                            {user.openFeedbacks}
                          </div>
                          <div className="text-xs text-white/50">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-semibold text-blue-400">
                            {user.inProgressFeedbacks}
                          </div>
                          <div className="text-xs text-white/50">
                            In Progress
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-base font-semibold text-green-400">
                            {user.closedFeedbacks}
                          </div>
                          <div className="text-xs text-white/50">Closed</div>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </AdminLayout>
  );
};

export default AdminFeedbacks;
