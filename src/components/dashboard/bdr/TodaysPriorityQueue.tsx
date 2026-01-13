import React from "react";
import { Clock, Phone, Mail, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriorityLead } from "@/types/bdr-dashboard.types";

interface TodaysPriorityQueueProps {
  leads: PriorityLead[];
  onActionClick: (leadId: string, action: string) => void;
}

const TodaysPriorityQueue: React.FC<TodaysPriorityQueueProps> = ({
  leads,
  onActionClick,
}) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "call":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "email":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "meeting":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatLastInteraction = (lastInteraction: string | null) => {
    if (!lastInteraction) return "No previous contact";
    const date = new Date(lastInteraction);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
          Today's Priority Queue
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Ranked by urgency, conversion likelihood, and SLA risk
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {leads.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No priority leads for today</p>
            <p className="text-sm">Great job staying on top of your pipeline!</p>
          </div>
        ) : (
          leads.map((lead, index) => (
            <div
              key={lead.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-semibold text-sm">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-white font-medium">{lead.name}</h4>
                    <p className="text-gray-400 text-sm">{lead.companyName}</p>
                  </div>
                </div>
                {lead.slaRisk && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    SLA Risk
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-400">
                  Last contact: {formatLastInteraction(lead.lastInteraction)}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    Urgency: {lead.urgencyScore}/10
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Likelihood: {lead.conversionLikelihood}%
                  </Badge>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-3">{lead.priorityReason}</p>

              <div className="flex items-center justify-between">
                <Badge className={getActionColor(lead.recommendedAction)}>
                  {getActionIcon(lead.recommendedAction)}
                  <span className="ml-1 capitalize">{lead.recommendedAction}</span>
                </Badge>
                <Button
                  size="sm"
                  onClick={() => onActionClick(lead.id, lead.recommendedAction)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Take Action
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysPriorityQueue;