import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface LeadStageUpdateData {
  type: string;
  leadId: string;
  oldStage: string;
  newStage: string;
  triggeredBy: string;
  stageUpdatedAt: string;
}

export const useLeadStageSSE = (leadId: string | null | undefined) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!leadId) return;

    // Construct the SSE URL. 
    // Assuming the backend is on the same host or configured via proxy/env.
    // Ideally use an environment variable for the base URL.
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5111";
    const sseUrl = `${backendUrl}/api/sse/stream`;

    console.log(`[SSE] Connecting to ${sseUrl}...`);

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      console.log("[SSE] Connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        // SSE often sends "connected" or heartbeat messages that might not be JSON or irrelevant
        if (event.data === ": heartbeat") return;
        
        const data = JSON.parse(event.data);

        if (data.type === "connected") {
          console.log("[SSE] Connected confirmed by server");
        } else if (data.type === "lead_stage_update") {
          const updateData = data as LeadStageUpdateData;
          
          // Only invalidate if the update matches the current lead
          if (updateData.leadId === leadId) {
            console.log("[SSE] Received stage update:", updateData.newStage);
            
            // Invalidate queries to refresh UI
            queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
            queryClient.invalidateQueries({ queryKey: ["lead-summary", leadId] });
             queryClient.invalidateQueries({ queryKey: ["lead-calendar-meetings", leadId] });
          }
        }
      } catch (err) {
        console.error("[SSE] Error parsing event data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error:", err);
      // EventSource automatically attempts to reconnect, but we can close on fatal errors if needed
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("[SSE] Connection closed");
      }
    };

    return () => {
      console.log("[SSE] Closing connection");
      eventSource.close();
    };
  }, [leadId, queryClient]);
};
