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
      <div className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
        <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Inbox</h1>
              <p className="text-muted-foreground mt-1">
                {statsData?.data?.unreadEmails || 0} unread of {statsData?.data?.totalEmails || 0} total
              </p>
            </div>
            <Button onClick={handleCompose}>
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={filter === "all" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setFilter("all")}
                  >
                    <InboxIcon className="h-4 w-4 mr-2" />
                    All Emails
                    {inboxData?.data?.pagination?.total && (
                      <Badge variant="secondary" className="ml-auto">
                        {inboxData.data.pagination.total}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={filter === "unread" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setFilter("unread")}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Unread
                    {statsData?.data?.unreadEmails && (
                      <Badge variant="secondary" className="ml-auto">
                        {statsData.data.unreadEmails}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={filter === "starred" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setFilter("starred")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Starred
                    {statsData?.data?.starredEmails && (
                      <Badge variant="secondary" className="ml-auto">
                        {statsData.data.starredEmails}
                      </Badge>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {statsData?.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold">{statsData.data.totalEmails}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unread:</span>
                      <span className="font-semibold">{statsData.data.unreadEmails}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sent:</span>
                      <span className="font-semibold">{statsData.data.sentEmails}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Received:</span>
                      <span className="font-semibold">{statsData.data.receivedEmails}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">
                    {filter === "all" && "All Emails"}
                    {filter === "unread" && "Unread Emails"}
                    {filter === "starred" && "Starred Emails"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-4 space-y-3">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-lg">No emails found</p>
                      <p className="text-muted-foreground text-sm mt-2">
                        {searchTerm ? "Try adjusting your search" : "Your inbox is empty"}
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
                </CardContent>
              </Card>

              {inboxData?.data?.pagination && inboxData.data.pagination.pages > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {inboxData.data.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(inboxData.data.pagination.pages, p + 1))}
                    disabled={page === inboxData.data.pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InboxPage;

