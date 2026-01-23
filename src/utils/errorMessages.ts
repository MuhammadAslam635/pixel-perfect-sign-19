/**
 * Sanitizes error messages to remove technical details and make them user-friendly.
 * Removes HTTP status codes, request information, technical error codes, and other technical details.
 * Handles connectivity errors and server errors (500) with user-friendly messages.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage: string = "Something went wrong. Please try again."
): string {
  // Check for connectivity/network errors and server errors first
  if (error && typeof error === "object") {
    const axiosError = error as {
      response?: { status?: number; data?: { message?: string } };
      code?: string;
      message?: string;
      request?: unknown;
    };

    // Handle server errors (5xx) - these have a response
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      // Handle 500 server errors
      if (status === 500) {
        return "The server encountered an error. Please try again in a moment. If the problem persists, check your internet connection.";
      }

      // Handle other 5xx server errors
      if (status && status >= 500) {
        return "The server is temporarily unavailable. Please check your internet connection and try again.";
      }

      // For other response errors (4xx, etc.), continue with normal processing below
    } else {
      // No response means it's likely a network/connectivity error
      // Check for specific network error codes
      const networkErrorCodes = [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "ECONNRESET",
        "ENETUNREACH",
        "ERR_NETWORK",
        "ERR_INTERNET_DISCONNECTED",
        "ERR_CONNECTION_REFUSED",
        "ERR_CONNECTION_TIMED_OUT",
        "ERR_CONNECTION_RESET",
      ];

      const errorCode = axiosError.code || "";
      const errorMessage = axiosError.message || "";

      // Check if it's a network error
      if (
        networkErrorCodes.some(
          (code) =>
            errorCode.includes(code) ||
            errorMessage.toUpperCase().includes(code)
        ) ||
        errorMessage.includes("Network Error") ||
        errorMessage.includes("network error") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("failed to fetch") ||
        errorMessage.includes("Load failed") ||
        errorMessage.includes("load failed")
      ) {
        return "Unable to connect to the server. Please check your internet connection and try again.";
      }

      // Generic network error (no response and no specific code)
      // If it's an axios error without a response, it's likely a network issue
      if ("code" in error || "request" in error) {
        return "Connection error. Please check your internet connection and try again.";
      }
    }
  }

  let message = fallbackMessage;

  // Extract message from various error formats
  if (error && typeof error === "object") {
    // Axios error format
    if ("response" in error && error.response) {
      const response = error.response as { data?: { message?: string } };
      if (response.data?.message) {
        message = response.data.message;
      }
    }
    // Error object with message property
    else if ("message" in error && typeof error.message === "string") {
      message = error.message;
    }
    // Error object with error property
    else if ("error" in error && error.error) {
      if (typeof error.error === "string") {
        message = error.error;
      } else if (
        typeof error.error === "object" &&
        "message" in error.error &&
        typeof error.error.message === "string"
      ) {
        message = error.error.message;
      }
    }
  } else if (typeof error === "string") {
    message = error;
    
    // Check for connectivity-related strings
    if (
      message.includes("Failed to fetch") ||
      message.includes("failed to fetch") ||
      message.includes("NetworkError") ||
      message.includes("network error") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ENOTFOUND")
    ) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
  }

  // Remove HTTP status codes (e.g., "404", "500", "Status: 400", "HTTP 404")
  message = message.replace(/\b(HTTP\s*)?\d{3}\b/gi, "");
  message = message.replace(/\bstatus\s*:?\s*\d{3}\b/gi, "");
  message = message.replace(/\bstatusCode\s*:?\s*\d{3}\b/gi, "");
  message = message.replace(/\bstatus_code\s*:?\s*\d{3}\b/gi, "");

  // Remove technical error codes (e.g., "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND")
  message = message.replace(/\b[A-Z]{2,}_?[A-Z0-9_]+\b/g, "");

  // Extract resource name from URLs/endpoints before removing them (for "Failed to fetch" messages)
  let extractedResource: string | null = null;
  const urlMatch = message.match(/(?:Failed\s+to\s+fetch|failed\s+to\s+fetch)\s+(?:https?:\/\/[^\s]+|\/api\/([a-z-]+))/i);
  if (urlMatch && urlMatch[1]) {
    extractedResource = urlMatch[1].replace(/-/g, " ");
  }

  // Convert "Failed to fetch" to user-friendly messages
  // Try to capture what was being fetched
  message = message.replace(/\bFailed\s+to\s+fetch\s+(.+?)(?:\s|$|\.|,|;|:)/gi, (match, resource) => {
    let cleanResource = resource.trim();
    // If it's an API endpoint, extract the resource name
    if (cleanResource.includes("/api/")) {
      const parts = cleanResource.split("/api/");
      if (parts[1]) {
        cleanResource = parts[1].split("/")[0].replace(/-/g, " ");
      }
    }
    // If it's a full URL, use extracted resource or generic message
    if (cleanResource.includes("http") || cleanResource.startsWith("/")) {
      return extractedResource ? `Unable to load ${extractedResource}` : "Unable to load";
    }
    return `Unable to load ${cleanResource}`;
  });
  // Handle cases where "Failed to fetch" is at the end or standalone
  if (message.includes("Failed to fetch") || message.includes("failed to fetch")) {
    message = message.replace(/\bFailed\s+to\s+fetch\b/gi, extractedResource ? `Unable to load ${extractedResource}` : "Unable to load");
    message = message.replace(/\bfailed\s+to\s+fetch\b/gi, extractedResource ? `Unable to load ${extractedResource}` : "Unable to load");
  }
  
  // Remove request/response technical details
  message = message.replace(/\bRequest\s+failed\b/gi, "Request could not be completed");
  message = message.replace(/\bNetwork\s+error\b/gi, "Connection issue");
  message = message.replace(/\bAPI\s+error\b/gi, "");
  message = message.replace(/\bFetch\s+error\b/gi, "Unable to load");

  // Remove URL/endpoint information (but preserve resource names we've already extracted)
  message = message.replace(/https?:\/\/[^\s]+/gi, "");
  // Remove API endpoints (we've already extracted the resource name above)
  message = message.replace(/\/api\/[^\s]+/gi, "");
  message = message.replace(/endpoint[:\s]+[^\s]+/gi, "");

  // Remove stack trace indicators
  message = message.replace(/\bat\s+[^\n]+/g, "");
  message = message.replace(/Error:\s*/gi, "");

  // Remove JSON/object notation that might leak technical details (but be more careful)
  // Only remove if it looks like technical JSON, not if it's part of a readable message
  message = message.replace(/\{[^}]{0,50}\}/g, (match) => {
    // Only remove if it looks like technical JSON (has colons, quotes, etc.)
    if (match.includes(":") && (match.includes('"') || match.includes("'"))) {
      return "";
    }
    return match;
  });
  message = message.replace(/\[[^\]]{0,50}\]/g, (match) => {
    // Only remove if it looks like technical array notation
    if (match.includes(":") || match.match(/^\d+$/)) {
      return "";
    }
    return match;
  });

  // Clean up extra whitespace and punctuation
  message = message.replace(/\s+/g, " ").trim();
  message = message.replace(/^[:\-,\s]+|[:\-,\s]+$/g, "");
  message = message.replace(/\.{2,}/g, ".");

  // If message is empty or too short after sanitization, use fallback
  if (!message || message.length < 3) {
    return fallbackMessage;
  }

  // If message is just "Unable to load" or similar generic phrases without context, use fallback
  const genericPhrases = [
    /^Unable\s+to\s+load\s*\.?$/i,
    /^Unable\s+to\s+load\s*$/i,
    /^Request\s+could\s+not\s+be\s+completed\s*\.?$/i,
    /^Connection\s+issue\s*\.?$/i,
  ];
  
  const isGeneric = genericPhrases.some(phrase => phrase.test(message));
  if (isGeneric) {
    return fallbackMessage;
  }

  // Capitalize first letter
  message = message.charAt(0).toUpperCase() + message.slice(1);

  return message;
}

/**
 * Gets a user-friendly error message from an error object.
 * This is a convenience wrapper around sanitizeErrorMessage.
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  fallbackMessage?: string
): string {
  return sanitizeErrorMessage(error, fallbackMessage);
}
