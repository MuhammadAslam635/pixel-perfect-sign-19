import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InboxIcon, Send, Star, ChevronRight, ChevronDown, } from "lucide-react";
import { InboxCategory, InboxFilter } from "@/types/inboxfilters.types";

interface InboxSidebarProps {
    filter: InboxFilter;
    showCategories: boolean;
    onFilterChange: (filter: InboxFilter) => void;
    onToggleCategories: () => void;
    stats: {
        receivedEmails: number;
        sentEmails: number;
        starredEmails: number;
    };
}

const InboxSidebar = ({
    filter,
    showCategories,
    onFilterChange,
    onToggleCategories,
    stats,
}: InboxSidebarProps) => {
    const categoryFilters: InboxCategory[] = [
        "Client Communication",
        "Marketing & Promotions",
        "Internal Communication",
        "Primary",
        "Promotions",
        "Social",
        "Updates",
        "Spam",
    ];

    return (
        <Card
            className="border-[#FFFFFF4D] h-full"
            style={{
                borderRadius: "30px",
                borderWidth: "1px",
                background:
                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
        >
            <CardHeader>
                <CardTitle className="text-lg text-white">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto">
                <Button
                    variant={filter === "all" && !showCategories ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${filter === "all" && !showCategories
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    onClick={onToggleCategories}
                >
                    <InboxIcon className="h-4 w-4 mr-2" />
                    Inbox
                    <div className="ml-auto flex items-center gap-1">
                        <Badge className="bg-white/15 text-white border-white/20">
                            {stats.receivedEmails ?? 0}
                        </Badge>
                        {showCategories ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                        )}
                    </div>
                </Button>
                {showCategories && (
                    <div className="space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200 px-1">
                        {categoryFilters.map((category) => (
                            <Button
                                key={category}
                                variant={filter === category ? "default" : "ghost"}
                                className={`w-[calc(100%-24px)] ml-6 rounded-full pl-3 pr-2 text-xs text-left whitespace-normal h-auto py-1.5 ${filter === category
                                    ? "bg-white/15 text-white border border-white/20"
                                    : "text-white/60 hover:text-white hover:bg-white/10"
                                    }`}
                                onClick={() => onFilterChange(category)}
                            >
                                <div className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0" />
                                <span className="flex-1">{category}</span>
                            </Button>
                        ))}
                    </div>
                )}
                <Button
                    variant={filter === "sent" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${filter === "sent"
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    onClick={() => onFilterChange("sent")}
                >
                    <Send className="h-4 w-4 mr-2" />
                    Sent
                    <Badge className="ml-auto bg-white/15 text-white border-white/20">
                        {stats.sentEmails ?? 0}
                    </Badge>
                </Button>
                <Button
                    variant={filter === "starred" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${filter === "starred"
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                        }`}
                    onClick={() => onFilterChange("starred")}
                >
                    <Star className="h-4 w-4 mr-2" />
                    Starred
                    <Badge className="ml-auto bg-white/15 text-white border-white/20">
                        {stats.starredEmails ?? 0}
                    </Badge>
                </Button>
            </CardContent>
        </Card>
    );
};


export default InboxSidebar;