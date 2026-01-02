import { Building2, Users, CalendarDays, Clock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

type CrmNavLink = {
  id: string;
  label: string;
  icon: typeof Building2;
  path: string;
  match?: (pathname: string) => boolean;
  permission?: string;
};

const crmNavLinks: CrmNavLink[] = [
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    path: "/companies",
    match: (pathname: string) => pathname.startsWith("/companies"),
    permission: "companies",
  },
  {
    id: "leads",
    label: "Leads",
    icon: Users,
    path: "/leads",
    match: (pathname: string) => pathname.startsWith("/leads"),
    permission: "leads",
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: CalendarDays,
    path: "/calendar",
    match: (pathname: string) => pathname.startsWith("/calendar"),
    permission: "calendar",
  },
  {
    id: "followup",
    label: "Followup",
    icon: Clock,
    path: "/followups",
    match: (pathname: string) => pathname.startsWith("/followups"),
    permission: "followups",
  },
  {
    id: "emails",
    label: "Emails",
    icon: Mail,
    path: "/emails/inbox",
    match: (pathname: string) => pathname.startsWith("/emails"),
    permission: "emails",
  },
];

const resolveActiveCrmNav = (pathname: string, links: CrmNavLink[]) => {
  const match = links.find((link) =>
    link.match ? link.match(pathname) : link.path === pathname
  );
  return match?.id ?? "companies";
};

export const CrmNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canView } = usePermissions();
  
  const visibleLinks = crmNavLinks.filter((link) => {
    if (!link.permission) return true;
    return canView(link.permission);
  });

  const [activeNav, setActiveNav] = useState(
    resolveActiveCrmNav(location.pathname, visibleLinks)
  );

  useEffect(() => {
    setActiveNav(resolveActiveCrmNav(location.pathname, visibleLinks));
  }, [location.pathname, visibleLinks.length]);

  const handleNavigate = (link: CrmNavLink) => {
    setActiveNav(link.id);
    navigate(link.path);
  };

  return (
    <nav className="hidden lg:flex scrollbar-hide  min-w-0 w-full w-auto items-center justify-start gap-2 overflow-x-auto flex-nowrap snap-x snap-mandatory ">
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        const isActive = activeNav === link.id;
        return (
          <button
            key={link.id}
            className={`group relative overflow-hidden flex-none flex h-10 items-center justify-center rounded-full border border-white/40 px-0 text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-600 ease-out sm:text-sm ${
              isActive
                ? "text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] justify-start w-auto h-10 pl-3.5 pr-3.5 gap-2 before:from-white/25 z-10"
                : "w-10 aspect-square text-white/85 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:justify-start hover:w-auto hover:aspect-auto hover:h-10 hover:pl-3 hover:pr-2.5 hover:gap-2 hover:z-10"
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
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  filter: "blur(20px)",
                  WebkitFilter: "blur(20px)",
                }}
              ></div>
            )}
            <Icon
              className={`h-[16px] w-[16px] flex-shrink-0 transition-[color,filter] duration-400 ease-in-out ${
                isActive
                  ? "text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  : "text-white/85 group-hover:text-white group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.3)]"
              }`}
            />
            <span
              className={`whitespace-nowrap transition-[opacity,transform,width,margin] duration-700 ease-out overflow-hidden ${
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
