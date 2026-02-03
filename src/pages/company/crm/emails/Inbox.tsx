import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailViewer } from "@/pages/company/crm/emails/components/EmailViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import { Search, Inbox as InboxIcon, } from "lucide-react";
import { stripQuotedEmailContent } from "@/helpers/email";
import InboxHeader from "./components/InboxHeader";
import InboxSidebar from "./components/InboxSidebar";
import InboxEmailList from "./components/InboxEmailList";
import { InboxFilter } from "@/types/inboxfilters.types";

const InboxPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [showCategories, setShowCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const limit = 20;

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ["inbox", filter, showCategories, page],
    queryFn: () => {
      if (filter === "sent") {
        return emailService.getSentEmails({ page, limit, starred: false });
      }
      return emailService.getInboxEmails({
        page, limit,
        starred: filter === "starred" ? true : undefined,
        category: ["all", "starred", "sent"].includes(filter) ? undefined : (filter as "Client Communication" | "Marketing & Promotions" | "Internal Communication" | "Primary" | "Promotions" | "Social" | "Updates" | "Spam"),
      });
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["emailStats"],
    queryFn: () => emailService.getEmailStats(),
  });

  const { data: sentStarredData } = useQuery({
    queryKey: ["sentStarred", page],
    queryFn: () => emailService.getSentEmails({ page, limit, starred: true }),
    enabled: filter === "starred",
  });

  const markReadMutation = useMutation({
    mutationFn: ({ emailId, isRead }: { emailId: string; isRead: boolean }) => emailService.markEmailRead(emailId, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) => emailService.starEmail(emailId, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      queryClient.invalidateQueries({ queryKey: ["sentStarred"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (emailId: string) => emailService.deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      toast({ title: "Email deleted", description: "The email has been deleted successfully.", });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete email. Please try again.", });
    },
  });

  const baseEmails = filter === "starred"
    ? [...(inboxData?.data?.emails || []),
    ...(sentStarredData?.data?.emails || []),
    ]
    : inboxData?.data?.emails || [];

  const filteredEmails =
    baseEmails
      ?.filter((email) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        const cleanedBodyText = email.body.text ? stripQuotedEmailContent(email.body.text) : "";
        return (
          email.subject?.toLowerCase().includes(searchLower) ||
          email.from.email.toLowerCase().includes(searchLower) ||
          email.from.name?.toLowerCase().includes(searchLower) ||
          cleanedBodyText.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsDrawerOpen(true);
    // Mark email as read when opened
    if (!email.isRead) {
      markReadMutation.mutate({ emailId: email._id, isRead: true });
    }
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const replyTo = selectedEmail.direction === "inbound" ? selectedEmail.from.email : selectedEmail.to[0]?.email;
    setIsDrawerOpen(false);
    navigate(`/emails/compose?to=${replyTo}&subject=${encodeURIComponent(selectedEmail.subject)}&threadId=${selectedEmail.threadId || ""}`);
  };

  const handleEmailStar = (isStarred: boolean) => {
    if (!selectedEmail) return;
    starMutation.mutate({ emailId: selectedEmail._id, isStarred });
    setSelectedEmail({ ...selectedEmail, isStarred });
  };

  const handleEmailMarkRead = (isRead: boolean) => {
    if (!selectedEmail) return;
    markReadMutation.mutate({ emailId: selectedEmail._id, isRead });
    setSelectedEmail({ ...selectedEmail, isRead });
  };

  const handleEmailDelete = () => {
    if (!selectedEmail) return;
    deleteMutation.mutate(selectedEmail._id);
    setIsDrawerOpen(false);
    setSelectedEmail(null);
  };

  return (
    <DashboardLayout>
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} className="max-w-[1600px] mx-auto w-full min-h-0">
          {/* Wrapper with space-between */}
          <div className="flex items-center justify-between mb-4">
            {/* Page Header with Navigation */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}         >
              <CrmNavigation />
            </motion.div>
          </div>

          <div className="flex flex-col gap-6 text-white flex-1 overflow-hidden w-full pb-8">
            {/* Header */}
            <InboxHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} unreadEmails={statsData?.data?.unreadEmails || 0} totalEmails={statsData?.data?.totalEmails || 0} />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)] min-h-0">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-4">
                <InboxSidebar filter={filter} showCategories={showCategories}
                  onFilterChange={(newFilter) => {
                    setFilter(newFilter);
                    setPage(1);
                  }}
                  onToggleCategories={() => {
                    setShowCategories(!showCategories);
                    if (showCategories) {
                      setFilter("all");
                    }
                    setPage(1);
                  }}
                  stats={{ receivedEmails: statsData?.data?.receivedEmails || 0, sentEmails: statsData?.data?.sentEmails || 0, starredEmails: statsData?.data?.starredEmails || 0, }}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
                {/* Search and Pagination Row */}
                <div className="flex gap-4 items-center">
                  {/* Search - 75% Width */}
                  <div className="relative flex-[3]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                    <Input placeholder="Search emails..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-9 rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full" style={{
                      background: "#FFFFFF1A",
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      borderRadius: "9999px",
                    }}
                    />
                  </div>

                  {/* Pagination - 25% Width */}
                  {inboxData?.data?.pagination &&
                    inboxData.data.pagination.pages > 1 && (
                      <div className="flex items-center justify-between gap-2 flex-[1]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50 px-4"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-white/70 whitespace-nowrap">
                          Page {page} of {inboxData.data.pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPage((p) =>
                              Math.min(inboxData.data.pagination.pages, p + 1)
                            )
                          }
                          disabled={page === inboxData.data.pagination.pages}
                          className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50 px-4"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                </div>

                {/* Email List */}
                <InboxEmailList emails={filteredEmails} isLoading={isLoading} filter={filter} searchTerm={searchTerm} pagination={inboxData?.data?.pagination || null} onPageChange={setPage} onEmailClick={handleEmailClick} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.main>
      {/* Email Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto scrollbar-hide"        >
          <SheetHeader>
            <SheetTitle>Email Details</SheetTitle>
          </SheetHeader>
          {selectedEmail && (
            <div className="mt-4">
              <EmailViewer
                email={selectedEmail}
                onStar={handleEmailStar}
                onMarkRead={handleEmailMarkRead}
                onDelete={handleEmailDelete}
                onReply={handleReply}
                isLoading={starMutation.isPending || markReadMutation.isPending || deleteMutation.isPending}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default InboxPage;