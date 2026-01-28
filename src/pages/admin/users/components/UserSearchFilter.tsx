import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type UserSearchFilterProps = {
    searchTerm: string;
    onSearchChange: (value: string) => void;

    statusFilter: "all" | "active" | "inactive";
    onStatusChange: (value: "all" | "active" | "inactive") => void;

    placeholder?: string;
};

export const UserSearchFilter = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    placeholder = "Search users by name, email, or company...",
}: UserSearchFilterProps) => {
    const showClear = searchTerm || statusFilter !== "all";

    return (
        <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                        <Input
                            type="search"
                            value={searchTerm}
                            placeholder={placeholder}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 w-full rounded-full bg-black/35 border border-white/10 text-white placeholder:text-white/50 focus:ring-2 focus:ring-cyan-400/40"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={onStatusChange}>
                            <SelectTrigger className="w-[150px] bg-black/35 border border-white/10 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        {showClear && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onSearchChange("");
                                    onStatusChange("all");
                                }}
                                className="bg-black/35 border border-white/10 text-white/70 hover:text-white"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
