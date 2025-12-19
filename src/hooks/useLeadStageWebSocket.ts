/**
 * React Hook for Lead Stage WebSocket Updates
 *
 * This hook manages WebSocket connection for real-time lead stage updates.
 * It automatically subscribes to lead updates and invalidates React Query
 * cache when stage changes are received.
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface LeadStageUpdateMessage {
  type: "lead_stage_update";
  leadId: string;
  data: {
    leadId: string;
    ownerId?: string;
    oldStage?: string | null;
    newStage: string;
    triggeredBy: string;
    stageUpdatedAt: string;
    stageUpdatedBy: string;
  };
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  message?: string;
  leadId?: string;
  data?: any;
  timestamp: string;
}

export const useLeadStageWebSocket = (leadId: string | null | undefined) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const getWebSocketUrl = useCallback((): string | null => {
    const userData = localStorage.getItem("user");
    let token = null;

    if (userData) {
      try {
        const user = JSON.parse(userData);
        token = user.token;
      } catch (error) {
        console.error("Error parsing user data for WebSocket auth:", error);
        return null;
      }
    }

    if (!token) {
      console.warn("No authentication token found for WebSocket connection");
      return null;
    }

    const tokenParam = `?token=${encodeURIComponent(token)}`;
    const backendUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5111";

    // Remove trailing slash if present and any /api suffix
    let cleanBackendUrl = backendUrl.replace(/\/$/, "").replace(/\/api$/, "");

    // Handle relative URLs (if backendUrl doesn't have protocol)
    if (
      !cleanBackendUrl.startsWith("http://") &&
      !cleanBackendUrl.startsWith("https://")
    ) {
      cleanBackendUrl = `http://${cleanBackendUrl}`;
    }

    const url = new URL(cleanBackendUrl);
    const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = url.host;
    const wsPath = "/api/ws/lead-stage";

    const wsUrl = `${wsProtocol}//${wsHost}${wsPath}${tokenParam}`;
    console.log(
      "[WebSocket] Constructed URL:",
      wsUrl.replace(/token=[^&]+/, "token=***")
    );
    return wsUrl;
  }, []);

  const connect = useCallback(() => {
    // Don't connect if no leadId
    if (!leadId) {
      return;
    }

    // Don't reconnect if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.warn("Cannot establish WebSocket connection: No URL available");
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected successfully");
        reconnectAttemptsRef.current = 0;

        // Subscribe to this lead's updates
        if (leadId) {
          const subscribeMessage = {
            type: "subscribe",
            leadId: leadId,
          };
          console.log("[WebSocket] Subscribing to lead:", leadId);
          ws.send(JSON.stringify(subscribeMessage));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          // Handle lead stage update
          if (message.type === "lead_stage_update") {
            const updateMessage = message as LeadStageUpdateMessage;

            // Normalize leadIds to strings for comparison
            const updateLeadId = String(updateMessage.leadId || "");
            const currentLeadId = String(leadId || "");

            // Only process if it's for the current lead
            if (updateLeadId === currentLeadId && currentLeadId) {
              console.log("[WebSocket] Lead stage update received:", {
                leadId: updateLeadId,
                oldStage: updateMessage.data.oldStage,
                newStage: updateMessage.data.newStage,
                triggeredBy: updateMessage.data.triggeredBy,
              });

              // Force refetch queries immediately (not just invalidate)
              // This ensures the UI updates right away
              queryClient.refetchQueries({
                queryKey: ["lead", leadId],
              });

              // Also refetch lead summary
              queryClient.refetchQueries({
                queryKey: ["lead-summary", leadId],
              });

              // Refetch lead calendar meetings if needed
              queryClient.refetchQueries({
                queryKey: ["lead-calendar-meetings", leadId],
              });

              // Also invalidate to ensure all related queries are refreshed
              queryClient.invalidateQueries({
                queryKey: ["lead", leadId],
              });
              queryClient.invalidateQueries({
                queryKey: ["lead-summary", leadId],
              });

              console.log(
                "[WebSocket] Queries refetched and invalidated, UI should update immediately"
              );
            } else {
              console.log(
                "[WebSocket] Update received for different lead:",
                updateLeadId,
                "current:",
                currentLeadId
              );
            }
          } else if (message.type === "connected") {
            console.log("[WebSocket] Connection confirmed:", message.message);
          } else if (message.type === "subscribed") {
            console.log(
              "[WebSocket] Subscribed to lead updates:",
              message.leadId
            );
          } else if (message.type === "pong") {
            // Heartbeat response - silent
          } else if (message.type === "error") {
            console.error("[WebSocket] Error:", message.message);
          } else {
            console.log("[WebSocket] 📨 Unknown message type:", message.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Connection error:", error);
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] 🔌 Connection closed:", {
          code: event.code,
          reason: event.reason || "No reason provided",
          wasClean: event.wasClean,
        });
        wsRef.current = null;

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          reconnectAttemptsRef.current < maxReconnectAttempts
        ) {
          reconnectAttemptsRef.current++;
          const delay = reconnectDelay * reconnectAttemptsRef.current;

          console.log(
            `[WebSocket] Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error("[WebSocket] Max reconnection attempts reached");
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
    }
  }, [leadId, getWebSocketUrl, queryClient]);

  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Unsubscribe before closing
    if (wsRef.current?.readyState === WebSocket.OPEN && leadId) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "unsubscribe",
            leadId: leadId,
          })
        );
      } catch (error) {
        console.error("Error unsubscribing from WebSocket:", error);
      }
    }

    // Close connection
    if (wsRef.current) {
      wsRef.current.close(1000, "Component unmounting");
      wsRef.current = null;
    }
  }, [leadId]);

  // Set up ping interval to keep connection alive
  useEffect(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: "ping",
            })
          );
        } catch (error) {
          console.error("Error sending WebSocket ping:", error);
        }
      }
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval);
    };
  }, [wsRef.current?.readyState]);

  // Connect when leadId changes
  useEffect(() => {
    if (leadId) {
      console.log("[WebSocket] Connecting for leadId:", leadId);
      connect();
    } else {
      console.log("[WebSocket] No leadId, disconnecting");
      disconnect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
  };
};
