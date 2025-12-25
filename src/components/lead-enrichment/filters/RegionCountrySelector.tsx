import { useState } from "react";
import { MapPin, Globe, Check, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import type { CountryOption } from "@/types/leadEnrichment";

interface RegionCountrySelectorProps {
  selectedRegions: string[];
  selectedCountries: string[];
  onRegionsChange: (regions: string[]) => void;
  onCountriesChange: (countries: string[]) => void;
  regions: string[];
  countries: CountryOption[];
}

const RegionCountrySelector = ({
  selectedRegions,
  selectedCountries,
  onRegionsChange,
  onCountriesChange,
  regions,
  countries,
}: RegionCountrySelectorProps) => {
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleRegion = (region: string) => {
    const newRegions = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    onRegionsChange(newRegions);

    // Auto-expand region when selected
    if (!selectedRegions.includes(region)) {
      const newExpanded = new Set(expandedRegions);
      newExpanded.add(region);
      setExpandedRegions(newExpanded);
    }
  };

  const toggleCountry = (country: string) => {
    const newCountries = selectedCountries.includes(country)
      ? selectedCountries.filter((c) => c !== country)
      : [...selectedCountries, country];
    onCountriesChange(newCountries);
  };

  const toggleRegionExpand = (region: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(region)) {
      newExpanded.delete(region);
    } else {
      newExpanded.add(region);
    }
    setExpandedRegions(newExpanded);
  };

  const getCountriesByRegion = (region: string): CountryOption[] => {
    return countries.filter((c) => c.region === region);
  };

  const filteredRegions = regions.filter((region) =>
    region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clearAll = () => {
    onRegionsChange([]);
    onCountriesChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-green-400" />
          Regions & Countries
        </label>
        {(selectedRegions.length > 0 || selectedCountries.length > 0) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-400 h-6"
          >
            Clear ({selectedRegions.length + selectedCountries.length})
          </Button>
        )}
      </div>

      {/* Selected Summary */}
      {(selectedRegions.length > 0 || selectedCountries.length > 0) && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          {selectedRegions.map((region) => (
            <Badge
              key={region}
              variant="secondary"
              className="bg-green-900/40 text-green-300 border-green-500/30"
            >
              <Globe className="w-3 h-3 mr-1" />
              {region}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleRegion(region)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
              >
                <Check className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
          {selectedCountries.map((country) => {
            const countryData = countries.find((c) => c.name === country);
            return (
              <Badge
                key={country}
                variant="secondary"
                className="bg-blue-900/40 text-blue-300 border-blue-500/30"
              >
                <MapPin className="w-3 h-3 mr-1" />
                {countryData?.name}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCountry(country)}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <Check className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Search */}
      <Input
        type="text"
        placeholder="Search regions or countries..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
      />

      {/* Regions & Countries List */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-hide bg-gray-800/20 rounded-lg border border-gray-700 p-2 space-y-1">
        {searchQuery === "" ? (
          /* Show by Region */
          filteredRegions.map((region) => {
            const isExpanded = expandedRegions.has(region);
            const isSelected = selectedRegions.includes(region);
            const countries = getCountriesByRegion(region);

            return (
              <div key={region} className="w-full">
                <div
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors ${
                    isSelected ? "bg-green-900/30" : ""
                  }`}
                >
                  {/* Expand/Collapse */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRegionExpand(region)}
                    className="h-5 w-5 p-0 hover:bg-transparent"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>

                  {/* Region Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRegion(region)}
                    className="border-gray-600 data-[state=checked]:bg-green-600"
                  />

                  {/* Region Name */}
                  <div className="flex-1 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span
                      className={`text-sm ${
                        isSelected ? "text-white font-medium" : "text-gray-300"
                      }`}
                    >
                      {region}
                    </span>
                  </div>

                  {/* Country Count */}
                  <Badge
                    variant="outline"
                    className="text-xs border-gray-600 text-gray-400"
                  >
                    {countries.length}
                  </Badge>
                </div>

                {/* Countries under Region */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pl-8 space-y-1"
                    >
                      {countries.map((country) => {
                        const isCountrySelected = selectedCountries.includes(
                          country.name
                        );
                        return (
                          <div
                            key={country.code}
                            className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors ${
                              isCountrySelected ? "bg-blue-900/30" : ""
                            }`}
                          >
                            <Checkbox
                              checked={isCountrySelected}
                              onCheckedChange={() => toggleCountry(country.name)}
                              className="border-gray-600 data-[state=checked]:bg-blue-600"
                            />
                            <MapPin className="w-3 h-3 text-blue-400" />
                            <span
                              className={`text-sm ${
                                isCountrySelected
                                  ? "text-white font-medium"
                                  : "text-gray-300"
                              }`}
                            >
                              {country.name}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          /* Show Search Results */
          <div className="space-y-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const isSelected = selectedCountries.includes(country.name);
                return (
                  <div
                    key={country.code}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-800/50 transition-colors ${
                      isSelected ? "bg-blue-900/30" : ""
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCountry(country.name)}
                      className="border-gray-600 data-[state=checked]:bg-blue-600"
                    />
                    <MapPin className="w-3 h-3 text-blue-400" />
                    <span
                      className={`text-sm flex-1 ${
                        isSelected ? "text-white font-medium" : "text-gray-300"
                      }`}
                    >
                      {country.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-600 text-gray-400"
                    >
                      {country.region}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No countries found matching "{searchQuery}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedRegions(new Set(regions))}
          className="text-xs border-gray-700 text-gray-400"
        >
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpandedRegions(new Set())}
          className="text-xs border-gray-700 text-gray-400"
        >
          Collapse All
        </Button>
      </div>
    </div>
  );
};

export default RegionCountrySelector;
