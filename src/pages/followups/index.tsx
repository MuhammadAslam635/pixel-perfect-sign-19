import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  convertLocalTimeToUTC,
  convertUTCToLocalTime,
} from "@/utils/timezone";

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

const inputFieldClasses =
  "h-11 rounded-xl bg-transparent px-4 text-sm text-white placeholder:text-white/50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_25px_65px_rgba(3,7,18,0.65)] focus-visible:ring-2 focus-visible:ring-cyan-300/40 transition-all backdrop-blur border-0";

const inputWrapperClasses =
  "relative rounded-xl p-[1px] bg-gradient-to-r from-[#69B4B7] to-[#3E64B4]";

const inputStyle = {
  background: "transparent !important",
  backgroundImage: "none !important",
};

const formLabelClasses =
  "text-[11px] font-medium uppercase tracking-[0.08em] text-white/50";

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

  const {
    data: planScheduleData,
    isLoading: isPlanScheduleLoading,
  } = useFollowupPlanSchedule(selectedPlanForSchedule?._id || "");

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
        timeOfDayToRun: convertUTCToLocalTime(
          selectedTemplate.timeOfDayToRun
        ),
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

  const planStats = useMemo<{ avgDays: number | null; avgTouchpoints: number | null }>(() => {
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
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
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
                <span className="relative z-10">New Template</span>
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return templates.map((template) => (
      <TableRow
        key={template._id}
        className="border-[#FFFFFF0D] text-white hover:border-[#3a3a3a] transition-all duration-200"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        }}
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
          {convertUTCToLocalTime(template.timeOfDayToRun)} ({template.timeOfDayToRun} UTC)
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-gray-300 hover:text-[#66AFB7] hover:bg-[#66AFB7]/10 border border-transparent hover:border-[#66AFB7]/30 transition-all"
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
              className="h-9 w-9 rounded-full text-gray-300 hover:text-[#4285F4] hover:bg-[#4285F4]/10 border border-transparent hover:border-[#4285F4]/30 transition-all"
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
              className="h-9 w-9 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-400/30 transition-all"
              onClick={() => setTemplateToDelete(template)}
              aria-label="Delete template"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
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

    return paginatedActivePlans.map((plan: FollowupPlan) => (
      <TableRow
        key={plan._id}
        className="border-[#FFFFFF0D] text-white hover:border-[#3a3a3a] transition-all duration-200"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        }}
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
              boxShadow: plan.status === "in_progress"
                ? "0 0 10px rgba(59, 130, 246, 0.3)"
                : plan.status === "scheduled"
                ? "0 0 10px rgba(251, 191, 36, 0.3)"
                : plan.status === "completed"
                ? "0 0 10px rgba(34, 197, 94, 0.3)"
                : "0 0 10px rgba(239, 68, 68, 0.3)"
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
                    width: `${(getCompletedTodosCount(plan) / getTotalTodosCount(plan)) * 100}%`
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
              className="h-9 w-9 rounded-full text-[#4285F4] hover:text-[#4285F4] hover:bg-[#4285F4]/10 border border-transparent hover:border-[#4285F4]/30 transition-all"
              onClick={() => handleViewPlanSchedule(plan)}
              aria-label="View schedule"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-400/30 transition-all"
              onClick={() => setPlanToDelete(plan)}
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            {/* Colorful background elements */}
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-[#66AFB7]/20 to-[#4285F4]/10 rounded-full blur-xl opacity-60" />
            <div className="absolute -top-2 -right-6 w-16 h-16 bg-gradient-to-br from-[#34A853]/15 to-[#1877F2]/10 rounded-full blur-lg opacity-50" />

            <div className="relative">
              <p className="text-sm uppercase tracking-wide text-white/60 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#66AFB7] to-[#4285F4]" />
                Automations
              </p>
              <h1 className="text-3xl font-semibold bg-gradient-to-r from-white via-white to-[#66AFB7] bg-clip-text text-transparent">
                Followup Templates
              </h1>
              <p className="text-sm text-white/60">
                Centralize touchpoints for every prospect across emails, calls,
                and WhatsApp.
              </p>

              {/* Colorful stats inline */}
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#66AFB7] shadow-lg shadow-[#66AFB7]/30" />
                  <span className="text-sm text-white/80">{stats[0]?.value || 0} Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#4285F4] shadow-lg shadow-[#4285F4]/30" />
                  <span className="text-sm text-white/80">{activePlans.length} Active Plans</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#34A853] shadow-lg shadow-[#34A853]/30" />
                  <span className="text-sm text-white/80">{stats[2]?.value || 0} Avg Touchpoints</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative flex-1 sm:min-w-[200px] sm:max-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 z-10" />
              <Input
                placeholder="Search templates"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10 w-full rounded-full bg-[#FFFFFF1A] border border-white/40 text-gray-300 placeholder:text-gray-500 focus:ring-0"
                style={{
                  boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset',
                  borderRadius: '9999px'
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(limit)}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger className="h-10 w-full rounded-full border border-[#4285F4]/30 bg-white/5 text-white sm:w-[140px] focus:ring-2 focus:ring-[#4285F4]/50">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent className="border-[#4285F4]/30 bg-[#151822] text-white">
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
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
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
                <Plus className="w-4 h-4 mr-0 relative z-10" />
                <span className="relative z-10">New Template</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Colorful Stats Section */}
        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => {
            const colors = [
              { gradient: "from-[#66AFB7]/20 to-[#66AFB7]/5", border: "border-[#66AFB7]/30", accent: "#66AFB7" },
              { gradient: "from-[#4285F4]/20 to-[#4285F4]/5", border: "border-[#4285F4]/30", accent: "#4285F4" },
              { gradient: "from-[#34A853]/20 to-[#34A853]/5", border: "border-[#34A853]/30", accent: "#34A853" }
            ];
            const color = colors[index];

            return (
              <Card
                key={stat.id}
                className={`relative overflow-hidden border text-white bg-gradient-to-br ${color.gradient} backdrop-blur-sm`}
                style={{
                  borderRadius: "16px",
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                }}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${color.gradient} rounded-full blur-xl opacity-30`} />
                <CardHeader className="pb-2 relative">
                  <CardTitle className="text-xs uppercase tracking-wide text-white/70 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shadow-lg"
                      style={{ backgroundColor: color.accent, boxShadow: `0 0 10px ${color.accent}40` }}
                    />
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-3xl font-semibold text-white">
                    {typeof stat.value === "number" ? stat.value : "--"}
                  </p>
                  <p className="text-xs text-white/60">{stat.helper}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="rounded-3xl border-[#FFFFFF4D] bg-gradient-to-br from-white/5 to-transparent shadow-2xl shadow-black/30"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            borderRadius: "24px",
          }}>
          <div className="overflow-hidden rounded-3xl border-[#FFFFFF4D]">
            <Table>
              <TableHeader className="bg-gradient-to-r from-[#FFFFFF0D] via-[#66AFB7]/5 to-[#4285F4]/5 text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-[#FFFFFF0D]">
                  <TableHead className="text-white/80 relative">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#66AFB7]" />
                      Template
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-[#4285F4]" />
                      Run Time
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="w-4 h-4 text-[#34A853]" />
                      Emails
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    <div className="flex items-center justify-center gap-1">
                      <Phone className="w-4 h-4 text-[#66AFB7]" />
                      Calls
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="w-4 h-4 text-[#4285F4]" />
                      WhatsApp
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4 text-[#34A853]" />
                      Time of Day
                    </div>
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
            <div className="flex justify-center border-t border-[#FFFFFF0D] py-6">
              {renderPagination()}
            </div>
          )}
        </section>

        <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
          <DialogContent
            className="group max-h-[92vh] max-w-[980px] border-none bg-transparent p-0 text-white shadow-none sm:rounded-[38px] [&>button]:right-8 [&>button]:top-8 [&>button]:text-white/60 [&>button:hover]:text-white"
          >
            <div className="relative isolate overflow-hidden rounded-[38px] border border-white/10 bg-[#05070f]/85 shadow-[0_35px_95px_rgba(0,0,0,0.85)]">
              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(91,157,255,0.35),_transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,255,214,0.18),_transparent_60%)]" />
              </div>
              <div className="pointer-events-none absolute inset-[1px] rounded-[36px] border border-white/10" />

              <div className="relative z-10 max-h-[88vh] overflow-y-auto px-6 py-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-10 sm:py-10">
                <DialogHeader className="mb-8 space-y-2 border-b border-white/10 pb-5 text-left">
                  <DialogTitle className="text-2xl font-semibold text-white">
                    {formMode === "edit" ? "Edit template" : "Create template"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-white/60">
                    Add a new employee to your organization
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmitForm)}
                    className="space-y-8"
                  >
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
                              <div className={inputWrapperClasses}>
                                <Input
                                  {...field}
                                  placeholder="Outbound nurture sequence"
                                  className={inputFieldClasses}
                                  style={inputStyle}
                                />
                              </div>
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
                              <div className={inputWrapperClasses}>
                                <div
                                  className="relative cursor-pointer"
                                  onClick={openTimePicker}
                                >
                                  <Clock className="pointer-events-none absolute left-4 top-1/2 z-20 h-4 w-4 -translate-y-1/2 text-[#7ecbff]" />
                                  <Input
                                    {...field}
                                    type="time"
                                    step="60"
                                    ref={(node) => {
                                      field.ref(node);
                                      timeInputRef.current = node;
                                    }}
                                    className={`${inputFieldClasses} pl-10 before:hidden`}
                                    style={inputStyle}
                                  />
                                </div>
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
                              <div className={inputWrapperClasses}>
                                <Input
                                  {...field}
                                  type="number"
                                  min={1}
                                  className={inputFieldClasses}
                                  style={inputStyle}
                                />
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
                              <div className={inputWrapperClasses}>
                                <Input
                                  {...field}
                                  type="number"
                                  min={0}
                                  className={inputFieldClasses}
                                  style={inputStyle}
                                />
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
                              <div className={inputWrapperClasses}>
                                <Input
                                  {...field}
                                  type="number"
                                  min={0}
                                  className={inputFieldClasses}
                                  style={inputStyle}
                                />
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
                              WhatsApp
                            </FormLabel>
                            <FormControl>
                              <div className={inputWrapperClasses}>
                                <Input
                                  {...field}
                                  type="number"
                                  min={0}
                                  className={inputFieldClasses}
                                  style={inputStyle}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-11 rounded-full border border-white/20 bg-white/5 px-7 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={closeForm}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="h-11 rounded-full border-0 px-8 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                        style={{
                          background:
                            "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                        }}
                        disabled={isCreating || isUpdating}
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
            </div>
          </DialogContent>
        </Dialog>

        <section className="rounded-3xl border-[#FFFFFF4D] bg-gradient-to-br from-white/5 to-transparent shadow-2xl shadow-black/30"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            borderRadius: "24px",
          }}>
          <div className="border-b border-[#FFFFFF4D] px-6 py-4 bg-gradient-to-r from-transparent via-[#66AFB7]/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#66AFB7]" />
                  Active Followup Plans
                  {!isFollowupPlansLoading && (
                    <span className="ml-2 text-base font-normal text-white/60 bg-[#66AFB7]/20 px-2 py-1 rounded-full">
                      {activePlans.length}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  View and manage your active followup campaigns
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-white hover:bg-[#66AFB7]/10 border border-[#66AFB7]/20"
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
          <div className="overflow-hidden rounded-3xl border-[#FFFFFF4D]">
            <Table>
              <TableHeader className="bg-gradient-to-r from-[#FFFFFF0D] via-[#4285F4]/5 to-[#34A853]/5 text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-[#FFFFFF0D]">
                  <TableHead className="text-white/80">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-[#4285F4]" />
                      Plan
                    </div>
                  </TableHead>
                  <TableHead className="text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#34A853] shadow-lg shadow-[#34A853]/30" />
                      Status
                    </div>
                  </TableHead>
                  <TableHead className="text-white/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#66AFB7]" />
                      Start Date
                    </div>
                  </TableHead>
                  <TableHead className="text-center text-white/80">
                    Progress
                  </TableHead>
                  <TableHead className="text-white/80">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#4285F4]" />
                      Created
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-white/80">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderPlansTableBody()}</TableBody>
            </Table>
          </div>
          {activePlansTotalPages > 1 && (
            <div className="flex justify-center border-t border-[#FFFFFF0D] py-6">
              {renderPlansPagination()}
            </div>
          )}
        </section>

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
          title="Delete followup plan?"
          description="This followup plan will be permanently removed. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="destructive"
          isPending={isDeletingPlan}
          onConfirm={handleDeletePlan}
          onCancel={() => setPlanToDelete(null)}
        />

        {/* Schedule View Modal */}
        <Dialog open={!!selectedPlanForSchedule} onOpenChange={(open) => !open && handleCloseScheduleView()}>
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
      </main>
    </DashboardLayout>
  );
};

export default FollowupTemplatesPage;

