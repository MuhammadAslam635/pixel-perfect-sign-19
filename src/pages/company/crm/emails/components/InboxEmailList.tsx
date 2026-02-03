import { Email } from "@/types/email.types";
import { EmailListItem } from "@/pages/company/crm/emails/components/EmailListItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail } from "lucide-react";

interface InboxEmailListProps {
    emails: Email[];
    isLoading: boolean;
    filter: string;
    searchTerm: string;
    pagination: {
        pages: number;
        page: number;
    } | null;
    onPageChange: (page: number) => void;
    onEmailClick: (email: Email) => void;
}

const InboxEmailList = ({
    emails,
    isLoading,
    filter,
    searchTerm,
    pagination,
    onPageChange,
    onEmailClick,
}: InboxEmailListProps) => {
    const getFilterTitle = () => {
        switch (filter) {
            case "all":
                return "Inbox";
            case "sent":
                return "Sent Emails";
            case "starred":
                return "Starred Emails";
            default:
                return filter;
        }
    };

    return (
        <div className="flex flex-col gap-4 min-h-0 h-full">
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page === 1}
                        className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50 px-4"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-white/70 whitespace-nowrap">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            onPageChange(Math.min(pagination.pages, pagination.page + 1))
                        }
                        disabled={pagination.page === pagination.pages}
                        className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50 px-4"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Email List Container */}
            <div
                className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-2xl h-full overflow-y-auto scrollbar-hide"
                style={{
                    borderRadius: "30px",
                    borderWidth: "1px",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    background:
                        "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                }}
            >
                <div className="mb-2 px-2">
                    <h2 className="text-sm font-semibold text-white">{getFilterTitle()}</h2>
                </div>
                <div className="space-y-1.5 pb-4 overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="space-y-1.5">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
                            ))}
                        </div>
                    ) : emails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                                <Mail className="w-6 h-6 text-white/30" />
                            </div>
                            <p className="text-white/70 text-base font-medium mb-1">
                                No emails found
                            </p>
                            <p className="text-white/50 text-sm text-center max-w-md">
                                {searchTerm
                                    ? "Try adjusting your search terms or clear the filter to see all emails."
                                    : "Your inbox is empty."}
                            </p>
                        </div>
                    ) : (
                        emails.map((email, index) => (
                            <div
                                key={email._id}
                                className="animate-in fade-in slide-in-from-bottom-2"
                                style={{
                                    animationDelay: `${index * 30}ms`,
                                    animationFillMode: "backwards",
                                }}
                            >
                                <EmailListItem
                                    email={email}
                                    onClick={() => onEmailClick(email)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


export default InboxEmailList