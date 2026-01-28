import { feedbackService } from "@/services/feedback.service";
import { toast } from "sonner";

// clear markdown function 
export const cleanMarkdown = (text: string): string => {
    if (!text) return text;
    let cleaned = text;
    // Remove ALL types of headers (##, ###, ####, etc.)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    // Remove headers in middle of text too
    cleaned = cleaned.replace(/\n#{1,6}\s+/g, '\n');
    // Remove bold markdown (**text** or __text__)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    // Remove italic markdown (*text* or _text_)
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    // Remove code markdown (`code`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    // Remove strikethrough (~~text~~)
    cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
    // Remove links but keep text [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove images ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    // Remove horizontal rules (---, ***, ___)
    cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');
    // Remove blockquote markers (>)
    cleaned = cleaned.replace(/^>\s+/gm, '');
    // Remove list markers (-, *, +, 1., 2., etc.)
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
    // Clean up extra whitespace and newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    return cleaned;
};

// format file sizes function 
export const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};


// download attachment function 
export const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    const toastId = toast.loading("Downloading attachment...");
    try {
        const blob = await feedbackService.downloadAttachment(fileUrl);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success("Download started");
    } catch (error) {
        console.error("Download failed:", error);
        toast.dismiss(toastId);
        toast.error("Failed to download attachment. Please try again.");
    }
};
