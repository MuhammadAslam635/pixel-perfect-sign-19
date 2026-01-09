import React from "react";
import { Clock, CheckCircle, MessageSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExecutionQuality } from "@/types/bdr-dashboard.types";

interface ExecutionQualityCardProps {
  quality: ExecutionQuality;
}

const ExecutionQualityCard: React.FC<ExecutionQualityCardProps> = ({ quality }) => {
  const { speedToLead, followupConsistency, conversationEffectiveness } = quality;

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getSLABadgeColor = (status: string) => {
    return status === "on_track" 
      ? "bg-green-500/20 text-green-400 border-green-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Speed to Lead */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-cyan-400" />
            Speed-to-Lead
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {formatResponseTime(speedToLead.medianResponseTime)}
            </div>
            <div className="text-xs text-gray-400">Median Response Time</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">SLA Compliance</span>
              <span className="text-xs text-white">
                {speedToLead.compliancePercentage}%
              </span>
            </div>
            <Progress 
              value={speedToLead.compliancePercentage} 
              className="h-2 bg-gray-700"
            />
            <Badge className={getSLABadgeColor(speedToLead.slaCompliance)}>
              {speedToLead.slaCompliance === "on_track" ? "On Track" : "At Risk"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Consistency */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            Follow-up Consistency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {followupConsistency.executionRate}%
            </div>
            <div className="text-xs text-gray-400">Execution Rate</div>
          </div>
          
          <Progress 
            value={followupConsistency.executionRate} 
            className="h-2 bg-gray-700"
          />
          
          {followupConsistency.missedFollowups.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{followupConsistency.missedFollowups.length} Missed</span>
              </div>
              <div className="max-h-16 overflow-y-auto space-y-1">
                {followupConsistency.missedFollowups.slice(0, 2).map((missed) => (
                  <div key={missed.id} className="text-xs text-gray-400 truncate">
                    {missed.leadName} - {missed.type}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Effectiveness */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Conversation Quality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getQualityScoreColor(conversationEffectiveness.qualityScore)}`}>
              {conversationEffectiveness.qualityScore}
            </div>
            <div className="text-xs text-gray-400">AI Quality Score</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-green-400 font-semibold">
                {conversationEffectiveness.positiveResponses}
              </div>
              <div className="text-gray-400">Positive</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2 text-center">
              <div className="text-yellow-400 font-semibold">
                {conversationEffectiveness.objectionsEncountered}
              </div>
              <div className="text-gray-400">Objections</div>
            </div>
          </div>
          
          <Progress 
            value={conversationEffectiveness.qualityScore} 
            className="h-2 bg-gray-700"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionQualityCard;