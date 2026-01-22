import React, { useState } from "react";
import { MessageCircle, Lightbulb, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TalkTrackSuggestion } from "@/types/bdr-dashboard.types";
import { toast } from "sonner";

interface TalkTrackAssistantProps {
  talkTrack?: TalkTrackSuggestion;
  onRefresh: () => void;
  isLoading?: boolean;
}

const TalkTrackAssistant: React.FC<TalkTrackAssistantProps> = ({
  talkTrack,
  onRefresh,
  isLoading = false,
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemType);
      toast.success(`${itemType} copied to clipboard`);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (!talkTrack) {
    return (
      <Card className="border-white/10 h-full bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" stroke="url(#dashboard-icon-gradient)"/>
            Talk Track Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-4">
            Select a lead from your priority queue to get contextual talk tracks
          </p>
          <Button
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh Suggestions
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-cyan-400" />
          Talk Track Assistant
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-gray-400">For:</span>
          <span className="text-white font-medium">{talkTrack.leadName}</span>
          <span className="text-gray-400">at</span>
          <span className="text-cyan-400">{talkTrack.companyName}</span>
          <Badge variant="outline" className="ml-2">
            {talkTrack.context.dealStage}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Opening Line */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Opening Line</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(talkTrack.openingLine, "Opening line")}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
              {copiedItem === "Opening line" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300">
            "{talkTrack.openingLine}"
          </div>
        </div>

        {/* Discovery Questions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Discovery Questions</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(talkTrack.discoveryQuestions.join('\n'), "Discovery questions")}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
              {copiedItem === "Discovery questions" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="space-y-2">
            {talkTrack.discoveryQuestions.map((question, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-3 text-sm text-gray-300">
                {index + 1}. {question}
              </div>
            ))}
          </div>
        </div>

        {/* Objection Handling */}
        {talkTrack.likelyObjections.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-white">Likely Objections & Responses</h4>
            <div className="space-y-3">
              {talkTrack.likelyObjections.map((objection, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="text-sm text-red-300 font-medium">
                    Objection: "{objection.objection}"
                  </div>
                  <div className="text-sm text-green-300">
                    Response: "{objection.suggestedResponse}"
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(objection.suggestedResponse, `Objection response ${index + 1}`)}
                    className="h-6 px-2 ml-auto"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedItem === `Objection response ${index + 1}` ? "Copied!" : "Copy"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Step */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Recommended Next Step</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(talkTrack.recommendedNextStep, "Next step")}
              className="h-6 px-2"
            >
              <Copy className="w-3 h-3" />
              {copiedItem === "Next step" ? "Copied!" : "Copy"}
            </Button>
          </div>
          <div className="bg-cyan-900/30 border border-cyan-700/50 rounded-lg p-3 text-sm text-cyan-300">
            {talkTrack.recommendedNextStep}
          </div>
        </div>

        {/* Context Info */}
        {talkTrack.context.priorInteractions.length > 0 && (
          <div className="pt-2 border-t border-gray-700">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Context</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Profile: {talkTrack.context.leadProfile}</div>
              <div>Prior interactions: {talkTrack.context.priorInteractions.length}</div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TalkTrackAssistant;