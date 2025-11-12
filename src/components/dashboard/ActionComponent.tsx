import React, { useEffect, useRef, useState } from "react";
import { Bell, User as UserIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout, updateUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import {
  notificationService,
  Notification,
} from "@/services/notification.service";
import { userService } from "@/services/user.service";
import { RootState } from "@/store/store";

export const ActionComponent = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get user from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user);

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

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await notificationService.getNotifications(1, 10);
      // API returns "notification" not "notifications"
      const notificationList =
        response.notification || response.notifications || [];
      setNotifications(notificationList);
      setUnreadCount(
        response.unreadNotificationCount ||
          response.pagination?.unreadCount ||
          0
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // Find the notification to check if it's already read
    const notification = notifications.find((n) => n._id === notificationId);

    // If already read, don't do anything
    if (notification?.is_read === "Yes") {
      return;
    }

    try {
      await notificationService.markAsRead(notificationId);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, is_read: "Yes" } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
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
    { title: "Profile", meta: "View your profile" },
    { title: "Settings", meta: "Manage preferences" },
    { title: "Sign out", meta: "Log out of EmpaTech OS" },
  ];

  return (
    <div className="flex min-w-[100px] justify-end relative" ref={actionsRef}>
      <div className="flex items-center gap-1 rounded-full border border-white/15 bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] py-1.5 px-3 shadow-[0_20px_34px_rgba(0,0,0,0.38)] backdrop-blur">
        <button
          aria-label="Toggle notifications"
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:bg-black/45 ${
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

        <span className="h-6 w-px rounded-full bg-white/15" />

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
            {currentUser?.profileImage ? (
              <img
                src={currentUser.profileImage}
                alt={currentUser?.name || currentUser?.email || "User"}
                className="h-8 w-8 object-cover"
              />
            ) : (
              <UserIcon className="h-4 w-4 text-white/70" />
            )}
          </div>
          <div className="hidden lg:flex flex-col text-left text-xs leading-tight text-white/70">
            <span className="font-medium text-white">
              {currentUser?.name || currentUser?.email?.split("@")[0] || "User"}
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
                  <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
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
                                <span className="dropdown-item__title">
                                  {item.message}
                                </span>
                                <span className="dropdown-item__meta">
                                  {item.type.replace(/_/g, " ")}
                                </span>
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
