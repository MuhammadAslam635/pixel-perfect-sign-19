import React, { useState } from "react";
import { Target, TrendingUp, Calendar, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DailyGoalTracker as DailyGoalTrackerType } from "@/types/bdr-dashboard.types";
import GoalSettingsModal from "./GoalSettingsModal";

interface DailyGoalTrackerProps {
  goals: DailyGoalTrackerType;
  onGoalsUpdated?: (newGoals: DailyGoalTrackerType) => void;
}

const DailyGoalTracker: React.FC<DailyGoalTrackerProps> = ({
  goals,
  onGoalsUpdated,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-yellow-500";
    if (progress >= 50) return "bg-orange-500";
    return "bg-red-500";
  };

  const goalItems = [
    {
      label: "Conversations Started",
      current: goals.conversationsStarted.current,
      dailyTarget: goals.conversationsStarted.dailyTarget,
      weeklyTarget: goals.conversationsStarted.weeklyTarget,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: "Meetings Booked",
      current: goals.meetingsBooked.current,
      dailyTarget: goals.meetingsBooked.dailyTarget,
      weeklyTarget: goals.meetingsBooked.weeklyTarget,
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: "Qualified Opportunities",
      current: goals.qualifiedOpportunities.current,
      dailyTarget: goals.qualifiedOpportunities.dailyTarget,
      weeklyTarget: goals.qualifiedOpportunities.weeklyTarget,
      icon: <Target className="w-5 h-5" />,
    },
  ];

  const handleGoalsUpdated = (newGoals: DailyGoalTrackerType) => {
    if (onGoalsUpdated) {
      onGoalsUpdated(newGoals);
    }
  };

  return (
    <>
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Daily Goal Tracker
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Track your progress against daily and weekly targets
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              title="Configure Goals"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {goalItems.map((item, index) => {
            const dailyProgress = calculateProgress(
              item.current,
              item.dailyTarget
            );
            const weeklyProgress = calculateProgress(
              item.current,
              item.weeklyTarget
            );

            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-cyan-400">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">
                      {item.current} / {item.dailyTarget}
                    </div>
                    <div className="text-xs text-gray-400">
                      Weekly: {item.weeklyTarget}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Daily Progress</span>
                    <span className="text-white">
                      {dailyProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={dailyProgress} className="h-2 bg-gray-700" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Weekly Progress</span>
                    <span className="text-white">
                      {weeklyProgress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={weeklyProgress}
                    className="h-1 bg-gray-700"
                  />
                </div>

                {dailyProgress >= 100 && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <Target className="w-3 h-3" />
                    <span>Daily goal achieved! 🎉</span>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <GoalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentGoals={goals}
        onGoalsUpdated={handleGoalsUpdated}
      />
    </>
  );
};

export default DailyGoalTracker;
