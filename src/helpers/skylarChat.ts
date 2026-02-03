// Animation variants for page transitions
export const pageVariants = {
    hidden: {
        opacity: 0,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: {
            duration: 0.3,
        },
    },
} as any;

export const composerVariants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut",
            delay: 0.1,
        },
    } as any,
};

// Helper to derive a conversation title from messages when server doesn't provide one
export const deriveTitleFromMessages = (messages: any[] | undefined) => {
    if (!messages || !messages.length) return null;
    const assistantMsg =
        messages.find((m) => m.role === "assistant" || m.role === "system") ||
        messages[0];
    if (!assistantMsg || !assistantMsg.content) return null;
    try {
        const text = assistantMsg.content
            .replace(/```[\s\S]*?```/g, "") // remove code blocks
            .replace(/[#>*_`\[\]]/g, "")
            .split("\n")[0]
            .trim();
        if (!text) return null;
        const truncated = text.length > 50 ? `${text.slice(0, 47)}...` : text;
        return truncated;
    } catch (e) {
        return null;
    }
};