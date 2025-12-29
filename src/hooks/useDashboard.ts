import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export interface ActivityBreakdownData {
    message_sent: number;
    email_sent: number;
    sms_sent: number;
    whatsapp_sent: number;
    outbound_calls: number;
    inbound_calls: number;
}

export const useActivityBreakdown = () => {
    return useQuery<ActivityBreakdownData, Error>({
        queryKey: ["dashboard", "activity-breakdown"],
        queryFn: async () => {
            const response = await dashboardService.getActivityBreakdown();
            return response.data;
        },
    });
};
