import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardCheck,
  FileText,
  MessageSquare,
  Building2,
  Globe,
  Target,
  Package,
  MapPin,
  Loader2,
  AlertCircle,
  File,
} from "lucide-react";
import { onboardingService } from "@/services/onboarding.service";
import { OnboardingData } from "@/types/onboarding.types";

const onboardingSteps = [
  {
    icon: ClipboardCheck,
    title: "Complete Requirements",
    description:
      "Share your brand brief, access preferences, and success criteria so we can tailor activation.",
  },
  {
    icon: FileText,
    title: "Upload Supporting Docs",
    description:
      "Provide playbooks, SOPs, or scripts that should inform hand-offs to your AI copilots.",
  },
  {
    icon: MessageSquare,
    title: "Schedule Kickoff",
    description:
      "We'll review everything together, align timelines, and configure ongoing reporting.",
  },
];

const OnboardingPanel = () => {
  const navigate = useNavigate();
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOnboardingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await onboardingService.getOnboarding();
        if (response.success && response.data) {
          setOnboardingData(response.data);
        }
      } catch (err: any) {
        // If 404, it means no onboarding exists yet - that's okay
        if (err?.response?.status !== 404) {
          console.error("Error fetching onboarding data:", err);
          setError("Failed to load onboarding data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingData();

    // Listen for custom event to refresh data when onboarding is updated
    const handleOnboardingUpdate = () => {
      console.log("[OnboardingPanel] Refreshing data due to update event");
      fetchOnboardingData();
    };

    window.addEventListener("onboarding_updated", handleOnboardingUpdate);

    return () => {
      window.removeEventListener("onboarding_updated", handleOnboardingUpdate);
    };
  }, []);

  const handleTalkToOnboarding = () => {
    navigate("/onboarding");
  };

  const questions = onboardingData?.questions || {};
  const hasData = onboardingData && Object.keys(questions).length > 0;

  return (
    <div className="space-y-6 text-white">
      <Card className="bg-transparent p-0 border-none">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xs sm:text-sm md:text-base -mb-1">
            Company Onboarding
          </CardTitle>
          <p className="text-[10px] text-white/70">
            {hasData
              ? "Your onboarding information is displayed below. Click 'Talk to onboarding' to make changes."
              : "Follow these steps so we can activate your account and calibrate the right AI copilots for your team."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-[10px] text-red-400">{error}</p>
              </div>
            </div>
          ) : hasData ? (
            <>
              {/* Display saved onboarding data */}
              <div className="space-y-3">
                {/* Company Name */}
                {questions.companyName && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold mb-1">
                          Company Name
                        </h3>
                        <p className="text-[10px] text-white/70">
                          {questions.companyName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Website */}
                {questions.website && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                        <Globe className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold mb-1">
                          Website
                        </h3>
                        <a
                          href={questions.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 break-all"
                        >
                          {questions.website}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Description */}
                {questions.businessDescription && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold mb-1">
                          Business Description
                        </h3>
                        <p className="text-[10px] text-white/70 whitespace-pre-wrap">
                          {questions.businessDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Core Offerings */}
                {questions.coreOfferings &&
                  questions.coreOfferings.length > 0 && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                          <Package className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold mb-2">
                            Core Offerings
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {questions.coreOfferings.map((offering, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-[10px]"
                              >
                                {offering}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Preferred Countries */}
                {questions.preferredCountries &&
                  (Array.isArray(questions.preferredCountries)
                    ? questions.preferredCountries.length > 0
                    : false) && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold mb-1">
                            Preferred Countries
                          </h3>
                          <p className="text-[10px] text-white/70">
                            {Array.isArray(questions.preferredCountries)
                              ? questions.preferredCountries.join(", ")
                              : questions.preferredCountries}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Ideal Customer Profile */}
                {questions.idealCustomerProfile && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                        <Target className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold mb-1">
                          Ideal Customer Profile
                        </h3>
                        <p className="text-[10px] text-white/70 whitespace-pre-wrap">
                          {questions.idealCustomerProfile}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Differentiators */}
                {questions.differentiators && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200 flex-shrink-0">
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold mb-1">
                          Differentiators
                        </h3>
                        <p className="text-[10px] text-white/70 whitespace-pre-wrap">
                          {questions.differentiators}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-cyan-200">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold">
                        {step.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-white/70">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <h4 className="text-[11px] font-semibold uppercase  text-white/60">
              Need a hand?
            </h4>
            <p className="mt-2 text-[10px] text-white/70">
              Our onboarding team is ready to walk through requirements, help
              with configuration, or answer any workflow questions.
            </p>
            <Button
              onClick={handleTalkToOnboarding}
              className="mt-3 text-[10px] h-8 bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white hover:from-[#30cfd0] hover:to-[#2a9cb3]"
              style={{
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              Talk to onboarding
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingPanel;
