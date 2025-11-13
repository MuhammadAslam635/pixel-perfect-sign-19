import { useState, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { companyKnowledgeService } from "@/services/companyKnowledge.service";

type CompanyKnowledgeFileUploadProps = {
  companyId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

const ACCEPTED_TYPES =
  ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg";

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${Math.round(value * 100) / 100} ${units[i]}`;
};

const CompanyKnowledgeFileUpload = ({
  companyId,
  onSuccess,
  onCancel,
}: CompanyKnowledgeFileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) return;
      setFiles((prev) => [...prev, ...Array.from(event.target.files!)]);
    },
    []
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "Select files first",
        description:
          "Choose at least one file to upload to the knowledge base.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      let successCount = 0;
      const failures: string[] = [];

      for (const file of files) {
        try {
          await companyKnowledgeService.uploadFile(file, { companyId });
          successCount += 1;
        } catch (error: any) {
          const message =
            error?.response?.data?.message || "Upload failed unexpectedly";
          failures.push(`${file.name}: ${message}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Upload complete",
          description:
            successCount === 1
              ? "1 file added to your knowledge base."
              : `${successCount} files added to your knowledge base.`,
        });
        setFiles([]);
        onSuccess();
      }

      if (failures.length > 0) {
        toast({
          title: "Some uploads failed",
          description: failures.join(" • "),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload error",
        description:
          error?.response?.data?.message ||
          "We couldn't upload your files, please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-white/15 bg-gradient-to-br from-[#1f3032] via-[#243f42] to-[#1b2c2d] text-white shadow-[0_18px_45px_-25px_rgba(19,82,87,0.55)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold text-white">
            Upload Files
          </CardTitle>
          <CardDescription className="text-sm text-white/60">
            PDF, Word, text, spreadsheet, and image files up to 10MB each are
            supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label htmlFor="knowledge-upload" className="block">
            <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 px-8 py-10 text-center transition hover:border-cyan-300/60 hover:bg-white/10">
              <Upload className="h-10 w-10 text-cyan-200/80" />
              <div className="space-y-1">
                <p className="text-base font-medium text-white">
                  Drag and drop files or click to browse
                </p>
                <p className="text-xs text-white/60">
                  {ACCEPTED_TYPES.split(",").join(", ")}
                </p>
              </div>
            </div>
            <input
              id="knowledge-upload"
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>

          {files.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-white/80">
                Selected files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-gradient-to-r from-white/10 via-transparent to-white/5 px-4 py-3 text-sm text-white/80"
                  >
                    <div className="flex items-center gap-3">
                      <File className="h-4 w-4 text-cyan-200/80" />
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {file.name}
                        </span>
                        <span className="text-xs text-white/60">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/60 hover:text-red-300"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032]/90 via-[#243f42]/90 to-[#1b2c2d]/90 px-5 py-4 text-sm text-white/70 shadow-[0_18px_40px_-25px_rgba(19,82,87,0.45)]">
        <span>
          Upload carefully curated files so your AI agents respond with the best
          context.
        </span>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
            className="border-white/30 text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white shadow-[0_15px_30px_-18px_rgba(42,156,179,0.7)]"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload Files"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyKnowledgeFileUpload;
