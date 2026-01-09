import { useState, useEffect, useCallback } from "react";
import { bdrDashboardService } from "@/services/bdr-dashboard.service";
import {
  BDRDashboardData,
  DailyGoalTracker,
  PriorityLead,
  PersonalPipelineSnapshot,
  ExecutionQuality,
  TalkTrackSuggestion,
  MessageSuggestion,
  PersonalActivitySummary,
  PersonalConversionRates,
  CoachingInsight,
  AtRiskItem,
} from "@/types/bdr-dashboard.types";

interface UseBDRDashboardReturn {
  // Data
  dashboardData: BDRDashboardData | null;
  dailyGoals: DailyGoalTracker | null;
  priorityQueue: PriorityLead[];
  pipelineSnapshot: PersonalPipelineSnapshot | null;
  executionQuality: ExecutionQuality | null;
  talkTrack: TalkTrackSuggestion | null;
  messageSuggestions: MessageSuggestion[];
  activitySummary: PersonalActivitySummary | null;
  conversionRates: PersonalConversionRates | null;
  coachingInsights: CoachingInsight[];
  atRiskItems: AtRiskItem[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshTalkTrack: (leadId: string) => Promise<void>;
  executeQuickAction: (itemId: string, action: string, params?: Record<string, any>) => Promise<boolean>;
  updateDailyGoals: (goals: Partial<DailyGoalTracker>) => Promise<boolean>;

  // Error handling
  error: string | null;
}

export const useBDRDashboard = (): UseBDRDashboardReturn => {
  const [dashboardData, setDashboardData] = useState<BDRDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const response = await bdrDashboardService.getBDRDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err: any) {
      console.error("Failed to load BDR dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await loadDashboardData(false);
  }, [loadDashboardData]);

  const refreshTalkTrack = useCallback(async (leadId: string) => {
    try {
      const response = await bdrDashboardService.getTalkTrack(leadId);
      if (response.success && dashboardData) {
        setDashboardData(prev => prev ? {
          ...prev,
          talkTrack: response.data,
        } : null);
      }
    } catch (err: any) {
      console.error("Failed to refresh talk track:", err);
      setError("Failed to refresh talk track");
    }
  }, [dashboardData]);

  const executeQuickAction = useCallback(async (
    itemId: string, 
    action: string, 
    params?: Record<string, any>
  ): Promise<boolean> => {
    try {
      const response = await bdrDashboardService.executeQuickAction(itemId, action, params);
      if (response.success) {
        // Refresh dashboard data after successful action
        await refreshDashboard();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Failed to execute quick action:", err);
      setError("Failed to execute action");
      return false;
    }
  }, [refreshDashboard]);

  const updateDailyGoals = useCallback(async (goals: Partial<DailyGoalTracker>): Promise<boolean> => {
    try {
      const response = await bdrDashboardService.updateDailyGoals(goals);
      if (response.success && dashboardData) {
        setDashboardData(prev => prev ? {
          ...prev,
          dailyGoals: response.data,
        } : null);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Failed to update daily goals:", err);
      setError("Failed to update goals");
      return false;
    }
  }, [dashboardData]);

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Extract individual data pieces for easier access
  const dailyGoals = dashboardData?.dailyGoals || null;
  const priorityQueue = dashboardData?.priorityQueue || [];
  const pipelineSnapshot = dashboardData?.pipelineSnapshot || null;
  const executionQuality = dashboardData?.executionQuality || null;
  const talkTrack = dashboardData?.talkTrack || null;
  const messageSuggestions = dashboardData?.messageSuggestions || [];
  const activitySummary = dashboardData?.activitySummary || null;
  const conversionRates = dashboardData?.conversionRates || null;
  const coachingInsights = dashboardData?.coachingInsights || [];
  const atRiskItems = dashboardData?.atRiskItems || [];

  return {
    // Data
    dashboardData,
    dailyGoals,
    priorityQueue,
    pipelineSnapshot,
    executionQuality,
    talkTrack,
    messageSuggestions,
    activitySummary,
    conversionRates,
    coachingInsights,
    atRiskItems,

    // Loading states
    isLoading,
    isRefreshing,

    // Actions
    refreshDashboard,
    refreshTalkTrack,
    executeQuickAction,
    updateDailyGoals,

    // Error handling
    error,
  };
};