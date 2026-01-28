import { Prompt } from "@/services/connectionMessages.service";

export const isGlobalPrompt = (prompt: Prompt): boolean => {
    const id = prompt.companyId as any;

    if (id === null || id === undefined) return true;
    if (typeof id === "object") return !id?._id;
    if (typeof id === "string") return id.trim().length === 0;

    return true;
};

export const isCompanyPrompt = (prompt: Prompt): boolean =>
    !isGlobalPrompt(prompt);

export const getStageLabel = (stage?: string) => {
    const map: Record<string, string> = {
        general: "General",
        new: "New Lead",
        interested: "Interested",
        followup: "Follow-up",
        appointment_booked: "Appointment",
        proposal_sent: "Proposal",
        followup_close: "Closing",
        closed: "Closed",
    };

    return map[stage ?? ""] ?? stage;
};
