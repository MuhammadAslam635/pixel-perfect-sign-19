import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingService } from "@/services/onboarding.service";
import { fetchAndSyncUser } from "@/utils/authSync";
import {
  OnboardingData,
  OnboardingQuestions,
  ONBOARDING_STEPS,
} from "@/types/onboarding.types";
import StepIndicator from "./components/StepIndicator";
import CompanyWebsiteStep from "./components/CompanyWebsiteStep";
import CompanyInfoStep from "./components/CompanyInfoStep";
import ICPStep from "./components/ICPStep";
import DataPartnersStep from "./components/DataPartnersStep";
import group60Image from "@/assets/Group 60.png";
import Logo from "@/components/Logo";

// Validation rules matching backend Zod schema
const FIELD_VALIDATION_RULES: Record<string, { min: number; max: number }> = {
  // Step 1
  website: { min: 1, max: 500 },
  // Step 2
  companyName: { min: 2, max: 200 },
  businessDescription: { min: 10, max: 1000 },
  coreOfferings: { min: 5, max: 500 },
  preferredCountries: { min: 5, max: 500 },
  // Step 3
  idealCustomerProfile: { min: 10, max: 1000 },
  // Step 4
  existingPartners: { min: 5, max: 1000 },
  dataChannels: { min: 5, max: 1000 },
  differentiators: { min: 10, max: 1000 },
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [formData, setFormData] = useState<OnboardingQuestions>({});

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

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
          if (
            response.data.status === "completed" ||
            response.data.status === "approved"
          ) {
            navigate("/dashboard", { replace: true });
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

  const dispatch = useDispatch();

  // Auto-save when navigating between steps
  const saveProgress = async (
    newStatus?: "draft" | "in_progress"
  ): Promise<boolean> => {
    try {
      setSaving(true);

      // Clean form data: remove empty arrays and undefined values for fields not in current step
      const currentStepConfig = ONBOARDING_STEPS.find(
        (s) => s.id === currentStep
      );
      const cleanedQuestions: Partial<OnboardingQuestions> = { ...formData };

      // Remove empty arrays and undefined values for fields not in current or previous steps
      if (currentStepConfig) {
        const allowedFields = new Set<string>();
        // Include fields from current step and all previous steps
        for (let i = 1; i <= currentStep; i++) {
          const step = ONBOARDING_STEPS.find((s) => s.id === i);
          if (step) {
            step.fields.forEach((field) => allowedFields.add(field));
          }
        }

        // Clean up fields not in allowed set
        Object.keys(cleanedQuestions).forEach((key) => {
          if (!allowedFields.has(key)) {
            delete cleanedQuestions[key as keyof OnboardingQuestions];
          }
        });

        // Remove empty arrays
        Object.keys(cleanedQuestions).forEach((key) => {
          const value = cleanedQuestions[key as keyof OnboardingQuestions];
          if (Array.isArray(value) && value.length === 0) {
            delete cleanedQuestions[key as keyof OnboardingQuestions];
          }
        });
      }

      await onboardingService.updateOnboarding({
        questions: cleanedQuestions,
        status: newStatus || "in_progress",
      });

      // Update local storage user data if company name changed
      if (formData.companyName) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.name !== formData.companyName) {
              // Update display name to keep greeting in sync
              user.name = formData.companyName;
              localStorage.setItem("user", JSON.stringify(user));
              // Update redux auth slice so current session reflects changes immediately
              try {
                dispatch(
                  updateUser({
                    name: formData.companyName,
                  })
                );
              } catch (e) {
                // Ignore dispatch errors but log for debugging
                console.error("Error dispatching updateUser:", e);
              }
              // Trigger a storage event for other tabs/components
              window.dispatchEvent(new Event("storage"));
            }
          }
        } catch (e) {
          console.error("Error updating local user data:", e);
        }
      }
      return true;
    } catch (error: any) {
      console.error("Error saving progress:", error);

      // Handle validation errors from backend
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (Array.isArray(errors) && errors.length > 0) {
          // Show the first validation error
          const firstError = errors[0];
          toast.error(firstError.message || "Validation error");
        } else {
          toast.error("Failed to save progress");
        }
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to save progress");
      }

      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateStep = (stepId: number): boolean => {
    const stepConfig = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!stepConfig) {
      return true;
    }

    const errors: string[] = [];

    // Only validate fields that belong to this step
    stepConfig.fields.forEach((field) => {
      const value = formData[field as keyof OnboardingQuestions];
      const rules = FIELD_VALIDATION_RULES[field];

      // Special handling for website URL validation
      if (field === "website") {
        if (typeof value === "string" && value.trim() !== "") {
          try {
            new URL(value);
          } catch {
            errors.push(
              `Website: Please provide a valid URL (e.g., https://example.com)`
            );
          }
        } else if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          errors.push(`Website: Required`);
        }
      }
      // Special handling for array fields (coreOfferings)
      else if (field === "coreOfferings") {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            errors.push(`Core Offerings: At least one item required`);
          } else if (rules) {
            // Validate each item in array
            const invalidItems = value.filter(
              (item) =>
                typeof item === "string" &&
                (item.trim().length < rules.min ||
                  item.trim().length > rules.max)
            );
            if (invalidItems.length > 0) {
              errors.push(
                `Core Offerings: Each item must be ${rules.min}-${rules.max} characters`
              );
            }
          }
        } else {
          errors.push(`Core Offerings: Required`);
        }
      } else if (typeof value === "string") {
        const trimmed = value.trim();
        // Step 4 fields (differentiators) are optional, so don't require them
        const isStep4Optional =
          currentStep === 4 && field === "differentiators";
        if (trimmed === "" && !isStep4Optional) {
          errors.push(`${field}: Required`);
        } else if (rules && trimmed !== "" && !isStep4Optional) {
          // Only validate min/max if field is not optional and has content
          if (trimmed.length < rules.min) {
            errors.push(`${field}: Minimum ${rules.min} characters required`);
          } else if (trimmed.length > rules.max) {
            errors.push(`${field}: Maximum ${rules.max} characters allowed`);
          }
        } else if (rules && trimmed !== "" && isStep4Optional) {
          // For optional fields, only validate max length if provided
          if (trimmed.length > rules.max) {
            errors.push(`${field}: Maximum ${rules.max} characters allowed`);
          }
        }
      } else if (value === undefined || value === null) {
        // Step 4 fields are optional
        const isStep4Optional =
          currentStep === 4 && field === "differentiators";
        if (!isStep4Optional) {
          errors.push(`${field}: Required`);
        }
      }
    });

    if (errors.length > 0) {
      toast.error(errors[0]); // Show first error
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const saved = await saveProgress("in_progress");
    if (!saved) {
      // Don't proceed if save failed
      return;
    }

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
    // Skip validation and save current progress silently
    // Don't show errors since user is intentionally skipping
    try {
      await onboardingService.updateOnboarding({
        questions: formData,
        status: "draft",
      });
    } catch (error) {
      // Silently ignore save errors when skipping
      console.error("Skip: Could not save progress, continuing anyway");
    }

    // Set sessionStorage to allow skipping in current session
    // This will be cleared on next login, so user will be redirected back to onboarding
    sessionStorage.setItem("onboarding_skipped", "true");
    toast.info(
      "You can complete onboarding later. You'll be prompted to complete it on your next login."
    );
    navigate("/dashboard", { replace: true });
  };

  const handleComplete = async () => {
    // Validate current step before completing
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      setCompleting(true);
      const saved = await saveProgress("in_progress");
      if (!saved) {
        // Don't proceed if save failed
        return;
      }

      const response = await onboardingService.completeOnboarding();
      if (response.success) {
        // Refresh canonical user data from server and sync localStorage + redux
        try {
          const synced = await fetchAndSyncUser();
          if (synced) {
            dispatch(updateUser(synced));
          }
        } catch (e) {
          console.error("Error syncing user after onboarding:", e);
        }

        toast.success("Onboarding completed successfully!");
        navigate("/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.error("Error completing onboarding:", error);

      // Handle specific completion errors
      if (error?.response?.data?.data?.completedSteps) {
        const steps = error.response.data.data.completedSteps;
        const incompleteSteps = Object.entries(steps)
          .filter(([_, completed]) => !completed)
          .map(([step]) => step);

        if (incompleteSteps.length > 0) {
          toast.error(
            `Please complete all required fields in ${incompleteSteps.join(
              ", "
            )}`
          );
        } else {
          toast.error(
            error?.response?.data?.message || "Failed to complete onboarding"
          );
        }
      } else {
        toast.error(
          error?.response?.data?.message || "Failed to complete onboarding"
        );
      }
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
        return (
          <CompanyWebsiteStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 2:
        return (
          <CompanyInfoStep
            formData={formData}
            updateFormData={updateFormData}
          />
        );
      case 3:
        return <ICPStep formData={formData} updateFormData={updateFormData} />;
      case 4:
        return (
          <DataPartnersStep
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
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar - 1/3 width */}
      <div className="hidden lg:flex lg:w-1/3 relative bg-background">
        <div className="w-full h-full flex flex-col items-center justify-between pt-8 pr-8">
          {/* Logo */}
          <div className="w-full flex items-center justify-center min-h-[300px] mt-8 pl-8">
            <Logo variant="full" className="h-16" />
          </div>

          {/* Group 60 Image */}
          <div className="w-full h-full flex items-end justify-center">
            <img
              src={group60Image}
              alt="Decorative"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right Content - 2/3 width */}
      <div className="w-full lg:w-2/3 flex flex-col min-h-screen">
        <div className="flex-1 flex flex-col">
          {/* Step Indicator - Full width, fixed from top */}
          <div className="w-full pt-[100px] pb-24">
            <div className="max-w-4xl pl-8 pr-4 sm:pl-12 sm:pr-6 lg:pl-16 lg:pr-8">
              <StepIndicator
                currentStep={currentStep}
                steps={ONBOARDING_STEPS}
              />
            </div>
          </div>

          {/* Form Content - Match step indicator width exactly */}
          <div className="max-w-3xl pl-8 pr-4 sm:pl-12 sm:pr-6 lg:pl-16 lg:pr-8 w-full">
            {/* Welcome Header - Only show on step 1 */}
            {currentStep === 1 && (
              <div className="mb-8">
                <h1
                  className="text-white mb-2 leading-[1.2]"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "64px",
                    fontWeight: 500,
                  }}
                >
                  Welcome to Empatech OS
                </h1>
                <p
                  className="text-white/60 max-w-lg"
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "20px",
                    fontWeight: 300,
                  }}
                >
                  Let's got to know your business so we can personalize your
                  experience
                </p>
              </div>
            )}

            {/* Step Title */}
            {currentStep !== 1 && (
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {ONBOARDING_STEPS[currentStep - 1].title}
                </h2>
              </div>
            )}

            {/* Step Content */}
            <div className="space-y-6 mb-8">{renderStep()}</div>

            {/* Navigation Buttons - Right after form fields */}
            <div className="flex items-center justify-between gap-4 mt-6">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="border-cyan-400/50 text-white hover:bg-white/5"
                disabled={saving || completing}
              >
                Skip
              </Button>

              <div className="flex items-center gap-3 ml-auto">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={saving || completing}
                    className="border-cyan-400/50 text-white hover:bg-white/5"
                  >
                    Back
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    onClick={handleComplete}
                    disabled={completing || saving}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 min-w-[120px]"
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
                      "Next"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
