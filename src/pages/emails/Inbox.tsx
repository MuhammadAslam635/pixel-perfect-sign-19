import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { EmailListItem } from "@/components/email/EmailListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { Email } from "@/types/email.types";
import { Plus, Search, Mail, MailOpen, Star, Inbox as InboxIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const InboxPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ["inbox", filter, page],
    queryFn: () =>
      emailService.getInboxEmails({
        page,
        limit,
        unread: filter === "unread" ? true : undefined,
        starred: filter === "starred" ? true : undefined,
      }),
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
    mutationFn: ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) =>
      emailService.starEmail(emailId, { isStarred }),
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

  const filteredEmails = inboxData?.data?.emails?.filter((email) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.from.email.toLowerCase().includes(searchLower) ||
      email.from.name?.toLowerCase().includes(searchLower) ||
      email.body.text?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleEmailClick = (email: Email) => {
    navigate(`/emails/${email._id}`);
  };

  const handleCompose = () => {
    navigate("/emails/compose");
  };

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Inbox</h1>
              <p className="text-white/60 text-sm mt-1">
                {statsData?.data?.unreadEmails || 0} unread of {statsData?.data?.totalEmails || 0} total
              </p>
            </div>
            <Button 
              onClick={handleCompose}
              className="rounded-full bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3] text-sm sm:text-base px-4 sm:px-6 py-2"
              style={{
                boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>

          {/* Stats Cards */}
          {statsData?.data && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="relative flex-1 w-full">
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl opacity-60" />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl w-full"
                  style={{
                    borderRadius: "30px",
                    opacity: 1,
                    borderWidth: "1px",
                    background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium mb-3">Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{statsData.data.totalEmails}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="relative flex-1 w-full">
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl opacity-60" />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl w-full"
                  style={{
                    borderRadius: "30px",
                    opacity: 1,
                    borderWidth: "1px",
                    background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium mb-3">Unread</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{statsData.data.unreadEmails}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="relative flex-1 w-full">
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl opacity-60" />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl w-full"
                  style={{
                    borderRadius: "30px",
                    opacity: 1,
                    borderWidth: "1px",
                    background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium mb-3">Sent</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{statsData.data.sentEmails}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="relative flex-1 w-full">
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl opacity-60" />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl w-full"
                  style={{
                    borderRadius: "30px",
                    opacity: 1,
                    borderWidth: "1px",
                    background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6">
                    <p className="text-xs sm:text-sm text-gray-300 font-medium mb-3">Received</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white">{statsData.data.receivedEmails}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 space-y-4">
              <Card
                className="border-[#FFFFFF4D]"
                style={{
                  borderRadius: "30px",
                  borderWidth: "1px",
                  background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-white">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={filter === "all" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${
                      filter === "all"
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setFilter("all")}
                  >
                    <InboxIcon className="h-4 w-4 mr-2" />
                    All Emails
                    {inboxData?.data?.pagination?.total && (
                      <Badge className="ml-auto bg-white/15 text-white border-white/20">
                        {inboxData.data.pagination.total}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={filter === "unread" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${
                      filter === "unread"
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setFilter("unread")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Unread
                    {statsData?.data?.unreadEmails && (
                      <Badge className="ml-auto bg-white/15 text-white border-white/20">
                        {statsData.data.unreadEmails}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={filter === "starred" ? "default" : "ghost"}
                    className={`w-full justify-start rounded-full ${
                      filter === "starred"
                        ? "bg-white/15 text-white border border-white/20"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setFilter("starred")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Starred
                    {statsData?.data?.starredEmails && (
                      <Badge className="ml-auto bg-white/15 text-white border-white/20">
                        {statsData.data.starredEmails}
                      </Badge>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs"
                  style={{
                    background: "#FFFFFF1A",
                    boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  }}
                />
              </div>

              {/* Email List */}
              <div
                className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-2xl flex-1 overflow-y-auto"
                style={{
                  borderRadius: "30px",
                  borderWidth: "1px",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  minHeight: "400px",
                  maxHeight: "calc(100vh - 500px)",
                }}
              >
                <div className="mb-4 px-2">
                  <h2 className="text-lg font-semibold text-white">
                    {filter === "all" && "All Emails"}
                    {filter === "unread" && "Unread Emails"}
                    {filter === "starred" && "Starred Emails"}
                  </h2>
                </div>
                <div className="space-y-3 pb-4">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-[20px]" />
                      ))}
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-white/30" />
                      </div>
                      <p className="text-white/70 text-base font-medium mb-1">No emails found</p>
                      <p className="text-white/50 text-sm text-center max-w-md">
                        {searchTerm ? "Try adjusting your search terms or clear the filter to see all emails." : "Your inbox is empty."}
                      </p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <EmailListItem
                        key={email._id}
                        email={email}
                        onClick={() => handleEmailClick(email)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Pagination */}
              {inboxData?.data?.pagination && inboxData.data.pagination.pages > 1 && (
                <div className="sticky bottom-0 left-0 right-0 z-10 bg-[#222B2C] py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-white/70">
                      Page {page} of {inboxData.data.pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.min(inboxData.data.pagination.pages, p + 1))}
                      disabled={page === inboxData.data.pagination.pages}
                      className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default InboxPage;

