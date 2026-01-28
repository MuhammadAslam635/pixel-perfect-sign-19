import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/components/ui/select";

export const PromptTypeSection = ({ formData, onChange }: any) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
            <Label
                htmlFor="promptType"
                className="text-white/80 mb-2 flex items-center gap-2"
            >
                Prompt Type <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                    Required</Badge>
            </Label>
            <Select
                value={formData.promptType}
                onValueChange={(v) => onChange("promptType", v)}
            >
                <SelectTrigger className="bg-black/30 border-white/10 text-white hover:border-cyan-500/40 transition-colors">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">Whatsapp</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
            <Label
                htmlFor="promptCategory"
                className="text-white/80 mb-2 flex items-center gap-2"
            >
                Category <Badge>Required</Badge>
            </Label>
            <Select
                value={formData.promptCategory}
                onValueChange={(v) => onChange("promptCategory", v)}
            >
                <SelectTrigger className="bg-black/30 border-white/10 text-white hover:border-cyan-500/40 transition-colors">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="human">Human</SelectItem>
                    <SelectItem value="bulk_system">Bulk System</SelectItem>
                    <SelectItem value="bulk_human">Bulk Human</SelectItem>
                    <SelectItem value="enhance_system">Enhance System</SelectItem>
                    <SelectItem value="enhance_human">Enhance Human</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div>
            <Label
                htmlFor="stage"
                className="text-white/80 mb-2 flex items-center gap-2"
            >
                <span>Lead Stage</span>
                <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
                    Optional
                </Badge>
            </Label>
            <Select
                value={formData.stage || "general"}
                onValueChange={(v) => onChange("stage", v)}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="general">General (Fallback)</SelectItem>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                    <SelectItem value="followup_close">Follow-up to Close</SelectItem>
                    <SelectItem value="closed">Closed/Won</SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
);
