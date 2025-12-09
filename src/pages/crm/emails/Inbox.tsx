import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailListItem } from "@/components/email/EmailListItem";
import { EmailViewer } from "@/components/email/EmailViewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import {
  Plus,
  Search,
  Mail,
  Star,
  Inbox as InboxIcon,
  Send,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Utility function to strip quoted email content
const stripQuotedEmailContent = (content: string) => {
  if (!content) {
    return "";
  }

  const normalized = content.replace(/\r\n/g, "\n");
  const quoteRegexes = [
    /\nOn\s[\w\s,.:@]+\sat\s[\d:]+\s?[APM]+\s.+?\s?wrote:\s*/i,
    /\nOn\s.+?\swrote:\s*/i,
    /\nFrom:\s.+/i,
    /\nSent:\s.+/i,
    /\nSubject:\s.+/i,
    /\nTo:\s.+/i,
    /\nDate:\s.+/i,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\n-{2,}\s*Forwarded message\s*-{2,}/i,
  ];

  let cutoffIndex = normalized.length;
  for (const regex of quoteRegexes) {
    const matchIndex = normalized.search(regex);
    if (matchIndex !== -1 && matchIndex < cutoffIndex) {
      cutoffIndex = matchIndex;
    }
  }

  const withoutMarkers = normalized.slice(0, cutoffIndex);
  const withoutQuotedLines = withoutMarkers
    .split("\n")
    .filter(
      (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
    )
    .join("\n")
    .trim();

  if (withoutQuotedLines) {
    return withoutQuotedLines;
  }

  const fallback = normalized
    .split("\n")
    .filter(
      (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
    )
    .join("\n")
    .trim();

  return fallback || content.trim();
};

const InboxPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    | "all"
    | "unread"
    | "starred"
    | "sent"
    | "Client Communication"
    | "Marketing & Promotions"
    | "Internal Communication"
  >("all");
  const [showCategories, setShowCategories] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const limit = 20;

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ["inbox", filter, showCategories, page],
    queryFn: () => {
      if (filter === "sent") {
        return emailService.getSentEmails({
          page,
          limit,
          starred: false,
        });
      }
      return emailService.getInboxEmails({
        page,
        limit,
        unread: filter === "unread" ? true : undefined,
        starred: filter === "starred" ? true : undefined,
        category: ["all", "unread", "starred", "sent"].includes(filter)
          ? undefined
          : (filter as
              | "Client Communication"
              | "Marketing & Promotions"
              | "Internal Communication"),
      });
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["emailStats"],
    queryFn: () => emailService.getEmailStats(),
  });

  const markReadMutation = useMutation({
    mutationFn: ({ emailId, isRead }: { emailId: string; isRead: boolean }) =>
      emailService.markEmailRead(emailId, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({
      emailId,
      isStarred,
    }: {
      emailId: string;
      isStarred: boolean;
    }) => emailService.starEmail(emailId, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (emailId: string) => emailService.deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      toast({
        title: "Email deleted",
        description: "The email has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredEmails =
    inboxData?.data?.emails?.filter((email) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const cleanedBodyText = email.body.text
        ? stripQuotedEmailContent(email.body.text)
        : "";
      return (
        email.subject?.toLowerCase().includes(searchLower) ||
        email.from.email.toLowerCase().includes(searchLower) ||
        email.from.name?.toLowerCase().includes(searchLower) ||
        cleanedBodyText.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setIsDrawerOpen(true);
    // Mark email as read when opened
    if (!email.isRead) {
      markReadMutation.mutate({ emailId: email._id, isRead: true });
    }
  };

  const handleCompose = () => {
    navigate("/emails/compose");
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const replyTo =
      selectedEmail.direction === "inbound"
        ? selectedEmail.from.email
        : selectedEmail.to[0]?.email;
    setIsDrawerOpen(false);
    navigate(
      `/emails/compose?to=${replyTo}&subject=${encodeURIComponent(
        selectedEmail.subject
      )}&threadId=${selectedEmail.threadId || ""}`
    );
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
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          {/* Wrapper with space-between */}
          <div className="flex items-center justify-between mb-4">
            {/* Page Header with Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <CrmNavigation />
            </motion.div>
          </div>

          <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-0 pb-8 flex flex-col gap-6 text-white flex-1 overflow-hidden max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Inbox
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  {statsData?.data?.unreadEmails || 0} unread of{" "}
                  {statsData?.data?.totalEmails || 0} total
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  size="sm"
                  onClick={handleCompose}
                  className="relative h-10 px-5 rounded-full border-0 text-white text-sm hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                  style={{
                    background: "#FFFFFF1A",
                    boxShadow:
                      "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                >
                  {/* radial element 150px 150px */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                      backdropFilter: "blur(50px)",
                      WebkitBackdropFilter: "blur(50px)",
                      zIndex: -1,
                    }}
                  ></div>
                  <Plus className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Compose</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-300px)] min-h-0">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 space-y-4">
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
                    <CardTitle className="text-lg text-white">
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 overflow-y-auto">
                    <Button
                      variant={
                        filter === "all" && !showCategories
                          ? "default"
                          : "ghost"
                      }
                      className={`w-full justify-start rounded-full ${
                        filter === "all" && !showCategories
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
                        if (showCategories) {
                          // If categories are shown, hide them and go to all emails
                          setShowCategories(false);
                          setFilter("all");
                        } else {
                          // If categories are hidden, show them
                          setShowCategories(true);
                        }
                        setPage(1);
                      }}
                    >
                      <InboxIcon className="h-4 w-4 mr-2" />
                      Inbox
                      <div className="ml-auto flex items-center gap-1">
                        {showCategories ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </Button>
                    {showCategories && (
                      <div className="space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200  px-1">
                        <Button
                          variant={
                            filter === "Client Communication"
                              ? "default"
                              : "ghost"
                          }
                          className={`w-[calc(100%-24px)] ml-6 rounded-full pl-3 pr-2 text-xs text-left whitespace-normal h-auto py-1.5 ${
                            filter === "Client Communication"
                              ? "bg-white/15 text-white border border-white/20"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={() => {
                            setFilter("Client Communication");
                            setPage(1);
                          }}
                        >
                          <div className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0" />
                          <span className="flex-1">Client Communication</span>
                        </Button>
                        <Button
                          variant={
                            filter === "Marketing & Promotions"
                              ? "default"
                              : "ghost"
                          }
                          className={`w-[calc(100%-24px)] ml-6 rounded-full pl-3 pr-2 text-xs text-left whitespace-normal h-auto py-1.5 ${
                            filter === "Marketing & Promotions"
                              ? "bg-white/15 text-white border border-white/20"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={() => {
                            setFilter("Marketing & Promotions");
                            setPage(1);
                          }}
                        >
                          <div className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0" />
                          <span className="flex-1">Marketing & Promotions</span>
                        </Button>
                        <Button
                          variant={
                            filter === "Internal Communication"
                              ? "default"
                              : "ghost"
                          }
                          className={`w-[calc(100%-24px)] ml-6 rounded-full pl-3 pr-2 text-xs text-left whitespace-normal h-auto py-1.5 ${
                            filter === "Internal Communication"
                              ? "bg-white/15 text-white border border-white/20"
                              : "text-white/60 hover:text-white hover:bg-white/10"
                          }`}
                          onClick={() => {
                            setFilter("Internal Communication");
                            setPage(1);
                          }}
                        >
                          <div className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0" />
                          <span className="flex-1">Internal Communication</span>
                        </Button>
                      </div>
                    )}
                    <Button
                      variant={filter === "sent" ? "default" : "ghost"}
                      className={`w-full justify-start rounded-full ${
                        filter === "sent"
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
                        setFilter("sent");
                        setShowCategories(false);
                        setPage(1);
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Sent
                    </Button>
                    <Button
                      variant={filter === "unread" ? "default" : "ghost"}
                      className={`w-full justify-start rounded-full ${
                        filter === "unread"
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
                        setFilter("unread");
                        setPage(1);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Unread
                      {statsData?.data?.unreadEmails ? (
                        <Badge className="ml-auto bg-white/15 text-white border-white/20">
                          {statsData.data.unreadEmails}
                        </Badge>
                      ) : null}
                    </Button>
                    <Button
                      variant={filter === "starred" ? "default" : "ghost"}
                      className={`w-full justify-start rounded-full ${
                        filter === "starred"
                          ? "bg-white/15 text-white border border-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                      onClick={() => {
                        setFilter("starred");
                        setPage(1);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Starred
                      {statsData?.data?.starredEmails ? (
                        <Badge className="ml-auto bg-white/15 text-white border-white/20">
                          {statsData.data.starredEmails}
                        </Badge>
                      ) : null}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
                {/* Search and Pagination Row */}
                <div className="flex gap-4 items-center">
                  {/* Search - 75% Width */}
                  <div className="relative flex-[3]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-9 rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                      style={{
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
                    <h2 className="text-sm font-semibold text-white">
                      {filter === "all" && "Inbox"}
                      {filter === "sent" && "Sent Emails"}
                      {filter === "unread" && "Unread Emails"}
                      {filter === "starred" && "Starred Emails"}
                      {filter === "Client Communication" &&
                        "Client Communication"}
                      {filter === "Marketing & Promotions" &&
                        "Marketing & Promotions"}
                      {filter === "Internal Communication" &&
                        "Internal Communication"}
                    </h2>
                  </div>
                  <div className="space-y-1.5 pb-4 overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                      <div className="space-y-1.5">
                        {[...Array(8)].map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-12 w-full rounded-[12px]"
                          />
                        ))}
                      </div>
                    ) : filteredEmails.length === 0 ? (
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
                      filteredEmails.map((email, index) => (
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
                            onClick={() => handleEmailClick(email)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </motion.div>
      </motion.main>

      {/* Email Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto scrollbar-hide"
        >
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
                isLoading={
                  starMutation.isPending ||
                  markReadMutation.isPending ||
                  deleteMutation.isPending
                }
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default InboxPage;
