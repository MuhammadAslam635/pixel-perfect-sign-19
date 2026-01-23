import { useQuery } from "@tanstack/react-query";
import {
  companiesService,
  CompaniesQueryParams,
  Company,
} from "@/services/companies.service";
import {
  leadsService,
  LeadsQueryParams,
  Lead,
} from "@/services/leads.service";
import {
  dashboardService,
  CompanyCrmStats,
  CrmStats,
} from "@/services/dashboard.service";

export interface LeadsPageData {
  companiesForFilter: Company[];
  leads: Lead[];
  leadsPagination: {
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  companyStats: CompanyCrmStats | undefined;
  crmStats: CrmStats | undefined;
}

export const useLeadsPageData = (
  leadsParams: LeadsQueryParams,
  statsFilters: CompaniesQueryParams,
) => {
  return useQuery({
    queryKey: ["leads-page-unified", leadsParams, statsFilters],
    queryFn: async (): Promise<LeadsPageData> => {
      // Execute all requests in parallel
      const [
        companiesResponse,
        leadsResponse,
        companyStatsResponse,
        crmStatsResponse,
      ] = await Promise.all([
        companiesService.getCompanies({ page: 1, limit: 500 }),
        leadsService.getLeads(leadsParams), // Use actual pagination params
        dashboardService.getCompanyCrmStats(statsFilters),
        dashboardService.getCrmStats(),
      ]);

      return {
        companiesForFilter: companiesResponse.data.docs,
        leads: leadsResponse.data,
        leadsPagination: leadsResponse.pagination,
        companyStats: companyStatsResponse.data,
        crmStats: crmStatsResponse.data,
      };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export interface CompaniesPageData {
  companies: Company[];
  companiesPagination: {
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
  companyStats: CompanyCrmStats | undefined;
  crmStats: CrmStats | undefined;
  totalCompaniesCount: number; // for simple stats fallback
  allCompaniesForFilters: Company[]; // for industry dropdown
}

export const useCompaniesPageData = (
  companiesParams: CompaniesQueryParams
) => {
  return useQuery({
    queryKey: ["companies-page-unified", companiesParams],
    queryFn: async (): Promise<CompaniesPageData> => {
      const [
        companiesResponse,
        companyStatsResponse,
        crmStatsResponse,
        totalCompaniesResponse,
        allCompaniesResponse,
      ] = await Promise.all([
        companiesService.getCompanies(companiesParams),
        dashboardService.getCompanyCrmStats(companiesParams),
        dashboardService.getCrmStats(),
        companiesService.getCompanies({ page: 1, limit: 1 }),
        companiesService.getCompanies({ page: 1, limit: 1000 }),
      ]);

      return {
        companies: companiesResponse.data.docs,
        companiesPagination: companiesResponse.data, // assuming paginated response has these fields at root or we need to access them
        companyStats: companyStatsResponse.data,
        crmStats: crmStatsResponse.data,
        totalCompaniesCount: totalCompaniesResponse.data.totalDocs,
        allCompaniesForFilters: allCompaniesResponse.data.docs,
      };
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
