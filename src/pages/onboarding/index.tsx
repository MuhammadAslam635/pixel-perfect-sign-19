import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { updateUser } from "@/store/slices/authSlice";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onboardingService } from "@/services/onboarding.service";
import { apolloService } from "@/services/apollo.service";
import { fetchAndSyncUser } from "@/utils/authSync";
import {
  updateOnboardingCache,
  getCachedApolloData,
  clearOnboardingCache,
  clearWebsiteCache,
} from "@/utils/onboardingCache";
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
  // Differentiators is optional, but if provided, must be at least 10 characters
  differentiators: { min: 10, max: 500 },
};

const FIELD_LABELS: Record<string, string> = {
  website: "Website",
  companyName: "Company Name",
  businessDescription: "Business Description",
  coreOfferings: "Core Offerings",
  preferredCountries: "Preferred Countries",
  idealCustomerProfile: "Ideal Customer Profile",
  existingPartners: "Existing Partners",
  dataChannels: "Data Channels",
  differentiators: "Differentiators",
  address: "Address",
  postalCode: "Postal Code",
  country: "Country",
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [fetchingCompanyInfo, setFetchingCompanyInfo] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(
    null
  );
  const [formData, setFormData] = useState<OnboardingQuestions>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save debouncing
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous website to detect changes
  const previousWebsiteRef = useRef<string | undefined>(undefined);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Fetch existing onboarding data on mount - only run once
  // Always verify with API to ensure data still exists in DB
  useEffect(() => {
    let isMounted = true;

    const fetchOnboarding = async () => {
      try {
        setLoading(true);

        // Always fetch from API to verify data exists in DB
        // This ensures we detect when data has been deleted
        const response = await onboardingService.getOnboarding();

        if (!isMounted) return;

        if (response.success && response.data) {
          setOnboardingData(response.data);

          // Set form data with all existing values - ensure we preserve all fields
          // Make sure to handle all data types correctly (strings, arrays, etc.)
          if (questions && Object.keys(questions).length > 0) {
            // Deep copy to ensure we don't lose any nested data
            const formDataCopy: OnboardingQuestions = {
              website: questions.website,
              companyName: questions.companyName,
              businessDescription: questions.businessDescription,
              coreOfferings: Array.isArray(questions.coreOfferings)
                ? [...questions.coreOfferings]
                : questions.coreOfferings,
              preferredCountries: Array.isArray(questions.preferredCountries)
                ? [...questions.preferredCountries]
                : typeof questions.preferredCountries === "string"
                ? questions.preferredCountries
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                : [],
              address: questions.address,
              postalCode: questions.postalCode,
              country: questions.country,
              idealCustomerProfile: questions.idealCustomerProfile,
              existingPartners: questions.existingPartners,
              dataChannels: questions.dataChannels,
              differentiators: questions.differentiators,
            };

            setFormData(formDataCopy);

            // Initialize the previous website ref with the loaded website
            if (formDataCopy.website) {
              previousWebsiteRef.current = formDataCopy.website;
            }

            // Cache the data in sessionStorage for future navigation
            sessionStorage.setItem(
              "onboarding_data",
              JSON.stringify({
                onboardingData: response.data,
                formData: formDataCopy,
              })
            );
          } else {
            console.log("[Onboarding] No questions found in response");
          }

          // Allow users to view/edit onboarding even if completed
          // Removed redirect to dashboard - users can always access onboarding page
        } else {
          console.log("[Onboarding] No data found, starting fresh");
        }
      } catch (error: any) {
        if (!isMounted) return;

        // If 404, it means no onboarding exists yet - that's okay, backend will create it on first save
        if (error?.response?.status === 404) {
          console.log(
            "[Onboarding] No onboarding record found (404), starting fresh"
          );
          // Clear cache since no data exists in DB
          clearOnboardingCache();
          sessionStorage.removeItem("onboarding_data");
          // Silently ignore 404 errors for new users
          return;
        }
        console.error("Error fetching onboarding:", error);
        toast.error("Failed to load onboarding data");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOnboarding();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const dispatch = useDispatch();

  // Auto-save when navigating between steps
  const saveProgress = async (
    newStatus?: "draft" | "in_progress",
    formDataOverride?: OnboardingQuestions
  ): Promise<boolean> => {
    try {
      setSaving(true);

      // Use overridden data if provided, otherwise use current state
      const dataToUse = formDataOverride || formData;

      // Clean form data: remove empty arrays and undefined values for fields not in current step
      const currentStepConfig = ONBOARDING_STEPS.find(
        (s) => s.id === currentStep
      );
      const cleanedQuestions: Partial<OnboardingQuestions> = { ...dataToUse };

      // Normalize preferredCountries to always be an array
      if (cleanedQuestions.preferredCountries) {
        if (typeof cleanedQuestions.preferredCountries === "string") {
          // Convert string to array
          cleanedQuestions.preferredCountries = cleanedQuestions.preferredCountries
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
        }
        // If it's already an array, keep it as is
        if (Array.isArray(cleanedQuestions.preferredCountries) && cleanedQuestions.preferredCountries.length === 0) {
          delete cleanedQuestions.preferredCountries;
        }
      }

      // Remove empty arrays
      Object.keys(cleanedQuestions).forEach((key) => {
        const value = cleanedQuestions[key as keyof OnboardingQuestions];
        if (Array.isArray(value) && value.length === 0) {
          delete cleanedQuestions[key as keyof OnboardingQuestions];
        }
      });

      await onboardingService.updateOnboarding({
        questions: cleanedQuestions,
        status: newStatus || "in_progress",
      });

      // Update sessionStorage cache with the latest form data
      try {
        const cachedData = sessionStorage.getItem("onboarding_data");
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          // Update the formData in cache
          parsedCache.formData = dataToUse;
          sessionStorage.setItem(
            "onboarding_data",
            JSON.stringify(parsedCache)
          );
        }
      } catch (e) {
        console.error("[Onboarding] Error updating sessionStorage cache:", e);
      }

      // Dispatch custom event to notify OnboardingPanel to refresh
      window.dispatchEvent(new Event("onboarding_updated"));

      // Update local storage user data if company name changed
      if (dataToUse.companyName) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.name !== dataToUse.companyName) {
              // Update display name to keep greeting in sync
              user.name = dataToUse.companyName;
              localStorage.setItem("user", JSON.stringify(user));
              // Update redux auth slice so current session reflects changes immediately
              try {
                dispatch(
                  updateUser({
                    name: dataToUse.companyName,
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

  const autoSaveFormData = useCallback(async () => {
    try {
      // Only auto-save if not currently saving and not completing
      if (saving || completing) return;

      // Clean form data: remove empty arrays and undefined values for fields not in current or previous steps
      const currentStepConfig = ONBOARDING_STEPS.find(
        (s) => s.id === currentStep
      );
      const cleanedQuestions: Partial<OnboardingQuestions> = { ...formData };

      // Include fields from current step and all previous steps for auto-save
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

      // Only save if there are actual changes to save
      if (Object.keys(cleanedQuestions).length === 0) return;

      await onboardingService.updateOnboarding({
        questions: cleanedQuestions,
        status: "in_progress",
      });

      // Update local storage user data if company name changed
      if (formData.companyName) {
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.name !== formData.companyName) {
              user.name = formData.companyName;
              localStorage.setItem("user", JSON.stringify(user));
              dispatch(
                updateUser({
                  name: formData.companyName,
                })
              );
            }
          }
        } catch (e) {
          console.error("Error updating local user data:", e);
        }
      }

    } catch (error: any) {
      // Silently handle auto-save errors - don't show toasts for background saves
      console.error("Auto-save error (silent):", error);
    }
  }, [formData, currentStep, saving, completing, dispatch]);

  const validateStep = (stepId: number): boolean => {
    const stepConfig = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!stepConfig) {
      return true;
    }

    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Only validate fields that belong to this step
    stepConfig.fields.forEach((field) => {
      const value = formData[field as keyof OnboardingQuestions];
      const rules = FIELD_VALIDATION_RULES[field];
      const label = FIELD_LABELS[field] || field;

      // Special handling for website URL validation
      if (field === "website") {
        if (typeof value === "string" && value.trim() !== "") {
          let urlToValidate = value;
          // If no protocol, prepend https:// for validation
          if (!/^https?:\/\//i.test(value)) {
            urlToValidate = `https://${value}`;
          }

          try {
            const url = new URL(urlToValidate);
            // Ensure it has a hostname with at least one dot (e.g. google.com)
            if (!url.hostname.includes(".")) {
              newErrors[field] =
                "Website: Please provide a valid URL (e.g., google.com or https://google.com)";
              isValid = false;
            }
          } catch {
            newErrors[field] =
              "Website: Please provide a valid URL (e.g., google.com or https://google.com)";
            isValid = false;
          }
        } else if (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        ) {
          newErrors[field] = "Website: Required";
          isValid = false;
        }
      }
      // Special handling for array fields (coreOfferings, preferredCountries)
      else if (field === "coreOfferings" || field === "preferredCountries") {
        if (Array.isArray(value)) {
          if (value.length === 0) {
            newErrors[field] = `${label}: At least one selection required`;
            isValid = false;
          } else if (rules && field === "coreOfferings") {
            // Validate each item in array (only for coreOfferings, preferredCountries items are just country names)
            const invalidItems = value.filter(
              (item) =>
                typeof item === "string" &&
                (item.trim().length < rules.min ||
                  item.trim().length > rules.max)
            );
            if (invalidItems.length > 0) {
              newErrors[
                field
              ] = `Core Offerings: Each item must be ${rules.min}-${rules.max} characters`;
              isValid = false;
            }
          }
        } else {
          newErrors[field] = `${label}: At least one selection required`;
          isValid = false;
        }
      } else if (typeof value === "string") {
        const trimmed = value.trim();
        // Step 4 fields (differentiators) are optional, so don't require them
        // Address fields are optional/read-only from API
        const isOptionalField =
          (currentStep === 4 && field === "differentiators") ||
          ["address", "postalCode", "country"].includes(field);

        if (trimmed === "" && !isOptionalField) {
          newErrors[field] = `${label}: Required`;
          isValid = false;
        } else if (rules && trimmed !== "") {
          // Validate min/max if field has content (both required and optional fields)
          if (trimmed.length < rules.min) {
            newErrors[
              field
            ] = `${label}: Minimum ${rules.min} characters required`;
            isValid = false;
          } else if (trimmed.length > rules.max) {
            newErrors[
              field
            ] = `${label}: Maximum ${rules.max} characters allowed`;
            isValid = false;
          }
        }
      } else if (value === undefined || value === null) {
        // Step 4 fields are optional
        const isStep4Optional =
          currentStep === 4 && field === "differentiators";
        if (!isStep4Optional) {
          newErrors[field] = `${label}: Required`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);

    if (!isValid) {
      // Still show toast for general awareness or if inline isn't enough,
      // but user asked for inline. We can keep toast if we want, but maybe redundant.
      // User said "throws validation error", implying toast.
      // But also "shows the error just below the input field"
      // I'll keep the toast for now as a fallback or summary, OR remove it if it feels duplicated.
      // The code specifically said "toast.error(errors[0])".
      // The user COMPLAINED about the validation error text.
      // I will remove the toast for `website` if I show it inline.
      // Actually, standard pattern is to use inline errors. I'll rely on inline errors.
      if (Object.keys(newErrors).length > 0) {
        // Show toast notification for the first error
        const firstError = Object.values(newErrors)[0];
        if (firstError) {
          toast.error(firstError);
        }
      }
      return false;
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Create a copy of form data to potentially modify and save
    let dataToSave = { ...formData };
    let formUpdates: Partial<OnboardingQuestions> = {};

    // Normalize Website URL if needed (Step 1)
    if (
      currentStep === 1 &&
      typeof formData.website === "string" &&
      formData.website.trim() !== ""
    ) {
      const website = formData.website.trim();
      // If no protocol, prepend https://
      if (!/^https?:\/\//i.test(website)) {
        const normalizedWebsite = `https://${website}`;
        // Update both the data to save and the state
        dataToSave.website = normalizedWebsite;
        formUpdates.website = normalizedWebsite;
      }
    }

    const currentWebsite = dataToSave.website;

    // Check if website has changed to determine if we need to clear cached data
    if (currentStep === 1 && currentWebsite) {
      const normalizeUrl = (url: string | undefined) => {
        if (!url) return '';
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
      };

      const normalizedCurrent = normalizeUrl(currentWebsite);
      const normalizedPrevious = normalizeUrl(previousWebsiteRef.current);

      // If website changed and both have values, clear cached data
      if (normalizedCurrent && normalizedPrevious && normalizedCurrent !== normalizedPrevious) {
        clearWebsiteCache();

        // Clear company-related form fields since they're for the old website
        formUpdates.companyName = '';
        formUpdates.businessDescription = '';
        formUpdates.coreOfferings = [];
        formUpdates.idealCustomerProfile = '';
        formUpdates.address = '';
        formUpdates.postalCode = '';
        formUpdates.country = '';

        dataToSave.companyName = '';
        dataToSave.businessDescription = '';
        dataToSave.coreOfferings = [];
        dataToSave.idealCustomerProfile = '';
        dataToSave.address = '';
        dataToSave.postalCode = '';
        dataToSave.country = '';

        toast.info('Website changed - fetching new company information...');
      }

      // Update the previous website ref
      previousWebsiteRef.current = currentWebsite;
    }

    // If moving from step 1 to step 2, fetch company info from Apollo API
    // Check dataToSave instead of formData since we may have just cleared it above
    const hasExistingCompanyData =
      dataToSave.companyName &&
      dataToSave.companyName.trim() !== "" &&
      dataToSave.businessDescription &&
      dataToSave.businessDescription.trim() !== "";

    if (currentStep === 1 && currentWebsite && !hasExistingCompanyData) {
      try {
        setFetchingCompanyInfo(true);

        // Check cache first to avoid re-fetching
        const cachedApollo = getCachedApolloData(currentWebsite);
        let result;

        if (cachedApollo) {
          result = {
            success: true,
            data: {
              companyName: cachedApollo.companyName,
              description: cachedApollo.description,
              address: cachedApollo.address,
              postalCode: cachedApollo.postalCode,
              country: cachedApollo.country,
            },
          };
        } else {
          console.log(
            "[Onboarding] Fetching fresh Apollo data for",
            currentWebsite
          );
          result = await apolloService.lookupCompany(currentWebsite);

          // Cache the fetched data
          if (result.success && result.data) {
            updateOnboardingCache({
              apolloData: {
                website: currentWebsite,
                companyName: result.data.companyName,
                description: result.data.description,
                address: result.data.address,
                postalCode: result.data.postalCode,
                country: result.data.country,
                fetchedAt: Date.now(),
              },
            });
          }
        }

        if (result.success && result.data) {
          console.log("[Frontend Debug] Received Apollo Data:", result.data);
          // Auto-fill company name and description - always update when new data is fetched
          // Also clear core offerings and preferred countries for the new company

          if (result.data.companyName) {
            formUpdates.companyName = result.data.companyName;
            dataToSave.companyName = result.data.companyName;
          }

          if (result.data.description) {
            // Truncate description to max 1000 characters to match textarea maxLength
            // Ensure truncation happens at complete sentence boundaries
            const maxLength = 1000; // Match the maxLength in CompanyInfoStep textarea
            let truncatedDescription = result.data.description;

            if (result.data.description.length > maxLength) {
              // Find the last complete sentence within the character limit
              const text = result.data.description.substring(0, maxLength);

              // Look for sentence endings: period, exclamation, question mark followed by space or end
              const sentenceEndings = [". ", "! ", "? ", ".\n", "!\n", "?\n"];
              let lastSentenceEnd = -1;

              for (const ending of sentenceEndings) {
                const index = text.lastIndexOf(ending);
                if (index > lastSentenceEnd) {
                  lastSentenceEnd = index + ending.length - 1; // Include the punctuation
                }
              }

              // If we found a sentence ending, truncate there
              if (lastSentenceEnd > maxLength * 0.7) {
                // Only use if we're keeping at least 70% of max length
                truncatedDescription = result.data.description
                  .substring(0, lastSentenceEnd + 1)
                  .trim();
              } else {
                // Fallback: truncate at maxLength and add ellipsis
                truncatedDescription = text.trim() + "...";
              }
            }

            formUpdates.businessDescription = truncatedDescription;
            dataToSave.businessDescription = truncatedDescription;
            formUpdates.businessDescription = truncatedDescription;
            dataToSave.businessDescription = truncatedDescription;
          }

          if (result.data.address) {
            formUpdates.address = result.data.address;
            dataToSave.address = result.data.address;
          }

          if (result.data.postalCode) {
            formUpdates.postalCode = result.data.postalCode;
            dataToSave.postalCode = result.data.postalCode;
          }

          if (result.data.country) {
            formUpdates.country = result.data.country;
            dataToSave.country = result.data.country;
          }

          // Clear core offerings and preferred countries when fetching new company data
          // User will need to generate/select them again for the new company
          formUpdates.coreOfferings = [];
          formUpdates.preferredCountries = [];

          dataToSave.coreOfferings = [];
          dataToSave.preferredCountries = [];

          if (Object.keys(formUpdates).length > 0) {
            console.log("[Frontend Debug] Applying Form Updates:", formUpdates);
            toast.success(
              "Company information fetched successfully! Please generate core offerings and select countries for the new company."
            );
          }
        } else {
          // Don't show error if company not found - user can still fill manually
          console.log("Company info not found:", result.error);
        }
      } catch (error: any) {
        console.error("Error fetching company info:", error);
        // Don't block navigation if API fails - user can fill manually
      } finally {
        setFetchingCompanyInfo(false);
      }
    } else if (currentStep === 1 && hasExistingCompanyData) {
      console.log(
        "[Onboarding] Skipping Apollo API fetch - user already has company data"
      );
    }

    // Update form data before saving (to ensure immediate UI update)
    if (Object.keys(formUpdates).length > 0) {
      updateFormData(formUpdates);
    }

    // Save progress with the updated data
    const saved = await saveProgress("in_progress", dataToSave);
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
        // Don't clear sessionStorage cache - keep it so users can return and see their data
        // The cache will be naturally cleared on logout or browser close
        console.log(
          "[Onboarding] Onboarding completed, keeping cache for future edits"
        );

        // Set a flag to indicate onboarding was just completed
        // This prevents the ProtectedRoute from redirecting back to onboarding
        // before the backend status is fully synced
        sessionStorage.setItem("onboarding_just_completed", "true");

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

  const updateFormData = useCallback(
    (updates: Partial<OnboardingQuestions>) => {
      setFormData((prev) => {
        const newFormData = { ...prev, ...updates };

        // Update sessionStorage cache immediately with the new form data
        try {
          const cachedData = sessionStorage.getItem("onboarding_data");
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            parsedCache.formData = newFormData;
            sessionStorage.setItem(
              "onboarding_data",
              JSON.stringify(parsedCache)
            );
          }
        } catch (e) {
          console.error("[Onboarding] Error updating sessionStorage cache:", e);
        }

        return newFormData;
      });

      // Clear errors for fields that are being updated
      setErrors((prev) => {
        const newErrors = { ...prev };
        Object.keys(updates).forEach((key) => {
          delete newErrors[key];
        });
        return newErrors;
      });

      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (2 seconds after user stops typing)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveFormData();
      }, 2000);
    },
    [autoSaveFormData]
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyWebsiteStep
            formData={formData}
            updateFormData={updateFormData}
            onEnterPress={handleNext}
            error={errors.website}
          />
        );
      case 2:
        return (
          <CompanyInfoStep
            formData={formData}
            updateFormData={updateFormData}
            website={formData.website}
            errors={errors}
          />
        );
      case 3:
        return (
          <ICPStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
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
            errors={errors}
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
    <div className="h-screen w-screen bg-background flex overflow-hidden">
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
      <div className="w-full lg:w-2/3 flex flex-col h-screen overflow-hidden bg-background relative">
        {/* Top Section: Step Indicator (Static) */}
        <div className="w-full pt-12 pb-8 px-8 sm:px-12 lg:px-16 flex-none z-10 bg-background">
          <div className="max-w-4xl w-full mx-auto">
            <StepIndicator
              currentStep={currentStep}
              steps={ONBOARDING_STEPS}
            />
          </div>
        </div>

        {/* Flexible Middle Section: Content + Buttons */}
        <div className="flex-1 min-h-0 flex flex-col w-full px-8 sm:px-12 lg:px-16 pb-8">
          <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
            {/* Scrollable Form Area - Shrinks if needed, otherwise content height */}
            <div className="flex-shrink overflow-y-auto scrollbar-hide min-h-0 pr-2 -mr-2">
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
              <div className="space-y-6 pb-2">{renderStep()}</div>
            </div>

            {/* Navigation Buttons - Part of the flow but visible */}
            <div className="flex-none pt-6 mt-auto md:mt-4">
              <div className="flex items-center justify-between gap-4">
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
                      disabled={saving || completing || fetchingCompanyInfo}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 min-w-[120px]"
                    >
                      {saving || fetchingCompanyInfo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {fetchingCompanyInfo ? "Fetching..." : "Saving..."}
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
    </div>
  );
};

export default OnboardingPage;
