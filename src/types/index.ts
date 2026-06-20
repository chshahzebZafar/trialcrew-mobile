/**
 * Domain types for TrialCrew mobile.
 *
 * Mirror of the shared `@trialcrew/types` package (which will be the source of
 * truth once the backend exists). For now these are the local contract that the
 * mock API and the screens agree on. Keep field names aligned with the Prisma
 * schema in the build guide so the swap to the real API is mechanical.
 */

/** A person can hold both roles and toggle the active one. */
export type Role = "TESTER" | "FOUNDER";

export type BadgeTier = "NONE" | "VERIFIED" | "SENIOR" | "EXPERT";

export type CampaignStatus =
  | "DRAFT"
  | "MATCHING"
  | "UPLOADED"
  | "ACTIVE"
  | "COMPLETE";

export type CycleStatus =
  | "MATCHED"
  | "INVITED"
  | "INSTALLED"
  | "ACTIVE"
  | "COMPLETED"
  | "DROPPED";

export type RewardType = "PREMIUM_ACCESS" | "CREDITS" | "STIPEND";

export type CheckInStatus = "PENDING" | "SENT" | "RESPONDED" | "MISSED";

/** The four scheduled check-in offsets, in days from opt-in. */
export const CHECKIN_DAYS = [3, 7, 10, 14] as const;
export type CheckInDay = (typeof CHECKIN_DAYS)[number];

/** Badge thresholds by completed cycles. */
export const BADGE_THRESHOLDS: Record<Exclude<BadgeTier, "NONE">, number> = {
  VERIFIED: 5,
  SENIOR: 20,
  EXPERT: 50,
};

/** A campaign a tester can be matched into. */
export interface Campaign {
  id: string;
  appName: string;
  packageName: string;
  vertical: string;
  feedbackFocus: string;
  description?: string;
  testersNeeded: number;
  testersMatched: number;
  rewardType: RewardType;
  playStoreUrl?: string;
}

export interface CheckIn {
  id: string;
  dayNumber: CheckInDay;
  scheduledFor: string; // ISO
  status: CheckInStatus;
  response?: string;
  respondedAt?: string; // ISO
}

/** Daily proof-of-use confirmation (one per day of the 14-day test). */
export interface DailyCheckIn {
  day: number; // 1–14
  doneAt?: string; // ISO — set when the tester confirms they used the app that day
}

export interface InstallProof {
  id: string;
  screenshotUrl: string;
  verified: boolean;
  uploadedAt: string; // ISO
}

/** A fixed feedback question. */
export interface FeedbackQuestion {
  id: string;
  prompt: string;
  type: "rating" | "text" | "boolean";
}

export interface Feedback {
  answers: Record<string, string | number | boolean>;
  submittedAt: string; // ISO
}

/**
 * Cycle = one tester × one campaign. The atomic unit.
 * Has its OWN optInAt + completesAt (14-day) clock — never a batch clock.
 */
export interface Cycle {
  id: string;
  campaign: Campaign;
  status: CycleStatus;
  gmailForCampaign: string;
  optInAt?: string; // ISO — set on opt-in
  completesAt?: string; // ISO — optInAt + 14d
  completedAt?: string; // ISO
  founderRating?: number; // 1–5
  rewardClaimed?: boolean; // entitlement granted on claim
  checkIns: CheckIn[];
  dailyCheckIns: DailyCheckIn[]; // 14 daily proof-of-use slots (once ACTIVE)
  proof?: InstallProof;
  feedback?: Feedback;
}

// ─── Founder side ───────────────────────────────────────────────────────────

/** DRAFT → ENROLLING (published, collecting testers) → INVITED (cohort full, 14-day
 *  test running) → COMPLETE. */
export type FounderAppStatus = "DRAFT" | "ENROLLING" | "INVITED" | "COMPLETE";

/** An app the founder has submitted for testing. */
export interface FounderApp {
  id: string;
  name: string;
  packageName: string;
  vertical: string;
  description?: string;
  feedbackFocus: string;
  playStoreUrl?: string;
  status: FounderAppStatus;
  rewardType: RewardType; // what testers earn on completion
  minTesters: number; // founder-chosen target (12 / 16 / 20)
  enrolledCount: number;
  feedbackCount: number;
  startDate?: string; // ISO — founder-chosen test start
  publishedAt?: string; // ISO
  createdAt: string; // ISO
}

/** A founder broadcast to the testing cohort (keyed by packageName). */
export interface Broadcast {
  id: string;
  packageName: string;
  message: string;
  sentAt: string; // ISO
}

export type EnrollmentStatus = "ENROLLED" | "TESTING" | "COMPLETED" | "DROPPED";

/** One tester enrolled into an app (founder-facing). */
export interface Enrollment {
  id: string;
  appId: string;
  testerName: string;
  gmail: string;
  badgeTier: BadgeTier;
  reliabilityScore: number;
  enrolledAt: string; // ISO
  dailyDone: number; // 0–14 daily proof-of-use confirmations
  status: EnrollmentStatus;
  feedbackSubmitted: boolean;
  rated: boolean;
}

/** A tester running a cycle on one of the founder's apps (founder-facing view). */
export interface FounderTesterRow {
  id: string;
  testerName: string;
  appName: string;
  vertical: string;
  status: CycleStatus;
  dayProgress: number; // 0–14
  reliabilityScore: number;
  badgeTier: BadgeTier;
  rated: boolean;
}

export interface FounderStats {
  appsSubmitted: number;
  activeCampaigns: number;
  testersEngaged: number;
  avgRating: number;
  feedbackReceived: number;
}

/** Input for submitting a new app (lands as a DRAFT). */
export interface SubmitAppInput {
  name: string;
  packageName: string;
  vertical: string;
  feedbackFocus: string;
  description?: string;
  playStoreUrl?: string;
  rewardType: RewardType;
}

/** Input for publishing a DRAFT app to testers. */
export interface PublishInput {
  minTesters: number; // 12 | 16 | 20
  startDate: string; // ISO
}

/** The signed-in tester's profile. */
export interface TesterProfile {
  id: string;
  name: string;
  email: string;
  vertical: string;
  categories: string[];
  verified: boolean;
  bio?: string;
  reliabilityScore: number; // completed ÷ accepted
  acceptedCycles: number;
  completedCycles: number;
  badgeTier: BadgeTier;
  premiumUntil?: string; // ISO — granted by a claimed PREMIUM_ACCESS reward
  credits: number; // granted by claimed CREDITS rewards
  stipendPending: number; // granted by claimed STIPEND rewards (awaiting payout)
  publicSlug: string; // portfolio link
}

export type NotificationKind = "MATCH" | "BROADCAST" | "REMINDER" | "REWARD" | "SYSTEM";

/** An in-app notification (drives the topbar bell + notifications screen). */
export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
}

/** A thread reply on a founder broadcast (either side can post). */
export interface BroadcastReply {
  id: string;
  broadcastId: string;
  authorName: string;
  authorRole: Role;
  message: string;
  sentAt: string; // ISO
}
