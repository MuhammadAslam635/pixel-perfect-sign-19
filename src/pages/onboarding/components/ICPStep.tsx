import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingQuestions, ICPSuggestion } from "@/types/onboarding.types";
import { onboardingService } from "@/services/onboarding.service";
import { Loader2, User } from "lucide-react";
import {
  updateOnboardingCache,
  getCachedICPSuggestions,
} from "@/utils/onboardingCache";

interface ICPStepProps {
  formData: OnboardingQuestions;
  updateFormData: (updates: Partial<OnboardingQuestions>) => void;
  errors?: Record<string, string>;
}

const ICPStep = ({ formData, updateFormData, errors = {} }: ICPStepProps) => {
  const [suggestions, setSuggestions] = useState<ICPSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(
    null
  );
  const [hasFetched, setHasFetched] = useState(false);
  const lastWebsiteRef = useRef<string>("");

  // Reset fetch flag when website changes
  useEffect(() => {
    if (formData.website && formData.website !== lastWebsiteRef.current) {
      setHasFetched(false);
      lastWebsiteRef.current = formData.website;
    }
  }, [formData.website]);

  // Fetch ICP suggestions when component mounts if website is available
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!formData.website || hasFetched || loading) {
        return;
      }

      setLoading(true);
      setHasFetched(true);

      try {
        // Check cache first
        const cachedSuggestions = getCachedICPSuggestions(
          formData.website,
          formData.companyName,
          formData.businessDescription
        );

        if (cachedSuggestions && cachedSuggestions.length > 0) {
          setSuggestions(cachedSuggestions);
          setLoading(false);
          return;
        }

        const response = await onboardingService.generateICPSuggestions({
          website: formData.website,
          companyName: formData.companyName,
          businessDescription: formData.businessDescription,
        });

        if (response.success && response.data?.suggestions) {
          setSuggestions(response.data.suggestions);

          // Cache the fetched suggestions
          updateOnboardingCache({
            icpSuggestions: {
              website: formData.website,
              companyName: formData.companyName,
              businessDescription: formData.businessDescription,
              suggestions: response.data.suggestions,
              fetchedAt: Date.now(),
            },
          });
        } else {
          // If API fails, show empty cards
          setSuggestions([]);
        }
      } catch (error: any) {
        console.error("Error fetching ICP suggestions:", error);
        // Don't show error toast - just show empty cards
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [
    formData.website,
    formData.companyName,
    formData.businessDescription,
    hasFetched,
    loading,
  ]);

  // Truncate description to 100-150 words for card display
  const truncateDescription = (
    text: string,
    maxWords: number = 100
  ): string => {
    if (!text) return "";
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const handleSelectSuggestion = (index: number) => {
    setSelectedSuggestion(index);
    if (suggestions[index]) {
      // Show full details in the custom ICP field below
      updateFormData({
        idealCustomerProfile: `${suggestions[index].title}\n\n${suggestions[index].description}`,
      });
    }
  };

  // Display suggestion type with additional flags
  type DisplaySuggestion = ICPSuggestion & {
    isLoading?: boolean;
    isEmpty?: boolean;
  };

  // Always show 3 cards - either with suggestions, loading, or placeholder
  const getDisplaySuggestions = (): DisplaySuggestion[] => {
    if (loading) {
      return Array(3)
        .fill(null)
        .map(
          (_, i) =>
            ({
              title: "",
              description: "",
              isLoading: true,
              isEmpty: false,
            } as DisplaySuggestion)
        );
    }

    if (suggestions.length > 0) {
      // Pad with empty placeholders if less than 3
      const padded: DisplaySuggestion[] = [...suggestions];
      while (padded.length < 3) {
        padded.push({
          title: "Lorem Ipsum lorem",
          description:
            "Lorem Ipsum is simply dummy text of the printing & typesis industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled.",
          isEmpty: true,
          isLoading: false,
        } as DisplaySuggestion);
      }
      return padded
        .slice(0, 3)
        .map(
          (s) =>
            ({ ...s, isEmpty: false, isLoading: false } as DisplaySuggestion)
        );
    }

    // Show placeholder cards
    return Array(3)
      .fill(null)
      .map(
        (_, i) =>
          ({
            title: "Lorem Ipsum lorem",
            description:
              "Lorem Ipsum is simply dummy text of the printing & typesis industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled.",
            isEmpty: true,
            isLoading: false,
          } as DisplaySuggestion)
      );
  };

  const displaySuggestions = getDisplaySuggestions();

  return (
    <div className="space-y-6">
      {/* ICP Suggestions Section - Always show 3 cards */}
      <div className="space-y-4">
        <h3 className="text-white text-base font-medium">
          Here's some suggestion of your ICPs.
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displaySuggestions.map((suggestion, index: number) => {
            const isPlaceholder =
              suggestion.isEmpty || (!suggestions[index] && !loading);
            const isSelected =
              selectedSuggestion === index &&
              !isPlaceholder &&
              !suggestion.isLoading;

            return (
              <div
                key={index}
                onClick={() =>
                  !suggestion.isLoading &&
                  !isPlaceholder &&
                  handleSelectSuggestion(index)
                }
                className={`
                  p-4 rounded-lg border transition-all flex flex-col h-[280px]
                  ${
                    suggestion.isLoading || isPlaceholder
                      ? "border-white/10 bg-white/[0.03] cursor-default"
                      : isSelected
                      ? "border-cyan-400 bg-cyan-400/10 cursor-pointer"
                      : "border-white/10 bg-white/[0.03] hover:border-cyan-400/50 cursor-pointer"
                  }
                `}
              >
                {suggestion.isLoading ? (
                  <div className="flex flex-col items-center text-center space-y-3 py-4">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <p className="text-white/60 text-xs">Loading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-2.5 flex-1 overflow-hidden">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <h4 className="text-white font-medium text-sm flex-shrink-0 line-clamp-2">
                      {suggestion.title || "Lorem Ipsum lorem"}
                    </h4>
                    <p className="text-white/60 text-xs leading-relaxed text-left w-full flex-1 overflow-y-auto pr-2 scrollbar-hide">
                      {suggestion.isEmpty
                        ? "Lorem Ipsum is simply dummy text of the printing & typesis industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled."
                        : suggestion.description || ""}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom ICP Input */}
      <div className="space-y-2">
        <Label
          htmlFor="idealCustomerProfile"
          className="text-white flex items-center gap-2 text-sm"
        >
          <span>✨</span>
          Explain Custom ICP according to your requirements
        </Label>
        <Textarea
          id="idealCustomerProfile"
          value={formData.idealCustomerProfile || ""}
          onChange={(e) =>
            updateFormData({ idealCustomerProfile: e.target.value })
          }
          placeholder="✨ Explain in 2 to 3 sentence your requirements"
          minLength={10}
          maxLength={1000}
          className={`bg-white/[0.06] text-white placeholder:text-white/40 min-h-[120px] scrollbar-hide text-sm rounded-lg ${
            errors.idealCustomerProfile
              ? "border-red-500 ring-offset-red-500"
              : "border-cyan-400/50"
          }`}
        />
        {errors.idealCustomerProfile && (
          <p className="text-red-500 text-sm mt-1">
            {errors.idealCustomerProfile}
          </p>
        )}
      </div>
    </div>
  );
};

export default ICPStep;
