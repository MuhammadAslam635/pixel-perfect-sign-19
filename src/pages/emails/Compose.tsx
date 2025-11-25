import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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
      <div className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
        <div className="flex w-full flex-1 min-h-0 flex-col gap-6 overflow-hidden max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-white">
              {threadId ? "Reply" : "Compose Email"}
            </h1>
          </div>

          <div className="flex-1 min-h-0">
            <EmailComposer
              initialTo={initialTo}
              initialSubject={
                initialSubject.startsWith("Re:")
                  ? initialSubject
                  : `Re: ${initialSubject}`
              }
              threadId={threadId}
              onSend={handleSend}
              onCancel={handleCancel}
              isLoading={sendMutation.isPending}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ComposePage;
