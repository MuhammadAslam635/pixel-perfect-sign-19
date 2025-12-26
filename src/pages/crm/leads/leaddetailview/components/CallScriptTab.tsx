import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/services/leads.service";
import {
  connectionMessagesService,
  GeneratePhoneScriptResponse,
} from "@/services/connectionMessages.service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  RefreshCcw,
  Edit,
  Sparkles,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CallScriptTabProps = {
  lead?: Lead;
};

const CallScriptTab: FC<CallScriptTabProps> = ({ lead }) => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [callObjective, setCallObjective] = useState<string>("initial_outreach");
  const [scriptLength, setScriptLength] = useState<string>("medium");

  // Fetch existing call script
  const {
    data: scriptResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<GeneratePhoneScriptResponse>({
    queryKey: ["call-script", lead?._id],
    queryFn: async () => {
      if (!lead?._id || !lead?.companyId) {
        throw new Error("Lead ID and Company ID are required");
      }
      return connectionMessagesService.generatePhoneScript({
        companyId: lead.companyId,
        personId: lead._id,
        callObjective,
        scriptLength,
        regenerate: false,
      });
    },
    enabled: Boolean(lead?._id && lead?.companyId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Regenerate script mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!lead?._id || !lead?.companyId) {
        throw new Error("Lead ID and Company ID are required");
      }
      return connectionMessagesService.generatePhoneScript({
        companyId: lead.companyId,
        personId: lead._id,
        callObjective,
        scriptLength,
        regenerate: true,
      });
    },
    onSuccess: (response) => {
      toast.success(response.message || "Call script regenerated successfully");
      queryClient.setQueryData(["call-script", lead?._id], response);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to regenerate call script"
      );
    },
  });

  // Edit script mutation
  const editMutation = useMutation({
    mutationFn: async (instructions: string) => {
      if (!scriptResponse?.data?.messageId) {
        throw new Error("Message ID not available");
      }
      return connectionMessagesService.updateConnectionMessage({
        messageId: scriptResponse.data.messageId,
        instructions,
        messageType: "phone",
      });
    },
    onSuccess: (response) => {
      toast.success("Call script updated successfully");
      setEditMode(false);
      setEditInstructions("");
      // Update the query cache with the new content
      if (scriptResponse && lead?._id) {
        const updatedResponse = {
          ...scriptResponse,
          data: {
            ...scriptResponse.data,
            script: response.data.content,
          },
        };
        queryClient.setQueryData(["call-script", lead._id], updatedResponse);
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update call script"
      );
    },
  });

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  const handleEdit = () => {
    if (!editInstructions.trim()) {
      toast.error("Please provide edit instructions");
      return;
    }
    editMutation.mutate(editInstructions);
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditInstructions("");
    }
  };

  const script = scriptResponse?.data?.script;
  const metadata = scriptResponse?.data?.metadata;
  const messageId = scriptResponse?.data?.messageId;
  const isExisting = scriptResponse?.data?.isExisting;
  const isBusy =
    isLoading || isFetching || regenerateMutation.isPending || editMutation.isPending;

  if (!lead) {
    return (
      <div className="text-xs text-white/60 p-4">
        Select a lead to view call script.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            Call Script for {lead.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isBusy}
            className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Script Options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-white/60">Call Objective</label>
            <Select
              value={callObjective}
              onValueChange={setCallObjective}
              disabled={isBusy}
            >
              <SelectTrigger className="bg-white/5 text-white border-white/10 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0b0f20] text-white border-white/10">
                <SelectItem value="initial_outreach">Initial Outreach</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="discovery">Discovery Call</SelectItem>
                <SelectItem value="demo">Demo/Presentation</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/60">Script Length</label>
            <Select
              value={scriptLength}
              onValueChange={setScriptLength}
              disabled={isBusy}
            >
              <SelectTrigger className="bg-white/5 text-white border-white/10 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0b0f20] text-white border-white/10">
                <SelectItem value="short">Short (2-3 min)</SelectItem>
                <SelectItem value="medium">Medium (5-7 min)</SelectItem>
                <SelectItem value="long">Long (10-15 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Call Script Card */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Metadata */}
        {/* {metadata && (
          <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {metadata.prospectName && (
                <div>
                  <span className="text-white/50">Prospect:</span>{" "}
                  <span className="text-white">{metadata.prospectName}</span>
                </div>
              )}
              {metadata.companyName && (
                <div>
                  <span className="text-white/50">Company:</span>{" "}
                  <span className="text-white">{metadata.companyName}</span>
                </div>
              )}
              {metadata.callObjective && (
                <div>
                  <span className="text-white/50">Objective:</span>{" "}
                  <span className="text-white">
                    {metadata.callObjective.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {metadata.estimatedDuration && (
                <div>
                  <span className="text-white/50">Duration:</span>{" "}
                  <span className="text-white">{metadata.estimatedDuration}</span>
                </div>
              )}
            </div>
          </div>
        )} */}

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* {messageId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                disabled={isBusy}
                className="text-xs text-white/80 hover:bg-white/10 rounded-lg px-3 h-8 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Edit className="h-3.5 w-3.5" />
                {editMode ? "Cancel Edit" : "Edit with AI"}
              </Button>
            )} */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={isBusy}
              className="text-xs text-white/80 hover:bg-white/10 rounded-lg px-3 h-8 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              {regenerateMutation.isPending ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
          {isExisting === false && (
            <span className="text-xs text-primary">New</span>
          )}
        </div>

        {/* Edit Instructions */}
        {editMode && (
          <div className="mb-4 p-3 bg-[#1e2829]/50 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/80 font-medium">
                Edit Instructions
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={editMutation.isPending || !editInstructions.trim()}
                className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-lg px-3 h-7 flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                {editMutation.isPending ? "Updating..." : "Apply"}
              </Button>
            </div>
            <Textarea
              value={editInstructions}
              onChange={(e) => setEditInstructions(e.target.value)}
              placeholder="Describe how you want to modify the script (e.g., 'Make it more concise', 'Add a question about their recent project', 'Focus more on value proposition')"
              className="scrollbar-hide min-h-[60px] w-full bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-xs"
              disabled={editMutation.isPending}
            />
          </div>
        )}

        {/* Script Content */}
        <div className="relative max-h-96 overflow-y-auto scrollbar-hide rounded-lg border border-white/5 bg-[#253032]/40 p-4 text-xs sm:text-sm text-white/80 leading-relaxed">
          {error ? (
            <div className="flex items-start gap-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                {(error as any)?.response?.data?.message ||
                  (error as any)?.message ||
                  "Failed to load call script"}
              </span>
            </div>
          ) : script?.trim() ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-base font-semibold text-primary mt-4 mb-2 first:mt-0"
                      {...props}
                    />
                  ),
                  h4: ({ node, ...props }) => (
                    <h4
                      className="text-sm font-semibold text-white/90 mt-3 mb-1.5"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="text-white/80 mb-2 leading-relaxed whitespace-pre-line"
                      {...props}
                    />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="text-white font-semibold" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc list-inside ml-2 mb-2 space-y-1"
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-white/80" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-white/20 my-3" {...props} />
                  ),
                }}
              >
                {script
                  .replace(/\s*(Speaker|Listener):\s*/g, "\n\n**$1:** ")
                  .trim()}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-white/60 text-center py-8">
              No call script available yet. Click "Regenerate" to create one.
            </p>
          )}
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1b2627]/80 backdrop-blur-sm text-xs sm:text-sm text-white/70">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {regenerateMutation.isPending
                ? "Generating call script..."
                : editMutation.isPending
                ? "Updating call script..."
                : "Loading call script..."}
            </div>
          )}
        </div>

        {/* Phone number info */}
        {/* {lead.phone && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-white/60">Phone Number</p>
                <p className="text-sm font-medium text-white">{lead.phone}</p>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default CallScriptTab;




