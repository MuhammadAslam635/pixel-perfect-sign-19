import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  companiesService,
  Company,
  CompaniesQueryParams,
  CompaniesResponse,
} from "@/services/companies.service";
import {
  Lead,
  leadsService,
  LeadsResponse,
  LeadsQueryParams,
} from "@/services/leads.service";

export const useCompaniesData = (params: CompaniesQueryParams) => {
  const query = useQuery<CompaniesResponse, Error>({
    queryKey: ["companies", params],
    queryFn: () => companiesService.getCompanies(params),
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const companies = useMemo<Company[]>(
    () => query.data?.data.docs ?? [],
    [query.data?.data.docs]
  );

  const totalCompanies = query.data?.data.totalDocs ?? undefined;

  return {
    query,
    companies,
    totalCompanies,
  };
};

export const useLeadsData = (
  params: LeadsQueryParams = {},
  options: { enabled: boolean } = { enabled: true }
) => {
  const query = useQuery<LeadsResponse, Error>({
    queryKey: ["leads", params],
    queryFn: () => leadsService.getLeads(params),
    enabled: options.enabled,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const leads = useMemo<Lead[]>(
    () => query.data?.data ?? [],
    [query.data?.data]
  );

  const totalLeads = query.data?.pagination?.totalDocs ?? query.data?.data.length ?? undefined;
  const pagination = query.data?.pagination;

  return {
    query,
    leads,
    totalLeads,
    pagination,
  };
};
