import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import KnowledgeLayout from "@/components/layout/KnowledgeLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CompanyKnowledgeFileUpload from "@/components/knowledge/CompanyKnowledgeFileUpload";
import { useToast } from "@/components/ui/use-toast";
import { companyKnowledgeService } from "@/services/companyKnowledge.service";
import { useCompanyKnowledgeData } from "./hooks";

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const units = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${units[i]}`;
};

const CompanyKnowledgePage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(9);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { query, files, pagination } = useCompanyKnowledgeData({
    page,
    limit,
  });

  useEffect(() => {
    if (query.error) {
      toast({
        title: "Unable to load files",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  const loading = query.isLoading || query.isFetching;
  const totalPages = pagination?.totalPages ?? 1;
  const totalDocs = pagination?.totalDocs ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => companyKnowledgeService.deleteFile(fileId),
    onSuccess: () => {
      toast({
        title: "File removed",
        description: "The document has been deleted from your knowledge base.",
      });
      queryClient.invalidateQueries({ queryKey: ["company-knowledge"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setPage((prevPage) => Math.min(prevPage, totalPages));
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description:
          error?.response?.data?.message || "The file could not be deleted.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (!deleteId || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteId);
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["company-knowledge"] });
    setUploadOpen(false);
    setPage(1);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/70" />
        </div>
      );
    }

    if (!files.length) {
      return (
        <Card className="border-white/10 bg-white/5 text-center text-white/70 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <FileText className="h-16 w-16 text-white/20" />
            <h3 className="text-2xl font-semibold text-white">
              No files uploaded yet
            </h3>
            <p className="max-w-sm text-sm text-white/60">
              Drop in your brand guidelines, playbooks, call scripts, and more.
              These become the context your AI agents rely on.
            </p>
            <Button
              className="bg-gradient-to-r from-[#8B36E9] via-[#6586FF] to-[#2C5FEC]"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <Card
              key={file._id}
              className="border-white/10 bg-white/[0.06] text-white backdrop-blur-xl"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-white">
                    {file.fileName}
                  </CardTitle>
                  <CardDescription className="text-xs text-white/60">
                    {file.fileType || "File"}
                  </CardDescription>
                </div>
                <Button
                  disabled={deleteMutation.isPending}
                  size="icon"
                  variant="ghost"
                  className="text-white/60 hover:text-red-300"
                  onClick={() => {
                    setDeleteId(file._id);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Size</span>
                  <span>{formatFileSize(file.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uploaded</span>
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last updated</span>
                  <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/70 md:flex-row md:items-center md:justify-between">
            <p className="text-sm">{paginationSummary}</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-white/80">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page === totalPages || loading}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    );
  };

  const paginationSummary = useMemo(() => {
    if (!totalDocs) return "No files";
    const start = Math.min((page - 1) * limit + 1, totalDocs);
    const end = Math.min(page * limit, totalDocs);
    return `Showing ${start} to ${end} of ${totalDocs} files`;
  }, [limit, page, totalDocs]);

  return (
    <KnowledgeLayout activeTab="company-knowledge">
      <div className="flex flex-col gap-6 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Company Knowledge Base
            </h2>
            <p className="text-sm text-white/60">
              Upload documents to calibrate messaging, tone, and operational
              workflows for your AI agents.
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#8B36E9] via-[#6586FF] to-[#2C5FEC]"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>

        {renderContent()}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-3xl border border-white/10 bg-[#1C1F2E]/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Upload to Company Knowledge</DialogTitle>
          </DialogHeader>
          <CompanyKnowledgeFileUpload
            onSuccess={handleUploadSuccess}
            onCancel={() => setUploadOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border border-white/10 bg-[#1C1F2E] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This permanently removes the document from your knowledge base.
              The AI agents will no longer reference it for context.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white/70 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KnowledgeLayout>
  );
};

export default CompanyKnowledgePage;
