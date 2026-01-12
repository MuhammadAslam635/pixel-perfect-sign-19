import React, { useState } from "react";
import { Target, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DailyGoalTracker } from "@/types/bdr-dashboard.types";
import { toast } from "sonner";
import { bdrDashboardService } from "@/services/bdr-dashboard.service";

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoals: DailyGoalTracker;
  onGoalsUpdated: (newGoals: DailyGoalTracker) => void;
}

const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  isOpen,
  onClose,
  currentGoals,
  onGoalsUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState({
    conversationsStarted: {
      daily: currentGoals.conversationsStarted.dailyTarget,
      weekly: currentGoals.conversationsStarted.weeklyTarget,
    },
    meetingsBooked: {
      daily: currentGoals.meetingsBooked.dailyTarget,
      weekly: currentGoals.meetingsBooked.weeklyTarget,
    },
    qualifiedOpportunities: {
      daily: currentGoals.qualifiedOpportunities.dailyTarget,
      weekly: currentGoals.qualifiedOpportunities.weeklyTarget,
    },
  });

  const handleInputChange = (
    category: string,
    period: string,
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setGoals((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [period]: Math.max(0, numValue),
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await bdrDashboardService.updateDailyGoals(goals);

      if (response.success) {
        toast.success("Daily goals updated successfully!");
        onGoalsUpdated(response.data);
        onClose();
      } else {
        toast.error("Failed to update goals");
      }
    } catch (error: any) {
      console.error("Failed to update goals:", error);
      toast.error(error.message || "Failed to update goals");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGoals({
      conversationsStarted: {
        daily: currentGoals.conversationsStarted.dailyTarget,
        weekly: currentGoals.conversationsStarted.weeklyTarget,
      },
      meetingsBooked: {
        daily: currentGoals.meetingsBooked.dailyTarget,
        weekly: currentGoals.meetingsBooked.weeklyTarget,
      },
      qualifiedOpportunities: {
        daily: currentGoals.qualifiedOpportunities.dailyTarget,
        weekly: currentGoals.qualifiedOpportunities.weeklyTarget,
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="w-6 h-6 text-cyan-400" />
            Configure Daily Goals
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Set your personal targets for daily and weekly performance metrics.
            These goals help you stay on track and measure your progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Conversations Started */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <h3 className="text-white font-semibold">
                Conversations Started
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div className="space-y-2">
                <Label htmlFor="conversations-daily" className="text-gray-400">
                  Daily Target
                </Label>
                <Input
                  id="conversations-daily"
                  type="number"
                  min="1"
                  value={goals.conversationsStarted.daily}
                  onChange={(e) =>
                    handleInputChange(
                      "conversationsStarted",
                      "daily",
                      e.target.value
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conversations-weekly" className="text-gray-400">
                  Weekly Target
                </Label>
                <Input
                  id="conversations-weekly"
                  type="number"
                  min="1"
                  value={goals.conversationsStarted.weekly}
                  onChange={(e) =>
                    handleInputChange(
                      "conversationsStarted",
                      "weekly",
                      e.target.value
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Meetings Booked */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <h3 className="text-white font-semibold">Meetings Booked</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div className="space-y-2">
                <Label htmlFor="meetings-daily" className="text-gray-400">
                  Daily Target
                </Label>
                <Input
                  id="meetings-daily"
                  type="number"
                  min="1"
                  value={goals.meetingsBooked.daily}
                  onChange={(e) =>
                    handleInputChange("meetingsBooked", "daily", e.target.value)
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetings-weekly" className="text-gray-400">
                  Weekly Target
                </Label>
                <Input
                  id="meetings-weekly"
                  type="number"
                  min="1"
                  value={goals.meetingsBooked.weekly}
                  onChange={(e) =>
                    handleInputChange(
                      "meetingsBooked",
                      "weekly",
                      e.target.value
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Qualified Opportunities */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <h3 className="text-white font-semibold">
                Qualified Opportunities
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-4">
              <div className="space-y-2">
                <Label htmlFor="opportunities-daily" className="text-gray-400">
                  Daily Target
                </Label>
                <Input
                  id="opportunities-daily"
                  type="number"
                  min="1"
                  value={goals.qualifiedOpportunities.daily}
                  onChange={(e) =>
                    handleInputChange(
                      "qualifiedOpportunities",
                      "daily",
                      e.target.value
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="opportunities-weekly" className="text-gray-400">
                  Weekly Target
                </Label>
                <Input
                  id="opportunities-weekly"
                  type="number"
                  min="1"
                  value={goals.qualifiedOpportunities.weekly}
                  onChange={(e) =>
                    handleInputChange(
                      "qualifiedOpportunities",
                      "weekly",
                      e.target.value
                    )
                  }
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-sm text-cyan-300">
              <strong>Tip:</strong> Set realistic goals that challenge you
              without causing burnout. Your targets should be based on your
              role, experience level, and market conditions.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Goals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalSettingsModal;
