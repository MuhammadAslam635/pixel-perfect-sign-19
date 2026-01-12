import React from "react";
import { Phone, PhoneOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CallStatus } from "@/hooks/useTwilioCalling";

interface ActiveCallCardProps {
  callStatus: CallStatus;
  callStatusMessage: string;
  isCalling: boolean;
  onEndCall: () => void;
}

const getStatusColor = (status: CallStatus): string => {
  switch (status) {
    case "connecting":
      return "bg-yellow-600";
    case "in-call":
      return "bg-green-600";
    case "ended":
      return "bg-gray-600";
    case "error":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
};

const getStatusText = (status: CallStatus): string => {
  switch (status) {
    case "connecting":
      return "Connecting...";
    case "in-call":
      return "Call In Progress";
    case "ended":
      return "Call Ended";
    case "error":
      return "Call Failed";
    default:
      return "Idle";
  }
};

const ActiveCallCard: React.FC<ActiveCallCardProps> = ({
  callStatus,
  callStatusMessage,
  isCalling,
  onEndCall,
}) => {
  if (!isCalling && callStatus === "idle") {
    return null; // Don't show card when not in a call
  }

  return (
    <Card className="bg-gray-900/50 border-2 border-cyan-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center gap-2">
          <Phone className="w-5 h-5 text-cyan-400 animate-pulse" />
          Active Call
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Call Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor(callStatus)} ${
                callStatus === "connecting" || callStatus === "in-call"
                  ? "animate-pulse"
                  : ""
              }`}
            />
            <div>
              <div className="text-sm font-medium text-white">
                {getStatusText(callStatus)}
              </div>
              <div className="text-xs text-gray-400">{callStatusMessage}</div>
            </div>
          </div>

          {isCalling && (
            <Button
              onClick={onEndCall}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              End Call
            </Button>
          )}
        </div>

        {/* Call Timer (if in call) */}
        {callStatus === "in-call" && (
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-center">
              <Badge
                variant="outline"
                className="text-green-400 border-green-400"
              >
                <Phone className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <p className="text-xs text-gray-400 mt-2">
                Follow the talk track below while on the call
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {callStatus === "error" && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-400">{callStatusMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveCallCard;
