import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { format, parse } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchInput } from "../../shared/components";
import ActiveFollowUpPlans from "./ActiveFollowUpPlans";
import TemplateFormModal from "./TemplateFormModal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  useFollowupTemplates,
  useDeleteFollowupTemplate,
  useDuplicateFollowupTemplate,
} from "@/hooks/useFollowupTemplates";
import { FollowupTemplate } from "@/services/followupTemplates.service";
import { useToast } from "@/hooks/use-toast";
import { isAxiosError } from "axios";
import { useCreateFollowupPlan } from "@/hooks/useFollowupPlans";
import { useLeadsData } from "@/pages/crm/shared/hooks";
import { Lead } from "@/services/leads.service";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

interface FollowUpTemplatesProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface FollowUpTemplatesRef {
  createTemplate: () => void;
}

const FollowUpTemplates = forwardRef<
  FollowUpTemplatesRef,
  FollowUpTemplatesProps
>(({ searchQuery = "", onSearchChange }, ref) => {
  const [activeTab, setActiveTab] = useState<"templates" | "plans">("plans");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTemplate, setSelectedTemplate] =
    useState<FollowupTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<FollowupTemplate | null>(null);
  const [templateToRun, setTemplateToRun] = useState<FollowupTemplate | null>(
    null
  );
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [selectedLeadsMap, setSelectedLeadsMap] = useState<
    Record<string, Lead>
  >({});

  const { toast } = useToast();
  const { mutate: deleteTemplate, isPending: isDeleting } =
    useDeleteFollowupTemplate();
  const { mutate: duplicateTemplate, isPending: isDuplicating } =
    useDuplicateFollowupTemplate();
  const { mutate: createFollowupPlan, isPending: isCreatingPlan } =
    useCreateFollowupPlan();

  // Fetch followup templates from API
  const {
    data: templatesData,
    isLoading,
    isError,
  } = useFollowupTemplates({
    search: searchQuery,
    limit: 100,
  });

  // Extract templates from response
  const templates = useMemo(() => {
    const templatesResponse = templatesData as
      | { data?: { docs?: FollowupTemplate[] } }
      | undefined;
    return templatesResponse?.data?.docs || [];
  }, [templatesData]);

  const handleEdit = (template: FollowupTemplate) => {
    setSelectedTemplate(template);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setFormMode("create");
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  useImperativeHandle(
    ref,
    () => ({
      createTemplate: handleCreate,
    }),
    []
  );

  const handleDuplicate = (template: FollowupTemplate) => {
    duplicateTemplate(template._id, {
      onSuccess: (response) => {
        toast({
          title: "Template duplicated",
          description:
            response.message || `${template.title} has been duplicated.`,
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to duplicate template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = () => {
    if (!templateToDelete) return;

    deleteTemplate(templateToDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Template deleted",
          description:
            response.message || `${templateToDelete.title} was deleted.`,
        });
        setTemplateToDelete(null);
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to delete template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  // Lead selection for running template
  const leadsQueryParams = useMemo(
    () => ({
      limit: 100,
      search: leadsSearch || undefined,
    }),
    [leadsSearch]
  );
  const { query: leadsQuery, leads: fetchedLeads } = useLeadsData(
    leadsQueryParams,
    { enabled: leadSelectorOpen }
  );
  const isLeadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;
  const leadsError = leadsQuery.error as Error | null;

  const selectedLeadIds = useMemo(
    () => Object.keys(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const selectedLeads = useMemo(
    () => Object.values(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const handleToggleLeadSelection = (leadItem: Lead) => {
    const leadId = leadItem?._id;
    if (!leadId) {
      return;
    }
    setSelectedLeadsMap((prev) => {
      const next = { ...prev };
      if (next[leadId]) {
        delete next[leadId];
      } else {
        next[leadId] = leadItem;
      }
      return next;
    });
  };

  const handleRunTemplate = (template: FollowupTemplate) => {
    setTemplateToRun(template);
    setSelectedLeadsMap({});
    setLeadsSearch("");
    setLeadSelectorOpen(true);
  };

  const handleConfirmRunTemplate = () => {
    if (!templateToRun) return;

    if (!selectedLeadIds.length) {
      toast({
        title: "Select at least one lead",
        description: "Pick one or more leads to include in the followup plan.",
        variant: "destructive",
      });
      return;
    }

    createFollowupPlan(
      {
        templateId: templateToRun._id,
        personIds: selectedLeadIds,
      },
      {
        onSuccess: (response) => {
          toast({
            title: "Followup plan started",
            description:
              response.message ||
              `Followup plan "${templateToRun.title}" has been created successfully.`,
          });
          setTemplateToRun(null);
          setSelectedLeadsMap({});
          setLeadSelectorOpen(false);
          setLeadsSearch("");
          // Switch to plans tab to show the new plan
          setActiveTab("plans");
        },
        onError: (error: unknown) => {
          const errorMessage = isAxiosError<{ message?: string }>(error)
            ? error.response?.data?.message ?? error.message
            : error instanceof Error
            ? error.message
            : "Please try again.";
          toast({
            title: "Failed to start followup plan",
            description: errorMessage,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCancelRunTemplate = () => {
    setTemplateToRun(null);
    setSelectedLeadsMap({});
    setLeadSelectorOpen(false);
    setLeadsSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}

      {/* Active Followup Plan Section with Tabs and Search */}
      <div>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 rounded-lg p-0.5">
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("plans")}
                  className={`px-3 py-1 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "plans"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Active Followup Plans
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "plans" ? "text-white/70" : "text-[#FFFFFF4D]"
                  }`}
                >
                  View and manage your active followup campaigns
                </p>
              </div>
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`px-3 py-1.5 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "templates"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Follow-up Templates
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "templates"
                      ? "text-white/70"
                      : "text-[#FFFFFF4D]"
                  }`}
                >
                  Centralize touchpoints for every prospect across emails,
                  calls, and whatsapp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border with Active Tab Indicator */}
        <div className="relative border-b border-white/20 mb-4">
          <div
            className={`absolute bottom-0 h-[2px] bg-white transition-all duration-300 ${
              activeTab === "plans"
                ? "left-0 w-[280px]"
                : "left-[300px] w-[260px]"
            }`}
          />
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === "templates" ? (
          /* Campaign Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {isLoading ? (
              <div className="col-span-full text-center text-white/60 py-10">
                Loading templates...
              </div>
            ) : isError ? (
              <div className="col-span-full text-center text-red-400 py-10">
                Error loading templates. Please try again.
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full text-center text-white/60 py-10">
                No templates found. Create your first template to get started.
              </div>
            ) : (
              templates.map((template) => {
                // Format updated date
                const updatedDate = new Date(template.updatedAt);
                const now = new Date();
                const diffTime = Math.abs(
                  now.getTime() - updatedDate.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const updatedAt =
                  diffDays <= 1 ? "today" : `${diffDays} days ago`;

                return (
                  <Card
                    key={template._id}
                    className="relative border-0 hover:bg-[#2F2F2F] transition-all duration-300 rounded-2xl overflow-hidden"
                    style={{
                      background: "#2A2A2A",
                    }}
                  >
                    {/* Gradient overlay from top to bottom */}
                    <div
                      className="absolute top-0 left-0 right-0 pointer-events-none rounded-sm"
                      style={{
                        height: "calc(100% - 120px)",
                        background:
                          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.16) 4.82%, rgba(255, 255, 255, 4e-05) 38.08%, rgba(255, 255, 255, 4e-05) 56.68%, rgba(255, 255, 255, 0.04) 95.1%)",
                        zIndex: 1,
                      }}
                    ></div>
                    <CardContent className="relative p-4 space-y-2 z-10">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4
                            className="mb-1"
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 500,
                              fontStyle: "Medium",
                              fontSize: "14px",
                            }}
                          >
                            {template.title}
                          </h4>
                          <p className="text-white/40 text-xs">
                            Update {updatedAt}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-white/80 hover:text-white/100 transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#1a1a1a] border-white/10 text-white"
                          >
                            <DropdownMenuItem
                              onClick={() => handleEdit(template)}
                              className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(template)}
                              className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTemplateToDelete(template)}
                              className="cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="border-b border-white/30"></div>
                      {/* Stats Grid - Horizontal Layout */}
                      <div className="flex items-start gap-3 flex-wrap">
                        {/* Run Time */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            Run Time: {template.numberOfDaysToRun} days
                          </span>
                        </div>

                        {/* Calendar */}
                        {/* <div className="flex items-center gap-2 text-sm ml-auto">
                          <Calendar
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.startDate && (
                              <span className="mr-2 opacity-75">
                                {format(new Date(template.startDate), "dd - MMM - yyyy")}
                              </span>
                            )}
                            {(() => {
                              try {
                                return format(
                                  parse(template.timeOfDayToRun, "HH:mm", new Date()),
                                  "hh:mm a"
                                );
                              } catch (e) {
                                return template.timeOfDayToRun;
                              }
                            })()}
                          </span>
                        </div> */}
                      </div>

                      {/* Communication Channels Row */}
                      <div className="flex items-center justify-between gap-6">
                        {/* Emails */}
                        <div className="flex items-center gap-2 text-sm">
                          <Mail
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfEmails
                              .toString()
                              .padStart(2, "0")}{" "}
                            Emails
                          </span>
                        </div>

                        {/* Messages */}
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfWhatsappMessages
                              .toString()
                              .padStart(2, "0")}{" "}
                            Message
                          </span>
                        </div>

                        {/* Calls */}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfCalls.toString().padStart(2, "0")}{" "}
                            Calls
                          </span>
                        </div>
                      </div>

                      {/* Footer: Day Time and Run Button */}
                      {/* <div className="flex items-center justify-between pt-2"> */}
                        {/* <span
                          style={{
                            fontFamily: "Inter",
                            fontWeight: 400,
                            fontStyle: "Regular",
                            fontSize: "10px",
                            textAlign: "center",
                            color: "#FFFFFF80",
                          }}
                        >
                          Day time:{" "}
                          {template.startDate
                            ? `${format(new Date(template.startDate), "dd - MMM - yyyy")} at `
                            : ""}
                          {(() => {
                            try {
                              return format(
                                parse(template.timeOfDayToRun, "HH:mm", new Date()),
                                "hh:mm a"
                              );
                            } catch (e) {
                              return template.timeOfDayToRun;
                            }
                          })()}
                        </span> */}
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunTemplate(template);
                          }}
                          disabled={isCreatingPlan}
                          className="relative h-8 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all overflow-hidden disabled:opacity-50"
                          style={{
                            background: "#FFFFFF1A",
                            boxShadow:
                              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                          }}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 right-0 pointer-events-none rounded-full"
                            style={{
                              background:
                                "linear-gradient(to right, #66AFB7 0%, transparent 60%)",
                              zIndex: 0,
                            }}
                          ></div>
                          <span
                            className="relative z-10"
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "10px",
                              color: "#FFFFFF",
                            }}
                          >
                            {isCreatingPlan ? "Creating..." : "Run Templates"}
                          </span>
                        </Button> */}
                      {/* </div> */}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <ActiveFollowUpPlans />
        )}
      </div>

      {/* Template Form Modal */}
      <TemplateFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        template={selectedTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!templateToDelete}
        title="Delete Template"
        description={`Are you sure you want to delete "${templateToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setTemplateToDelete(null)}
        confirmVariant="destructive"
        isPending={isDeleting}
      />

      {/* Run Template Dialog - Lead Selection */}
      <Dialog open={leadSelectorOpen} onOpenChange={setLeadSelectorOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
          style={{
            background: "#0a0a0a",
          }}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          />

          <div className="relative z-10 flex flex-col h-full min-h-0">
            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
              <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">
                Run Template: {templateToRun?.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-white/70">
                Select leads to create a personalized followup plan using this
                template.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white">Select Leads</h3>
                <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                  <Command className="bg-transparent [&_[cmdk-input-wrapper]]:border-b [&_[cmdk-input-wrapper]]:border-white/10 [&_[cmdk-input-wrapper]]:px-3">
                    <CommandInput
                      placeholder="Search leads..."
                      value={leadsSearch}
                      onValueChange={setLeadsSearch}
                      className="text-white placeholder:text-white/40 h-11 border-0 focus:ring-0 bg-transparent py-3 [&_svg]:text-white/50"
                    />
                    <CommandList className="max-h-48 overflow-y-auto scrollbar-hide">
                      {isLeadsLoading ? (
                        <div className="flex items-center justify-center py-6 text-xs text-white/60">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading leads...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty className="py-6 text-center text-xs text-white/60">
                            No leads found.
                          </CommandEmpty>
                          <CommandGroup className="p-1 overflow-y-auto scrollbar-hide space-y-2">
                            {fetchedLeads.map((leadItem) => {
                              const leadId = leadItem?._id;
                              if (!leadId) {
                                return null;
                              }
                              const isSelected = Boolean(
                                selectedLeadsMap[leadId]
                              );
                              return (
                                <CommandItem
                                  key={leadId}
                                  className={`flex items-center gap-3 cursor-pointer px-2 py-2 transition-colors hover:bg-white/10 focus:bg-white/10 data-[selected='true']:bg-transparent data-[selected='true']:hover:bg-white/10 ${
                                    isSelected
                                      ? "bg-white/10 text-white"
                                      : "text-white bg-transparent"
                                  }`}
                                  onSelect={() =>
                                    handleToggleLeadSelection(leadItem)
                                  }
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      handleToggleLeadSelection(leadItem)
                                    }
                                    className="h-4 w-4 border-2 border-white/40 data-[state=checked]:bg-white data-[state=checked]:border-white data-[state=checked]:text-[#0a0a0a]"
                                  />
                                  <div className="flex flex-col flex-1 min-w-0 ">
                                    <span className="text-xs font-medium text-white mb-1">
                                      {leadItem.name || "Unnamed lead"}
                                    </span>
                                    <span className="text-[10px] text-white/60">
                                      {leadItem.companyName ||
                                        leadItem.position ||
                                        "Unknown organization"}
                                    </span>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                          {leadsError && (
                            <div className="px-4 py-3 text-xs text-red-300">
                              {leadsError.message}
                            </div>
                          )}
                        </>
                      )}
                    </CommandList>
                  </Command>
                </div>

                {selectedLeads.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedLeads.map((leadItem) => {
                      const leadId = leadItem?._id;
                      if (!leadId) {
                        return null;
                      }
                      return (
                        <Badge
                          key={leadId}
                          variant="secondary"
                          className="bg-white/10 text-white border border-white/20 text-xs flex items-center gap-1 w-full justify-between hover:bg-white/20"
                        >
                          <span className="text-[10px] font-medium">
                            {leadItem.name || "Lead"} ·{" "}
                            {leadItem.companyName ||
                              leadItem.position ||
                              "Unknown"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleLeadSelection(leadItem)}
                            className="ml-1 text-blue-400 hover:text-blue-300 transition-colors"
                            aria-label="Remove lead"
                          >
                            x
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelRunTemplate}
                disabled={isCreatingPlan}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRunTemplate}
                disabled={isCreatingPlan || selectedLeadIds.length === 0}
                className="bg-primary hover:bg-primary/90 text-white transition-all text-xs disabled:opacity-50"
              >Day time: 09:00 AM
                {isCreatingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Followup Plan"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

FollowUpTemplates.displayName = "FollowUpTemplates";

export default FollowUpTemplates;
