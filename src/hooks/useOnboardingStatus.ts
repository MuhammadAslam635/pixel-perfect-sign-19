import { useState, useEffect } from "react";
import { onboardingService } from "@/services/onboarding.service";
import { OnboardingStatus } from "@/types/onboarding.types";

interface UseOnboardingStatusResult {
  status: OnboardingStatus | "not_started" | null;
  loading: boolean;
  error: string | null;
  requiresOnboarding: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to check onboarding status for the current user
 * Used by ProtectedRoute to redirect new users to onboarding
 */
export const useOnboardingStatus = (
  userRole: string | undefined,
  enabled: boolean = true
): UseOnboardingStatusResult => {
  const [status, setStatus] = useState<OnboardingStatus | "not_started" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only check for Company and CompanyAdmin roles
  const shouldCheck = enabled && (userRole === "Company" || userRole === "CompanyAdmin");

  // Check if user has skipped onboarding this session
  const hasSkippedThisSession = sessionStorage.getItem('onboarding_skipped') === 'true';

  const fetchStatus = async () => {
    // If user has skipped this session, don't redirect them back
    if (hasSkippedThisSession) {
      setLoading(false);
      setStatus(null);
      return;
    }

    if (!shouldCheck) {
      setLoading(false);
      setStatus(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await onboardingService.getOnboardingStatus();
      if (response.success) {
        setStatus(response.data.status);
      }
    } catch (err: any) {
      // 404 means no onboarding exists yet - but don't require it if API fails
      if (err?.response?.status === 404) {
        // Only require onboarding if explicitly not started
        // If API fails for other reasons, don't block user
        setStatus("not_started");
      } else {
        console.error("Error fetching onboarding status:", err);
        setError(err?.response?.data?.message || "Failed to check onboarding status");
        // Don't block navigation on error - set status to null to skip redirect
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [shouldCheck, hasSkippedThisSession]);

  // Requires onboarding if status is not completed
  // Redirect for: "not_started", "draft", or "in_progress"
  // Only allow access to dashboard when status is "completed", "approved", or "rejected"
  const requiresOnboarding = shouldCheck && 
    !hasSkippedThisSession && 
    (status === "not_started" || status === "draft" || status === "in_progress");

  return {
    status,
    loading,
    error,
    requiresOnboarding,
    refetch: fetchStatus,
  };
};

