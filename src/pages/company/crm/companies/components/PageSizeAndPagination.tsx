import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronsLeft, ChevronsRight, Grid3X3, LayoutGrid, List } from "lucide-react";

type ViewMode = "compact" | "detailed" | "card";

type Props = {
    position: "top" | "bottom";
    page: number;
    pageSize: number;
    totalCompanies: number;
    calculatedTotalPages: number;
    paginationPages: (number | "ellipsis")[] | null;
    pageSizeOptions: number[];
    viewMode?: ViewMode;
    onViewModeChange?: (mode: ViewMode) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
};

const PageSizeAndPagination = ({
    position,
    page,
    pageSize,
    totalCompanies,
    calculatedTotalPages,
    paginationPages,
    pageSizeOptions,
    viewMode,
    onViewModeChange,
    onPageChange,
    onPageSizeChange,
}: Props) => {
    const hasData = totalCompanies > 0;
    const start = hasData ? (page - 1) * pageSize + 1 : 0;
    const end = hasData ? Math.min(page * pageSize, totalCompanies) : 0;

    return (
        <div
            className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${position === "top" ? "mb-4" : "mt-4"
                }`}
        >
            <div>
                {position === "top" && onViewModeChange && (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
                        {(["compact", "card", "detailed"] as ViewMode[]).map((mode) => (
                            <Button
                                key={mode}
                                variant={viewMode === mode ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onViewModeChange(mode)}
                                className={`h-9 px-3 rounded-full text-xs ${viewMode === mode
                                    ? "bg-primary text-white"
                                    : "text-white/70 hover:bg-white/10"
                                    }`}
                            >
                                {mode === "compact" && <Grid3X3 className="w-3 h-3 mr-1.5" />}
                                {mode === "card" && <LayoutGrid className="w-3 h-3 mr-1.5" />}
                                {mode === "detailed" && <List className="w-3 h-3 mr-1.5" />}
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-white/60 pr-5">
                    {hasData
                        ? `Showing ${start}-${end} of ${totalCompanies} companies`
                        : "No companies to display"}
                </p>

                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1">
                    <Select
                        value={String(pageSize)}
                        onValueChange={(v) => onPageSizeChange?.(Number(v))}
                    >
                        <SelectTrigger className="h-7 w-[175px] rounded-full text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {pageSizeOptions.map((opt) => (
                                <SelectItem key={opt} value={String(opt)}>
                                    {opt} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {position === "top" &&
                        calculatedTotalPages > 1 &&
                        paginationPages && (
                            <>
                                <div className="h-4 w-px bg-white/20 mx-1" />
                                <Pagination>
                                    <PaginationContent className="gap-1">
                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={() => onPageChange?.(1)}
                                                aria-label="First"
                                            >
                                                <ChevronsLeft className="h-4 w-4" />
                                            </PaginationLink>
                                        </PaginationItem>

                                        {paginationPages.map((p, i) => (
                                            <PaginationItem key={i}>
                                                {p === "ellipsis" ? (
                                                    <PaginationEllipsis />
                                                ) : (
                                                    <PaginationLink
                                                        isActive={p === page}
                                                        onClick={() => onPageChange?.(p)}
                                                    >
                                                        {p}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationLink
                                                onClick={() =>
                                                    onPageChange?.(calculatedTotalPages)
                                                }
                                                aria-label="Last"
                                            >
                                                <ChevronsRight className="h-4 w-4" />
                                            </PaginationLink>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </>
                        )}
                </div>
            </div>
        </div>
    );
};

export default PageSizeAndPagination;
