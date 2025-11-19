import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import { HamburgerIcon } from "@/components/icons/HamburgerIcon";
import ChatIcon from "@/components/icons/ChatIcon";
import { ClientsIcon } from "@/components/icons/ClientsIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import Logo from "@/components/Logo";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Home,
  Mail,
  PhoneCall,
  Target,
  X,
} from "lucide-react";

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
  },
];

const resolveActiveNav = (pathname: string, links: NavLink[]) => {
  const match = links.find((link) =>
    link.match ? link.match(pathname) : link.path === pathname
  );
  return match?.id ?? "home";
};

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const sessionUser = user || getUserData();
  const userRole = sessionUser?.role;

  const filteredNavLinks = navLinks.filter((link) => {
    if (!link.roles || link.roles.length === 0) {
      return true;
    }
    if (!userRole) {
      return false;
    }
    return link.roles.includes(userRole);
  });

  const activeNav = resolveActiveNav(location.pathname, filteredNavLinks);

  const handleNavigate = (link: NavLink) => {
    navigate(link.path);
    setIsOpen(false);
  };

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close when clicking outside of the drawer (covers cases without overlay)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) {
        return;
      }
      if (triggerRef.current?.contains(target)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  // Close on Escape key even if overlay is not focused
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        ref={triggerRef}
        className="lg:hidden flex items-center justify-center p-2 hover:bg-white/10 rounded-lg transition-colors relative z-50"
        aria-label="Toggle navigation"
        type="button"
      >
        <HamburgerIcon className="w-8 h-8" />
      </button>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <>
          {/* Overlay Backdrop - Click outside to close */}
          <div
            className="absolute inset-0 bg-black/50 z-40 lg:hidden cursor-pointer transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            aria-label="Close navigation"
          />

          {/* Navigation Panel */}
          <div
            ref={panelRef}
            className="absolute left-0 top-0 h-screen w-80 bg-white/25 z-50 lg:hidden shadow-2xl overflow-y-auto backdrop-blur-[20px] border-r border-white/40"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 gap-3">
              <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                {/* Show full logo with text - hide icon, show full version */}
                <div className="[&_svg:first-child]:hidden [&_svg.hidden]:!block">
                  <Logo />
                </div>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                aria-label="Close navigation"
                type="button"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              {filteredNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeNav === link.id;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavigate(link)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-[#67B0B7] to-[#4066B3] text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    type="button"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{link.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
};
