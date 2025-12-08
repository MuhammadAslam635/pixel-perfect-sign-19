import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingService } from "@/services/onboarding.service";
import {
  OnboardingData,
  OnboardingQuestions,
  ONBOARDING_STEPS,
} from "@/types/onboarding.types";
import StepIndicator from "./components/StepIndicator";
import CompanyOverviewStep from "./components/CompanyOverviewStep";
import OperationsStep from "./components/OperationsStep";
import SystemsStep from "./components/SystemsStep";
import StrategyStep from "./components/StrategyStep";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [formData, setFormData] = useState<OnboardingQuestions>({});

  // Fetch existing onboarding data on mount
  useEffect(() => {
    const fetchOnboarding = async () => {
      try {
        setLoading(true);
        const response = await onboardingService.getOnboarding();
        if (response.success && response.data) {
          setOnboardingData(response.data);
          setFormData(response.data.questions || {});
          
          // If already completed, redirect to dashboard
          if (response.data.status === 'completed' || response.data.status === 'approved') {
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      } catch (error: any) {
        // If 404, it means no onboarding exists yet - that's okay, backend will create it on first save
        if (error?.response?.status === 404) {
          // Silently ignore 404 errors for new users
          return;
        }
        console.error("Error fetching onboarding:", error);
        toast.error("Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    };

    fetchOnboarding();
  }, [navigate]);

  // Auto-save when navigating between steps
  const saveProgress = async (newStatus?: 'draft' | 'in_progress'): Promise<boolean> => {
    try {
      setSaving(true);
      await onboardingService.updateOnboarding({
        questions: formData,
        status: newStatus || 'in_progress',
      });

      // Update local storage user data if company name changed
      if (formData.companyName) {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.company !== formData.companyName) {
              user.company = formData.companyName;
              localStorage.setItem('user', JSON.stringify(user));
              // Trigger a storage event for other tabs/components
              window.dispatchEvent(new Event('storage'));
            }
          }
        } catch (e) {
          console.error('Error updating local user data:', e);
        }
      }
      return true;
    } catch (error: any) {
      console.error("Error saving progress:", error);
      // Don't show error toast for every save attempt
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveProgress('in_progress');
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    // Try to save but don't block navigation if it fails
    await saveProgress('draft');
    // Store skip preference in sessionStorage so we don't redirect back immediately
    sessionStorage.setItem('onboarding_skipped', 'true');
    toast.info("You can complete onboarding later from Settings");
    navigate('/dashboard', { replace: true });
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      await saveProgress('in_progress');
      const response = await onboardingService.completeOnboarding();
      if (response.success) {
        toast.success("Onboarding completed successfully!");
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(error?.response?.data?.message || "Failed to complete onboarding");
    } finally {
      setCompleting(false);
    }
  };

  const updateFormData = (updates: Partial<OnboardingQuestions>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyOverviewStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <OperationsStep formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <SystemsStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return (
          <StrategyStep
            formData={formData}
            updateFormData={updateFormData}
            documents={onboardingData?.supportingDocuments || []}
            onDocumentsChange={(docs) => {
              setOnboardingData((prev) =>
                prev ? { ...prev, supportingDocuments: docs } : null
              );
            }}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-white/60">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === ONBOARDING_STEPS.length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome to EmpaTech OS
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Let's get to know your business so we can personalize your experience
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={ONBOARDING_STEPS} />

        {/* Form Container - matching TemplateFormModal card style */}
        <div 
          className="mt-8 rounded-[32px] border border-white/10 p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
          style={{ background: "#0a0a0a" }}
        >
          {/* Gradient overlay - matching TemplateFormModal */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
            }}
          />
          
          <div className="relative z-10">
            {/* Step Title */}
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white drop-shadow-lg">
                {ONBOARDING_STEPS[currentStep - 1].title}
              </h2>
              <p className="text-sm text-white/60 mt-1">
              {ONBOARDING_STEPS[currentStep - 1].description}
              </p>
            </div>

            {/* Step Content */}
            <div className="space-y-6">{renderStep()}</div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-white/60 hover:text-white hover:bg-white/5 order-3 sm:order-1"
            disabled={saving || completing}
          >
            Skip for now
          </Button>

          <div className="flex items-center gap-3 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || saving || completing}
              className="border-white/10 text-white hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={completing || saving}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 min-w-[140px]"
              >
                {completing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={saving || completing}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Saving indicator */}
          {saving && (
            <p className="text-xs text-white/40 order-2 sm:order-3">
              Saving progress...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
