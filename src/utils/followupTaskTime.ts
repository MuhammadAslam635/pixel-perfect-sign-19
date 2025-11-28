import { formatDistanceToNow } from "date-fns";

/**
 * Formats the display time for a followup task based on its completion status and scheduled time
 * @param scheduledFor - The scheduled date/time string
 * @param isComplete - Whether the task is completed
 * @returns Formatted time string for display
 */
export const formatFollowupTaskTime = (
  scheduledFor?: string,
  isComplete?: boolean
): string => {
  if (!scheduledFor) {
    return "Not scheduled";
  }

  const scheduledDate = new Date(scheduledFor);
  if (Number.isNaN(scheduledDate.getTime())) {
    return "Invalid date";
  }

  const now = new Date();

  // If task is completed, show when it was completed
  if (isComplete) {
    return `Completed ${formatDistanceToNow(scheduledDate, { addSuffix: true })}`;
  }

  // If scheduled time is in the past, calculate tomorrow's time (repeat schedule)
  if (scheduledDate.getTime() < now.getTime()) {
    // Get the time portion (hours, minutes, seconds, milliseconds) from scheduled date
    const hours = scheduledDate.getHours();
    const minutes = scheduledDate.getMinutes();
    const seconds = scheduledDate.getSeconds();
    const milliseconds = scheduledDate.getMilliseconds();

    // Create tomorrow's date with the same time
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, seconds, milliseconds);

    return formatDistanceToNow(tomorrow, { addSuffix: true });
  }

  // If scheduled time is in the future, show time until execution
  return formatDistanceToNow(scheduledDate, { addSuffix: true });
};

/**
 * Gets a simple "next up" style message for pending tasks
 * @param scheduledFor - The scheduled date/time string
 * @param taskType - The type of task (email, call, whatsapp_message)
 * @returns Formatted "next up" message
 */
export const getNextUpMessage = (
  scheduledFor?: string,
  taskType?: string
): string => {
  if (!scheduledFor) {
    return "";
  }

  const timeDisplay = formatFollowupTaskTime(scheduledFor, false);
  const taskTypeDisplay = taskType ? taskType.replace("_", " ") : "task";

  return `${taskTypeDisplay} ${timeDisplay}`;
};
