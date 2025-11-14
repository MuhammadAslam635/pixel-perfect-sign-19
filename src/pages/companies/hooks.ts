import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import CompaniesIcon from "@/components/icons/CompaniesIcon";
import LeadsIcon from "@/components/icons/LeadsIcon";
import OutreachIcon from "@/components/icons/OutreachIcon";
import ResponseIcon from "@/components/icons/ResponseIcon";
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

export const defaultStatsCards = [
  {
    title: "Total Companies",
    value: "0",
    icon: CompaniesIcon,
    link: "View All",
  },
  { title: "Total leads", value: "0", icon: LeadsIcon, link: "View All" },
  { title: "Total Outreach", value: "0", icon: OutreachIcon, link: "View All" },
  { title: "Total Response", value: "0", icon: ResponseIcon, link: "View All" },
];

const parseStatValue = (value: number | undefined, fallback: string) =>
  value === undefined ? fallback : value.toString();

export const buildStats = (
  totalCompanies?: number,
  totalLeads?: number,
  baseCards = defaultStatsCards
) => [
  {
    ...baseCards[0],
    value: parseStatValue(totalCompanies, baseCards[0].value),
  },
  {
    ...baseCards[1],
    value: parseStatValue(totalLeads, baseCards[1].value),
  },
  { ...baseCards[2] },
  { ...baseCards[3] },
];

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
