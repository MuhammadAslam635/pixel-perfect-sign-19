import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Loader2,
  MapPin,
  Search,
  CheckSquare,
  Square,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import leadEnrichmentService from "@/services/leadEnrichment.service";
import { COUNTRIES, REGIONS } from "@/types/leadEnrichment";
import { toast } from "sonner";
import type {
  BusinessSearchResult,
  SeniorityLevel,
} from "@/types/leadEnrichment";

interface BusinessSpecificTabProps {
  selectedSeniorities?: SeniorityLevel[];
  onEnrichmentStart: (searchId: string, estimatedTime: string) => void;
}

const BusinessSpecificTab = ({
  selectedSeniorities = [],
  onEnrichmentStart,
}: BusinessSpecificTabProps) => {
  const [keyword, setKeyword] = useState("");
  const [locationType, setLocationType] = useState<"country" | "region">("country");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [maxResults, setMaxResults] = useState(20);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const selectableBusinesses = useMemo(
    () => businesses.filter((b) => b.domain != null && b.domain.trim() !== ""),
    [businesses]
  );

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error("Please enter a business keyword");
      return;
    }
    setIsSearching(true);
    setBusinesses([]);
    setSelectedDomains(new Set());
    try {
      const response = await leadEnrichmentService.searchBusinessesByKeyword({
        query: keyword.trim(),
        location: selectedLocation || undefined,
        maxResults,
      });
      if (response.success && response.data.businesses.length > 0) {
        setBusinesses(response.data.businesses);
        toast.success(`Found ${response.data.businesses.length} businesses`);
      } else if (response.success) {
        toast.info("No businesses found. Try a different keyword or location.");
      } else {
        toast.error(response.message || "Search failed");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to search businesses");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  const toggleAllSelectable = () => {
    if (selectedDomains.size === selectableBusinesses.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(
        new Set(selectableBusinesses.map((b) => b.domain as string))
      );
    }
  };

  const handleEnrichSelected = async () => {
    const domains = Array.from(selectedDomains);
    if (domains.length === 0) {
      toast.error("Select at least one domain to enrich");
      return;
    }
    setIsEnriching(true);
    try {
      const response = await leadEnrichmentService.enrichBySelectedDomains({
        domains,
        selectedSeniorities:
          selectedSeniorities.length > 0 ? selectedSeniorities : undefined,
      });
      if (response.success) {
        toast.success(`Enrichment started for ${domains.length} companies`);
        onEnrichmentStart(
          response.data.searchId,
          response.data.estimatedTime
        );
      } else {
        toast.error(response.message || "Failed to start enrichment");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to start enrichment");
    } finally {
      setIsEnriching(false);
    }
  };

  const handleClear = () => {
    setKeyword("");
    setSelectedLocation("");
    setBusinesses([]);
    setSelectedDomains(new Set());
    setMaxResults(20);
    toast.info("Cleared");
  };

  const regionOptions = useMemo(() => {
    return [...new Set(REGIONS)].sort().map((region) => ({
      label: region,
      value: region,
    }));
  }, []);

  const countryOptions = useMemo(() => {
    return [...COUNTRIES]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ label: c.name, value: c.name }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Alert className="bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-white/10">
        <Briefcase className="w-4 h-4 text-[#69B4B7]" />
        <AlertDescription className="text-white/70 text-sm">
          <strong className="text-[#69B4B7]">How it works:</strong> Enter a business
          keyword (e.g. &quot;construction companies&quot;, &quot;SaaS&quot;). Optionally
          pick a <strong>country</strong> or <strong>region</strong> to filter results.
          We search LinkedIn via Tavily and return company names and domains.
          <strong> Max results</strong> (1–50) limits how many companies are returned.
          Select the domains you want, then click &quot;Enrich selected with Apollo&quot; to run lead gen.
        </AlertDescription>
      </Alert>

      {/* Keyword + optional location */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          Business keyword
        </label>
        <Input
          type="text"
          placeholder="e.g., construction companies, AI startups, healthcare..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white placeholder:text-white/30"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" />
          Location (optional)
        </label>
        <Select
          value={locationType}
          onValueChange={(v: "country" | "region") => {
            setLocationType(v);
            setSelectedLocation("");
          }}
        >
          <SelectTrigger className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="country" className="text-white hover:bg-gray-700">
              Country
            </SelectItem>
            <SelectItem value="region" className="text-white hover:bg-gray-700">
              Region
            </SelectItem>
          </SelectContent>
        </Select>
        <SearchableSelect
          options={locationType === "country" ? countryOptions : regionOptions}
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          placeholder={`Select ${locationType}...`}
          searchPlaceholder={`Search ${locationType}...`}
          emptyMessage={`No ${locationType} found.`}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70">Max results (1–50)</label>
        <Input
          type="number"
          min={1}
          max={50}
          value={maxResults}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (e.target.value === "") setMaxResults(20);
            else if (!Number.isNaN(v)) setMaxResults(Math.min(50, Math.max(1, v)));
          }}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white w-24"
        />
        <p className="text-xs text-white/50">Maximum number of companies to return from search.</p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSearch}
          disabled={!keyword.trim() || isSearching}
          className="bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] hover:brightness-110"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search businesses
            </>
          )}
        </Button>
        {(keyword || businesses.length > 0) && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Results: business name + domain, checkbox for selectable rows */}
      {businesses.length > 0 && (
        <>
          <Separator className="bg-white/10" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Results – select domains to enrich
              </label>
              {selectableBusinesses.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllSelectable}
                  className="text-white/60 hover:text-white text-xs"
                >
                  {selectedDomains.size === selectableBusinesses.length
                    ? "Deselect all"
                    : "Select all"}
                </Button>
              )}
            </div>
            <div className="rounded-lg border border-white/10 overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 text-white/60 font-medium w-10">
                      #
                    </th>
                    <th className="text-left py-2 px-3 text-white/60 font-medium">
                      Company
                    </th>
                    <th className="text-left py-2 px-3 text-white/60 font-medium">
                      Domain
                    </th>
                    <th className="text-left py-2 px-3 text-white/60 font-medium w-16">
                      Select
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {businesses.map((b, i) => {
                    const hasDomain = b.domain != null && b.domain.trim() !== "";
                    const isSelected = hasDomain && selectedDomains.has(b.domain!);
                    return (
                      <tr
                        key={`${b.companyName}-${b.domain ?? i}`}
                        className="text-white/80 hover:bg-white/5"
                      >
                        <td className="py-2 px-3 text-white/50">{i + 1}</td>
                        <td className="py-2 px-3">{b.companyName}</td>
                        <td className="py-2 px-3 text-white/70">
                          {b.domain ?? (
                            <span className="text-white/40">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {hasDomain ? (
                            <button
                              type="button"
                              onClick={() => toggleDomain(b.domain!)}
                              className="p-0.5 rounded hover:bg-white/10"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#69B4B7]" />
                              ) : (
                                <Square className="w-4 h-4 text-white/40" />
                              )}
                            </button>
                          ) : (
                            <span className="text-white/30 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectableBusinesses.length === 0 && businesses.length > 0 && (
              <p className="text-xs text-white/50">
                No domains found for these results. Try another keyword.
              </p>
            )}
          </div>

          {selectedDomains.size > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <p className="text-sm text-white/60">
                {selectedDomains.size} domain(s) selected
              </p>
              <Button
                onClick={handleEnrichSelected}
                disabled={isEnriching}
                className="bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] hover:brightness-110"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Enrich selected with Apollo
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default BusinessSpecificTab;
