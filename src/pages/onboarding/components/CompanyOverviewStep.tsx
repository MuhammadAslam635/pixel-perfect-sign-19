import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions } from "@/types/onboarding.types";
import { Building2, Globe, FileText, Target, TrendingUp, Package, Users } from "lucide-react";

interface CompanyOverviewStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
}

const CompanyOverviewStep = ({ formData, updateFormData }: CompanyOverviewStepProps) => {
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
      {/* Q1: Company Name & Website */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
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
            className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-xs sm:text-sm"
          />
          <p className="text-xs text-white/40">2-200 characters</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
            <Globe className="h-4 w-4 text-cyan-400" />
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website || ""}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://example.com"
            className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Q2: Business Description */}
      <div className="space-y-2">
        <Label htmlFor="businessDescription" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <FileText className="h-4 w-4 text-cyan-400" />
          Brief Description of Your Business
        </Label>
        <Textarea
          id="businessDescription"
          value={formData.businessDescription || ""}
          onChange={(e) => updateFormData({ businessDescription: e.target.value })}
          placeholder="In 2-3 sentences, describe what your company does and who you serve..."
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">10-1000 characters</p>
      </div>

      {/* Q3: Main Product/Service */}
      <div className="space-y-2">
        <Label htmlFor="mainProductService" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Package className="h-4 w-4 text-cyan-400" />
          Main Product or Service Offering
        </Label>
        <Textarea
          id="mainProductService"
          value={formData.mainProductService || ""}
          onChange={(e) => updateFormData({ mainProductService: e.target.value })}
          placeholder="What is your core offering? (You may list multiple if applicable)"
          minLength={5}
          maxLength={500}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[80px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-500 characters</p>
      </div>

      {/* Core Offerings (Array field) */}
      <div className="space-y-2">
        <Label htmlFor="coreOfferings" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Package className="h-4 w-4 text-cyan-400" />
          Core Offerings (comma-separated)
        </Label>
        <Input
          id="coreOfferings"
          value={coreOfferingsString}
          onChange={(e) => handleCoreOfferingsChange(e.target.value)}
          placeholder="e.g., Software Development, Digital Marketing, Cloud Solutions"
          maxLength={500}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">Each offering: 5-500 characters. Separate with commas, semicolons, or pipes</p>
      </div>

      {/* Q4: Ideal Customer Profile */}
      <div className="space-y-2">
        <Label htmlFor="idealCustomerProfile" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Users className="h-4 w-4 text-cyan-400" />
          Ideal Customer Profile (ICP)
        </Label>
        <Textarea
          id="idealCustomerProfile"
          value={formData.idealCustomerProfile || ""}
          onChange={(e) => updateFormData({ idealCustomerProfile: e.target.value })}
          placeholder="Who are your best-fit clients and why? (e.g., industry, location, company size, purchase motive)"
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">10-1000 characters</p>
      </div>

      {/* Q5: Primary Business Goals */}
      <div className="space-y-2">
        <Label htmlFor="primaryBusinessGoals" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          Primary Business Goals for the Next 12 Months
        </Label>
        <Textarea
          id="primaryBusinessGoals"
          value={formData.primaryBusinessGoals || ""}
          onChange={(e) => updateFormData({ primaryBusinessGoals: e.target.value })}
          placeholder="What are your top growth or operational priorities?"
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">10-1000 characters</p>
      </div>
    </div>
  );
};

export default CompanyOverviewStep;