import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  BarChart3,
  Users,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  ArrowUpRight,
  Target,
  BookOpen,
  Settings,
  Bell,
  Bot,
  PhoneCall,
} from "lucide-react";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
type NavLink = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  match?: (pathname: string) => boolean;
  roles?: string[];
};

const contactRoles = ["CompanyUser"];

const navLinks: NavLink[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    path: "/dashboard",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    id: "companies",
    label: "Companies",
    icon: BarChart3,
    path: "/companies",
    match: (pathname: string) => pathname.startsWith("/companies"),
  },
  // { id: "users", label: "Users", icon: Users, path: "/users" },
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/chat" },
  { id: "agents", label: "Agents", icon: Bot, path: "/agents" },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Target,
    path: "/campaigns",
    match: (pathname: string) => pathname.startsWith("/campaigns"),
  },
  {
    id: "contact-now",
    label: "Contact",
    icon: PhoneCall,
    path: "/contact-now",
    match: (pathname: string) => pathname.startsWith("/contact-now"),
    roles: contactRoles,
  },
  // {
  //   id: "company-knowledge",
  //   label: "Knowledge",
  //   icon: BookOpen,
  //   path: "/company-knowledge",
  //   match: (pathname: string) => pathname.startsWith("/company-knowledge"),
  // },
  // { id: "Booking", label: "Booking", icon: CalendarDays, path: "/booking" },
  // { id: "Leads", label: "Leads", icon: TrendingUp, path: "/leads" },
  // {
  //   id: "Prospects",
  //   label: "Prospects",
  //   icon: ArrowUpRight,
  //   path: "/prospects",
  // },
  // { id: "Results", label: "Results", icon: Target, path: "/results" },
  // { id: "docs", label: "Docs", icon: BookOpen, path: "/knowledge-base" },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   icon: Settings,
  //   path: "/settings",
  //   match: (pathname: string) => pathname.startsWith("/settings"),
  // },
];

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

const resolveActiveNav = (pathname: string, links: NavLink[]) => {
  const match = links.find((link) =>
    link.match ? link.match(pathname) : link.path === pathname
  );
  return match?.id ?? "home";
};
export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const sessionUser = user || getUserData();
  const userRole = sessionUser?.role;
  const filteredNavLinks = useMemo(() => {
    return navLinks.filter((link) => {
      if (!link.roles || link.roles.length === 0) {
        return true;
      }
      if (!userRole) {
        return false;
      }
      return link.roles.includes(userRole);
    });
  }, [userRole]);
  const [activeNav, setActiveNav] = useState(
    resolveActiveNav(location.pathname, filteredNavLinks)
  );

  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveNav(resolveActiveNav(location.pathname, filteredNavLinks));
  }, [location.pathname, filteredNavLinks]);

  const handleNavigate = (link: NavLink) => {
    setActiveNav(link.id);
    navigate(link.path);
  };
  return (
    <nav className="scrollbar-hide flex-1 min-w-0 w-full lg:w-[780px] flex items-center justify-start lg:justify-center gap-2 overflow-x-auto flex-nowrap snap-x snap-mandatory pl-2 sm:pl-3 md:pl-4 pr-2 sm:pr-4">
      {filteredNavLinks.map((link) => {
        const Icon = link.icon;
        const isActive = activeNav === link.id;
        return (
          <button
            key={link.id}
            className={`group relative overflow-visible flex-none aspect-square flex h-10 w-10 items-center justify-center rounded-full border border-white/40 px-0 text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-400 ease-elastic sm:text-sm ${
              isActive
                ? "text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] justify-start w-auto h-10 px-2.5 gap-2 before:from-white/25 z-10"
                : "text-white/85 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:justify-start hover:w-auto hover:h-10 hover:px-2.5 hover:gap-2 hover:z-10"
            } snap-start lg:snap-center before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:before:from-white/25 hover:before:duration-200`}
            style={{
              background: isActive
                ? "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)"
                : "rgba(255, 255, 255, 0.1)",
              boxShadow:
                "rgba(255, 255, 255, 0.16) 0px 3.43px 3.43px 0px inset, rgba(255, 255, 255, 0.16) 0px -3.43px 3.43px 0px inset",
            }}
            onClick={() => handleNavigate(link)}
            aria-label={link.label}
            type="button"
          >
            <Icon
              className={`h-[20px] w-[20px] flex-shrink-0 transition-[color,filter] duration-250 ease-in-out ${
                isActive
                  ? "text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  : "text-white/85 group-hover:text-white group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              }`}
            />
            <span
              className={`whitespace-nowrap transition-[opacity,transform] duration-350 ease-elastic ${
                isActive
                  ? "inline ml-2 opacity-100 scale-100 translate-x-0"
                  : "hidden group-hover:inline ml-2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-1 group-hover:translate-x-0"
              }`}
            >
              {link.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
