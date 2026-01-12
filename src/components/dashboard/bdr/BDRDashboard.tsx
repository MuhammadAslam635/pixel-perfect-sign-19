import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import { useBDRDashboard } from "@/hooks/useBDRDashboard";
import { toast } from "sonner";

// BDR Components
import TodaysPriorityQueue from "./TodaysPriorityQueue";
import DailyGoalTracker from "./DailyGoalTracker";
import PersonalPipelineCard from "./PersonalPipelineCard";
import ExecutionQualityCard from "./ExecutionQualityCard";
import TalkTrackAssistant from "./TalkTrackAssistant";
import AtRiskAlertsCard from "./AtRiskAlertsCard";

// Existing components for activity and performance
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, MessageSquare, Loader2 } from "lucide-react";

const BDRDashboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const sessionUser = user || getUserData();

  const {
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
    isLoading,
    isRefreshing,
    refreshTalkTrack,
    executeQuickAction,
    error,
  } = useBDRDashboard();

  const handlePriorityAction = async (leadId: string, action: string) => {
    // Refresh talk track for the selected lead
    await refreshTalkTrack(leadId);
    toast.success(`${action} action initiated for lead`);
  };

  const handleQuickAction = async (
    itemId: string,
    action: string,
    params?: Record<string, any>
  ) => {
    const success = await executeQuickAction(itemId, action, params);
    if (success) {
      toast.success("Action completed successfully");
    } else {
      toast.error("Failed to execute action");
    }
  };

  const handleRefreshTalkTrack = async () => {
    if (priorityQueue.length > 0) {
      await refreshTalkTrack(priorityQueue[0].id);
    }
  };

  const handleGoalsUpdated = async (newGoals: DailyGoalTracker) => {
    // Trigger a full dashboard refresh to sync all data
    await refreshDashboard();
    toast.success("Your goals have been updated!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load dashboard</div>
          <div className="text-gray-400 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (
    !dashboardData ||
    !dailyGoals ||
    !pipelineSnapshot ||
    !executionQuality ||
    !activitySummary ||
    !conversionRates
  ) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">No dashboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          Good{" "}
          {new Date().getHours() < 12
            ? "Morning"
            : new Date().getHours() < 17
            ? "Afternoon"
            : "Evening"}
          , {sessionUser?.name || "there"}!
        </h1>
        <p className="text-gray-400">
          Ready to crush your goals today? Let's see what needs your attention.
        </p>
      </div>

      {/* Section 1: Today's Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodaysPriorityQueue
          leads={priorityQueue}
          onActionClick={handlePriorityAction}
        />
        <DailyGoalTracker
          goals={dailyGoals}
          onGoalsUpdated={handleGoalsUpdated}
        />
      </div>

      {/* Section 2: Live Pipeline Snapshot */}
      <PersonalPipelineCard pipeline={pipelineSnapshot} />

      {/* Section 3: Execution Quality & Speed */}
      <ExecutionQualityCard quality={executionQuality} />

      {/* Section 4: Real-Time Assistance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TalkTrackAssistant
          talkTrack={talkTrack}
          onRefresh={handleRefreshTalkTrack}
          isLoading={isRefreshing}
        />

        {/* Message Suggestions Card */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
              Message Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {messageSuggestions.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No message suggestions available</p>
              </div>
            ) : (
              messageSuggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {suggestion.type}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {suggestion.tone}
                    </Badge>
                  </div>
                  {suggestion.subject && (
                    <div className="text-sm text-gray-400 mb-1">
                      Subject: {suggestion.subject}
                    </div>
                  )}
                  <div className="text-sm text-gray-300">
                    {suggestion.draftContent}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Activity & Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Summary */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">Today</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Calls Made</span>
                    <span className="text-white">
                      {activitySummary.today.callsMade}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Emails Sent</span>
                    <span className="text-white">
                      {activitySummary.today.emailsSent}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Conversations</span>
                    <span className="text-white">
                      {activitySummary.today.conversationsHeld}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">This Week</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Calls Made</span>
                    <span className="text-white">
                      {activitySummary.week.callsMade}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Emails Sent</span>
                    <span className="text-white">
                      {activitySummary.week.emailsSent}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Conversations</span>
                    <span className="text-white">
                      {activitySummary.week.conversationsHeld}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Time Allocation */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-white mb-3">
                Time Allocation
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Selling Time</span>
                  <span className="text-white">
                    {activitySummary.timeAllocation.sellingTime}%
                  </span>
                </div>
                <Progress
                  value={activitySummary.timeAllocation.sellingTime}
                  className="h-2 bg-gray-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              My Conversion Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(conversionRates).map(([key, data]) => {
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase());
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {data.rate}%
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          data.trend === "up"
                            ? "text-green-400 border-green-400"
                            : data.trend === "down"
                            ? "text-red-400 border-red-400"
                            : "text-gray-400 border-gray-400"
                        }
                      >
                        {data.trend}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={data.rate} className="h-2 bg-gray-700" />
                  <div className="text-xs text-gray-500">
                    Personal avg: {data.personalAverage}%
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Section 6: Coaching Insights */}
      {coachingInsights.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Coaching Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachingInsights.map((insight, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{insight.title}</h4>
                  <Badge
                    variant="outline"
                    className={
                      insight.priority === "high"
                        ? "text-red-400 border-red-400"
                        : insight.priority === "medium"
                        ? "text-yellow-400 border-yellow-400"
                        : "text-green-400 border-green-400"
                    }
                  >
                    {insight.priority}
                  </Badge>
                </div>
                <p className="text-gray-300 text-sm">{insight.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 7: Alerts & Nudges */}
      <AtRiskAlertsCard items={atRiskItems} onQuickAction={handleQuickAction} />
    </div>
  );
};

export default BDRDashboard;
