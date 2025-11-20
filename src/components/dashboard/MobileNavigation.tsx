import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import { HamburgerIcon } from "@/components/icons/HamburgerIcon";
import { ClientsIcon } from "@/components/icons/ClientsIcon";
import { HomeIcon } from "@/components/icons/HomeIcon";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Home,
  Mail,
  MessageSquare,
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
  { id: "chat", label: "Chat", icon: MessageSquare, path: "/chat" },
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

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
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
          {/* Overlay Backdrop - Click outside to close - Rendered via portal */}
          {typeof window !== 'undefined' && createPortal(
            <div
              className="lg:hidden cursor-pointer transition-opacity duration-200"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 40,
              }}
              onClick={() => setIsOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsOpen(false);
              }}
              aria-label="Close navigation"
            />,
            document.body
          )}

          {/* Navigation Panel - Rendered via portal */}
          {typeof window !== 'undefined' && createPortal(
            <div
              ref={panelRef}
              className="fixed left-0 top-0 h-screen w-80 text-white z-50 lg:hidden shadow-none overflow-hidden border-r border-white/10 bg-black/20 backdrop-blur-xl"
              style={{
                isolation: 'isolate',
              }}
              role="dialog"
              aria-modal="true"
            >
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-transparent opacity-70 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_45%)] opacity-30 pointer-events-none" />

            <div className="relative h-full overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 gap-3">
                <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
                  <svg width="156" height="24" viewBox="0 0 156 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto">
                    <path opacity="0.7" d="M14.9114 2.20302C10.9287 2.20302 7.49887 4.63067 6.03019 8.08639H7.22242C8.62198 5.24406 11.5334 3.29158 14.9028 3.29158C19.447 3.29158 23.1706 6.84233 23.447 11.3089H23.4298C23.7494 11.594 24.0863 11.8963 24.4146 12.2073C24.501 12.1123 24.5442 11.9914 24.5442 11.8531C24.5615 6.53132 20.2332 2.20302 14.9114 2.20302ZM14.9114 4.32829C12.1382 4.32829 9.71054 5.84017 8.406 8.08639H9.7019C10.8768 6.47084 12.7689 5.41685 14.9114 5.41685C17.4686 5.41685 19.7321 6.89417 20.7689 9.17495C20.7689 9.17495 21.2527 9.51188 21.9611 10.0734C21.9697 10.0562 21.987 10.0475 21.9956 10.0302C22.0993 9.89201 22.1252 9.71058 22.0734 9.54644C21.0712 6.42765 18.1943 4.32829 14.9114 4.32829ZM14.9114 0C9.69326 0 5.25265 3.39525 3.6803 8.08639H4.82933C6.35848 4 10.3066 1.07991 14.92 1.07991C20.8552 1.07991 25.6933 5.90929 25.6933 11.8445C25.6933 12.3542 25.6587 12.8726 25.5809 13.3736C25.8747 13.6933 26.1598 14.0302 26.419 14.3585C26.4967 14.2808 26.5485 14.1857 26.5658 14.0821C26.7041 13.3477 26.7732 12.5961 26.7732 11.8445C26.7732 5.31317 21.4514 0 14.9114 0Z" fill="url(#paint0_linear_mobile_nav)"/>
                    <path d="M24.1641 18.3845C23.9309 18.203 23.5853 18.2462 23.4039 18.4795C21.3477 21.1145 18.2549 22.6177 14.9114 22.6177C10.2808 22.6177 6.32397 19.6803 4.81209 15.568H3.66307C5.22678 20.2851 9.67603 23.6976 14.9114 23.6976C18.5832 23.6976 21.987 22.0389 24.2505 19.1361C24.4406 18.9115 24.3974 18.5745 24.1641 18.3845ZM14.9114 3.8147e-06C9.69331 3.8147e-06 5.2527 3.39525 3.68035 8.0864H4.82937C6.35853 4 10.3067 1.07992 14.9201 1.07992C20.8553 1.07992 25.6933 5.90929 25.6933 11.8445C25.6933 12.3542 25.6587 12.8726 25.581 13.3737C25.581 13.3909 25.5724 13.4169 25.5724 13.4341H0.544276C0.241901 13.4341 0 13.676 0 13.9784C0 14.2808 0.241901 14.5227 0.535637 14.5227H25.9698C26.0994 14.5313 26.2203 14.5054 26.324 14.4276C26.3499 14.4104 26.3844 14.3845 26.4017 14.3585C26.4795 14.2808 26.5313 14.1857 26.5486 14.0821C26.6868 13.3477 26.7559 12.5961 26.7559 11.8445C26.7732 5.31318 21.4514 3.8147e-06 14.9114 3.8147e-06Z" fill="url(#paint1_linear_mobile_nav)"/>
                    <path d="M22.635 16.7084C22.3931 16.5356 22.0475 16.5875 21.8747 16.838C20.2678 19.0842 17.6674 20.4233 14.9114 20.4233C11.5248 20.4233 8.59611 18.4449 7.20518 15.5853H6.01296C7.473 19.0583 10.9114 21.5119 14.9114 21.5119C18.013 21.5119 20.9503 20 22.7646 17.4773C22.9374 17.2181 22.8855 16.8812 22.635 16.7084ZM14.9114 2.20302C10.9287 2.20302 7.49892 4.63067 6.03024 8.08639H7.22246C8.62203 5.24406 11.5335 3.29158 14.9028 3.29158C19.4471 3.29158 23.1706 6.84233 23.4471 11.3089H21.8834H0.535637C0.241901 11.3089 0 11.5594 0 11.8531C0 12.1555 0.241901 12.3974 0.544276 12.3974H3.07559H24.0173C24.1814 12.3974 24.3283 12.3283 24.4233 12.216C24.5097 12.121 24.5529 12 24.5529 11.8618C24.5616 6.53131 20.2333 2.20302 14.9114 2.20302Z" fill="url(#paint2_linear_mobile_nav)"/>
                    <path d="M21.1318 15.067C20.8726 14.9114 20.5443 14.9892 20.3888 15.2484C19.2052 17.1577 17.1577 18.2894 14.9114 18.2894C12.7516 18.2894 10.8423 17.2181 9.67603 15.5767H8.38877C9.68467 17.8402 12.1296 19.3693 14.9201 19.3693C17.5378 19.3693 19.9309 18.0389 21.3218 15.8099C21.4687 15.5594 21.3909 15.2225 21.1318 15.067ZM22.0821 9.54643C21.0799 6.42764 18.203 4.32829 14.9201 4.32829C12.1469 4.32829 9.71922 5.84017 8.41469 8.08639H9.71058C10.8855 6.47084 12.7775 5.41685 14.9201 5.41685C17.4773 5.41685 19.7408 6.89417 20.7775 9.17495H9.06263C9.06263 9.17495 9.06263 9.17494 9.06263 9.16631H7.88769C7.88769 9.16631 7.88769 9.16631 7.88769 9.17495H6.78186C6.78186 9.17495 6.78186 9.17494 6.78186 9.16631H5.65011V9.17495H4.4838C4.4838 9.17495 4.4838 9.17494 4.4838 9.16631H3.36933C3.36933 9.16631 3.36933 9.16631 3.36933 9.17495H0.544276C0.241901 9.17495 0 9.41685 0 9.71922C0 10.013 0.233261 10.2549 0.526998 10.2635H21.5637C21.7192 10.2635 21.8575 10.1944 21.9611 10.0821C21.9698 10.0648 21.987 10.0562 21.9957 10.0389C22.0994 9.90065 22.1253 9.71058 22.0821 9.54643Z" fill="url(#paint3_linear_mobile_nav)"/>
                    <path d="M14.9115 19.3693C17.5292 19.3693 19.9223 18.0389 21.3132 15.8099C21.4687 15.5594 21.3909 15.2225 21.1318 15.067C20.8726 14.9114 20.5443 14.9892 20.3888 15.2484C19.2052 17.1577 17.1577 18.2894 14.9115 18.2894C12.7516 18.2894 10.8424 17.2181 9.67605 15.5767H8.38879C9.68469 17.8402 12.121 19.3693 14.9115 19.3693ZM14.9115 21.5032C18.013 21.5032 20.9503 19.9914 22.7646 17.4687C22.9374 17.2268 22.8855 16.8812 22.635 16.7084C22.3931 16.5356 22.0475 16.5875 21.8748 16.838C20.2678 19.0842 17.6674 20.4233 14.9115 20.4233C11.5249 20.4233 8.59613 18.4449 7.2052 15.5853H6.01298C7.48166 19.0497 10.9115 21.5032 14.9115 21.5032ZM24.1642 18.3844C23.9309 18.203 23.5853 18.2462 23.4039 18.4795C21.3478 21.1145 18.2549 22.6177 14.9115 22.6177C10.2808 22.6177 6.32399 19.6803 4.81211 15.568H3.66309C5.2268 20.2851 9.67605 23.6976 14.9115 23.6976C18.5832 23.6976 21.9871 22.0389 24.2506 19.1361C24.4406 18.9114 24.3974 18.5745 24.1642 18.3844Z" fill="url(#paint4_linear_mobile_nav)"/>
                    <path d="M31.3521 19.0151V4.78617H40.6825V7.30021H34.0475V10.3413H39.4903V12.8553H34.0475V16.5097H40.6911V19.0238H31.3521V19.0151Z" fill="url(#paint5_linear_mobile_nav)"/>
                    <path d="M42.5573 19.0151V8.34557H44.9417V11.8877H45.2786V19.0238H42.5573V19.0151ZM49.0281 19.0151V12.7084C49.0281 12 48.8639 11.4557 48.527 11.0583C48.1901 10.6695 47.7322 10.4708 47.1447 10.4708C46.5832 10.4708 46.1339 10.6609 45.7884 11.0497C45.4514 11.4384 45.2786 11.9309 45.2786 12.5443L44.1469 11.7495C44.1469 11.0497 44.3197 10.4276 44.6739 9.87473C45.0281 9.32181 45.4946 8.88121 46.0907 8.56155C46.6868 8.2419 47.3434 8.07775 48.0778 8.07775C48.9158 8.07775 49.6069 8.25918 50.1512 8.61339C50.6868 8.9676 51.0929 9.44276 51.3521 10.0389C51.6113 10.635 51.7408 11.2829 51.7408 12V19.0151H49.0281ZM55.4817 19.0151V12.7084C55.4817 12 55.3175 11.4557 54.9806 11.0583C54.6436 10.6695 54.1858 10.4708 53.5983 10.4708C53.2182 10.4708 52.8899 10.5572 52.6134 10.73C52.337 10.9028 52.121 11.1447 51.9655 11.4644C51.81 11.7754 51.7322 12.1382 51.7322 12.5443L50.6005 11.7927C50.6005 11.0583 50.7732 10.419 51.1188 9.85745C51.4644 9.29589 51.9309 8.86393 52.5184 8.54427C53.1059 8.23326 53.7538 8.07775 54.4709 8.07775C55.6976 8.07775 56.622 8.4406 57.2441 9.15766C57.8661 9.88337 58.1858 10.8251 58.1858 11.9914V19.0065H55.4817V19.0151Z" fill="url(#paint6_linear_mobile_nav)"/>
                    <path d="M60.2419 23.7581V8.34556H62.6264V15.6631H62.9633V23.7667H60.2419V23.7581ZM65.5292 19.3175C64.4666 19.3175 63.5767 19.0669 62.8597 18.5745C62.1426 18.0821 61.607 17.4082 61.2441 16.5615C60.8813 15.7149 60.6998 14.7559 60.6998 13.6847C60.6998 12.6134 60.8813 11.6544 61.2355 10.8078C61.5897 9.96111 62.1167 9.28725 62.8165 8.7948C63.5076 8.30236 64.3715 8.05183 65.391 8.05183C66.4191 8.05183 67.3089 8.29373 68.0692 8.78617C68.8294 9.26997 69.4169 9.94384 69.8402 10.7905C70.2635 11.6371 70.4709 12.6047 70.4709 13.6933C70.4709 14.7646 70.2635 15.7235 69.8489 16.5702C69.4342 17.4168 68.8553 18.0907 68.1124 18.5831C67.378 19.0669 66.5141 19.3175 65.5292 19.3175ZM65.0886 16.9244C65.6674 16.9244 66.1512 16.7775 66.5141 16.4924C66.8856 16.1987 67.162 15.8099 67.3348 15.3175C67.5162 14.825 67.6026 14.2808 67.6026 13.6847C67.6026 13.0885 67.5076 12.5529 67.3262 12.0605C67.1448 11.568 66.851 11.1793 66.4709 10.8855C66.0821 10.5918 65.5897 10.4449 64.9849 10.4449C64.4234 10.4449 63.9655 10.5831 63.6199 10.851C63.2743 11.1188 63.0152 11.4989 62.8597 11.9913C62.7041 12.4752 62.6178 13.0453 62.6178 13.6933C62.6178 14.3412 62.6955 14.9028 62.8597 15.3952C63.0152 15.879 63.2743 16.2592 63.6372 16.5356C64 16.8121 64.4838 16.9244 65.0886 16.9244Z" fill="url(#paint7_linear_mobile_nav)"/>
                    <path d="M75.1361 19.3175C74.3672 19.3175 73.7193 19.1706 73.1836 18.8769C72.648 18.5831 72.2506 18.1944 71.9741 17.7019C71.6977 17.2095 71.5594 16.6652 71.5594 16.0777C71.5594 15.5853 71.6372 15.1361 71.7841 14.7214C71.9396 14.3153 72.1815 13.9525 72.5271 13.6415C72.864 13.3304 73.3305 13.0626 73.9007 12.8553C74.2981 12.7084 74.7733 12.5788 75.3175 12.4665C75.8705 12.3542 76.4925 12.2505 77.1836 12.1469C77.8748 12.0432 78.6437 11.9309 79.4731 11.8099L78.4968 12.3456C78.4968 11.7149 78.3413 11.2484 78.0389 10.9546C77.7366 10.6609 77.2268 10.514 76.5098 10.514C76.1124 10.514 75.6977 10.6091 75.2657 10.7991C74.8337 10.9892 74.5314 11.3261 74.3586 11.8186L71.9137 11.0497C72.1815 10.1685 72.6912 9.4514 73.4428 8.89848C74.1944 8.34557 75.2139 8.06911 76.5011 8.06911C77.4515 8.06911 78.2895 8.21598 79.0238 8.50107C79.7582 8.79481 80.3111 9.29589 80.6912 10.0043C80.9072 10.4017 81.0281 10.7991 81.0713 11.1879C81.1145 11.5853 81.1318 12.0259 81.1318 12.5097V19.0324H78.7906V16.838L79.1275 17.2959C78.6005 18.013 78.0389 18.5313 77.4342 18.851C76.8294 19.1533 76.0605 19.3175 75.1361 19.3175ZM75.715 17.2009C76.2074 17.2009 76.6307 17.1145 76.9677 16.9417C77.3046 16.7689 77.581 16.5702 77.7798 16.3456C77.9785 16.1209 78.1167 15.9309 78.1944 15.784C78.3327 15.4903 78.4104 15.1533 78.4363 14.7732C78.4623 14.3844 78.4709 14.0648 78.4709 13.8056L79.2657 14.0043C78.4623 14.1339 77.8143 14.2462 77.3219 14.3326C76.8294 14.419 76.4234 14.5054 76.121 14.5745C75.8186 14.6436 75.5508 14.73 75.3175 14.8078C75.0497 14.9114 74.8424 15.0238 74.6782 15.1447C74.5141 15.2657 74.3931 15.4039 74.324 15.5421C74.2463 15.689 74.2117 15.8445 74.2117 16.0259C74.2117 16.2678 74.2722 16.4752 74.3931 16.6566C74.5141 16.8294 74.6869 16.9676 74.9115 17.054C75.1361 17.149 75.4039 17.2009 75.715 17.2009Z" fill="url(#paint8_linear_mobile_nav)"/>
                    <path d="M85.3651 19.0151V7.29157H80.8553V4.77753H92.5702V7.29157H88.0605V19.0151H85.3651Z" fill="url(#paint9_linear_mobile_nav)"/>
                    <path d="M97.054 19.3175C95.9568 19.3175 94.9892 19.0842 94.1512 18.6091C93.3132 18.1339 92.6566 17.486 92.1814 16.6652C91.7063 15.8358 91.473 14.8942 91.473 13.8229C91.473 12.6566 91.7063 11.6458 92.1642 10.7818C92.6307 9.91792 93.27 9.24405 94.0821 8.76889C94.8942 8.29373 95.8359 8.05183 96.8899 8.05183C98.013 8.05183 98.9719 8.31964 99.7581 8.84664C100.544 9.37364 101.132 10.1166 101.503 11.0669C101.883 12.0259 102.013 13.149 101.901 14.4363H99.2311V13.4514C99.2311 12.3628 99.0583 11.5853 98.7128 11.1015C98.3672 10.6263 97.797 10.3844 97.0108 10.3844C96.0951 10.3844 95.4125 10.6609 94.9806 11.2225C94.5486 11.7754 94.3326 12.6047 94.3326 13.6847C94.3326 14.6782 94.5486 15.4471 94.9806 15.9913C95.4125 16.5356 96.0519 16.8034 96.8899 16.8034C97.4169 16.8034 97.8747 16.6911 98.2462 16.4579C98.6264 16.2246 98.9115 15.8963 99.1102 15.4557L101.814 16.2246C101.408 17.2009 100.778 17.9611 99.905 18.4967C99.0411 19.041 98.0907 19.3175 97.054 19.3175ZM93.5033 14.4276V12.432H100.613V14.4276H93.5033Z" fill="url(#paint10_linear_mobile_nav)"/>
                    <path d="M108.371 19.3175C107.257 19.3175 106.307 19.0669 105.512 18.5745C104.717 18.0821 104.112 17.4082 103.689 16.5615C103.266 15.7149 103.05 14.7559 103.05 13.6847C103.05 12.6047 103.266 11.6371 103.706 10.7905C104.147 9.94384 104.769 9.26997 105.564 8.78617C106.367 8.30237 107.309 8.05183 108.406 8.05183C109.667 8.05183 110.73 8.37148 111.585 9.00215C112.441 9.64146 112.994 10.5054 113.227 11.6112L110.523 12.3196C110.367 11.7667 110.091 11.3348 109.693 11.0237C109.296 10.7127 108.855 10.5572 108.354 10.5572C107.784 10.5572 107.317 10.6955 106.955 10.9633C106.592 11.2397 106.324 11.6112 106.151 12.0777C105.978 12.5529 105.892 13.0799 105.892 13.676C105.892 14.6091 106.099 15.3607 106.514 15.9309C106.929 16.5097 107.542 16.7948 108.354 16.7948C108.959 16.7948 109.425 16.6566 109.745 16.3801C110.065 16.1037 110.298 15.7063 110.462 15.1965L113.218 15.7667C112.916 16.8985 112.337 17.771 111.49 18.3844C110.661 19.0065 109.616 19.3175 108.371 19.3175Z" fill="url(#paint11_linear_mobile_nav)"/>
                    <path d="M114.704 19.0151V4.78617H117.106V12.1037H117.443V19.0238H114.704V19.0151ZM122.03 19.0151V13.9698C122.03 13.7279 122.013 13.4168 121.987 13.0367C121.961 12.6566 121.875 12.2765 121.737 11.8963C121.598 11.5162 121.374 11.1965 121.054 10.9374C120.743 10.6782 120.294 10.5486 119.715 10.5486C119.482 10.5486 119.231 10.5832 118.972 10.6609C118.704 10.73 118.462 10.8769 118.229 11.0842C117.996 11.2916 117.806 11.594 117.659 12C117.512 12.406 117.434 12.933 117.434 13.5983L115.888 12.8639C115.888 12.0173 116.06 11.2311 116.406 10.4881C116.752 9.75378 117.27 9.15767 117.961 8.69978C118.652 8.2419 119.525 8.01728 120.579 8.01728C121.417 8.01728 122.108 8.15551 122.635 8.4406C123.162 8.7257 123.577 9.07991 123.87 9.52052C124.164 9.95248 124.371 10.4104 124.501 10.8769C124.631 11.3521 124.7 11.7754 124.726 12.1641C124.752 12.5529 124.769 12.838 124.769 13.0108V18.9978H122.03V19.0151Z" fill="url(#paint12_linear_mobile_nav)"/>
                    <path d="M136.467 19.3175C135.041 19.3175 133.806 19.0065 132.769 18.3844C131.732 17.7624 130.937 16.8985 130.376 15.784C129.814 14.6695 129.538 13.3736 129.538 11.8963C129.538 10.419 129.814 9.12311 130.376 8.00863C130.937 6.89416 131.732 6.03023 132.769 5.4082C133.806 4.78617 135.041 4.47515 136.467 4.47515C137.892 4.47515 139.127 4.78617 140.164 5.4082C141.201 6.03023 141.996 6.89416 142.557 8.00863C143.119 9.12311 143.395 10.419 143.395 11.8963C143.395 13.3736 143.119 14.6695 142.557 15.784C141.996 16.8985 141.201 17.7624 140.164 18.3844C139.127 19.0065 137.901 19.3175 136.467 19.3175ZM136.467 16.7862C137.374 16.8034 138.125 16.6047 138.73 16.2073C139.335 15.8013 139.784 15.2311 140.086 14.4968C140.389 13.7624 140.536 12.8985 140.536 11.905C140.536 10.9201 140.389 10.0561 140.086 9.33045C139.784 8.60475 139.335 8.04319 138.73 7.63714C138.125 7.23109 137.374 7.02375 136.467 7.01511C135.559 6.99784 134.808 7.19654 134.203 7.60259C133.598 8.00863 133.149 8.57883 132.847 9.31317C132.544 10.0475 132.397 10.9114 132.397 11.905C132.397 12.8898 132.544 13.7538 132.847 14.4708C133.149 15.1965 133.598 15.7581 134.203 16.1641C134.808 16.5615 135.559 16.7689 136.467 16.7862Z" fill="url(#paint13_linear_mobile_nav)"/>
                    <path d="M150.289 19.3175C149.227 19.3175 148.276 19.1274 147.421 18.7559C146.574 18.3844 145.875 17.8488 145.33 17.1577C144.786 16.4665 144.441 15.6371 144.294 14.6695L147.11 14.2549C147.309 15.0756 147.715 15.6976 148.337 16.1469C148.959 16.5875 149.667 16.8121 150.462 16.8121C150.903 16.8121 151.335 16.743 151.749 16.6047C152.164 16.4665 152.51 16.2592 152.778 15.9914C153.045 15.7235 153.184 15.3866 153.184 14.9892C153.184 14.8423 153.166 14.7041 153.123 14.5659C153.08 14.4276 153.011 14.3067 152.907 14.1857C152.803 14.0648 152.665 13.9525 152.484 13.8488C152.302 13.7451 152.069 13.6501 151.793 13.5637L148.078 12.4752C147.801 12.3974 147.473 12.2851 147.11 12.1382C146.747 11.9914 146.384 11.784 146.039 11.5162C145.693 11.2484 145.408 10.8855 145.184 10.4449C144.959 10.0043 144.838 9.43412 144.838 8.76025C144.838 7.80129 145.08 7.00647 145.564 6.3758C146.047 5.74513 146.695 5.26997 147.499 4.95895C148.302 4.64794 149.201 4.50107 150.177 4.50107C151.162 4.51835 152.043 4.6825 152.821 5.00215C153.598 5.32181 154.246 5.79697 154.765 6.41036C155.292 7.02375 155.663 7.77537 155.896 8.66522L152.976 9.15766C152.873 8.69978 152.674 8.31101 152.389 7.99135C152.104 7.6717 151.767 7.43844 151.369 7.26565C150.972 7.1015 150.566 7.01511 150.134 6.99783C149.711 6.98055 149.313 7.04103 148.942 7.17062C148.57 7.30021 148.259 7.48163 148.026 7.73217C147.793 7.97407 147.672 8.26781 147.672 8.60474C147.672 8.91576 147.767 9.1663 147.957 9.365C148.147 9.56371 148.389 9.71921 148.682 9.83152C148.976 9.95247 149.27 10.0475 149.572 10.1253L152.052 10.7991C152.423 10.8942 152.829 11.0324 153.279 11.1879C153.728 11.352 154.16 11.5767 154.574 11.8618C154.989 12.1469 155.326 12.527 155.594 12.9935C155.862 13.46 156 14.0561 156 14.7732C156 15.5335 155.836 16.2073 155.516 16.7775C155.197 17.3477 154.765 17.8229 154.22 18.1944C153.676 18.5659 153.063 18.8423 152.38 19.0324C151.724 19.2225 151.015 19.3175 150.289 19.3175Z" fill="url(#paint14_linear_mobile_nav)"/>
                    <defs>
                      <linearGradient id="paint0_linear_mobile_nav" x1="17.4415" y1="7.75112" x2="12.794" y2="13.2351" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white"/>
                        <stop offset="1"/>
                      </linearGradient>
                      <linearGradient id="paint1_linear_mobile_nav" x1="0.247317" y1="9.85412" x2="37.4972" y2="14.9264" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint2_linear_mobile_nav" x1="-3.00897" y1="12.9147" x2="29.0101" y2="11.0126" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint3_linear_mobile_nav" x1="-0.629676" y1="10.6405" x2="26.5284" y2="12.754" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint4_linear_mobile_nav" x1="8.69092" y1="15.1641" x2="28.4254" y2="25.7842" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint5_linear_mobile_nav" x1="30.1331" y1="11.5086" x2="188.629" y2="22.0572" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint6_linear_mobile_nav" x1="30.0802" y1="12.3182" x2="188.609" y2="22.869" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint7_linear_mobile_nav" x1="29.9899" y1="13.7122" x2="188.524" y2="24.2633" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint8_linear_mobile_nav" x1="30.1915" y1="10.6388" x2="188.736" y2="21.1906" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint9_linear_mobile_nav" x1="30.3693" y1="8.00066" x2="188.919" y2="18.5528" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint10_linear_mobile_nav" x1="30.2862" y1="9.24173" x2="188.833" y2="19.7937" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint11_linear_mobile_nav" x1="30.3369" y1="8.48469" x2="188.885" y2="19.0367" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint12_linear_mobile_nav" x1="30.5163" y1="6.21728" x2="189.016" y2="16.7661" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint13_linear_mobile_nav" x1="30.5769" y1="4.85296" x2="189.131" y2="15.4055" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                      <linearGradient id="paint14_linear_mobile_nav" x1="30.634" y1="3.95358" x2="189.191" y2="14.5063" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#69B4B7"/>
                        <stop offset="0.1587" stopColor="#66AFB7"/>
                        <stop offset="0.3504" stopColor="#5EA0B6"/>
                        <stop offset="0.5591" stopColor="#5188B6"/>
                        <stop offset="0.7795" stopColor="#3F66B4"/>
                        <stop offset="1" stopColor="#283CB3"/>
                      </linearGradient>
                    </defs>
                  </svg>
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
              <nav className="p-4 space-y-2 flex-1">
                {filteredNavLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavigate(link)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10"
                      type="button"
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{link.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>,
          document.body
          )}
        </>
      )}
    </>
  );
};
