import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { OnboardingQuestions } from "@/types/onboarding.types";
import { Globe } from "lucide-react";

interface CompanyWebsiteStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
  onEnterPress?: () => void;
}

const CompanyWebsiteStep = ({
  formData,
  updateFormData,
  onEnterPress,
}: CompanyWebsiteStepProps) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onEnterPress) {
      e.preventDefault();
      onEnterPress();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label
          htmlFor="website"
          className="text-white flex items-center gap-2 text-sm"
        >
          Website
        </Label>
        <Input
          id="website"
          type="url"
          value={formData.website || ""}
          onChange={(e) => updateFormData({ website: e.target.value })}
          onKeyPress={handleKeyPress}
          placeholder="Enter Your website link"
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 text-sm rounded-lg h-14"
        />
      </div>
    </div>
  );
};

export default CompanyWebsiteStep;
