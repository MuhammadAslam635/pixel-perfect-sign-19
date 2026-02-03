import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Clock, } from 'lucide-react';

interface Lead {
    name?: string;
    timezone?: string;
}

interface ScheduleForm {
    subject: string;
    body: string;
    location: string;
    recallBotIncluded: boolean;
    findAvailableSlot: boolean;
    startDate: string;
    endDate: string;
    durationMinutes: number;
}

interface LeadScheduleMeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: Lead;
    scheduleForm: ScheduleForm;
    setScheduleForm: React.Dispatch<React.SetStateAction<ScheduleForm>>;
    schedulingMeeting: boolean;
    checkingMicrosoft: boolean;
    microsoftConnected: boolean | null;
    microsoftStatusMessage: string | null;
    microsoftStatusError: string | null;
    isSearchRangeTooLarge: boolean;
    maxSearchEndDate: string;
    onScheduleMeeting: () => void;
    onReset: () => void;
    getTimezoneAbbreviation: (timezone: string) => string;
    getCurrentTimeInTimezone: (timezone: string) => string;
    convertLeadTimeToUserTime: (dateTime: string, timezone: string) => string;
}

export const LeadScheduleMeetingDialog: React.FC<LeadScheduleMeetingDialogProps> = ({
    open,
    onOpenChange,
    lead,
    scheduleForm,
    setScheduleForm,
    schedulingMeeting,
    checkingMicrosoft,
    microsoftConnected,
    microsoftStatusMessage,
    microsoftStatusError,
    isSearchRangeTooLarge,
    maxSearchEndDate,
    onScheduleMeeting,
    onReset,
    getTimezoneAbbreviation,
    getCurrentTimeInTimezone,
    convertLeadTimeToUserTime,
}) => {
    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            onReset();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]" style={{ background: '#0a0a0a' }}>
                {/* Gradient overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)', }} />
                <div className="relative z-10 flex flex-col h-full min-h-0">
                    <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                        <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">Schedule Meeting</DialogTitle>
                        <DialogDescription className="text-xs text-white/70">Create a Microsoft Calendar event with {lead.name || 'this lead'}.</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
                        {checkingMicrosoft && (
                            <Alert className="bg-white/5 border-white/10 text-white">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                                <AlertDescription className="text-xs text-white/80">
                                    Checking Microsoft Calendar connection...
                                </AlertDescription>
                            </Alert>
                        )}

                        {!checkingMicrosoft && microsoftConnected === false && (
                            <Alert
                                variant="destructive"
                                className="border-red-500/40 bg-red-500/10 text-white"
                            >
                                <AlertTriangle className="h-4 w-4 text-red-300" />
                                <div>
                                    <AlertTitle className="text-xs font-semibold text-white">
                                        Microsoft not connected
                                    </AlertTitle>
                                    <AlertDescription className="text-xs text-white/80">
                                        {microsoftStatusError ||
                                            'Connect Microsoft in Settings → Integrations before scheduling a meeting.'}
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}

                        {!checkingMicrosoft &&
                            microsoftConnected &&
                            microsoftStatusMessage && (
                                <Alert className="bg-white/10 border-white/15 text-white">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                    <AlertDescription className="text-xs text-white/80">
                                        {microsoftStatusMessage}
                                    </AlertDescription>
                                </Alert>
                            )}

                        {/* Timezone Info Banner */}
                        {lead.timezone && (
                            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2.5">
                                <div className="flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-blue-200">
                                            Scheduling in {lead.name?.split(' ')[0] || 'lead'}'s
                                            timezone
                                        </p>
                                        <p className="text-xs text-blue-200/70 mt-0.5">
                                            {lead.timezone} ({getTimezoneAbbreviation(lead.timezone)}) —
                                            Currently {getCurrentTimeInTimezone(lead.timezone)}
                                        </p>
                                        <p className="text-xs text-white/50 mt-1">
                                            Your time:{' '}
                                            {Intl.DateTimeFormat().resolvedOptions().timeZone} (
                                            {getTimezoneAbbreviation(
                                                Intl.DateTimeFormat().resolvedOptions().timeZone
                                            )}
                                            ) —{' '}
                                            {getCurrentTimeInTimezone(
                                                Intl.DateTimeFormat().resolvedOptions().timeZone
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!lead.timezone && (
                            <Alert className="bg-amber-500/10 border-amber-500/30 text-white">
                                <AlertTriangle className="h-4 w-4 text-amber-300" />
                                <AlertDescription className="text-xs text-amber-200/80">
                                    Lead's timezone is not set. Meeting will be scheduled in your
                                    local timezone.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Subject</Label>
                            <Input
                                value={scheduleForm.subject}
                                onChange={(e) =>
                                    setScheduleForm((prev) => ({
                                        ...prev,
                                        subject: e.target.value,
                                    }))
                                }
                                className="bg-white/5 border-white/10 text-white text-xs"
                                placeholder="Meeting subject"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Description</Label>
                            <Textarea
                                value={scheduleForm.body}
                                onChange={(e) =>
                                    setScheduleForm((prev) => ({
                                        ...prev,
                                        body: e.target.value,
                                    }))
                                }
                                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
                                placeholder="Add context or agenda"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-white/70">Location</Label>
                            <Input
                                value={scheduleForm.location}
                                onChange={(e) =>
                                    setScheduleForm((prev) => ({
                                        ...prev,
                                        location: e.target.value,
                                    }))
                                }
                                className="bg-white/5 border-white/10 text-white text-xs"
                                placeholder="Optional location"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5">
                            <div className="min-w-0 pr-3">
                                <Label className="text-xs text-white/80">Note taker agent</Label>
                                <p className="text-[10px] text-white/50 mt-0.5">
                                    When enabled, a meeting bot will join and generate
                                    notes/recording/transcript.
                                </p>
                            </div>
                            <Switch
                                checked={scheduleForm.recallBotIncluded}
                                onCheckedChange={(checked) =>
                                    setScheduleForm((prev) => ({
                                        ...prev,
                                        recallBotIncluded: Boolean(checked),
                                    }))
                                }
                            />
                        </div>

                        {scheduleForm.findAvailableSlot && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/70">
                                            Start of search window{' '}
                                            {lead.timezone &&
                                                `(${getTimezoneAbbreviation(lead.timezone)})`}
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={scheduleForm.startDate}
                                            onChange={(e) =>
                                                setScheduleForm({
                                                    ...scheduleForm,
                                                    startDate: e.target.value,
                                                })
                                            }
                                            className="bg-white/10 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                        />
                                        {scheduleForm.startDate &&
                                            lead.timezone &&
                                            lead.timezone !==
                                            Intl.DateTimeFormat().resolvedOptions().timeZone && (
                                                <p className="text-[10px] text-white/50">
                                                    Your time:{' '}
                                                    {convertLeadTimeToUserTime(
                                                        scheduleForm.startDate,
                                                        lead.timezone || ''
                                                    )}{' '}
                                                    (
                                                    {getTimezoneAbbreviation(
                                                        Intl.DateTimeFormat().resolvedOptions().timeZone
                                                    )}
                                                    )
                                                </p>
                                            )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-white/70">
                                            End of search window{' '}
                                            {lead.timezone &&
                                                `(${getTimezoneAbbreviation(lead.timezone)})`}
                                        </Label>
                                        <Input
                                            type="datetime-local"
                                            value={scheduleForm.endDate}
                                            onChange={(e) =>
                                                setScheduleForm((prev) => ({
                                                    ...prev,
                                                    endDate: e.target.value,
                                                }))
                                            }
                                            className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                            placeholder="Defaults to end of day"
                                            max={maxSearchEndDate}
                                        />
                                        {isSearchRangeTooLarge && (
                                            <p className="text-xs text-red-400">
                                                Search window must be less than 62 days from the start
                                                date.
                                            </p>
                                        )}
                                        {scheduleForm.endDate &&
                                            lead.timezone &&
                                            lead.timezone !==
                                            Intl.DateTimeFormat().resolvedOptions().timeZone &&
                                            !isSearchRangeTooLarge && (
                                                <p className="text-[10px] text-white/50">
                                                    Your time:{' '}
                                                    {convertLeadTimeToUserTime(
                                                        scheduleForm.endDate,
                                                        lead.timezone || ''
                                                    )}{' '}
                                                    (
                                                    {getTimezoneAbbreviation(
                                                        Intl.DateTimeFormat().resolvedOptions().timeZone
                                                    )}
                                                    )
                                                </p>
                                            )}
                                    </div>
                                </div>
                                <div className="space-y-2 pb-4">
                                    <Label className="text-xs text-white/70">
                                        Meeting duration (minutes)
                                    </Label>
                                    <Input
                                        type="number"
                                        min={15}
                                        step={15}
                                        value={scheduleForm.durationMinutes}
                                        onChange={(e) =>
                                            setScheduleForm((prev) => ({
                                                ...prev,
                                                durationMinutes: Number(e.target.value) || 30,
                                            }))
                                        }
                                        className="bg-white/5 border-white/10 text-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-white/70 hover:text-white"
                            onClick={() => handleOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-white text-[#0b0f20] hover:bg-white/90"
                            disabled={
                                schedulingMeeting ||
                                checkingMicrosoft ||
                                microsoftConnected === false ||
                                (scheduleForm.findAvailableSlot && isSearchRangeTooLarge)
                            }
                            onClick={onScheduleMeeting}
                        >
                            {schedulingMeeting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                'Schedule'
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};