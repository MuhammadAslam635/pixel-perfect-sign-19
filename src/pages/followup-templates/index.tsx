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
} from "@/hooks/useFollowupPlans";
import { FollowupPlan } from "@/services/followupPlans.service";
import { format, formatDistanceToNow } from "date-fns";
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

  const stats = useMemo(() => {
    const visibleCount = templates.length || 1;
    const sum = (key: keyof FollowupTemplate) =>
      templates.reduce((total, template) => {
        const value = Number(template[key] ?? 0);
        return total + (Number.isNaN(value) ? 0 : value);
      }, 0);

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
        value: Number((sum("numberOfDaysToRun") / visibleCount).toFixed(1)),
        helper: "Based on current view",
      },
      {
        id: "touchpoints",
        label: "Avg. Touchpoints",
        value: Number(
          (
            (sum("numberOfEmails") +
              sum("numberOfCalls") +
              sum("numberOfWhatsappMessages")) /
            visibleCount
          ).toFixed(1)
        ),
        helper: "Emails + calls + WhatsApp",
      },
    ];
  }, [templates, data]);

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
                className="relative rounded-full border border-white/40 px-6 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                style={{
                  background:
                    "radial-gradient(circle at left, rgba(64,102,179,0.4) 0%, rgba(103,176,183,0.3) 50%, transparent 70%)",
                  boxShadow:
                    "rgba(255,255,255,0.16) 0px 3.43px 3.43px 0px inset, rgba(255,255,255,0.16) 0px -3.43px 3.43px 0px inset",
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return templates.map((template) => (
      <TableRow
        key={template._id}
        className="border-white/5 bg-white/10 text-white"
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
              className="h-9 w-9 rounded-full text-gray-300 hover:text-white"
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
              className="h-9 w-9 rounded-full text-gray-300 hover:text-white"
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
              className="h-9 w-9 rounded-full text-red-400 hover:text-red-300"
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
        className="border-white/5 bg-white/10 text-white"
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
            )}`}
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
          {getCompletedTodosCount(plan)} / {getTotalTodosCount(plan)}
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
              className="h-9 w-9 rounded-full text-red-400 hover:text-red-300"
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
      <main className="relative flex flex-col gap-6 overflow-y-auto px-4 pb-10 pt-24 text-white sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px]">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-white/60">
              Automations
            </p>
            <h1 className="text-3xl font-semibold">Followup Templates</h1>
            <p className="text-sm text-white/60">
              Centralize touchpoints for every prospect across emails, calls,
              and WhatsApp.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative flex-1 sm:min-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search templates"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full rounded-full border-0 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-gray-400 focus-visible:ring-white/40"
              />
            </div>
            <Select
              value={String(limit)}
              onValueChange={(value) => setLimit(Number(value))}
            >
              <SelectTrigger className="h-10 w-full rounded-full border-0 bg-white/10 text-white sm:w-[140px]">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#151822] text-white">
                {limitOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="relative h-10 rounded-full border border-white/40 px-6 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
              style={{
                background:
                  "radial-gradient(circle at left, rgba(64,102,179,0.4) 0%, rgba(103,176,183,0.3) 50%, transparent 70%)",
                boxShadow:
                  "rgba(255,255,255,0.16) 0px 3.43px 3.43px 0px inset, rgba(255,255,255,0.16) 0px -3.43px 3.43px 0px inset",
              }}
              onClick={() => {
                setFormMode("create");
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card
              key={stat.id}
              className="border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wide text-white/70">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {typeof stat.value === "number" ? stat.value : "--"}
                </p>
                <p className="text-xs text-white/60">{stat.helper}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-2xl shadow-black/30">
          <div className="overflow-hidden rounded-3xl border border-white/5">
            <Table>
              <TableHeader className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-white/5">
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
            <div className="flex justify-center border-t border-white/5 py-6">
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
                        className="h-11 rounded-full border-0 bg-gradient-to-r from-[#6de0ff] via-[#6c8cff] to-[#8b5dff] px-8 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(87,154,255,0.45)] transition hover:opacity-90 disabled:opacity-60"
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

        <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent shadow-2xl shadow-black/30">
          <div className="border-b border-white/5 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Active Followup Plans
                  {!isFollowupPlansLoading && (
                    <span className="ml-2 text-base font-normal text-white/60">
                      ({activePlans.length})
                    </span>
                  )}
                </h2>
                <p className="text-sm text-white/60">
                  View and manage your active followup campaigns
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-white hover:bg-white/10"
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
          <div className="overflow-hidden rounded-3xl border border-white/5">
            <Table>
              <TableHeader className="bg-white/5 text-xs uppercase tracking-wide text-white/60">
                <TableRow className="border-white/5">
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
            <div className="flex justify-center border-t border-white/5 py-6">
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
      </main>
    </DashboardLayout>
  );
};

export default FollowupTemplatesPage;

