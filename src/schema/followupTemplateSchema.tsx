import z from "zod";

export const followupTemplateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    startDate: z.date().optional(),
    numberOfDaysToRun: z
        .string()
        .min(1, "Number of days is required")
        .regex(/^\d+$/, "Days must be a positive number"),
    numberOfEmails: z
        .string()
        .min(1, "Number of emails is required")
        .regex(/^\d+$/, "Emails must be a positive number"),
    numberOfCalls: z
        .string()
        .min(1, "Number of calls is required")
        .regex(/^\d+$/, "Calls must be a positive number"),
    numberOfWhatsappMessages: z
        .string()
        .min(1, "Number of WhatsApp messages is required")
        .regex(/^\d+$/, "Messages must be a positive number"),
    timeOfDayToRun: z.string().optional(),
});

export const defaultFormValues = {
    title: "",
    startDate: undefined,
    numberOfDaysToRun: "5",
    numberOfEmails: "3",
    numberOfCalls: "2",
    numberOfWhatsappMessages: "2",
    timeOfDayToRun: "09:00",
}