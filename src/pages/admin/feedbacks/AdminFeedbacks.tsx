import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageSquare, MessageSquareText, CheckCircle2, XCircle, Search, User, } from "lucide-react";
import { feedbackService } from "@/services/feedback.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { UserFeedbackStats, GlobalStats } from "@/types/feedback.types";
import { UserRow } from "./UserRow";

const AdminFeedbacks = () => {
    const navigate = useNavigate();
    const authState = useSelector((state: RootState) => state.auth);

    // Get user's role name
    const userRoleName = useMemo(() => {
        const user = authState.user;
        if (!user) return null;
        if (user.roleId && typeof user.roleId === "object") return (user.roleId as any).name;
        if (user.role && typeof user.role === "string") return user.role;
        return null;
    }, [authState.user])

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

    // Check if user is Admin
    useEffect(() => {
        if (userRoleName !== "Admin") {
            toast.error("Access denied. Admin access required.");
        }
    }, [userRoleName]);

    // Fetch feedback statistics
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

    useEffect(() => {
        fetchFeedbackStats();
    }, [fetchFeedbackStats]);

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

    const handleUserClick = useCallback(
        (userId: string) => navigate(`/admin/feedbacks/user/${userId}`),
        [navigate]
    );

    if (userRoleName !== "Admin") {
        return (
            <AdminLayout>
                <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center py-16">
                        <XCircle className="w-16 h-16 text-red-400 mb-4" />
                        <p className="text-white/70 text-lg font-medium mb-2">
                            Access Denied
                        </p>
                        <p className="text-white/50 text-sm">
                            Admin access required to view this page.
                        </p>
                    </div>
                </main>
            </AdminLayout>
        );
    }

    const statsCards = useMemo(() => ([
        {
            title: "Total Feedbacks",
            icon: MessageSquare,
            value: globalStats.totalFeedbacks,
            color: "text-white",
            footer: "All submissions",
        },
        {
            title: "Open Feedbacks",
            icon: MessageSquareText,
            value: globalStats.openFeedbacks,
            color: "text-yellow-400",
            footer: globalStats.totalFeedbacks
                ? `${Math.round((globalStats.openFeedbacks / globalStats.totalFeedbacks) * 100)}% pending`
                : "No feedbacks",
        },
        {
            title: "In Progress",
            icon: CheckCircle2,
            value: globalStats.inProgressFeedbacks,
            color: "text-blue-400",
            footer: globalStats.totalFeedbacks
                ? `${Math.round((globalStats.inProgressFeedbacks / globalStats.totalFeedbacks) * 100)}% active`
                : "No feedbacks",
        },
        {
            title: "Closed Feedbacks",
            icon: CheckCircle2,
            value: globalStats.closedFeedbacks,
            color: "text-green-400",
            footer: globalStats.totalFeedbacks
                ? `${Math.round((globalStats.closedFeedbacks / globalStats.totalFeedbacks) * 100)}% resolved`
                : "No feedbacks",
        },
        {
            title: "Active Users",
            icon: User,
            value: globalStats.totalUsers,
            color: "text-cyan-400",
            footer: "Users with feedback",
        },
    ]), [globalStats]);

    return (
        <AdminLayout>
            <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white my-2">Feedback Management</h1>
                        <p className="text-white/60">View and manage user feedback across the system</p>
                    </div>
                </div>
                {/* Statistics Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statsCards.map(({ title, icon: Icon, value, color, footer }) => (
                        <Card key={title} className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                                    <Icon className="w-4 h-4" />
                                    {title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className={`text-3xl font-bold ${color}`}>
                                    {loading ? "..." : value.toLocaleString()}
                                </div>
                                <p className="text-xs text-white/60 mt-1">{footer}</p>
                            </CardContent>
                        </Card>
                    ))}
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
                                {filteredUsers.map((user) => (
                                    <UserRow
                                        key={user.userId}
                                        user={user}
                                        onClick={handleUserClick}
                                    />
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