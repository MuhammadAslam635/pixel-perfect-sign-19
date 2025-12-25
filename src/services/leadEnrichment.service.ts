import API from "@/utils/api";
import type {
  IndustryCategoriesResponse,
  IndustryCategoryTreeResponse,
  DomainEnrichmentRequest,
  DomainEnrichmentResponse,
  QueryEnrichmentRequest,
  QueryEnrichmentResponse,
  EnrichmentStatusResponse,
} from "@/types/leadEnrichment";

/**
 * Lead Enrichment Service
 *
 * Handles API calls for the lead enrichment system:
 * - Industry category fetching
 * - Direct domain enrichment (Tab 1)
 * - Advanced query enrichment (Tab 2)
 * - Enrichment status tracking
 */

export const leadEnrichmentService = {
  /**
   * Get industry categories for filters
   * @param level - Category level (1, 2, or 3)
   * @param parentId - Parent category ID for hierarchical filtering
   */
  getIndustryCategories: async (
    level?: number,
    parentId?: string | null
  ): Promise<IndustryCategoriesResponse> => {
    const params: Record<string, string> = {};
    if (level !== undefined) params.level = level.toString();
    if (parentId !== undefined)
      params.parentId = parentId === null ? "null" : parentId;

    const response = await API.get("/leads/enrichment/categories", { params });
    return response.data;
  },

  /**
   * Get hierarchical category tree
   */
  getIndustryCategoryTree: async (): Promise<IndustryCategoryTreeResponse> => {
    const response = await API.get("/leads/enrichment/categories/tree");
    return response.data;
  },

  /**
   * Direct Domain Enrichment (Tab 1)
   * Bypasses Perplexity - directly sends domains to Apollo microservice
   *
   * @param domains - Array of company domains (e.g., ["microsoft.com", "apple.com"])
   * @param selectedSeniorities - Optional array of seniority levels to filter by
   */
  enrichByDomain: async (
    domains: string[],
    selectedSeniorities?: string[]
  ): Promise<DomainEnrichmentResponse> => {
    const request: DomainEnrichmentRequest = {
      domains,
      selectedSeniorities
    };
    const response = await API.post("/leads/enrichment/domain", request);
    return response.data;
  },

  /**
   * Advanced Query Enrichment (Tab 2)
   * Uses Perplexity AI to discover companies, then enriches via Apollo microservice
   *
   * @param request - Query enrichment request with filters
   */
  enrichByQuery: async (
    request: QueryEnrichmentRequest
  ): Promise<QueryEnrichmentResponse> => {
    const response = await API.post("/leads/enrichment/query", request);
    return response.data;
  },

  /**
   * Get enrichment status
   * @param searchId - Search ID returned from enrichment request
   */
  getEnrichmentStatus: async (
    searchId: string
  ): Promise<EnrichmentStatusResponse> => {
    const response = await API.get(`/leads/enrichment/status/${searchId}`);
    return response.data;
  },

  /**
   * Poll enrichment status until completion
   * @param searchId - Search ID to track
   * @param onUpdate - Callback for status updates
   * @param intervalMs - Polling interval in milliseconds (default: 5000)
   * @param maxAttempts - Maximum polling attempts (default: 120 = 10 minutes at 5s intervals)
   */
  pollEnrichmentStatus: async (
    searchId: string,
    onUpdate: (status: EnrichmentStatusResponse) => void,
    intervalMs: number = 5000,
    maxAttempts: number = 120
  ): Promise<EnrichmentStatusResponse> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          attempts++;

          const statusResponse =
            await leadEnrichmentService.getEnrichmentStatus(searchId);
          onUpdate(statusResponse);

          // Check if enrichment is complete
          if (
            statusResponse.data.status === "completed" ||
            statusResponse.data.status === "failed"
          ) {
            clearInterval(intervalId);
            resolve(statusResponse);
          }

          // Check max attempts
          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            reject(new Error("Enrichment polling timeout"));
          }
        } catch (error) {
          clearInterval(intervalId);
          reject(error);
        }
      }, intervalMs);
    });
  },

  /**
   * Extract clean domain from URL or domain string
   * Handles: https://www.example.com/path -> example.com
   * @param input - URL or domain string
   */
  extractDomain: (input: string): string => {
    let cleaned = input.trim();

    // Remove protocol (http://, https://)
    cleaned = cleaned.replace(/^https?:\/\//i, "");

    // Remove www.
    cleaned = cleaned.replace(/^www\./i, "");

    // Remove path, query, and fragment (everything after first /)
    cleaned = cleaned.split("/")[0];

    // Remove port if present
    cleaned = cleaned.split(":")[0];

    return cleaned;
  },

  /**
   * Validate domain format
   * Supports single and multi-part TLDs (e.g., .com, .co.uk, .com.au)
   * Automatically extracts domain from URLs
   * @param input - Domain or URL to validate
   */
  validateDomain: (input: string): boolean => {
    // Extract clean domain from URL if needed
    const domain = leadEnrichmentService.extractDomain(input);

    // Updated regex to support multi-part TLDs like .co.uk, .com.au
    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}\.)?[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  },

  /**
   * Parse and validate multiple domains
   * @param input - Comma or newline separated domains or URLs
   */
  parseDomains: (input: string): { valid: string[]; invalid: string[] } => {
    const inputs = input
      .split(/[,\n]/)
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const valid: string[] = [];
    const invalid: string[] = [];

    inputs.forEach((item) => {
      // Extract clean domain
      const domain = leadEnrichmentService.extractDomain(item);

      if (leadEnrichmentService.validateDomain(domain)) {
        // Avoid duplicates
        if (!valid.includes(domain)) {
          valid.push(domain);
        }
      } else {
        invalid.push(item); // Keep original input for error display
      }
    });

    return { valid, invalid };
  },

  /**
   * Format estimated time string
   * @param estimatedTime - Time string like "10-50 minutes"
   */
  formatEstimatedTime: (estimatedTime: string): string => {
    return estimatedTime;
  },
};

export default leadEnrichmentService;
