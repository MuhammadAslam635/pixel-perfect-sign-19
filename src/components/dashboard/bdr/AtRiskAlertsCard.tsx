import React from "react";
import { AlertTriangle, Clock, Phone, Mail, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AtRiskItem } from "@/types/bdr-dashboard.types";

interface AtRiskAlertsCardProps {
  items: AtRiskItem[];
  onQuickAction: (itemId: string, action: string, params?: Record<string, any>) => void;
}

const AtRiskAlertsCard: React.FC<AtRiskAlertsCardProps> = ({
  items,
  onQuickAction,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sla_breach":
        return <Clock className="w-4 h-4" />;
      case "overdue_followup":
        return <Mail className="w-4 h-4" />;
      case "missing_prep":
        return <FileText className="w-4 h-4" />;
      case "stalled_deal":
        return <Phone className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sla_breach":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "overdue_followup":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "missing_prep":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "stalled_deal":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-600/20 text-red-300 border-red-600/30";
      case "high":
        return "bg-orange-600/20 text-orange-300 border-orange-600/30";
      case "medium":
        return "bg-yellow-600/20 text-yellow-300 border-yellow-600/30";
      default:
        return "bg-gray-600/20 text-gray-300 border-gray-600/30";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sla_breach":
        return "SLA Breach";
      case "overdue_followup":
        return "Overdue Follow-up";
      case "missing_prep":
        return "Missing Prep";
      case "stalled_deal":
        return "Stalled Deal";
      default:
        return "Alert";
    }
  };

  const formatDaysSince = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  // Sort items by priority (urgent first)
  const sortedItems = [...items].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] - 
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          At-Risk Items
          {items.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-2">
              {items.length}
            </Badge>
          )}
        </CardTitle>
        <p className="text-gray-400 text-sm">
          Items requiring immediate attention to prevent revenue leakage
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No at-risk items</p>
            <p className="text-sm">Your pipeline is looking healthy! 🎉</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-gray-600/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(item.type)}>
                    {getTypeIcon(item.type)}
                    <span className="ml-1">{getTypeLabel(item.type)}</span>
                  </Badge>
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDaysSince(item.daysSince)}
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-white font-medium">{item.leadName}</h4>
                <p className="text-gray-400 text-sm">{item.companyName}</p>
              </div>

              <p className="text-gray-300 text-sm mb-3">{item.reason}</p>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Recommended: {item.quickAction.label}
                </div>
                <Button
                  size="sm"
                  onClick={() => onQuickAction(item.id, item.quickAction.action, item.quickAction.params)}
                  className={
                    item.priority === "urgent"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : item.priority === "high"
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "bg-cyan-600 hover:bg-cyan-700 text-white"
                  }
                >
                  {item.quickAction.label}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AtRiskAlertsCard;