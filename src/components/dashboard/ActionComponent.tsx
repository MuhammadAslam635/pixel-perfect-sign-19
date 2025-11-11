import React, { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "@/store/slices/authSlice";
import { toast } from "sonner";
import profileImage from "@/assets/user.jpg";

export const ActionComponent = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logged out successfully");
    navigate("/");
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

  const notifications = [
    { title: "Meeting starts in 30 minutes", meta: "Calendar" },
    { title: "New lead: Sarah Malik", meta: "CRM" },
    { title: "Proposal sent to ABC Corp", meta: "Sales" },
  ];

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
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
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
          <div className="h-8 w-8 overflow-hidden rounded-full border border-white/25">
            <img
              src={profileImage}
              alt="Zubair Khan"
              className="h-8 w-8 object-cover"
            />
          </div>
          <div className="hidden lg:flex flex-col text-left text-xs leading-tight text-white/70">
            <span className="font-medium text-white">Zubair Khan</span>
            <span className="text-white/50">zubair@gmail.com</span>
          </div>
        </button>

        {(notificationsOpen || profileOpen) && (
          <div className="dropdown-menu combined-dropdown">
            {notificationsOpen && (
              <>
                <header className="dropdown-header">Notifications</header>
                <ul>
                  {notifications.map((item) => (
                    <li key={item.title}>
                      <span className="dropdown-item__title">{item.title}</span>
                      <span className="dropdown-item__meta">{item.meta}</span>
                    </li>
                  ))}
                </ul>
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
