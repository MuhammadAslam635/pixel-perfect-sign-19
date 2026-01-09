import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailViewer } from "@/components/email/EmailViewer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const EmailDetailPage = () => {
  const { emailId } = useParams<{ emailId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emailData, isLoading } = useQuery({
    queryKey: ["email", emailId],
    queryFn: () => emailService.getEmail(emailId!),
    enabled: !!emailId,
  });

  const markReadMutation = useMutation({
    mutationFn: (isRead: boolean) =>
      emailService.markEmailRead(emailId!, { isRead }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", emailId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
    },
  });

  const starMutation = useMutation({
    mutationFn: (isStarred: boolean) =>
      emailService.starEmail(emailId!, { isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", emailId] });
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => emailService.deleteEmail(emailId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      toast({
        title: "Email deleted",
        description: "The email has been deleted successfully.",
      });
      navigate("/emails/inbox");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReply = () => {
    if (!emailData?.data) return;
    const email = emailData.data;
    const replyTo = email.direction === "inbound" ? email.from.email : email.to[0]?.email;
    navigate(
      `/emails/compose?to=${replyTo}&subject=${encodeURIComponent(email.subject)}&threadId=${email.threadId || ""}`
    );
  };

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

  if (!emailData?.data) {
    return (
      <DashboardLayout>
        <div className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Email not found</p>
              <Button onClick={() => navigate("/emails/inbox")} className="mt-4">
                Back to Inbox
              </Button>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const email = emailData.data;

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
        <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/emails/inbox")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Email</h1>
          </div>

          <div className="flex-1 min-h-0">
            <EmailViewer
              email={email}
              onStar={(isStarred) => starMutation.mutate(isStarred)}
              onMarkRead={(isRead) => markReadMutation.mutate(isRead)}
              onDelete={() => deleteMutation.mutate()}
              onReply={handleReply}
              isLoading={
                markReadMutation.isPending ||
                starMutation.isPending ||
                deleteMutation.isPending
              }
            />
          </div>
        </div>
          </div>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default EmailDetailPage;

