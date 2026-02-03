import { FC, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { calendarService, LeadMeetingRecord, AvailableSlot, } from "@/services/calendar.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { CrmNavigation } from "@/pages/company/crm/shared/components/CrmNavigation";
import CalendarWidget from "./components/CalendarWidget";
import MeetingsList from "./components/MeetingList";
import { useUserTimeZone } from "@/hooks/useUserTimeZone";


const CalendarPage: FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [meetingPendingDelete, setMeetingPendingDelete] = useState<LeadMeetingRecord | null>(null);
  const { toast } = useToast();
  const todayRef = useMemo(() => new Date(), []);
  const nowTimestamp = useMemo(() => todayRef.getTime(), [todayRef]);
  const userTimeZone = useUserTimeZone();

  const calendarMonthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }, [currentDate]);

  const calendarMonthKey = useMemo(() => `${currentDate.getFullYear()}-${currentDate.getMonth()}`, [currentDate]);
  const calendarRangeStartIso = calendarMonthRange.start.toISOString();
  const calendarRangeEndIso = calendarMonthRange.end.toISOString();
  // Fetch all meetings for the current month
  const { data: leadMeetingsResponse, isLoading: isLeadMeetingsLoading, isFetching: isLeadMeetingsFetching, error: leadMeetingsError, refetch: refetchLeadMeetings, } = useQuery({
    queryKey: ["calendar-all-meetings", calendarMonthKey],
    queryFn: async () => {
      return calendarService.getLeadMeetings({
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        sort: "asc",
        limit: 500,
      });
    },
    staleTime: 60 * 1000,
  });
  // Fetch available slots
  const { data: availableSlotsResponse, isLoading: isAvailabilityLoading, isFetching: isAvailabilityFetching, refetch: refetchAvailability, } = useQuery({
    queryKey: ["calendar-available-slots", calendarMonthKey, userTimeZone],
    queryFn: async () => {
      return calendarService.getAvailableSlots({
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        durationMinutes: 30,
        intervalMinutes: 30,
        weekdaysOnly: "false",
      });
    },
    staleTime: 60 * 1000,
  });
  // Sync meetings mutation
  const syncMeetingsMutation = useMutation({
    mutationFn: async () => {
      return calendarService.syncMeetings();
    },
    onSuccess: (response) => {
      toast({ title: "Calendar synced", description: response?.message || "Your calendar has been synced with the latest meetings.", });
      refetchLeadMeetings();
      refetchAvailability();
    },
    onError: (error: any) => {
      toast({ title: "Failed to sync calendar", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive", });
    },
  });
  // Delete meeting mutation
  const deleteMeetingMutation = useMutation<{ success: boolean; message: string }, Error, string>({
    mutationFn: async (meetingId: string) => {
      return calendarService.deleteMeeting(meetingId);
    },
    onSuccess: (response) => {
      toast({ title: "Meeting deleted", description: response.message || "Meeting has been successfully deleted from your calendar.", });
      refetchLeadMeetings();
      setMeetingPendingDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete meeting", description: error?.response?.data?.message || error?.message || "Please try again.", variant: "destructive", });
    },
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
  const isAvailabilityBusy = isAvailabilityLoading || isAvailabilityFetching;
  const isCalendarDataBusy = isLeadMeetingsBusy || isAvailabilityBusy;

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

  const handleRefreshCalendarData = () => {
    if (syncMeetingsMutation.isPending) {
      return;
    }
    syncMeetingsMutation.mutate();
  };

  const handleConfirmDeleteMeeting = () => {
    if (!meetingPendingDelete?._id) {
      return;
    }
    deleteMeetingMutation.mutate(meetingPendingDelete._id);
  };

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white flex-1 min-h-0 max-h-screen overflow-y-hidden overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 max-w-[1600px] mx-auto w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <CrmNavigation />
            </motion.div>
          </div>

          {/* Calendar Content - Two Column Layout */}
          <Card
            className="rounded-2xl border border-white/10 p-6 flex-1 min-h-0 flex flex-col"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
              {/* Left Column - Calendar Widget */}
              <CalendarWidget
                currentDate={currentDate}
                selectedDate={selectedDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onRefreshCalendarData={handleRefreshCalendarData}
                onSelectDate={setSelectedDate}
                leadMeetings={leadMeetings}
                availableSlots={availableSlots}
                isCalendarDataBusy={isCalendarDataBusy}
                syncMeetingsMutation={syncMeetingsMutation}
                todayRef={todayRef}
                nowTimestamp={nowTimestamp}
              />

              {/* Right Column - Meetings List */}
              <MeetingsList
                selectedDate={selectedDate}
                currentDate={currentDate}
                leadMeetings={leadMeetings}
                isLeadMeetingsBusy={isLeadMeetingsBusy}
                leadMeetingsError={leadMeetingsError}
                nowTimestamp={nowTimestamp}
                onClearDateFilter={() => setSelectedDate(null)}
                onDeleteMeeting={setMeetingPendingDelete}
                deleteMeetingMutation={deleteMeetingMutation}
              />
            </div>
          </Card>
        </motion.div>
      </motion.main>

      {/* Delete Meeting Confirmation Dialog */}
      <ConfirmDialog
        open={!!meetingPendingDelete}
        title="Delete Meeting"
        description={`Are you sure you want to delete "${meetingPendingDelete?.subject || "this meeting"
          }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteMeeting}
        onCancel={() => setMeetingPendingDelete(null)}
        confirmVariant="destructive"
        isPending={deleteMeetingMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;