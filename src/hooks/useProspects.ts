import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService, type ClientsQueryParams } from '@/services/prospects.service';

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params: ClientsQueryParams) => [...clientKeys.lists(), params] as const,
  prospects: (params: ClientsQueryParams) => [...clientKeys.all, 'prospects', params] as const,
  customerSupport: (params: ClientsQueryParams) => [...clientKeys.all, 'customerSupport', params] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
};

export const useClients = (params: ClientsQueryParams = {}) => {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientsService.getClients(params),
  });
};

export const useProspects = (params: ClientsQueryParams = {}) => {
  return useQuery({
    queryKey: clientKeys.prospects(params),
    queryFn: () => clientsService.getProspects(params),
  });
};

export const useCustomerSupportQueries = (params: ClientsQueryParams = {}) => {
  return useQuery({
    queryKey: clientKeys.customerSupport(params),
    queryFn: () => clientsService.getCustomerSupportQueries(params),
  });
};

export const useClient = (id: string) => {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsService.getClientById(id),
    enabled: !!id,
  });
};

export const useSyncFromAirtableTable = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableName = 'AgentLogs', maxRecords }: { tableName?: string; maxRecords?: number } = {}) =>
      clientsService.syncFromAirtableTable(tableName, maxRecords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
};


