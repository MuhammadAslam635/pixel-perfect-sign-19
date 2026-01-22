import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DataTable, { Column } from "@/data/DataTable";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "@/services/feedback.service";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FeedbackType } from "@/types/feedback.types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { feedbackTypes } from "@/mocks/dropdownMock";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";

type FeedbackRow = {
  _id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const Feedback = () => {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "improvement" as FeedbackType,
    status: "open" as "open" | "closed",
  });

  const { data: feedbackData = [], isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: feedbackService.getAllFeedbacks,
  });

  const queryClient = useQueryClient();
  
  const { mutate: createFeedback, isPending: isCreating } = useMutation({
    mutationFn: feedbackService.createFeedback,
    onSuccess: () => {
      toast({ title: "Feedback submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Failed! Fill All field",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateFeedback, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      feedbackService.updateFeedback(id, data),
    onSuccess: () => {
      toast({ title: "Feedback updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to update feedback";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteFeedback } = useMutation({
    mutationFn: feedbackService.deleteFeedback,
    onSuccess: () => {
      toast({ title: "Feedback deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to delete feedback";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", type: "improvement", status: "open" });
    setEditMode(false);
    setEditingId(null);
    setSelectedFiles([]);
  };

  const columns: Column<FeedbackRow>[] = [
    { key: "title", label: "Title" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    {
      key: "_id",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(row)}
            className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row._id)}
            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const data: FeedbackRow[] = feedbackData.map((item) => ({
    _id: item._id,
    title: item.title,
    type: item.type,
    status: item.status,
    createdAt: new Date(item.createdAt).toLocaleDateString(),
  }));

  const handleEdit = (row: FeedbackRow) => {
    const feedback = feedbackData.find((f) => f._id === row._id);
    if (feedback) {
      setFormData({
        title: feedback.title,
        description: feedback.description || "",
        type: feedback.type,
        status: feedback.status,
      });
      setEditingId(row._id);
      setEditMode(true);
      setOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      deleteFeedback(id);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      console.log("New files selected:", files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('type', formData.type);
    
    if (editMode) {
      formDataToSend.append('status', formData.status);
    }
    
    // Append all selected files
    selectedFiles.forEach((file) => {
      formDataToSend.append('attachments', file);
    });

    console.log("Files being sent:", selectedFiles);

    if (editMode && editingId) {
      updateFeedback({
        id: editingId,
        data: formDataToSend,
      });
    } else {
      createFeedback(formDataToSend);
    }
  };

  const feedbackbtn =
    "bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80 text-white font-semibold rounded-full px-4 sm:px-6 h-10 shadow-[0_5px_18px_rgba(103,176,183,0.35)] hover:shadow-[0_8px_24px_rgba(103,176,183,0.45)] transition-all whitespace-nowrap";

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative mt-32 mb-8 flex-1 overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white"
      >
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="mx-auto flex flex-col gap-8 space-y-3 pt-3 sm:pt-4 pb-6 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]"
        >
          <div className="flex items-center justify-between">
            <header className="flex flex-col gap-2">
              <motion.h1
                className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Feedback
              </motion.h1>
              <motion.p
                className="max-w-2xl text-sm text-white/70 sm:text-base"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                Submit and review feedback
              </motion.p>
            </header>

            <Dialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className={feedbackbtn}>Add Feedback</Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editMode ? "Edit Feedback" : "Add Feedback"}
                  </DialogTitle>
                </DialogHeader>

                <div className="py-6 text-sm text-muted-foreground">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-white/80">
                        Title
                      </Label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter feedback title"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-white/80">Description</Label>
                      <Textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Enter description"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label className="text-white/80">Type</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between text-white border-white/20"
                          >
                            {feedbackTypes.find((t) => t.value === formData.type)
                              ?.label}
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-popover text-white border-white/20">
                          {feedbackTypes.map((item) => (
                            <DropdownMenuItem
                              key={item.value}
                              onSelect={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  type: item.value,
                                }))
                              }
                            >
                              {item.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {editMode && (
                      <div>
                        <Label className="text-white/80">Status</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between text-white border-white/20"
                            >
                              {statusOptions.find((s) => s.value === formData.status)
                                ?.label}
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-popover text-white border-white/20">
                            {statusOptions.map((item) => (
                              <DropdownMenuItem
                                key={item.value}
                                onSelect={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    status: item.value as "open" | "closed",
                                  }))
                                }
                              >
                                {item.label}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}

                    <div>
                      <Label className="text-white/80">Attachments</Label>
                      <Input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="h-14 cursor-pointer text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                      />
                      {selectedFiles.length > 0 && (
                        <div className="mt-2 text-xs text-white/60">
                          {selectedFiles.length} file(s) selected
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={isCreating || isUpdating}
                        className={feedbackbtn}
                      >
                        {isCreating || isUpdating
                          ? "Submitting..."
                          : editMode
                          ? "Update Feedback"
                          : "Submit Feedback"}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <DataTable<FeedbackRow>
                columns={columns}
                data={data}
                isLoading={isLoading}
                emptyMessage="No feedback found"
                className="bg-transparent text-white"
              />
            </div>
          </div>
        </motion.section>
      </motion.main>
    </DashboardLayout>
  );
};

export default Feedback;