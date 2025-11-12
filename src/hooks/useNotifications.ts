import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { toast } from "sonner";

/**
 * Custom hook to fetch notifications with real-time updates
 * @param page - Page number for pagination (default: 1)
 * @param limit - Number of notifications per page (default: 10)
 * @returns Object containing notifications data, loading state, and error
 */
export const useNotifications = (page: number = 1, limit: number = 10) => {
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: () => notificationService.getNotifications(page, limit),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to the tab
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Extract notifications and unread count from the response
  const notifications =
    notificationsData?.notification || notificationsData?.notifications || [];
  const unreadCount =
    notificationsData?.unreadNotificationCount ||
    notificationsData?.pagination?.unreadCount ||
    0;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Custom hook to mark a notification as read
 * @returns Mutation object with mutate function and loading state
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notifications to get updated data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    },
  });
};

/**
 * Custom hook to mark all notifications as read
 * @returns Mutation object with mutate function and loading state
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate and refetch notifications to get updated data
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark all notifications as read");
    },
  });
};
