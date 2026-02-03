import { useState, useCallback } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { companyKnowledgeService } from "@/services/companyKnowledge.service";
import { formatFileSize } from "@/utils/commonFunctions";

type CompanyKnowledgeFileUploadProps = {
  companyId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.png,.jpg,.jpeg";

const CompanyKnowledgeFileUpload = ({ companyId, onSuccess, onCancel }: CompanyKnowledgeFileUploadProps) => {
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
      toast({ title: "Select files first", description: "Choose at least one file to upload to the knowledge base.", variant: "destructive", });
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
        toast({ title: "Upload complete", description: successCount === 1 ? "1 file added to your knowledge base." : `${successCount} files added to your knowledge base.`, });
        setFiles([]);
        onSuccess();
      }
      if (failures.length > 0) {
        toast({ title: "Some uploads failed", description: failures.join(" • "), variant: "destructive", });
      }
    } catch (error: any) {
      toast({ title: "Upload error", description: error?.response?.data?.message || "We couldn't upload your files, please try again.", variant: "destructive", });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-transparent border-none text-white shadow-none space-y-4">
        <CardHeader className="space-y-1 p-0 mt-4">
          <CardTitle className="text-xs sm:text-sm md:text-base font-semibold text-white -mb-1">
            Upload Files
          </CardTitle>
          <CardDescription className="text-[10px] text-white/60">
            PDF, Word, text, spreadsheet, and image files up to 10MB each are supported.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <label htmlFor="knowledge-upload" className="block">
            <div className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border border-white/20 bg-white/5 px-8 py-10 text-center transition  hover:bg-white/10">
              <Upload className="h-8 w-8 text-cyan-200/80" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  Drag and drop files or click to browse
                </p>
                <p className="text-[10px] text-white/60">
                  {ACCEPTED_TYPES.split(",").join(", ")}
                </p>
              </div>
            </div>
            <input id="knowledge-upload" type="file" multiple accept={ACCEPTED_TYPES} className="hidden" onChange={handleFileSelect} />
          </label>

          {files.length > 0 && (
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-medium text-white/80">
                Selected files ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80"
                  >
                    <div className="flex items-center gap-3">
                      <File className="h-3.5 w-3.5 text-cyan-200/80" />
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-white/60">
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

      <div className="flex items-center justify-between gap-4 bg-transparent border-none px-0 py-3 text-[11px] text-white/70">
        <span>
          Upload carefully curated files so your AI agents respond with the best
          context.
        </span>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
            className="text-[10px] h-8 border-white/30 text-white/80 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="relative overflow-hidden flex-none flex h-8 items-center justify-center rounded-full border border-white/40 px-3.5 text-[10px] font-medium tracking-wide transition-all duration-400 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86]"
            style={{
              boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset"
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
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