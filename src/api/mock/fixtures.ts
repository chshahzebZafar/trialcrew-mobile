/**
 * Mock fixtures — the current data source.
 *
 * Construction vertical, matching the seed described in the build guide. These are
 * mutated in-memory by the mock client to simulate opt-in / proof / check-in /
 * feedback so the flows feel real without a backend.
 */
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

export const feedbackQuestions: FeedbackQuestion[] = [
  { id: "first_impression", prompt: "What was your first impression on launch?", type: "text" },
  { id: "ease_of_use", prompt: "How easy was the app to use?", type: "rating" },
  { id: "crashes", prompt: "Did you hit any crashes or broken screens?", type: "boolean" },
  { id: "fit_for_vertical", prompt: "How well does it fit real field-services work?", type: "rating" },
  { id: "biggest_gap", prompt: "What is the single biggest gap or missing feature?", type: "text" },
  { id: "would_recommend", prompt: "Would you recommend it to a peer?", type: "boolean" },
];

// ─── Founder side fixtures ───────────────────────────────────────────────────

export const founderApps: FounderApp[] = [
  {
    id: "fapp_sitesync",
    name: "SiteSync",
    packageName: "com.sitesync.app",
    vertical: "Construction",
    feedbackFocus: "Daily logs & crew check-in flow",
    description: "Field logging app for construction crews.",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.sitesync.app",
    status: "INVITED", // cohort full — 14-day test running
    rewardType: "PREMIUM_ACCESS",
    minTesters: 16,
    enrolledCount: 16,
    feedbackCount: 7,
    createdAt: "",
  },
  {
    id: "fapp_loadcalc",
    name: "LoadCalc Pro",
    packageName: "com.loadcalc.app",
    vertical: "Construction",
    feedbackFocus: "Structural load calculator accuracy",
    description: "Beam & load calculations for site engineers.",
    status: "ENROLLING", // published, collecting testers
    rewardType: "CREDITS",
    minTesters: 16,
    enrolledCount: 9,
    feedbackCount: 0,
    createdAt: "",
  },
  {
    id: "fapp_sortsite",
    name: "SortSite",
    packageName: "com.sortsite.app",
    vertical: "Field services",
    feedbackFocus: "Waste sorting & disposal tracking",
    description: "Track skips, waste streams and disposal compliance.",
    status: "DRAFT", // not yet published
    rewardType: "PREMIUM_ACCESS",
    minTesters: 16,
    enrolledCount: 0,
    feedbackCount: 0,
    createdAt: "",
  },
];

/** Founder broadcasts to the cohort, keyed by packageName. */
export const broadcasts: Broadcast[] = [
  {
    id: "bc_1",
    packageName: "com.sitesync.app",
    message: "New build pushed (v0.9.2) — fixes the crash on the daily-log save. Please update from Play before your next check-in.",
    sentAt: "",
  },
  {
    id: "bc_2",
    packageName: "com.sitesync.app",
    message: "Thanks for the great feedback so far! Focus this week: try the crew check-in flow with 3+ people.",
    sentAt: "",
  },
];

/** Seed in-app notifications (newest first). createdAt filled at hydrate. */
export const notifications: AppNotification[] = [
  { id: "n_1", kind: "MATCH", title: "New match in your field", body: "PunchList Pro is looking for testers like you.", createdAt: "", read: false },
  { id: "n_2", kind: "BROADCAST", title: "SiteSync · team update", body: "New build pushed (v0.9.2) — please update before your next check-in.", createdAt: "", read: false },
  { id: "n_3", kind: "REMINDER", title: "Daily check-in due", body: "Open SiteSync and confirm today's check-in to keep your streak.", createdAt: "", read: false },
  { id: "n_4", kind: "REWARD", title: "Reward unlocked", body: "You completed QuickEstimate — claim your reward.", createdAt: "", read: true },
  { id: "n_5", kind: "SYSTEM", title: "Welcome to TrialCrew", body: "Test real apps in your field and build a verified reputation.", createdAt: "", read: true },
];

/** Seed replies on broadcasts (two-way thread). */
export const broadcastReplies: BroadcastReply[] = [
  {
    id: "br_1",
    broadcastId: "bc_1",
    authorName: "Dana Brooks",
    authorRole: "TESTER",
    message: "Updated — the save crash is gone for me. Daily logs feel snappy now.",
    sentAt: "",
  },
  {
    id: "br_2",
    broadcastId: "bc_1",
    authorName: "You",
    authorRole: "FOUNDER",
    message: "Great, thanks Dana! Let me know if the offline case still hangs.",
    sentAt: "",
  },
];

/** Per-app enrollments (founder-facing). Keyed by appId. */
const TESTER_POOL = [
  { name: "Sam Rivera", gmail: "sam.tc.work@gmail.com", badge: "VERIFIED" as const, rel: 0.86 },
  { name: "Dana Brooks", gmail: "dana.tc.qa@gmail.com", badge: "SENIOR" as const, rel: 0.94 },
  { name: "Marcus Hale", gmail: "marcus.h.test@gmail.com", badge: "SENIOR" as const, rel: 0.91 },
  { name: "Priya Nair", gmail: "priya.builds@gmail.com", badge: "VERIFIED" as const, rel: 0.78 },
  { name: "Leo Fischer", gmail: "leo.f.closedtest@gmail.com", badge: "EXPERT" as const, rel: 0.99 },
  { name: "Aisha Khan", gmail: "aisha.k.sites@gmail.com", badge: "VERIFIED" as const, rel: 0.82 },
  { name: "Tom Becker", gmail: "tom.becker.qa@gmail.com", badge: "VERIFIED" as const, rel: 0.88 },
  { name: "Mei Lin", gmail: "mei.lin.field@gmail.com", badge: "SENIOR" as const, rel: 0.93 },
  { name: "Carlos Diaz", gmail: "carlos.d.test@gmail.com", badge: "VERIFIED" as const, rel: 0.8 },
];

export const enrollments: Enrollment[] = [
  // SiteSync — INVITED, full cohort, mid-test (16 enrolled; first 9 named, rest filled in client)
  ...TESTER_POOL.map((t, i) => ({
    id: `enr_sitesync_${i}`,
    appId: "fapp_sitesync",
    testerName: t.name,
    gmail: t.gmail,
    badgeTier: t.badge,
    reliabilityScore: t.rel,
    enrolledAt: "",
    dailyDone: [9, 8, 9, 3, 9, 7, 6, 9, 5][i] ?? 7,
    status: (i === 2 ? "COMPLETED" : i === 6 ? "DROPPED" : "TESTING") as Enrollment["status"],
    feedbackSubmitted: i === 2,
    rated: i === 2,
  })),
  // LoadCalc Pro — ENROLLING, 9 enrolled / 16
  ...TESTER_POOL.map((t, i) => ({
    id: `enr_loadcalc_${i}`,
    appId: "fapp_loadcalc",
    testerName: t.name,
    gmail: t.gmail.replace("@", ".lc@"),
    badgeTier: t.badge,
    reliabilityScore: t.rel,
    enrolledAt: "",
    dailyDone: 0,
    status: "ENROLLED" as Enrollment["status"],
    feedbackSubmitted: false,
    rated: false,
  })),
];

export const founderTesters: FounderTesterRow[] = [
  { id: "ft_1", testerName: "Sam Rivera", appName: "SiteSync", vertical: "Construction", status: "ACTIVE", dayProgress: 9, reliabilityScore: 0.86, badgeTier: "VERIFIED", rated: false },
  { id: "ft_2", testerName: "Dana Brooks", appName: "SiteSync", vertical: "Construction", status: "ACTIVE", dayProgress: 6, reliabilityScore: 0.94, badgeTier: "SENIOR", rated: false },
  { id: "ft_3", testerName: "Marcus Hale", appName: "SiteSync", vertical: "Construction", status: "COMPLETED", dayProgress: 14, reliabilityScore: 0.91, badgeTier: "SENIOR", rated: true },
  { id: "ft_4", testerName: "Priya Nair", appName: "SiteSync", vertical: "Field services", status: "ACTIVE", dayProgress: 3, reliabilityScore: 0.78, badgeTier: "VERIFIED", rated: false },
  { id: "ft_5", testerName: "Leo Fischer", appName: "LoadCalc Pro", vertical: "Construction", status: "MATCHED", dayProgress: 0, reliabilityScore: 0.99, badgeTier: "EXPERT", rated: false },
  { id: "ft_6", testerName: "Aisha Khan", appName: "LoadCalc Pro", vertical: "Construction", status: "MATCHED", dayProgress: 0, reliabilityScore: 0.82, badgeTier: "VERIFIED", rated: false },
];

export const founderStats: FounderStats = {
  appsSubmitted: 3,
  activeCampaigns: 2,
  testersEngaged: 17,
  avgRating: 4.6,
  feedbackReceived: 7,
};

export const testerProfile: TesterProfile = {
  id: "tester_self",
  name: "Sam Rivera",
  email: "sam.rivera@example.com",
  vertical: "Construction",
  categories: ["Site management", "Field services", "Estimating"],
  verified: true,
  bio: "15 yrs site management. I test field tools the way crews actually use them.",
  reliabilityScore: 0.86,
  acceptedCycles: 7,
  completedCycles: 6,
  badgeTier: "VERIFIED",
  premiumUntil: undefined,
  credits: 0,
  stipendPending: 0,
  publicSlug: "sam-rivera",
};

/** Campaigns the tester is matched to but hasn't opted into yet (Browse tab). */
export const browseCampaigns: Campaign[] = [
  {
    id: "camp_sitesync",
    appName: "SiteSync",
    packageName: "com.sitesync.app",
    vertical: "Construction",
    feedbackFocus: "Daily logs & crew check-in flow",
    description:
      "Field logging app for construction crews. We want testers who run daily site logs.",
    testersNeeded: 12,
    testersMatched: 9,
    rewardType: "PREMIUM_ACCESS",
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.sitesync.app",
  },
  {
    id: "camp_punchlist",
    appName: "PunchList Pro",
    packageName: "com.punchlistpro.app",
    vertical: "Construction",
    feedbackFocus: "Defect capture with photos",
    description: "Snag/punch-list tracking. Looking for QA-minded site managers.",
    testersNeeded: 12,
    testersMatched: 4,
    rewardType: "PREMIUM_ACCESS",
  },
  {
    id: "camp_estimate",
    appName: "QuickEstimate",
    packageName: "com.quickestimate.app",
    vertical: "Construction",
    feedbackFocus: "Estimate builder speed & accuracy",
    description: "On-site estimating tool. Estimators wanted.",
    testersNeeded: 12,
    testersMatched: 11,
    rewardType: "CREDITS",
  },
  {
    id: "camp_fleettrack",
    appName: "FleetTrack",
    packageName: "com.fleettrack.app",
    vertical: "Field services",
    feedbackFocus: "Live equipment & vehicle tracking",
    description:
      "GPS tracking for plant, vehicles and tools across multiple sites. Looking for fleet-heavy crews.",
    testersNeeded: 12,
    testersMatched: 6,
    rewardType: "PREMIUM_ACCESS",
  },
  {
    id: "camp_safetyfirst",
    appName: "SafetyFirst",
    packageName: "com.safetyfirst.app",
    vertical: "Construction",
    feedbackFocus: "Daily safety checklists & toolbox talks",
    description:
      "Digital site inductions, permits and toolbox talks. Site safety officers wanted.",
    testersNeeded: 12,
    testersMatched: 3,
    rewardType: "STIPEND",
  },
  {
    id: "camp_probid",
    appName: "ProBid",
    packageName: "com.probid.app",
    vertical: "Construction",
    feedbackFocus: "Tender & bid management flow",
    description:
      "Track tenders, compare subcontractor quotes and win more work. Estimators & QSs welcome.",
    testersNeeded: 12,
    testersMatched: 8,
    rewardType: "CREDITS",
  },
  {
    id: "camp_crewclock",
    appName: "CrewClock",
    packageName: "com.crewclock.app",
    vertical: "Field services",
    feedbackFocus: "Geofenced crew time tracking",
    description:
      "Clock crews in/out automatically with site geofences and approve timesheets in seconds.",
    testersNeeded: 12,
    testersMatched: 10,
    rewardType: "PREMIUM_ACCESS",
  },
  {
    id: "camp_materialflow",
    appName: "MaterialFlow",
    packageName: "com.materialflow.app",
    vertical: "Construction",
    feedbackFocus: "Materials ordering & delivery tracking",
    description:
      "Request, approve and track material deliveries to site. Procurement-minded testers needed.",
    testersNeeded: 12,
    testersMatched: 5,
    rewardType: "PREMIUM_ACCESS",
  },
];

const campaignById = (id: string) =>
  browseCampaigns.find((c) => c.id === id)!;

/**
 * The tester's existing cycles (My Cycles tab). One ACTIVE mid-cycle, one freshly
 * MATCHED (not opted in), one COMPLETED to show the "passed" state and badges.
 * Dates are intentionally relative-looking ISO strings; the mock client recomputes
 * the ACTIVE one's clock from "now" on first load so the countdown is live.
 */
export const initialCycles: Cycle[] = [
  {
    id: "cycle_active",
    campaign: campaignById("camp_sitesync"),
    status: "ACTIVE",
    gmailForCampaign: "sam.tc.sitesync@gmail.com",
    dailyCheckIns: [],
    // optInAt / completesAt filled in by the mock client at load (now - 4d, +14d).
    checkIns: [
      { id: "ci_a3", dayNumber: 3, scheduledFor: "", status: "RESPONDED", response: "Working well", respondedAt: "" },
      { id: "ci_a7", dayNumber: 7, scheduledFor: "", status: "SENT" },
      { id: "ci_a10", dayNumber: 10, scheduledFor: "", status: "PENDING" },
      { id: "ci_a14", dayNumber: 14, scheduledFor: "", status: "PENDING" },
    ],
    proof: {
      id: "proof_a",
      screenshotUrl: "https://placehold.co/400x800/ECEBFD/4A3AE3?text=Day-0+proof",
      verified: true,
      uploadedAt: "",
    },
  },
  {
    id: "cycle_matched",
    campaign: campaignById("camp_punchlist"),
    status: "MATCHED",
    gmailForCampaign: "sam.tc.punchlist@gmail.com",
    dailyCheckIns: [],
    checkIns: [],
  },
  {
    id: "cycle_done",
    campaign: campaignById("camp_estimate"),
    status: "COMPLETED",
    gmailForCampaign: "sam.tc.estimate@gmail.com",
    dailyCheckIns: [],
    founderRating: 5,
    checkIns: [
      { id: "ci_d3", dayNumber: 3, scheduledFor: "", status: "RESPONDED", response: "Smooth" },
      { id: "ci_d7", dayNumber: 7, scheduledFor: "", status: "RESPONDED", response: "Fast" },
      { id: "ci_d10", dayNumber: 10, scheduledFor: "", status: "RESPONDED", response: "Good" },
      { id: "ci_d14", dayNumber: 14, scheduledFor: "", status: "RESPONDED", response: "Shipped feedback" },
    ],
    feedback: {
      answers: {
        first_impression: "Clean, fast to start a quote",
        ease_of_use: 4,
        crashes: false,
        fit_for_vertical: 5,
        biggest_gap: "Offline mode for poor-signal sites",
        would_recommend: true,
      },
      submittedAt: "",
    },
  },
];
