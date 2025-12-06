import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailViewer } from "@/components/email/EmailViewer";
import { EmailComposer } from "@/components/email/EmailComposer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const ThreadDetailPage = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const { data: threadData, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => emailService.getThread(threadId!),
    enabled: !!threadId,
  });

  const selectedEmail = threadData?.data?.emails?.find(
    (e) => e._id === selectedEmailId
  );

  const markReadMutation = useMutation({
    mutationFn: ({ emailId, isRead }: { emailId: string; isRead: boolean }) =>
      emailService.markEmailRead(emailId, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) =>
      emailService.starEmail(emailId, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (emailId: string) => emailService.deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
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

  const sendMutation = useMutation({
    mutationFn: (data: Parameters<typeof emailService.sendEmail>[0]) =>
      emailService.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      toast({
        title: "Email sent",
        description: "Your reply has been sent successfully.",
      });
      setShowComposer(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.response?.data?.message || "An error occurred while sending the email.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!threadData?.data) {
    return (
      <DashboardLayout>
        <div className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Thread not found</p>
              <Button onClick={() => navigate("/emails/threads")} className="mt-4">
                Back to Threads
              </Button>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const thread = threadData.data.thread;
  const emails = threadData.data.emails || [];

  // Set first email as selected if none selected
  if (!selectedEmailId && emails.length > 0) {
    setSelectedEmailId(emails[0]._id);
  }

  const handleReply = () => {
    if (!selectedEmail) return;
    const replyTo =
      selectedEmail.direction === "inbound"
        ? selectedEmail.from.email
        : selectedEmail.to[0]?.email;
    setShowComposer(true);
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

          <div className="relative flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
        <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/emails/threads")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">{thread.subject}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-1 flex flex-col gap-2 min-h-0">
              <Card className="flex-1 overflow-auto">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold mb-2">Messages ({emails.length})</h3>
                  {emails.map((email) => {
                    const fromName = email.from.name || email.from.email.split("@")[0];
                    return (
                      <Card
                        key={email._id}
                        className={`cursor-pointer p-3 transition-all ${
                          selectedEmailId === email._id
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-primary/5"
                        }`}
                        onClick={() => {
                          setSelectedEmailId(email._id);
                          setShowComposer(false);
                        }}
                      >
                        <div className="text-sm font-medium">{fromName}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {email.subject}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </div>
                      </Card>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
              {showComposer ? (
                <EmailComposer
                  initialTo={
                    selectedEmail
                      ? [
                          selectedEmail.direction === "inbound"
                            ? selectedEmail.from.email
                            : selectedEmail.to[0]?.email || "",
                        ]
                      : []
                  }
                  initialSubject={`Re: ${thread.subject}`}
                  threadId={threadId}
                  onSend={(data) => sendMutation.mutate(data)}
                  onCancel={() => setShowComposer(false)}
                  isLoading={sendMutation.isPending}
                />
              ) : selectedEmail ? (
                <EmailViewer
                  email={selectedEmail}
                  onStar={(isStarred) =>
                    starMutation.mutate({ emailId: selectedEmail._id, isStarred })
                  }
                  onMarkRead={(isRead) =>
                    markReadMutation.mutate({ emailId: selectedEmail._id, isRead })
                  }
                  onDelete={() => deleteMutation.mutate(selectedEmail._id)}
                  onReply={handleReply}
                  isLoading={
                    markReadMutation.isPending ||
                    starMutation.isPending ||
                    deleteMutation.isPending
                  }
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Select an email to view</p>
                </Card>
              )}
            </div>
          </div>
        </div>
          </div>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default ThreadDetailPage;

