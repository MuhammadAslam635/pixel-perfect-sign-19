/**
 * Email formatting utilities for creating professional-looking HTML emails
 */

export interface EmailTemplateOptions {
  fromName?: string;
  fromEmail?: string;
  subject?: string;
  timestamp?: Date;
}

export class EmailTemplates {
  /**
   * Converts plain text to properly formatted HTML email
   * @param text - The plain text content
   * @param options - Optional template options
   * @returns Object with both text and HTML versions
   */
  static formatEmailContent(
    text: string,
    options: EmailTemplateOptions = {}
  ): {
    text: string;
    html: string;
  } {
    if (!text || text.trim().length === 0) {
      return { text: "", html: "" };
    }

    const cleanText = text.trim();

    // Generate HTML version with proper formatting
    const html = this.createProfessionalEmailHTML(cleanText, options);

    return {
      text: cleanText,
      html,
    };
  }

  /**
   * Formats rich text HTML content for email delivery
   * @param htmlContent - The HTML content from rich text editor
   * @param options - Optional template options
   * @returns Object with both text and HTML versions
   */
  static formatRichTextEmailContent(
    htmlContent: string,
    options: EmailTemplateOptions = {}
  ): {
    text: string;
    html: string;
  } {
    if (!htmlContent || htmlContent.trim().length === 0) {
      return { text: "", html: "" };
    }

    // Extract plain text from HTML
    const plainText = this.htmlToPlainText(htmlContent);

    // Clean and optimize HTML for email clients
    const cleanHtml = this.createRichTextEmailHTML(htmlContent, options);

    return {
      text: plainText,
      html: cleanHtml,
    };
  }

  /**
   * Converts HTML to plain text
   */
  private static htmlToPlainText(html: string): string {
    // Replace common HTML elements with plain text equivalents
    let text = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]*>/g, "");

    // Clean up extra whitespace
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n")
      .trim();
  }

  /**
   * Creates email-optimized HTML from rich text editor content
   */
  private static createRichTextEmailHTML(
    htmlContent: string,
    options: EmailTemplateOptions
  ): string {
    // Clean up Quill.js specific classes and styles
    let cleanHtml = htmlContent
      .replace(/class="[^"]*ql-[^"]*"/gi, "") // Remove Quill classes
      .replace(/style="[^"]*"/gi, "") // Remove inline styles
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Add inline text-align: left to all block elements for Gmail compatibility
    // Gmail often ignores <style> tags, so inline styles are more reliable
    const blockElements = [
      "p",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "li",
      "ul",
      "ol",
      "blockquote",
      "pre",
    ];

    blockElements.forEach((tag) => {
      // Replace tags without attributes: <p> -> <p style="text-align: left;">
      cleanHtml = cleanHtml.replace(
        new RegExp(`<${tag}>`, "gi"),
        `<${tag} style="text-align: left;">`
      );
      // Replace tags with attributes but no style attribute
      cleanHtml = cleanHtml.replace(
        new RegExp(`<${tag}([^>]*?)>`, "gi"),
        (match) => {
          // Check if style already exists in the tag
          if (!match.toLowerCase().includes("style=")) {
            // Add style attribute before the closing >
            return match.replace(/>$/, ' style="text-align: left;">');
          }
          return match;
        }
      );
    });

    // Ensure proper paragraph structure
    if (
      !cleanHtml.includes("<p") &&
      !cleanHtml.includes("<div") &&
      !cleanHtml.includes("<h")
    ) {
      // If no block elements, wrap in paragraph with inline style
      cleanHtml = `<p style="text-align: left;">${cleanHtml}</p>`;
    }

    // Create the full HTML email template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${
      options.subject ? this.escapeHtml(options.subject) : "Email"
    }</title>
    <style>
        /* Reset and base styles */
        body, html {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #ffffff;
            text-align: left;
        }

        /* Email container */
        .email-container {
            max-width: 600px;
            margin: 0;
            background-color: #ffffff;
            padding: 20px;
            text-align: left;
        }

        /* Content styling */
        .email-content {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            text-align: left;
        }

        .email-content p {
            margin: 0 0 1em 0;
            padding: 0;
            text-align: left;
        }

        .email-content h1, .email-content h2, .email-content h3,
        .email-content h4, .email-content h5, .email-content h6 {
            margin: 1.5em 0 0.5em 0;
            padding: 0;
            line-height: 1.2;
            text-align: left;
        }

        .email-content h1 { font-size: 28px; }
        .email-content h2 { font-size: 24px; }
        .email-content h3 { font-size: 20px; }
        .email-content h4 { font-size: 18px; }
        .email-content h5 { font-size: 16px; }
        .email-content h6 { font-size: 14px; }

        .email-content ul, .email-content ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        .email-content li {
            margin: 0.5em 0;
        }

        .email-content strong, .email-content b {
            font-weight: bold;
        }

        .email-content em, .email-content i {
            font-style: italic;
        }

        .email-content u {
            text-decoration: underline;
        }

        .email-content s, .email-content strike {
            text-decoration: line-through;
        }

        .email-content a {
            color: #0066cc;
            text-decoration: underline;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body, html {
                background-color: #ffffff;
                color: #333;
            }
            .email-container {
                background-color: #ffffff;
            }
            .email-content {
                color: #333;
            }
        }

        /* Responsive design */
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 10px;
            }
        }
    </style>
</head>
<body style="text-align: left; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background-color: #ffffff;">
    <div class="email-container" style="max-width: 600px; margin: 0; background-color: #ffffff; padding: 20px; text-align: left;">
        <div class="email-content" style="font-size: 16px; line-height: 1.6; color: #333; text-align: left;">
            ${cleanHtml}
        </div>
    </div>
</body>
</html>`;

    return htmlTemplate.trim();
  }

  /**
   * Creates a professional HTML email template
   */
  private static createProfessionalEmailHTML(
    text: string,
    options: EmailTemplateOptions
  ): string {
    // Split text into paragraphs (double newlines indicate paragraph breaks)
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    // Process each paragraph
    const formattedParagraphs = paragraphs
      .map((paragraph) => {
        // Handle line breaks within paragraphs
        const lines = paragraph
          .split("\n")
          .filter((line) => line.trim().length > 0);

        if (lines.length === 1) {
          // Single line paragraph
          return `<p style="margin: 0 0 1em 0; line-height: 1.6; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; text-align: left;">${this.escapeHtml(
            lines[0]
          )}</p>`;
        } else {
          // Multi-line paragraph - preserve line breaks
          const formattedLines = lines.map((line) =>
            this.escapeHtml(line.trim())
          );
          return `<p style="margin: 0 0 1em 0; line-height: 1.6; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; text-align: left;">${formattedLines.join(
            "<br>"
          )}</p>`;
        }
      })
      .join("");

    // Create the full HTML email template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${
      options.subject ? this.escapeHtml(options.subject) : "Email"
    }</title>
    <style>
        /* Reset and base styles */
        body, html {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #ffffff;
            text-align: left;
        }

        /* Email container */
        .email-container {
            max-width: 600px;
            margin: 0;
            background-color: #ffffff;
            padding: 20px;
            text-align: left;
        }

        /* Content styling */
        .email-content {
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            text-align: left;
        }

        .email-content p {
            margin: 0 0 1em 0;
            padding: 0;
            text-align: left;
        }

        .email-content p:last-child {
            margin-bottom: 0;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body, html {
                background-color: #ffffff;
                color: #333;
            }
            .email-container {
                background-color: #ffffff;
            }
            .email-content {
                color: #333;
            }
        }

        /* Responsive design */
        @media only screen and (max-width: 600px) {
            .email-container {
                padding: 10px;
            }
        }
    </style>
</head>
<body style="text-align: left; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background-color: #ffffff;">
    <div class="email-container" style="max-width: 600px; margin: 0; background-color: #ffffff; padding: 20px; text-align: left;">
        <div class="email-content" style="font-size: 16px; line-height: 1.6; color: #333; text-align: left;">
            ${formattedParagraphs}
        </div>
    </div>
</body>
</html>`;

    return htmlTemplate.trim();
  }

  /**
   * Escapes HTML characters to prevent XSS and ensure proper rendering
   */
  private static escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
  }

  /**
   * Creates a simple HTML email for basic text content
   * @param text - The text content to format
   * @returns HTML string
   */
  static createSimpleHtmlEmail(text: string): string {
    if (!text || text.trim().length === 0) {
      return "";
    }

    const cleanText = text.trim();

    const paragraphs = cleanText
      .split("\n\n")
      .filter((p) => p.trim().length > 0);

    const formattedParagraphs = paragraphs
      .map((paragraph) => {
        const lines = paragraph
          .split("\n")
          .filter((line) => line.trim().length > 0);
        if (lines.length === 1) {
          return `<p style="margin: 0 0 1em 0; line-height: 1.6; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; text-align: left;">${this.escapeHtml(
            lines[0]
          )}</p>`;
        } else {
          const formattedLines = lines.map((line) =>
            this.escapeHtml(line.trim())
          );
          return `<p style="margin: 0 0 1em 0; line-height: 1.6; color: #333; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; text-align: left;">${formattedLines.join(
            "<br>"
          )}</p>`;
        }
      })
      .join("");

    return formattedParagraphs;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use EmailTemplates.formatEmailContent instead
 */
export const formatEmailTextToHtml = (text: string): string => {
  return EmailTemplates.createSimpleHtmlEmail(text);
};
