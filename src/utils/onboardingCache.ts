/**
 * Utility for managing onboarding data cache in localStorage
 * This helps preserve fetched data (Apollo company info, AI suggestions, etc.)
 * across page refreshes and navigation without re-fetching from APIs
 */

export interface OnboardingCache {
  // Apollo company lookup data
  apolloData?: {
    website: string;
    companyName?: string;
    description?: string;
    fetchedAt: number;
  };

  // Core offerings suggestions
  coreOfferingsSuggestions?: {
    companyName: string;
    description: string;
    offerings: string[];
    fetchedAt: number;
  };

  // ICP suggestions
  icpSuggestions?: {
    website: string;
    companyName?: string;
    businessDescription?: string;
    suggestions: Array<{
      title: string;
      description: string;
    }>;
    fetchedAt: number;
  };

  // Form data snapshot
  formData?: any;

  // Timestamp of last update
  lastUpdated: number;
}

const CACHE_KEY = "onboarding_cache";
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get the onboarding cache from localStorage
 */
export const getOnboardingCache = (): OnboardingCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: OnboardingCache = JSON.parse(cached);

    // Check if cache is expired (older than 24 hours)
    if (Date.now() - data.lastUpdated > CACHE_EXPIRY_MS) {
      clearOnboardingCache();
      return null;
    }

    return data;
  } catch (error) {
    console.error("[OnboardingCache] Error reading cache:", error);
    return null;
  }
};

/**
 * Update the onboarding cache in localStorage
 */
export const updateOnboardingCache = (
  updates: Partial<OnboardingCache>
): void => {
  try {
    const existing = getOnboardingCache() || { lastUpdated: Date.now() };

    const updated: OnboardingCache = {
      ...existing,
      ...updates,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[OnboardingCache] Error updating cache:", error);
  }
};

/**
 * Clear the onboarding cache
 * This should be called when:
 * - User deletes their onboarding data
 * - User logs out
 * - Cache is expired
 */
export const clearOnboardingCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("[OnboardingCache] Error clearing cache:", error);
  }
};

/**
 * Check if we have cached Apollo data for a specific website
 */
export const getCachedApolloData = (website: string) => {
  const cache = getOnboardingCache();
  if (!cache?.apolloData) return null;

  // Normalize URLs for comparison
  const normalizeUrl = (url: string) =>
    url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase();

  if (normalizeUrl(cache.apolloData.website) === normalizeUrl(website)) {
    return cache.apolloData;
  }

  return null;
};

/**
 * Check if we have cached core offerings for specific company info
 */
export const getCachedCoreOfferings = (
  companyName: string,
  description: string
) => {
  const cache = getOnboardingCache();
  if (!cache?.coreOfferingsSuggestions) return null;

  const cached = cache.coreOfferingsSuggestions;

  // Check if company name and description match (case-insensitive)
  if (
    cached.companyName.toLowerCase() === companyName.toLowerCase() &&
    cached.description.toLowerCase() === description.toLowerCase()
  ) {
    return cached.offerings;
  }

  return null;
};

/**
 * Check if we have cached ICP suggestions for specific company info
 */
export const getCachedICPSuggestions = (
  website: string,
  companyName?: string,
  businessDescription?: string
) => {
  const cache = getOnboardingCache();
  if (!cache?.icpSuggestions) return null;

  const cached = cache.icpSuggestions;

  // Normalize URLs for comparison
  const normalizeUrl = (url: string) =>
    url
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase();

  // Check if website matches
  if (normalizeUrl(cached.website) !== normalizeUrl(website)) {
    return null;
  }

  // If company name is provided, it should match
  if (companyName && cached.companyName) {
    if (cached.companyName.toLowerCase() !== companyName.toLowerCase()) {
      return null;
    }
  }

  // If business description is provided, it should match
  if (businessDescription && cached.businessDescription) {
    if (
      cached.businessDescription.toLowerCase() !==
      businessDescription.toLowerCase()
    ) {
      return null;
    }
  }

  return cached.suggestions;
};

/**
 * Clear website-specific cached data
 * This should be called when the website URL changes to ensure
 * new data is fetched for the new website
 */
export const clearWebsiteCache = (): void => {
  try {
    const cache = getOnboardingCache();
    if (!cache) return;

    // Remove website-related cached data
    const updated: OnboardingCache = {
      ...cache,
      apolloData: undefined,
      icpSuggestions: undefined,
      coreOfferingsSuggestions: undefined,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("[OnboardingCache] Error clearing website cache:", error);
  }
};
