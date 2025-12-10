export interface Touchpoint {
  offset_hours?: number;
  channel?: string;
  message?: string;
}

export interface ScheduleDay {
  day: number;
  date: string; // YYYY-MM-DD format
  tasks: Array<{
    type: "email" | "call" | "whatsapp_message";
    scheduledFor: string;
    notes: string;
  }>;
}

/**
 * Transform touchpoints from call analysis into schedule format
 * @param touchpoints - Array of touchpoints from call analysis
 * @param callEndTime - End time of the call (ISO string)
 * @returns Array of schedule days with tasks
 */
export function transformTouchpointsToSchedule(
  touchpoints: Touchpoint[],
  callEndTime: string
): ScheduleDay[] {
  const callEnd = new Date(callEndTime);
  const tasksByDay: Record<
    number,
    Array<{
      type: "email" | "call" | "whatsapp_message";
      scheduledFor: string;
      notes: string;
    }>
  > = {};

  touchpoints.forEach((tp) => {
    // Convert offset_hours to day (24 hours = Day 1, 48 hours = Day 2, etc.)
    const offsetHours = tp.offset_hours || 0;
    const day = Math.floor(offsetHours / 24) + 1;

    // Map channel to type
    let type: "email" | "call" | "whatsapp_message" = "email";
    if (tp.channel) {
      const channel = tp.channel.toLowerCase();
      if (channel === "call") {
        type = "call";
      } else if (channel === "whatsapp" || channel === "sms") {
        type = "whatsapp_message";
      } else if (channel === "email") {
        type = "email";
      }
    }

    // Calculate scheduled time
    const scheduledTime = new Date(callEnd);
    scheduledTime.setHours(scheduledTime.getHours() + offsetHours);
    // Default to 9 AM if time is in the past or very early
    if (scheduledTime.getHours() < 9) {
      scheduledTime.setHours(9, 0, 0, 0);
    }

    if (!tasksByDay[day]) {
      tasksByDay[day] = [];
    }

    tasksByDay[day].push({
      type,
      scheduledFor: scheduledTime.toISOString(),
      notes: tp.message || "",
    });
  });

  // Convert to schedule days array
  const maxDay = Math.max(...Object.keys(tasksByDay).map(Number), 1);
  const scheduleDays: ScheduleDay[] = [];

  for (let day = 1; day <= maxDay; day++) {
    const dayDate = new Date(callEnd);
    dayDate.setDate(dayDate.getDate() + day - 1);
    dayDate.setHours(0, 0, 0, 0);

    scheduleDays.push({
      day,
      date: dayDate.toISOString().split("T")[0],
      tasks: tasksByDay[day] || [],
    });
  }

  return scheduleDays;
}

