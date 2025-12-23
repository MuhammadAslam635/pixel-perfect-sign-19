import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions, ICPSuggestion } from "@/types/onboarding.types";
import { perplexityService } from "@/services/perplexity.service";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface ICPStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
}

const ICPStep = ({ formData, updateFormData }: ICPStepProps) => {
  const [suggestions, setSuggestions] = useState<ICPSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  // Fetch ICP suggestions when component mounts if website is available
  // useEffect(() => {
  //   const fetchSuggestions = async () => {
  //     if (!formData.website || suggestions.length > 0 || loading) {
  //       return;
  //     }

  //     setLoading(true);
  //     try {
  //       const response = await perplexityService.generateICPSuggestions({
  //         website: formData.website,
  //         companyName: formData.companyName,
  //         businessDescription: formData.businessDescription,
  //       });

  //       if (response.success && response.data.suggestions) {
  //         setSuggestions(response.data.suggestions);
  //       }
  //     } catch (error: any) {
  //       console.error("Error fetching ICP suggestions:", error);
  //       toast.error("Failed to load ICP suggestions. You can still enter your own.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchSuggestions();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [formData.website]);

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    if (suggestions[index]) {
      updateFormData({
        idealCustomerProfile: `${suggestions[index].title}\n\n${suggestions[index].description}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ICP Suggestions Section */}
      {formData.website && (
        <div className="space-y-4">
          {/* <h3 className="text-white text-sm font-medium">
            Here's some suggestion of your ICPs.
          </h3> */}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              <span className="ml-2 text-white/60 text-sm">Generating ICP suggestions...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSelectSuggestion(index)}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all
                    ${
                      selectedSuggestion === index
                        ? "border-cyan-400 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-cyan-400/50"
                    }
                  `}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <User className="h-8 w-8 text-white/60" />
                    <h4 className="text-white font-medium text-sm">{suggestion.title}</h4>
                    <p className="text-white/60 text-xs line-clamp-4">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Custom ICP Input */}
      <div className="space-y-2">
        <Label htmlFor="idealCustomerProfile" className="text-white flex items-center gap-2 text-sm">
          Explain Custom ICP according to your requirements
        </Label>
        <Textarea
          id="idealCustomerProfile"
          value={formData.idealCustomerProfile || ""}
          onChange={(e) => updateFormData({ idealCustomerProfile: e.target.value })}
          placeholder="✨ Explain in 2 to 3 sentence your requirements"
          minLength={10}
          maxLength={1000}
          className="bg-white/[0.06] border-cyan-400/50 text-white placeholder:text-white/40 min-h-[120px] scrollbar-hide text-sm rounded-lg"
        />
      </div>
    </div>
  );
};

export default ICPStep;

