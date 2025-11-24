import { FC, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoveRight, ChevronRight, Check, Info, RefreshCcw, Trash2 } from "lucide-react";
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";
import { useCreateFollowupPlan, useDeleteFollowupPlan, useFollowupPlans } from "@/hooks/useFollowupPlans";
import { useLeadsData } from "@/pages/companies/hooks";
import { Lead } from "@/services/leads.service";
import { FollowupPlan } from "@/services/followupPlans.service";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import ConfirmDialog from "@/components/ui/confirm-dialog";

type ActivityProps = {
  lead?: Lead;
};

const Activity: FC<ActivityProps> = ({ lead }) => {
  const [activeTab, setActiveTab] = useState("summary");
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedLeadsMap, setSelectedLeadsMap] = useState<Record<string, Lead>>({});
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [planPendingDelete, setPlanPendingDelete] = useState<FollowupPlan | null>(null);
  const { toast } = useToast();

  // Dates with meetings - Nov 1 (already done), Nov 25-27 (available)
  const meetingDoneDates = [1];
  const availableMeetingDates = [25, 26, 27];

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return firstDay.getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const followupTemplatesParams = useMemo(() => ({ limit: 50 }), []);
  const {
    data: followupTemplatesData,
    isLoading: isFollowupTemplatesLoading,
  } = useFollowupTemplates(followupTemplatesParams);
  const followupTemplates = useMemo(
    () => followupTemplatesData?.data?.docs ?? [],
    [followupTemplatesData?.data?.docs]
  );

  const leadsQueryParams = useMemo(
    () => ({
      limit: 100,
      search: leadsSearch || undefined,
    }),
    [leadsSearch]
  );
  const {
    query: leadsQuery,
    leads: fetchedLeads,
  } = useLeadsData(leadsQueryParams, { enabled: leadSelectorOpen });
  const isLeadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;
  const leadsError = leadsQuery.error as Error | null;

  const { mutate: createFollowupPlan, isPending: isCreatingFollowupPlan } =
    useCreateFollowupPlan();
  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } = useDeleteFollowupPlan();

  const followupPlansParams = useMemo(() => ({ limit: 100 }), []);
  const {
    data: followupPlansData,
    isLoading: isFollowupPlansLoading,
    isFetching: isFollowupPlansFetching,
    refetch: refetchFollowupPlans,
  } = useFollowupPlans(followupPlansParams);
  const followupPlans = useMemo(
    () => followupPlansData?.data?.docs ?? [],
    [followupPlansData?.data?.docs]
  );

  useEffect(() => {
    if (lead?._id) {
      setSelectedLeadsMap((prev) => {
        if (prev[lead._id]) {
          return prev;
        }
        return { ...prev, [lead._id]: lead };
      });
    }
  }, [lead]);

  const selectedLeadIds = useMemo(
    () => Object.keys(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const selectedLeads = useMemo(
    () => Object.values(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const leadFollowupPlans = useMemo(() => {
    if (!lead?._id) {
      return [];
    }
    return followupPlans.filter((plan) =>
      plan.todo?.some((todo) => {
        const personId =
          typeof todo.personId === "string"
            ? todo.personId
            : todo.personId?._id;
        return personId === lead._id;
      })
    );
  }, [followupPlans, lead?._id]);

  const sortedLeadFollowupPlans = useMemo(
    () =>
      [...leadFollowupPlans].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [leadFollowupPlans]
  );

  const getTemplateTitle = (plan: FollowupPlan) => {
    if (typeof plan.templateId === "string") {
      return "Followup Plan";
    }
    return plan.templateId?.title || "Followup Plan";
  };

  const formatRelativeTime = (value?: string) => {
    if (!value) {
      return "Unknown";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getPlanStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/15 text-green-300 border border-green-400/30";
      case "in_progress":
        return "bg-blue-500/15 text-blue-200 border border-blue-400/30";
      case "failed":
        return "bg-red-500/15 text-red-300 border border-red-400/30";
      default:
        return "bg-white/10 text-white border border-white/20";
    }
  };

  const handleToggleLeadSelection = (leadItem: Lead) => {
    const leadId = leadItem?._id || (leadItem as any)?.id;
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

  const resetFollowupForm = () => {
    setSelectedTemplateId("");
    setLeadsSearch("");
    if (lead?._id) {
      setSelectedLeadsMap({ [lead._id]: lead });
    } else {
      setSelectedLeadsMap({});
    }
  };

  const handleRequestPlanDeletion = (plan: FollowupPlan) => {
    setPlanPendingDelete(plan);
  };

  const handleCancelPlanDeletion = () => {
    if (isDeletingPlan) {
      return;
    }
    setPlanPendingDelete(null);
  };

  const handleConfirmPlanDeletion = () => {
    if (!planPendingDelete) {
      return;
    }

    deleteFollowupPlan(planPendingDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Followup plan deleted",
          description:
            response?.message ||
            `Removed plan "${getTemplateTitle(planPendingDelete)}".`,
        });
        setPlanPendingDelete(null);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to delete followup plan",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleRunFollowupPlan = () => {
    if (!selectedTemplateId) {
      toast({
        title: "Select a followup template",
        description: "Choose which template to use before starting a plan.",
        variant: "destructive",
      });
      return;
    }

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
        templateId: selectedTemplateId,
        personIds: selectedLeadIds,
      },
      {
        onSuccess: (response) => {
          toast({
            title: "Followup plan started",
            description:
              response.message ||
              "We'll keep this lead updated with the followup plan status.",
          });
          resetFollowupForm();
        },
        onError: (error: any) => {
          toast({
            title: "Failed to start followup plan",
            description:
              error?.response?.data?.message ||
              error?.message ||
              "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <Card
      className="w-full flex-1 min-h-0 flex flex-col rounded-3xl"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        border: "1px solid #FFFFFF0D",
      }}
    >
      <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-6">Activity</h2>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
            <TabsTrigger
              value="summary"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Summary
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Calendar
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="px-0 py-2 text-white/70 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
            >
              Followup Campaigns
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab Content */}
          <TabsContent value="summary" className="mt-6">
            <div className="flex flex-col items-center">
              {/* Circular Progress Indicator */}
              <div className="relative w-48 h-48 mb-4">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.65)}`}
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">65%</span>
                </div>
              </div>

              {/* Text below circle */}
              <p className="text-white text-center mb-8">Lorem Ipsum lorem</p>

              {/* AI Summary Section */}
              <div
                className="w-full rounded-lg p-4"
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                <h3 className="text-white font-bold mb-3">AI Summary</h3>
                <div className="text-white/70 text-sm space-y-2 leading-relaxed">
                  <p>
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry. Lorem Ipsum has been the industry's
                    standard dummy text ever since the 1500s, when an unknown
                    printer took a galley of type and scrambled it to make a
                    type specimen book.
                  </p>
                  <p>
                    It has survived not only five centuries, but also the leap
                    into electronic typesetting, remaining essentially
                    unchanged. It was popularised in the 1960s with the release
                    of Letraset sheets containing Lorem Ipsum passages.
                  </p>
                  <p>
                    More recently with desktop publishing software like Aldus
                    PageMaker including versions of Lorem Ipsum.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Calendar Tab Content */}
          <TabsContent value="calendar" className="mt-6">
            <div className="space-y-6">
              {/* Calendar Widget */}
              <div
                className="rounded-lg p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePrevMonth}
                    className="text-white/70 hover:text-white transition-colors p-1"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.5 15L7.5 10L12.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <h3 className="text-white font-semibold text-lg">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h3>
                  <button
                    onClick={handleNextMonth}
                    className="text-white/70 hover:text-white transition-colors p-1"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 15L12.5 10L7.5 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-white/50 text-xs font-medium py-2"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square" />;
                    }

                    const isMeetingDone =
                      currentDate.getMonth() === 10 &&
                      meetingDoneDates.includes(day);
                    const isAvailableMeeting =
                      currentDate.getMonth() === 10 &&
                      availableMeetingDates.includes(day);

                    return (
                      <div
                        key={index}
                        className={`aspect-square flex items-center justify-center relative ${
                          isMeetingDone || isAvailableMeeting
                            ? ""
                            : "text-white/70"
                        }`}
                      >
                        {isMeetingDone && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "rgba(6, 182, 212, 0.3)",
                              border: "2px solid #06b6d4",
                            }}
                          />
                        )}
                        {isAvailableMeeting && (
                          <div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: "rgba(59, 130, 246, 0.3)",
                              border: "2px solid #3b82f6",
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 ${
                            isMeetingDone || isAvailableMeeting
                              ? "text-white font-medium"
                              : ""
                          }`}
                        >
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: "rgba(6, 182, 212, 0.3)",
                      border: "2px solid #06b6d4",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Already meeting done
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      background: "rgba(59, 130, 246, 0.3)",
                      border: "2px solid #3b82f6",
                    }}
                  />
                  <span className="text-white/70 text-sm">
                    Available for meeting
                  </span>
                </div>
              </div>

              {/* Meeting Notes Section */}
              <div>
                <h3 className="text-white font-bold mb-4">Meeting Notes</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className="rounded-lg p-4"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <h4 className="text-white font-semibold mb-2">
                        Proposal for projects
                      </h4>
                      <p className="text-white/70 text-sm">
                        Lorem Ipsum is simply dummy text of the printing.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Followup Campaigns Tab Content */}
          <TabsContent value="campaigns" className="mt-6 space-y-5">
            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-semibold">Existing followups</p>
                  <p className="text-sm text-white/60">
                    Plans that already include this lead will show here so you can track status.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => refetchFollowupPlans()}
                  disabled={isFollowupPlansFetching}
                >
                  <RefreshCcw
                    className={`w-4 h-4 mr-2 ${
                      isFollowupPlansFetching ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>

              {isFollowupPlansLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-white/60">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading followup plans...
                </div>
              ) : sortedLeadFollowupPlans.length > 0 ? (
                <div className="space-y-3">
                  {sortedLeadFollowupPlans.map((plan) => {
                    const totalTasks = plan.todo?.length ?? 0;
                    const completedTasks =
                      plan.todo?.filter((task) => task.isComplete).length ?? 0;
                    const nextTask = plan.todo?.find((task) => !task.isComplete);
                    const canDeletePlan = ["scheduled", "in_progress"].includes(
                      plan.status
                    );
                    const isPlanDeletePending =
                      planPendingDelete?._id === plan._id && isDeletingPlan;
                    return (
                      <div
                        key={plan._id}
                        className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-white font-semibold">
                              {getTemplateTitle(plan)}
                            </p>
                            <p className="text-xs text-white/60">
                              Started {formatRelativeTime(plan.createdAt)}
                              {plan.updatedAt &&
                                plan.updatedAt !== plan.createdAt && (
                                  <> · Updated {formatRelativeTime(plan.updatedAt)}</>
                                )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getPlanStatusBadgeClass(plan.status)}
                            >
                              {plan.status.replace("_", " ")}
                            </Badge>
                            {canDeletePlan && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-red-200 hover:text-red-100 hover:bg-red-500/10"
                                onClick={() => handleRequestPlanDeletion(plan)}
                                disabled={isPlanDeletePending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-white/70 flex flex-wrap gap-4">
                          <span>
                            Tasks: {completedTasks}/{totalTasks}
                          </span>
                          {nextTask && (
                            <span>
                              Next up: {nextTask.type.replace("_", " ")}{" "}
                              {nextTask.scheduledFor
                                ? `on ${formatRelativeTime(nextTask.scheduledFor)}`
                                : ""}
                            </span>
                          )}
                          <span>ID: {plan._id.slice(-6)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-white/60">
                  No followup plans include this lead yet.
                </div>
              )}
            </div>

            <div
              className="rounded-2xl p-6 space-y-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 rounded-full bg-white/10">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-base font-semibold">Automate followups</p>
                  <p className="text-sm text-white/70">
                    Choose a followup template and select leads to immediately create a personalized followup plan.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm text-white/70">Followup template</span>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                    disabled={
                      isFollowupTemplatesLoading || followupTemplates.length === 0
                    }
                  >
                    <SelectTrigger className="bg-white/5 text-white border-white/10">
                      <SelectValue
                        placeholder={
                          isFollowupTemplatesLoading
                            ? "Loading templates..."
                            : followupTemplates.length
                              ? "Select a template"
                              : "No templates available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0b0f20] text-white border-white/10 max-h-72">
                      {followupTemplates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium">{template.title}</span>
                            <span className="text-[11px] text-white/60">
                              {template.numberOfDaysToRun} days · {template.numberOfEmails} emails · {template.numberOfCalls} calls
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-sm text-white/70">Leads</span>
                  <Popover open={leadSelectorOpen} onOpenChange={setLeadSelectorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between bg-white/5 text-white border-white/10 hover:bg-white/10"
                      >
                        <span>
                          {selectedLeadIds.length > 0
                            ? `${selectedLeadIds.length} ${
                                selectedLeadIds.length === 1 ? "lead" : "leads"
                              } selected`
                            : "Select leads"}
                        </span>
                        <ChevronRight className="w-4 h-4 opacity-70" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[360px] p-0 bg-[#101426] border-white/10">
                      <Command>
                        <CommandInput
                          placeholder="Search leads"
                          value={leadsSearch}
                          onValueChange={setLeadsSearch}
                          className="text-white placeholder:text-white/40"
                        />
                        <CommandList>
                          {isLeadsLoading ? (
                            <div className="flex items-center justify-center py-4 text-xs text-white/60">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading leads...
                            </div>
                          ) : (
                            <>
                              <CommandEmpty className="p-4 text-xs text-white/60">
                                No leads found.
                              </CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-y-auto">
                                {fetchedLeads.map((leadItem) => {
                                  const leadId = leadItem?._id || (leadItem as any)?.id;
                                  if (!leadId) {
                                    return null;
                                  }
                                  const isSelected = Boolean(selectedLeadsMap[leadId]);
                                  return (
                                    <CommandItem
                                      key={leadId}
                                      className="flex items-center gap-3 cursor-pointer"
                                      onSelect={() => handleToggleLeadSelection(leadItem)}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                          handleToggleLeadSelection(leadItem)
                                        }
                                        className="border-white/40 data-[state=checked]:bg-white/90"
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-sm text-white">
                                          {leadItem.name || "Unnamed lead"}
                                        </span>
                                        <span className="text-xs text-white/60">
                                          {leadItem.companyName || leadItem.position || "Unknown organization"}
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
                    </PopoverContent>
                  </Popover>

                  {selectedLeads.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedLeads.map((leadItem) => {
                        const leadId = leadItem?._id || (leadItem as any)?.id;
                        if (!leadId) {
                          return null;
                        }
                        return (
                          <Badge
                            key={leadId}
                            variant="secondary"
                            className="bg-white/10 text-white border border-white/20 flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span className="text-xs">
                              {leadItem.name || "Lead"} ·{" "}
                              {leadItem.companyName || leadItem.position || "Unknown"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleLeadSelection(leadItem)}
                              className="ml-1"
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

                <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/10">
                  <div className="text-sm text-white/60">
                    Each selected lead will get a personalized followup plan using the template above.
                  </div>
                  <Button
                    onClick={handleRunFollowupPlan}
                    disabled={isCreatingFollowupPlan}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  >
                    {isCreatingFollowupPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <MoveRight className="w-4 h-4 mr-2" />
                        Run Followup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(planPendingDelete)}
        title="Delete followup plan?"
        description={
          planPendingDelete
            ? `This will immediately delete "${getTemplateTitle(
                planPendingDelete
              )}" and its scheduled tasks for all included leads.`
            : undefined
        }
        confirmText="Delete plan"
        confirmVariant="destructive"
        isPending={isDeletingPlan}
        onConfirm={handleConfirmPlanDeletion}
        onCancel={handleCancelPlanDeletion}
      />
    </>
  );
};

export default Activity;
