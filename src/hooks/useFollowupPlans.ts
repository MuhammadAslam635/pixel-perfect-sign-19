import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateFollowupPlanPayload,
  CreateFollowupPlanFromCallPayload,
  UpdateFollowupPlanPayload,
  followupPlansService,
  FollowupPlansQueryParams,
  FollowupPlanScheduleResponse,
} from "@/services/followupPlans.service";

export const followupPlanKeys = {
  all: ["followup-plans"] as const,
  lists: () => [...followupPlanKeys.all, "list"] as const,
  list: (params: FollowupPlansQueryParams) =>
    [...followupPlanKeys.lists(), params] as const,
  details: () => [...followupPlanKeys.all, "detail"] as const,
  detail: (id: string) => [...followupPlanKeys.details(), id] as const,
};

export const useFollowupPlans = (params: FollowupPlansQueryParams = {}) => {
  return useQuery({
    queryKey: followupPlanKeys.list(params),
    queryFn: () => followupPlansService.getPlans(params),
  });
};

export const useFollowupPlan = (id: string) => {
  return useQuery({
    queryKey: followupPlanKeys.detail(id),
    queryFn: () => followupPlansService.getPlanById(id),
    enabled: !!id,
  });
};

export const useCreateFollowupPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFollowupPlanPayload) =>
      followupPlansService.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupPlanKeys.all });
    },
  });
};

export const useCreateFollowupPlanFromCall = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateFollowupPlanFromCallPayload) =>
      followupPlansService.createPlanFromCallSuggestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupPlanKeys.all });
    },
  });
};

export const useUpdateFollowupPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFollowupPlanPayload;
    }) => followupPlansService.updatePlan(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: followupPlanKeys.all });
      queryClient.invalidateQueries({
        queryKey: followupPlanKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: followupPlanScheduleKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteFollowupPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => followupPlansService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followupPlanKeys.all });
    },
  });
};

export const followupPlanScheduleKeys = {
  all: ["followup-plan-schedules"] as const,
  details: () => [...followupPlanScheduleKeys.all, "detail"] as const,
  detail: (id: string) => [...followupPlanScheduleKeys.details(), id] as const,
};

export const useFollowupPlanSchedule = (id: string) => {
  return useQuery({
    queryKey: followupPlanScheduleKeys.detail(id),
    queryFn: () => followupPlansService.getPlanSchedule(id),
    enabled: !!id,
  });
};

export const followupPlanStatsKeys = {
  all: ["followup-plan-stats"] as const,
};

export const useFollowupPlanStats = () => {
  return useQuery({
    queryKey: followupPlanStatsKeys.all,
    queryFn: () => followupPlansService.getPlanStats(),
  });
};
