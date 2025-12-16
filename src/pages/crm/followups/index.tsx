import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Clock,
  Copy,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Calendar,
  Eye,
} from "lucide-react";
import {
  FollowupTemplate,
  FollowupTemplatePayload,
} from "@/services/followupTemplates.service";
import {
  useCreateFollowupTemplate,
  useDeleteFollowupTemplate,
  useDuplicateFollowupTemplate,
  useFollowupTemplates,
  useUpdateFollowupTemplate,
} from "@/hooks/useFollowupTemplates";
import {
  useFollowupPlans,
  useDeleteFollowupPlan,
  useFollowupPlanSchedule,
} from "@/hooks/useFollowupPlans";
import { FollowupPlan } from "@/services/followupPlans.service";
import { format, formatDistanceToNow } from "date-fns";
import FollowupPlanSchedule from "@/components/dashboard/FollowupPlanSchedule";
import { isAxiosError } from "axios";
import { convertLocalTimeToUTC, convertUTCToLocalTime } from "@/utils/timezone";

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

const limitOptions = ["5", "10", "20"];

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

const FollowupTemplatesPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTemplate, setSelectedTemplate] =
    useState<FollowupTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<FollowupTemplate | null>(null);
  const [plansPage, setPlansPage] = useState(1);
  const [plansLimit, setPlansLimit] = useState(50);
  const [planToDelete, setPlanToDelete] = useState<FollowupPlan | null>(null);
  const [selectedPlanForSchedule, setSelectedPlanForSchedule] =
    useState<FollowupPlan | null>(null);
  const { toast } = useToast();
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const isTriggeringTimePicker = useRef(false);

  const form = useForm<FollowupTemplateFormValues>({
    resolver: zodResolver(followupTemplateSchema),
    defaultValues: defaultFormValues,
  });

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
    }),
    [page, limit, debouncedSearch]
  );

  const { data, isLoading, isError, error } = useFollowupTemplates(queryParams);

  const templates = useMemo(() => (data as any)?.data?.docs ?? [], [data]);
  const pagination = (data as any)?.data;

  const { mutate: createTemplate, isPending: isCreating } =
    useCreateFollowupTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } =
    useUpdateFollowupTemplate();
  const { mutate: deleteTemplate, isPending: isDeleting } =
    useDeleteFollowupTemplate();
  const { mutate: duplicateTemplate, isPending: isDuplicating } =
    useDuplicateFollowupTemplate();

  // Fetch all followup plans with a high limit to filter active ones
  const plansQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 100, // Fetch more plans to filter active ones
    }),
    []
  );

  const {
    data: followupPlansData,
    isLoading: isFollowupPlansLoading,
    isFetching: isFollowupPlansFetching,
    refetch: refetchFollowupPlans,
  } = useFollowupPlans(plansQueryParams);

  const allPlans = useMemo(
    () => (followupPlansData as any)?.data?.docs ?? [],
    [followupPlansData]
  );

  // Filter for active plans (scheduled or in_progress)
  const activePlans = useMemo(
    () =>
      allPlans.filter(
        (plan: FollowupPlan) =>
          plan.status === "scheduled" || plan.status === "in_progress"
      ),
    [allPlans]
  );

  // Client-side pagination for active plans
  const activePlansTotalPages = Math.ceil(activePlans.length / plansLimit);

  const paginatedActivePlans = useMemo(() => {
    const start = (plansPage - 1) * plansLimit;
    const end = start + plansLimit;
    return activePlans.slice(start, end);
  }, [activePlans, plansPage, plansLimit]);

  // Reset to page 1 when active plans change
  useEffect(() => {
    if (plansPage > activePlansTotalPages && activePlansTotalPages > 0) {
      setPlansPage(1);
    }
  }, [activePlansTotalPages, plansPage]);

  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } =
    useDeleteFollowupPlan();

  const { data: planScheduleData, isLoading: isPlanScheduleLoading } =
    useFollowupPlanSchedule(selectedPlanForSchedule?._id || "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, limit]);

  useEffect(() => {
    if (formMode === "edit" && selectedTemplate) {
      form.reset({
        title: selectedTemplate.title,
        numberOfDaysToRun: selectedTemplate.numberOfDaysToRun,
        numberOfEmails: selectedTemplate.numberOfEmails,
        numberOfCalls: selectedTemplate.numberOfCalls,
        numberOfWhatsappMessages: selectedTemplate.numberOfWhatsappMessages,
        timeOfDayToRun: convertUTCToLocalTime(selectedTemplate.timeOfDayToRun),
      });
    } else if (formMode === "create") {
      form.reset(defaultFormValues);
    }
  }, [formMode, selectedTemplate, form]);

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedTemplate(null);
    setFormMode("create");
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

    if (formMode === "edit" && selectedTemplate) {
      updateTemplate(
        { id: selectedTemplate._id, payload },
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

  const handleDuplicate = (template: FollowupTemplate) => {
    duplicateTemplate(template._id, {
      onSuccess: (response) => {
        toast({
          title: "Template duplicated",
          description:
            response.message || `${template.title} has been duplicated.`,
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to duplicate template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const openTimePicker = (event: React.MouseEvent<HTMLDivElement>) => {
    const input = timeInputRef.current;
    if (!input || isTriggeringTimePicker.current) {
      return;
    }
    event.preventDefault();
    const maybePicker = input as HTMLInputElement & {
      showPicker?: () => void;
    };
    if (typeof maybePicker.showPicker === "function") {
      maybePicker.showPicker();
      return;
    }
    isTriggeringTimePicker.current = true;
    input.click();
    setTimeout(() => {
      isTriggeringTimePicker.current = false;
    }, 0);
  };

  const handleDelete = () => {
    if (!templateToDelete) return;

    deleteTemplate(templateToDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Template deleted",
          description:
            response.message || `${templateToDelete.title} was deleted.`,
        });
        setTemplateToDelete(null);
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to delete template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const handleDeletePlan = () => {
    if (!planToDelete) return;

    deleteFollowupPlan(planToDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Followup plan deleted",
          description:
            response?.message || "Followup plan has been deleted successfully.",
        });
        setPlanToDelete(null);
        refetchFollowupPlans();
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to delete followup plan",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const handleViewPlanSchedule = (plan: FollowupPlan) => {
    setSelectedPlanForSchedule(plan);
  };

  const handleCloseScheduleView = () => {
    setSelectedPlanForSchedule(null);
  };

  const getTemplateTitle = (plan: FollowupPlan) => {
    if (typeof plan.templateId === "string") {
      return "Followup Plan";
    }
    return plan.templateId?.title || "Followup Plan";
  };

  const getPlanStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/15 text-green-300 border border-green-400/30";
      case "in_progress":
        return "bg-blue-500/15 text-blue-200 border border-blue-400/30";
      case "failed":
        return "bg-red-500/15 text-red-300 border border-red-400/30";
      default:
        return "bg-white/10 text-white border border-white/20";
    }
  };

  const getCompletedTodosCount = (plan: FollowupPlan) => {
    return plan.todo?.filter((todo) => todo.isComplete).length || 0;
  };

  const getTotalTodosCount = (plan: FollowupPlan) => {
    return plan.todo?.length || 0;
  };

  const parseNumericValue = (value?: string | number | null) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const getPlanDurationDays = (plan: FollowupPlan) => {
    if (typeof plan.templateId !== "string") {
      const templateDuration = parseNumericValue(
        plan.templateId?.numberOfDaysToRun ?? 0
      );
      if (templateDuration > 0) {
        return templateDuration;
      }
    }

    const maxTodoDay =
      plan.todo?.reduce((max, todo) => {
        const dayValue = parseNumericValue(todo.day ?? 0);
        return dayValue > max ? dayValue : max;
      }, 0) ?? 0;

    return maxTodoDay;
  };

  const getPlanTouchpointsCount = (plan: FollowupPlan) => {
    if (Array.isArray(plan.todo) && plan.todo.length > 0) {
      return plan.todo.filter((todo) =>
        ["email", "call", "whatsapp_message"].includes(todo.type)
      ).length;
    }

    if (typeof plan.templateId !== "string") {
      return (
        parseNumericValue(plan.templateId?.numberOfEmails ?? 0) +
        parseNumericValue(plan.templateId?.numberOfCalls ?? 0) +
        parseNumericValue(plan.templateId?.numberOfWhatsappMessages ?? 0)
      );
    }

    return 0;
  };

  const planStats = useMemo<{
    avgDays: number | null;
    avgTouchpoints: number | null;
  }>(() => {
    if (!paginatedActivePlans.length) {
      return {
        avgDays: null,
        avgTouchpoints: null,
      };
    }

    const planCount = paginatedActivePlans.length;
    const totalDuration = paginatedActivePlans.reduce(
      (total, plan) => total + getPlanDurationDays(plan),
      0
    );
    const totalTouchpoints = paginatedActivePlans.reduce(
      (total, plan) => total + getPlanTouchpointsCount(plan),
      0
    );

    return {
      avgDays: Number((totalDuration / planCount).toFixed(1)),
      avgTouchpoints: Number((totalTouchpoints / planCount).toFixed(1)),
    };
  }, [paginatedActivePlans]);

  const stats = useMemo(() => {
    return [
      {
        id: "total",
        label: "Total Templates",
        value: (data as any)?.data?.totalDocs ?? 0,
        helper: "Across your workspace",
      },
      {
        id: "days",
        label: "Avg. Days per Plan",
        value: planStats.avgDays,
        helper: "Based on current view",
      },
      {
        id: "touchpoints",
        label: "Avg. Touchpoints",
        value: planStats.avgTouchpoints,
        helper: "Emails + calls + WhatsApp",
      },
    ];
  }, [data, planStats]);

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-8 text-center text-gray-400">
            Loading templates...
          </TableCell>
        </TableRow>
      );
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-8 text-center text-red-400">
            {(error instanceof Error && error.message) ||
              "Unable to load templates"}
          </TableCell>
        </TableRow>
      );
    }

    if (templates.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-16">
            <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-400">
              <MessageSquare className="h-10 w-10 opacity-60" />
              <div>
                <p className="text-lg font-semibold text-white">
                  No followup templates yet
                </p>
                <p className="text-sm text-gray-400">
                  Create your first template to automate followup plans.
                </p>
              </div>
              <Button
                onClick={() => {
                  setFormMode("create");
                  setIsFormOpen(true);
                }}
                className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-white text-xs transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return templates.map((template, index) => (
      <motion.tr
        key={template._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border-white/10 text-white hover:bg-white/5 transition-all duration-200"
      >
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">{template.title}</span>
            <span className="text-xs text-gray-400">
              Updated {formatDistanceToNow(new Date(template.updatedAt))} ago
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center text-gray-200">
          {template.numberOfDaysToRun} days
        </TableCell>
        <TableCell className="text-center text-gray-200">
          <div className="flex items-center justify-center gap-1 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            {template.numberOfEmails}
          </div>
        </TableCell>
        <TableCell className="text-center text-gray-200">
          <div className="flex items-center justify-center gap-1 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            {template.numberOfCalls}
          </div>
        </TableCell>
        <TableCell className="text-center text-gray-200">
          <div className="flex items-center justify-center gap-1 text-sm">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            {template.numberOfWhatsappMessages}
          </div>
        </TableCell>
        <TableCell className="text-center text-gray-200">
          {convertUTCToLocalTime(template.timeOfDayToRun)} (
          {template.timeOfDayToRun} UTC)
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => {
                setSelectedTemplate(template);
                setFormMode("edit");
                setIsFormOpen(true);
              }}
              aria-label="Edit template"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => handleDuplicate(template)}
              disabled={isDuplicating}
              aria-label="Duplicate template"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              onClick={() => setTemplateToDelete(template)}
              aria-label="Delete template"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </motion.tr>
    ));
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(pagination.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              className={
                page <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-white/10 transition-colors text-white"
              }
              onClick={(event) => {
                event.preventDefault();
                setPage((prev) => Math.max(prev - 1, 1));
              }}
            />
          </PaginationItem>
          {pages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={pageNumber === page}
                className="cursor-pointer hover:bg-white/10 transition-colors text-white"
                onClick={(event) => {
                  event.preventDefault();
                  setPage(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              className={
                page >= pagination.totalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-white/10 transition-colors text-white"
              }
              onClick={(event) => {
                event.preventDefault();
                setPage((prev) =>
                  Math.min(prev + 1, pagination.totalPages ?? prev + 1)
                );
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderPlansPagination = () => {
    if (activePlansTotalPages <= 1) return null;

    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, plansPage - Math.floor(maxVisible / 2));
    const end = Math.min(activePlansTotalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              className={
                plansPage <= 1
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-white/10 transition-colors text-white"
              }
              onClick={(event) => {
                event.preventDefault();
                setPlansPage((prev) => Math.max(prev - 1, 1));
              }}
            />
          </PaginationItem>
          {pages.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                isActive={pageNumber === plansPage}
                className="cursor-pointer hover:bg-white/10 transition-colors text-white"
                onClick={(event) => {
                  event.preventDefault();
                  setPlansPage(pageNumber);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              className={
                plansPage >= activePlansTotalPages
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer hover:bg-white/10 transition-colors text-white"
              }
              onClick={(event) => {
                event.preventDefault();
                setPlansPage((prev) =>
                  Math.min(prev + 1, activePlansTotalPages)
                );
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderPlansTableBody = () => {
    if (isFollowupPlansLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-8 text-center text-gray-400">
            Loading followup plans...
          </TableCell>
        </TableRow>
      );
    }

    if (activePlans.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-16">
            <div className="flex flex-col items-center justify-center gap-4 text-center text-gray-400">
              <Calendar className="h-10 w-10 opacity-60" />
              <div>
                <p className="text-lg font-semibold text-white">
                  No active followup plans
                </p>
                <p className="text-sm text-gray-400">
                  Active followup plans will appear here.
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return paginatedActivePlans.map((plan: FollowupPlan, index: number) => (
      <motion.tr
        key={plan._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="border-white/10 text-white hover:bg-white/5 transition-all duration-200"
      >
        <TableCell>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">
              {getTemplateTitle(plan)}
            </span>
            {plan.summary && (
              <span className="text-xs text-gray-400 line-clamp-1">
                {plan.summary}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanStatusBadgeClass(
              plan.status
            )} shadow-lg`}
            style={{
              boxShadow:
                plan.status === "in_progress"
                  ? "0 0 10px rgba(59, 130, 246, 0.3)"
                  : plan.status === "scheduled"
                  ? "0 0 10px rgba(251, 191, 36, 0.3)"
                  : plan.status === "completed"
                  ? "0 0 10px rgba(34, 197, 94, 0.3)"
                  : "0 0 10px rgba(239, 68, 68, 0.3)",
            }}
          >
            {plan.status === "in_progress"
              ? "In Progress"
              : plan.status === "scheduled"
              ? "Scheduled"
              : plan.status}
          </span>
        </TableCell>
        <TableCell className="text-gray-200">
          {format(new Date(plan.startDate), "MMM d, yyyy")}
        </TableCell>
        <TableCell className="text-center text-gray-200">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium">
              {getCompletedTodosCount(plan)} / {getTotalTodosCount(plan)}
            </span>
            {getTotalTodosCount(plan) > 0 && (
              <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#66AFB7] to-[#4285F4] transition-all duration-300"
                  style={{
                    width: `${
                      (getCompletedTodosCount(plan) /
                        getTotalTodosCount(plan)) *
                      100
                    }%`,
                  }}
                />
              </div>
            )}
          </div>
        </TableCell>
        <TableCell className="text-gray-200">
          {formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => handleViewPlanSchedule(plan)}
              aria-label="View schedule"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              onClick={() => setPlanToDelete(plan)}
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </motion.tr>
    ));
  };

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        {/* Wrapper with space-between */}
        <div className="flex items-center justify-between mb-4">
          {/* Page Header with CRM Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <CrmNavigation />
          </motion.div>

          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end"
          >
            <div className="relative flex-1 sm:min-w-[200px] sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
              <Input
                placeholder="Search templates"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 w-full rounded-full bg-white/5 border border-white/20 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(limit)}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger className="h-9 w-full rounded-full border border-white/20 bg-white/5 text-white sm:w-[140px] focus:ring-1 focus:ring-white/30">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-[#1a1f1f] text-white">
                  {limitOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => {
                  setFormMode("create");
                  setIsFormOpen(true);
                }}
                className="h-9 px-4 rounded-full bg-primary hover:bg-primary/90 text-white text-xs transition-all w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Template
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="grid gap-3 sm:gap-4 md:grid-cols-3 mb-4 sm:mb-6"
        >
          {stats.map((stat, index) => {
            const gradients = [
              "from-[#1877F2]/30 via-[#1877F2]/15 to-transparent",
              "from-[#4285F4]/25 via-[#34A853]/20 to-transparent",
              "from-[#66AFB7]/25 via-[#4285F4]/20 to-transparent",
            ];
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.4 + index * 0.1,
                }}
                className="relative"
              >
                {/* Gradient glow behind card */}
                <div
                  className={`absolute -inset-4 lg:-inset-8 bg-gradient-to-r ${gradients[index]} blur-3xl opacity-60`}
                />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl"
                  style={{
                    borderRadius: "16px",
                    opacity: 1,
                    borderWidth: "1px",
                    background:
                      "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardHeader className="pb-3 px-4 pt-4 relative">
                    <CardTitle className="text-xs uppercase tracking-wide text-white/70">
                      {stat.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 relative">
                    <p className="text-2xl sm:text-3xl font-semibold text-white">
                      {typeof stat.value === "number" ? stat.value : "--"}
                    </p>
                    <p className="text-xs text-white/60">{stat.helper}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
          className="rounded-xl sm:rounded-[30px] border border-white/10 bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] pt-3 sm:pt-4 px-3 sm:px-6"
        >
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Template</TableHead>
                  <TableHead className="text-center text-white/80">
                    Run Time
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Emails
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Calls
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    WhatsApp
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Time of Day
                  </TableHead>
                  <TableHead className="text-right text-white/80">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableBody()}</TableBody>
            </Table>
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center border-t border-white/10 py-4">
              {renderPagination()}
            </div>
          )}
        </motion.section>

        <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border-0 overflow-hidden">
            {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full min-h-0">
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">
                  {formMode === "edit" ? "Edit template" : "Create template"}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/70">
                  {formMode === "edit"
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
                            <FormLabel className={formLabelClasses}>
                              Name
                            </FormLabel>
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
                            <FormLabel className={formLabelClasses}>
                              Time
                            </FormLabel>
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
                                  className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                                />
                                <svg
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none"
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
                              Days
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={1}
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
                        name="numberOfEmails"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className={formLabelClasses}>
                              Emails
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
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
                        name="numberOfCalls"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className={formLabelClasses}>
                              Calls
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
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
                        name="numberOfWhatsappMessages"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className={formLabelClasses}>
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                disabled={isCreating || isUpdating}
                                className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeForm}
                      disabled={isCreating || isUpdating}
                      className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating || isUpdating}
                      className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                      style={{
                        background:
                          "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                      }}
                    >
                      {formMode === "edit"
                        ? isUpdating
                          ? "Saving..."
                          : "Save changes"
                        : isCreating
                        ? "Creating..."
                        : "Create template"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          className="rounded-xl sm:rounded-[30px] border border-white/10 bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] pt-3 sm:pt-4 px-3 sm:px-6"
        >
          <div className="border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
                  Active Followup Plans
                  {!isFollowupPlansLoading && (
                    <span className="text-sm font-normal text-white/60 bg-white/10 px-2 py-1 rounded-full">
                      {activePlans.length}
                    </span>
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
                  View and manage your active followup campaigns
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md text-white hover:bg-white/10"
                onClick={() => refetchFollowupPlans()}
                disabled={isFollowupPlansFetching}
                aria-label="Refresh plans"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isFollowupPlansFetching ? "animate-spin" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
          <div className="overflow-hidden">
            <Table>
              <TableHeader className="text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-white/10">
                  <TableHead className="text-white/80">Plan</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Start Date</TableHead>
                  <TableHead className="text-center text-white/80">
                    Progress
                  </TableHead>
                  <TableHead className="text-white/80">Created</TableHead>
                  <TableHead className="text-right text-white/80">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderPlansTableBody()}</TableBody>
            </Table>
          </div>
          {activePlansTotalPages > 1 && (
            <div className="flex justify-center border-t border-white/10 py-4">
              {renderPlansPagination()}
            </div>
          )}
        </motion.section>

        <ConfirmDialog
          open={!!templateToDelete}
          title="Delete template?"
          description="This template will be permanently removed. Existing followup plans remain unaffected."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setTemplateToDelete(null)}
        />

        <ConfirmDialog
          open={!!planToDelete}
          title="Delete Follow-up Plan"
          description="Are you sure you want to delete this follow-up plan? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
          isPending={isDeletingPlan}
          onConfirm={handleDeletePlan}
          onCancel={() => setPlanToDelete(null)}
        />

        {/* Schedule View Modal */}
        <Dialog
          open={!!selectedPlanForSchedule}
          onOpenChange={(open) => !open && handleCloseScheduleView()}
        >
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Follow-up Plan Schedule</DialogTitle>
            </DialogHeader>
            {selectedPlanForSchedule && planScheduleData?.data && (
              <FollowupPlanSchedule
                plan={planScheduleData.data}
                onClose={handleCloseScheduleView}
                isLoading={isPlanScheduleLoading}
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.main>
    </DashboardLayout>
  );
};

export default FollowupTemplatesPage;
