import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import CategorySelector from "../filters/CategorySelector";
import RoleSelector from "../filters/RoleSelector";
import RegionCountrySelector from "../filters/RegionCountrySelector";
import RangeFilter from "../filters/RangeFilter";
import leadEnrichmentService from "@/services/leadEnrichment.service";
import { useEnrichmentConfigs } from "@/hooks/useEnrichmentConfigs";
import { toast } from "sonner";
import type {
  EnrichmentFilters,
  QueryEnrichmentRequest,
  SeniorityLevel,
} from "@/types/leadEnrichment";

interface AdvancedQueryTabProps {
  onEnrichmentStart: (searchId: string, estimatedTime: string) => void;
}

const AdvancedQueryTab = ({ onEnrichmentStart }: AdvancedQueryTabProps) => {
  // Fetch dynamic enrichment configs
  const {
    regions,
    countries,
    seniorityOptions,
    revenueRanges,
    employeeRanges,
    loading: configsLoading,
    error: configsError,
  } = useEnrichmentConfigs();

  const [query, setQuery] = useState("");
  const [maxCompanies, setMaxCompanies] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filters, setFilters] = useState<EnrichmentFilters>({
    categories: [],
    roles: [],
    regions: [],
    countries: [],
    revenueRange: undefined,
    employeeRange: undefined,
  });

  const updateFilters = (key: keyof EnrichmentFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = () => {
    return (
      (filters.categories?.length || 0) > 0 ||
      (filters.roles?.length || 0) > 0 ||
      (filters.regions?.length || 0) > 0 ||
      (filters.countries?.length || 0) > 0 ||
      (filters.revenueRange &&
        (filters.revenueRange.min !== undefined ||
          filters.revenueRange.max !== undefined)) ||
      (filters.employeeRange &&
        (filters.employeeRange.min !== undefined ||
          filters.employeeRange.max !== undefined))
    );
  };

  const handleEnrich = async () => {
    // Validation
    if (!query.trim() && !hasActiveFilters()) {
      toast.error("Please enter a search query or select filters");
      return;
    }

    if (maxCompanies < 1 || maxCompanies > 50) {
      toast.error("Maximum companies must be between 1 and 50");
      return;
    }

    setIsSubmitting(true);

    try {
      const request: QueryEnrichmentRequest = {
        query: query.trim() || undefined,
        filters,
        maxCompanies,
        usePerplexity: true,
      };

      const response = await leadEnrichmentService.enrichByQuery(request);

      if (response.success) {
        toast.success(
          `Found ${response.data.companiesFound} companies! Starting enrichment...`
        );
        onEnrichmentStart(
          response.data.searchId,
          response.data.estimatedTime
        );
      } else {
        toast.error("Failed to start enrichment");
      }
    } catch (error: any) {
      console.error("Enrichment error:", error);
      toast.error(
        error.response?.data?.message || "Failed to start enrichment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      roles: [],
      regions: [],
      countries: [],
      revenueRange: undefined,
      employeeRange: undefined,
    });
    toast.info("All filters cleared");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Description */}
      <Alert className="bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-white/10">
        <Sparkles className="w-4 h-4 text-[#69B4B7]" />
        <AlertDescription className="text-white/70 text-sm">
          <strong className="text-[#69B4B7]">AI-Powered Discovery:</strong>{" "}
          Describe what you're looking for and use filters to narrow down
          results. Perplexity AI will discover companies matching your criteria,
          then enrich them with decision-makers.
        </AlertDescription>
      </Alert>

      {/* Search Query */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#69B4B7]" />
          Search Query
        </label>
        <Textarea
          placeholder="e.g., Top 20 construction companies in the Middle East with revenue above $100M"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white placeholder:text-white/30 scrollbar-hide"
        />
        <p className="text-xs text-white/50">
          Describe companies you want to find. Be specific about industry,
          location, and size.
        </p>
      </div>

      {/* Max Companies */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70">
          Maximum Companies to Find
        </label>
        <Input
          type="number"
          min={1}
          max={50}
          value={maxCompanies}
          onChange={(e) => setMaxCompanies(parseInt(e.target.value) || 5)}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
        />
        <p className="text-xs text-white/50">
          Maximum 50 companies per search (recommended: 10-20 for faster
          results)
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Filters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border border-white/10 text-white/70 hover:bg-white/5"
          >
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
            {hasActiveFilters() && (
              <span className="ml-2 text-xs bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] text-white px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </Button>

          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-white/50 hover:text-red-400 hover:bg-white/5"
            >
              Clear All Filters
            </Button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 p-4 bg-gradient-to-br from-gray-800/20 to-gray-900/10 rounded-lg border border-white/10"
          >
            {configsLoading ? (
              <div className="flex items-center justify-center py-8 text-white/50">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading filter options...
              </div>
            ) : configsError ? (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-white/70">
                  {configsError}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Industry Categories */}
                <CategorySelector
                  selectedCategories={filters.categories || []}
                  onChange={(categories) => updateFilters("categories", categories)}
                />

                <Separator className="bg-white/10" />

                {/* Seniority Levels */}
                <RoleSelector
                  selectedRoles={filters.roles || []}
                  onChange={(roles) => updateFilters("roles", roles)}
                  seniorityOptions={seniorityOptions}
                />

                <Separator className="bg-white/10" />

                {/* Regions & Countries */}
                <RegionCountrySelector
                  selectedRegions={filters.regions || []}
                  selectedCountries={filters.countries || []}
                  onRegionsChange={(regions) => updateFilters("regions", regions)}
                  onCountriesChange={(countries) =>
                    updateFilters("countries", countries)
                  }
                  regions={regions}
                  countries={countries}
                />

                <Separator className="bg-white/10" />

                {/* Revenue Range */}
                <RangeFilter
                  type="revenue"
                  value={filters.revenueRange}
                  onChange={(range) => updateFilters("revenueRange", range)}
                  ranges={revenueRanges}
                />

                <Separator className="bg-white/10" />

                {/* Employee Range */}
                <RangeFilter
                  type="employee"
                  value={filters.employeeRange}
                  onChange={(range) => updateFilters("employeeRange", range)}
                  ranges={employeeRanges}
                />
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && !showFilters && (
        <div className="p-3 bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-white/10 rounded-lg">
          <p className="text-xs text-white/70">
            <strong className="text-[#69B4B7]">Active Filters:</strong>
            {(filters.categories?.length || 0) > 0 && (
              <span className="ml-2">
                {filters.categories?.length} categories
              </span>
            )}
            {(filters.roles?.length || 0) > 0 && (
              <span className="ml-2">{filters.roles?.length} roles</span>
            )}
            {(filters.regions?.length || 0) > 0 && (
              <span className="ml-2">{filters.regions?.length} regions</span>
            )}
            {(filters.countries?.length || 0) > 0 && (
              <span className="ml-2">{filters.countries?.length} countries</span>
            )}
            {filters.revenueRange &&
              (filters.revenueRange.min || filters.revenueRange.max) && (
                <span className="ml-2">revenue</span>
              )}
            {filters.employeeRange &&
              (filters.employeeRange.min || filters.employeeRange.max) && (
                <span className="ml-2">company size</span>
              )}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <Button
          onClick={handleEnrich}
          disabled={
            (!query.trim() && !hasActiveFilters()) ||
            isSubmitting ||
            maxCompanies < 1 ||
            maxCompanies > 50
          }
          className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80 px-8"
        >
          {isSubmitting ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Discovering Companies...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Discover & Enrich Companies
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default AdvancedQueryTab;
