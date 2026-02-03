import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCcw, Loader2, Trash2, Info, MoveRight, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";
import { useCreateFollowupPlan, useDeleteFollowupPlan, useFollowupPlans } from "@/hooks/useFollowupPlans";
import { useLeadsData } from "@/pages/company/crm/shared/hooks";
import { Lead } from "@/services/leads.service";
import { FollowupPlan, FollowupTemplate as ServiceFollowupTemplate } from "@/services/followupPlans.service";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { formatDistanceToNow } from "date-fns";
import { formatFollowupTaskTime } from "@/utils/followupTaskTime";

interface FollowupTabProps {
    lead?: Lead;
}

// Service type ka use karein ya phir ise hata dein
type FollowupTemplate = ServiceFollowupTemplate;

const FollowupTab: React.FC<FollowupTabProps> = ({ lead }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [selectedTime, setSelectedTime] = useState<string>("09:00");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedLeadsMap, setSelectedLeadsMap] = useState<Record<string, Lead>>({});
    const [leadsSearch, setLeadsSearch] = useState("");
    const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
    const [planPendingDelete, setPlanPendingDelete] = useState<FollowupPlan | null>(null);

    const { toast } = useToast();
    const leadId = lead?._id;

    // Followup Templates
    const followupTemplatesParams = useMemo(() => ({ limit: 50 }), []);
    const { data: followupTemplatesData, isLoading: isFollowupTemplatesLoading } =
        useFollowupTemplates(followupTemplatesParams);

    // Correct type casting - use unknown first
    const followupTemplates = useMemo<ServiceFollowupTemplate[]>(() => {
        const data = followupTemplatesData as unknown as {
            data?: {
                docs?: ServiceFollowupTemplate[]
            }
        };
        return data?.data?.docs ?? [];
    }, [followupTemplatesData]);

    // Leads Data for selection
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
    );
    const isLeadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;
    const leadsError = leadsQuery.error as Error | null;

    // Filter leads by exact company name match
    const filteredLeads = useMemo(() => {
        if (!lead?.companyName || !fetchedLeads || fetchedLeads.length === 0) {
            return fetchedLeads || [];
        }
        return fetchedLeads.filter((l) => l.companyName === lead.companyName);
    }, [fetchedLeads, lead?.companyName]);

    // Followup Plans
    const { mutate: createFollowupPlan, isPending: isCreatingFollowupPlan } = useCreateFollowupPlan();
    const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } = useDeleteFollowupPlan();

    const followupPlansParams = useMemo(() => ({ limit: 100 }), []);
    const {
        data: followupPlansData,
        isLoading: isFollowupPlansLoading,
        isFetching: isFollowupPlansFetching,
        refetch: refetchFollowupPlans,
    } = useFollowupPlans(followupPlansParams);

    const followupPlans = useMemo<FollowupPlan[]>(() => {
        const data = followupPlansData as unknown as {
            data?: {
                docs?: FollowupPlan[]
            }
        };
        return data?.data?.docs ?? [];
    }, [followupPlansData]);

    // Initialize selected leads with current lead
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

    // Get followup plans for this lead
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

    // Utility functions
    function formatRelativeTime(value?: string) {
        if (!value) {
            return "Unknown";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }
        return formatDistanceToNow(date, { addSuffix: true });
    }

    const getTemplateTitle = (plan: FollowupPlan) => {
        const baseTitle = plan.templateSnapshot?.title || (typeof plan.templateId === "object" ? plan.templateId.title : "Followup Plan");
        let title = baseTitle || "Followup Plan";
        if (plan.todo && plan.todo.length > 0) {
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

    const getDisplayTime = (scheduledFor?: string, isComplete?: boolean) => {
        return formatFollowupTaskTime(scheduledFor, isComplete);
    };

    const getPlanStatusBadgeClass = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-500/15 text-green-300 border border-green-400/30";
            case "in_progress": return "bg-blue-500/15 text-blue-200 border border-blue-400/30";
            case "failed": return "bg-red-500/15 text-red-300 border border-red-400/30";
            default: return "bg-white/10 text-white border border-white/20";
        }
    };

    // Reset form
    const resetFollowupForm = () => {
        setSelectedTemplateId("");
        setSelectedTime("09:00");
        setSelectedDate(undefined);
        setLeadsSearch("");
        if (lead?._id) {
            setSelectedLeadsMap({ [lead._id]: lead });
        } else {
            setSelectedLeadsMap({});
        }
    };

    // Plan deletion handlers
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
                    description: response?.message || `Removed plan "${getTemplateTitle(planPendingDelete)}".`
                });
                setPlanPendingDelete(null);
            },
            onError: (error: any) => {
                toast({
                    title: "Failed to delete followup plan",
                    description: error?.response?.data?.message || error?.message || "Please try again.",
                    variant: "destructive"
                });
            },
        });
    };

    // Run followup plan
    const handleRunFollowupPlan = () => {
        if (!selectedTemplateId) {
            toast({
                title: "Select a followup template",
                description: "Choose which template to use before starting a plan.",
                variant: "destructive"
            });
            return;
        }

        if (!selectedLeadIds.length) {
            toast({
                title: "Select at least one lead",
                description: "Pick one or more leads to include in the followup plan.",
                variant: "destructive"
            });
            return;
        }

        const planPayload: any = {
            templateId: selectedTemplateId,
            personIds: selectedLeadIds,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        // Add startDate if selected
        if (selectedDate) {
            planPayload.startDate = selectedDate.toISOString();
        }

        // Add schedule with time if selected
        if (selectedTime) {
            planPayload.schedule = {
                enabled: true,
                time: selectedTime,
                ...(selectedDate && { startDate: selectedDate.toISOString() }),
            };
        }

        createFollowupPlan(
            planPayload,
            {
                onSuccess: (response) => {
                    toast({
                        title: "Followup plan started",
                        description: response.message || "We'll keep this lead updated with the followup plan status."
                    });
                    resetFollowupForm();
                },
                onError: (error: any) => {
                    toast({
                        title: "Failed to start followup plan",
                        description: error?.response?.data?.message || error?.message || "Please try again.",
                        variant: "destructive"
                    });
                },
            }
        );
    };

    return (
        <>
            {/* Existing Followups Section */}
            <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div className="flex flex-col items-start justify-between gap-4">
                    <div className="flex justify-between gap-4 items-center w-full">
                        <p className="text-xs font-semibold sm:text-sm">
                            Existing followups
                        </p>
                        <button
                            onClick={() => refetchFollowupPlans()}
                            disabled={isFollowupPlansFetching}
                            className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        >
                            <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-xs text-white/60">
                        Plans that already include this lead will show here so you can
                        track status.
                    </p>
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
                                plan.todo?.filter(
                                    (task) =>
                                        task.isComplete &&
                                        task.status !== 'cancelled' &&
                                        task.status !== 'skipped'
                                ).length ?? 0;
                            const nextTask = plan.todo?.find((task) => !task.isComplete);
                            const canDeletePlan = ['scheduled', 'in_progress'].includes(
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
                                                {plan.updatedAt && plan.updatedAt !== plan.createdAt && (
                                                    <>
                                                        {' '}
                                                        · Updated {formatRelativeTime(plan.updatedAt)}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={getPlanStatusBadgeClass(plan.status)}
                                            >
                                                {(plan.metadata as any)?.lastResult === 'rescheduled'
                                                    ? 'rescheduled'
                                                    : plan.status.replace('_', ' ')}
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
                                        {nextTask &&
                                            ['scheduled', 'in_progress', 'running'].includes(
                                                plan.status
                                            ) && (
                                                <span>
                                                    Next up: {nextTask.type.replace('_', ' ')}
                                                    {nextTask.scheduledFor
                                                        ? ` ${getDisplayTime(nextTask.scheduledFor, false)}`
                                                        : ''}
                                                </span>
                                            )}
                                        <span>ID: {plan._id.slice(-6)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-xs text-white/60">
                        No followup plans include this lead yet.
                    </div>
                )}
            </div>

            {/* Automate Followups Section */}
            <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <div className="flex items-start gap-3 text-white">
                    <div className="p-2 rounded-full bg-white/10">
                        <Info className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-semibold">
                            Automate followups
                        </p>
                        <p className="text-xs text-white/60">
                            Choose a followup template and select leads to immediately
                            create a personalized followup plan.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-xs text-white/60">Followup template</span>
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
                                            ? 'Loading templates...'
                                            : followupTemplates.length
                                                ? 'Select a template'
                                                : 'No templates available'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0b0f20] text-white border-white/10 max-h-72">
                                {followupTemplates.map((template) => (
                                    <SelectItem key={template._id} value={template._id}>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium">
                                                {template.title}
                                            </span>
                                            <span className="text-[11px] text-white/60">
                                                {template.numberOfDaysToRun} days ·{' '}
                                                {template.numberOfCalls} calls ·{' '}
                                                {template.numberOfWhatsappMessages || 0} whatsapp ·{' '}
                                                {template.numberOfEmails} emails
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplateId && (
                        <div className="grid gap-4 md:grid-cols-1">
                            <div className="space-y-2">
                                <span className="text-xs text-white/60">Start Date</span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={cn(
                                                'w-full pl-3 text-left font-normal bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs hover:bg-white/10 hover:text-white transition-all',
                                                !selectedDate && 'text-gray-400'
                                            )}
                                        >
                                            {selectedDate ? (
                                                format(selectedDate, 'PPP')
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            disabled={(date) =>
                                                date < new Date(new Date().setHours(0, 0, 0, 0))
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/10">
                        <Button
                            onClick={handleRunFollowupPlan}
                            disabled={isCreatingFollowupPlan}
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs"
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

            {/* Confirm Dialog for Plan Deletion */}
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
        </>
    );
};

export default FollowupTab;