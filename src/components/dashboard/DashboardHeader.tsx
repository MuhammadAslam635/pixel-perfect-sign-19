import { ActionComponent } from "./ActionComponent";
import { Navigation, AdminNavigation } from "./Navigation";
import { MobileNavigation } from "./MobileNavigation";
import Logo from "../Logo";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CompleteProfileButton } from "@/pages/shared/completeProfile/CompleteProfileButton";

const DashboardHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPageScrollable, setIsPageScrollable] = useState(true);

  useEffect(() => {
    const checkScrollability = () => {
      // Check if page is scrollable (content height > viewport height)
      const isScrollable =
        document.documentElement.scrollHeight > window.innerHeight;
      setIsPageScrollable(isScrollable);

      // If page is not scrollable, always show background
      if (!isScrollable) {
        setIsScrolled(true);
      } else {
        // If page becomes scrollable, check current scroll position
        if (window.scrollY > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    const handleScroll = () => {
      // Only handle scroll if page is scrollable
      if (document.documentElement.scrollHeight > window.innerHeight) {
        if (window.scrollY > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    // Check scrollability on mount and resize
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollability);
    };
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-[100] flex h-24 items-center gap-4 p-2 mx-w-full overflow-visible ${isScrolled || !isPageScrollable
        ? "bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border-b border-white/10"
        : "bg-transparent"
        }`}
    >
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 lg:gap-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <MobileNavigation />
          <Link to="/dashboard" className="hidden lg:flex items-center">
            <Logo />
          </Link>
        </div>
        <Navigation />
        <div className="flex items-center gap-3">
          <CompleteProfileButton />
          <ActionComponent />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

// Admin Header - Enhanced version with different styling and Admin Navigation
export const AdminHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPageScrollable, setIsPageScrollable] = useState(true);

  useEffect(() => {
    const checkScrollability = () => {
      // Check if page is scrollable (content height > viewport height)
      const isScrollable =
        document.documentElement.scrollHeight > window.innerHeight;
      setIsPageScrollable(isScrollable);

      // If page is not scrollable, always show background
      if (!isScrollable) {
        setIsScrolled(true);
      } else {
        // If page becomes scrollable, check current scroll position
        if (window.scrollY > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    const handleScroll = () => {
      // Only handle scroll if page is scrollable
      if (document.documentElement.scrollHeight > window.innerHeight) {
        if (window.scrollY > 20) {
          setIsScrolled(true);
        } else {
          setIsScrolled(false);
        }
      }
    };

    // Check scrollability on mount and resize
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollability);
    };
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-[100] flex h-24 items-center gap-4 p-2 mx-w-full overflow-visible ${isScrolled || !isPageScrollable
        ? "bg-[rgba(15,15,20,0.85)] backdrop-blur-xl border-b border-white/10"
        : "bg-transparent"
        }`}
    >
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 lg:gap-0">
        <div className="flex items-center gap-3 flex-shrink-0">
          <MobileNavigation />
          <Link to="/admin/dashboard" className="hidden lg:flex items-center">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="text-xs font-semibold text-white/85 bg-white/10 px-2 py-1 rounded-full">
                ADMIN
              </span>
            </div>
          </Link>
        </div>
        <AdminNavigation />
        <div className="flex items-center gap-3">
          <CompleteProfileButton />
          <ActionComponent />
        </div>
      </div>
    </header>
  );
};
