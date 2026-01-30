import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Grid3x3,
  List,
} from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { proposalExampleService, ProposalExampleUploadMetadata } from "@/services/proposalExample.service";
import { useProposalExamplesData } from "@/pages/companyKnowledgeBase/hooks";
import { Badge } from "@/components/ui/badge";
import API from "@/utils/api";

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const units = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${units[i]}`;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
};

const ProposalExamplesPanel = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [documentName, setDocumentName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { query, examples, pagination } = useProposalExamplesData({
    page,
    limit,
  });

  useEffect(() => {
    if (query.error) {
      toast({
        title: "Unable to load proposals",
        description: query.error.message,
        variant: "destructive",
      });
    }
  }, [query.error, toast]);

  const loading = query.isLoading || query.isFetching;
  const totalPages = pagination?.totalPages ?? 1;
  const totalDocs = pagination?.totalDocs ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (exampleId: string) => proposalExampleService.deleteExample(exampleId),
    onSuccess: () => {
      toast({
        title: "Removed",
        description: "The proposal has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["proposal-examples"] });
      setDeleteOpen(false);
      setDeleteId(null);
      setPage((prevPage) => Math.min(prevPage, totalPages));
      // Dispatch event to update profile completion
      window.dispatchEvent(new CustomEvent("proposal_updated"));
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description:
          error?.response?.data?.message || "Could not be deleted.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (!deleteId || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteId);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    if (!documentName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a document name before uploading.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const uploadMetadata: ProposalExampleUploadMetadata = {
        name: documentName.trim(),
        tags: tags.length > 0 ? tags : undefined,
      };

      await proposalExampleService.uploadExample(selectedFile, uploadMetadata);

      toast({
        title: "Uploaded",
        description: "Your proposal has been successfully uploaded.",
      });

      queryClient.invalidateQueries({ queryKey: ["proposal-examples"] });
      setUploadOpen(false);
      setSelectedFile(null);
      setTags([]);
      setDocumentName("");
      setPage(1);
      // Dispatch event to update profile completion
      window.dispatchEvent(new CustomEvent("proposal_updated"));
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description:
          error?.response?.data?.message || "Failed to upload proposal.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const renderGridView = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {examples.map((example) => (
        <Card
          key={example._id}
          className="group relative border border-white/10 bg-white/5 text-white transition-all hover:border-cyan-500/30 hover:bg-white/10"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <FileText className="h-5 w-5 flex-shrink-0 text-cyan-500" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => {
                  setDeleteId(example._id);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <CardTitle className="line-clamp-2 text-sm text-white">
              {example.fileName}
            </CardTitle>
            <CardDescription className="text-[10px] text-white/60">
              {formatFileSize(example.fileSize)} • {formatDate(example.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {example.metadata?.tags && example.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {example.metadata.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-[8px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <Button
              variant="link"
              className="h-auto p-0 text-[10px] text-cyan-500 hover:text-cyan-400"
              onClick={() => {
                if (example.fileUrl) {
                  const backendUrl = API.defaults.baseURL || "";
                  const backendOrigin = backendUrl.replace(/\/api\/?$/, "");
                  window.open(`${backendOrigin}/uploads/${example.fileUrl}`, "_blank");
                }
              }}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View PDF
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {examples.map((example) => (
        <Card
          key={example._id}
          className="group border border-white/10 bg-white/5 text-white transition-all hover:border-cyan-500/30 hover:bg-white/10"
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 flex-shrink-0 text-cyan-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {example.fileName}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-white/60">
                  <span>{formatFileSize(example.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(example.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {example.metadata?.tags && example.metadata.tags.length > 0 && (
                <div className="hidden sm:flex gap-1">
                  {example.metadata.tags.slice(0, 2).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-[8px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (example.fileUrl) {
                    const backendUrl = API.defaults.baseURL || "";
                    const backendOrigin = backendUrl.replace(/\/api\/?$/, "");
                    window.open(`${backendOrigin}/uploads/${example.fileUrl}`, "_blank");
                  }
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setDeleteId(example._id);
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/70" />
        </div>
      );
    }

    if (!examples.length) {
      return (
        <Card className="border border-white/10 bg-transparent text-center text-white/75">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <FileText className="h-16 w-16 text-white/40" />
            <h3 className="text-sm font-semibold text-white">
              No proposals uploaded yet
            </h3>
            <p className="max-w-sm text-[10px] text-white/70">
              Upload successful proposal PDFs to help AI generate better proposals for your leads.
            </p>
            <Button
              className="mt-3 text-[10px] h-8 bg-white/10 text-white hover:bg-white/20"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="mr-1.5 h-3 w-3" />
              Upload Proposal
            </Button>
          </CardContent>
        </Card>
      );
    }

    return viewMode === "grid" ? renderGridView() : renderListView();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Proposals</h2>
          <p className="text-xs text-white/70">
            {totalDocs} {totalDocs === 1 ? "proposal" : "proposals"} uploaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-white/10 bg-white/5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${viewMode === "grid" ? "bg-white/10" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-3 ${viewMode === "list" ? "bg-white/10" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={() => setUploadOpen(true)}
            className="bg-cyan-600 text-white hover:bg-cyan-700 h-8 text-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {renderContent()}

      {!loading && examples.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-white/70">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Proposal</DialogTitle>
            <DialogDescription>
              Upload a successful proposal PDF to improve future generations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file">PDF File *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="cursor-pointer"

              />
              {selectedFile && (
                <p className="mt-1 text-xs text-white/70">{selectedFile.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="documentName">Document Name *</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name"
                required
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag and press Enter"
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                setSelectedFile(null);
                setTags([]);
                setDocumentName("");
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !documentName.trim() || uploading}
              className="w-full sm:w-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this proposal. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProposalExamplesPanel;
