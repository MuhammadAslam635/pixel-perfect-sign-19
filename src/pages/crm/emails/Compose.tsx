import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { EmailComposer } from "@/components/email/EmailComposer";
import { useToast } from "@/components/ui/use-toast";
import { emailService } from "@/services/email.service";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ComposePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialTo = searchParams.get("to") ? [searchParams.get("to")!] : [];
  const initialSubject = searchParams.get("subject") || "";
  const threadId = searchParams.get("threadId") || undefined;

  const sendMutation = useMutation({
    mutationFn: (data: Parameters<typeof emailService.sendEmail>[0]) =>
      emailService.sendEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      navigate("/emails/inbox");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description:
          error.response?.data?.message ||
          "An error occurred while sending the email.",
        variant: "destructive",
      });
    },
  });

  const handleSend = (data: Parameters<typeof emailService.sendEmail>[0]) => {
    sendMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate("/emails/inbox");
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

          <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-0 mb-10 flex flex-col gap-6 text-white h-full">
        <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">
              {threadId ? "Reply" : "Compose Email"}
            </h1>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <EmailComposer
              initialTo={initialTo}
              initialSubject={initialSubject}
              threadId={threadId}
              onSend={handleSend}
              onCancel={handleCancel}
              isLoading={sendMutation.isPending}
            />
          </div>
        </div>
          </main>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default ComposePage;
