// src/hooks/useDashboardHooks.ts
import { useEffect, useState } from "react";

export const useIsDesktop = () => {
    const [isDesktop, setIsDesktop] = useState(
        typeof window === "undefined" ? true : window.innerWidth >= 1024
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isDesktop;
};

export const useLockBodyScroll = () => {
    useEffect(() => {
        if (typeof document === "undefined") return;
        const originalBody = document.body.style.overflow;
        const originalHtml = document.documentElement.style.overflow;
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalBody;
            document.documentElement.style.overflow = originalHtml;
        };
    }, []);
};
