import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions } from "@/types/onboarding.types";
import { AlertTriangle, Clock, Lightbulb, Users, Wrench } from "lucide-react";

interface OperationsStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
}

const OperationsStep = ({ formData, updateFormData }: OperationsStepProps) => {
  return (
    <div className="space-y-6">
      {/* Q6: Current Challenges */}
      <div className="space-y-2">
        <Label htmlFor="currentChallenges" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Current Business or Operational Challenges
        </Label>
        <Textarea
          id="currentChallenges"
          value={formData.currentChallenges || ""}
          onChange={(e) => updateFormData({ currentChallenges: e.target.value })}
          placeholder="What are you currently struggling with the most in sales, marketing, or customer engagement?"
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">10-1000 characters</p>
      </div>

      {/* Q7: Challenge Duration */}
      <div className="space-y-2">
        <Label htmlFor="challengeDuration" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Clock className="h-4 w-4 text-cyan-400" />
          Duration of These Challenges
        </Label>
        <Textarea
          id="challengeDuration"
          value={formData.challengeDuration || ""}
          onChange={(e) => updateFormData({ challengeDuration: e.target.value })}
          placeholder="How long have these issues been affecting your operations?"
          minLength={5}
          maxLength={200}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[80px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-200 characters</p>
      </div>

      {/* Q8: Previous Attempts */}
      <div className="space-y-2">
        <Label htmlFor="previousAttempts" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          Previous Attempts or Solutions
        </Label>
        <Textarea
          id="previousAttempts"
          value={formData.previousAttempts || ""}
          onChange={(e) => updateFormData({ previousAttempts: e.target.value })}
          placeholder="What tools, partners, or methods have you tried so far to solve these problems?"
          minLength={5}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-1000 characters</p>
      </div>

      {/* Q9: Existing Teams */}
      <div className="space-y-2">
        <Label htmlFor="existingTeams" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Users className="h-4 w-4 text-cyan-400" />
          Existing Internal Teams & Roles
        </Label>
        <Textarea
          id="existingTeams"
          value={formData.existingTeams || ""}
          onChange={(e) => updateFormData({ existingTeams: e.target.value })}
          placeholder="Please outline your key departments (e.g., marketing, sales, customer support) and approximate team sizes."
          minLength={5}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[100px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-1000 characters</p>
      </div>

      {/* Q10: Current Tech Stack */}
      <div className="space-y-2">
        <Label htmlFor="currentTechStack" className="text-white/80 flex items-center gap-2 text-xs sm:text-sm">
          <Wrench className="h-4 w-4 text-cyan-400" />
          Current Tech Stack
        </Label>
        <Textarea
          id="currentTechStack"
          value={formData.currentTechStack || ""}
          onChange={(e) => updateFormData({ currentTechStack: e.target.value })}
          placeholder="List the tools/platforms you currently use:
• CRM
• Marketing
• Email
• Domains
• Hosting
• Social Media
• Analytics"
          minLength={5}
          maxLength={1000}
          className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 min-h-[120px] scrollbar-hide text-xs sm:text-sm"
        />
        <p className="text-xs text-white/40">5-1000 characters. Example: CRM: Salesforce, Marketing: HubSpot</p>
      </div>
    </div>
  );
};

export default OperationsStep;