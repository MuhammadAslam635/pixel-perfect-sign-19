import { useState, useEffect, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { OnboardingQuestions } from "@/types/onboarding.types";
import {
  Building2,
  FileText,
  Package,
  Globe,
  Sparkles,
  Loader2,
} from "lucide-react";
import { onboardingService } from "@/services/onboarding.service";
import { toast } from "sonner";
import { getCountryOptions } from "@/utils/countries";

interface CompanyInfoStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
  website?: string; // Add website prop to detect changes
}

const CompanyInfoStep = ({
  formData,
  updateFormData,
  website,
}: CompanyInfoStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const hasGeneratedRef = useRef(false);
  const lastCompanyNameRef = useRef<string>("");
  const lastDescriptionRef = useRef<string>("");
  const lastWebsiteRef = useRef<string>("");

  // Reset generation flag when website changes (new company)
  useEffect(() => {
    if (website && website !== lastWebsiteRef.current) {
      hasGeneratedRef.current = false;
      lastWebsiteRef.current = website;
      lastCompanyNameRef.current = "";
      lastDescriptionRef.current = "";
    }
  }, [website]);

  // Handle core offerings as comma-separated string
  const coreOfferingsString = formData.coreOfferings?.join(", ") || "";

  // Handle preferred countries - convert between string (backend) and array (MultiSelect)
  const countryOptions = getCountryOptions();
  const preferredCountriesArray = formData.preferredCountries
    ? formData.preferredCountries
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  const handleCountriesChange = (selectedCountries: string[]) => {
    // Convert array back to comma-separated string for backend
    updateFormData({ preferredCountries: selectedCountries.join(", ") });
  };

  const handleCoreOfferingsChange = (value: string) => {
    // Support multiple separators: comma, semicolon, pipe
    const offerings = value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
    updateFormData({ coreOfferings: offerings });
  };

  const generateCoreOfferings = useCallback(
    async (companyName: string, description: string) => {
      if (isGenerating) return;

      try {
        setIsGenerating(true);
        hasGeneratedRef.current = true;

        const result = await onboardingService.suggestCoreOfferings(
          companyName,
          description
        );

        if (result.success && result.data?.coreOfferings) {
          updateFormData({ coreOfferings: result.data.coreOfferings });
          toast.success("Core offerings generated successfully!");
        } else {
          // Don't show error toast - user can still fill manually
          console.log("Could not generate core offerings:", result.error);
        }
      } catch (error: any) {
        console.error("Error generating core offerings:", error);
        // Don't show error toast - user can still fill manually
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, updateFormData]
  );

  // Auto-generate core offerings when both companyName and description are available
  useEffect(() => {
    const companyName = formData.companyName?.trim() || "";
    const description = formData.businessDescription?.trim() || "";

    // Check if we have both fields and they've changed
    const hasBothFields = companyName.length > 0 && description.length >= 10;
    const fieldsChanged =
      companyName !== lastCompanyNameRef.current ||
      description !== lastDescriptionRef.current;

    // Only auto-generate if:
    // 1. Both fields are filled
    // 2. Fields have changed
    // 3. Core offerings is empty or hasn't been generated yet
    // 4. We haven't already generated for this combination
    if (
      hasBothFields &&
      fieldsChanged &&
      (!formData.coreOfferings || formData.coreOfferings.length === 0) &&
      !hasGeneratedRef.current &&
      !isGenerating
    ) {
      // Small delay to avoid generating on every keystroke
      const timer = setTimeout(() => {
        generateCoreOfferings(companyName, description);
      }, 1500); // Wait 1.5 seconds after user stops typing

      return () => clearTimeout(timer);
    }

    // Update refs
    lastCompanyNameRef.current = companyName;
    lastDescriptionRef.current = description;
  }, [
    formData.companyName,
    formData.businessDescription,
    formData.coreOfferings,
    isGenerating,
    generateCoreOfferings,
  ]);

  const handleManualGenerate = () => {
    const companyName = formData.companyName?.trim() || "";
    const description = formData.businessDescription?.trim() || "";

    if (!companyName && !description) {
      toast.error("Please enter company name or description first");
      return;
    }

    if (description.length < 10 && !companyName) {
      toast.error(
        "Please provide a more detailed description (at least 10 characters)"
      );
      return;
    }

    generateCoreOfferings(companyName, description);
  };

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label
          htmlFor="companyName"
          className="text-white flex items-center gap-2 text-sm"
        >
          <Building2 className="h-4 w-4 text-cyan-400" />
          Company Name
        </Label>
        <Input
          id="companyName"
          value={formData.companyName || ""}
          onChange={(e) => updateFormData({ companyName: e.target.value })}
          placeholder="Enter your company name"
          minLength={2}
          maxLength={200}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm rounded-lg h-12"
        />
      </div>

      {/* Brief Description */}
      <div className="space-y-2">
        <Label
          htmlFor="businessDescription"
          className="text-white flex items-center gap-2 text-sm"
        >
          <FileText className="h-4 w-4 text-cyan-400" />
          Brief Description of your business
        </Label>
        <Textarea
          id="businessDescription"
          value={formData.businessDescription || ""}
          onChange={(e) =>
            updateFormData({ businessDescription: e.target.value })
          }
          placeholder="Describe your business in 2-3 sentences..."
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-sm rounded-lg"
        />
      </div>

      {/* Core Offerings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="coreOfferings"
            className="text-white flex items-center gap-2 text-sm"
          >
            <Package className="h-4 w-4 text-cyan-400" />
            Core Offerings
          </Label>
          <Button
            type="button"
            onClick={handleManualGenerate}
            disabled={
              isGenerating ||
              (!formData.companyName?.trim() &&
                !formData.businessDescription?.trim())
            }
            variant="ghost"
            size="sm"
            className="text-cyan-400 hover:text-cyan-300 hover:bg-white/5 h-8 px-3 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1.5" />
                Generate
              </>
            )}
          </Button>
        </div>
        <Input
          id="coreOfferings"
          value={coreOfferingsString}
          onChange={(e) => handleCoreOfferingsChange(e.target.value)}
          placeholder={
            isGenerating
              ? "Generating suggestions..."
              : "Enter your core offerings (comma-separated)"
          }
          maxLength={500}
          disabled={isGenerating}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm rounded-lg h-12"
        />
        {isGenerating && (
          <p className="text-xs text-cyan-400/70 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            AI is analyzing your company to suggest core offerings...
          </p>
        )}
      </div>

      {/* Preferred Countries */}
      <div className="space-y-2">
        <Label
          htmlFor="preferredCountries"
          className="text-white flex items-center gap-2 text-sm"
        >
          <Globe className="h-4 w-4 text-cyan-400" />
          Preferred countries and region for growth
        </Label>
        <MultiSelect
          options={countryOptions}
          value={preferredCountriesArray}
          onChange={handleCountriesChange}
          placeholder="Select preferred countries or regions"
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm h-12"
          maxDisplayItems={3}
        />
      </div>
    </div>
  );
};

export default CompanyInfoStep;
