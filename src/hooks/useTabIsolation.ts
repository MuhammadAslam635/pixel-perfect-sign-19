import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { initializeTab, CURRENT_TAB_ID } from "@/store/slices/chatSlice";

/**
 * Hook to handle tab isolation and detect multiple active tabs
 *
 * This hook:
 * 1. Initializes the current tab with a unique ID
 * 2. Detects when multiple tabs are open
 * 3. Clears stale state from other tabs
 *
 * @returns {boolean} hasMultipleTabs - true if multiple tabs are detected
 */
export const useTabIsolation = () => {
  const dispatch = useDispatch();
  const [hasMultipleTabs, setHasMultipleTabs] = useState(false);

  useEffect(() => {
    // Initialize this tab
    dispatch(initializeTab());

    // Set up tab detection using localStorage
    const TAB_CHECK_KEY = "chat_active_tabs";
    const CHECK_INTERVAL = 2000; // Check every 2 seconds

    // Register this tab
    const registerTab = () => {
      const now = Date.now();
      const activeTabs = JSON.parse(
        localStorage.getItem(TAB_CHECK_KEY) || "{}"
      );

      // Clean up stale tabs (older than 5 seconds)
      const cleanedTabs: Record<string, number> = {};
      Object.entries(activeTabs).forEach(([tabId, timestamp]) => {
        if (now - (timestamp as number) < 5000) {
          cleanedTabs[tabId] = timestamp as number;
        }
      });

      // Add current tab
      cleanedTabs[CURRENT_TAB_ID] = now;

      // Update localStorage
      localStorage.setItem(TAB_CHECK_KEY, JSON.stringify(cleanedTabs));

      // Check if multiple tabs are active
      setHasMultipleTabs(Object.keys(cleanedTabs).length > 1);
    };

    // Initial registration
    registerTab();

    // Register periodically
    const interval = setInterval(registerTab, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);

      // Remove this tab from active tabs
      const activeTabs = JSON.parse(
        localStorage.getItem(TAB_CHECK_KEY) || "{}"
      );
      delete activeTabs[CURRENT_TAB_ID];
      localStorage.setItem(TAB_CHECK_KEY, JSON.stringify(activeTabs));
    };
  }, [dispatch]);

  return { hasMultipleTabs };
};
