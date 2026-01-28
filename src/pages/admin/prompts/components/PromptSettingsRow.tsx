import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Company } from "@/services/admin.service";
import { AIModel } from "@/services/connectionMessages.service";

interface Props {
    formData: any;
    companies: Company[];
    selectedCompany: Company | null;
    companiesLoading: boolean;
    modelsLoading: boolean;
    availableModels: AIModel[];
    onFormDataChange: Function;
    onCompanySelect: Function;
}

export const PromptSettingsRow = ({
    formData,
    companies,
    selectedCompany,
    companiesLoading,
    modelsLoading,
    availableModels,
    onFormDataChange,
    onCompanySelect,
}: Props) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
                <Label
                    htmlFor="company"
                    className="text-white/80 mb-2 flex items-center gap-2"
                >
                    <span>Company</span>
                    <Badge className="bg-white/10 text-white/60 border-white/20 text-xs">
                        Optional
                    </Badge>
                </Label>
                <Select
                    value={selectedCompany?._id || "global"}
                    onValueChange={(v) =>
                        v === "global"
                            ? onCompanySelect(null)
                            : onCompanySelect(companies.find((c) => c._id === v))
                    }
                    disabled={companiesLoading}
                >
                    <SelectTrigger className="bg-black/30 border-white/10 text-white hover:border-cyan-500/40 transition-colors">
                        <SelectValue placeholder="Select a company (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="global">Global Prompt (all companies)</SelectItem>
                        {companies.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                                {c.name}{" "}
                                {c.industry ? `(${c.industry})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {companiesLoading && (
                    <p className="text-white/50 text-xs mt-1">Loading companies...</p>
                )}
            </div>

            {/* Model */}
            <div className="flex flex-col gap-2">
                <Label
                    htmlFor="model"
                    className="text-white/80 mb-2 flex items-center gap-2"
                >
                    <span>AI Model</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                        Required
                    </Badge>
                </Label>
                <Select
                    value={formData.metadata?.model || "gpt-4o-mini"}
                    onValueChange={(v) =>
                        onFormDataChange("metadata", {
                            ...formData.metadata,
                            model: v,
                        })
                    }
                    disabled={modelsLoading}
                >
                    <SelectTrigger className="bg-black/30 border-white/10 text-white hover:border-cyan-500/40 transition-colors">
                        <SelectValue
                            placeholder={
                                modelsLoading ? "Loading models..." : "Select a model"
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {availableModels.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {modelsLoading && (
                    <p className="text-white/50 text-xs mt-1">Loading models...</p>
                )}
            </div>

            {/* Temperature */}
            <div className="flex flex-col gap-2">
                <Label
                    htmlFor="temperature"
                    className="text-white/80 mb-2 flex items-center gap-2"
                >
                    <span>Temperature</span>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs">
                        Required
                    </Badge>
                </Label>
                <Select
                    value={String(formData.metadata?.temperature?.toString() || "0.7")}
                    onValueChange={(v) =>
                        onFormDataChange("metadata", {
                            ...formData.metadata,
                            temperature: parseFloat(v),
                        })
                    }
                >
                    <SelectTrigger className="bg-black/30 border-white/10 text-white hover:border-cyan-500/40 transition-colors">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0.1">0.1 (Very Focused)</SelectItem>
                        <SelectItem value="0.3">0.3 (Focused)</SelectItem>
                        <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                        <SelectItem value="0.7">0.7 (Creative)</SelectItem>
                        <SelectItem value="0.9">0.9 (Very Creative)</SelectItem>
                        <SelectItem value="1.0">1.0 (Highly Creative)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
