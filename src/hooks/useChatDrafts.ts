import { useState, useEffect, useCallback } from "react";

export interface ChatDraft {
  chatId: string;
  message: string;
  title: string;
  createdAt: string;
}

const STORAGE_PREFIX = "empa_draft_";

export const useChatDrafts = () => {
  // Save a draft to local storage (shared across tabs)
    const saveDraft = useCallback((chatId: string, message: string, title: string = "New Chat") => {
    if (!chatId) return;
    const draft: ChatDraft = {
      chatId,
      message,
      title,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${chatId}`, JSON.stringify(draft));
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("chat-draft-update"));
  }, []);

  // Remove a draft
  const removeDraft = useCallback((chatId: string) => {
    if (!chatId) return;
    localStorage.removeItem(`${STORAGE_PREFIX}${chatId}`);
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event("chat-draft-update"));
  }, []);

  // Hook to subscribe to drafts for specific chat IDs
  const useRemoteDrafts = (chatIds: string[]) => {
    const [drafts, setDrafts] = useState<Record<string, ChatDraft>>({});

    useEffect(() => {
      const loadDrafts = () => {
        const newDrafts: Record<string, ChatDraft> = {};
        let hasChanges = false;

        chatIds.forEach((id) => {
          try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
            if (item) {
              const draft = JSON.parse(item);
              newDrafts[id] = draft;
              
              // Check if actual change to avoid loops
              if (JSON.stringify(drafts[id]) !== item) {
                hasChanges = true;
              }
            }
          } catch (e) {
            console.error("Error parsing chat draft", e);
          }
        });

        // Only update if we found something different or if count changed
        // Simple check: keys length or if hasChanges (imperfect but efficient enough)
        if (hasChanges || Object.keys(newDrafts).length !== Object.keys(drafts).length) {
          setDrafts(newDrafts);
        }
      };

      loadDrafts();

      const handleStorage = (e: StorageEvent) => {
        if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
          loadDrafts();
        }
      };

      const handleCustomUpdate = () => {
        loadDrafts();
      };

      window.addEventListener("storage", handleStorage);
      window.addEventListener("chat-draft-update", handleCustomUpdate);
      // Poll faster just in case (200ms)
      const interval = setInterval(loadDrafts, 500);

      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("chat-draft-update", handleCustomUpdate);
        clearInterval(interval);
      };
    }, [chatIds]); // Re-run if IDs change

    return drafts;
  };

  return { saveDraft, removeDraft, useRemoteDrafts };
};
