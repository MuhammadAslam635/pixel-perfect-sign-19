import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { setSelectedChatId } from "@/store/slices/chatSlice";

export const REFERSH_CHANNEL_NAME = "empa_chat_refresh_channel";
export const REFRESH_EVENT = "REFRESH_CHAT_LIST";
export const MIGRATE_EVENT = "MIGRATE_CHAT_ID";

interface MigratePayload {
  oldId: string;
  newId: string;
}

export const useChatSync = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  useEffect(() => {
    const channel = new BroadcastChannel(REFERSH_CHANNEL_NAME);

    channel.onmessage = (event) => {
      if (event.data === REFRESH_EVENT) {
        // Invalidate chat list to force refetch in this tab
        queryClient.invalidateQueries({ queryKey: ["chatList"] });
      } else if (event.data && event.data.type === MIGRATE_EVENT) {
        // Handle migration event
        const { oldId, newId } = event.data.payload as MigratePayload;
        
        // If we are currently viewing the old ID, switch to the new ID
        // We can't easily check Redux state here without subscribing, 
        // but we can dispatch an action that checks it? 
        // Or just dispatch a thunk? For now, we'll assume the component handles the check,
        // OR we can rely on a custom event dispatch.
        // Actually, easiest is to expose a callback or let the component hook consume this.
        // But this is a global hook.
        
        // Let's dispatch a custom window event so components can listen? 
        // OR simply direct dispatch if we want to force Redux update.
        // But we need to know IF we are selected.
        // Let's dispatch a special thunk or just use a window event.
        
        const customEvent = new CustomEvent("chat-migration", { 
          detail: { oldId, newId } 
        });
        window.dispatchEvent(customEvent);
      }
    };

    return () => {
      channel.close();
    };
  }, [queryClient, dispatch]);

  // Return functions to trigger events
  const triggerRefresh = useCallback(() => {
    const channel = new BroadcastChannel(REFERSH_CHANNEL_NAME);
    channel.postMessage(REFRESH_EVENT);
    channel.close();
  }, []);

  const triggerMigration = useCallback((oldId: string, newId: string) => {
    const channel = new BroadcastChannel(REFERSH_CHANNEL_NAME);
    channel.postMessage({ type: MIGRATE_EVENT, payload: { oldId, newId } });
    channel.close();
  }, []);

  return { triggerRefresh, triggerMigration };
};
