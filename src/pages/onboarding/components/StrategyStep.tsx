import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { OnboardingQuestions, SupportingDocument } from "@/types/onboarding.types";
import { onboardingService } from "@/services/onboarding.service";
import { toast } from "sonner";
import {
  Sparkles,
  Upload,
  FileText,
  Trash2,
  Loader2,
  FileImage,
  FileSpreadsheet,
  File,
} from "lucide-react";

interface StrategyStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
  documents: SupportingDocument[];
  onDocumentsChange: (documents: SupportingDocument[]) => void;
}

const StrategyStep = ({
  formData,
  updateFormData,
  documents,
  onDocumentsChange,
}: StrategyStepProps) => {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];

    const invalidFiles = fileArray.filter((f) => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast.error("Some files have unsupported formats. Allowed: images, PDF, Word, Excel, PowerPoint, TXT");
      return;
    }

    // Check file sizes (10MB max per file)
    const oversizedFiles = fileArray.filter((f) => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Some files exceed the 10MB size limit");
      return;
    }

    try {
      setUploading(true);
      const response = await onboardingService.uploadDocuments(fileArray);
      if (response.success) {
        toast.success(`${response.data.uploadedCount} document(s) uploaded successfully`);
        onDocumentsChange([...documents, ...response.data.documents]);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error?.response?.data?.message || "Failed to upload documents");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      const response = await onboardingService.deleteDocument(documentId);
      if (response.success) {
        toast.success("Document deleted");
        onDocumentsChange(documents.filter((d) => d._id !== documentId));
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
      return <FileImage className="h-5 w-5 text-green-400" />;
    }
    if (["xls", "xlsx"].includes(ext || "")) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    }
    if (ext === "pdf") {
      return <FileText className="h-5 w-5 text-red-400" />;
    }
    return <File className="h-5 w-5 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Q14: Differentiators */}
      <div className="space-y-2">
        <Label htmlFor="differentiators" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          What Makes You Different?
        </Label>
        <Textarea
          id="differentiators"
          value={formData.differentiators || ""}
          onChange={(e) => updateFormData({ differentiators: e.target.value })}
          placeholder="What key advantages or differentiators set you apart from competitors?"
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[120px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">10-1000 characters</p>
      </div>

      {/* Q15: Supporting Documents */}
      <div className="space-y-4">
        <Label className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Upload className="h-4 w-4 text-cyan-400" />
          Supporting Documents
        </Label>
        <p className="text-xs text-white/60">
          Please upload any materials that can help us understand your business better
          (e.g., org chart, process map, KPI reports, sample RFPs, brand guidelines, marketing decks)
        </p>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer
            transition-all duration-200 hover:border-cyan-400/50 hover:bg-white/[0.02]
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-white/60 text-xs">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-white/40" />
              <p className="text-white/60 text-xs">Click to upload or drag and drop</p>
              <p className="text-xs text-white/40">
                PDF, Word, Excel, PowerPoint, Images, TXT (max 10MB each)
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/60">{documents.length} document(s) uploaded</p>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc._id || doc.filePath}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(doc.fileName)}
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{doc.fileName}</p>
                      <p className="text-xs text-white/40">
                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => doc._id && handleDeleteDocument(doc._id)}
                    disabled={deletingId === doc._id}
                    className="text-white/40 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                  >
                    {deletingId === doc._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyStep;