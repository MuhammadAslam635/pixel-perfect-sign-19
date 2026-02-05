import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import axios from "axios";

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

interface AvailabilitySlot {
  start: string;
  end: string;
}

interface WorkingHours {
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  timeZone: string;
  availabilitySlots: Record<string, AvailabilitySlot[]>;
}

interface AvailabilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileTimezone?: string | null;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

// Generate time options in 30-minute intervals
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      options.push(timeStr);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function AvailabilitySettings({ open, onOpenChange, profileTimezone }: AvailabilitySettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "09:00",
    endTime: "17:00",
    timeZone: "UTC",
    availabilitySlots: {
      monday: [{ start: "09:00", end: "17:00" }],
      tuesday: [{ start: "09:00", end: "17:00" }],
      wednesday: [{ start: "09:00", end: "17:00" }],
      thursday: [{ start: "09:00", end: "17:00" }],
      friday: [{ start: "09:00", end: "17:00" }],
      saturday: [],
      sunday: [],
    },
  });

  useEffect(() => {
    if (open) {
      fetchWorkingHours();
    }
  }, [open]);

  const fetchWorkingHours = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await axios.get(`${APP_BACKEND_URL}/microsoft/availability`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (response.data?.success) {
        const data = response.data.data;
        setWorkingHours({
          daysOfWeek: data.daysOfWeek || [],
          startTime: data.startTime?.substring(0, 5) || "09:00", // Convert HH:mm:ss to HH:mm
          endTime: data.endTime?.substring(0, 5) || "17:00",
          timeZone: data.timeZone || "UTC",
          availabilitySlots: data.availabilitySlots || {
            monday: [{ start: "09:00", end: "17:00" }],
            tuesday: [{ start: "09:00", end: "17:00" }],
            wednesday: [{ start: "09:00", end: "17:00" }],
            thursday: [{ start: "09:00", end: "17:00" }],
            friday: [{ start: "09:00", end: "17:00" }],
            saturday: [],
            sunday: [],
          },
        });
      }
    } catch (error: any) {
      console.error("Error fetching working hours:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load working hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (workingHours.daysOfWeek.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await axios.patch(
        `${APP_BACKEND_URL}/microsoft/availability`,
        {
          daysOfWeek: workingHours.daysOfWeek,
          startTime: workingHours.startTime,
          endTime: workingHours.endTime,
          timeZone: profileTimezone || workingHours.timeZone, // Use profile timezone if available
          availabilitySlots: workingHours.availabilitySlots,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.data?.success) {
        toast({
          title: "Success",
          description: "Working hours updated successfully in Microsoft Calendar",
        });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error saving working hours:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update working hours",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingHours((prev) => {
      const isCurrentlyEnabled = prev.daysOfWeek.includes(day);
      let newDays = isCurrentlyEnabled
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day];
      
      let newSlots = { ...prev.availabilitySlots };
      if (!isCurrentlyEnabled && (!newSlots[day] || newSlots[day].length === 0)) {
        newSlots[day] = [{ start: "09:00", end: "17:00" }];
      }
      
      return {
        ...prev,
        daysOfWeek: newDays,
        availabilitySlots: newSlots
      };
    });
  };

  const addSlot = (day: string) => {
    setWorkingHours((prev) => {
      const slots = prev.availabilitySlots?.[day] || [];
      return {
        ...prev,
        availabilitySlots: {
          ...prev.availabilitySlots,
          [day]: [...slots, { start: "09:00", end: "17:00" }],
        },
      };
    });
  };

  const removeSlot = (day: string, index: number) => {
    setWorkingHours((prev) => {
      const slots = [...(prev.availabilitySlots?.[day] || [])];
      slots.splice(index, 1);
      
      return {
        ...prev,
        availabilitySlots: {
          ...prev.availabilitySlots,
          [day]: slots,
        },
      };
    });
  };

  const updateSlot = (day: string, index: number, field: "start" | "end", value: string) => {
    setWorkingHours((prev) => {
      const slots = [...(prev.availabilitySlots?.[day] || [])];
      slots[index] = { ...slots[index], [field]: value };
      
      // Update legacy startTime/endTime (use first slot of the first active day)
      let firstSlot = slots[0];
      let newState = {
        ...prev,
        availabilitySlots: {
          ...prev.availabilitySlots,
          [day]: slots,
        },
      };

      if (day === prev.daysOfWeek[0] && index === 0) {
        newState.startTime = firstSlot.start;
        newState.endTime = firstSlot.end;
      }

      return newState;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
        style={{
          background: "#0a0a0a"
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}
        />

        <div className="relative z-10 flex flex-col h-full min-h-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">Set Your Availability</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 space-y-6 scrollbar-hide py-4 min-h-0">
                {/* Weekly Hours Section */}
                <div>
                  <Label className="text-xs text-white/70 mb-3 block">Weekly hours</Label>
                  <p className="text-[10px] text-white/50 mb-4">
                    Set when you are typically available for meetings
                  </p>

                  <div className="space-y-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isEnabled = workingHours.daysOfWeek.includes(day.value);
                      return (
                        <div
                          key={day.value}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                        >
                          <div className="flex items-center gap-3 pt-1 w-32">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => toggleDay(day.value)}
                            />
                            <span className="text-white text-xs font-medium min-w-[70px]">
                              {day.label}
                            </span>
                          </div>

                          {isEnabled ? (
                            <div className="flex flex-col gap-3 flex-1">
                              {(workingHours.availabilitySlots?.[day.value] || []).map((slot, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Select
                                    value={slot.start}
                                    onValueChange={(value) => updateSlot(day.value, index, "start", value)}
                                  >
                                    <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-white text-[10px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-white/10 max-h-[200px]">
                                      {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time} className="text-[10px]">
                                          {time}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <span className="text-white/40">—</span>

                                  <Select
                                    value={slot.end}
                                    onValueChange={(value) => updateSlot(day.value, index, "end", value)}
                                  >
                                    <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-white text-[10px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-white/10 max-h-[200px]">
                                      {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time} className="text-[10px]">
                                          {time}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  {workingHours.availabilitySlots[day.value].length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-400/10"
                                      onClick={() => removeSlot(day.value, index)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  )}

                                  {index === workingHours.availabilitySlots[day.value].length - 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
                                      onClick={() => addSlot(day.value)}
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex-1 text-[10px] text-white/40">
                              Unavailable
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 flex-shrink-0 border-t border-white/10 flex justify-end gap-2">
                <Button 
                  variant="ghost" 
                  className="text-white/70 hover:bg-white hover:text-black transition-all"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSave} 
                  disabled={saving}
                  className="bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:brightness-110 transition-all"
                  style={{
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
