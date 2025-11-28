import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateFollowupPlanPayload,
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
    keepPreviousData: true,
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

