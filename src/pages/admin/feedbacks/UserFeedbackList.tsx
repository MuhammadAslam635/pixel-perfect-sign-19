import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  User,
  Mail,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Bug,
  Lightbulb,
  XCircle,
  AlertTriangle,
  Timer,
} from "lucide-react";
import { feedbackService } from "@/services/feedback.service";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { Feedback } from "@/types/feedback.types";
import {
  getFeedbackStatusConfig,
  getFeedbackTypeConfig,
} from "@/utils/feedback.config";

const CARD_STYLE =
  "bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10";

const FeedbackItem = ({
  feedback,
  onClick,
}: {
  feedback: Feedback;
  onClick: (id: string) => void;
}) => {
  const typeConfig = getFeedbackTypeConfig(feedback.type);
  const statusConfig = getFeedbackStatusConfig(feedback.status);
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      onClick={() => onClick(feedback._id)}
      className="group relative bg-black/20 border border-white/10 rounded-lg p-4 hover:border-cyan-400/50 hover:bg-black/30 transition-all duration-300 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              className={`${typeConfig.color} border flex items-center gap-1`}
            >
              <TypeIcon className="w-4 h-4" />
              <span className="capitalize">{feedback.type}</span>
            </Badge>
            <Badge className={`${statusConfig.color} border`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              <span className="capitalize">{statusConfig.label}</span>
            </Badge>
          </div>
          <h3 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">
            {feedback.title}
          </h3>
          {feedback.description && (
            <p className="text-white/50 text-sm line-clamp-2 mb-2">
              {feedback.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-white/40">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
            </div>
            {feedback.attachments && feedback.attachments.length > 0 && (
              <span>{feedback.attachments.length} attachment(s)</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </div>
  );
};

const UserFeedbackList = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const authState = useSelector((state: RootState) => state.auth);

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

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userInfo, setUserInfo] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });

  const canAccess =
    userRoleName === "Admin" ||
    userRoleName === "CompanyAdmin" ||
    userRoleName === "Company";

  useEffect(() => {
    if (!canAccess) {
      toast.error("Access denied. Admin or Company Admin access required.");
      navigate("/admin/feedbacks");
      return;
    }

    if (!userId) {
      toast.error("User ID is required");
      navigate("/admin/feedbacks");
      return;
    }

    fetchUserFeedbacks();
  }, [userId, userRoleName, canAccess]);

  const fetchUserFeedbacks = async () => {
    if (!userId) return;

    setLoading(true);
    setUserInfo({ name: "", email: "" });
    try {
      const userResponse = await userService.getUserById(userId);
      if (userResponse.success && userResponse.data) {
        setUserInfo({
          name:
            userResponse.data.name || userResponse.data.email || "Unknown User",
          email: userResponse.data.email || "",
        });
      } else {
        setUserInfo({ name: "Unknown User", email: "" });
      }

      const data = await feedbackService.getAllFeedbacks({
        userId,
        page: 1,
        limit: 1000,
      });
      setFeedbacks(data.feedbacks || []);
    } catch (error: any) {
      console.error("Error fetching user feedbacks:", error);
      setUserInfo({ name: "Unknown User", email: "" });
      try {
        const data = await feedbackService.getAllFeedbacks({
          userId,
          page: 1,
          limit: 1000,
        });
        setFeedbacks(data.feedbacks || []);
      } catch (feedbackError) {
        setFeedbacks([]);
        toast.error(
          sanitizeErrorMessage(
            feedbackError,
            "Unable to load feedbacks. Please try again."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    if (statusFilter === "all") return feedbacks;
    return feedbacks.filter((f) => f.status === statusFilter);
  }, [feedbacks, statusFilter]);

  const stats = useMemo(
    () => [
      {
        title: "Total Feedbacks",
        value: feedbacks.length,
        icon: MessageSquare,
        color: "text-white",
        iconClass: "text-white/70",
      },
      {
        title: "Open",
        value: feedbacks.filter((f) => f.status === "open").length,
        icon: AlertCircle,
        color: "text-yellow-400",
        iconClass: "text-white/70",
      },
      {
        title: "In Progress",
        value: feedbacks.filter((f) => f.status === "in-progress").length,
        icon: Timer,
        color: "text-blue-400",
        iconClass: "text-blue-400",
      },
      {
        title: "Closed",
        value: feedbacks.filter((f) => f.status === "closed").length,
        icon: CheckCircle,
        color: "text-green-400",
        iconClass: "text-white/70",
      },
    ],
    [feedbacks]
  );

  const handleFeedbackClick = (feedbackId: string) => {
    navigate(`/admin/feedbacks/${feedbackId}`);
  };

  if (!canAccess) {
    return (
      <AdminLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
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

  return (
    <AdminLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 mb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/feedbacks")}
            className="w-fit text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feedbacks
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white my-2">
                {loading ? "Loading..." : `${userInfo.name}'s Feedback`}
              </h1>
              {!loading && (
                <div className="flex items-center gap-2 text-white/60">
                  <Mail className="w-4 h-4" />
                  <span>{userInfo.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <Card key={i} className={CARD_STYLE}>
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <stat.icon className={`w-4 h-4 ${stat.iconClass}`} />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <Card className={CARD_STYLE}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <span className="text-white/70 text-sm">Filter by status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-black/35 border border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedbacks List */}
        <Card className={`${CARD_STYLE} mb-12`}>
          <CardHeader>
            <CardTitle className="text-white/70 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                <p className="text-white/60 text-sm">Loading feedbacks...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-12 h-12 text-white/30 mb-3" />
                <p className="text-white/60 text-sm">
                  {statusFilter !== "all"
                    ? `No ${statusFilter} feedbacks found`
                    : "No feedbacks found"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFeedbacks.map((f) => (
                  <FeedbackItem
                    key={f._id}
                    feedback={f}
                    onClick={handleFeedbackClick}
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

export default UserFeedbackList;