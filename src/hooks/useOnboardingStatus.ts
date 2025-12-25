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

  // Check if user has skipped onboarding in this session
  // This allows skipping in current session, but will be cleared on next login
  const hasSkippedThisSession = sessionStorage.getItem('onboarding_skipped') === 'true';
  
  // Check if user just completed onboarding
  // This prevents race condition where ProtectedRoute checks status before backend updates
  const justCompletedOnboarding = sessionStorage.getItem('onboarding_just_completed') === 'true';

  const fetchStatus = async () => {
    if (!shouldCheck) {
      setLoading(false);
      setStatus(null);
      return;
    }

    // If user skipped in this session, allow them to continue
    // But on next login, sessionStorage will be cleared and they'll be redirected
    if (hasSkippedThisSession) {
      setLoading(false);
      setStatus(null);
      return;
    }
    
    // If user just completed onboarding, skip the check to prevent race condition
    if (justCompletedOnboarding) {
      setLoading(false);
      setStatus("completed");
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
      // 404 means no onboarding exists yet - require onboarding
      if (err?.response?.status === 404) {
        setStatus("not_started");
      } else {
        console.error("Error fetching onboarding status:", err);
        setError(err?.response?.data?.message || "Failed to check onboarding status");
        // On error, don't block user - set status to null to skip redirect
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [shouldCheck, hasSkippedThisSession, justCompletedOnboarding]);

  // Requires onboarding if status is not completed
  // BUT: Allow skipping in current session (hasSkippedThisSession)
  // OR: Allow if user just completed onboarding (justCompletedOnboarding)
  // On next login, sessionStorage will be cleared and they'll be redirected
  const requiresOnboarding = shouldCheck && 
    !hasSkippedThisSession &&
    !justCompletedOnboarding &&
    (status === "not_started" || status === "draft" || status === "in_progress");

  return {
    status,
    loading,
    error,
    requiresOnboarding,
    refetch: fetchStatus,
  };
};

