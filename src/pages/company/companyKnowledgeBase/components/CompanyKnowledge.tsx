import {
    Plus,
    Trash2,
    FileText,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { formatedDate, formatFileSize } from "@/utils/commonFunctions";

interface Props {
    loading: boolean;
    files: any[];
    page: number;
    totalPages: number;
    paginationSummary: string;
    onOpenFile: (file: any) => void;
    onDeleteClick: (id: string) => void;
    onUploadClick: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
}

const CompanyKnowledge = ({
    loading,
    files,
    page,
    totalPages,
    paginationSummary,
    onOpenFile,
    onDeleteClick,
    onUploadClick,
    onPrevPage,
    onNextPage,
}: Props) => {
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
                <Card className="border border-white/10 bg-transparent text-center text-white/75">
                    <CardContent className="flex flex-col items-center gap-4 py-16">
                        <FileText className="h-16 w-16 text-white/40" />
                        <h3 className="text-sm font-semibold text-white">
                            No files uploaded yet
                        </h3>
                        <Button
                            className="mt-3 text-[10px] h-8 bg-white/10 text-white hover:bg-white/20"
                            onClick={onUploadClick}
                        >
                            <Plus className="mr-1.5 h-3 w-3" />
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
                            className="border border-white/10 bg-transparent text-white cursor-pointer hover:border-cyan-500/30"
                            onClick={() => onOpenFile(file)}
                        >
                            <CardHeader className="flex flex-row justify-between">
                                <div>
                                    <CardTitle className="text-lg">
                                        {file.fileName}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-white/60">
                                        {file.fileType || "File"}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <ExternalLink className="h-4 w-4 text-white/40" />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-white/60 hover:text-red-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteClick(file._id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="text-sm text-white/70 space-y-2">
                                <div className="flex justify-between">
                                    <span>Size</span>
                                    <span>{formatFileSize(file.fileSize)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Uploaded</span>
                                    <span>{formatedDate(file.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-between mt-6 text-white/70">
                        <p>{paginationSummary}</p>
                        <div className="flex gap-3">
                            <Button size="sm" onClick={onPrevPage} disabled={page === 1}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                onClick={onNextPage}
                                disabled={page === totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return <>{renderContent()}</>;
};

export default CompanyKnowledge;