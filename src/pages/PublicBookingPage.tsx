import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, CheckCircle, User, Mail, MessageSquare, ChevronLeft, CalendarDays, ArrowRight, Globe, Copy, Check } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay, parseISO } from "date-fns";
import axios from "axios";

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

interface TimeSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

interface UserInfo {
  name: string;
  meetingTitle: string;
  customMessage: string | null;
}

enum BookingStep {
  DATE_SELECTION = "date-selection",
  DETAILS = "details",
  SUCCESS = "success"
}

export function PublicBookingPage() {
  const { userSlug } = useParams<{ userSlug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<BookingStep>(BookingStep.DATE_SELECTION);

  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (userSlug) {
      fetchAvailableSlots();
    }
  }, [userSlug]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const leadTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.get(
        `${APP_BACKEND_URL}/calendar/public/available-slots`,
        {
          params: { userSlug, leadTimezone },
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );

      if (response.data?.success) {
        setAvailableSlots(response.data.data || []);
        setUserInfo(response.data.userInfo || null);
      } else {
        toast({
          title: "Error",
          description: "Failed to load available time slots",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching slots:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid booking link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlots.filter(slot => isSameDay(parseISO(slot.start), selectedDate));
  }, [selectedDate, availableSlots]);

  const availableDays = useMemo(() => {
    const days = new Set();
    availableSlots.forEach(slot => {
      days.add(format(parseISO(slot.start), "yyyy-MM-dd"));
    });
    return Array.from(days);
  }, [availableSlots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      toast({
        title: "Validation Error",
        description: "Please select a time slot",
        variant: "destructive",
      });
      return;
    }

    if (!leadName || !leadEmail) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const leadTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await axios.post(
        `${APP_BACKEND_URL}/calendar/public/schedule-meeting/${userSlug}`,
        {
          leadName,
          leadEmail,
          leadMessage: leadMessage || null,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          leadTimezone,
        },
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        }
      );

      if (response.data?.success) {
        setMeetingDetails(response.data.data);
        setStep(BookingStep.SUCCESS);
        toast({
          title: "Meeting Confirmed",
          description: "You can now close this window.",
        });
      }
    } catch (error: any) {
      console.error("Error scheduling meeting:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to schedule meeting",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="relative flex justify-center items-center flex-col gap-4">
          <div className="h-16 w-16 rounded-full border-4 border-[#66B0B7]/10 border-t-[#66B0B7] animate-spin"></div>
          <div className="mt-6 text-[#66B0B7] font-semibold animate-pulse text-center uppercase tracking-widest text-[10px]">Empatech OS</div>
        </div>
      </div>
    );
  }

  const renderDateSelection = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-[1000px] h-[min(650px,85vh)] mx-auto flex flex-col md:flex-row rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-[0_22px_70px_4px_rgba(0,0,0,0.5)]"
    >
      {/* LEFT COLUMN: Info (State A) or Calendar (State B) */}
      <div className={`flex flex-col p-8 lg:p-10 border-r border-white/5 transition-all duration-300 bg-[#0a0a0a] ${selectedDate ? 'md:flex-1' : 'md:w-[350px]'}`}>
        <AnimatePresence mode="wait">
          {!selectedDate ? (
            /* INFO PANEL (State A) */
            <motion.div 
              key="info-panel"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col justify-between min-h-0"
            >
              <div>
                 <div className="flex items-center gap-2 mb-6 opacity-60">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#3F68B4] to-[#66B0B7]"></div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white">Empatech OS</span>
                  </div>
                <div className="text-[#66B0B7] font-semibold uppercase tracking-wider text-[10px] mb-2">Booking Portal</div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{userInfo?.meetingTitle || "30 Minute Meeting"}</h1>
                <div className="flex flex-col gap-3 pt-4">
                  <div className="flex items-center gap-3 text-white/50 text-xs font-medium">
                    <Clock className="w-4 h-4 text-white/30" />
                    <span>30 min</span>
                  </div>
                  <div className="flex items-start gap-3 text-white/50 text-xs font-medium leading-relaxed">
                    <CalendarDays className="w-4 h-4 mt-0.5 text-white/30" />
                    <span>Video conferencing details provided upon confirmation.</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                 <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-4">Host</div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3F68B4] to-[#66B0B7] flex items-center justify-center text-white text-sm font-bold shadow-lg">
                      {userInfo?.name?.[0].toUpperCase() || "H"}
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">{userInfo?.name || "Our Team"}</div>
                      <div className="text-white/30 text-[10px] font-medium">Empatech Expert</div>
                    </div>
                 </div>
              </div>
            </motion.div>
          ) : (
            /* CALENDAR PANEL (State B) */
            <motion.div 
              key="calendar-panel-left"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col h-full w-full"
            >
               <div className="w-full flex justify-start mb-6 shrink-0">
                 <button 
                    onClick={() => setSelectedDate(undefined)}
                    className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition-colors tracking-widest flex items-center gap-1.5 group px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10"
                  >
                    <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                  </button>
               </div>

                <div className="flex-1 w-full flex items-center justify-center scale-100">
                  <div className="w-full max-w-[340px]">
                   <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }
                      }}
                      disabled={(date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        return !availableDays.includes(dateStr) || date < new Date(new Date().setHours(0,0,0,0));
                      }}
                      className="p-0 border-0 w-full"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-1 relative items-center mb-6",
                        caption_label: "text-sm font-medium text-white tracking-widest",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-white/5 rounded-md transition-all text-white",
                        nav_button_previous: "absolute left-0",
                        nav_button_next: "absolute right-0",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full justify-between",
                        head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.65rem] tracking-wider text-center",
                        row: "flex w-full mt-2 justify-between",
                        cell: "h-9 w-9 text-center p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-semibold text-xs  aria-selected:opacity-100 hover:bg-white/10 rounded-full transition-all text-white/70 hover:text-white focus:outline-none focus:ring-0",
                        day_selected: "bg-[#3F68B4] text-white hover:bg-[#3F68B4]! hover:text-white! focus:bg-[#3F68B4]! focus:text-white! shadow-[0_4px_14px_0_rgba(63,104,180,0.39)]",
                        day_today: "text-[#66B0B7] font-extrabold",
                        day_outside: "text-muted-foreground opacity-30",
                        day_disabled: "text-muted-foreground opacity-20 font-normal",
                        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT COLUMN: Calendar (State A) or Slots (State B) */}
      <div className="flex flex-col flex-1 bg-[#0a0a0a] font-[Poppins]">
        <AnimatePresence mode="wait">
          {!selectedDate ? (
            /* CALENDAR VIEW (State A) */
            <motion.div 
              key="large-calendar-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col p-8 lg:p-10 justify-center items-center"
            >
              <div className="mb-8 text-center">
                <h3 className="text-xl font-semibold text-white tracking-wide">Select a Date</h3>
              </div>
              
              <div className="scale-100 w-full flex justify-center">
                 <div className="w-full max-w-[340px]">
                   <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    disabled={(date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      return !availableDays.includes(dateStr) || date < new Date(new Date().setHours(0,0,0,0));
                    }}
                    className="p-0 border-0 w-full"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center mb-6",
                      caption_label: "text-sm font-medium text-white tracking-widest",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-white/5 rounded-md transition-all text-white",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full justify-between",
                      head_cell: "text-muted-foreground rounded-md w-9 font-medium text-[0.65rem] tracking-wider text-center",
                      row: "flex w-full mt-2 justify-between",
                      cell: "h-9 w-9 text-center text-xs p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-medium aria-selected:opacity-100 hover:bg-white/5 rounded-full transition-all text-white/70 hover:text-white focus:outline-none focus:ring-0",
                      day_selected: "bg-gradient-to-tr from-[#69B4B7] via-[#5486D0] to-[#3E64B3] border-none text-white shadow-lg shadow-blue-500/20 hover:!bg-gradient-to-tr hover:!from-[#69B4B7] hover:!via-[#5486D0] hover:!to-[#3E64B3] hover:!text-white opacity-100 hover:opacity-100 focus:!bg-gradient-to-tr focus:!from-[#69B4B7] focus:!via-[#5486D0] focus:!to-[#3E64B3] focus:!text-white",
                      day_today: "text-[#66B0B7] font-extrabold relative after:absolute after:bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#66B0B7] after:rounded-full",
                      day_outside: "text-muted-foreground opacity-30",
                      day_disabled: "text-muted-foreground opacity-20 font-normal",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                 </div>
              </div>

              <div className="mt-12 flex items-center justify-center gap-2 opacity-50">
                <Globe className="w-3 h-3 text-white" />
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">{Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')}</span>
              </div>
            </motion.div>
          ) : (
            /* SLOTS VIEW (State B) */
             <motion.div 
              key="slots-view-right"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col p-8 lg:p-10 overflow-hidden"
            >
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white tracking-wide">Available Times</h3>
                <p className="text-[#66B0B7] text-[10px] font-semibold mt-1 tracking-widest ">
                  {format(selectedDate, "EEEE, MMMM do")}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {slotsForSelectedDate.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
                    {slotsForSelectedDate.map((slot, index) => (
                      <div key={index} className="relative">
                        <button
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full py-3 px-4 rounded-lg font-medium tracking-wide transition-all text-sm border ${
                            selectedSlot === slot
                              ? "bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] border-transparent text-white shadow-lg"
                              : "bg-white/5 border-white/5 text-white/60 hover:border-white/10 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {formatTime(slot.start)}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center flex-col gap-4 text-white/20 h-full">
                    <Clock className="w-8 h-8 opacity-50" />
                    <span className="text-xs font-bold tracking-widest uppercase">No slots available</span>
                  </div>
                )}
              </div>

              {selectedSlot && (
                 <div className="pt-6 mt-6 border-t border-white/5">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setStep(BookingStep.DETAILS)}
                      className="w-full h-[56px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-white hover:brightness-110 rounded-[18px] font-semibold transition-all shadow-lg active:scale-[0.98] uppercase tracking-wider text-sm"
                    >
                      Next Step
                    </motion.button>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderDetails = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full max-w-[900px] h-[min(650px,90vh)] mx-auto flex flex-col md:flex-row rounded-[1.5rem] overflow-hidden border border-white/5 bg-[#0a0a0a] shadow-[0_22px_70px_4px_rgba(0,0,0,0.5)]"
    >
      {/* Sidebar Summary */}
      <div className="p-8 lg:p-10 border-r border-white/5 bg-[#0a0a0a] md:w-[320px] flex flex-col font-[Poppins]">
        <button 
          onClick={() => setStep(BookingStep.DATE_SELECTION)}
           className="text-[10px] uppercase font-bold text-white/30 hover:text-white transition-colors tracking-widest flex items-center gap-1.5 group mb-8 self-start px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="space-y-8 flex-1">
          <div>
            <div className="text-[#66B0B7] text-[10px] uppercase tracking-widest font-semibold mb-2">Meeting Details</div>
            <h2 className="text-xl font-bold text-white leading-tight tracking-wide uppercase">{userInfo?.meetingTitle || "30 Minute Meeting"}</h2>
            <div className="flex items-center gap-2 text-white/40 text-[10px] font-medium mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wide">30 min</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-white/30 text-[10px] uppercase tracking-widest font-semibold">Selected Slot</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/80">
                <CalendarDays className="w-4 h-4 text-[#3F68B4]" />
                <div>
                  <div className="text-sm font-semibold text-white tracking-wide">{selectedDate && format(selectedDate, "EEE, MMM do")}</div>
                  <div className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">2026</div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Clock className="w-4 h-4 text-[#3F68B4]" />
                <div>
                  <div className="text-sm font-semibold text-white tracking-wide">{selectedSlot && formatTime(selectedSlot.start)}</div>
                  <div className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">Local Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center bg-[#0a0a0a]">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white tracking-wider mb-1 ">Enter Details</h2>
          <p className="text-white/30 text-[10px] font-medium  ">Share a bit about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 font-[Poppins]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-white/70">Full Name</Label>
              <Input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
                placeholder="John Doe"
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/70">Email Address</Label>
              <Input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                required
                placeholder="john@example.com"
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/70">Notes (Optional)</Label>
              <Textarea
                value={leadMessage}
                onChange={(e) => setLeadMessage(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px] resize-none"
                placeholder="Anything specific to discuss?"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={submitting}
               className="mt-2 h-[56px] w-full rounded-[18px] bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] text-lg font-semibold text-white transition-all hover:brightness-110"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Scheduling...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Confirm Meeting</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>
             <p className="text-[10px] text-center text-white/40 font-[Poppins] mt-4">
                You'll receive a calendar invite shortly.
             </p>
          </div>
        </form>
      </div>
    </motion.div>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({
      title: "Copied!",
      description: "Meeting link copied to clipboard",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderSuccess = () => (
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="max-w-md mx-auto w-full font-[Poppins]"
    >
      <Card className="border border-white/5 bg-[#0a0a0a] text-white shadow-2xl rounded-[1.5rem] overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#3F68B4] to-[#66B0B7]"></div>
        <CardHeader className="text-center pt-10 pb-6">
          <motion.div 
            initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#66B0B7]/10 flex items-center justify-center border border-[#66B0B7]/20 text-[#66B0B7]"
          >
            <CheckCircle className="w-8 h-8" />
          </motion.div>
          <CardTitle className="text-xl font-bold uppercase tracking-wide">Confirmed</CardTitle>
          <CardDescription className="text-white/40 text-sm mt-2">
            You are scheduled with {userInfo?.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-10">
          <div className="bg-white/5 border border-white/5 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-4">
               <CalendarDays className="w-5 h-5 text-[#3F68B4]" />
               <div>
                  <div className="text-white font-semibold text-sm">{selectedDate && format(selectedDate, "EEEE, MMMM do")}</div>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <Clock className="w-5 h-5 text-[#3F68B4]" />
               <div>
                  <div className="text-white font-semibold text-sm">{selectedSlot && formatTime(selectedSlot.start)} - {selectedSlot && formatTime(selectedSlot.end)}</div>
                  <div className="text-[10px] text-white/30 font-medium uppercase tracking-widest">{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
               </div>
            </div>
            {meetingDetails?.webLink && (
              <div className="pt-4 border-t border-white/10 mt-2">
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">Meeting Link</div>
                <div className="flex items-center gap-2 bg-[#0a0a0a] p-2 rounded-lg border border-white/10">
                   <div className="flex-1 truncate text-xs text-white/70 font-mono">
                      {meetingDetails.webLink}
                   </div>
                   <Button
                      onClick={() => copyToClipboard(meetingDetails.webLink)}
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white/50 hover:text-white hover:bg-white/10"
                   >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                   </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-4">
             <p className="text-xs text-white/30">A calendar invitation has been sent to <span className="text-white">{leadEmail}</span></p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] selection:bg-[#3F68B4]/30 p-4 flex items-center justify-center overflow-y-auto font-poppins">
      <div className="w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === BookingStep.DATE_SELECTION && renderDateSelection()}
          {step === BookingStep.DETAILS && renderDetails()}
          {step === BookingStep.SUCCESS && renderSuccess()}
        </AnimatePresence>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
