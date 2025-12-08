import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions } from "@/types/onboarding.types";
import { Handshake, Database, Globe } from "lucide-react";

interface SystemsStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
}

const SystemsStep = ({ formData, updateFormData }: SystemsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Q11: Existing Partners */}
      <div className="space-y-2">
        <Label htmlFor="existingPartners" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Handshake className="h-4 w-4 text-cyan-400" />
          Existing External Partners
        </Label>
        <Textarea
          id="existingPartners"
          value={formData.existingPartners || ""}
          onChange={(e) => updateFormData({ existingPartners: e.target.value })}
          placeholder="Are you currently working with any marketing agencies, sales consultants, or customer support providers?"
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-1000 characters</p>
      </div>

      {/* Q12: Data Channels */}
      <div className="space-y-2">
        <Label htmlFor="dataChannels" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Database className="h-4 w-4 text-cyan-400" />
          Main Data Channels & Pipelines
        </Label>
        <Textarea
          id="dataChannels"
          value={formData.dataChannels || ""}
          onChange={(e) => updateFormData({ dataChannels: e.target.value })}
          placeholder="Where does your business data come from (ads, website, CRM, etc.)? How is it processed and used?"
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[120px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">Describe your data sources and how information flows through your systems</p>
      </div>

      {/* Q13: Preferred Countries */}
      <div className="space-y-2">
        <Label htmlFor="preferredCountries" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Globe className="h-4 w-4 text-cyan-400" />
          Preferred Countries or Regions for Growth
        </Label>
        <Textarea
          id="preferredCountries"
          value={formData.preferredCountries || ""}
          onChange={(e) => updateFormData({ preferredCountries: e.target.value })}
          placeholder="Are there specific markets or territories you want to prioritize for expansion?"
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-500 characters</p>
      </div>
    </div>
  );
};

export default SystemsStep;