import API from "@/utils/api";
import { onboardingService } from "./onboarding.service";
import { companyKnowledgeService } from "./companyKnowledge.service";
import { proposalExampleService } from "./proposalExample.service";

/**
 * Profile Completion Service
 * Checks the completion status of various onboarding tasks
 */

/**
 * Check if onboarding is complete
 * Returns true if onboarding status is "completed"
 */
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const response = await onboardingService.getOnboardingStatus();
    return response.data.status === "completed";
  } catch (error: any) {
    // If 404, onboarding doesn't exist - not complete
    if (error?.response?.status === 404) {
      return false;
    }
    console.error("[ProfileCompletion] Error checking onboarding:", error);
    // On error, return false to be safe
    return false;
  }
};

/**
 * Check if knowledge base has files uploaded
 * Returns true if at least one file exists
 */
export const checkKnowledgeBaseStatus = async (): Promise<boolean> => {
  try {
    const response = await companyKnowledgeService.listFiles({
      page: 1,
      limit: 1,
    });
    return response.data.files.length > 0;
  } catch (error: any) {
    console.error(
      "[ProfileCompletion] Error checking knowledge base:",
      error
    );
    return false;
  }
};

/**
 * Check if proposals have been uploaded
 * Returns true if at least one proposal exists
 */
export const checkProposalStatus = async (): Promise<boolean> => {
  try {
    const response = await proposalExampleService.listExamples({
      page: 1,
      limit: 1,
    });
    return response.data.examples.length > 0;
  } catch (error: any) {
    console.error("[ProfileCompletion] Error checking proposals:", error);
    return false;
  }
};

/**
 * Check if Microsoft account is connected
 * Returns true if Microsoft integration is active
 */
export const checkMicrosoftStatus = async (): Promise<boolean> => {
  try {
    const response = await API.get("/microsoft/connection-check");
    return response.data?.connected === true;
  } catch (error: any) {
    console.error("[ProfileCompletion] Error checking Microsoft:", error);
    return false;
  }
};

/**
 * Check if Facebook account is connected
 * Returns true if Facebook integration is active
 */
export const checkFacebookStatus = async (): Promise<boolean> => {
  try {
    const response = await API.get("/facebook/status");
    return response.data?.connected === true;
  } catch (error: any) {
    console.error("[ProfileCompletion] Error checking Facebook:", error);
    return false;
  }
};

/**
 * Check if Google account is connected
 * Returns true if Google integration is active
 */
export const checkGoogleStatus = async (): Promise<boolean> => {
  try {
    const response = await API.get("/integration/google");
    return response.data?.integration?.isConnected === true;
  } catch (error: any) {
    console.error("[ProfileCompletion] Error checking Google:", error);
    return false;
  }
};

/**
 * Check all task statuses at once
 * Returns a map of task IDs to their completion status
 */
export const checkAllTaskStatuses = async (): Promise<
  Record<string, boolean>
> => {
  try {
    const [
      onboardingComplete,
      knowledgeBaseComplete,
      proposalComplete,
      microsoftComplete,
      facebookComplete,
      googleComplete,
    ] = await Promise.allSettled([
      checkOnboardingStatus(),
      checkKnowledgeBaseStatus(),
      checkProposalStatus(),
      checkMicrosoftStatus(),
      checkFacebookStatus(),
      checkGoogleStatus(),
    ]);

    return {
      onboarding:
        onboardingComplete.status === "fulfilled"
          ? onboardingComplete.value
          : false,
      knowledge_base:
        knowledgeBaseComplete.status === "fulfilled"
          ? knowledgeBaseComplete.value
          : false,
      proposal:
        proposalComplete.status === "fulfilled"
          ? proposalComplete.value
          : false,
      microsoft:
        microsoftComplete.status === "fulfilled"
          ? microsoftComplete.value
          : false,
      facebook:
        facebookComplete.status === "fulfilled"
          ? facebookComplete.value
          : false,
      google:
        googleComplete.status === "fulfilled" ? googleComplete.value : false,
    };
  } catch (error) {
    console.error("[ProfileCompletion] Error checking all statuses:", error);
    // Return all false on error
    return {
      onboarding: false,
      knowledge_base: false,
      proposal: false,
      microsoft: false,
      facebook: false,
      google: false,
    };
  }
};
