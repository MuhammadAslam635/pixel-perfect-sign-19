import { FC, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";
import { useDeleteFollowupPlan, useFollowupPlans, } from "@/hooks/useFollowupPlans";
import { useLeadsData } from "@/pages/company/crm/shared/hooks";
import { Lead } from "@/services/leads.service";
import { FollowupPlan } from "@/services/followupPlans.service";
import { useToast } from "@/hooks/use-toast";
import { leadSummaryService, LeadSummaryResponse } from "@/services/leadSummary.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { calendarService, LeadMeetingRecord, AvailableSlot, SyncMeetingsResponse, } from "@/services/calendar.service";
import { SelectedCallLogView } from "..";
import CompanyTab from "./CompanyTab";
import CallScriptTab from "./CallScriptTab";
import AgentResearchTab from "./AgentResearchTab";
import NotesTab from "./NotesTab";
import SummaryTab from "./SummaryTab";
import FollowupTab from "./FollowupTab";
import CalendarTab from "./CalendarTab";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";

type ActivityProps = {
  lead?: Lead;
  selectedCallLogView: SelectedCallLogView;
  setSelectedCallLogView: (view: SelectedCallLogView) => void;
};

type HydratedSlot = AvailableSlot & {
  startDate: Date;
  endDate: Date;
};

const Activity: FC<ActivityProps> = ({ lead, selectedCallLogView, setSelectedCallLogView }) => {
  const [topLevelTab, setTopLevelTab] = useState<"activity" | "company" | "call_script" | "agent_research">("activity");
  const [activeTab, setActiveTab] = useState("summary");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedLeadsMap, setSelectedLeadsMap] = useState<Record<string, Lead>>({});
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [planPendingDelete, setPlanPendingDelete] = useState<FollowupPlan | null>(null);
  const [meetingPendingDelete, setMeetingPendingDelete] = useState<LeadMeetingRecord | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = lead?._id;
  const isCalendarTabActive = activeTab === "calendar";
  const userTimeZone = useUserTimeZone();

  const calendarMonthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [currentDate]);
  const calendarMonthKey = useMemo(() => `${currentDate.getFullYear()}-${currentDate.getMonth()}`, [currentDate]);
  const calendarRangeStartIso = calendarMonthRange.start.toISOString();
  const calendarRangeEndIso = calendarMonthRange.end.toISOString();

  const { data: leadSummaryResponse, isLoading: isLeadSummaryLoading, isFetching: isLeadSummaryFetching, refetch: refetchLeadSummary, } = useQuery<LeadSummaryResponse>({
    queryKey: ["lead-summary", leadId],
    queryFn: () => {
      if (!leadId) { throw new Error("Lead ID is required"); }
      return leadSummaryService.getSummary(leadId);
    },
    enabled: Boolean(leadId),
    refetchInterval: (query) => {
      if (query.state.data?.data?.status === "pending") { return 5000; }
      if (topLevelTab === "activity" && activeTab === "summary") { return 30000; }
      return false;
    },
    refetchOnWindowFocus: topLevelTab === "activity" && activeTab === "summary",
    staleTime: 0,
    refetchOnMount: true,
  });

  const leadSummary = leadSummaryResponse?.data ?? null;
  const { data: leadMeetingsResponse, isLoading: isLeadMeetingsLoading, isFetching: isLeadMeetingsFetching, error: leadMeetingsError, refetch: refetchLeadMeetings, } = useQuery({
    queryKey: ["lead-calendar-meetings", leadId, calendarMonthKey],
    queryFn: () => {
      if (!leadId) { throw new Error("Lead ID is required"); }
      return calendarService.getLeadMeetings({
        personId: leadId,
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        sort: "asc",
        limit: 500,
      });
    },
    enabled: Boolean(leadId && isCalendarTabActive),
    staleTime: 60 * 1000,
  });

  const deleteMeetingMutation = useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (meetingId: string) => { return calendarService.deleteMeeting(meetingId); },
    onSuccess: async (response, meetingId) => {
      toast({ title: "Meeting deleted", description: response.message || "Meeting has been successfully deleted from your calendar.", });
      await Promise.all([
        refetchLeadMeetings(),
        queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
        queryClient.invalidateQueries({ queryKey: ["lead-summary", leadId] }),
      ]);
    },
    onError: (error: any) => { toast({ title: "Failed to delete meeting", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive", }); },
  });
  const { data: availableSlotsResponse, isLoading: isAvailabilityLoading, isFetching: isAvailabilityFetching, error: availabilityError, refetch: refetchAvailability, } = useQuery({
    queryKey: ["calendar-available-slots", calendarMonthKey, userTimeZone],
    queryFn: () => calendarService.getAvailableSlots({
      startDate: calendarRangeStartIso,
      endDate: calendarRangeEndIso,
      durationMinutes: 30,
      intervalMinutes: 30,
      weekdaysOnly: "false",
    }),
    enabled: isCalendarTabActive,
    staleTime: 60 * 1000,
  });

  const leadMeetings = useMemo<LeadMeetingRecord[]>(
    () => leadMeetingsResponse?.data ?? [],
    [leadMeetingsResponse]
  );
  const availableSlots = useMemo<AvailableSlot[]>(() => {
    const slots = availableSlotsResponse?.data ?? [];
    return slots.filter((slot) => {
      const startDate = new Date(slot.start);
      return !Number.isNaN(startDate.getTime());
    });
  }, [availableSlotsResponse]);
  const isLeadMeetingsBusy = isLeadMeetingsLoading || isLeadMeetingsFetching;

  useEffect(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, [currentWeekStart]);

  useEffect(() => {
    if (selectedWeekDate.getMonth() !== currentDate.getMonth() || selectedWeekDate.getFullYear() !== currentDate.getFullYear()) {
      const newDate = new Date(selectedWeekDate);
      newDate.setDate(1);
      setCurrentDate(newDate);
    }
  }, [selectedWeekDate, currentDate]);

  useEffect(() => {
    if (topLevelTab === "activity" && activeTab === "summary" && leadId) {
      refetchLeadSummary();
    }
  }, [topLevelTab, activeTab, leadId, refetchLeadSummary]);

  const followupTemplatesParams = useMemo(() => ({ limit: 50 }), []);
  const { data: followupTemplatesData, isLoading: isFollowupTemplatesLoading } =
    useFollowupTemplates(followupTemplatesParams);
  const followupTemplates = useMemo<Array<Record<string, any>>>(() => {
    const docs = (
      followupTemplatesData as
      | { data?: { docs?: Array<Record<string, any>> } }
      | undefined
    )?.data?.docs;
    return docs ?? [];
  }, [followupTemplatesData]);

  const leadsQueryParams = useMemo(() => {
    const params = {
      limit: 100,
      search: leadsSearch || undefined,
      companyId: lead?.companyId || undefined,
    };
    return params;
  }, [leadsSearch, lead?.companyId, lead?._id, lead?.name, lead?.companyName]);
  const { query: leadsQuery, leads: fetchedLeads } = useLeadsData(
    leadsQueryParams,
    { enabled: leadSelectorOpen }
  )

  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } = useDeleteFollowupPlan();

  const followupPlansParams = useMemo(() => ({ limit: 100 }), []);
  const { data: followupPlansData, isLoading: isFollowupPlansLoading, isFetching: isFollowupPlansFetching, refetch: refetchFollowupPlans, } = useFollowupPlans(followupPlansParams);
  const followupPlans = useMemo<FollowupPlan[]>(() => {
    const docs = (followupPlansData as { data?: { docs?: FollowupPlan[] } } | undefined)?.data?.docs;
    return docs ?? [];
  }, [followupPlansData]);

  useEffect(() => { if (lead?._id) { setSelectedLeadsMap((prev) => { if (prev[lead._id]) { return prev; } return { ...prev, [lead._id]: lead }; }); } }, [lead]);

  const getTemplateTitle = (plan: FollowupPlan) => {
    // UPDATED: Prefer snapshot title for historical accuracy
    const baseTitle = plan.templateSnapshot?.title || (typeof plan.templateId === "object" ? plan.templateId.title : "Followup Plan");
    let title = baseTitle || "Followup Plan";
    // Check if there's a scheduled time in the tasks
    if (plan.todo && plan.todo.length > 0) {
      // Find the earliest scheduled task regardless of array order
      const earliestTask = [...plan.todo].filter((t) => t.scheduledFor)
        .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())[0];
      if (earliestTask) {
        const date = new Date(earliestTask.scheduledFor!);
        if (!Number.isNaN(date.getTime())) {
          const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${title} (Runs at ${timeStr})`;
        }
      }
    }
    return title;
  };

  const handleCancelPlanDeletion = () => {
    if (isDeletingPlan) {
      return;
    }
    setPlanPendingDelete(null);
  };
  const handleConfirmPlanDeletion = () => {
    if (!planPendingDelete) { return; }
    deleteFollowupPlan(planPendingDelete._id, {
      onSuccess: (response) => { toast({ title: "Followup plan deleted", description: response?.message || `Removed plan "${getTemplateTitle(planPendingDelete)}".`, }); setPlanPendingDelete(null); },
      onError: (error: any) => { toast({ title: "Failed to delete followup plan", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive", }); }
    });
  };

  return (
    <>
      <Card
        className="w-full flex flex-col rounded-3xl h-[calc(100vh-200px)] min-h-0"
        style={{ background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)", border: "1px solid #FFFFFF0D", }}
      >
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <Tabs value={topLevelTab} onValueChange={(value) => setTopLevelTab(value as "activity" | "company" | "call_script" | "agent_research")} className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
                <TabsTrigger
                  value="activity"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Activity
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
                <TabsTrigger
                  value="company"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Company
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
                <TabsTrigger
                  value="call_script"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Call Script
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
                <TabsTrigger
                  value="agent_research"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Agent Research
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
              </TabsList>
            </div>
            {/* Activity content (existing inner tabs) */}
            <TabsContent value="activity" className="mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
                  <TabsTrigger
                    value="summary"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Summary
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Calendar
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="campaigns"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Follow-up
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Notes
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                </TabsList>
                {/* Summary Tab Content */}
                <TabsContent value="summary" className="mt-6">
                  <SummaryTab
                    lead={lead}
                  />
                </TabsContent>
                {/* Calendar Tab Content */}
                <TabsContent value="calendar" className="mt-6">
                  {!leadId ? (
                    <div
                      className="rounded-lg p-6 text-white/70 text-xs"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      Select a lead to view scheduled meetings and availability.
                    </div>
                  ) : (<CalendarTab lead={lead} />)}
                </TabsContent>
                {/* Followup Campaigns Tab Content */}
                <TabsContent value="campaigns" className="mt-6 space-y-5">
                  <FollowupTab lead={lead} />
                </TabsContent>
                {/* Notes Tab Content */}
                <TabsContent value="notes" className="mt-6">
                  <NotesTab lead={lead} />
                </TabsContent>
              </Tabs>
            </TabsContent>
            {/* Company content */}
            <TabsContent value="company" className="mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <CompanyTab lead={lead} />
            </TabsContent>
            {/* Call Script content */}
            <TabsContent value="call_script" className="mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <CallScriptTab lead={lead} />ConfirmDialog
            </TabsContent>
            {/* Agent Research content */}
            <TabsContent value="agent_research" className="mt-2 data-[state=active]:flex data-[state=active]:flex-col">
              <AgentResearchTab lead={lead} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={Boolean(planPendingDelete)}
        title="Delete Follow-up Plan"
        description="Are you sure you want to delete this follow-up plan? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
        isPending={isDeletingPlan}
        onConfirm={handleConfirmPlanDeletion}
        onCancel={handleCancelPlanDeletion}
      />
      <ConfirmDialog
        open={Boolean(meetingPendingDelete)}
        title="Delete meeting?"
        description={
          meetingPendingDelete
            ? `This will permanently delete "${meetingPendingDelete.subject || "this meeting"
            }" from your Microsoft calendar and remove it from the lead's record.`
            : undefined
        }
        confirmText="Delete meeting"
        confirmVariant="destructive"
        isPending={deleteMeetingMutation.isPending}
        onConfirm={() => {
          if (!meetingPendingDelete) return;
          deleteMeetingMutation.mutate(meetingPendingDelete._id);
          setMeetingPendingDelete(null);
        }}
        onCancel={() => setMeetingPendingDelete(null)}
      />
    </>
  );
};

export default Activity;