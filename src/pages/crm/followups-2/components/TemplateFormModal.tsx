import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateFollowupTemplate,
  useUpdateFollowupTemplate,
} from "@/hooks/useFollowupTemplates";
import {
  FollowupTemplate,
  FollowupTemplatePayload,
} from "@/services/followupTemplates.service";
import { useToast } from "@/hooks/use-toast";
import { isAxiosError } from "axios";
import { convertLocalTimeToUTC, convertUTCToLocalTime } from "@/utils/timezone";
import { Mail, MessageSquare, Phone, Calendar } from "lucide-react";

const followupTemplateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  numberOfDaysToRun: z
    .string()
    .min(1, "Number of days is required")
    .regex(/^\d+$/, "Days must be a positive number"),
  numberOfEmails: z
    .string()
    .min(1, "Number of emails is required")
    .regex(/^\d+$/, "Emails must be a positive number"),
  numberOfCalls: z
    .string()
    .min(1, "Number of calls is required")
    .regex(/^\d+$/, "Calls must be a positive number"),
  numberOfWhatsappMessages: z
    .string()
    .min(1, "Number of WhatsApp messages is required")
    .regex(/^\d+$/, "Messages must be a positive number"),
  timeOfDayToRun: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):([0-5]\d)$/,
      "Time must be in HH:MM 24-hour format"
    ),
});

type FollowupTemplateFormValues = z.infer<typeof followupTemplateSchema>;

const defaultFormValues: FollowupTemplateFormValues = {
  title: "",
  numberOfDaysToRun: "5",
  numberOfEmails: "3",
  numberOfCalls: "2",
  numberOfWhatsappMessages: "2",
  timeOfDayToRun: "09:00",
};

const formLabelClasses = "text-xs text-white/70";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

interface TemplateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  template?: FollowupTemplate | null;
}

const TemplateFormModal = ({
  open,
  onOpenChange,
  mode,
  template,
}: TemplateFormModalProps) => {
  const { toast } = useToast();
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const isTriggeringTimePicker = useRef(false);

  const form = useForm<FollowupTemplateFormValues>({
    resolver: zodResolver(followupTemplateSchema),
    defaultValues: defaultFormValues,
  });

  const { mutate: createTemplate, isPending: isCreating } =
    useCreateFollowupTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } =
    useUpdateFollowupTemplate();

  useEffect(() => {
    if (mode === "edit" && template) {
      form.reset({
        title: template.title,
        numberOfDaysToRun: template.numberOfDaysToRun,
        numberOfEmails: template.numberOfEmails,
        numberOfCalls: template.numberOfCalls,
        numberOfWhatsappMessages: template.numberOfWhatsappMessages,
        timeOfDayToRun: convertUTCToLocalTime(template.timeOfDayToRun),
      });
    } else if (mode === "create") {
      form.reset(defaultFormValues);
    }
  }, [mode, template, form]);

  const closeForm = () => {
    onOpenChange(false);
    form.reset(defaultFormValues);
  };

  const handleSubmitForm = (values: FollowupTemplateFormValues) => {
    const payload: FollowupTemplatePayload = {
      title: values.title,
      numberOfDaysToRun: values.numberOfDaysToRun,
      numberOfEmails: values.numberOfEmails,
      numberOfCalls: values.numberOfCalls,
      numberOfWhatsappMessages: values.numberOfWhatsappMessages,
      timeOfDayToRun: convertLocalTimeToUTC(values.timeOfDayToRun),
    };

    if (mode === "edit" && template) {
      updateTemplate(
        { id: template._id, payload },
        {
          onSuccess: (response) => {
            toast({
              title: "Template updated",
              description:
                response.message || "Followup template updated successfully.",
            });
            closeForm();
          },
          onError: (mutationError) => {
            toast({
              title: "Unable to update template",
              description: getErrorMessage(mutationError, "Please try again."),
              variant: "destructive",
            });
          },
        }
      );
    } else {
      createTemplate(payload, {
        onSuccess: (response) => {
          toast({
            title: "Template created",
            description:
              response.message || "Followup template created successfully.",
          });
          closeForm();
        },
        onError: (mutationError) => {
          toast({
            title: "Unable to create template",
            description: getErrorMessage(mutationError, "Please try again."),
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeForm()}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
        style={{
          background: "#0a0a0a"
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}
        />
        
        <div className="relative z-10 flex flex-col h-full min-h-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">
              {mode === "edit" ? "Edit template" : "Create template"}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              {mode === "edit"
                ? "Update the followup template details"
                : "Create a new followup template"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
            >
              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Outbound nurture sequence"
                            disabled={isCreating || isUpdating}
                            className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeOfDayToRun"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>Time</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="time"
                              step="60"
                              ref={(node) => {
                                field.ref(node);
                                timeInputRef.current = node;
                              }}
                              disabled={isCreating || isUpdating}
                              style={{ colorScheme: "dark" }}
                              className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                            <svg
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfDaysToRun"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>
                          Run Duration (Days)
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="5"
                              disabled={isCreating || isUpdating}
                              className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfEmails"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>
                          Emails
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="3"
                              disabled={isCreating || isUpdating}
                              className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfCalls"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>
                          Calls
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="2"
                              disabled={isCreating || isUpdating}
                              className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfWhatsappMessages"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className={formLabelClasses}>
                          WhatsApp Messages
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              type="text"
                              inputMode="numeric"
                              placeholder="2"
                              disabled={isCreating || isUpdating}
                              className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={isCreating || isUpdating}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white transition-all text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="bg-primary hover:bg-primary/90 text-white transition-all text-xs"
                >
                  {isCreating || isUpdating
                    ? mode === "edit"
                      ? "Updating..."
                      : "Creating..."
                    : mode === "edit"
                    ? "Update Template"
                    : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateFormModal;
