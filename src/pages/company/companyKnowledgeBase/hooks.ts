import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  companyKnowledgeService,
  CompanyKnowledgeFile,
  CompanyKnowledgeListParams,
  CompanyKnowledgeListResponse,
} from "@/services/companyKnowledge.service";
import {
  proposalExampleService,
  ProposalExample,
  ProposalExampleListParams,
  ProposalExampleListResponse,
} from "@/services/proposalExample.service";
import { OnboardingData } from "@/types/onboarding.types";
import { onboardingService } from "@/services/onboarding.service";

export type UseCompanyKnowledgeParams = CompanyKnowledgeListParams;

export const useCompanyKnowledgeData = (params: UseCompanyKnowledgeParams) => {
  const query = useQuery<CompanyKnowledgeListResponse, Error>({
    queryKey: ["company-knowledge", params],
    queryFn: () => companyKnowledgeService.listFiles(params),
    staleTime: 1000 * 60 * 2,
  });

  const files = useMemo<CompanyKnowledgeFile[]>(
    () => query.data?.data.files ?? [],
    [query.data?.data.files]
  );

  const pagination = query.data?.data.pagination;

  return {
    query,
    files,
    pagination,
  };
};

export type UseProposalExamplesParams = ProposalExampleListParams;

export const useProposalExamplesData = (params: UseProposalExamplesParams) => {
  const query = useQuery<ProposalExampleListResponse, Error>({
    queryKey: ["proposal-examples", params],
    queryFn: () => proposalExampleService.listExamples(params),
    staleTime: 1000 * 60 * 2,
  });

  const examples = useMemo<ProposalExample[]>(
    () => query.data?.data.examples ?? [],
    [query.data?.data.examples]
  );

  const pagination = query.data?.data.pagination;

  return {
    query,
    examples,
    pagination,
  };
};


export const useOnboardingData = () => {
  return useQuery<OnboardingData, Error>({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await onboardingService.getOnboarding();
      return res.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
};