import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

interface WorkingHours {
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  timeZone: string;
}

interface AvailabilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: "Pacific Standard Time", label: "Pacific Time (US & Canada)" },
  { value: "Mountain Standard Time", label: "Mountain Time (US & Canada)" },
  { value: "Central Standard Time", label: "Central Time (US & Canada)" },
  { value: "Eastern Standard Time", label: "Eastern Time (US & Canada)" },
  { value: "GMT Standard Time", label: "London" },
  { value: "Central European Standard Time", label: "Central Europe" },
  { value: "Pakistan Standard Time", label: "Islamabad, Karachi" },
  { value: "India Standard Time", label: "Mumbai, New Delhi" },
  { value: "UTC", label: "UTC" },
];

export function AvailabilitySettings({ open, onOpenChange }: AvailabilitySettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    startTime: "09:00",
    endTime: "17:00",
    timeZone: "UTC",
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
          timeZone: workingHours.timeZone,
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
    setWorkingHours((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Your Availability</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Hours Section */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Weekly hours</Label>
              <p className="text-sm text-muted-foreground mb-4">
                Set when you are typically available for meetings
              </p>

              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isEnabled = workingHours.daysOfWeek.includes(day.value);
                  return (
                    <div
                      key={day.value}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3 w-32">
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => toggleDay(day.value)}
                        />
                        <Label className="text-sm font-medium cursor-pointer">
                          {day.label}
                        </Label>
                      </div>

                      {isEnabled ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={workingHours.startTime}
                            onValueChange={(value) =>
                              setWorkingHours((prev) => ({ ...prev, startTime: value }))
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-muted-foreground">—</span>

                          <Select
                            value={workingHours.endTime}
                            onValueChange={(value) =>
                              setWorkingHours((prev) => ({ ...prev, endTime: value }))
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex-1 text-sm text-muted-foreground">
                          Unavailable
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timezone Section */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Time zone</Label>
              <Select
                value={workingHours.timeZone}
                onValueChange={(value) =>
                  setWorkingHours((prev) => ({ ...prev, timeZone: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
