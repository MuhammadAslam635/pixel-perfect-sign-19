import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  AlertCircle,
  Loader2,
  MapPin,
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
  BusinessEnrichmentRequest,
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
  const [businessQuery, setBusinessQuery] = useState("");
  const [locationType, setLocationType] = useState<"country" | "region">("country");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [maxCompanies, setMaxCompanies] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEnrich = async () => {
    // Validation
    if (!businessQuery.trim()) {
      toast.error("Please enter a business description or search query");
      return;
    }

    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }

    if (maxCompanies < 1 || maxCompanies > 50) {
      toast.error("Maximum companies must be between 1 and 50");
      return;
    }

    setIsSubmitting(true);

    try {
      const request: BusinessEnrichmentRequest = {
        query: businessQuery.trim(),
        location: selectedLocation,
        maxCompanies,
        selectedSeniorities: selectedSeniorities.length > 0 ? selectedSeniorities : undefined,
      };

      const response = await leadEnrichmentService.enrichByBusiness(request);

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

  const handleClear = () => {
    setBusinessQuery("");
    setSelectedLocation("");
    setMaxCompanies(10);
    toast.info("Form cleared");
  };

  // Memoize location options for better performance
  const regionOptions = useMemo(() => {
    const uniqueRegions = [...new Set(REGIONS)].sort();
    return uniqueRegions.map(region => ({
      label: region,
      value: region,
    }));
  }, []);

  const countryOptions = useMemo(() => {
    const sortedCountries = [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
    return sortedCountries.map(country => ({
      label: country.name,
      value: country.name,
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Description */}
      <Alert className="bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-white/10">
        <Briefcase className="w-4 h-4 text-[#69B4B7]" />
        <AlertDescription className="text-white/70 text-sm">
          <strong className="text-[#69B4B7]">Smart Business Search:</strong>{" "}
          <div className="mt-2 space-y-1">
            <div>✓ <strong>Exact Company:</strong> "tamimipeb" → finds ONLY tamimipeb with ALL executives</div>
            <div>✓ <strong>Industry Type:</strong> "construction companies" → finds up to {maxCompanies} companies</div>
            <div className="text-white/50 text-xs mt-2">System prioritizes exact company match first, then falls back to industry search.</div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Business Query Input */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-400" />
          Business Description / Search Query
        </label>
        <Input
          type="text"
          placeholder="e.g., AI startups, SaaS companies, Healthcare providers..."
          value={businessQuery}
          onChange={(e) => setBusinessQuery(e.target.value)}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white placeholder:text-white/30"
        />
        <p className="text-xs text-white/50">
          Describe the type of business or industry you're looking for
        </p>
      </div>

      <Separator className="bg-white/10" />

      {/* Location Type Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" />
          Location Type
        </label>
        <Select
          value={locationType}
          onValueChange={(value: "country" | "region") => {
            setLocationType(value);
            setSelectedLocation(""); // Reset location when type changes
          }}
        >
          <SelectTrigger className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white">
            <SelectValue placeholder="Select location type" />
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
      </div>

      {/* Location Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/70">
          {locationType === "country" ? "Select Country" : "Select Region"}
        </label>
        <SearchableSelect
          options={locationType === "country" ? countryOptions : regionOptions}
          value={selectedLocation}
          onValueChange={setSelectedLocation}
          placeholder={`Select ${locationType}...`}
          searchPlaceholder={`Search ${locationType}s...`}
          emptyMessage={`No ${locationType} found.`}
        />
        <p className="text-xs text-white/50">
          {locationType === "country"
            ? "Filter companies by specific country"
            : "Filter companies by geographic region"}
        </p>
      </div>

      <Separator className="bg-white/10" />

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
          onChange={(e) => setMaxCompanies(parseInt(e.target.value) || 3)}
          className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white"
        />
        <p className="text-xs text-white/50">
          Maximum 50 companies per search (recommended: 10-20 for faster results)
        </p>
      </div>

      {/* Query Summary */}
      {businessQuery && selectedLocation && (
        <div className="p-3 bg-gradient-to-br from-gray-800/30 to-gray-900/20 border border-white/10 rounded-lg space-y-2">
          <p className="text-xs text-white/70">
            <strong className="text-[#69B4B7]">Search Strategy:</strong>
          </p>
          <div className="text-xs text-white/60 space-y-1 ml-2">
            <div>1️⃣ Try exact match for "<strong>{businessQuery}</strong>" in <strong>{selectedLocation}</strong></div>
            <div className="ml-4 text-white/50">→ If found: Enrich ONLY that company with ALL executives</div>
            <div>2️⃣ If not found: Search by business type/industry</div>
            <div className="ml-4 text-white/50">→ Find up to <strong>{maxCompanies}</strong> matching companies</div>
            {selectedSeniorities.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/10">
                Filter executives: <strong>{selectedSeniorities.length}</strong> seniority levels selected
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 flex justify-end gap-3">
        {(businessQuery || selectedLocation) && (
          <Button
            variant="ghost"
            onClick={handleClear}
            className="text-white/50 hover:text-white hover:bg-white/5"
          >
            Clear Form
          </Button>
        )}
        <Button
          onClick={handleEnrich}
          disabled={
            !businessQuery.trim() ||
            !selectedLocation ||
            isSubmitting ||
            maxCompanies < 1 ||
            maxCompanies > 50
          }
          className="bg-gradient-to-r from-[#69B4B7] via-[#5486D0] to-[#3E64B3] hover:brightness-110 px-8"
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
              <Briefcase className="w-4 h-4 mr-2" />
              Discover & Enrich Companies
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default BusinessSpecificTab;
