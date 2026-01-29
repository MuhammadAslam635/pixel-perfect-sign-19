/**
 * Lead Enrichment Types
 *
 * Type definitions for the lead enrichment system with two modes:
 * 1. Direct Domain Enrichment (Tab 1)
 * 2. Advanced Query Enrichment (Tab 2)
 */

// ========================================
// INDUSTRY CATEGORIES
// ========================================

export interface IndustryCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  level: number;
  path?: string;
  keywords?: string[];
  metadata?: {
    dnbCode?: string;
    naicsCode?: string;
    sicCode?: string;
    isicCode?: string;
  };
  isActive: boolean;
  sortOrder?: number;
  children?: IndustryCategory[];
  stats?: {
    totalCompanies: number;
    totalLeads: number;
    lastUpdated?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IndustryCategoryTree extends IndustryCategory {
  children: IndustryCategoryTree[];
}

// ========================================
// ENRICHMENT FILTERS
// ========================================

export interface RevenueRange {
  min?: number;
  max?: number;
}

export interface EmployeeRange {
  min?: number;
  max?: number;
}

export interface EnrichmentFilters {
  categories?: string[]; // Category IDs
  subCategories?: string[]; // Sub-category IDs
  roles?: SeniorityLevel[]; // Seniority levels
  // regions?: string[]; // Geographic regions - Commented out, using countries only
  countries?: string[]; // Specific countries
  revenueRanges?: RangeOption[]; // Multiple revenue ranges (OR condition)
  employeeRanges?: RangeOption[]; // Multiple employee ranges (OR condition)
}

// ========================================
// SENIORITY LEVELS
// ========================================

export type SeniorityLevel =
  | "owner"
  | "founder"
  | "c_suite"
  | "partner"
  | "vp"
  | "head"
  | "director"
  | "manager";

export interface SeniorityOption {
  value: SeniorityLevel;
  label: string;
  description: string;
}

export const SENIORITY_OPTIONS: SeniorityOption[] = [
  {
    value: "owner",
    label: "Owner",
    description: "Business owners and proprietors",
  },
  {
    value: "founder",
    label: "Founder",
    description: "Company founders and co-founders",
  },
  {
    value: "c_suite",
    label: "C-Suite",
    description: "CEO, CFO, CTO, COO, CMO, etc.",
  },
  {
    value: "partner",
    label: "Partner",
    description: "Partners and senior partners",
  },
  {
    value: "vp",
    label: "VP (Vice President)",
    description: "Vice Presidents and Senior VPs",
  },
  {
    value: "head",
    label: "Head",
    description: "Department heads and leaders",
  },
  {
    value: "director",
    label: "Director",
    description: "Directors and senior directors",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Managers and senior managers",
  },
];

// ========================================
// ENRICHMENT MODES
// ========================================

export type EnrichmentMode = "domain" | "query" | "business";

// ========================================
// DIRECT DOMAIN ENRICHMENT (TAB 1)
// ========================================

export interface DomainEnrichmentRequest {
  domains: string[];
  selectedSeniorities?: string[];
}

export interface DomainEnrichmentResponse {
  success: boolean;
  message: string;
  data: {
    searchId: string;
    domainsCount: number;
    estimatedTime: string;
  };
}

// ========================================
// ADVANCED QUERY ENRICHMENT (TAB 2)
// ========================================

export interface QueryEnrichmentRequest {
  query?: string; // Optional - query is auto-generated from filters
  filters?: EnrichmentFilters;
  maxCompanies?: number;
  usePerplexity?: boolean;
  selectedSeniorities?: SeniorityLevel[];
}

export interface QueryEnrichmentResponse {
  success: boolean;
  message: string;
  data: {
    searchId: string;
    companiesFound: number;
    domainsExtracted: number;
    estimatedTime: string;
    query: string;
  };
}

// ========================================
// BUSINESS SPECIFIC ENRICHMENT (TAB 3)
// ========================================

export interface BusinessEnrichmentRequest {
  query: string; // Business description/search query
  location?: string; // Country or region
  maxCompanies?: number;
  selectedSeniorities?: SeniorityLevel[];
}

export interface BusinessEnrichmentResponse {
  success: boolean;
  message: string;
  data: {
    searchId: string;
    companiesFound: number;
    domainsExtracted: number;
    estimatedTime: string;
    query: string;
  };
}

// ========================================
// ENRICHMENT STATUS
// ========================================

export type EnrichmentStatus = "running" | "completed" | "failed" | "pending";

export interface EnrichmentStatusResponse {
  success: boolean;
  data: {
    searchId: string;
    status: EnrichmentStatus;
    query: string;
    itemsProcessed: number;
    createdAt: Date;
    updatedAt: Date;
  };
}

// ========================================
// MODAL STATE
// ========================================

export interface LeadEnrichmentModalState {
  isOpen: boolean;
  activeTab: EnrichmentMode;
  // Tab 1 - Domain Specific
  domains: string[];
  domainInput: string;
  // Tab 2 - Advanced Query
  query: string;
  filters: EnrichmentFilters;
  maxCompanies: number;
  // Enrichment state
  isEnriching: boolean;
  searchId: string | null;
  error: string | null;
  // Progress tracking
  estimatedTime: string | null;
  itemsProcessed: number;
}

// ========================================
// API RESPONSES
// ========================================

export interface IndustryCategoriesResponse {
  success: boolean;
  data: {
    categories: IndustryCategory[];
    total: number;
  };
}

export interface IndustryCategoryTreeResponse {
  success: boolean;
  data: {
    tree: IndustryCategoryTree[];
  };
}

// ========================================
// FORM VALIDATION
// ========================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface DomainValidationResult {
  valid: boolean;
  errors: ValidationError[];
  validDomains: string[];
  invalidDomains: string[];
}

export interface QueryValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ========================================
// REVENUE & EMPLOYEE RANGE OPTIONS
// ========================================

export interface RangeOption {
  label: string;
  min?: number;
  max?: number;
}

export const REVENUE_RANGES: RangeOption[] = [
  { label: "Any revenue", min: undefined, max: undefined },
  { label: "$0 - $1M", min: 0, max: 1 },
  { label: "$1M - $10M", min: 1, max: 10 },
  { label: "$10M - $50M", min: 10, max: 50 },
  { label: "$50M - $100M", min: 50, max: 100 },
  { label: "$100M - $500M", min: 100, max: 500 },
  { label: "$500M - $1B", min: 500, max: 1000 },
  { label: "$1B+", min: 1000, max: undefined },
];

export const EMPLOYEE_RANGES: RangeOption[] = [
  { label: "Any size", min: undefined, max: undefined },
  { label: "1-10 employees", min: 1, max: 10 },
  { label: "11-50 employees", min: 11, max: 50 },
  { label: "51-200 employees", min: 51, max: 200 },
  { label: "201-500 employees", min: 201, max: 500 },
  { label: "501-1000 employees", min: 501, max: 1000 },
  { label: "1001-5000 employees", min: 1001, max: 5000 },
  { label: "5000+ employees", min: 5000, max: undefined },
];

// ========================================
// COUNTRIES & REGIONS
// ========================================

export interface CountryOption {
  code: string;
  name: string;
  region: string;
}

export const REGIONS = [
  "North America",
  "South America",
  "Europe",
  "Middle East",
  "Africa",
  "Asia",
  "Oceania",
];

export const COUNTRIES: CountryOption[] = [
  // North America
  { code: "US", name: "United States", region: "North America" },
  { code: "CA", name: "Canada", region: "North America" },
  { code: "MX", name: "Mexico", region: "North America" },
  // Europe
  { code: "GB", name: "United Kingdom", region: "Europe" },
  { code: "DE", name: "Germany", region: "Europe" },
  { code: "FR", name: "France", region: "Europe" },
  { code: "IT", name: "Italy", region: "Europe" },
  { code: "ES", name: "Spain", region: "Europe" },
  { code: "NL", name: "Netherlands", region: "Europe" },
  { code: "SE", name: "Sweden", region: "Europe" },
  { code: "CH", name: "Switzerland", region: "Europe" },
  // Middle East
  { code: "AE", name: "United Arab Emirates", region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", region: "Middle East" },
  { code: "IL", name: "Israel", region: "Middle East" },
  { code: "QA", name: "Qatar", region: "Middle East" },
  { code: "KW", name: "Kuwait", region: "Middle East" },
  // Asia
  { code: "CN", name: "China", region: "Asia" },
  { code: "JP", name: "Japan", region: "Asia" },
  { code: "IN", name: "India", region: "Asia" },
  { code: "SG", name: "Singapore", region: "Asia" },
  { code: "KR", name: "South Korea", region: "Asia" },
  { code: "HK", name: "Hong Kong", region: "Asia" },
  // Oceania
  { code: "AU", name: "Australia", region: "Oceania" },
  { code: "NZ", name: "New Zealand", region: "Oceania" },
  // South America
  { code: "BR", name: "Brazil", region: "South America" },
  { code: "AR", name: "Argentina", region: "South America" },
  { code: "CL", name: "Chile", region: "South America" },
  // Africa
  { code: "ZA", name: "South Africa", region: "Africa" },
  { code: "EG", name: "Egypt", region: "Africa" },
  { code: "NG", name: "Nigeria", region: "Africa" },
];
