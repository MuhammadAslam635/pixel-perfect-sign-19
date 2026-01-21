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