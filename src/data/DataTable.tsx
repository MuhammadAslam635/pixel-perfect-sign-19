import React, { useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

/* ================= TYPES ================= */
export type Column<T> = {
    key: keyof T;
    label: string;
    render?: (row: T, index: number) => React.ReactNode;
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    className?: string;
    searchable?: boolean;
};
/* ================= COMPONENT ================= */
const DataTable = <T extends Record<string, any>>({
    columns,
    data,
    isLoading = false,
    emptyMessage = "No data found.",
    className = "",
    searchable = false,
}: DataTableProps<T>) => {
    const [search, setSearch] = useState<string>("");

    const filteredData = useMemo<T[]>(() => {
        if (!searchable || !search.trim()) return data;

        const lowerSearch = search.toLowerCase();

        return data.filter((row) =>
            columns.some((col) => {
                const value = row[col.key];
                return (
                    typeof value === "string" &&
                    value.toLowerCase().includes(lowerSearch)
                );
            })
        );
    }, [data, columns, search, searchable]);

    return (
        <div className={`flex flex-col rounded-md ${className}`}>
            {searchable && (
                <div className="p-2 sticky top-0 z-20 flex justify-end">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-60"
                    />
                </div>
            )}

            <div className="relative flex-1 overflow-y-auto">
                <Table>
                    <TableHeader className="sticky top-0 z-10">
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={String(col.key)}>
                                    {col.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {!isLoading &&
                            filteredData.map((row, index) => (
                                <TableRow key={(row as any)._id ?? index}>
                                    {columns.map((col) => (
                                        <TableCell key={String(col.key)}>
                                            {col.render
                                                ? col.render(row, index)
                                                : String(row[col.key] ?? "")}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>

                {!isLoading && filteredData.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                        {emptyMessage}
                    </p>
                )}

                {isLoading && (
                    <p className="text-center text-blue-500 py-4">Loading...</p>
                )}
            </div>
        </div>
    );
};

export default DataTable;