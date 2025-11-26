import { ClientsIcon } from "@/components/icons/ClientsIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import ChatIcon from "@/components/icons/ChatIcon";
import {
  BarChart3,
  Bot,
  CalendarDays,
  UsersIcon,
  Home,
  Mail,
  Shield,
  PhoneCall,
  Target,
  UserCheck
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";


type NavLink = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  match?: (pathname: string) => boolean;
  roles?: string[];
};

const contactRoles = ["CompanyUser"];
const adminRoles = ["Admin", "CompanyAdmin", "Company"];
const superAdminRoles = ["Admin"];

const navLinks: NavLink[] = [
  {
    id: "home",
    label: "Home",
    icon: HomeIcon as typeof Home,
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
  {
    id: "clients",
    label: "Clients",
    icon: ClientsIcon as typeof Home,
    path: "/clients",
    match: (pathname: string) => pathname.startsWith("/clients"),
  },
  { id: "chat", label: "Chat", icon: ChatIcon as typeof Home, path: "/chat" },
  {
    id: "users",
    label: "Users",
    icon: UsersIcon,
    path: "/users",
    match: (pathname: string) => pathname.startsWith("/users"),
    roles: adminRoles,
  },
  {
    id: "roles",
    label: "Roles",
    icon: Shield,
    path: "/roles",
    match: (pathname: string) => pathname.startsWith("/roles"),
    roles: adminRoles,
  },
  {
    id: "members-permissions",
    label: "Members",
    icon: UserCheck,
    path: "/admin/members/permissions",
    match: (pathname: string) => pathname.startsWith("/admin/members/permissions"),
    roles: superAdminRoles,
  },
  {
    id: "emails",
    label: "Emails",
    icon: Mail,
    path: "/emails/inbox",
    match: (pathname: string) => pathname.startsWith("/emails"),
  },
  { id: "agents", label: "Agents", icon: Bot, path: "/agents" },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Target,
    path: "/campaigns",
    match: (pathname: string) => pathname.startsWith("/campaigns"),
  },
  {
    id: "followup-templates",
    label: "Followups",
    icon: CalendarDays,
    path: "/followup-templates",
    match: (pathname: string) => pathname.startsWith("/followup-templates"),
  },
  {
    id: "contact-now",
    label: "Contact",
    icon: PhoneCall,
    path: "/contact-now",
    match: (pathname: string) => pathname.startsWith("/contact-now"),
    roles: contactRoles,
  }
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
    <nav className="hidden lg:flex scrollbar-hide flex-1 min-w-0 w-full lg:w-[780px] items-center justify-start lg:justify-center gap-2 overflow-x-auto flex-nowrap snap-x snap-mandatory pl-2 sm:pl-3 md:pl-4 pr-2 sm:pr-4">
      {filteredNavLinks.map((link) => {
        const Icon = link.icon;
        const isActive = activeNav === link.id;
        return (
          <button
            key={link.id}
            className={`group relative overflow-hidden flex-none flex h-10 items-center justify-center rounded-full border border-white/40 px-0 text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-400 ease-elastic sm:text-sm ${
              isActive
                ? "text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] justify-start w-auto h-10 pl-3.5 pr-3.5 gap-2 before:from-white/25 z-10"
                : "w-10 aspect-square text-white/85 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:justify-start hover:w-auto hover:aspect-auto hover:h-10 hover:pl-3 hover:pr-2.5 hover:gap-2 hover:z-10"
            } snap-start lg:snap-center before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:before:from-white/25 hover:before:duration-200`}
            style={{
              background: '#FFFFFF1A',
              boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset',
            }}
            onClick={() => handleNavigate(link)}
            aria-label={link.label}
            type="button"
          >
            {isActive && (
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)',
                  filter: 'blur(20px)',
                  WebkitFilter: 'blur(20px)',
                }}
              ></div>
            )}
            <Icon
              className={`h-[16px] w-[16px] flex-shrink-0 transition-[color,filter] duration-250 ease-in-out ${
                isActive
                  ? "text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  : "text-white/85 group-hover:text-white group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              }`}
            />
            <span
              className={`whitespace-nowrap transition-[opacity,transform,width,margin] duration-350 ease-elastic overflow-hidden ${
                isActive
                  ? "inline ml-1.5 opacity-100 scale-100 translate-x-0 max-w-[200px]"
                  : "inline ml-0 opacity-0 scale-95 -translate-x-1 max-w-0 group-hover:ml-1.5 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-x-0 group-hover:max-w-[200px]"
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
