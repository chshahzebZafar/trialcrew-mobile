/**
 * Real HTTP client — implements the same `Api` shape as the mock, backed by the
 * Fastify backend (../backend). Selected by `client.ts` when EXPO_PUBLIC_USE_BACKEND
 * is "true". Route paths match backend/src/routes.ts.
 */
import { http, ApiError } from "./config";
import type { Api } from "./client";
import type {
  AppNotification,
  Broadcast,
  BroadcastReply,
  Campaign,
  Cycle,
  Enrollment,
  FeedbackQuestion,
  FounderApp,
  FounderStats,
  FounderTesterRow,
  TesterProfile,
} from "@/types";

/** Map a 404 to null to match the mock contract (getCycle/App/Enrollment). */
async function orNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const realApi: Api = {
  // ── Tester ──
  getProfile: () => http<TesterProfile>("/me/profile"),
  updateProfile: (input) => http<TesterProfile>("/me/profile", { method: "PATCH", json: input }),
  getFeedbackQuestions: () => http<FeedbackQuestion[]>("/feedback/questions"),
  setPushToken: (token) => http<{ ok: true }>("/me/push-token", { json: { token } }),
  setRole: (isFounder, isProfessional) => http<{ ok: true }>("/me/role", { json: { isFounder, isProfessional } }),
  getNotifications: () => http<AppNotification[]>("/me/notifications"),
  markNotificationsRead: () => http<AppNotification[]>("/me/notifications/read", { method: "POST" }),
  getBrowseCampaigns: () => http<Campaign[]>("/campaigns/matched"),
  getCycles: () => http<Cycle[]>("/me/cycles"),
  getCycle: (id) => orNull(http<Cycle>(`/cycles/${id}`)),
  optIn: (campaignId) => http<Cycle>(`/campaigns/${campaignId}/opt-in`, { method: "POST" }),
  submitProof: (cycleId, screenshotUrl) => http<Cycle>(`/cycles/${cycleId}/proof`, { json: { screenshotUrl } }),
  respondCheckIn: (cycleId, day, response) => http<Cycle>(`/cycles/${cycleId}/checkins/${day}`, { json: { response } }),
  dailyCheckIn: (cycleId) => http<Cycle>(`/cycles/${cycleId}/daily-checkin`, { method: "POST" }),
  updateCycleEmail: (cycleId, gmail) => http<Cycle>(`/cycles/${cycleId}/email`, { method: "PATCH", json: { gmail } }),
  submitFeedback: (cycleId, answers) => http<Cycle>(`/cycles/${cycleId}/feedback`, { json: { answers } }),
  claimReward: (cycleId) => http<Cycle>(`/cycles/${cycleId}/claim-reward`, { method: "POST" }),

  // ── Founder ──
  getFounderApps: () => http<FounderApp[]>("/me/apps"),
  getFounderApp: (id) => orNull(http<FounderApp>(`/apps/${id}`)),
  getFounderTesters: () => http<FounderTesterRow[]>("/me/testers"),
  getFounderStats: () => http<FounderStats>("/me/founder-stats"),
  getEnrollments: (appId) => http<Enrollment[]>(`/apps/${appId}/enrollments`),
  getEnrollment: (id) => orNull(http<Enrollment>(`/enrollments/${id}`)),
  submitApp: (input) => http<FounderApp>("/apps", { json: input }),
  publishApp: (id, input) => http<FounderApp>(`/apps/${id}/publish`, { json: input }),
  exportEmails: (appId) => http<string[]>(`/apps/${appId}/emails`),
  markInvited: (id) => http<FounderApp>(`/apps/${id}/invited`, { method: "POST" }),
  rateTester: (rowId) => http<FounderTesterRow>(`/testers/${rowId}/rate`, { method: "POST" }),
  rateEnrollment: (id) => http<Enrollment>(`/enrollments/${id}/rate`, { method: "POST" }),

  // ── Broadcasts ──
  getBroadcasts: (packageName) => http<Broadcast[]>(`/broadcasts?packageName=${encodeURIComponent(packageName)}`),
  sendBroadcast: (packageName, message) => http<Broadcast>("/broadcasts", { json: { packageName, message } }),
  getReplies: (broadcastId) => http<BroadcastReply[]>(`/broadcasts/${broadcastId}/replies`),
  postReply: (broadcastId, authorName, authorRole, message) =>
    http<BroadcastReply>(`/broadcasts/${broadcastId}/replies`, { json: { authorName, authorRole, message } }),
};
