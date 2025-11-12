import { ActionComponent } from "./ActionComponent";
import { Navigation } from "./Navigation";
import Logo from "../Logo";
import { useEffect, useState } from "react";

const DashboardHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-50 flex h-20 items-center gap-4 p-2 mx-w-full overflow-visible transition-all duration-300 ${
        isScrolled
          ? "bg-[rgba(15,15,20,0.85)] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] flex w-full max-w-full items-center justify-between gap-3 sm:gap-4 lg:gap-0">
        <Logo />
        <Navigation />

        <ActionComponent />
      </div>
    </header>
  );
};

export default DashboardHeader;
