import FacebookIcon from "@/components/icons/FacebookIcon";
import { cleanMarkdown } from "@/utils/commonFunctions";

export const getStatusColor = (status: string) => {
    switch (status) {
        case "completed":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "in-progress":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "paused":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case "cancelled":
            return "bg-red-100 text-red-800 hover:bg-red-200";
        case "draft":
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
};


export const getPlatformIcon = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return null;

    const hasFacebook = platforms.some((p) => p.toLowerCase() === "facebook");
    const hasGoogle = platforms.some(
        (p) => p.toLowerCase() === "google" || p.toLowerCase() === "google ads"
    );

    if (hasFacebook && hasGoogle) {
        return (
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
                <svg
                    className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
                    viewBox="0 0 24 24"
                >
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            </div>
        );
    } else if (hasFacebook) {
        return (
            <div className="flex items-center flex-shrink-0">
                <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
        );
    } else if (hasGoogle) {
        return (
            <div className="flex items-center flex-shrink-0">
                <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            </div>
        );
    }

    // Default icon for other platforms
    return (
        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        </div>
    );
};



// Helper function to convert URLs in text to anchor tags
export const renderTextWithLinks = (
    text: string | undefined | null
): React.ReactNode => {
    if (!text || typeof text !== "string") return text || "";

    // Regex to match URLs (http, https, www, and common domains)
    const urlRegex =
        /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let hasUrls = false;

    while ((match = urlRegex.exec(text)) !== null) {
        hasUrls = true;
        // Add text before the URL
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        // Process the URL
        const url = match[0];
        let href = url;

        // Add protocol if missing
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            href = url.startsWith("www.") ? `https://${url}` : `https://${url}`;
        }

        // Add anchor tag
        parts.push(
            <a
                key={match.index}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline break-all"
                onClick={(e) => e.stopPropagation()}
            >
                {url}
            </a>
        );

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return hasUrls ? parts : text;
};


// helper function for clearmarkdown 
export const renderCleanContent = (content?: string) => {
    if (!content) return null;
    return renderTextWithLinks(cleanMarkdown(content));
};