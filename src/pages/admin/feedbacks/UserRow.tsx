import { ChevronRight, Mail } from "lucide-react";
import { memo, useCallback } from "react";
import { UserFeedbackStats } from "@/types/feedback.types";

const userStatsConfig = [
    { key: "totalFeedbacks", label: "Total", color: "text-white" },
    { key: "openFeedbacks", label: "Open", color: "text-yellow-400" },
    { key: "inProgressFeedbacks", label: "In Progress", color: "text-blue-400" },
    { key: "closedFeedbacks", label: "Closed", color: "text-green-400" },
] as const;

export const UserRow = memo(
    ({ user, onClick }: { user: UserFeedbackStats; onClick: (id: string) => void }) => {
        const handleClick = useCallback(() => {
            onClick(user.userId);
        }, [onClick, user.userId]);

        return (
            <div
                onClick={handleClick}
                className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-cyan-400/50 rounded-xl transition-all duration-200 cursor-pointer"
            >
                <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm truncate group-hover:text-cyan-400 transition-colors">
                            {user.userName || "Unknown User"}
                        </h3>
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.userEmail}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {userStatsConfig.map(({ key, label, color }) => (
                            <div
                                key={key}
                                className={`text-center`}
                            >
                                <div className={`text-base font-semibold ${color}`}>
                                    {user[key]}
                                </div>
                                <div className="text-xs text-white/50">{label}</div>
                            </div>
                        ))}
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        );
    }
);
