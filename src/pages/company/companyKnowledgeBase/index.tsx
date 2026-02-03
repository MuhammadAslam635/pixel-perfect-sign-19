import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import KnowledgeLayout from "@/pages/company/companyKnowledgeBase/components/KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import CompanyKnowledgeFileUpload from "@/pages/company/companyKnowledgeBase/components/CompanyKnowledgeFileUpload";
import { useToast } from "@/components/ui/use-toast";
import { companyKnowledgeService } from "@/services/companyKnowledge.service";
import { useCompanyKnowledgeData } from "./hooks";
import OnboardingPanel from "@/pages/company/companyKnowledgeBase/components/OnboardingPanel";
import ProposalExamplesPanel from "@/pages/company/companyKnowledgeBase/components/ProposalExamplesPanel";
import { getAuthToken } from "@/utils/authHelpers";
import API from "@/utils/api";
import CompanyKnowledge from "./components/CompanyKnowledge";
import { useOnboardingData } from "./hooks";

const CompanyKnowledgePage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { query, files, pagination } = useCompanyKnowledgeData({ page, limit, });
  const { data: onboardingData } = useOnboardingData();
  useEffect(() => {
    if (query.error) {
      toast({ title: "Unable to load files", description: query.error.message, variant: "destructive", });
    }
  }, [query.error, toast]);

  const loading = query.isLoading || query.isFetching;
  const totalPages = pagination?.totalPages ?? 1;
  const totalDocs = pagination?.totalDocs ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => companyKnowledgeService.deleteFile(fileId),
    onSuccess: () => {
      toast({ title: "File removed", description: "The document has been deleted from your knowledge base.", });
      queryClient.invalidateQueries({ queryKey: ["company-knowledge"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setPage((prevPage) => Math.min(prevPage, totalPages));
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error?.response?.data?.message || "The file could not be deleted.", variant: "destructive", });
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

  const handleKnowledgeDocumentClick = (doc: any) => {
    try {
      const token = getAuthToken();
      const baseURL = API.defaults.baseURL || "";
      const documentUrl = `${baseURL}/company-knowledge/files/${doc._id}/view?token=${token}`;
      window.open(documentUrl, "_blank");
    } catch (error) {
      console.error("Error opening document:", error);
      toast({ title: "Error", description: "Could not open document", variant: "destructive", });
    }
  };

  const paginationSummary = useMemo(() => {
    if (!totalDocs) return "No files";
    const start = Math.min((page - 1) * limit + 1, totalDocs);
    const end = Math.min(page * limit, totalDocs);
    return `Showing ${start} to ${end} of ${totalDocs} files`;
  }, [limit, page, totalDocs]);

  return (
    <KnowledgeLayout
      initialTab="company-knowledge"
      onboardingContent={<OnboardingPanel />}
      proposalExamplesContent={<ProposalExamplesPanel />}
      supportingDocuments={onboardingData?.supportingDocuments || []}
      knowledgeDocuments={files || []}
      onKnowledgeDocumentClick={handleKnowledgeDocumentClick}
    >
      <div className="flex flex-col gap-6 text-white">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-1">
              Company Knowledge Base
            </h2>
            <p className="text-[10px] text-white/60">
              Upload documents to calibrate messaging, tone, and operational
              workflows for your AI agents.
            </p>
          </div>
          <Button
            className="mt-3 text-[10px] h-8 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Upload Files
          </Button>
        </div>

        <CompanyKnowledge
          loading={loading}
          files={files}
          page={page}
          totalPages={totalPages}
          paginationSummary={paginationSummary}
          onOpenFile={handleKnowledgeDocumentClick}
          onUploadClick={() => setUploadOpen(true)}
          onDeleteClick={(id) => {
            setDeleteId(id);
            setDeleteOpen(true);
          }}
          onPrevPage={() => setPage((p) => Math.max(p - 1, 1))}
          onNextPage={() => setPage((p) => Math.min(p + 1, totalPages))}
        />
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-3xl border border-white/10 bg-[#1a1a1a] text-white">
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
        <AlertDialogContent className="border border-white/10 bg-[#1a1a1a] text-white">
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