import { AlertCircle, AlertTriangle, Bug, CheckCircle, Lightbulb, MessageSquare, Timer, XCircle } from "lucide-react";

export const FEEDBACK_TYPE_CONFIG = {
    bug: { icon: Bug, color: "bg-red-500/20 text-red-300 border-red-500/30" },
    improvement: { icon: Lightbulb, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    error: { icon: XCircle, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
    failure: { icon: AlertTriangle, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
    default: { icon: MessageSquare, color: "bg-white/10 text-white/70 border-white/20" },
} as const;

export const FEEDBACK_STATUS_CONFIG = {
    open: { icon: AlertCircle, color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", label: "Open" },
    "in-progress": { icon: Timer, color: "bg-blue-500/20 text-blue-300 border-blue-500/30", label: "In Progress" },
    closed: { icon: CheckCircle, color: "bg-green-500/20 text-green-300 border-green-500/30", label: "Closed" },
} as const;

export const getFeedbackTypeConfig = (type: string) =>
    FEEDBACK_TYPE_CONFIG[type as keyof typeof FEEDBACK_TYPE_CONFIG] || FEEDBACK_TYPE_CONFIG.default;

export const getFeedbackStatusConfig = (status: string) =>
    FEEDBACK_STATUS_CONFIG[status as keyof typeof FEEDBACK_STATUS_CONFIG] || FEEDBACK_STATUS_CONFIG.open;
