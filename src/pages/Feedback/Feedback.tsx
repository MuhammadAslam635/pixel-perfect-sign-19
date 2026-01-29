import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feedbackService } from "@/services/feedback.service";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FeedbackType } from "@/types/feedback.types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { feedbackTypes } from "@/mocks/dropdownMock";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, ChevronRight, Bug, Lightbulb, XCircle, AlertTriangle, Calendar, FileText, Search, Filter, X, Paperclip, Download, Timer, CheckCircle, AlertCircle } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Feedback = () => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in-progress" | "closed">("all");
  const [viewMode, setViewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "improvement" as FeedbackType,
    status: "open" as "open" | "in-progress" | "closed",
  });

  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => feedbackService.getAllFeedbacks(),
  });

  const feedbackData = responseData?.feedbacks || [];

  // Filter feedback based on search and status
  const filteredFeedback = useMemo(() => {
    let filtered = feedbackData;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item: any) => item.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.type?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [feedbackData, searchTerm, statusFilter]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const queryClient = useQueryClient();

  const { mutate: createFeedback, isPending: isCreating } = useMutation({
    mutationFn: feedbackService.createFeedback,
    onSuccess: () => {
      toast({ title: "Feedback submitted successfully" });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to create feedback";
      toast({
        title: errorMessage,
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
      });
    },
  });

  const { mutate: deleteFeedback } = useMutation({
    mutationFn: feedbackService.deleteFeedback,
    onSuccess: () => {
      toast({ title: "Feedback deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["feedback"] });
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to delete feedback";
      toast({
        title: errorMessage,
      });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", type: "improvement", status: "open" });
    setFormErrors({});
    setEditMode(false);
    setViewMode(false);
    setEditingId(null);
    setSelectedFiles([]);
    setExistingAttachments([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4" />;
      case "improvement":
        return <Lightbulb className="w-4 h-4" />;
      case "error":
        return <XCircle className="w-4 h-4" />;
      case "failure":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "improvement":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "error":
        return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "failure":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      default:
        return "bg-white/10 text-white/70 border-white/20";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (status === "open") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    if (status === "in-progress") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-green-500/20 text-green-300 border-green-500/30";
  };

  const handleEdit = (feedback: any) => {
    setFormData({
      title: feedback.title,
      description: feedback.description || "",
      type: feedback.type,
      status: feedback.status,
    });
    setExistingAttachments(feedback.attachments || []);
    setEditingId(feedback._id);
    setEditMode(true);
    setOpen(true);
    setFormErrors({});
  };

  const handleDelete = (id: string) => {
    setFeedbackToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (feedbackToDelete) {
      deleteFeedback(feedbackToDelete);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const maxSize = 300 * 1024 * 1024; // 300MB in bytes
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      files.forEach((file) => {
        if (file.size > maxSize) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (oversizedFiles.length > 0) {
        toast({
          title: "File size limit exceeded",
          description: `The following file(s) exceed the 300MB limit: ${oversizedFiles.join(", ")}`,
          variant: "destructive",
        });
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        console.log("Valid files selected:", validFiles);
      }
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (id: string) => {
    setExistingAttachments((prev) => prev.filter((item) => item._id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: { title?: string; description?: string } = {};
    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

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

    // If editing, send the remaining existing attachments as JSON string
    if (editMode) {
      formDataToSend.append('existingAttachments', JSON.stringify(existingAttachments));
    }

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

  const handleView = (feedback: any) => {
    setFormData({
      title: feedback.title,
      description: feedback.description || "",
      type: feedback.type,
      status: feedback.status,
    });

    setExistingAttachments(feedback.attachments || []);
    setViewMode(true);
    setEditMode(false);
    setEditingId(null);
    setOpen(true);
    setFormErrors({});
  };

  const downloadFileFrontend = async (file: any) => {
    console.log("File being downloaded:", file);

    if (!file?.fileUrl) {
      toast({ title: "File URL not found" });
      return;
    }

    // const toastId = toast({ title: "Downloading attachment..." });

    try {
      const blob = await feedbackService.downloadAttachment(file.fileUrl);

      // Create a blob URL
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName || "attachment";
      link.target = "_blank";

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Download started" });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Failed to download attachment",
        variant: "destructive"
      });
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
        className="relative mt-32 mb-4 h-[calc(100vh-12rem)] flex-1 overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white"
      >
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="mx-auto flex flex-col gap-8 space-y-3 pt-3 sm:pt-4 pb-16 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]"
        >
          <div className="flex flex-col gap-6">
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

                <DialogContent
                  className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
                  style={{
                    background: "#0a0a0a"
                  }}
                >
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
                    }}
                  />

                  <div className="relative z-10 flex flex-col h-full min-h-0">
                    <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                      <DialogTitle className="text-lg sm:text-xl font-semibold text-white drop-shadow-lg -mb-1">
                        {viewMode ? "View Feedback" : editMode ? "Edit Feedback" : "Add Feedback"}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
                      <form onSubmit={handleSubmit} className="space-y-4">

                        {viewMode ? (
                          /* View Mode Layout */
                          <div className="space-y-6">
                            {/* Badges and Title Section */}
                            <div className="space-y-4">
                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Type Badge */}
                                <Badge className={`${getTypeBadgeColor(formData.type)} border inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] rounded-full`}>
                                  <span className="[&>svg]:w-3 [&>svg]:h-3 flex items-center">{getTypeIcon(formData.type)}</span>
                                  <span className="capitalize">{formData.type}</span>
                                </Badge>

                                {/* Status Badge */}
                                <Badge className={`${getStatusBadgeColor(formData.status)} border inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] rounded-full`}>
                                  {formData.status === "open" ? (
                                    <AlertCircle className="w-3 h-3" />
                                  ) : formData.status === "in-progress" ? (
                                    <Timer className="w-3 h-3" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  <span className="capitalize">{formData.status.replace(/-/g, " ")}</span>
                                </Badge>
                              </div>

                              {/* Title */}
                              <h3 className="text-lg sm:text-xl font-semibold text-white leading-tight break-words">
                                {formData.title}
                              </h3>
                            </div>

                            {/* Description Section */}
                            <div className="space-y-2">
                              <Label className="text-white/90 text-base font-normal uppercase pl-1">Description</Label>
                              <div className="bg-[#121212] rounded-2xl p-5 border border-white/5">
                                <p className="text-xs sm:text-sm/5 text-white/70 whitespace-pre-wrap tracking-wide leading-relaxed ">
                                  {formData.description}
                                </p>
                              </div>
                            </div>

                            {/* Attachments Section */}
                            {existingAttachments.length > 0 && (
                              <div className="space-y-3">
                                <Label className="text-white/90 text-base uppercase font-medium pl-1">Attachments</Label>
                                <div className="space-y-2">
                                  {existingAttachments.map((file) => (
                                    <div key={file._id} className="flex items-center justify-between p-3 bg-[#121212] border border-white/10 rounded-xl group/file hover:border-white/20 transition-all">
                                      <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-950/30 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                                          <FileText className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-medium text-white/90 truncate">{file.fileName}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        onClick={() => downloadFileFrontend(file)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full border border-cyan-500/20 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all ml-3 flex-shrink-0"
                                        title="Download"
                                      >
                                        <Download className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Edit/Add Mode Layout */
                          <>
                            <div>
                              <Label htmlFor="title" className="text-white/80">Title</Label>
                              <Input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter feedback title"
                                disabled={viewMode}
                                readOnly={viewMode}
                                className={`mt-1.5 bg-white/5 border-white/10 text-white ${formErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              />
                              {formErrors.title && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.title}</p>
                              )}
                            </div>

                            <div>
                              <Label className="text-white/80">Description</Label>
                              <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                rows={4}
                                disabled={viewMode}
                                readOnly={viewMode}
                                className={`mt-1.5 bg-white/5 border-white/10 text-white scrollbar-hide ${formErrors.description ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                              />
                              {formErrors.description && (
                                <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.description}</p>
                              )}
                            </div>

                            <div>
                              <Label className="text-white/80">Type</Label>
                              <div className="mt-1.5">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild disabled={viewMode}>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-between text-white border-white/10 bg-white/5 hover:bg-white/10"
                                    >
                                      {feedbackTypes.find((t) => t.value === formData.type)
                                        ?.label || "Select Type"}
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-[#1a1a1a] text-white border-white/10">
                                    {feedbackTypes.map((item) => (
                                      <DropdownMenuItem
                                        key={item.value}
                                        className="hover:bg-white/10 cursor-pointer focus:bg-white/10 focus:text-white"
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
                            </div>

                            <div className="space-y-3">
                              <Label className="text-white/80">Attachments</Label>
                              {/* Existing Attachments in Edit Mode */}
                              {existingAttachments.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Existing Files</p>
                                  {existingAttachments.map((file) => (
                                    <div key={file._id} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded-lg group/file">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                        <span className="text-xs text-white/80 truncate">{file.fileName}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        onClick={() => removeExistingAttachment(file._id)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Newly Selected Files */}
                              {selectedFiles.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider">New Files</p>
                                  {selectedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-cyan-400/5 border border-cyan-400/20 rounded-lg group/file">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Paperclip className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs text-white/80 truncate">{file.name}</span>
                                          <span className="text-[10px] text-white/50">{formatFileSize(file.size)}</span>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        onClick={() => removeSelectedFile(idx)}
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-white/40 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover/file:opacity-100 transition-opacity"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="space-y-2">
                                <div className="relative">
                                  <Input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="h-14 cursor-pointer text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                                  />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Paperclip className="w-5 h-5 text-white/30" />
                                  </div>
                                </div>
                                <p className="text-xs text-white/50">
                                  You can upload any file type (images, videos, documents, etc.). Maximum file size: 300MB per file.
                                </p>
                              </div>
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
                          </>
                        )}
                      </form>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  type="search"
                  placeholder="Search feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/[0.05] border-white/10 text-white placeholder:text-white/50 focus:border-cyan-400/50 focus:ring-cyan-400/20"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white/[0.05] border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-white/10">Open</SelectItem>
                  <SelectItem value="in-progress" className="text-white hover:bg-white/10">In Progress</SelectItem>
                  <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide pr-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-sm">Loading feedback...</p>
                </div>
              ) : feedbackData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <FileText className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-white/70 text-base font-medium mb-1">No feedback yet</p>
                  <p className="text-white/50 text-sm">Submit your first feedback to get started</p>
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Search className="w-12 h-12 text-white/20 mb-3" />
                  <p className="text-white/70 text-base font-medium mb-1">No results found</p>
                  <p className="text-white/50 text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFeedback.map((feedback: any, index: number) => (
                    <motion.div
                      key={feedback._id}
                      onClick={() => handleView(feedback)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="group relative bg-white/[0.02] border border-white/10 rounded-xl transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Type Badge */}
                        <div className="flex-shrink-0">
                          <Badge className={`${getTypeBadgeColor(feedback.type)} border flex items-center gap-1.5 px-2.5 py-1`}>
                            {getTypeIcon(feedback.type)}
                            <span className="capitalize text-xs">{feedback.type}</span>
                          </Badge>
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-sm mb-0.5 truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                            {feedback.title}
                          </h3>
                          {feedback.description && (
                            <p className="text-white/50 text-xs truncate">
                              {feedback.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 ml-auto flex-shrink-0">
                          {feedback.attachments?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-cyan-400">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{feedback.attachments.length} attachment(s)</span>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="flex-shrink-0">
                            <Badge className={`${getStatusBadgeColor(feedback.status)} border text-xs capitalize px-2.5 py-1`}>
                              {feedback.status.replace(/-/g, " ")}
                            </Badge>
                          </div>

                          {/* Date */}
                          <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 text-white/40 text-xs">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(feedback);
                              }}
                              disabled={feedback.status === "closed"}
                              className={`h-8 w-8 ${feedback.status === "closed"
                                ? "text-gray-500 cursor-not-allowed opacity-50"
                                : "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                }`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(feedback._id);
                              }}
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div >
          </div >
        </motion.section >
      </motion.main >

      <ConfirmDialog
        open={deleteDialogOpen}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setFeedbackToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete your feedback."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </DashboardLayout >
  );
};

export default Feedback;