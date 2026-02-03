// src/helpers/email.ts
export const stripQuotedEmailContent = (content: string): string => {
    if (!content) {
        return "";
    }

    const normalized = content.replace(/\r\n/g, "\n");

    const quoteRegexes = [
        /\nOn\s[\w\s,.:@]+\sat\s[\d:]+\s?[APM]+\s.+?\s?wrote:\s*/i,
        /\nOn\s.+?\swrote:\s*/i,
        /\nFrom:\s.+/i,
        /\nSent:\s.+/i,
        /\nSubject:\s.+/i,
        /\nTo:\s.+/i,
        /\nDate:\s.+/i,
        /\n-{2,}\s*Original Message\s*-{2,}/i,
        /\n-{2,}\s*Forwarded message\s*-{2,}/i,
    ];

    let cutoffIndex = normalized.length;

    for (const regex of quoteRegexes) {
        const matchIndex = normalized.search(regex);
        if (matchIndex !== -1 && matchIndex < cutoffIndex) {
            cutoffIndex = matchIndex;
        }
    }

    const withoutMarkers = normalized.slice(0, cutoffIndex);

    const withoutQuotedLines = withoutMarkers
        .split("\n")
        .filter(
            (line) =>
                !line.trim().startsWith(">") &&
                !line.trim().startsWith("--")
        )
        .join("\n")
        .trim();

    if (withoutQuotedLines) {
        return withoutQuotedLines;
    }

    const fallback = normalized
        .split("\n")
        .filter(
            (line) =>
                !line.trim().startsWith(">") &&
                !line.trim().startsWith("--")
        )
        .join("\n")
        .trim();

    return fallback || content.trim();
};
