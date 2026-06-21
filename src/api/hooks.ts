/**
 * TanStack Query hooks — the only data API screens use.
 *
 * Query keys are centralized so mutations can invalidate precisely. The transport
 * (api) is swappable from mock → real Fastify without touching these signatures.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./client";
import type { CheckInDay, Feedback, PublishInput, Role, SubmitAppInput } from "@/types";

export const qk = {
  profile: ["profile"] as const,
  notifications: ["notifications"] as const,
  feedbackQuestions: ["feedbackQuestions"] as const,
  browse: ["browse"] as const,
  cycles: ["cycles"] as const,
  cycle: (id: string) => ["cycle", id] as const,
  founderApps: ["founderApps"] as const,
  founderApp: (id: string) => ["founderApp", id] as const,
  founderTesters: ["founderTesters"] as const,
  founderStats: ["founderStats"] as const,
  enrollments: (appId: string) => ["enrollments", appId] as const,
  enrollment: (id: string) => ["enrollment", id] as const,
  broadcasts: (pkg: string) => ["broadcasts", pkg] as const,
  replies: (broadcastId: string) => ["replies", broadcastId] as const,
};

export function useProfile() {
  return useQuery({ queryKey: qk.profile, queryFn: api.getProfile });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; vertical?: string; categories?: string[]; bio?: string }) => api.updateProfile(input),
    onSuccess: (p) => {
      qc.setQueryData(qk.profile, p);
      qc.invalidateQueries({ queryKey: qk.browse }); // interests affect app matching
    },
  });
}

export function useNotifications() {
  return useQuery({ queryKey: qk.notifications, queryFn: api.getNotifications });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}

export function useFeedbackQuestions() {
  return useQuery({
    queryKey: qk.feedbackQuestions,
    queryFn: api.getFeedbackQuestions,
    staleTime: Infinity,
  });
}

export function useBrowseCampaigns() {
  return useQuery({ queryKey: qk.browse, queryFn: api.getBrowseCampaigns });
}

export function useCycles() {
  return useQuery({ queryKey: qk.cycles, queryFn: api.getCycles });
}

export function useCycle(id: string) {
  return useQuery({
    queryKey: qk.cycle(id),
    queryFn: () => api.getCycle(id),
    enabled: !!id,
  });
}

/** Invalidate everything a cycle mutation can affect. */
function useCycleInvalidation() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: qk.cycles });
    qc.invalidateQueries({ queryKey: qk.browse });
    qc.invalidateQueries({ queryKey: qk.profile });
    if (id) qc.invalidateQueries({ queryKey: qk.cycle(id) });
  };
}

export function useOptIn() {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: (campaignId: string) => api.optIn(campaignId),
    onSuccess: (cycle) => invalidate(cycle.id),
  });
}

export function useSubmitProof(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: (screenshotUrl: string) =>
      api.submitProof(cycleId, screenshotUrl),
    onSuccess: () => invalidate(cycleId),
  });
}

export function useDailyCheckIn(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: () => api.dailyCheckIn(cycleId),
    onSuccess: () => invalidate(cycleId),
  });
}

export function useUpdateCycleEmail(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: (gmail: string) => api.updateCycleEmail(cycleId, gmail),
    onSuccess: () => invalidate(cycleId),
  });
}

export function useRespondCheckIn(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: (vars: { day: CheckInDay; response: string }) =>
      api.respondCheckIn(cycleId, vars.day, vars.response),
    onSuccess: () => invalidate(cycleId),
  });
}

export function useSubmitFeedback(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: (answers: Feedback["answers"]) =>
      api.submitFeedback(cycleId, answers),
    onSuccess: () => invalidate(cycleId),
  });
}

export function useClaimReward(cycleId: string) {
  const invalidate = useCycleInvalidation();
  return useMutation({
    mutationFn: () => api.claimReward(cycleId),
    onSuccess: () => invalidate(cycleId),
  });
}

// ─── Founder hooks ────────────────────────────────────────────────────────────

export function useFounderApps() {
  return useQuery({ queryKey: qk.founderApps, queryFn: api.getFounderApps });
}

export function useFounderApp(id: string) {
  return useQuery({
    queryKey: qk.founderApp(id),
    queryFn: () => api.getFounderApp(id),
    enabled: !!id,
  });
}

export function useFounderTesters() {
  return useQuery({ queryKey: qk.founderTesters, queryFn: api.getFounderTesters });
}

export function useFounderStats() {
  return useQuery({ queryKey: qk.founderStats, queryFn: api.getFounderStats });
}

export function useEnrollments(appId: string) {
  return useQuery({
    queryKey: qk.enrollments(appId),
    queryFn: () => api.getEnrollments(appId),
    enabled: !!appId,
  });
}

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: qk.enrollment(id),
    queryFn: () => api.getEnrollment(id),
    enabled: !!id,
  });
}

export function useSubmitApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitAppInput) => api.submitApp(input),
    meta: { localError: true }, // shows an inline error on the form instead of the global alert
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.founderApps });
      qc.invalidateQueries({ queryKey: qk.founderStats });
    },
  });
}

function useFounderAppInvalidation() {
  const qc = useQueryClient();
  return (id: string) => {
    qc.invalidateQueries({ queryKey: qk.founderApps });
    qc.invalidateQueries({ queryKey: qk.founderApp(id) });
    qc.invalidateQueries({ queryKey: qk.founderStats });
  };
}

export function usePublishApp(id: string) {
  const invalidate = useFounderAppInvalidation();
  return useMutation({
    mutationFn: (input: PublishInput) => api.publishApp(id, input),
    onSuccess: () => invalidate(id),
  });
}

export function useMarkInvited(id: string) {
  const invalidate = useFounderAppInvalidation();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.markInvited(id),
    onSuccess: () => {
      invalidate(id);
      qc.invalidateQueries({ queryKey: qk.enrollments(id) });
    },
  });
}

export function useExportEmails(appId: string) {
  return useMutation({ mutationFn: () => api.exportEmails(appId) });
}

export function useRateTester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) => api.rateTester(rowId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.founderTesters }),
  });
}

export function useRateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rateEnrollment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollment"] }),
  });
}

export function useBroadcasts(packageName: string) {
  return useQuery({
    queryKey: qk.broadcasts(packageName),
    queryFn: () => api.getBroadcasts(packageName),
    enabled: !!packageName,
  });
}

export function useSendBroadcast(packageName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => api.sendBroadcast(packageName, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.broadcasts(packageName) }),
  });
}

export function useBroadcastReplies(broadcastId: string) {
  return useQuery({
    queryKey: qk.replies(broadcastId),
    queryFn: () => api.getReplies(broadcastId),
    enabled: !!broadcastId,
  });
}

export function usePostReply(broadcastId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { authorName: string; authorRole: Role; message: string }) =>
      api.postReply(broadcastId, vars.authorName, vars.authorRole, vars.message),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.replies(broadcastId) }),
  });
}
