import React, { useEffect, useRef, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, updateUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { RootState } from "@/store/store";
import {
  useNotifications,
  useMarkNotificationAsRead,
} from "@/hooks/useNotifications";
import { usePermissions } from "@/hooks/usePermissions";
import LongRunningTasksButton from "@/components/navigation/LongRunningTasksButton";
import { AvatarFallback } from "@/components/ui/avatar-fallback";

export const ActionComponent = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [previousNotificationIds, setPreviousNotificationIds] = useState<
    Set<string>
  >(new Set());
  const actionsRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Get user's role name - prioritize roleId over legacy role
  const getUserRoleName = (): string | null => {
    if (!currentUser) return null;

    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (currentUser.roleId && typeof currentUser.roleId === "object") {
      return (currentUser.roleId as any).name;
    }

    // PRIORITY 2: Fallback to legacy role string
    if (currentUser.role && typeof currentUser.role === "string") {
      return currentUser.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  // Fetch and sync user profile from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await userService.getCurrentUser();
        // Update Redux store with fresh user data
        dispatch(updateUser(response.user));
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (currentUser) {
      fetchUserProfile();
    }
  }, [dispatch]);

  // Permission hook
  const { canView } = usePermissions();

  // Use custom hook for notifications with real-time updates
  const {
    notifications,
    unreadCount,
    isLoading: loadingNotifications,
    error: notificationsError,
  } = useNotifications(1, 10);

  // Use custom hook for marking notification as read
  const markAsReadMutation = useMarkNotificationAsRead();

  // Show error toast if notifications fail to load
  useEffect(() => {
    if (notificationsError) {
      console.error("Error fetching notifications:", notificationsError);
    }
  }, [notificationsError]);

  // Detect new notifications and show toast notifications
  useEffect(() => {
    if (notifications.length === 0) return;

    const currentNotificationIds = new Set(notifications.map((n) => n._id));

    // Find new notifications that weren't in the previous state
    const newNotifications = notifications.filter(
      (notification) =>
        !previousNotificationIds.has(notification._id) &&
        notification.is_read === "No"
    );

    // Show toast for each new notification
    newNotifications.forEach((notification) => {
      toast(notification.title || "New Notification", {
        description: notification.message,
        duration: 5000,
      });
    });

    // Update previous notification IDs
    setPreviousNotificationIds(currentNotificationIds);
  }, [notifications, previousNotificationIds]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleMarkAsRead = (notificationId: string) => {
    // Find the notification to check if it's already read
    const notification = notifications.find((n) => n._id === notificationId);

    // If already read, don't do anything
    if (notification?.is_read === "Yes") {
      return;
    }

    // Call the mutation
    markAsReadMutation.mutate(notificationId);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionsRef.current &&
        !actionsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const profileMenu = [
    {
      title: "Team",
      meta: "View and manage team members",
      route: "/users",
    },
    {
      title: "Knowledge Base",
      meta: "View your company knowledge base",
      route: "/company-knowledge",
    },
    {
      title: "Settings",
      meta: "Manage preferences",
      route: userRoleName === "Admin" ? "/admin/settings" : "/settings",
    },
    { title: "Sign out", meta: "Log out of EmpaTech OS", route: null },
  ].filter((item) => {
    // Show "Team" only for Company, CompanyAdmin, and Admin roles
    if (item.title === "Team") {
      return (
        userRoleName === "Company" ||
        userRoleName === "CompanyAdmin" ||
        userRoleName === "Admin"
      );
    }
    // "Knowledge Base" Visibility Logic:
    // 1. Hide for Admin (as per original logic)
    // 2. Hide for anyone who doesn't have "view" permission for "company-knowledge"
    if (item.title === "Knowledge Base") {
      if (userRoleName === "Admin") return false;
      return canView("company-knowledge");
    }
    return true;
  });

  return (
    <div
      className="flex min-w-[100px] justify-end relative rounded-full"
      ref={actionsRef}
      style={{
        background: "#FFFFFF1A",
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
      }}
    >
      <div className="flex items-center gap-1 p-2 px-4">
        <button
          aria-label="Toggle notifications"
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white transition ${
            notificationsOpen ? "ring-2 ring-cyan-400/40" : ""
          }`}
          type="button"
          onClick={() => {
            setNotificationsOpen((prev) => !prev);
            setProfileOpen(false);
          }}
          aria-haspopup="true"
          aria-expanded={notificationsOpen}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold shadow-[0_0_8px_rgba(239,68,68,0.6)]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <LongRunningTasksButton />

        <button
          aria-label="Toggle profile menu"
          className="flex items-center gap-1  text-white"
          type="button"
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotificationsOpen(false);
          }}
          aria-haspopup="true"
          aria-expanded={profileOpen}
        >
          <div className="h-8 w-8 flex items-center justify-center overflow-hidden rounded-full border border-white/25 bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
            <AvatarFallback
              name={
                `${currentUser?.firstName || ""} ${
                  currentUser?.lastName || ""
                }`.trim() ||
                currentUser?.email ||
                "User"
              }
              pictureUrl={currentUser?.profileImage}
              size="xs"
              className="border-none"
            />
          </div>
          <div className="hidden lg:flex flex-col text-left text-xs leading-tight text-white/70">
            <span className="font-medium text-white">
              {`${currentUser?.firstName || ""} ${
                currentUser?.lastName || ""
              }`.trim() ||
                currentUser?.email?.split("@")[0] ||
                "User"}
            </span>
            <span className="text-white/50">{currentUser?.email || ""}</span>
          </div>
        </button>

        {(notificationsOpen || profileOpen) && (
          <div className="dropdown-menu combined-dropdown">
            {notificationsOpen && (
              <>
                <header className="dropdown-header">
                  Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                </header>
                {loadingNotifications ? (
                  <div className="p-4 text-center text-white/50 text-sm">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-white/50 text-sm">
                    No notifications
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
                    <ul>
                      {notifications.map((item) => {
                        const isUnread = item.is_read === "No";
                        return (
                          <li
                            key={item._id}
                            className={`${
                              isUnread ? "bg-white/5" : ""
                            } cursor-pointer hover:bg-white/10 transition-colors`}
                            onClick={() => handleMarkAsRead(item._id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <span className="dropdown-item__title break-words whitespace-pre-wrap">
                                  {item.message}
                                </span>
                                {/* <span className="dropdown-item__meta">
                                  {item.type.replace(/_/g, " ")}
                                </span> */}
                              </div>
                              {isUnread && (
                                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-cyan-400"></span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {profileOpen && <div className="dropdown-separator" />}
              </>
            )}

            {profileOpen && (
              <>
                <header className="dropdown-header">Account</header>
                <ul>
                  {profileMenu.map((item) => (
                    <li
                      key={item.title}
                      onClick={() => {
                        if (item.title === "Sign out") {
                          handleLogout();
                        } else if (item.route) {
                          navigate(item.route);
                        }
                        setProfileOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <span className="dropdown-item__title">{item.title}</span>
                      <span className="dropdown-item__meta">{item.meta}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
