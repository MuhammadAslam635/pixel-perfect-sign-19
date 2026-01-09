import React from "react";
import { PieChart, Users, Calendar, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonalPipelineSnapshot } from "@/types/bdr-dashboard.types";

interface PersonalPipelineCardProps {
  pipeline: PersonalPipelineSnapshot;
}

const PersonalPipelineCard: React.FC<PersonalPipelineCardProps> = ({ pipeline }) => {
  const { activeOpportunities, meetingsBooked } = pipeline;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const showUpRate = meetingsBooked.showUps + meetingsBooked.noShows > 0 
    ? (meetingsBooked.showUps / (meetingsBooked.showUps + meetingsBooked.noShows)) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Active Opportunities */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            My Active Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {activeOpportunities.count}
              </div>
              <div className="text-sm text-gray-400">Total Opportunities</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-cyan-400">
                {formatCurrency(activeOpportunities.totalValue)}
              </div>
              <Badge className={getRiskColor(activeOpportunities.riskIndicator)}>
                <AlertCircle className="w-3 h-3 mr-1" />
                {activeOpportunities.riskIndicator.toUpperCase()} Risk
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">
                {activeOpportunities.byStage.new}
              </div>
              <div className="text-xs text-gray-400">New</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">
                {activeOpportunities.byStage.contacted}
              </div>
              <div className="text-xs text-gray-400">Contacted</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">
                {activeOpportunities.byStage.qualified}
              </div>
              <div className="text-xs text-gray-400">Qualified</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-lg font-semibold text-white">
                {activeOpportunities.byStage.meetingSet}
              </div>
              <div className="text-xs text-gray-400">Meeting Set</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings Booked */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Meetings Booked
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-white">
                {meetingsBooked.today}
              </div>
              <div className="text-sm text-gray-400">Today</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">
                {meetingsBooked.thisWeek}
              </div>
              <div className="text-sm text-gray-400">This Week</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm font-medium text-green-400">
                  {meetingsBooked.showUps} Show-ups
                </div>
                <div className="text-sm font-medium text-red-400">
                  {meetingsBooked.noShows} No-shows
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-white">
                {showUpRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">Show-up Rate</div>
            </div>
          </div>

          {meetingsBooked.upcomingNext48h.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-2">
                Next 48 Hours ({meetingsBooked.upcomingNext48h.length})
              </h4>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {meetingsBooked.upcomingNext48h.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="flex items-center justify-between text-sm p-2 bg-gray-800/30 rounded"
                  >
                    <span className="text-white">{meeting.leadName}</span>
                    <span className="text-gray-400">
                      {formatTime(meeting.scheduledTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalPipelineCard;