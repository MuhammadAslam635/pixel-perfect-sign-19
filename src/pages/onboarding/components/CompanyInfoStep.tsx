import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions } from "@/types/onboarding.types";
import { Building2, FileText, Package, Globe } from "lucide-react";

interface CompanyInfoStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
}

const CompanyInfoStep = ({ formData, updateFormData }: CompanyInfoStepProps) => {
  // Handle core offerings as comma-separated string
  const coreOfferingsString = formData.coreOfferings?.join(", ") || "";
  
  const handleCoreOfferingsChange = (value: string) => {
    // Support multiple separators: comma, semicolon, pipe
    const offerings = value
      .split(/[,;|]/)
      .map(s => s.trim())
      .filter(Boolean);
    updateFormData({ coreOfferings: offerings });
  };

  return (
    <div className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName" className="text-white flex items-center gap-2 text-sm">
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
        <Label htmlFor="businessDescription" className="text-white flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-cyan-400" />
          Brief Description of your business
        </Label>
        <Textarea
          id="businessDescription"
          value={formData.businessDescription || ""}
          onChange={(e) => updateFormData({ businessDescription: e.target.value })}
          placeholder="Describe your business in 2-3 sentences..."
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-sm rounded-lg"
        />
      </div>

      {/* Core Offerings */}
      <div className="space-y-2">
        <Label htmlFor="coreOfferings" className="text-white flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-cyan-400" />
          Core Offerings
        </Label>
        <Input
          id="coreOfferings"
          value={coreOfferingsString}
          onChange={(e) => handleCoreOfferingsChange(e.target.value)}
          placeholder="Enter your core offerings (comma-separated)"
          maxLength={500}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm rounded-lg h-12"
        />
      </div>

      {/* Preferred Countries */}
      <div className="space-y-2">
        <Label htmlFor="preferredCountries" className="text-white flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-cyan-400" />
          Preferred countries and region for growth
        </Label>
        <Input
          id="preferredCountries"
          value={formData.preferredCountries || ""}
          onChange={(e) => updateFormData({ preferredCountries: e.target.value })}
          placeholder="Enter preferred countries or regions"
          minLength={5}
          maxLength={500}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm rounded-lg h-12"
        />
      </div>
    </div>
  );
};

export default CompanyInfoStep;

