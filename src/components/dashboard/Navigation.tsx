import { ClientsIcon } from "@/components/icons/ClientsIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import ChatIcon from "@/components/icons/ChatIcon";
import {
  BarChart3,
  Bot,
  FolderTree,
  Home,
  Megaphone,
  MessageSquare,
  Newspaper,
  PhoneCall,
  Settings,
  Settings2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import { usePermissions } from "@/hooks/usePermissions";
import { isRestrictedModule } from "@/utils/restrictedModules";

type NavLink = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  match?: (pathname: string) => boolean;
  roles?: string[];
  moduleName?: string; // New RBAC: module name to check permissions for
};

const contactRoles = ["CompanyUser"];
const adminRoles = ["Admin"];

const navLinks: NavLink[] = [
  {
    id: "home",
    label: "Home",
    icon: HomeIcon as typeof Home,
    path: "/dashboard",
    match: (pathname: string) => pathname === "/dashboard",
  },
  {
    id: "crm",
    label: "CRM",
    icon: BarChart3,
    path: "/companies",
    // No moduleName - custom permission check in filter logic
    match: (pathname: string) =>
      pathname.startsWith("/companies") ||
      pathname.startsWith("/leads") ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/emails/") ||
      pathname.startsWith("/followups"),
  },
  {
    id: "prospects",
    label: "Customer Support",
    icon: ClientsIcon as typeof Home,
    path: "/prospects",
    moduleName: "prospects", // Protected by 'prospects' module
    match: (pathname: string) => pathname.startsWith("/prospects"),
  },
  {
    id: "chat",
    label: "Skylar",
    icon: ChatIcon as typeof Home,
    path: "/chat",
    moduleName: "chat", // Protected by 'chat' module
  },
  {
    id: "agents",
    label: "Agents",
    icon: Bot,
    path: "/agents",
    moduleName: "agents", // Protected by 'agents' module
  },
  {
    id: "campaigns",
    label: "Campaigns",
    icon: Megaphone,
    path: "/campaigns",
    moduleName: "campaigns", // Protected by 'campaigns' module
    match: (pathname: string) => pathname.startsWith("/campaigns"),
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    path: "/news",
    match: (pathname: string) => pathname.startsWith("/news"),
  },
  // {
  //   id: "contact-now",
  //   label: "Contact",
  //   icon: PhoneCall,
  //   path: "/contact-now",
  //   match: (pathname: string) => pathname.startsWith("/contact-now"),
  //   roles: contactRoles,
  // },
];

// Admin Navigation Links - Enhanced with admin capabilities
const adminNavLinks: NavLink[] = [
  {
    id: "admin-home",
    label: "Dashboard",
    icon: HomeIcon as typeof Home,
    path: "/admin/dashboard",
    match: (pathname: string) => pathname === "/admin/dashboard",
  },
  {
    id: "admin-users",
    label: "Users",
    icon: Users,
    path: "/admin/users",
    match: (pathname: string) => pathname.startsWith("/admin/users"),
  },
  {
    id: "admin-categories",
    label: "Categories",
    icon: FolderTree,
    path: "/admin/industry-categories",
    match: (pathname: string) => pathname.startsWith("/admin/industry-categories"),
  },
  {
    id: "admin-enrichment-configs",
    label: "Enrichment Configs",
    icon: Settings2,
    path: "/admin/enrichment-configs",
    match: (pathname: string) => pathname.startsWith("/admin/enrichment-configs"),
  },
  {
    id: "prompts",
    label: "Prompts",
    icon: MessageSquare,
    path: "/admin/prompts",
    match: (pathname: string) => pathname.startsWith("/admin/prompts"),
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/admin/settings",
    match: (pathname: string) => pathname.startsWith("/admin/settings"),
  },
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
  // Permission hook
  const { canView } = usePermissions();
  
  const sessionUser = user || getUserData();

  // Get user's role name - prioritize roleId over legacy role
  const getUserRoleName = (): string | null => {

    if (!sessionUser) return null;

    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (sessionUser.roleId && typeof sessionUser.roleId === "object") {
      return (sessionUser.roleId as any).name;
    }

    // PRIORITY 2: Fallback to legacy role string
    if (sessionUser.role && typeof sessionUser.role === "string") {
      return sessionUser.role;
    }

    return null;
  };

  const userRole = getUserRoleName();

  const filteredNavLinks = useMemo(() => {
    return navLinks.filter((link) => {
      // Special handling for CRM button - show if user has ANY CRM module permission
      if (link.id === "crm") {
        // Admin can always view
        if (userRole === 'Admin') return true;
        
        // Show CRM if user has permission for any CRM module
        const crmModules = ["companies", "leads", "calendar", "followups", "emails"];
        return crmModules.some(module => canView(module));
      }

      // 1. Check Module Permissions (New RBAC)
      if (link.moduleName) {
         // Admin can always view
         if (userRole === 'Admin') return true;
         
         // CRITICAL: Hide restricted modules from navigation
         if (isRestrictedModule(link.moduleName)) {
           // We already know userRole !== 'Admin' (checked above)
           // But what if user is 'CompanyAdmin'? 
           // Navigation check above: userRole === 'Admin' only checks for System Admin string?
           // userRole is derived from getUserRoleName() which prioritizes valid RBAC role name.
           // If user is CompanyAdmin, userRole="CompanyAdmin".
           // Admin check above handles "Admin". CompanyAdmin needs check.
           if (userRole === 'Company' || userRole === 'CompanyAdmin') {
             // Continue to standard permission check or allow
             // Generally CompanyAdmin has full access, so canView should return true.
           } else {
             // Not an admin -> Block absolutely
             return false;
           }
         }
         
         if (!canView(link.moduleName)) {
           return false;
         }
      }

      // 2. Check Legacy Roles
      if (!link.roles || link.roles.length === 0) {
        return true;
      }
      if (!userRole) {
        return false;
      }
      return link.roles.includes(userRole);
    });
  }, [userRole, canView]);
  const [activeNav, setActiveNav] = useState(
    resolveActiveNav(location.pathname, filteredNavLinks)
  );

  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveNav(resolveActiveNav(location.pathname, filteredNavLinks));
  }, [location.pathname, filteredNavLinks]);

  const handleNavigate = (link: NavLink) => {
    setActiveNav(link.id);
    
    // Special handling for CRM button - navigate to first accessible CRM module
    if (link.id === "crm") {
      const crmModules = [
        { name: "companies", path: "/companies" },
        { name: "leads", path: "/leads" },
        { name: "calendar", path: "/calendar" },
        { name: "followups", path: "/followups" },
        { name: "emails", path: "/emails/inbox" },
      ];
      
      // Find first CRM module user has access to
      const firstAccessibleModule = crmModules.find(module => canView(module.name));
      
      if (firstAccessibleModule) {
        navigate(firstAccessibleModule.path);
      } else {
        // Fallback to dashboard if no CRM access (shouldn't happen)
        navigate("/dashboard");
      }
    } else {
      navigate(link.path);
    }
  };

  return (
    <nav className="hidden lg:flex scrollbar-hide flex-1 min-w-0 w-full lg:w-[780px] items-center justify-start lg:justify-center gap-1.5 overflow-x-auto flex-nowrap snap-x snap-mandatory pl-2 sm:pl-2 md:pl-3 pr-2 sm:pr-3">
      {filteredNavLinks.map((link) => {
        const Icon = link.icon;
        const isActive = activeNav === link.id;
        return (
          <button
            key={link.id}
            className={`group relative overflow-hidden flex-none flex h-9 items-center justify-start rounded-full border border-white/40 pl-2.5 pr-2.5 gap-2 text-sm font-medium tracking-wide transition-[background-color,box-shadow] duration-300 ease-out ${
              isActive
                ? "text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:from-white/25 z-10"
                : "text-white/85 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:z-10"
            } snap-start lg:snap-center before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-none hover:before:from-white/25`}
            style={{
              background: "#FFFFFF1A",
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
            onClick={() => handleNavigate(link)}
            aria-label={link.label}
            type="button"
          >
            {isActive && (
              <div
                className="absolute -left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                style={{
                  background:
                    "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  filter: "blur(20px)",
                  WebkitFilter: "blur(20px)",
                }}
              ></div>
            )}
            <Icon
              className={`h-4 w-4 flex-shrink-0 transition-[color,filter] duration-400 ease-in-out ${
                isActive
                  ? "text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  : "text-white/85 group-hover:text-white group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              }`}
            />
            <span className="whitespace-nowrap">
              {link.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

// Admin Navigation - Enhanced navigation for admin users
export const AdminNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const sessionUser = user || getUserData();

  // Get user's role name - prioritize roleId over legacy role
  const getUserRoleName = (): string | null => {
    if (!sessionUser) return null;

    // PRIORITY 1: Check populated roleId (new RBAC system)
    if (sessionUser.roleId && typeof sessionUser.roleId === "object") {
      return (sessionUser.roleId as any).name;
    }

    // PRIORITY 2: Fallback to legacy role string
    if (sessionUser.role && typeof sessionUser.role === "string") {
      return sessionUser.role;
    }

    return null;
  };

  const userRole = getUserRoleName();

  // Only show admin navigation if user has Admin role
  const isAdmin = userRole === "Admin";

  const filteredNavLinks = useMemo(() => {
    if (!isAdmin) return [];
    return adminNavLinks;
  }, [isAdmin]);

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

  if (!isAdmin) return null;

  return (
    <nav className="hidden lg:flex scrollbar-hide flex-1 min-w-0 w-full lg:w-[780px] items-center justify-start lg:justify-center gap-1.5 overflow-x-auto flex-nowrap snap-x snap-mandatory pl-2 sm:pl-2 md:pl-3 pr-2 sm:pr-3">
      {filteredNavLinks.map((link) => {
        const Icon = link.icon;
        const isActive = activeNav === link.id;
        return (
          <button
            key={link.id}
            className={`group relative overflow-hidden flex-none flex h-9 items-center justify-start rounded-full border border-white/40 pl-2.5 pr-2.5 gap-2 text-sm font-medium tracking-wide transition-[background-color,box-shadow] duration-300 ease-out ${
              isActive
                ? "text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:from-white/25 z-10"
                : "text-white/85 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:z-10"
            } snap-start lg:snap-center before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:before:from-white/25 hover:before:duration-200`}
            style={{
              background: "#FFFFFF1A",
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
            onClick={() => handleNavigate(link)}
            aria-label={link.label}
            type="button"
          >
            {isActive && (
              <div
                className="absolute -left-6 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                style={{
                  background:
                    "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  filter: "blur(20px)",
                  WebkitFilter: "blur(20px)",
                }}
              ></div>
            )}
            <Icon
              className={`h-4 w-4 flex-shrink-0 transition-[color,filter] duration-400 ease-in-out ${
                isActive
                  ? "text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  : "text-white/85 group-hover:text-white group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              }`}
            />
            <span className="whitespace-nowrap">
              {link.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
