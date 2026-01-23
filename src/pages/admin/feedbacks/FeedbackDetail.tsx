import { useEffect, useState } from "react";
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
    Calendar,
    User,
    Mail,
    Download,
    FileText,
    AlertCircle,
    CheckCircle,
    Bug,
    Lightbulb,
    XCircle,
    AlertTriangle,
    Paperclip,
} from "lucide-react";
import { feedbackService } from "@/services/feedback.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { Feedback } from "@/types/feedback.types";

const FeedbackDetail = () => {
    const navigate = useNavigate();
    const { feedbackId } = useParams<{ feedbackId: string }>();
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

    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (userRoleName !== "Admin") {
            toast.error("Access denied. Admin access required.");
            navigate("/admin/feedbacks");
            return;
        }

        if (!feedbackId) {
            toast.error("Feedback ID is required");
            navigate("/admin/feedbacks");
            return;
        }

        fetchFeedback();
    }, [feedbackId, userRoleName]);

    const fetchFeedback = async () => {
        if (!feedbackId) return;

        setLoading(true);
        try {
            const data = await feedbackService.getFeedbackById(feedbackId);
            setFeedback(data);
        } catch (error: any) {
            console.error("Error fetching feedback:", error);
            toast.error(
                sanitizeErrorMessage(
                    error,
                    "Unable to load feedback. Please try again."
                )
            );
            navigate("/admin/feedbacks");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!feedback) return;

        setUpdating(true);
        try {
            await feedbackService.updateFeedback(feedback._id, { status: newStatus as "open" | "closed" });
            setFeedback({ ...feedback, status: newStatus as "open" | "closed" });
            toast.success(`Feedback marked as ${newStatus}`);
        } catch (error: any) {
            console.error("Error updating feedback status:", error);
            toast.error(
                sanitizeErrorMessage(error, "Failed to update status. Please try again.")
            );
        } finally {
            setUpdating(false);
        }
    };

    const handleDownloadAttachment = (fileUrl: string, fileName: string) => {
        // Create a temporary anchor element to trigger download
        const link = document.createElement("a");
        link.href = `/api${fileUrl}`;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "bug":
                return <Bug className="w-5 h-5" />;
            case "improvement":
                return <Lightbulb className="w-5 h-5" />;
            case "error":
                return <XCircle className="w-5 h-5" />;
            case "failure":
                return <AlertTriangle className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "bug":
                return "bg-red-500/20 text-red-300 border-red-500/30";
            case "improvement":
                return "bg-blue-500/20 text-blue-300 border-blue-500/30";
            case "error":
                return "bg-orange-500/20 text-orange-300 border-orange-500/30";
            case "failure":
                return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
            default:
                return "bg-white/10 text-white/70 border-white/20";
        }
    };

    const getStatusBadgeColor = (status: string) => {
        return status === "open"
            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
            : "bg-green-500/20 text-green-300 border-green-500/30";
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

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

    if (loading) {
        return (
            <AdminLayout>
                <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                        <p className="text-white/60 text-sm">Loading feedback...</p>
                    </div>
                </main>
            </AdminLayout>
        );
    }

    if (!feedback) {
        return (
            <AdminLayout>
                <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center py-16">
                        <XCircle className="w-16 h-16 text-red-400 mb-4" />
                        <p className="text-white/70 text-lg font-medium mb-2">
                            Feedback Not Found
                        </p>
                        <Button
                            onClick={() => navigate("/admin/feedbacks")}
                            className="mt-4"
                        >
                            Back to Feedbacks
                        </Button>
                    </div>
                </main>
            </AdminLayout>
        );
    }

    const createdBy = feedback.createdBy as any;

    return (
        <AdminLayout>
            <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-8 flex flex-col text-white flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto w-full space-y-6">
                    {/* Header */}
                    <div className="flex flex-col gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="w-fit text-white/70 hover:text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>

                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge
                                        className={`${getTypeBadgeColor(
                                            feedback.type
                                        )} border flex items-center gap-1.5 px-3 py-1`}
                                    >
                                        {getTypeIcon(feedback.type)}
                                        <span className="capitalize">{feedback.type}</span>
                                    </Badge>
                                    <Badge
                                        className={`${getStatusBadgeColor(
                                            feedback.status
                                        )} border flex items-center gap-1.5 px-3 py-1`}
                                    >
                                        {feedback.status === "open" ? (
                                            <AlertCircle className="w-3.5 h-3.5" />
                                        ) : (
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        )}
                                        <span className="capitalize">{feedback.status}</span>
                                    </Badge>
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                                    {feedback.title}
                                </h1>

                                <div className="flex flex-col gap-2.5 text-white/60 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span>{createdBy?.name || "Unknown User"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{createdBy?.email || "No email"}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            Submitted on{" "}
                                            {new Date(feedback.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 lg:min-w-[180px]">
                                <span className="text-white/70 text-sm font-medium">Change Status:</span>
                                <Select
                                    value={feedback.status}
                                    onValueChange={handleStatusChange}
                                    disabled={updating}
                                >
                                    <SelectTrigger className="w-full bg-black/35 border border-white/10 text-white hover:border-white/20 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                                        <SelectItem value="open" className="text-white hover:bg-white/10">Open</SelectItem>
                                        <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-white flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5" />
                                Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {feedback.description ? (
                                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                                    {feedback.description}
                                </p>
                            ) : (
                                <p className="text-white/40 italic">No description provided</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    {feedback.attachments && feedback.attachments.length > 0 && (
                        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-white flex items-center gap-2 text-lg">
                                    <Paperclip className="w-5 h-5" />
                                    Attachments ({feedback.attachments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {feedback.attachments.map((attachment: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg hover:border-cyan-400/50 hover:bg-black/30 transition-all"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate">
                                                        {attachment.fileName}
                                                    </p>
                                                    <p className="text-white/40 text-xs">
                                                        {formatFileSize(attachment.fileSize)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDownloadAttachment(
                                                        attachment.fileUrl,
                                                        attachment.fileName
                                                    )
                                                }
                                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 ml-2"
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Download
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </AdminLayout>
    );
};

export default FeedbackDetail;
