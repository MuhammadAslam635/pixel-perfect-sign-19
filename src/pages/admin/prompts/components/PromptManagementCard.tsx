import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Prompt } from "@/services/connectionMessages.service";
import { getStageLabel } from "@/utils/prompt";

interface Props {
    prompt: Prompt;
    borderColor: string;
    onEdit: (p: Prompt) => void;
    onDelete: (p: Prompt) => void;
}

export const PromptCard = ({
    prompt,
    borderColor,
    onEdit,
    onDelete,
}: Props) => {
    return (
        <div
            className={`${borderColor} bg-black/20 rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-200 shadow-sm`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-white/70 font-medium capitalize text-sm">
                            {prompt.promptCategory.replace("_", " ")}
                        </span>

                        <Badge
                            variant="outline"
                            className="text-xs border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                        >
                            {getStageLabel(prompt.stage)}
                        </Badge>

                        {prompt.company?.name && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">
                                {prompt.company.name}
                            </Badge>
                        )}

                        {prompt.name && (
                            <Badge variant="outline" className="text-xs border-white/20">
                                {prompt.name}
                            </Badge>
                        )}
                    </div>

                    {prompt.description && (
                        <p className="text-white/50 text-sm mb-2">
                            {prompt.description}
                        </p>
                    )}

                    <p className="text-white/60 text-sm line-clamp-2 break-words">
                        {prompt.content.substring(0, 150)}...
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(prompt)} className="h-8 w-8 p-0">
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(prompt)} className="h-8 w-8 p-0 text-red-400">
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
