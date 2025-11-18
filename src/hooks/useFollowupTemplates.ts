import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  followupTemplatesService,
  FollowupTemplatePayload,
  FollowupTemplatesQueryParams,
} from "@/services/followupTemplates.service";

export const followupTemplateKeys = {
  all: ["followup-templates"] as const,
  lists: () => [...followupTemplateKeys.all, "list"] as const,
  list: (params: FollowupTemplatesQueryParams) =>
    [...followupTemplateKeys.lists(), params] as const,
  details: () => [...followupTemplateKeys.all, "detail"] as const,
  detail: (id: string) => [...followupTemplateKeys.details(), id] as const,
};

export const useFollowupTemplates = (
  params: FollowupTemplatesQueryParams = {}
) => {
  return useQuery({
    queryKey: followupTemplateKeys.list(params),
    queryFn: () => followupTemplatesService.getTemplates(params),
    keepPreviousData: true,
  });
};

export const useFollowupTemplate = (id: string) => {
  return useQuery({
    queryKey: followupTemplateKeys.detail(id),
    queryFn: () => followupTemplatesService.getTemplateById(id),
    enabled: !!id,
  });
};

export const useCreateFollowupTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FollowupTemplatePayload) =>
      followupTemplatesService.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupTemplateKeys.all });
    },
  });
};

export const useUpdateFollowupTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<FollowupTemplatePayload>;
    }) => followupTemplatesService.updateTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupTemplateKeys.all });
    },
  });
};

export const useDeleteFollowupTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => followupTemplatesService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupTemplateKeys.all });
    },
  });
};

export const useDuplicateFollowupTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      followupTemplatesService.duplicateTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupTemplateKeys.all });
    },
  });
};

