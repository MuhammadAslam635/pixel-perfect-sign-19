import { useMemo } from 'react';

export const useUserTimeZone = (): string => {
    return useMemo(() => {
        if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
            return "UTC";
        }
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
            return "UTC";
        }
    }, []);
};