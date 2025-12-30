import { useEffect, useState } from "react";
import { enrichmentConfigService } from "@/services/enrichmentConfig.service";
import type {
  CountryOption,
  SeniorityOption,
  SeniorityLevel,
  RangeOption,
} from "@/types/leadEnrichment";

interface UseEnrichmentConfigsReturn {
  regions: string[];
  countries: CountryOption[];
  seniorityOptions: SeniorityOption[];
  revenueRanges: RangeOption[];
  employeeRanges: RangeOption[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch and cache enrichment configuration data
 * Replaces static arrays with dynamic API data
 */
export const useEnrichmentConfigs = (): UseEnrichmentConfigsReturn => {
  const [regions, setRegions] = useState<string[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [seniorityOptions, setSeniorityOptions] = useState<SeniorityOption[]>(
    []
  );
  const [revenueRanges, setRevenueRanges] = useState<RangeOption[]>([]);
  const [employeeRanges, setEmployeeRanges] = useState<RangeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all config types in parallel
        const [
          regionsRes,
          countriesRes,
          seniorityRes,
          revenueRes,
          employeeRes,
        ] = await Promise.all([
          enrichmentConfigService.getRegions(),
          enrichmentConfigService.getCountries(),
          enrichmentConfigService.getSeniorityLevels(),
          enrichmentConfigService.getRevenueRanges(),
          enrichmentConfigService.getEmployeeRanges(),
        ]);

        // Transform regions
        if (regionsRes.success && regionsRes.data) {
          setRegions(regionsRes.data.map((r) => r.label));
        }

        // Transform countries
        if (countriesRes.success && countriesRes.data) {
          setCountries(
            countriesRes.data.map((c) => ({
              code: c.metadata?.code || "",
              name: c.label,
              region: c.metadata?.region || "",
            }))
          );
        }

        // Transform seniority options
        if (seniorityRes.success && seniorityRes.data) {
          setSeniorityOptions(
            seniorityRes.data.map((s) => ({
              value: (s.metadata?.value || s.name) as SeniorityLevel,
              label: s.label,
              description: s.description || "",
            }))
          );
        }

        // Transform revenue ranges
        if (revenueRes.success && revenueRes.data) {
          setRevenueRanges(
            revenueRes.data.map((r) => ({
              label: r.label,
              min: r.metadata?.min,
              max: r.metadata?.max,
            }))
          );
        }

        // Transform employee ranges
        if (employeeRes.success && employeeRes.data) {
          setEmployeeRanges(
            employeeRes.data.map((e) => ({
              label: e.label,
              min: e.metadata?.min,
              max: e.metadata?.max,
            }))
          );
        }
      } catch (err: any) {
        console.error("Error fetching enrichment configs:", err);
        setError(
          err?.response?.data?.message ||
            "Failed to fetch enrichment configurations"
        );

        // Fallback to empty arrays on error
        setRegions([]);
        setCountries([]);
        setSeniorityOptions([]);
        setRevenueRanges([]);
        setEmployeeRanges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  return {
    regions,
    countries,
    seniorityOptions,
    revenueRanges,
    employeeRanges,
    loading,
    error,
  };
};

export default useEnrichmentConfigs;
